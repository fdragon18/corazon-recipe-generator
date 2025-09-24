# レシピジェネレーター - Corazón

AIを活用したレシピ生成アプリケーションです。Shopify App（Remix）とShopifyテーマを組み合わせたハイブリッド構成で、包括的なレシピ管理体験を提供します。

## 🚀 特徴

- **AI搭載レシピ生成**: 食材に基づいた創造的なレシピ提案
- **栄養成分分析**: 各レシピの詳細な栄養情報
- **Shopify統合**: Shopify App + テーマのシームレスな連携
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **データ管理**: Supabaseを使用した堅牢なデータ保存

## 🏗️ プロジェクト構造

```
corazon-recipe-generator/
├── api/                    # Shopify App (Remix + Node.js)
│   ├── app/               # Remixアプリケーション
│   │   ├── routes/        # APIルート
│   │   └── components/    # Reactコンポーネント
│   ├── prisma/            # データベーススキーマ
│   ├── package.json       # Node.js依存関係
│   └── shopify.app.toml   # Shopify App設定
└── theme/                 # Shopifyテーマ
    ├── templates/         # Liquidテンプレート
    ├── sections/          # テーマセクション（レシピウィジェットなど）
    ├── snippets/          # 再利用可能なスニペット
    └── assets/            # CSS/JavaScript/画像
```

## 🛠️ 技術スタック

### Shopify App (api/)
- **フレームワーク**: Remix (React-based)
- **言語**: TypeScript/JavaScript
- **データベース**: Prisma + Supabase (PostgreSQL)
- **認証**: Shopify App認証
- **デプロイ**: Shopify Partners

### Shopifyテーマ (theme/)
- **テンプレート**: Liquid
- **スタイリング**: CSS + Vanilla JavaScript
- **レスポンシブ**: モバイルファースト設計
- **統合**: Shopify Section API

## 🚦 クイックスタート

### 前提条件

1. **Node.js** (v18.20+): [公式サイト](https://nodejs.org/)からダウンロード
2. **Shopify CLI**: `npm install -g @shopify/cli @shopify/theme`
3. **Shopify Partnerアカウント**: [Shopify Partners](https://partners.shopify.com/)
4. **Supabaseプロジェクト**: [Supabase](https://supabase.com/)

### セットアップ

#### 1. Shopify App (api/)

```bash
# ディレクトリに移動
cd api

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.localファイルを編集して必要な値を設定

# データベース移行
npm run prisma migrate dev

# 開発サーバー起動
npm run dev
```

#### 2. Shopifyテーマ (theme/)

```bash
# ディレクトリに移動
cd theme

# Shopifyテーマとして開発モードで起動
shopify theme dev

# または本番環境にプッシュ
shopify theme push
```

### 環境変数設定

`api/.env.local`に以下の変数を設定:

```env
# Shopify App
SHOPIFY_API_KEY=your_app_api_key
SHOPIFY_API_SECRET=your_app_api_secret
SCOPES=write_products,read_customer_details

# データベース
DATABASE_URL=your_supabase_database_url

# セッション
SESSION_SECRET=your_random_session_secret

# AI API（予定）
OPENAI_API_KEY=your_openai_api_key
```

## 🧪 開発

### よく使うコマンド

```bash
# API開発
cd api
npm run dev          # 開発サーバー起動
npm run lint         # ESLint実行
npm run build        # プロダクションビルド
npx tsc --noEmit     # 型チェック

# テーマ開発
cd theme
shopify theme dev    # プレビュー環境で開発
shopify theme push   # 本番環境に反映
```

### データベース操作

```bash
cd api

# 新しいマイグレーション作成
npm run prisma migrate dev --name migration_name

# Prisma Studio起動（GUIでデータ確認）
npm run prisma studio

# データベースリセット
npm run prisma migrate reset
```

## 📊 主要機能

### 1. レシピ生成機能
- 食材入力に基づいたAIレシピ生成
- カスタマイズ可能な調理時間・人数設定
- アレルギー対応・食事制限考慮

### 2. 栄養分析ウィジェット
- カロリー・マクロ栄養素の自動計算
- 食材別栄養成分の詳細表示
- 健康的な食事のためのアドバイス

### 3. Shopify統合
- 商品ページへのレシピ提案
- 食材の自動リンク・購入導線
- カートへの一括追加機能

## 🚀 デプロイメント

### Shopify App デプロイ

```bash
cd api

# アプリをShopify Partnersにデプロイ
shopify app deploy
```

### テーマ デプロイ

```bash
cd theme

# 本番環境にプッシュ
shopify theme push --store your-store-name
```

## 🤝 開発に参加

1. このリポジトリをフォーク
2. 機能ブランチを作成: `git checkout -b feature/new-feature`
3. 変更をコミット: `git commit -m 'Add new feature'`
4. ブランチをプッシュ: `git push origin feature/new-feature`
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは[MITライセンス](LICENSE)の下で公開されています。

## 🔗 関連リンク

- [Shopify App開発ドキュメント](https://shopify.dev/docs/apps)
- [Remix ドキュメント](https://remix.run/docs)
- [Shopify Liquid ドキュメント](https://shopify.dev/docs/themes/liquid)
- [Supabase ドキュメント](https://supabase.com/docs)
- [Prisma ドキュメント](https://www.prisma.io/docs/)

---

**開発者**: ryufukaya
**プロジェクト**: レシピジェネレーター - Corazón
**最終更新**: 2024年9月