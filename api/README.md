# レシピジェネレーターアプリ

AIを活用したレシピ生成アプリケーションです。[Remix](https://remix.run)フレームワークを使用して構築されています。

## 機能

- AI搭載のレシピ生成
- 食材に基づいたレシピ提案
- ユーザーフレンドリーなインターフェース
- レスポンシブデザイン

## クイックスタート

### 前提条件

開始する前に、以下が必要です：

1. **Node.js**: まだインストールしていない場合は[ダウンロードしてインストール](https://nodejs.org/en/download/)してください。
2. **AI API キー**: レシピ生成にはAI APIが必要です。

### セットアップ

yarnを使用する場合:

```shell
yarn install
```

npmを使用する場合:

```shell
npm install
```

pnpmを使用する場合:

```shell
pnpm install
```

### ローカル開発

yarnを使用する場合:

```shell
yarn dev
```

npmを使用する場合:

```shell
npm run dev
```

pnpmを使用する場合:

```shell
pnpm run dev
```

開発サーバーが起動したら、ブラウザでアプリケーションを確認できます。

## 使用方法

1. アプリケーションを起動
2. 使用したい食材を入力
3. AIがレシピを生成
4. 生成されたレシピを確認・保存

## プロジェクト構成

### 技術スタック

- **フロントエンド**: Remix (React ベース)
- **データベース**: Supabase (PostgreSQL)
- **デプロイ**: Vercel
- **AI API**: OpenAI / Claude API
- **スタイリング**: Tailwind CSS
- **UI コンポーネント**: Radix UI / Shadcn/ui

### アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Vercel       │    │    Supabase     │    │   AI Service    │
│   (Frontend)    │◄──►│   (Database)    │    │  (OpenAI/Claude)│
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       ▲
         │                       │                       │
         ▼                       ▼                       │
┌─────────────────────────────────────────────────────────────────┐
│                    Remix Application                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Routes    │  │ Components  │  │      AI Integration     │ │
│  │             │  │             │  │                         │ │
│  │ - Home      │  │ - RecipeCard│  │ - Recipe Generation     │ │
│  │ - Generate  │  │ - Form      │  │ - Ingredient Analysis   │ │
│  │ - History   │  │ - Layout    │  │ - AI API Calls          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### データベーススキーマ (Supabase)

```sql
-- ユーザーテーブル
users (
  id: uuid PRIMARY KEY,
  email: text UNIQUE,
  created_at: timestamp
)

-- レシピテーブル
recipes (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  title: text,
  ingredients: text[],
  instructions: text,
  prep_time: integer,
  cook_time: integer,
  servings: integer,
  created_at: timestamp
)

-- お気に入りテーブル
favorites (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  recipe_id: uuid REFERENCES recipes(id),
  created_at: timestamp
)
```

## デプロイメント

### 環境変数

`.env` ファイルを作成し、以下の環境変数を設定してください：

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# AI API
OPENAI_API_KEY=your_openai_api_key
# または
CLAUDE_API_KEY=your_claude_api_key

# アプリケーション
SESSION_SECRET=your_session_secret
```

### Vercelへのデプロイ

1. Vercelアカウントを作成
2. GitHubリポジトリを接続
3. 環境変数を設定
4. デプロイ実行

```shell
npm run build
```

### Supabaseセットアップ

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. データベーススキーマを実行
3. 環境変数にURLとAPIキーを設定

## 開発に参加

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを開く

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 関連リンク

- [Remix ドキュメント](https://remix.run/docs)
- [Supabase ドキュメント](https://supabase.com/docs)
- [Vercel ドキュメント](https://vercel.com/docs)
- [OpenAI API ドキュメント](https://platform.openai.com/docs)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/docs)
