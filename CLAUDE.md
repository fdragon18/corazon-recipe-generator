# Claude Code 開発管理システム - Corazón レシピジェネレーター

## 🎯 現在のステータス（2024-09-24）
- **アクティブフェーズ**: Phase 1 - セキュアAPI基盤構築（プライベートアプリ）
- **現在のブランチ**: feature/phase-1-api-foundation
- **対応Issue**: #1 (https://github.com/fdragon18/corazon-recipe-generator/issues/1)
- **アーキテクチャ**: プライベートShopifyアプリ + Script Tag
- **認証方式**: Shopify Private App Token
- **セキュリティレベル**: 基本セキュリティ担保（開発スピード重視）
- **期限**: 本日中（2024-09-24 17:00目標）
- **進捗**: 🔒 Private App Token認証実装中

## 📋 フェーズ管理・開発ロードマップ

### Phase 1: セキュアAPI基盤構築 [🔒 実装中 - 本日中]
- **目標**: Private App Token認証 + Azure OpenAI統合 + セキュリティ実装
- **Issue**: #1 (https://github.com/fdragon18/corazon-recipe-generator/issues/1)
- **ブランチ**: feature/phase-1-api-foundation
- **期限**: 2024-09-24 17:00
- **完了条件**: Private App Token認証付き `/api/recipes/generate` エンドポイント
- **セキュリティ**: CORS設定・Rate Limiting・Token検証

### Phase 2: Script Tag統合 [⏳ 待機中 - 明日午前]
- **目標**: nutrition-widget.liquidでPrivate App Token使用
- **Issue**: #2 (https://github.com/fdragon18/corazon-recipe-generator/issues/2)
- **ブランチ**: feature/phase-2-script-tag-integration
- **期限**: 2024-09-25 12:00
- **実装内容**: Shop情報自動取得・Token安全送信・セキュアヘッダー
- **依存**: Phase 1完了後

### Phase 3: Shopify Admin API連携 [⏳ 待機中 - 明日午後]
- **目標**: Private App権限でCustomer・Order情報取得
- **Issue**: #3 (https://github.com/fdragon18/corazon-recipe-generator/issues/3)
- **ブランチ**: feature/phase-3-admin-api-integration
- **期限**: 2024-09-25 18:00
- **実装内容**: Admin API (REST/GraphQL)・Customer情報・購入履歴連携
- **依存**: Phase 2完了後

### Phase 4-9: 拡張機能群 [📅 今後実装]
- Phase 4: 栄養価API統合
- Phase 5: 栄養価表示機能
- Phase 6: 麹減塩効果機能
- Phase 7: 商品別AI切り替え
- Phase 8: 専門家AI選択
- Phase 9: パーソナル栄養計算

## 🤖 Claude Code 作業指示書

### 作業開始時のチェックリスト
1. `git status` でブランチ確認
2. 対応するGitHub Issue確認 (`gh issue view <number>`)
3. CLAUDE.mdの「現在のステータス」更新
4. 制限時間とゴールを明確化
5. 実装開始

### 作業完了時のチェックリスト
1. 機能テスト実行・動作確認
2. エラーハンドリング確認
3. コミット作成（日本語メッセージ）
4. GitHub Issue更新（進捗・結果報告）
5. 次フェーズの準備（ブランチ作成等）
6. CLAUDE.md ステータス更新

### コード実装時の重要ルール
- **日本語**: コミット・コメント・説明は必ず日本語
- **参考実装**: `theme/sections/nutrition-widget.liquid` を最大活用
- **エラーハンドリング**: 必須実装（API制限・ネットワークエラー等）
- **環境変数**: APIキー等は必ず環境変数で外部化
- **セキュリティ**: シークレット情報のハードコーディング禁止

## 🚨 緊急時対応・リスク管理
- **Azure OpenAI API制限**: Difyへの切り替え検討
- **Shopify認証エラー**: 認証なし版での並行開発
- **時間不足**: MVP版への縮小実装
- **Vercelデプロイエラー**: ローカル動作確認後の段階的デプロイ

## 📈 本日の開発進捗ダッシュボード

### 今日の目標タイムライン (2024-09-24)
- [🔄] 10:00-10:30: プロジェクト管理システム構築
- [⏳] 10:30-11:00: GitHub Issues作成
- [⏳] 11:00-11:30: Azure OpenAI API Proxy作成
- [⏳] 11:30-12:00: Shopify認証設定
- [⏳] 12:00-12:30: Vercelデプロイ設定
- [⏳] 13:30-14:30: 基本APIテスト & デバッグ
- [⏳] 14:30-15:30: 動作確認 & 最適化
- [⏳] 15:30-16:00: Phase 2準備 & 引き継ぎ整理

### 実装済み機能
- [✅] プロジェクトGitHub設定
- [✅] CLAUDE.md管理システム
- [🔄] Phase 1計画策定（進行中）

### 次回作業時の引き継ぎ事項
（作業完了後に更新）

