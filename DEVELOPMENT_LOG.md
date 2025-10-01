# 開発ログ - App Embed実装とトラブルシューティング

## 📅 2025-10-01: App Embed機能実装完了

### 🎯 実装内容
Theme App Extensionでフローティングボタンによるレシピ生成機能を実装

---

## 🐛 発生した問題と解決策

### 問題1: App Embedが表示されるがHTMLが出力されない

#### 症状
- App Embedsに「KOJIレシピ生成」が表示される
- トグルをONにしても右下に？ボタンが表示されない
- ブラウザでHTMLソースを確認すると `floating-button` クラスが存在しない
- CSS/JSファイルは正常に読み込まれている

#### 原因
1. **`app.settings` の誤用**
   - Liquidファイル内で `app.settings.*` を使用していた
   - Theme App Extensionでは `block.settings.*` を使う必要がある

2. **shopify.extension.toml の設定不足**
   - `[[extensions.blocks]]` セクションに `file` パスが指定されていなかった

#### 解決策

**修正1: liquidファイル内のすべての `app.settings` を `block.settings` に置換**

```liquid
<!-- 修正前 -->
{% if app.settings.show_floating_button %}
  <span class="button-text">{{ app.settings.button_text | default: '？' }}</span>
{% endif %}

<!-- 修正後 -->
{% if block.settings.show_floating_button %}
  <span class="button-text">{{ block.settings.button_text | default: '？' }}</span>
{% endif %}
```

**修正2: shopify.extension.toml にファイルパスを追加**

```toml
[[extensions.blocks]]
type = "recipe-button"
name = "KOJIレシピ生成"
target = "body"
file = "blocks/recipe-button.liquid"  # この行を追加
```

**修正3: デバッグ用に条件分岐を一時的にコメントアウト**

```liquid
<!-- デバッグ用：条件分岐を一時的にコメントアウト -->
<!-- {% if block.settings.show_floating_button %} -->
<div class="floating-button-container">
  <button class="floating-toggle-btn" onclick="toggleFormWindow()">
    <span class="button-text">{{ block.settings.button_text | default: '？' }}</span>
  </button>
</div>
<!-- {% endif %} -->
```

#### 結果
✅ 右下に？ボタンが表示されるようになった
✅ App Embedが正常に動作

---

### 問題2: ローカル開発でのApp Proxy問題

#### 症状
- `shopify app dev` でローカル開発中
- レシピ生成ボタンをクリックすると404エラー
- `POST /apps/recipe_gen/generate` が見つからない

#### 原因
**App Proxy URLは自動更新されない**

Web検索の結果、以下が判明：
- `automatically_update_urls_on_dev = true` は App URL と Redirect URL のみ更新
- **App Proxy URL は手動で更新する必要がある**（Shopifyの既知の制限）
- `shopify app dev` を実行するたびに Cloudflare トンネル URL が変わる
- ストア側の App Proxy 設定は一度インストールすると immutable（変更不可）

#### 解決策
**Vercel（本番環境）でテストする**

ローカル開発での App Proxy テストは非現実的なため、Vercelにデプロイしてテストすることを決定。

理由：
- Vercel URL は固定
- App Proxy が正しく動作する
- 毎回アプリを再インストールする必要がない

---

### 問題3: Vercelデプロイ後の500エラー

#### 症状
```
Error obtaining session table: PrismaClientInitializationError:
error: Environment variable not found: DATABASE_URL.
```

アプリをインストールすると "Application Error" が表示される

#### 原因
**Vercelの環境変数が不足**

`.env` ファイルはローカル開発用で、Vercel にはアップロードされない。
Vercel Dashboard で環境変数を設定する必要がある。

#### 解決策

**Vercel Dashboard → Settings → Environment Variables に追加**

必須の環境変数：
```
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxx:password@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
SHOPIFY_APP_URL=https://corazon-recipe-generator-v5.vercel.app
AZURE_OPENAI_ENDPOINT=https://corazon-prototype.openai.azure.com/openai/deployments/...
AZURE_OPENAI_API_KEY=xxxxx
```

