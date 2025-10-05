# DIFY Workflow設定：栄養素計算・減塩効果機能

## 📋 概要
レシピに材料の分量、栄養価、減塩効果を追加するためのDIFY Workflow設定手順

## 🔧 Structured Output Schema更新

### 現在のSchema（推定）
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
          "ingredients": { "type": "array" },
          "steps": { "type": "array" },
          "benefit": { "type": "string" }
        }
      }
    }
  }
}
```

### 更新後のSchema
```json
{
  "type": "object",
  "properties": {
    "recipes": {
      "type": "array",
      "minItems": 3,
      "maxItems": 3,
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "レシピ名"
          },
          "ingredients": {
            "type": "array",
            "description": "材料リスト（分量付き）",
            "items": {
              "type": "object",
              "properties": {
                "item": {
                  "type": "string",
                  "description": "材料名"
                },
                "amount": {
                  "type": "number",
                  "description": "分量（数値）"
                },
                "unit": {
                  "type": "string",
                  "description": "単位（g, ml, 個など）"
                }
              },
              "required": ["item", "amount", "unit"]
            }
          },
          "steps": {
            "type": "array",
            "description": "調理手順",
            "items": {
              "type": "object",
              "properties": {
                "step_number": { "type": "number" },
                "description": { "type": "string" }
              },
              "required": ["step_number", "description"]
            }
          },
          "benefit": {
            "type": "string",
            "description": "このレシピの健康効果"
          },
          "nutrition": {
            "type": "object",
            "description": "栄養価情報（1人前あたり）",
            "properties": {
              "protein": {
                "type": "number",
                "description": "タンパク質（g）"
              },
              "fat": {
                "type": "number",
                "description": "脂質（g）"
              },
              "carbs": {
                "type": "number",
                "description": "炭水化物（g）"
              },
              "sodium": {
                "type": "number",
                "description": "ナトリウム（mg）"
              },
              "calories": {
                "type": "number",
                "description": "カロリー（kcal）"
              }
            },
            "required": ["protein", "fat", "carbs", "sodium", "calories"]
          },
          "comparison": {
            "type": "object",
            "description": "従来レシピとの比較（減塩効果）",
            "properties": {
              "traditionalSodium": {
                "type": "number",
                "description": "従来レシピの塩分量（mg）"
              },
              "sodiumReduction": {
                "type": "number",
                "description": "減塩率（%）"
              },
              "kojiEffect": {
                "type": "string",
                "description": "麹の旨味成分による効果説明（1文）"
              }
            },
            "required": ["traditionalSodium", "sodiumReduction", "kojiEffect"]
          }
        },
        "required": ["name", "ingredients", "steps", "benefit", "nutrition", "comparison"]
      }
    }
  },
  "required": ["recipes"]
}
```

## 📝 プロンプト更新内容

### 既存プロンプトに以下を追加

```
## 🏪 MUROの麹製品について（重要）

**全てのMURO製品は米麹ベース**です。以下の製品を正確に使い分けてください：

### MUROの製品ラインナップ
1. **MUROの塩麹** (米麹 + 塩)
   - 用途: 肉・魚の下味、炒め物、スープ
   - 塩分: 約13% (100gあたりナトリウム約8000mg)
   - 効果: 塩分を30-40%削減しながら旨味を引き出す

2. **MUROの醤油麹** (米麹 + 醤油)
   - 用途: 和食全般、漬物、タレ
   - 塩分: 約10% (100gあたりナトリウム約6200mg)
   - 効果: 醤油の使用量を50%削減、コクと旨味アップ

3. **MUROの甘麹（甘酒）** (米麹のみ)
   - 用途: 甘味料、デザート、スムージー
   - 塩分: 0% (砂糖の代替品)
   - 効果: 砂糖不使用で自然な甘み、腸内環境改善

### ⚠️ 重要なルール
- レシピには具体的な製品名を使用（「MUROの塩麹」「MUROの醤油麹」など）
- 単に「MUROの米麹」とは書かない（どの製品か不明確なため）
- 料理に合わせて適切な製品を選択

## 🥗 材料の分量指定（必須）

すべての材料に具体的な分量を記載してください：
- **amount**: 数値（例: 200, 30, 1）
- **unit**: 単位（例: g, ml, 個, 大さじ）
- **基準**: 1人前の分量

例:
{
  "item": "鶏むね肉",
  "amount": 200,
  "unit": "g"
}

## 📊 栄養価計算（必須）

文部科学省「日本食品標準成分表」に基づき、1人前あたりの栄養価を計算：

1. **タンパク質（protein）**: g単位、小数点第1位まで
2. **脂質（fat）**: g単位、小数点第1位まで
3. **炭水化物（carbs）**: g単位、小数点第1位まで
4. **ナトリウム（sodium）**: mg単位、整数
5. **カロリー（calories）**: kcal単位、整数

