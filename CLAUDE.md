# Claude Code用プロジェクト設定

## 言語設定
- **重要**: このプロジェクトの開発者は日本人のため、すべてのコミットメッセージとコメントは日本語で記述してください
- コード内のコメントも日本語で記述してください
- エラーメッセージや説明も日本語で行ってください

## プロジェクト概要
レシピジェネレーターアプリケーション（Shopify App + Shopifyテーマ）

## プロジェクト構造
```
corazon-recipe-generator/
├── api/                    # Shopify App (Remix + Node.js)
│   ├── app/               # Remixアプリケーション
│   ├── prisma/            # データベーススキーマ
│   ├── package.json       # Node.js依存関係
│   └── shopify.app.toml   # Shopify App設定
└── theme/                 # Shopifyテーマ
    ├── templates/         # Liquidテンプレート
    ├── sections/          # テーマセクション
    └── snippets/          # 再利用可能なスニペット
```

## 開発環境

### Shopify App (api/)
- **フレームワーク**: Remix (React-based)
- **データベース**: Prisma + Supabase
- **言語**: TypeScript/JavaScript
- **起動コマンド**: `cd api && npm run dev`
- **依存関係インストール**: `cd api && npm install`

### Shopifyテーマ (theme/)
- **テンプレート言語**: Liquid
- **スタイリング**: CSS + JavaScript
- **開発**: Shopify CLI使用
- **アップロード**: `shopify theme dev` または `shopify theme push`

## 重要なコマンド
- **Lint実行**: `cd api && npm run lint`
- **型チェック**: `cd api && npx tsc --noEmit`
- **データベース移行**: `cd api && npm run prisma migrate dev`
- **ビルド**: `cd api && npm run build`

## 環境変数
以下のファイルが必要:
- `api/.env.local` - Shopify App認証情報
- `api/.env.example` - 環境変数のテンプレート

## 特記事項
- Shopify App + Shopifyテーマのハイブリッド構成
- Supabaseでデータ管理
- レシピ生成機能（AI統合予定）
- 栄養成分分析機能付き
- レスポンシブUIデザイン