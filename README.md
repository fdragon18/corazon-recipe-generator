# レシピジェネレーター - Corazón (プライベートShopifyアプリ)

プライベートShopifyアプリとして動作するAI搭載レシピジェネレーター。
Shopify Private App Token認証により、セキュアかつシンプルな構成を実現。

## 🌟 特徴

- **🤖 AI搭載レシピ生成**: Azure OpenAI (GPT-4) によるパーソナライズドレシピ提案
- **🔒 セキュア認証**: Shopify Private App Token による簡単で安全な認証
- **🎯 Script Tag統合**: テーマに直接統合、管理画面埋め込み不要
- **📊 栄養分析**: 麹による減塩効果計算・栄養価分析機能
- **🏪 Shopify連携**: Customer・Order情報とレシピ履歴の統合
- **📱 レスポンシブ**: モバイルファースト UI/UX
- **⚡ 高速開発**: OAuth不要、App Store審査不要で迅速な実装

## 🏗️ アーキテクチャ

```
🌍 Shopify Store (プライベートアプリ)
├── 📜 Script Tag → Vercel API
├── 🔑 Private App Token認証
└── 📈 Customer・Orderデータ連携

🌐 Vercel API (セキュアエンドポイント)
├── /api/recipes/generate (Token認証)
├── 🤖 Azure OpenAI統合
└── 🗃️ Supabase データ保存
```

### 📁 ファイル構造

```
corazon-recipe-generator/
├── api/                    # Vercel API (Remix)
│   ├── app/               # API エンドポイント
│   │   └── routes/        # レシピ生成 API
│   ├── prisma/            # Supabase スキーマ
│   └── vercel.json        # Vercel 設定
└── theme/                 # Shopify テーマ
    ├── sections/          # nutrition-widget.liquid
    └── templates/         # パスタレシピページ等
```

## 🔧 技術スタック

### Vercel API
- **フレームワーク**: Remix (軽量化・App Bridge削除済み)
- **認証**: Shopify Private App Token (shpat_xxxxx)
- **データベース**: Supabase (PostgreSQL) + Prisma ORM
- **AI統合**: Azure OpenAI API (GPT-4)
- **言語**: TypeScript
- **デプロイ**: Vercel Serverless Functions

### Shopify統合
- **統合方式**: Script Tag + Private App Token
- **テンプレート**: Liquid (nutrition-widget.liquid)
- **セキュリティ**: Shop情報自動取得 + Token安全送信
- **開発**: Shopify CLI

### セキュリティ層
- **CORS**: Shopifyドメイン限定 (*.myshopify.com)
- **Rate Limiting**: 1分間10リクエスト制限
- **トークン検証**: Private App Token 有効性確認

## 🚀 セットアップ

### 1. Shopify Private App作成

#### Step 1: Shopify Admin でアプリ作成
1. Shopify Admin → **Settings** → **Apps and sales channels**
2. **"Develop apps for your store"** → **"Create an app"**
3. App name: **"Corazón Recipe Generator"**

#### Step 2: Admin API permissions 設定
```
Products: Read access
Customers: Read access
Orders: Read access
```

#### Step 3: Private App Token 取得
- **Admin API access token** をコピー (shpat_で始まる)

### 2. 環境変数設定

#### `api/.env.local` を作成
```env
# Shopify Private App (必須)
SHOPIFY_PRIVATE_APP_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
SHOPIFY_SHOP_NAME=your-shop

# APIセキュリティ
API_SECRET_KEY=your_random_32_char_secret_key_here
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MINUTES=1

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-instance.openai.azure.com/...
AZURE_OPENAI_API_KEY=your_azure_openai_key

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_connection_string
```

### 3. ローカル開発

#### API サーバー起動
```bash
cd api
npm install
npm run dev
```

#### テーマ開発
```bash
cd theme
shopify theme dev
```

### 4. Vercel デプロイ

#### Vercel CLI でデプロイ
```bash
# Vercel アカウント接続
npx vercel login

# プロジェクトデプロイ
npx vercel --prod
```

#### 環境変数を Vercel に設定
Vercel Dashboard で同じ環境変数を設定

## 🔒 セキュリティ

### Private App Token認証
- Shopify Private App Token (shpat_) で認証
- リクエスト毎にToken検証
- 不正アクセス時のエラーレスポンス

### CORS設定
- `*.myshopify.com` ドメイン限定
- テーマからの直接アクセスのみ許可
- プリフライト リクエスト対応

### Rate Limiting
- 1分間10リクエスト制限
- IP・Shopベースでの制限
- Redis/Upstash使用

### データ保護
- Supabase Row Level Security
- Token暗号化保存
- アクセスログ・エラーログ記録

## 🧪 API エンドポイント

### POST `/api/recipes/generate`

#### リクエストヘッダー
```
X-Shopify-Access-Token: shpat_xxxxxxxxxxxxx
X-Shopify-Shop-Domain: your-shop.myshopify.com
Content-Type: application/x-www-form-urlencoded
```

#### リクエストボディ
```
condition=疲労回復したい
needs=低塩分
kojiType=米麹甘酒
otherIngredients=鶏肉、野菜
```

#### レスポンス
```json
{
  "success": true,
  "recipes": [
    {
      "name": "米麹甘酒チキンサラダ",
      "ingredients": "鶏胸肉 200g、米麹甘酒 100ml...",
      "steps": "1. 鶏胸肉を米麹甘酒でマリネ...",
      "benefit": "米麹の酵素が疲労回復を促進..."
    }
  ],
  "timestamp": "2024-09-24T15:30:00Z"
}
```

## 🔄 開発フロー

### Phase 1: セキュアAPI基盤
- [x] Private App Token認証実装
- [x] CORS設定
- [x] Rate Limiting
- [x] Azure OpenAI統合

### Phase 2: Script Tag統合
- [ ] nutrition-widget.liquid 修正
- [ ] Private App Token使用
- [ ] Shop情報自動取得

### Phase 3: Admin API連携
- [ ] Customer情報取得
- [ ] Order履歴連携
- [ ] レシピ履歴管理

## 🐛 トラブルシューティング

### よくあるエラー

#### 401 Unauthorized
```
原因: Private App Token が無効
解決: .env.local の SHOPIFY_PRIVATE_APP_TOKEN を確認
```

#### CORS Error
```
原因: 許可されていないドメインからのアクセス
解決: Shopifyストアのドメインを確認
```

#### Rate Limit Exceeded
```
原因: 1分間に10回以上のリクエスト
解決: 時間をおいて再試行
```

## 📈 パフォーマンス

- **API レスポンス時間**: ~2-3秒 (Azure OpenAI 依存)
- **Rate Limiting**: 10 req/min
- **Vercel Cold Start**: ~300ms
- **データベース**: Supabase (高速クエリ)

## 🤝 貢献

1. このリポジトリをフォーク
2. 機能ブランチ作成: `git checkout -b feature/amazing-feature`
3. 変更をコミット: `git commit -m 'Add amazing feature'`
4. ブランチプッシュ: `git push origin feature/amazing-feature`
5. プルリクエスト作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 🔗 関連リンク

- [Shopify Private Apps ドキュメント](https://shopify.dev/docs/apps/auth/admin-app-access-tokens)
- [Vercel Deployment ドキュメント](https://vercel.com/docs)
- [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
- [Supabase ドキュメント](https://supabase.com/docs)

---

**開発者**: ryufukaya
**プロジェクト**: レシピジェネレーター - Corazón
**最終更新**: 2024年9月24日