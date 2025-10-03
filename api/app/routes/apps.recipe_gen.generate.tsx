import { type ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// // DIFY API設定（環境変数から取得）
// const DIFY_CONFIG = {
//   endpoint: process.env.DIFY_ENDPOINT || "https://api.dify.ai/v1",
//   apiKey: process.env.DIFY_API_KEY || ""
// };

// Azure OpenAI API設定（環境変数から取得）
const AZURE_CONFIG = {
  endpoint: process.env.AZURE_OPENAI_ENDPOINT || "",
  apiKey: process.env.AZURE_OPENAI_API_KEY || "",
  deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
  apiVersion: "2024-08-01-preview",
  get fullEndpoint() {
    return `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.apiVersion}`;
  }
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

    // Azure OpenAI APIキーの確認
    if (!AZURE_CONFIG.apiKey || AZURE_CONFIG.apiKey === "") {
      console.error("Azure OpenAI APIキーが設定されていません");
      return json({
        error: "API設定エラー",
        message: "サーバー設定に問題があります。管理者にお問い合わせください。"
      }, { status: 500 });
    }

    // プロンプト作成
    const systemPrompt = `あなたはメキシコ食材専門店「corazon-muro」の料理アドバイザーです。
お客様の体調やお悩みに合わせて、健康的で美味しいレシピを3つ提案してください。

レスポンスは必ず以下のJSON形式で返してください：
{
  "recipes": [
    {
      "name": "レシピ名",
      "ingredients": ["材料1", "材料2", ...],
      "steps": ["手順1", "手順2", ...],
      "benefit": "このレシピの健康効果の説明"
    }
  ]
}`;

    const userMessage = `
【お客様の情報】
- 体調・お悩み: ${condition}
${needs ? `- 具体的なニーズ: ${needs}` : ""}
${kojiType ? `- 麹の種類: ${kojiType}` : ""}
${otherIngredients ? `- その他の材料: ${otherIngredients}` : ""}

この情報を基に、3つのレシピを提案してください。`;

    // Azure OpenAI APIに送信
    console.log("Azure OpenAI API呼び出し開始");
    console.log("Endpoint:", AZURE_CONFIG.fullEndpoint);
    console.log("API Key exists:", !!AZURE_CONFIG.apiKey);

    const response = await fetch(AZURE_CONFIG.fullEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_CONFIG.apiKey
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    // APIレスポンスのチェック
    if (!response.ok) {
      console.error(`Azure OpenAI APIエラー: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error("エラー詳細:", errorText);

      return json({
        error: "API呼び出しエラー",
        message: `APIサーバーでエラーが発生しました（Status: ${response.status}）`
      }, { status: 500 });
    }

    // レスポンスの解析
    const data = await response.json();
    console.log("Azure OpenAI APIレスポンス受信完了");
    console.log("レスポンスデータ:", JSON.stringify(data, null, 2));

    // Azure OpenAI レスポンス形式: { choices: [{ message: { content: "..." } }] }
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("無効なAPIレスポンス形式:", data);
      return json({
        error: "APIレスポンスエラー",
        message: "APIから無効なレスポンスが返されました"
      }, { status: 500 });
    }

    const content = data.choices[0].message.content;
    console.log("Azure OpenAI Content:", content);

    // JSONをパース
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parseエラー:", parseError);
      return json({
        error: "レスポンス解析エラー",
        message: "APIからのレスポンスを解析できませんでした"
      }, { status: 500 });
    }

    const recipes = parsedContent.recipes || [];

    if (recipes.length === 0) {
      console.error("レシピ配列が空です:", parsedContent);
      return json({
        error: "レシピ生成エラー",
        message: "有効なレシピが生成されませんでした"
      }, { status: 500 });
    }

    console.log(`${recipes.length}件のレシピを取得しました`);

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