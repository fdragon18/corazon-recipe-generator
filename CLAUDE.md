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

### 現在使用中の環境変数（2024-10-04更新）
```env
# DIFY API（レシピ生成）
DIFY_ENDPOINT=https://api.dify.ai/v1
DIFY_API_KEY=app-YYu070jPeEfbGrWKoPaPoyv5

# Supabase Database（レシピ保存）
DATABASE_URL=postgresql://postgres.agedxtuujcoybeffsjjn:F@r1gh0912corazon@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Shopify App
SHOPIFY_APP_URL=https://corazon-recipe-generator-v5.vercel.app
```

### 🔧 環境変数の管理方法

**重要：環境変数はGitには含まれません**

#### 方法1: Vercel CLI（推奨）
```bash
# Vercelにログイン
vercel login

# プロジェクトをリンク
vercel link --yes

# 環境変数を追加（Production）
vercel env add VARIABLE_NAME production
# 値を入力 → Enter

# 環境変数を追加（Preview & Development）
vercel env add VARIABLE_NAME preview
vercel env add VARIABLE_NAME development

# 環境変数一覧を確認
vercel env ls
```

#### 方法2: Vercelダッシュボード
1. https://vercel.com/dashboard にアクセス
2. プロジェクトを選択
3. Settings → Environment Variables
4. 環境変数を追加/編集
5. Environments（Production/Preview/Development）を選択
6. Save

#### ⚠️ 環境変数変更後の再デプロイ

**環境変数の追加/変更だけでは自動再デプロイされません**

再デプロイ方法：

**A. Vercelダッシュボードで手動再デプロイ（推奨）**
1. https://vercel.com/dashboard → プロジェクト選択
2. Deployments → 最新デプロイの「...」→ Redeploy
3. "Redeploy with existing Build Cache" を選択

**B. ダミーコミットでトリガー**
```bash
git commit --allow-empty -m "chore: trigger redeploy with new env vars"
git push origin main
```

### 📋 デプロイの役割分担

| 方法 | 用途 | タイミング |
|------|------|-----------|
| **Git Push** | コード変更のデプロイ | `git push origin main`時に自動 |
| **Vercel CLI** | 環境変数の管理 | 手動（`vercel env add`） |
| **Vercelダッシュボード** | 環境変数管理 & 手動再デプロイ | 必要に応じて |

**ベストプラクティス：**
- コード変更 → Git Push（自動デプロイ）
- 環境変数変更 → Vercel CLI or ダッシュボード → 手動再デプロイ
- 緊急時の再デプロイ → ダッシュボードからRedeploy

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
- **Theme Editor**: https://admin.shopify.com/store/corazon-muro-recipe-dev/themes/133962661982/editor

## 💥 よくあるエラーと対処法
- **HMAC検証エラー**: App Proxyの署名検証を確認
- **CORS エラー**: App Proxy経由でアクセスしているか確認
- **Extension not showing**: Theme App Extensionのtarget設定を確認

## 📚 参考リンク

