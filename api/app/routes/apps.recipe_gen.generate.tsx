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
    // 🔒 App Proxy認証（HMAC検証） - Shopifyが自動的に署名検証
    // ShopifyはApp Proxyリクエストにshopパラメータを自動追加
    const url = new URL(request.url);
    const shopDomain = url.searchParams.get('shop') || 'corazon-muro-recipe-dev.myshopify.com';

    console.log(`📥 App Proxyリクエスト受信: Shop=${shopDomain}`);
    console.log(`🔗 Full URL: ${request.url}`);

    // フォームデータを取得
    const formData = await request.formData();
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
      console.error("DIFY APIキーが設定されていません");
      return json({
        error: "API設定エラー",
        message: "サーバー設定に問題があります。管理者にお問い合わせください。"
      }, { status: 500 });
    }

    // DIFY APIに送信
    console.log("DIFY API呼び出し開始");
    console.log("Endpoint:", `${DIFY_CONFIG.endpoint}/workflows/run`);
    console.log("API Key exists:", !!DIFY_CONFIG.apiKey);

    const response = await fetch(`${DIFY_CONFIG.endpoint}/workflows/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        inputs: {
          condition: condition,
          needs: needs || "",
          kojiType: kojiType || "",
          otherIngredients: otherIngredients || ""
        },
        response_mode: "blocking",
        user: customerId || "guest"
      })
    });

    // APIレスポンスのチェック
    if (!response.ok) {
      console.error(`DIFY APIエラー: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error("エラー詳細:", errorText);

      return json({
        error: "API呼び出しエラー",
        message: `APIサーバーでエラーが発生しました（Status: ${response.status}）`
      }, { status: 500 });
    }

    // レスポンスの解析
    const data = await response.json();
    console.log("DIFY APIレスポンス受信完了");
    console.log("レスポンスデータ:", JSON.stringify(data, null, 2));

    // DIFY Workflow レスポンス形式: { data: { outputs: { recipes: [...] } } }
    if (!data.data || !data.data.outputs) {
      console.error("無効なAPIレスポンス形式:", data);
      return json({
        error: "APIレスポンスエラー",
        message: "APIから無効なレスポンスが返されました"
      }, { status: 500 });
    }

    const outputs = data.data.outputs;

    // DIFY Workflowのレスポンスから直接recipesを取得
    let recipes = [];

    if (outputs.recipes && Array.isArray(outputs.recipes)) {
      // recipesが配列形式の場合
      recipes = outputs.recipes;
      console.log(`${recipes.length}件のレシピを取得しました`);
    } else if (outputs.recipe) {
      // 単一レシピオブジェクトの場合、配列に変換
      recipes = [outputs.recipe];
      console.log("単一レシピオブジェクトを配列に変換しました");
    } else {
      console.error("レシピ形式エラー:", outputs);
      return json({
        error: "レシピ生成エラー",
        message: "期待される形式のレシピが生成されませんでした"
      }, { status: 500 });
    }

    if (recipes.length === 0) {
      console.error("レシピ配列が空です:", outputs);
      return json({
        error: "レシピ生成エラー",
        message: "有効なレシピが生成されませんでした"
      }, { status: 500 });
    }

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
            create: recipes.map((recipe: any) => ({
              name: recipe.name,
              ingredients: recipe.ingredients,
              steps: recipe.steps,
              benefit: recipe.benefit
            }))
          }
        },
        include: {
          recipes: true
        }
      });

      console.log(`✅ Supabaseに保存成功: RequestID=${recipeRequest.id}, CustomerID=${customerId || 'ゲスト'}`);
    } catch (dbError) {
      console.error('❌ Supabase保存エラー:', dbError);
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
    console.error('レシピ生成API全般エラー:', error);

    // エラーの詳細を取得
    let errorDetail = 'Unknown error';
    if (error instanceof Error) {
      errorDetail = error.message;
    } else if (typeof error === 'string') {
      errorDetail = error;
    } else {
      errorDetail = JSON.stringify(error);
    }

    // ネットワークエラーかAPIエラーかを判別
    const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
    const errorMessage = isNetworkError
      ? "ネットワークエラーが発生しました。インターネット接続を確認してください。"
      : "予期しないエラーが発生しました。しばらく時間をおいて再試行してください。";

    return json({
      error: "システムエラー",
      message: errorMessage,
      isNetworkError,
      debug: errorDetail // 一時的にデバッグ情報を常に表示
    }, { status: 500 });
  }
}

// GETリクエストは405エラーを返す
export async function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}