## 言語設定・開発規約
- **重要**: このプロジェクトの開発者は日本人のため、すべてのコミットメッセージとコメントは日本語で記述
- コード内のコメントも日本語で記述
- エラーメッセージや説明も日本語で実装

## 🍴 プロジェクト概要
プライベートShopifyアプリとして動作するAI搭載レシピジェネレーター
- **アーキテクチャ**: プライベートアプリ + Script Tag統合
- **AI統合**: Azure OpenAI (GPT-4) でパーソナライズドレシピ生成
- **数据管理**: Supabase (PostgreSQL) + Shopify Admin API連携
- **セキュリティ**: Private App Token認証 + CORS + Rate Limiting
- **健康機能**: 朔による減塩効果・栄養価分析

## 🔒 セキュリティ方針
- **レベル**: 基本セキュリティ担保（プライベートアプリ前提）
- **認証**: Shopify Private App Token検証 (shpat_xxxxx)
- **CORS**: Shopifyドメイン限定 (*.myshopify.com)
- **Rate Limiting**: API呼び出し制限 (10req/min)
- **データ保護**: Supabase Row Level Security + Token暗号化
- **ログ監視**: アクセスログ・エラーログ記録

## 🏠 アーキテクチャ構成
```
🌍 Shopify Store (プライベートアプリ)
├── 📜 Script Tag → Vercel API
├── 🔑 Private App Token認証
└── 📈 Customer・Orderデータ連携

🌎 Vercel API (セキュアエンドポイント)
├── /api/recipes/generate (Token認証)
├── 🤖 Azure OpenAI統合
└── 🗄 Supabaseデータ保存
```

## 📁 ファイル構造
```
corazon-recipe-generator/
├── api/                    # Vercel API (Remix)
│   ├── app/               # APIエンドポイント
│   │   └── routes/        # レシピ生成API
│   ├── prisma/            # Supabaseスキーマ
│   └── vercel.json        # Vercel設定
└── theme/                 # Shopifyテーマ
    ├── sections/          # nutrition-widget.liquid
    └── templates/         # パスタレシピページ等
```

## 🔧 技術スタック

### Vercel API (api/)
- **フレームワーク**: Remix (軽量化・App Bridge削除済み)
- **認証**: Shopify Private App Token (shpat_xxxxx)
- **データベース**: Supabase (PostgreSQL) + Prisma ORM
- **AI統合**: Azure OpenAI API (GPT-4)
- **言語**: TypeScript
- **デプロイ**: Vercel Serverless Functions
- **起動**: `cd api && npm run dev` (ローカル開発)

### Shopify統合 (theme/)
- **統合方式**: Script Tag + Private App Token
- **テンプレート**: Liquid (nutrition-widget.liquid)
- **セキュリティ**: Shop情報自動取得 + Token安全送信
- **開発**: Shopify CLI (`shopify theme dev`)
- **デプロイ**: `shopify theme push`

### セキュリティ層
- **CORS**: プリフライト + ドメイン制限
- **Rate Limiting**: Redis/Upstash (1分間5-10リクエスト)
- **トークン検証**: Shopify Admin APIでToken有効性確認

## 重要なコマンド
- **Lint実行**: `cd api && npm run lint`
- **型チェック**: `cd api && npx tsc --noEmit`
- **データベース移行**: `cd api && npm run prisma migrate dev`
- **ビルド**: `cd api && npm run build`

## 🔑 環境変数設定

### `api/.env.local` (必須設定)
```env
# Shopify Private App (プライベートアプリ)
SHOPIFY_PRIVATE_APP_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
SHOPIFY_SHOP_NAME=your-shop

# APIセキュリティ
API_SECRET_KEY=your_random_32_char_secret_key_here
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MINUTES=1

# Azure OpenAI (既存設定)
AZURE_OPENAI_ENDPOINT=https://corazon-prototype.openai.azure.com/...
AZURE_OPENAI_API_KEY=your_azure_openai_key

# Supabase (既存設定)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_connection_string
```

### Vercel環境変数
本番環境では Vercel Dashboard で同様の値を設定

## ✨ 特記事項

### プライベートアプリのメリット
- **OAuth不要**: Private App Tokenでシンプル認証
- **App Store審査不要**: 開発スピード向上
- **管理画面埋め込み不要**: App Bridge削除で軽量化
- **直接API認証**: シンプルなToken認証

### 機能特徴
- **AI統合**: Azure OpenAI (GPT-4) でパーソナライズドレシピ生成
- **数据連携**: Shopify Customer・Order情報とレシピ履歴の統合
- **朔効果**: 減塩効果計算・栄養価分析機能
- **セキュリティ**: 基本セキュリティ担保 + 開発効率最適化
- **レスポンシブ**: モバイルファーストUIデザイン

### 開発フローの最適化
- **フェーズ別開発**: セキュリティ → 連携 → 拡張機能
- **段階的実装**: 動作するMVP優先、後から機能強化
- **テスト駆動**: 各フェーズで動作確認を必須実行