### 公式ドキュメント
- [Shopify Remix App Documentation](https://shopify.dev/docs/apps/tools/cli/remix)
- [Theme App Extensions Guide](https://shopify.dev/docs/apps/app-extensions/web-ui-extensions/theme-extensions)
- [Vercel Remix Deployment](https://vercel.com/guides/deploying-remix-with-vercel)

### App Proxy関連（重要）
- [App Proxy Documentation](https://shopify.dev/docs/apps/build/online-store/display-dynamic-data)
- [App Proxy API Reference](https://shopify.dev/docs/api/shopify-app-remix/v2/authenticate/public/app-proxy)
- **[App Proxy - Logged in Customer ID Parameter](https://shopify.dev/changelog/app-proxy-requests-include-new-parameter-for-the-logged-in-customer-id)** ⭐ 2022年7月追加
  - App Proxyリクエストに`logged_in_customer_id`パラメータが自動追加される
  - ログイン中の顧客IDを取得可能
  - 使用例: `const customerId = new URL(request.url).searchParams.get("logged_in_customer_id")`

### 重要な仕様変更・アップデート
- **2022年7月**: App Proxyで顧客ID取得が可能に（セキュリティ向上）
- **2024年**: Customer Account UI Extensions導入（より高度な顧客データアクセス）

## ✅ TODO
- [ ] Remix アプリの初期設定
- [ ] Theme App Extension作成
- [ ] OpenAI API統合
- [ ] App Proxy設定
- [ ] Vercelデプロイ設定
- [ ] 栄養分析機能の追加（Phase 2）

## 🤖 Claude Codeへの特別な指示

### セッション開始時のチェック
**毎回セッション開始時に以下を確認すること**:

```bash
# GitHub Issueの確認
gh issue list --state open

# 優先度の高いIssueから作業を開始
# 必要に応じてIssue詳細を確認
gh issue view <issue_number>
```

**プロアクティブな作業管理**:
1. セッション開始時にOpenなIssueを自動確認
2. ユーザーに現在のタスク状況を報告
3. 次に取り組むべきIssueを提案
4. 作業完了時はIssueをクローズ

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

#### 🚨 絶対に守るべき開発原則
1. **本番環境での直接開発は絶対禁止**
2. **必ず開発ストア（corazon-muro-dev.myshopify.com）で開発**
3. **完成してから本番環境にデプロイ**
4. **環境変数の管理を徹底**

## 🔄 デプロイとアップデート手順（重要）

### 📝 いつpushが必要か？

**🚨 重要：変更をpushしないと本番に反映されません**

#### ✅ Git Push が必要なケース
- **コード変更**（JS、CSS、Liquid、TypeScript など）
- **設定ファイル変更**（shopify.app.toml、vercel.json など）
- **環境変数の更新**（.env ファイル変更）
- **API エンドポイントの修正**

#### ✅ Shopify Extension Deploy が必要なケース
- **Theme App Extension の変更**（blocks、assets、locales）
- **Extension 設定の更新**（shopify.extension.toml）
- **新しい Extension 機能の追加**

### 🚀 正しいデプロイ手順

#### 1. コード変更時
```bash
# 変更をステージング
git add .

# コミット作成
git commit -m "変更内容の説明"

# リモートにプッシュ（Vercelに自動デプロイ）
git push origin main
```

#### 2. Extension変更時
```bash
# Shopifyに拡張機能をデプロイ
shopify app deploy --force

# 必要に応じてコードもプッシュ
git push origin main
```

#### 3. 両方変更した場合
```bash
# 1. まずコードをプッシュ
git add .
git commit -m "変更内容"
git push origin main

# 2. 次にExtensionをデプロイ
shopify app deploy --force
```

### ⚠️ よくある間違い

#### ❌ 間違い：「pushしなくても変わらない」
- **Vercel**：Git連携のため、pushしないと更新されない
- **Shopify Extensions**：`shopify app deploy`しないとストアに反映されない

#### ✅ 正解：「必ず両方実行」
- **コード変更** → `git push`でVercelに自動デプロイ
- **Extension変更** → `shopify app deploy`でShopifyストアに反映

### 🔍 デプロイ確認方法

#### Vercel デプロイ確認
```bash
# デプロイ状況確認
vercel ls

# 最新デプロイの詳細
vercel inspect
```

#### Shopify Extension 確認
```bash
# アプリ情報確認
shopify app info

# 最新バージョン確認
shopify app versions list
```

### 📋 デプロイチェックリスト

- [ ] コード変更があるか？ → `git push`
- [ ] Extension変更があるか？ → `shopify app deploy`
- [ ] 環境変数追加したか？ → Vercelダッシュボードで設定
- [ ] APIテストしたか？ → `curl`でエンドポイント確認
- [ ] Extension表示確認したか？ → テーマエディターで確認

### 🎯 現在のプロジェクト状態（2024-09-30更新）

#### ✅ 最新デプロイ済み
- **Vercel URL**: https://corazon-recipe-generator-v5.vercel.app
- **Shopify App**: recipe-generator-app-5
- **Extension UID**: e40486c2-9c2b-c824-4822-6c2964ee608b18a4319a
- **API Endpoint**: `/apps/recipegen/generate`
- **Azure OpenAI**: 正常動作確認済み

#### 🔧 設定済み項目
- App Proxy設定修正完了（/appsパス削除）
- 多言語対応（日本語・英語）
- レシピ生成API動作確認済み
- Theme App Extension デプロイ完了