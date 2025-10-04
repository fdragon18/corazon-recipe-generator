import { type ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// DIFY API設定（環境変数から取得）
const DIFY_CONFIG = {
  endpoint: process.env.DIFY_ENDPOINT || "https://api.dify.ai/v1",
  apiKey: process.env.DIFY_API_KEY || ""
};

// App Proxy用レシピ生成API（App Proxy形式）
export async function action({ request }: ActionFunctionArgs) {
  // POSTリクエストのみ許可
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // 🔒 リクエスト情報取得
    // App Proxy経由: ShopifyがHMAC検証済み + shopパラメータ自動追加
    // 直接アクセス: FormDataからshop情報を取得
    const url = new URL(request.url);
    const shopFromQuery = url.searchParams.get('shop');

    console.log(`📥 レシピ生成リクエスト受信`);
    console.log(`🔗 Full URL: ${request.url}`);
    console.log(`🏪 Shop (query): ${shopFromQuery || 'なし'}`);

    // フォームデータを取得
    const formData = await request.formData();
    const shopFromForm = formData.get("shop")?.toString();

    const shopDomain = shopFromQuery || shopFromForm || 'corazon-muro-recipe-dev.myshopify.com';
    console.log(`✅ 使用するShop: ${shopDomain}`);
    const condition = formData.get("condition")?.toString().trim() || "";
    const needs = formData.get("needs")?.toString().trim() || "";
    const kojiType = formData.get("kojiType")?.toString() || "";
    const otherIngredients = formData.get("otherIngredients")?.toString().trim() || "";

    // 👤 ログイン中の顧客IDを取得
    // 方法1: FormDataから取得（Liquid変数経由 - 推奨、New Customer Accounts対応）
    // 方法2: App ProxyのQuery Parameter（フォールバック）
    let customerId = formData.get("customerId")?.toString() || null;

    // FormDataになければQuery Parameterから取得を試みる
    if (!customerId) {
      const url = new URL(request.url);
      customerId = url.searchParams.get("logged_in_customer_id");
    }

    console.log(`👤 Customer ID: ${customerId || 'ゲストユーザー'}`);

    // バリデーション
    if (!condition) {
      return json({
        error: "入力エラー",
        message: "現在の体調やお悩みを入力してください。"
      }, { status: 400 });
    }

    // DIFY APIキーの確認
    if (!DIFY_CONFIG.apiKey || DIFY_CONFIG.apiKey === "") {
      console.error("❌ DIFY APIキーが設定されていません");
      return json({
        error: "API設定エラー",
        message: "予期せぬエラーが発生しました。ヘルプデスクにお問い合わせください。（エラーコード: CONFIG_001）"
      }, { status: 500 });
    }

    // 📤 DIFY APIリクエストパラメータ
    const difyRequestBody = {
      inputs: {
        condition: condition,
        needs: needs || "",
        kojiType: kojiType || "",
        otherIngredients: otherIngredients || ""
      },
      response_mode: "blocking",
      user: customerId || `guest_${Date.now()}`
    };

    console.log("📤 DIFY APIリクエスト詳細:");
    console.log("  - Endpoint:", `${DIFY_CONFIG.endpoint}/workflows/run`);
    console.log("  - API Key exists:", !!DIFY_CONFIG.apiKey);
    console.log("  - Request Body:", JSON.stringify(difyRequestBody, null, 2));

    // DIFY APIに送信
    const response = await fetch(`${DIFY_CONFIG.endpoint}/workflows/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`
      },
      body: JSON.stringify(difyRequestBody)
    });

    // レスポンスのテキストを先に取得（JSONパースエラー回避）
    const responseText = await response.text();
    console.log("📥 DIFY APIレスポンス（Raw）:", responseText.substring(0, 500));

    // APIレスポンスのチェック
    if (!response.ok) {
      console.error(`❌ DIFY APIエラー: ${response.status} - ${response.statusText}`);
      console.error("エラー詳細:", responseText);

      return json({
        error: "API呼び出しエラー",
        message: `予期せぬエラーが発生しました。ヘルプデスクにお問い合わせください。（エラーコード: API_${response.status}）`
      }, { status: 500 });
    }

    // レスポンスが空でないか確認
    if (!responseText || responseText.trim() === '') {
      console.error("❌ 空のレスポンスを受信");
      return json({
        error: "APIレスポンスエラー",
        message: "予期せぬエラーが発生しました。ヘルプデスクにお問い合わせください。（エラーコード: EMPTY_RESPONSE）"
      }, { status: 500 });
    }

    // レスポンスの解析
    let data;
    try {
      data = JSON.parse(responseText);
      console.log("✅ DIFY APIレスポンス受信完了");
      console.log("📊 レスポンスデータ構造:", JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error("❌ JSON parseエラー:", parseError);
      console.error("パース失敗したレスポンス:", responseText.substring(0, 500));
      return json({
        error: "レスポンス解析エラー",
        message: "予期せぬエラーが発生しました。ヘルプデスクにお問い合わせください。（エラーコード: PARSE_ERROR）"
      }, { status: 500 });
    }

    // DIFY レスポンス形式: { data: { outputs: { recipes: [...] } } }
    if (!data.data || !data.data.outputs || !data.data.outputs.recipes) {
      console.error("❌ 無効なDIFY APIレスポンス形式:", data);
      return json({
        error: "APIレスポンスエラー",
        message: "予期せぬエラーが発生しました。ヘルプデスクにお問い合わせください。（エラーコード: INVALID_FORMAT）"
      }, { status: 500 });
    }

    const recipesData = data.data.outputs.recipes;
    console.log("📝 DIFY Recipes Output (raw):", recipesData);
    console.log("📝 Type:", typeof recipesData, "| isArray:", Array.isArray(recipesData));

    // recipesDataが既に配列の場合はそのまま使用、文字列の場合はパース
    let recipes;
    if (Array.isArray(recipesData)) {
      // 既に配列形式
      recipes = recipesData;
      console.log("✅ レシピは配列形式で受信");
    } else if (typeof recipesData === 'string') {
      // JSON文字列の場合はパース
      try {
        const parsed = JSON.parse(recipesData);
        recipes = parsed.recipes || parsed;
        console.log("✅ レシピJSON文字列をパース");
      } catch (parseError) {
        console.error("❌ レシピJSON parseエラー:", parseError);
        return json({
          error: "レスポンス解析エラー",
          message: "予期せぬエラーが発生しました。ヘルプデスクにお問い合わせください。（エラーコード: RECIPE_PARSE_ERROR）"
        }, { status: 500 });
      }
    } else {
      console.error("❌ 予期しないレシピデータ形式:", typeof recipesData);
      return json({
        error: "レスポンス形式エラー",
        message: "予期せぬエラーが発生しました。ヘルプデスクにお問い合わせください。（エラーコード: UNEXPECTED_FORMAT）"
      }, { status: 500 });
    }

    if (!Array.isArray(recipes) || recipes.length === 0) {
      console.error("❌ レシピ配列が空または無効です:", recipes);
      return json({
        error: "レシピ生成エラー",
        message: "予期せぬエラーが発生しました。ヘルプデスクにお問い合わせください。（エラーコード: NO_RECIPES）"
      }, { status: 500 });
    }

    console.log(`✅ ${recipes.length}件のレシピを取得しました`);

    // 💾 Supabaseにレシピ保存
    try {
      const recipeRequest = await prisma.recipeRequest.create({
        data: {
          shop: shopDomain,
          customerId: customerId || null,
          condition: condition,
          needs: needs || null,
          kojiType: kojiType || null,
          otherIngredients: otherIngredients || null,
          recipes: {
            create: recipes.map((recipe: any) => {
              console.log(`📊 レシピ「${recipe.name}」のデータ型:`, {
                ingredients: typeof recipe.ingredients,
                steps: typeof recipe.steps,
                ingredientsIsArray: Array.isArray(recipe.ingredients),
                stepsIsArray: Array.isArray(recipe.steps)
              });

              return {
                name: recipe.name,
                ingredients: recipe.ingredients, // Json型（そのまま保存）
                steps: recipe.steps,             // Json型（そのまま保存）
                benefit: recipe.benefit
              };
            })
          }
        },
        include: {
          recipes: true
        }
      });

      console.log(`✅ Supabaseに保存成功: RequestID=${recipeRequest.id}, CustomerID=${customerId || 'ゲスト'}`);
    } catch (dbError) {
      console.error('❌ Supabase保存エラー:', dbError);
      console.error('❌ エラー詳細:', JSON.stringify(dbError, null, 2));
      // DB保存失敗してもレシピは返す（ユーザー体験優先）
    }

    // 成功レスポンス
    console.log(`レシピ生成成功: ${recipes.length}件のレシピを取得`);
    return json({
      success: true,
      recipes: recipes,
      timestamp: new Date().toISOString(),
      shop: shopDomain
    });

  } catch (error) {
    // 全般的なエラーハンドリング
    console.error('❌ レシピ生成API全般エラー:', error);

    // エラーの詳細を取得
    let errorDetail = 'Unknown error';
    let errorCode = 'UNKNOWN_ERROR';

    if (error instanceof Error) {
      errorDetail = `${error.name}: ${error.message}`;
      console.error('エラースタック:', error.stack);

      // エラータイプ別のコード割り当て
      if (error.message.includes('fetch')) {
        errorCode = 'NETWORK_ERROR';
      } else if (error.message.includes('JSON')) {
        errorCode = 'JSON_PARSE_ERROR';
      } else if (error.message.includes('database') || error.message.includes('Prisma')) {
        errorCode = 'DATABASE_ERROR';
      }
    } else if (typeof error === 'string') {
      errorDetail = error;
    } else {
      errorDetail = JSON.stringify(error);
    }

    console.error('📋 エラー詳細:', {
      code: errorCode,
      detail: errorDetail,
      timestamp: new Date().toISOString()
    });

    return json({
      error: "システムエラー",
      message: `予期せぬエラーが発生しました。ヘルプデスクにお問い合わせください。（エラーコード: ${errorCode}）`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GETリクエストは405エラーを返す
export async function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}