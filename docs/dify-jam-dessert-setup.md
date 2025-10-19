# DIFY Workflow設定：JAMサイト専用デザートレシピ分岐機能

## 📋 概要
JAMサイトからのリクエストを検知し、通常の麹レシピではなく、JAMを使ったデザート・スイーツレシピを生成する機能の設定手順。

## 🎯 機能仕様

### サイト種別の判定
- **通常サイト** (`siteType: 'normal'`) → 麹を使った健康レシピ
- **JAMサイト** (`siteType: 'jam'`) → JAM/ジャムを使ったデザートレシピ

### 判定方法
1. **FormDataの`siteType`フィールド**（優先）
   - JAMサイトのフォームに `<input type="hidden" name="siteType" value="jam">` を追加
2. **Refererヘッダーのドメイン判定**（フォールバック）
   - `jam.corazon-muro.com` を含む → JAMサイト
   - それ以外 → 通常サイト

---

## 🔧 DIFY Workflow設定手順

### Phase 1: Startノードに変数追加

#### 1-1. Startノードを開く
DIFY管理画面 → Workflow → Start ノードをクリック

#### 1-2. 新しい入力変数を追加
**「Add Input Variable」** をクリックして以下を設定：

```yaml
変数名: siteType
型: string
Required: false
Default value: normal
Description: サイト種別（'jam' = JAMサイト、'normal' = 通常サイト）
```

**既存の変数:**
- condition (string)
- needs (string)
- kojiType (string)
- otherIngredients (string)
- customerSex (string)
- customerAge (string)

---

### Phase 2: IF/ELSEノードを追加

#### 2-1. IF/ELSEノードを作成
1. Startノードの下に「+」ボタンをクリック
2. 「IF/ELSE」ノードを選択
3. Startノードと接続

#### 2-2. 条件を設定
**IF条件:**
- Variable: `{`を入力 → 「Start」→「siteType」を選択
- Condition: `is`
- Value: `jam`

**説明:**
- IF分岐（TRUE）: `siteType == 'jam'` → JAMデザートレシピ生成
- ELSE分岐（FALSE）: それ以外 → 麹レシピ生成

---

### Phase 3: LLM Node (JAM専用) を作成

#### 3-1. LLMノードを追加
1. IF分岐の下に「+」ボタン → 「LLM」を選択
2. ノード名を「LLM_JAM_Dessert」に変更（任意）

#### 3-2. System Promptを設定

```markdown
あなたはJAM（ジャム・コンフィチュール）とデザートの専門家です。
MUROのジャム製品を使った美味しいデザート・スイーツのレシピを提案します。

## 🏪 MUROのジャム製品について

### MUROの製品ラインナップ（例）
- いちごジャム
- ブルーベリージャム
- オレンジマーマレード
- あんずジャム
- キウイジャム

### ⚠️ 重要なルール
- レシピには具体的な製品名を使用（「MUROのいちごジャム」など）
- ジャムの甘みを活かしたデザート・スイーツに特化
- 見た目の美しさも重視
- 簡単に作れるレシピを優先

## 🥗 材料の分量指定（必須）

すべての材料に具体的な分量を記載してください：
- **amount**: 数値（例: 200, 30, 1）
- **unit**: 単位（例: g, ml, 個, 大さじ）
- **基準**: 1人前の分量

例:
{
  "item": "MUROのいちごジャム",
  "amount": 50,
  "unit": "g"
}

## 📊 出力形式（必須）

以下の形式で必ず3つのレシピをJSON形式で返してください：
{
  "recipes": [
    {
      "name": "デザート名",
      "ingredients": [
        {
          "item": "材料名",
          "amount": 数値,
          "unit": "単位"
        }
      ],
      "steps": [
        {
          "step_number": 1,
          "description": "手順の説明"
        }
      ],
      "benefit": "このデザートの魅力や特徴、健康効果"
    }
  ]
}

## 🎨 レシピの多様性（重要）

各レシピは異なるタイプで提案してください：
1つ目：簡単な冷製デザート（ヨーグルト、アイス、ゼリーなど）
2つ目：焼き菓子・ケーキ（マフィン、パウンドケーキ、タルトなど）
3つ目：ドリンク・スムージー（ラッシー、スムージー、ジュースなど）

## 🚨 【最重要】ユーザー入力への対応

ユーザーから提供される以下の情報を**必ず**レシピに反映してください：
- お好みやご要望
- 食事の希望
- 使いたいジャムの種類
- その他使いたい食材

同じユーザーでも、**入力内容が変われば必ず異なるレシピを生成**してください。
定番レシピの繰り返しは厳禁です。
```

