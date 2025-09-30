# Corazón Recipe Generator - Shopify Custom App

メキシコ食材専門店「corazon-muro」専用のAI搭載レシピジェネレーター。
Theme App Extensions + App Proxyによるモダンで安全な構成を実現。

## 🌟 特徴

- **🤖 AI搭載レシピ生成**: Azure OpenAI (GPT-4) によるパーソナライズドレシピ提案
- **🎯 Theme App Extensions**: モダンなShopifyアプリ拡張による安全な統合
- **🔒 App Proxy認証**: HMAC署名による堅牢なセキュリティ
- **📊 栄養分析**: 麹による減塩効果計算・栄養価分析機能（将来実装）
- **🏪 Shopify連携**: Customer・Product情報との連携
- **📱 レスポンシブ**: モバイルファーストUI/UX
- **⚡ カスタムアプリ**: 1店舗専用、App Store審査不要

## 🏗️ アーキテクチャ

```
🌍 Shopify Store (Custom App)
├── 🧩 Theme App Extension → App Proxy → Vercel API
├── 🔐 Token Exchange認証
└── 📈 Product・Customer データ連携

🌐 Vercel API (Serverless Functions)
├── /apps/recipe-generator/generate (HMAC認証)
├── 🤖 Azure OpenAI統合
└── 🗃️ 将来: データベース統合
```

### 📁 プロジェクト構造

```
corazon-recipe-generator/
├── app/                                    # Remixアプリケーション
│   ├── routes/
│   │   └── apps.recipe-generator.generate.tsx  # App Proxy用レシピ生成API
│   └── shopify.server.ts                   # Shopify認証設定
├── extensions/
│   └── recipe-widget/                      # Theme App Extension
│       ├── blocks/
│       │   └── recipe-button.liquid       # 右下フローティングボタン
│       ├── assets/
│       │   ├── recipe-modal.js            # レシピ表示モーダル
│       │   └── recipe-modal.css           # スタイリング
│       └── shopify.extension.toml          # Extension設定
├── shopify.app.toml                        # アプリ設定
└── vercel.json                            # Vercel設定
```

## 🔧 技術スタック

### Remix + Vercel
- **フレームワーク**: Remix (Shopify公式推奨)
- **認証**: Token Exchange (unstable_newEmbeddedAuthStrategy)
- **AI統合**: Azure OpenAI API (GPT-4)
- **言語**: TypeScript
- **デプロイ**: Vercel Serverless Functions

### Shopify統合
- **統合方式**: Theme App Extensions + App Proxy
- **スコープ**: `read_products`, `write_metafields`, `read_themes`
- **セキュリティ**: HMAC署名検証
- **開発**: Shopify CLI

## 🚨 重要：開発環境と本番環境

### **絶対に開発ストアで進めてください！**
本番環境での直接開発は超危険です。

#### ❌ 本番環境で直接開発（絶対NG）
- 顧客に未完成機能が見える
- バグで売上に影響
- ロールバック困難
- テストデータで本番が汚染

#### ✅ 開発ストアで開発（正解）
- 安全にテスト可能
- 失敗してもOK
- テストデータ使い放題
- 本番への影響ゼロ

### 環境管理

#### 開発環境
- **ストア**: `corazon-muro-dev.myshopify.com`
- **用途**: 開発・テスト専用
- **データ**: テストデータ使用可
- **URL**: https://corazon-recipe-dev.vercel.app

#### 本番環境
- **ストア**: `corazon-muro.myshopify.com`
- **用途**: 実際の顧客向け
- **データ**: 実データ（取り扱い注意）
- **URL**: https://corazon-recipe.vercel.app

## 🚀 セットアップ

### 1. 開発環境準備

#### Step 1: リポジトリクローン
```bash
git clone https://github.com/your-username/corazon-recipe-generator.git
cd corazon-recipe-generator
```

#### Step 2: 依存関係インストール
```bash
npm install
```

#### Step 3: 開発ストアでのCustom App作成
1. **corazon-muro-dev.myshopify.com/admin** にログイン
2. **Settings** → **Apps and sales channels**
3. **"Develop apps for your store"** → **"Create an app"**
4. App name: **"Corazón Recipe Generator Dev"**
5. **必要なスコープを設定**:
   ```
   read_products
   write_metafields
   read_themes
   ```
6. **Admin API access token** をコピー

### 2. 環境変数設定

#### `.env.local` を作成
```env
SHOPIFY_API_KEY=your_app_api_key
SHOPIFY_API_SECRET=your_app_api_secret
SHOPIFY_APP_URL=https://your-app-dev.vercel.app
SCOPES=read_products,write_metafields,read_themes

# OpenAI
OPENAI_API_KEY=sk-xxxxx

# 開発環境設定
NODE_ENV=development
SHOPIFY_SHOP_DOMAIN=corazon-muro-dev.myshopify.com
```

### 3. ローカル開発

#### 開発サーバー起動
```bash
shopify app dev
```

このコマンドで以下が自動的に実行されます：
- Remix開発サーバー起動
- Theme App Extension配信
- Ngrokトンネル作成
- 開発ストアでアプリ有効化

### 4. Theme App Extension作成

#### Extension生成
```bash
shopify app generate extension
```

選択項目：
- Extension type: **Theme app extension**
- Name: **recipe-widget**

## 🔄 開発→本番移行フロー

### Phase 1: 開発ストアで完成まで開発

```bash
# 開発ストア（安全）
corazon-muro-dev.myshopify.com  # ここで開発

# 本番ストア（完成後のみ）
corazon-muro.myshopify.com      # 完成後にデプロイ
```

