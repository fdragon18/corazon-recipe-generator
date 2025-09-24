import { type ActionFunctionArgs, json } from "@remix-run/node";

// Azure OpenAI API設定（環境変数から取得）
const AZURE_CONFIG = {
  fullEndpoint: process.env.AZURE_OPENAI_ENDPOINT || "https://your-azure-openai-endpoint.com/openai/deployments/gpt-4/chat/completions?api-version=2024-10-21",
  apiKey: process.env.AZURE_OPENAI_API_KEY || ""
};

// Private App Token認証関数
function verifyPrivateAppToken(token: string | null, shopDomain: string | null): boolean {
  // 環境変数から設定値取得
  const expectedToken = process.env.SHOPIFY_PRIVATE_APP_TOKEN;
  const expectedShop = process.env.SHOPIFY_SHOP_DOMAIN;

  if (!expectedToken || !expectedShop) {
    console.error("Shopify認証設定が不完全です");
    return false;
  }

  if (!token || !shopDomain) {
    console.error("認証ヘッダーが不足しています");
    return false;
  }

  // Token・Shop情報の検証
  const tokenValid = token.startsWith('shpat_') && token === expectedToken;
  const shopValid = shopDomain === expectedShop;

  if (!tokenValid) {
    console.error("無効なPrivate App Token:", token.substring(0, 10) + "...");
    return false;
  }

  if (!shopValid) {
    console.error("無効なShopドメイン:", shopDomain);
    return false;
  }

  return true;
}

// Rate Limiting（簡易版）
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "10");
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || "1") * 60 * 1000;

  const current = requestCounts.get(identifier);

  if (!current || now > current.resetTime) {
    // 新しいウィンドウまたは期限切れ
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    console.log(`Rate limit exceeded for ${identifier}: ${current.count}/${maxRequests}`);
    return false;
  }

  current.count++;
  return true;
}

// レシピ生成APIのアクション（POST専用）
export async function action({ request }: ActionFunctionArgs) {
  // POSTリクエストのみ許可
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // 🔒 Phase 1: Private App Token認証
    const shopifyToken = request.headers.get("X-Shopify-Access-Token");
    const shopDomain = request.headers.get("X-Shopify-Shop-Domain");

    if (!verifyPrivateAppToken(shopifyToken, shopDomain)) {
      return json({
        error: "認証エラー",
        message: "無効な認証情報です。Private App Tokenを確認してください。"
      }, { status: 401 });
    }

    // Rate Limiting チェック
    const rateLimitId = `${shopDomain}_${request.headers.get("x-forwarded-for") || "unknown"}`;
    if (!checkRateLimit(rateLimitId)) {
      return json({
        error: "Rate Limit Exceeded",
        message: "リクエスト制限に達しました。しばらく時間をおいて再試行してください。"
      }, { status: 429 });
    }

    console.log(`✅ 認証成功: Shop=${shopDomain}, Token=${shopifyToken?.substring(0, 10)}...`);
    // フォームデータを取得
    const formData = await request.formData();
    const condition = formData.get("condition")?.toString().trim() || "";
    const needs = formData.get("needs")?.toString().trim() || "";
    const kojiType = formData.get("kojiType")?.toString() || "";
    const otherIngredients = formData.get("otherIngredients")?.toString().trim() || "";

    // Azure OpenAI APIキーの確認
    if (!AZURE_CONFIG.apiKey || AZURE_CONFIG.apiKey === "") {
      console.error("Azure OpenAI APIキーが設定されていません");
      return json({
        error: "API設定エラー",
        message: "サーバー設定に問題があります。管理者にお問い合わせください。"
      }, { status: 500 });
    }

    // プロンプト構築（nutrition-widget.liquidから移植）
    const systemPrompt = `あなたは精密栄養学の知識を持つ料理専門家です。ユーザーの健康状態や希望に基づいて、MUROの麹製品を使った健康的で美味しいレシピを提案します。

以下の形式で必ず3つのレシピをJSON形式で返してください：
{
  "recipes": [
    {
      "name": "レシピ名",
      "ingredients": "材料リスト（分量も含む）",
      "steps": "作り方（ステップごとに改行）",
      "benefit": "このレシピがユーザーの状況にどう適しているかの説明"
    }
  ]
}

各レシピは異なるアプローチで、ユーザーの状況に対応してください：
1つ目：即効性のある軽めのレシピ
2つ目：栄養バランスを重視した主菜レシピ
3つ目：作り置きできる常備菜レシピ`;

    const userMessage = `ユーザー情報：
- 現在の体調やお悩み：${condition || "特になし"}
- 食事で気をつけたいこと：${needs || "特になし"}
- 使いたいMUROの麹製品：${kojiType || "AIにおまかせ"}
- その他使いたい食材：${otherIngredients || "特になし"}

この情報を基に、3つの異なるパーソナルKOJIレシピを提案してください。`;

    // Azure OpenAI APIに送信
    console.log("Azure OpenAI API呼び出し開始");
    const response = await fetch(AZURE_CONFIG.fullEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_CONFIG.apiKey
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userMessage
          }
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

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("無効なAPIレスポンス形式:", data);
      return json({
        error: "APIレスポンスエラー",
        message: "APIから無効なレスポンスが返されました"
      }, { status: 500 });
    }

    const content = data.choices[0].message.content;

    try {
      // JSON解析してレシピデータを取得
      const parsedContent = JSON.parse(content);
      const recipes = parsedContent.recipes || [];

      if (!Array.isArray(recipes) || recipes.length !== 3) {
        console.error("レシピ形式エラー:", parsedContent);
        return json({
          error: "レシピ生成エラー",
          message: "期待される形式のレシピが生成されませんでした"
        }, { status: 500 });
      }

      // 成功レスポンス
      console.log(`レシピ生成成功: ${recipes.length}件のレシピを取得`);
      return json({
        success: true,
        recipes: recipes,
        timestamp: new Date().toISOString()
      });

    } catch (parseError) {
      // JSON解析失敗時の処理
      console.error('JSON解析エラー:', parseError);
      console.error('生のコンテンツ:', content);

      // プレーンテキスト形式での返却も試みる
      return json({
        error: "JSON解析エラー",
        message: "AIからのレスポンスの解析に失敗しました",
        rawContent: content
      }, { status: 500 });
    }

  } catch (error) {
    // 全般的なエラーハンドリング
    console.error('レシピ生成API全般エラー:', error);

    // ネットワークエラーかAPIエラーかを判別
    const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
    const errorMessage = isNetworkError
      ? "ネットワークエラーが発生しました。インターネット接続を確認してください。"
      : "予期しないエラーが発生しました。しばらく時間をおいて再試行してください。";

    return json({
      error: "システムエラー",
      message: errorMessage,
      isNetworkError
    }, { status: 500 });
  }
}

// GETリクエストは405エラーを返す
export async function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}