#### 3-3. User Promptを設定

プロンプトエディタで以下を入力：
- テキスト部分は手入力
- **変数部分は`{`キーで変数挿入メニューを開いて選択**

```markdown
ユーザー情報：
- お好みやご要望：    ← ここで`{`を入力 → 「Start」→「condition」を選択
- 食事の希望：        ← ここで`{`を入力 → 「Start」→「needs」を選択
- 使いたいジャム：    ← ここで`{`を入力 → 「Start」→「kojiType」を選択
- その他使いたい食材：← ここで`{`を入力 → 「Start」→「otherIngredients」を選択
- 性別：              ← ここで`{`を入力 → 「Start」→「customerSex」を選択
- 年齢：              ← ここで`{`を入力 → 「Start」→「customerAge」を選択

【最重要】
上記のユーザー情報を必ず反映したジャムデザートを3つ生成してください。
特に「    ← conditionをもう一度挿入  」に最適化されたデザートを作成してください。

同じユーザーでも、入力内容が変われば必ず異なるレシピを生成してください。
定番レシピの繰り返しは厳禁です。
```

**完成イメージ:**
```
ユーザー情報：
- お好みやご要望：[condition変数ブロック]
- 食事の希望：[needs変数ブロック]
- 使いたいジャム：[kojiType変数ブロック]
- その他使いたい食材：[otherIngredients変数ブロック]
```

#### 3-4. Structured Output設定

LLMノードの「Output」セクションで、Structured Outputを有効化：

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
            "description": "デザート名"
          },
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
          "steps": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "step_number": { "type": "number" },
                "description": { "type": "string" }
              },
              "required": ["step_number", "description"]
            }
          },
          "benefit": { "type": "string" }
        },
        "required": ["name", "ingredients", "steps", "benefit"]
      }
    }
  },
  "required": ["recipes"]
}
```

---

### Phase 4: LLM Node (麹レシピ) の維持

#### 4-1. ELSE分岐に既存のLLMノードを接続

**オプションA: 既存のLLMノードを移動**
1. 既存のLLMノード（麹レシピ用）を選択
2. ELSE分岐に接続

**オプションB: 新しいLLMノードを作成してプロンプトをコピー**
1. ELSE分岐の下に新しいLLMノードを追加
2. 既存の麹レシピ用プロンプトをコピー&ペースト

---

### Phase 5: Answer Nodeで結果を統合

#### 5-1. Answer Nodeを確認
1. 両方のLLMノード（JAM専用 & 麹レシピ）の出力を同じAnswer Nodeに接続
2. Answer Nodeの設定で出力変数を確認

#### 5-2. 出力形式
両方のLLMノードから同じJSON形式（`recipes`配列）が返るため、Answer Nodeは自動的に適切なレスポンスを返します。

---

### Phase 6: Publish（公開）

1. **「Publish」ボタン**をクリック
2. 変更内容を確認
3. 本番環境に公開

---

## 🧪 テスト方法

### テスト1: 通常サイト（麹レシピ）

**DIFY管理画面のテスト実行:**
```json
{
  "condition": "疲労回復",
  "needs": "高タンパク質",
  "kojiType": "塩麹",
  "otherIngredients": "鶏肉",
  "customerSex": "男性",
  "customerAge": "30",
  "siteType": "normal"
}
```

**期待される結果:**
- ✅ ELSE分岐が実行される
- ✅ 麹レシピ用LLMノードが動作
- ✅ 塩麹を使った健康レシピ3つが生成される

**確認ポイント:**
- レシピ名に「塩麹」が含まれている
- 高タンパク質の材料（鶏肉など）が使われている
- `benefit`に「疲労回復」に関する説明がある

---

### テスト2: JAMサイト（デザートレシピ）

**DIFY管理画面のテスト実行:**
```json
{
  "condition": "甘いものが食べたい",
  "needs": "低カロリー",
  "kojiType": "いちごジャム",
  "otherIngredients": "ヨーグルト",
  "customerSex": "女性",
  "customerAge": "25",
  "siteType": "jam"
}
```

**期待される結果:**
- ✅ IF分岐が実行される
- ✅ JAM専用LLMノードが動作
- ✅ いちごジャムを使ったデザートレシピ3つが生成される

**確認ポイント:**
- レシピ名にデザート・スイーツ系の名前（ヨーグルトパフェ、ジャムマフィンなど）
- 材料に「MUROのいちごジャム」が含まれている
- ヨーグルトが使われている
- `benefit`に「低カロリー」や甘さに関する説明がある

---

### テスト3: 異なる入力で異なるレシピが生成されるか確認

**テスト3-1: JAMサイト（いちごジャム）**
```json
{
  "condition": "朝食に",
  "kojiType": "いちごジャム",
  "otherIngredients": "パン",
  "siteType": "jam"
}
```
**期待**: パンを使った朝食デザート（フレンチトースト、ジャムサンドなど）

**テスト3-2: JAMサイト（ブルーベリージャム）**
```json
{
  "condition": "おやつに",
  "kojiType": "ブルーベリージャム",
  "otherIngredients": "チーズケーキ",
  "siteType": "jam"
}
```
**期待**: ブルーベリージャムを使ったチーズケーキ系デザート

**確認ポイント:**
- ✅ テスト3-1とテスト3-2で**明確に異なるレシピ**が生成される
- ✅ ジャムの種類が正しく反映されている
- ✅ 用途（朝食 vs おやつ）に応じた調理法になっている

---

## 🎨 Workflow構造図

```
┌─────────────────┐
│ Start Node      │
│                 │
│ inputs:         │
│  - condition    │
│  - needs        │
│  - kojiType     │
│  - otherIng...  │
│  - customerSex  │
│  - customerAge  │
│  - siteType 🆕  │
└────────┬────────┘
         │
         ▼
