import { type ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getCustomerInfo } from "../utils/shopify-customer.server";
import type { Recipe } from "../types/recipe";
import { calculateNutrition, calculateSaltReduction } from "../services/nutrition-jp.server";
import { getNutritionStandard, calculatePFCRecommendations, parseSexToCode } from "../lib/nutrition-standards";

// DIFY API設定（環境変数から取得）
const DIFY_CONFIG = {
  endpoint: process.env.DIFY_ENDPOINT || "https://api.dify.ai/v1",
  apiKey: process.env.DIFY_API_KEY || ""
};

// App Proxy用レシピ生成API（App Proxy形式）
export async function action({ request }: ActionFunctionArgs) {
  // ⏱️ 全体の実行時間計測開始
  const startTime = performance.now();
  const timings: Record<string, number> = {};

  // POSTリクエストのみ許可
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // 🔒 リクエスト情報取得
    // App Proxy経由: ShopifyがHMAC検証済み + shopパラメータ自動追加
    // 直接アクセス: FormDataからshop情報を取得
    const stepStart = performance.now();
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

    // 🆕 サイト種別の判定（JAMサイト vs 通常サイト）
    // 方法1: FormDataから取得（フォームに hidden field がある場合）
    let siteType = formData.get("siteType")?.toString() || "";

    // 方法2: Refererヘッダーでドメイン判定（フォールバック）
    if (!siteType) {
      const referer = request.headers.get('referer') || '';
      const isJamSite = referer.includes('jam.corazon-muro.com') ||
                        referer.includes('jam-dev.corazon-muro.com') ||
                        shopDomain.includes('jam');
      siteType = isJamSite ? 'jam' : 'normal';
    }

    console.log(`🏪 サイト種別: ${siteType} (JAMサイト: ${siteType === 'jam' ? 'はい' : 'いいえ'})`);

    timings['1_request_parsing'] = performance.now() - stepStart;

    // 👤 ログイン中の顧客IDを取得
    // 方法1: FormDataから取得（Liquid変数経由 - 推奨、New Customer Accounts対応）
    // 方法2: App ProxyのQuery Parameter（フォールバック）
    const customerStart = performance.now();
    let customerId = formData.get("customerId")?.toString() || null;

    // FormDataになければQuery Parameterから取得を試みる
    if (!customerId) {
      const url = new URL(request.url);
      customerId = url.searchParams.get("logged_in_customer_id");
    }

    console.log(`👤 Customer ID: ${customerId || 'ゲストユーザー'}`);

    // 👤 顧客情報取得（Metafield含む）
    let customerSex = "";
    let customerAge = "";
    let customerName = "ゲストユーザー";

    if (customerId) {
      try {
        const { admin } = await authenticate.public.appProxy(request);
        const customerData = await getCustomerInfo(admin, customerId);

        if (customerData) {
          customerSex = customerData.sex || "";
          customerAge = customerData.age ? String(customerData.age) : "";
          customerName = `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim() || 'Unknown';

          console.log('========================================');
          console.log('👤 顧客情報取得成功');
          console.log('========================================');
          console.log(`📧 Email: ${customerData.email || 'なし'}`);
          console.log(`👤 氏名: ${customerName}`);
          console.log(`🚻 性別: ${customerSex || '未設定'}`);
          console.log(`🎂 年齢: ${customerAge || '未設定'}${customerAge ? '歳' : ''}`);
          console.log('========================================');
        }
      } catch (authError) {
        console.warn('⚠️ 顧客情報取得をスキップ（認証エラー）:', authError);
        // 認証エラーでもレシピ生成は続行
      }
    } else {
      console.log('========================================');
      console.log('👤 顧客情報: ゲストユーザー（未ログイン）');
      console.log('========================================');
    }
    timings['2_customer_info'] = performance.now() - customerStart;

    // 📊 栄養基準データ取得（厚生労働省「食事摂取基準（2025年版）」）
    const nutritionStandardStart = performance.now();
    const sexCode = parseSexToCode(customerSex);
    const ageNum = customerAge ? parseInt(customerAge) : null;
    const nutritionStandard = await getNutritionStandard(sexCode, ageNum);
    timings['2.5_nutrition_standard'] = performance.now() - nutritionStandardStart;

    console.log('========================================');
    console.log('📊 栄養基準データ取得');
    console.log('========================================');
    console.log(`🎯 対象: ${nutritionStandard.sex === 'male' ? '男性' : '女性'} ${nutritionStandard.ageRange}`);
    console.log(`🥩 タンパク質推奨: ${nutritionStandard.proteinRecommended}g/日 (${nutritionStandard.proteinTargetMin}-${nutritionStandard.proteinTargetMax}%E)`);
    console.log(`🥑 脂質目標: ${nutritionStandard.fatTargetMin}-${nutritionStandard.fatTargetMax}%E`);
    console.log(`🍚 炭水化物目標: ${nutritionStandard.carbohydrateMin}-${nutritionStandard.carbohydrateMax}%E`);
    console.log(`📝 注釈: ${nutritionStandard.note || 'なし'}`);
    console.log(`⚙️  デフォルト値使用: ${nutritionStandard.isDefault ? 'はい' : 'いいえ'}`);
    console.log('========================================');

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
        otherIngredients: otherIngredients || "",
        customerSex: customerSex,  // 性別
        customerAge: customerAge,   // 年齢
        siteType: siteType          // 🆕 サイト種別（'jam' or 'normal'）
      },
      response_mode: "blocking",
      user: customerId || `guest_${Date.now()}`
    };

    console.log("📤 DIFY APIリクエスト詳細:");
    console.log("  - Endpoint:", `${DIFY_CONFIG.endpoint}/workflows/run`);
    console.log("  - API Key exists:", !!DIFY_CONFIG.apiKey);
    console.log("  - Request Body:", JSON.stringify(difyRequestBody, null, 2));

    // DIFY APIに送信
    const difyStart = performance.now();
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
      timings['3_dify_api'] = performance.now() - difyStart;
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

    // 📊 日本食品成分表で栄養価を正確に計算（並列処理でログにレシピコンテキスト表示）
    console.log('📊 栄養価計算を開始...');
    const nutritionStart = performance.now();
    const recipesWithNutrition = await Promise.all(
      recipes.map(async (recipe: Recipe, index: number) => {
        const recipeContext = `レシピ ${index + 1}/${recipes.length}: ${recipe.name}`;
        console.log(`\n🍳 ${recipeContext}`);

        const nutrition = await calculateNutrition(recipe.ingredients, recipeContext);
        const comparison = calculateSaltReduction(recipe.ingredients);

        // 🆕 このレシピのカロリーに基づいてPFC推奨値を計算
        const pfcRecommendations = calculatePFCRecommendations(
          nutritionStandard,
          nutrition.calories || 0
        );

        console.log(`✅ [${recipeContext}] 栄養価計算完了:`, {
          calories: nutrition.calories,
          sodium: nutrition.sodium,
          reduction: comparison.sodiumReduction,
          pfcRecommendations: {
            protein: `${pfcRecommendations.protein.targetMin}-${pfcRecommendations.protein.targetMax}g`,
            fat: `${pfcRecommendations.fat.targetMin}-${pfcRecommendations.fat.targetMax}g`,
            carbs: `${pfcRecommendations.carbohydrate.targetMin}-${pfcRecommendations.carbohydrate.targetMax}g`,
          }
        });

        return {
          ...recipe,
          nutrition,
          comparison,
          pfcRecommendations // 🆕 PFC推奨値を追加
        };
      })
    );
    timings['4_nutrition_calculation'] = performance.now() - nutritionStart;

    // 💾 Supabaseにレシピ保存
    const dbStart = performance.now();
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
            create: recipesWithNutrition.map((recipe: Recipe) => {
              console.log(`📊 レシピ「${recipe.name}」のデータ型:`, {
                ingredients: typeof recipe.ingredients,
                steps: typeof recipe.steps,
                ingredientsIsArray: Array.isArray(recipe.ingredients),
                stepsIsArray: Array.isArray(recipe.steps),
                hasNutrition: !!recipe.nutrition,
                hasComparison: !!recipe.comparison
              });

              return {
                name: recipe.name,
                ingredients: recipe.ingredients as any,       // Json型（そのまま保存）
                steps: recipe.steps as any,                   // Json型（そのまま保存）
                benefit: recipe.benefit,
                nutrition: (recipe.nutrition || null) as any,   // 🆕 栄養価情報
                comparison: (recipe.comparison || null) as any  // 🆕 減塩効果比較
              };
            })
          }
        },
        include: {
          recipes: {
            select: {
              id: true,
              name: true,
              ingredients: true,
              steps: true,
              benefit: true,
              nutrition: true,
              comparison: true,
              likeCount: true,
              favoriteCount: true,
              createdAt: true
            }
          }
        }
      });

      console.log(`✅ Supabaseに保存成功: RequestID=${recipeRequest.id}, CustomerID=${customerId || 'ゲスト'}`);
      timings['5_database_save'] = performance.now() - dbStart;

      // 🔍 保存されたレシピのいいね・お気に入り状態を取得
      const recipesWithInteractions = await Promise.all(
        recipeRequest.recipes.map(async (savedRecipe) => {
          // このレシピに対する現在のユーザーのいいね・お気に入り状態を取得
          let isLiked = false;
          let isFavorited = false;

          if (customerId) {
            const like = await prisma.recipeLike.findUnique({
              where: {
                recipeId_customerId: {
                  recipeId: savedRecipe.id,
                  customerId: customerId
                }
              }
            });
            isLiked = !!like;

            const favorite = await prisma.recipeFavorite.findUnique({
              where: {
                recipeId_customerId: {
                  recipeId: savedRecipe.id,
                  customerId: customerId
                }
              }
            });
            isFavorited = !!favorite;
          }

          return {
            id: savedRecipe.id,
            name: savedRecipe.name,
            ingredients: savedRecipe.ingredients,
            steps: savedRecipe.steps,
            benefit: savedRecipe.benefit,
            nutrition: savedRecipe.nutrition,
            comparison: savedRecipe.comparison,
            likeCount: savedRecipe.likeCount,
            favoriteCount: savedRecipe.favoriteCount,
            isLiked,
            isFavorited
          };
        })
      );

      timings['6_interaction_check'] = performance.now() - dbStart - timings['5_database_save'];

      // ⏱️ 実行時間サマリー
      const totalTime = performance.now() - startTime;
      console.log('\n⏱️  実行時間サマリー');
      console.log('========================================');
      console.log(`📋 リクエスト解析:      ${timings['1_request_parsing']?.toFixed(2)}ms`);
      console.log(`👤 顧客情報取得:        ${timings['2_customer_info']?.toFixed(2)}ms`);
      console.log(`🤖 DIFY API呼び出し:    ${timings['3_dify_api']?.toFixed(2)}ms`);
      console.log(`📊 栄養価計算:          ${timings['4_nutrition_calculation']?.toFixed(2)}ms`);
      console.log(`💾 データベース保存:    ${timings['5_database_save']?.toFixed(2)}ms`);
      console.log(`⏱️  合計実行時間:       ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}秒)`);
      console.log('========================================\n');

      // 成功レスポンス
      console.log(`レシピ生成成功: ${recipesWithInteractions.length}件のレシピを取得（栄養価計算済み、インタラクション状態含む）`);
      return json({
        success: true,
        recipes: recipesWithInteractions,
        customer: {
          age: customerAge ? parseInt(customerAge) : null,
          sex: customerSex || null
        },
        nutritionStandard: {
          ageRange: nutritionStandard.ageRange,
          sex: nutritionStandard.sex,
          energyModerate: nutritionStandard.energyModerate,
          proteinRecommended: nutritionStandard.proteinRecommended,
          proteinTargetMin: nutritionStandard.proteinTargetMin,
          proteinTargetMax: nutritionStandard.proteinTargetMax,
          fatTargetMin: nutritionStandard.fatTargetMin,
          fatTargetMax: nutritionStandard.fatTargetMax,
          carbohydrateMin: nutritionStandard.carbohydrateMin,
          carbohydrateMax: nutritionStandard.carbohydrateMax,
          fiberTarget: nutritionStandard.fiberTarget,
          sodiumTarget: nutritionStandard.sodiumTarget,
          isDefault: nutritionStandard.isDefault,
          note: nutritionStandard.note
        },
        timings: {
          ...timings,
          total: parseFloat(totalTime.toFixed(2))
        },
        timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        shop: shopDomain
      });

    } catch (dbError) {
      console.error('❌ Supabase保存エラー:', dbError);
      console.error('❌ エラー詳細:', JSON.stringify(dbError, null, 2));
      timings['5_database_save'] = performance.now() - dbStart;

      // DB保存失敗時は栄養価データのみ返す（インタラクション情報なし）
      const totalTime = performance.now() - startTime;
      return json({
        success: true,
        recipes: recipesWithNutrition.map((recipe: any) => ({
          ...recipe,
          id: null, // DB保存失敗のため IDなし
          likeCount: 0,
          favoriteCount: 0,
          isLiked: false,
          isFavorited: false
        })),
        customer: {
          age: customerAge ? parseInt(customerAge) : null,
          sex: customerSex || null
        },
        nutritionStandard: {
          ageRange: nutritionStandard.ageRange,
          sex: nutritionStandard.sex,
          energyModerate: nutritionStandard.energyModerate,
          proteinRecommended: nutritionStandard.proteinRecommended,
          proteinTargetMin: nutritionStandard.proteinTargetMin,
          proteinTargetMax: nutritionStandard.proteinTargetMax,
          fatTargetMin: nutritionStandard.fatTargetMin,
          fatTargetMax: nutritionStandard.fatTargetMax,
          carbohydrateMin: nutritionStandard.carbohydrateMin,
          carbohydrateMax: nutritionStandard.carbohydrateMax,
          fiberTarget: nutritionStandard.fiberTarget,
          sodiumTarget: nutritionStandard.sodiumTarget,
          isDefault: nutritionStandard.isDefault,
          note: nutritionStandard.note
        },
        timings: {
          ...timings,
          total: parseFloat(totalTime.toFixed(2))
        },
        timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        shop: shopDomain,
        warning: 'レシピは生成されましたが、保存に失敗しました'
      });
    }

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
      timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    });

    return json({
      error: "システムエラー",
      message: `予期せぬエラーが発生しました。ヘルプデスクにお問い合わせください。（エラーコード: ${errorCode}）`,
      timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    }, { status: 500 });
  }
}

// GETリクエストは405エラーを返す
export async function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}