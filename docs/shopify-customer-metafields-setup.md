# Shopify顧客Metafield設定手順

## 📋 概要
このドキュメントでは、レシピ生成AIをパーソナライズするために、Shopify顧客に性別と年齢のMetafieldを設定する手順を説明します。

## 🎯 設定するMetafield

| 項目 | Namespace.Key | 型 | 用途 |
|------|--------------|-----|------|
| **性別** | `custom.gender` | Single line text | 性別に応じたレシピ提案 |
| **年齢** | `custom.age` | Integer | 年齢層に合わせた栄養バランス調整 |

---

## 🛠️ Metafield定義の作成（管理画面）

### 方法1: Shopify管理画面から設定

#### 📝 性別（Gender）の設定

1. Shopify管理画面にログイン
2. **Settings** → **Custom data** → **Customers** に移動
3. **Add definition** をクリック
4. 以下を入力:
   - **Name**: `Gender`（性別）
   - **Namespace and key**: `custom.gender`
   - **Type**: `Single line text`
   - **Validation** (optional): 選択肢制限
     - 値: `男性,女性,その他,回答しない`
5. **Save** をクリック

#### 📝 年齢（Age）の設定

1. 同じ画面で **Add definition** をクリック
2. 以下を入力:
   - **Name**: `Age`（年齢）
   - **Namespace and key**: `custom.age`
   - **Type**: `Integer`
   - **Validation** (optional):
     - **Minimum value**: `0`
     - **Maximum value**: `120`
3. **Save** をクリック

---

### 方法2: GraphQL APIで一括作成（推奨）

以下のGraphQL Mutationを実行すると、2つのMetafield定義を一度に作成できます。

```graphql
mutation CreateCustomerMetafieldDefinitions {
  # 性別の定義
  gender: metafieldDefinitionCreate(
    definition: {
      name: "Gender"
      namespace: "custom"
      key: "gender"
      type: "single_line_text_field"
      ownerType: CUSTOMER
      validations: [
        {
          name: "choices"
          value: "[\"男性\", \"女性\", \"その他\", \"回答しない\"]"
        }
      ]
    }
  ) {
    createdDefinition {
      id
      name
    }
    userErrors {
      field
      message
    }
  }

  # 年齢の定義
  age: metafieldDefinitionCreate(
    definition: {
      name: "Age"
      namespace: "custom"
      key: "age"
      type: "number_integer"
      ownerType: CUSTOMER
      validations: [
        {
          name: "min"
          value: "0"
        }
        {
          name: "max"
          value: "120"
        }
      ]
    }
  ) {
    createdDefinition {
      id
      name
    }
    userErrors {
      field
      message
    }
  }
}
```

#### 実行方法:
1. Shopify管理画面 → **Apps** → **recipe-generator-app** → **API credentials**
2. **Admin API access token** を確認
3. [Shopify GraphiQL App](https://shopify-graphiql-app.shopifycloud.com/login) で実行、または
4. curlコマンドで実行:

```bash
curl -X POST \
  https://corazon-muro-dev.myshopify.com/admin/api/2025-01/graphql.json \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: YOUR_ACCESS_TOKEN" \
  -d '{"query": "mutation CreateCustomerMetafieldDefinitions { ... }"}'
```

---

## ✅ 顧客への値の設定

### 管理画面から設定

1. **Customers** → 対象顧客を選択
2. 右側の **Metafields** セクションを確認
3. **Gender** と **Age** の値を入力
   - Gender: `男性`, `女性`, `その他`, `回答しない` から選択
   - Age: 数値を入力（例: `35`）
4. **Save** をクリック

### GraphQL APIで設定

```graphql
mutation UpdateCustomerMetafields {
  customerUpdate(
    input: {
      id: "gid://shopify/Customer/CUSTOMER_ID"
      metafields: [
        {
          namespace: "custom"
          key: "gender"
          type: "single_line_text_field"
          value: "女性"
        }
        {
          namespace: "custom"
          key: "age"
          type: "number_integer"
          value: "35"
        }
      ]
    }
  ) {
    customer {
      id
      metafields(first: 5) {
        edges {
          node {
            namespace
            key
            value
          }
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

---

## 🔍 Metafieldの確認

### GraphQLで確認

```graphql
query GetCustomerMetafields {
  customer(id: "gid://shopify/Customer/CUSTOMER_ID") {
    id
    email
    firstName
    lastName
    metafield(namespace: "custom", key: "gender") {
      value
    }
    ageMetafield: metafield(namespace: "custom", key: "age") {
      value
    }
  }
}
```

---

## 📊 レシピ生成での活用

設定されたMetafieldは、レシピ生成API（`/apps/recipe_gen/generate`）で自動的に取得され、DIFY Workflowに以下のパラメータとして渡されます：

```javascript
{
  inputs: {
    condition: "疲労感",
    needs: "減塩",
    kojiType: "塩麹",
    otherIngredients: "豚肉",
    customerGender: "女性",   // 自動取得
    customerAge: "35"         // 自動取得
  }
}
```

### パーソナライズ例

- **妊娠中の女性（20-40歳）**: 葉酸・鉄分豊富なレシピを提案
- **高齢者（65歳以上）**: 減塩・軟らかい食材のレシピを優先
- **成長期の子供（10-18歳）**: タンパク質・カルシウム重視のレシピ

---

## ⚠️ 注意事項

### プライバシー配慮
- 性別・年齢は**個人情報**として取り扱います
- GDPR・個人情報保護法を遵守
- 顧客の同意なしに収集・利用しない
- Metafield設定は**任意**（未設定でもレシピ生成可能）

### 技術的制限
- Metafield定義は**手動設定が必要**（顧客登録時に自動作成はできない）
- 最大128個の選択肢まで設定可能
- Integerは最大9桁（-2,147,483,648 〜 2,147,483,647）

---

## 🔗 参考リンク

- [Shopify Metafield Documentation](https://shopify.dev/docs/apps/build/custom-data/metafields)
- [Metafield Types Reference](https://shopify.dev/docs/apps/build/custom-data/metafields/list-of-data-types)
- [Customer GraphQL API](https://shopify.dev/docs/api/admin-graphql/2025-01/queries/customer)
