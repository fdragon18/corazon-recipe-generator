# 🌮 Corazón Recipe Generator

メキシコ食材専門店「corazon-muro」専用のAI搭載レシピジェネレーター。
顧客の体調やお悩みに合わせて、麹を使った健康的なメキシカンレシピを提案します。

**Public App（Shopify CLI開発）+ Custom Distribution（1店舗専用配布）**

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://corazon-recipe-generator-v5.vercel.app)
[![Shopify](https://img.shields.io/badge/Shopify-Public%20App-green?logo=shopify)](https://corazon-muro-recipe-dev.myshopify.com)
[![DIFY](https://img.shields.io/badge/AI-DIFY%20Workflow-blue)](https://dify.ai)

---

## ✨ 特徴

- 🤖 **AI搭載レシピ生成** - DIFY Workflow APIによるパーソナライズドレシピ提案
- 💾 **履歴管理** - Supabase (PostgreSQL) でレシピ生成履歴を保存
- 🔒 **セキュア** - Shopify App Proxy（HMAC検証）による安全な認証
- 📊 **拡張可能** - Json型で将来的な機能拡張に対応
- 🏪 **顧客紐付け** - Shopify Customer IDでパーソナライズ
- ⚡ **高速デプロイ** - Vercel自動デプロイ & Serverless

---

## 🏗️ アーキテクチャ

```
┌─────────────────────┐
│ Shopify Store       │
│ (App Proxy)         │
└──────────┬──────────┘
           │ POST /apps/recipe_gen/generate
           │ (HMAC署名検証済み)
           ▼
┌─────────────────────┐
│ Vercel (Remix)      │
│ /generate           │
└──────────┬──────────┘
           │
           ├─────► DIFY Workflow API
           │       (レシピ生成)
           │
           └─────► Supabase (PostgreSQL)
                   (履歴保存)
```

---

## 📁 プロジェクト構造

```
corazon-recipe-generator/
├── api/                            # Remixアプリケーション
│   ├── app/
│   │   ├── routes/
│   │   │   ├── generate.tsx                    # レシピ生成API
│   │   │   └── apps.recipe_gen._index.tsx      # API情報
│   │   └── db.server.ts                        # Prisma Client
│   ├── prisma/
│   │   └── schema.prisma                       # データベーススキーマ
│   ├── package.json
│   └── .env                                    # 環境変数（Git管理外）
├── theme/                          # Shopifyテーマ統合
│   ├── assets/
│   │   ├── recipe-modal.js                     # レシピモーダルUI
│   │   └── recipe-modal.css
│   └── snippets/
│       └── recipe-widget.liquid                # ウィジェット埋め込み
├── CLAUDE.md                       # 開発管理ドキュメント
└── README.md                       # このファイル
```

---

## 🔧 技術スタック

| カテゴリ | 技術 |
|---------|------|
| **フレームワーク** | Remix (Vite) |
| **デプロイ** | Vercel (Serverless) |
| **AI** | DIFY Workflow API |
| **データベース** | Supabase (PostgreSQL) |
| **ORM** | Prisma |
| **認証** | Shopify App Proxy (HMAC) |
| **フロントエンド** | Vanilla JS + CSS |

---

## 🗄️ データベース設計

### Prismaスキーマ

```prisma
// レシピ生成リクエスト履歴
model RecipeRequest {
  id                String            @id @default(cuid())
  shop              String
  customerId        String?           // Shopify Customer ID（参照のみ）
  condition         String
  needs             String?
  kojiType          String?
  otherIngredients  String?
  createdAt         DateTime          @default(now())
  recipes           GeneratedRecipe[]
}

// 生成されたレシピ
model GeneratedRecipe {
  id          String   @id @default(cuid())
  requestId   String
  name        String
  ingredients Json     // [{ item: "材料名" }]
  steps       Json     // [{ step_number: 1, description: "手順" }]
  benefit     String
  createdAt   DateTime @default(now())
  request     RecipeRequest @relation(...)
}
```

**設計原則：**
- ✅ **Single Source of Truth** - 顧客情報はShopifyで管理
- ✅ **Metafieldでパーソナライズ** - 性別・年齢は `custom.sex` / `custom.age` で管理
- ✅ **Json型** - 将来の拡張性（分量、カテゴリ、画像など）に対応
- ✅ **リレーション** - 1対多でリクエストとレシピを紐付け

---

## 🚀 セットアップ

### 0. Shopify顧客Metafield設定（初回のみ）

レシピをパーソナライズするため、性別と年齢のMetafieldを設定します。

#### 方法1: Shopify管理画面（推奨）
1. Shopify管理画面 → **Settings** → **Custom data** → **Customers**
2. **Add definition** をクリックして以下を設定：
   - **Sex**: `custom.sex` (Single line text)
   - **Age**: `custom.age` (Integer)

#### 方法2: GraphQL API（一括作成）
1. **Apps** → **Develop apps** → アプリを選択 → **API credentials**
2. **Admin API access token** をコピー
3. [Shopify GraphiQL App](https://shopify-graphiql-app.shopifycloud.com/login) にアクセス
4. [setup-customer-metafields.graphql](scripts/setup-customer-metafields.graphql) の内容をコピペして実行

詳細: [Shopify顧客Metafield設定手順](docs/shopify-customer-metafields-setup.md)

---

### 1. リポジトリクローン

```bash
git clone https://github.com/fdragon18/corazon-recipe-generator.git
cd corazon-recipe-generator/api
```

### 2. 環境変数設定

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
# Shopify App Configuration
SHOPIFY_APP_URL=https://your-app.vercel.app

# Prisma Database URL (Supabase PostgreSQL)
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"

# DIFY AI API (Recipe Generation)
DIFY_ENDPOINT=https://api.dify.ai/v1
DIFY_API_KEY=app-your-dify-api-key
```

### 3. 依存関係インストール

```bash
npm install
```

### 4. Prisma Client生成 & マイグレーション

```bash
npx prisma generate
npx prisma db push
```

### 5. 開発サーバー起動

```bash
npm run dev
```

---

## 📦 デプロイ

### 📌 デプロイの種類

| 変更内容 | 使用コマンド | 反映先 |
|---------|-------------|--------|
| **コード変更**（Remix, API, フロントエンド） | `git push origin main` | Vercel（自動デプロイ） |
| **Extensions変更**（Theme App Extension等） | `shopify app deploy` | Shopify |
| **スコープ変更** | `shopify app deploy` + 権限更新 | Shopify |

---

### Vercelへのデプロイ

#### 1. **Vercelにログイン**
```bash
vercel login
```

#### 2. **プロジェクトリンク**
```bash
vercel link --yes
```

#### 3. **環境変数を設定**
```bash
vercel env add DIFY_ENDPOINT production
vercel env add DIFY_API_KEY production
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
```

#### 4. **デプロイ**
```bash
git push origin main  # Vercelに自動デプロイ
```

---

### Shopify Extensionsのデプロイ

Theme App ExtensionやAdmin Link Extensionを変更した場合：

```bash
# Shopifyにデプロイ
shopify app deploy

# デプロイ後、テーマエディタで確認
# https://corazon-muro-dev.myshopify.com/admin/themes/current/editor
```

---

### スコープ変更時の手順（重要！）

**⚠️ 重要：OAuthトークンの仕組みを理解する**

アプリインストール時にOAuth認証が行われ、アクセストークンが生成されます。
**トークンにスコープが固定的に紐付けられる**ため、`shopify.app.toml` を変更しただけでは既存トークンは更新されません。

#### **開発環境での対処法**

1. **shopify.app.toml を編集**
```toml
[access_scopes]
scopes = "write_products,read_customers"
```

2. **開発ストアでアプリをアンインストール**
- Settings → Apps and sales channels
- recipe-generator-app → **Delete**

3. **再インストール**
```bash
shopify app dev
```
- 表示されるURLにアクセス
- 新しいスコープで再認証 → 新しいアクセストークン生成 ✅

#### **本番環境での対処法**

アプリ起動時にスコープ不足を自動検知してリダイレクト：

```typescript
// Remix loaderで実装例
const currentScopes = session.scope.split(",");
const requiredScopes = ["read_customers", "write_products"];

const missingScopes = requiredScopes.filter(
  scope => !currentScopes.includes(scope)
);

if (missingScopes.length > 0) {
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${requiredScopes.join(",")}&redirect_uri=${redirectUri}`;
  return redirect(authUrl); // 自動リダイレクト
}
```

**App Bridge使用（埋め込みアプリ）**
```typescript
import { requestAccessScope } from '@shopify/app-bridge/utilities';
await requestAccessScope(app, ['read_customers']); // モーダル表示
```

→ ユーザーは何もする必要なし。アプリが自動処理 ✅

---

## 🎯 使い方

### Shopifyストアでの利用

1. 商品ページにアクセス
2. 右下の「MURO生成AI」ボタンをクリック
3. 体調・お悩みを入力
4. 「レシピを生成」ボタンをクリック
5. AIが3つのレシピを提案

### API直接呼び出し

```bash
curl -X POST https://your-app.vercel.app/generate \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "shop=your-store.myshopify.com" \
  -d "condition=疲労感があります" \
  -d "needs=消化に良いもの" \
  -d "kojiType=米麹"
```

---

## 📊 レスポンス例

```json
{
  "success": true,
  "recipes": [
    {
      "name": "麹とトマトの冷製スープ",
      "ingredients": [
        { "item": "MUROの米麹（大さじ2）" },
        { "item": "完熟トマト（2個）" }
      ],
      "steps": [
        { "step_number": 1, "description": "トマトは湯むきしてざく切りにする。" },
        { "step_number": 2, "description": "ミキサーで攪拌する。" }
      ],
      "benefit": "麹による消化酵素とトマトの抗酸化成分で疲労回復に効果的"
    }
  ],
  "timestamp": "2025-10-04T02:45:37.347Z",
  "shop": "corazon-muro-recipe-dev.myshopify.com"
}
```

---

## 🔐 セキュリティ

- ✅ Shopify App Proxy HMAC署名検証
- ✅ 環境変数によるAPIキー管理（Git管理外）
- ✅ Supabase Row Level Security (RLS) 対応可能
- ✅ CORS設定（Shopifyドメインのみ許可）

---

## 📈 今後の拡張案

### Phase 3: 顧客パーソナライズ ✅ **完了**
- [x] Shopify顧客情報取得（性別・年齢Metafield）
- [x] DIFYへの顧客属性連携
- [x] Metafield設定ドキュメント作成
- [ ] DIFY Workflowでのパーソナライズ強化

### Phase 4: 栄養分析と減塩効果可視化
- [ ] 栄養価計算（PFC + ナトリウム）
- [ ] 従来レシピとの減塩比較
- [ ] 視覚的な比較バー実装
- [ ] 麹の効果説明テキスト生成

### Phase 5: UX最適化
- [ ] モーダルUIの改善
- [ ] モバイルレスポンシブ強化
- [ ] レシピお気に入り機能

### Phase 6: 本番デプロイ
- [ ] 本番ストア（corazon-muro.myshopify.com）への展開
- [ ] 本番環境用Custom App作成
- [ ] パフォーマンス監視

---

## 🤝 コントリビューション

このプロジェクトは「corazon-muro」専用のCustom Appです。
Public Shopify App Storeには公開していません。

---

## 📄 ライセンス

Private - Corazón Muro専用

---

## 📞 サポート

プロジェクト管理: [CLAUDE.md](./CLAUDE.md)
開発ログ: [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md)

---

**Made with ❤️ for Corazón Muro**
