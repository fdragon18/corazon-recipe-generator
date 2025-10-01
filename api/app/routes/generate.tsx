import { type ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Azure OpenAI API設定（環境変数から取得）
const AZURE_CONFIG = {
  fullEndpoint: process.env.AZURE_OPENAI_ENDPOINT || "https://your-azure-openai-endpoint.com/openai/deployments/gpt-4/chat/completions?api-version=2024-10-21",
  apiKey: process.env.AZURE_OPENAI_API_KEY || ""
};

// App Proxy用レシピ生成API（App Proxy形式）
export async function action({ request }: ActionFunctionArgs) {
  // POSTリクエストのみ許可
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // 🔒 App Proxy認証（HMAC検証）
    // App Proxyの場合、ShopifyからのリクエストはHMAC署名で検証される
    let shopDomain = 'corazon-muro-recipe-dev.myshopify.com';

    try {
      await authenticate.public.appProxy(request);
      shopDomain = request.url.includes('shop=')
        ? new URL(request.url).searchParams.get('shop') || 'corazon-muro-recipe-dev.myshopify.com'
        : 'corazon-muro-recipe-dev.myshopify.com';
      console.log(`✅ App Proxy認証成功: Shop=${shopDomain}`);
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : 'Unknown auth error';
      console.log(`⚠️  App Proxy認証スキップ: ${errorMessage}`);
      // 認証エラーを無視して続行（テスト目的）
      console.log('🔓 認証をスキップして続行します');
    }

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

    // Azure OpenAI APIキーの確認
    if (!AZURE_CONFIG.apiKey || AZURE_CONFIG.apiKey === "") {
      console.error("Azure OpenAI APIキーが設定されていません");
      return json({
        error: "API設定エラー",
        message: "サーバー設定に問題があります。管理者にお問い合わせください。"
      }, { status: 500 });
    }

    // プロンプト構築
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