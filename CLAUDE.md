# Corazón Recipe Generator - Claude Code開発管理システム

## 🎯 現在のステータス（2024-09-25）
- **アクティブフェーズ**: アーキテクチャ全面再設計完了
- **現在のブランチ**: feature/theme-app-extensions-migration
- **アーキテクチャ**: Shopify Custom App + Theme App Extensions
- **認証方式**: Token Exchange (unstable_newEmbeddedAuthStrategy)
- **デプロイ先**: Vercel
- **開発環境**: corazon-muro-dev.myshopify.com（必須）
- **本番環境**: corazon-muro.myshopify.com（完成後のみ）

## 🏗️ プロジェクト概要
メキシコ食材専門店「corazon-muro」の商品ページに、AIレシピ生成機能を追加するShopifyアプリ。
**1店舗専用のCustom Appとして開発**。

## 📋 アーキテクチャ
- **フレームワーク**: Remix (Shopify公式推奨)
- **拡張機能**: Theme App Extensions
- **デプロイ先**: Vercel
- **認証方式**: Token Exchange (unstable_newEmbeddedAuthStrategy)
- **API連携**: OpenAI GPT-4

## 🎨 UI仕様
1. 右下固定の「MURO生成AI」アイコン
2. クリックでポップアップフォーム表示
3. 入力後モーダルでレシピ表示
4. 将来的に栄養分析グラフ追加予定

## 📁 ディレクトリ構造
```
corazon-recipe-generator/
├── app/                    # Remixアプリケーション
│   ├── routes/
│   │   └── apps.recipe-generator.generate.tsx  # App Proxy用レシピ生成API
│   └── shopify.server.ts   # Shopify認証設定
├── extensions/
│   └── recipe-widget/      # Theme App Extension
│       ├── blocks/
│       │   └── recipe-button.liquid
│       ├── assets/
│       │   ├── recipe-modal.js
│       │   └── recipe-modal.css
│       └── shopify.extension.toml
└── vercel.json
```

## 🚨 重要な制約事項
- Custom App（1店舗専用）として開発
- App Store審査は不要
- **Theme CLIは使用しない**（Theme App Extensionsを使用）
- APIキーは必ずサーバー側で管理（クライアント露出禁止）
- **🚨 絶対に開発ストアで進める（本番での直接開発は超危険）**

## 💻 開発コマンド
```bash
# 開発サーバー起動
shopify app dev

# Extension生成
shopify app generate extension

# Vercelデプロイ
vercel --prod

# アプリ情報確認
shopify app info
```

## 🛠️ API設計
### App Proxy経由のエンドポイント

- `/apps/recipe-generator/generate` - レシピ生成
- `/apps/recipe-generator/nutrition` - 栄養分析（将来実装）

### リクエスト/レスポンス形式
```typescript
// リクエスト
interface RecipeRequest {
  productId: string;
  ingredients: string;
  style: 'traditional' | 'modern' | 'fusion';
  servings?: number;
}

// レスポンス
interface RecipeResponse {
  recipe: {
    title: string;
    description: string;
    ingredients: Ingredient[];
    instructions: string[];
    prepTime: string;
    cookTime: string;
    nutrition?: NutritionData;
  };
}
```

## 🌍 環境管理

### 開発環境
- **ストア**: corazon-muro-dev.myshopify.com
- **用途**: 開発・テスト専用
- **データ**: テストデータ使用可
- **URL**: https://corazon-recipe-dev.vercel.app

### 本番環境
- **ストア**: corazon-muro.myshopify.com
- **用途**: 実際の顧客向け
- **データ**: 実データ（取り扱い注意）
- **URL**: https://corazon-recipe.vercel.app

### デプロイフロー
1. 開発ストアで機能開発・テスト
2. stagingブランチでVercel Preview環境にデプロイ
3. 動作確認後、mainブランチにマージ
4. 自動的に本番環境にデプロイ

### 環境別の設定
```javascript
// app/shopify.server.ts
const isDevelopment = process.env.NODE_ENV === 'development';

const shopDomain = isDevelopment
  ? 'corazon-muro-dev.myshopify.com'
  : 'corazon-muro.myshopify.com';
```

## 🔑 環境変数
```env
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_APP_URL=https://your-app.vercel.app
OPENAI_API_KEY=sk-xxxxx
NODE_ENV=production
```

## ⚙️ Shopify設定

- **開発ストア**: corazon-muro-dev.myshopify.com
- **本番ストア**: corazon-muro.myshopify.com
- **テーマ**: Online Store 2.0対応テーマ
- **必要なスコープ**:
  - `read_products`
  - `write_metafields`
  - `read_themes`