┌────────────────┐
│ IF/ELSE Node   │
│                │
│ IF siteType    │
│  == 'jam'      │
└────┬───────┬───┘
     │       │
  IF │       │ ELSE
     ▼       ▼
┌────────┐ ┌──────────┐
│ LLM    │ │  LLM     │
│ JAM    │ │ 麹レシピ  │
│ Dessert│ │ (既存)   │
└────┬───┘ └─────┬────┘
     │           │
     └─────┬─────┘
           ▼
      ┌────────┐
      │ Answer │
      └────────┘
```

---

## 📝 フロントエンド対応（オプション）

### JAMサイト専用フォームに隠しフィールドを追加

JAMサイトのフォームHTML（Liquidテンプレート）に以下を追加：

```html
<!-- JAMサイト専用の隠しフィールド -->
<input type="hidden" id="siteTypeField" name="siteType" value="jam" />
```

**配置場所:**
`<form id="kojiRecipeForm">` の内部

**効果:**
- FormDataに`siteType: 'jam'`が自動的に含まれる
- Refererヘッダーに依存しない、より確実な判定

---

## ⚠️ トラブルシューティング

### エラー: 変数が展開されない（`{{condition}}`が空文字列）

**原因:** 変数が手入力のプレーンテキストになっている

**解決策:**
1. プロンプトエディタで変数部分を削除
2. `{`キーを入力して変数挿入メニューを開く
3. 「Start」→ 該当の変数を選択
4. 変数ブロック（背景色付き）が挿入されることを確認

---

### エラー: IF/ELSE分岐が期待通りに動かない

**確認ポイント:**
1. **IF条件の変数が正しく選択されているか?**
   - Variable欄に`{siteType}`変数ブロックが表示されているか確認
2. **Condition typeが正しいか?**
   - `is` (完全一致) を使用
3. **Valueが正しいか?**
   - `jam`（小文字、スペルミスなし）

**デバッグ方法:**
- DIFYのログで、IF/ELSEノードの判定結果を確認
- Startノードのログで`siteType`の値を確認

---

### エラー: 両方のLLMノードから同じようなレシピが返る

**原因:** System Promptに「ユーザー入力を必ず反映」の指示が欠けている

**解決策:**
1. 両方のLLMノードのSystem Promptに以下を追加:
   ```markdown
   【最重要】
   - ユーザー入力を必ず反映
   - 同じユーザーでも入力が変われば異なるレシピ
   - 定番レシピの繰り返しは厳禁
   ```
2. Publish後、再テスト

---

## 📚 参考資料

- [DIFY IF/ELSE Node Documentation](https://docs.dify.ai/en/guides/workflow/node/ifelse)
- [DIFY Variables Guide](https://docs.dify.ai/en/guides/workflow/variables)
- [本プロジェクトのDIFY設定ドキュメント](./dify-nutrition-setup.md)

---

## 📊 まとめ

### 実装内容
✅ `siteType`変数をStartノードに追加
✅ IF/ELSEノードで条件分岐
✅ JAM専用LLMノード作成
✅ 麹レシピLLMノード維持
✅ 両方の出力をAnswer Nodeで統合

### 期待される効果
✅ JAMサイトからのリクエスト → JAMデザートレシピ
✅ 通常サイトからのリクエスト → 麹レシピ
✅ 同じAPI・Workflowで両方に対応
✅ ユーザー入力に応じた多様なレシピ生成
