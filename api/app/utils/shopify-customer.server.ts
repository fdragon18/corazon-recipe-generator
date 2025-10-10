/**
 * Shopify顧客情報取得ユーティリティ
 *
 * App Proxy経由でShopify Admin GraphQL APIを使用して顧客情報とMetafieldを取得
 */

/**
 * 顧客情報とMetafieldを取得
 *
 * @param admin - Shopify Admin APIクライアント（authenticate.public.appProxy経由）
 * @param customerId - 顧客ID（数値のみ、gid://は不要）
 * @returns 顧客情報（性別・年齢のMetafield含む）
 */
export async function getCustomerInfo(admin: any, customerId: string) {
  const CUSTOMER_QUERY = `
    query getCustomer($id: ID!) {
      customer(id: $id) {
        id
        email
        firstName
        lastName
        metafield(namespace: "custom", key: "sex") {
          value
        }
        ageMetafield: metafield(namespace: "custom", key: "age") {
          value
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(
      CUSTOMER_QUERY,
      {
        variables: {
          id: `gid://shopify/Customer/${customerId}`
        }
      }
    );

    const data = await response.json();

    // GraphQLエラーチェック
    if (data.errors) {
      console.error('❌ GraphQLエラー:', JSON.stringify(data.errors, null, 2));
      return null;
    }

    // 顧客データ整形
    const customer = data.data?.customer;
    if (!customer) {
      console.warn(`⚠️ 顧客ID ${customerId} が見つかりません`);
      return null;
    }

    // Metafieldの値をパース（配列形式の場合に対応）
    let sexValue = customer.metafield?.value || null;
    if (sexValue) {
      try {
        // JSON配列形式の場合: '["男性"]' → "男性"
        const parsed = JSON.parse(sexValue);
        if (Array.isArray(parsed) && parsed.length > 0) {
          sexValue = parsed[0];
        }
      } catch (e) {
        // JSON parseエラーの場合はそのまま使用
      }
    }

    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      sex: sexValue,
      age: customer.ageMetafield?.value ? parseInt(customer.ageMetafield.value) : null
    };

  } catch (error) {
    console.error('❌ 顧客情報取得エラー:', error);
    return null;
  }
}