## ⚠️ 重要：Custom Appの移行注意点
開発と本番で別々のCustom Appが必要
- 開発: corazon-muro-dev → Custom App A
- 本番: corazon-muro → Custom App B

これらは完全に独立しているため：
- Access Tokenが異なる
- App IDが異なる
- 設定は手動で同期が必要

## 🚀 開発→本番移行フロー

### Phase 1: 開発ストアで完成まで開発
```bash
# 開発ストア
corazon-muro-dev.myshopify.com  # ここで開発

# 本番ストア
corazon-muro.myshopify.com      # 完成後にデプロイ
```

### Phase 2: 本番移行手順（超シンプル）

#### Step 1: 本番ストアでCustom App作成
1. corazon-muro.myshopify.com/admin にログイン
2. Settings → Apps and sales channels → Develop apps
3. "Create app" クリック
4. 必要なスコープを設定（開発と同じもの）
5. Access tokenを生成

#### Step 2: 環境変数の切り替え
```bash
# .env.development（開発用）
SHOPIFY_SHOP_DOMAIN=corazon-muro-dev.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_dev_xxxxx

# .env.production（本番用）
SHOPIFY_SHOP_DOMAIN=corazon-muro.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_prod_xxxxx
```

#### Step 3: Vercelで環境変数設定
```bash
# Vercelダッシュボードで
# Production環境に本番のトークン設定
# Preview環境に開発のトークン設定
```

#### Step 4: デプロイ
```bash
vercel --prod  # 本番にデプロイ
```

## 🚨 開発フローの比較

### ❌ 本番環境で直接開発（絶対NG）
- 顧客に未完成機能が見える
- バグで売上に影響
- ロールバック困難
- テストデータで本番が汚染

### ✅ 開発ストアで開発（正解）
- 安全にテスト可能
- 失敗してもOK
- テストデータ使い放題
- 本番への影響ゼロ

## 🚀 今すぐやるべきこと
1. 開発ストアで開発を続ける
2. 機能が完成したら本番用Custom App作成
3. 環境変数を分けて管理
4. Vercelで自動デプロイ設定

## 💡 便利なTips

### ローカル開発時の切り替え
```bash
# 開発ストアに接続
npm run dev

# 本番ストアをテスト（危険なので基本使わない）
NODE_ENV=production npm run dev
```

### Gitブランチ戦略
- main → 本番環境に自動デプロイ
- staging → Preview環境でテスト
- feature/* → 機能開発

## 🔗 既存コードからの移行メモ
- Theme CLIで作成した既存のJS/CSSは再利用可能
- API呼び出しは全てApp Proxy経由に変更必要
- Liquid構造はTheme App Extensionのblockに移植

## 🐛 デバッグ用URL
- **開発環境**: https://localhost:3000
- **App Proxy**: https://corazon-muro.myshopify.com/apps/recipe-generator/*
- **Theme Editor**: https://corazon-muro.myshopify.com/admin/themes/current/editor

## 💥 よくあるエラーと対処法
- **HMAC検証エラー**: App Proxyの署名検証を確認
- **CORS エラー**: App Proxy経由でアクセスしているか確認
- **Extension not showing**: Theme App Extensionのtarget設定を確認

## 📚 参考リンク
- [Shopify Remix App Documentation](https://shopify.dev/docs/apps/tools/cli/remix)
- [Theme App Extensions Guide](https://shopify.dev/docs/apps/app-extensions/web-ui-extensions/theme-extensions)
- [Vercel Remix Deployment](https://vercel.com/guides/deploying-remix-with-vercel)

## ✅ TODO
- [ ] Remix アプリの初期設定
- [ ] Theme App Extension作成
- [ ] OpenAI API統合
- [ ] App Proxy設定
- [ ] Vercelデプロイ設定
- [ ] 栄養分析機能の追加（Phase 2）

## 🤖 Claude Codeへの特別な指示

### コード生成時の注意
1. **localStorage/sessionStorageは使用禁止**（Shopifyで動作しない）
2. **App Proxy経由のAPI通信を徹底**
3. **Remix loaderとactionパターンを活用**
4. **Theme App ExtensionのLiquidはシンプルに保つ**

### ファイル命名規則
- Remixルート: `apps.recipe-generator.*.tsx`形式
- Extension: kebab-case使用
- アセット: 機能名を明確に

### テスト時の確認事項
- [ ] HMAC署名検証が正しく動作
- [ ] モバイルレスポンシブ対応
- [ ] Theme Editorでの表示確認
- [ ] アンインストール時のクリーンアップ

### 🚨 絶対に守るべき開発原則
1. **本番環境での直接開発は絶対禁止**
2. **必ず開発ストア（corazon-muro-dev.myshopify.com）で開発**
3. **完成してから本番環境にデプロイ**
4. **環境変数の管理を徹底**