**Environment** は `Production`, `Preview`, `Development` 全てにチェック

#### 結果
✅ Application Error が解消
✅ アプリが正常に動作

---

### 問題4: アプリ再インストール時のURL問題

#### 症状
- アンインストール後、再インストールしようとしたが404エラー
- `/api/auth?shop=...` にアクセスできない

#### 原因
**Remixの認証ルートが `/api/auth` ではなく `/auth`**

ルートファイル: `app/routes/auth.$.tsx`
→ パスは `/auth/*` になる

#### 解決策

正しいインストールURL：
```
https://corazon-recipe-generator-v5.vercel.app/auth?shop=corazon-muro-recipe-dev.myshopify.com
```

#### 結果
✅ 正常に再インストールできた

---

## 📚 学んだ重要なポイント

### 1. Theme App Extension の設定方法

- **`block.settings`** を使用（`app.settings` ではない）
- `shopify.extension.toml` に `file` パスの指定が必要
- `target = "body"` で App Embed として動作

### 2. App Proxy の制限事項

- **App Proxy URL は自動更新されない**
- `shopify app dev` では毎回 Cloudflare URL が変わる
- ローカル開発での App Proxy テストは非現実的
- 本番環境（Vercel）でテストする方が効率的

### 3. Vercel デプロイ時の注意点

- `.env` の環境変数は Vercel に自動アップロードされない
- Vercel Dashboard で手動設定が必要
- 環境変数変更後は必ず Redeploy が必要

### 4. Shopify アプリの URL 構造

- 認証: `/auth`
- App Proxy: `/apps/{subpath}/*`
- Remix の命名規則: `apps.{subpath}.{route}.tsx` → `/apps/{subpath}/{route}`

---

## 🔧 ファイル構成（最終版）

```
api/
├── extensions/
│   └── recipe-widget/
│       ├── blocks/
│       │   └── recipe-button.liquid  # block.settings を使用
│       ├── assets/
│       │   ├── recipe-modal.css
│       │   └── recipe-modal.js
│       ├── locales/
│       │   ├── en.default.json
│       │   └── ja.json
│       └── shopify.extension.toml    # file パス指定あり
├── app/
│   └── routes/
│       ├── auth.$.tsx                # /auth/*
│       └── apps.recipe_gen.generate.tsx  # /apps/recipe_gen/generate
└── shopify.app.toml                  # App Proxy 設定
```

---

## 🚀 デプロイ手順（決定版）

### ローカル開発
```bash
shopify app dev
```
- Theme App Extension のプレビュー
- App Proxy は動作しない（制限事項）

### 本番デプロイ
```bash
# 1. 変更をコミット
git add .
git commit -m "変更内容"

# 2. Gitにプッシュ（Vercelに自動デプロイ）
git push origin main

# 3. Extensionをデプロイ
shopify app deploy --force
```

### Vercel 環境変数の確認
- DATABASE_URL
- DIRECT_URL
- SHOPIFY_APP_URL
- AZURE_OPENAI_ENDPOINT
- AZURE_OPENAI_API_KEY

---

## 🎉 最終結果

- ✅ App Embed で右下にフローティングボタンが表示
- ✅ ボタンクリックでフォームが表示
- ✅ レシピ生成APIが正常に動作
- ✅ Vercel での本番環境が正常稼働

---

## 📝 今後の改善案

1. **条件分岐を有効化**
   - 現在は `block.settings.show_floating_button` をコメントアウト
   - 動作確認後、コメントを外して設定可能にする

2. **ngrok の導入検討**
   - ローカルでの App Proxy テストが必要な場合
   - 固定URLで開発可能

3. **環境変数管理の改善**
   - `.env.example` を作成してチーム共有
   - Vercel の環境変数を定期的に確認

---

## 🔗 参考リンク

- [Shopify Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)
- [App Proxy Configuration](https://shopify.dev/docs/apps/build/online-store/display-dynamic-data)
- [Shopify CLI - App Configuration](https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration)

---

**記録日時**: 2025-10-01
**開発者**: Claude Code + Ryu Fukaya
**プロジェクト**: Corazón Recipe Generator
