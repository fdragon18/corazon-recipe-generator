# Nutritionix API 設定手順（無料プラン）

## 📋 概要

- **API**: Nutritionix Natural Language API
- **料金**: 無料（月50,000リクエストまで）
- **精度**: ±5%（医療レベル）
- **日本食対応**: 一部対応

---

## 🚀 アカウント作成手順

### Step 1: サインアップ

1. https://www.nutritionix.com/business/api にアクセス
2. 「Get Started Free」をクリック
3. メールアドレス・パスワードを入力して登録

### Step 2: APIキー取得

1. ダッシュボードにログイン
2. 「API Keys」セクションに移動
3. 以下の2つのキーをコピー：
   - **Application ID** (`x-app-id`)
   - **Application Key** (`x-app-key`)

---

## ⚙️ 環境変数設定

### Vercel環境変数追加

```bash
# Vercel CLIで追加
vercel env add NUTRITIONIX_APP_ID production
# → Application IDを入力

vercel env add NUTRITIONIX_APP_KEY production
# → Application Keyを入力

# Preview/Development環境にも追加
vercel env add NUTRITIONIX_APP_ID preview
vercel env add NUTRITIONIX_APP_KEY preview
```

### または Vercelダッシュボードで追加

1. https://vercel.com/dashboard にアクセス
2. プロジェクト → Settings → Environment Variables
3. 以下を追加：
   - `NUTRITIONIX_APP_ID`: [Application ID]
   - `NUTRITIONIX_APP_KEY`: [Application Key]
4. Environments: Production, Preview, Development すべて選択

---

## 📊 DIFY プロンプト簡素化（重要）

### 変更前（AI計算 - 不要）

```
## 栄養価計算（必須）
文部科学省「日本食品標準成分表」に基づき、1人前あたりの栄養価を計算：
- タンパク質（protein）: g単位、小数点第1位まで
- 脂質（fat）: g単位、小数点第1位まで
...（長いプロンプト）
```

### 変更後（材料の構造化のみ）

```
## 材料の分量指定（必須）

すべての材料に具体的な分量を記載してください：
- **item**: 材料名（例: "鶏むね肉"）
- **amount**: 数値（例: 200）
- **unit**: 単位（例: "g", "ml", "個"）
- **基準**: 1人前の分量

例:
{
  "item": "鶏むね肉",
  "amount": 200,
  "unit": "g"
}

**注意**: 栄養価の計算は不要です。システム側でNutritionix APIを使用して自動計算します。
```

### DIFYのStructured Output Schema変更

**nutrition, comparisonフィールドを削除：**

```json
{
  "type": "object",
  "properties": {
    "recipes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "ingredients": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "item": { "type": "string" },
                "amount": { "type": "number" },
                "unit": { "type": "string" }
              },
              "required": ["item", "amount", "unit"]
            }
          },
          "steps": { "type": "array" },
          "benefit": { "type": "string" }
          // nutrition, comparison は削除（APIで計算するため）
        },
        "required": ["name", "ingredients", "steps", "benefit"]
      }
    }
  }
}
```

---

## 🧪 テスト

### ローカルテスト

```bash
# .env.local に追加
NUTRITIONIX_APP_ID=your_app_id
NUTRITIONIX_APP_KEY=your_app_key

# 開発サーバー起動
npm run dev
```

### curlでテスト

```bash
curl -X POST https://corazon-recipe-generator-v5.vercel.app/apps/recipe_gen/generate \
  -H "Content-Type: application/json" \
  -d '{
    "condition": "疲れやすい",
    "kojiType": "塩麹",
    "otherIngredients": "鶏肉"
  }'
```

**期待される出力:**
```json
{
  "success": true,
  "recipes": [
    {
      "name": "塩麹チキン",
      "ingredients": [
        { "item": "鶏むね肉", "amount": 200, "unit": "g" },
        { "item": "塩麹", "amount": 30, "unit": "g" }
      ],
      "steps": [...],
      "benefit": "...",
      "nutrition": {
        "protein": 45.2,
        "fat": 3.5,
        "carbs": 5.3,
        "sodium": 450,
        "calories": 230
      },
      "comparison": {
        "traditionalSodium": 800,
        "sodiumReduction": 43.75,
        "kojiEffect": "塩麹の旨味成分（グルタミン酸）により、塩分を43%削減しながら同等の塩味を実現し、高血圧予防に貢献"
      }
    }
  ]
}
```

---

## 💰 料金プラン

| プラン | 料金 | リクエスト数 |
|--------|------|-------------|
| **Free** | $0 | 50,000/月 |
| **Pro** | $79/月 | 500,000/月 |

**現在のアプリ規模（月1000件想定）:**
- 完全無料で十分 ✅
- 将来50,000件を超える場合のみ有料プラン検討

---

## 🔧 トラブルシューティング

### エラー: 401 Unauthorized

**原因:** APIキーが間違っている

**対処法:**
1. Nutritionixダッシュボードでキーを確認
2. Vercel環境変数を再設定
3. Vercelで再デプロイ（Redeploy）

### エラー: 404 Not Found（食材が見つからない）

**原因:** 日本語食材がNutritionix DBに存在しない

**対処法:**
1. 英語名で試す（例: "shio koji" → "salt koji"）
2. 類似食材で代替（例: "塩麹" → "miso"）
3. 将来的にカスタム食材DBを追加検討

### 栄養価が0になる

**原因:** APIキーが未設定 or エラー

**対処法:**
1. コンソールログを確認: `⚠️ Nutritionix APIキーが未設定`
2. 環境変数を確認: `echo $NUTRITIONIX_APP_ID`
3. デフォルト値が返されている（APIエラー時のフォールバック）

---

## 📚 参考リンク

- [Nutritionix API ドキュメント](https://docs.nutritionix.com/v2/natural-language-for-nutrients)
- [Nutritionix ダッシュボード](https://www.nutritionix.com/dashboard)
- [料金プラン](https://www.nutritionix.com/business/api)

---

## ✅ チェックリスト

デプロイ前に以下を確認：

- [ ] Nutritionixアカウント作成完了
- [ ] APIキー（App ID + App Key）取得
- [ ] Vercel環境変数に設定（Production/Preview/Development）
- [ ] DIFYプロンプトから栄養計算指示を削除
- [ ] DIFY Structured Outputから nutrition/comparison を削除
- [ ] Vercel再デプロイ実行
- [ ] curlでテスト実行
- [ ] 栄養価が正しく表示されることを確認