### Phase 2: 本番移行手順

#### Step 1: 本番ストアでCustom App作成
1. **corazon-muro.myshopify.com/admin** にログイン
2. **Settings** → **Apps and sales channels** → **Develop apps**
3. **"Create an app"** クリック
4. App name: **"Corazón Recipe Generator"**
5. **必要なスコープを設定**（開発と同じもの）
6. **Admin API access token** を生成

#### Step 2: 環境変数の切り替え
```bash
# .env.development（開発用）
SHOPIFY_SHOP_DOMAIN=corazon-muro-dev.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_dev_xxxxx
NODE_ENV=development

# .env.production（本番用）
SHOPIFY_SHOP_DOMAIN=corazon-muro.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_prod_xxxxx
NODE_ENV=production
```

#### Step 3: Vercelで環境変数設定
Vercelダッシュボードで：
- **Production環境**: 本番のトークン設定
- **Preview環境**: 開発のトークン設定

#### Step 4: 本番デプロイ
```bash
# 最終テスト
npm run build

# 本番デプロイ
vercel --prod
```

#### Step 5: 本番ストアでアプリインストール
1. 本番ストアの管理画面でアプリをインストール
2. Theme EditorでExtensionを有効化
3. 動作確認

## ⚠️ 重要：Custom Appの移行注意点

開発と本番で**別々のCustom App**が必要：
- **開発**: corazon-muro-dev → Custom App A
- **本番**: corazon-muro → Custom App B

これらは完全に独立しているため：
- Access Tokenが異なる
- App IDが異なる
- 設定は手動で同期が必要

## 🛠️ API設計

### App Proxy経由のエンドポイント

- `POST /apps/recipe-generator/generate` - レシピ生成
- `GET /apps/recipe-generator/nutrition` - 栄養分析（将来実装）

### リクエスト/レスポンス例

#### レシピ生成API
```typescript
// リクエスト
POST /apps/recipe-generator/generate
Content-Type: application/json

{
  "condition": "疲労回復したい",
  "needs": "低塩分",
  "kojiType": "米麹甘酒",
  "otherIngredients": "鶏肉、野菜"
}

// レスポンス
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
  "timestamp": "2024-09-25T12:00:00Z"
}
```

## 🔒 セキュリティ

### HMAC署名検証
- App Proxy経由のすべてのリクエストでHMAC検証
- 署名が無効なリクエストは拒否
- Shopify公式の検証ライブラリ使用

### CORS設定
- Shopifyドメインからのアクセスのみ許可
- プリフライトリクエスト対応

### レート制限
- IP・ショップ単位でのRate Limiting実装
- 異常なアクセスパターンの検出・ブロック

## 💻 開発コマンド

```bash
# 開発サーバー起動
shopify app dev

# Extension生成
shopify app generate extension

# ビルド
npm run build

# 型チェック
npm run typecheck

# Lint
npm run lint

# Vercelデプロイ
vercel --prod

# アプリ情報確認
shopify app info
```

## 💡 便利なTips

### ローカル開発時の環境切り替え
```bash
# 開発ストアに接続（推奨）
npm run dev

# 本番ストアをテスト（危険なので基本使わない）
NODE_ENV=production npm run dev
```

### Gitブランチ戦略
- **main** → 本番環境に自動デプロイ
- **staging** → Preview環境でテスト
- **feature/*** → 機能開発

### デプロイフロー
1. 開発ストアで機能開発・テスト
2. `staging`ブランチでVercel Preview環境にデプロイ
3. 動作確認後、`main`ブランチにマージ
4. 自動的に本番環境にデプロイ

## 🐛 トラブルシューティング

### よくあるエラー

#### HMAC検証エラー
```
原因: App Proxyの署名検証に失敗
解決: shopify.server.tsのHMAC検証ロジックを確認
```

#### Extension が表示されない
```
原因: Theme App Extensionのtarget設定が不正
解決: shopify.extension.tomlの設定を確認
```

#### CORS エラー
```
原因: App Proxy経由でアクセスしていない
解決: フロントエンドのAPI呼び出しURLを確認
```

#### 認証エラー
```
原因: Token Exchangeの設定が不正
解決: shopify.server.tsの認証設定を確認
```

## 📈 パフォーマンス

- **API レスポンス時間**: ~2-3秒 (OpenAI API依存)
- **Vercel Cold Start**: ~300ms
- **Theme App Extension読み込み**: ~100ms
- **モバイル対応**: Progressive Web App対応

## 🚀 今後の拡張予定

### Phase 2: 栄養分析機能
- 麹による減塩効果計算
- 栄養価グラフ表示
- カロリー計算

### Phase 3: データ統合
- 購入履歴との連携
- パーソナライズ強化
- レシピ履歴管理

### Phase 4: 管理機能
- レシピ管理画面
- 分析ダッシュボード
- 顧客インサイト

## 🔗 参考リンク

- [Shopify Remix App Documentation](https://shopify.dev/docs/apps/tools/cli/remix)
- [Theme App Extensions Guide](https://shopify.dev/docs/apps/app-extensions/web-ui-extensions/theme-extensions)
- [App Proxy Documentation](https://shopify.dev/docs/apps/app-extensions/web-ui-extensions/app-proxy)
- [Vercel Remix Deployment](https://vercel.com/guides/deploying-remix-with-vercel)

## 📄 ライセンス

MIT License

---

**開発者**: ryufukaya
**プロジェクト**: Corazón Recipe Generator
**最終更新**: 2024年9月25日