計算例:
- 鶏むね肉200g: タンパク質44g, 脂質2g, 炭水化物0g, ナトリウム140mg, カロリー230kcal
- 塩麹30g: タンパク質0.9g, 脂質0.1g, 炭水化物6g, ナトリウム2400mg, カロリー28kcal

## 🧂 減塩効果の比較（必須）

同じ料理を麹なしで作った場合との比較を計算：

1. **traditionalSodium**: 麹を使わず、通常の塩で同じ塩味にした場合のナトリウム量（mg）
2. **sodiumReduction**: 減塩率（%） = ((traditionalSodium - 麹レシピのsodium) / traditionalSodium) × 100
3. **kojiEffect**: 麹の旨味成分（アミノ酸、ペプチド）による健康効果を1文で説明

計算ロジック:
- 麹の旨味成分（グルタミン酸等）は塩の約1.5倍の塩味感を与える
- 例: 塩麹2400mgのナトリウム ≒ 通常の塩3600mg相当の塩味

出力例:
{
  "traditionalSodium": 800,
  "sodiumReduction": 43.75,
  "kojiEffect": "麹の旨味成分により、塩分を43%カットしても同等の塩味を実現し、高血圧予防に貢献"
}

## ✅ 最終チェック

出力前に以下を確認：
- [ ] すべての材料にamount, unitが付いている
- [ ] nutrition の5項目すべて計算済み
- [ ] comparison の3項目すべて記載済み
- [ ] 減塩率が0%以上である（麹の効果がある）
```

## 🎯 出力例（完全版）

```json
{
  "recipes": [
    {
      "name": "塩麹チキンソテー",
      "ingredients": [
        { "item": "鶏むね肉", "amount": 200, "unit": "g" },
        { "item": "塩麹", "amount": 30, "unit": "g" },
        { "item": "オリーブオイル", "amount": 10, "unit": "ml" },
        { "item": "レモン", "amount": 0.5, "unit": "個" }
      ],
      "steps": [
        { "step_number": 1, "description": "鶏むね肉に塩麹をまぶし、冷蔵庫で30分漬ける" },
        { "step_number": 2, "description": "フライパンにオリーブオイルを熱し、中火で両面を焼く" },
        { "step_number": 3, "description": "レモンを絞ってかけ、完成" }
      ],
      "benefit": "高タンパク低脂質で疲労回復に効果的。塩麹の酵素が肉を柔らかくし消化を助けます。",
      "nutrition": {
        "protein": 45.2,
        "fat": 12.5,
        "carbs": 6.3,
        "sodium": 450,
        "calories": 320
      },
      "comparison": {
        "traditionalSodium": 800,
        "sodiumReduction": 43.75,
        "kojiEffect": "麹の旨味成分により、塩分を43%カットしても同等の塩味を実現し、高血圧予防に貢献"
      }
    }
  ]
}
```

## 🔄 DIFY Workflow設定手順

### 1. DIFY Dashboard にアクセス
https://cloud.dify.ai/

### 2. Workflow を開く
該当のRecipe Generator Workflowを選択

### 3. LLM ノードの設定更新

#### 3-1. Output Schema更新
- LLMノードを選択
- "Model Response" セクション → "Structured Output"
- 上記の「更新後のSchema」をコピー＆ペースト

#### 3-2. プロンプト更新
- "System Prompt" または "User Prompt" セクション
- 上記の「プロンプト更新内容」を既存プロンプトに追加

### 4. テスト実行

**テスト入力:**
```json
{
  "condition": "疲れやすい",
  "needs": "",
  "kojiType": "塩麹",
  "otherIngredients": "鶏肉",
  "customerSex": "",
  "customerAge": ""
}
```

**期待される出力:**
- 3つのレシピが生成される
- すべての材料にamount, unitがある
- nutritionフィールドが正しく計算されている
- comparisonフィールドに減塩効果が記載されている

### 5. Publish（公開）
- テスト成功後、"Publish" ボタンをクリック
- 本番環境に反映

## ⚠️ トラブルシューティング

### エラー: "Structured Output validation failed"
→ Schema の typo を確認。すべてのフィールドが required に含まれているか確認

### 栄養価の計算が不正確
→ プロンプトに「文部科学省 食品成分表を参照」と明記
→ LLMモデルをGPT-4に変更（精度向上）

### 減塩率が0%になる
→ プロンプトで「麹の旨味効果で塩分削減できることを強調」

## 📚 参考資料

- [文部科学省 日本食品標準成分表](https://www.mext.go.jp/a_menu/syokuhinseibun/mext_01110.html)
- [DIFY Structured Output ドキュメント](https://docs.dify.ai/guides/workflow/node/llm#structured-output)
- [麹の栄養成分と健康効果](https://www.maff.go.jp/)
