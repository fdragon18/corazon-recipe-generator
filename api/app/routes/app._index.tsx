import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  Badge,
  Banner,
  Icon,
} from "@shopify/polaris";
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  FoodIcon,
  SettingsIcon,
  QuestionCircleIcon,
} from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  return (
    <Page>
      <TitleBar title="MUROレシピ生成AI 管理画面">
        <button onClick={() => window.open("https://corazon-muro-recipe-dev.myshopify.com", "_blank")}>
          ストアを開く
        </button>
      </TitleBar>

      <BlockStack gap="500">
        {/* ウェルカムバナー */}
        <Banner tone="success">
          <p>
            <strong>✨ MUROレシピ生成AIアプリへようこそ！</strong>
            <br />
            このアプリは、お客様の体調や希望に合わせて麹製品を使った
            パーソナライズレシピを自動生成します。
          </p>
        </Banner>

        <Layout>
          <Layout.Section>
            {/* ステータスカード */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingLg">
                    アプリステータス
                  </Text>
                  <Badge tone="success">
                    <Icon source={CheckCircleIcon} />
                    稼働中
                  </Badge>
                </InlineStack>

                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                  <BlockStack gap="200">
                    <InlineStack gap="200" align="start">
                      <Badge>Theme Extension</Badge>
                      <Text variant="bodyMd">インストール済み</Text>
                    </InlineStack>
                    <InlineStack gap="200" align="start">
                      <Badge>API接続</Badge>
                      <Text variant="bodyMd">Azure OpenAI GPT-4</Text>
                    </InlineStack>
                    <InlineStack gap="200" align="start">
                      <Badge>データベース</Badge>
                      <Text variant="bodyMd">Supabase接続済み</Text>
                    </InlineStack>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>

            {/* 機能説明カード */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  <Icon source={FoodIcon} />
                  主な機能
                </Text>

                <BlockStack gap="300">
                  <Box padding="300" background="bg-surface-secondary" borderRadius="100">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        🎯 パーソナライズレシピ生成
                      </Text>
                      <Text variant="bodyMd">
                        お客様の体調（疲れやすい、胃腸が弱いなど）と
                        食事の希望に基づいて、3つの麹レシピを即座に生成
                      </Text>
                    </BlockStack>
                  </Box>

                  <Box padding="300" background="bg-surface-secondary" borderRadius="100">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        🍶 豊富な麹製品対応
                      </Text>
                      <Text variant="bodyMd">
                        麹パウダー、塩麹、醤油麹、甘麹、トマト麹、
                        ハーブ麹、にんにく麹、玉ねぎ麹に対応
                      </Text>
                    </BlockStack>
                  </Box>

                  <Box padding="300" background="bg-surface-secondary" borderRadius="100">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        💡 スマートな提案
                      </Text>
                      <Text variant="bodyMd">
                        各レシピには材料、作り方、健康効果の説明付き。
                        お客様の悩みに寄り添った提案を実現
                      </Text>
                    </BlockStack>
                  </Box>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            {/* セットアップガイド */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  <Icon source={SettingsIcon} />
                  セットアップガイド
                </Text>

                <List type="number">
                  <List.Item>
                    <Link url="https://admin.shopify.com/store/corazon-muro-recipe-dev/themes/133962661982/editor">
                      Theme Editorを開く
                    </Link>
                  </List.Item>
                  <List.Item>
                    「セクション」→「アプリブロック」を選択
                  </List.Item>
                  <List.Item>
                    「KOJIレシピ生成」ブロックを追加
                  </List.Item>
                  <List.Item>
                    商品ページに配置して保存
                  </List.Item>
                </List>

                <Button url="https://admin.shopify.com/store/corazon-muro-recipe-dev/themes/133962661982/editor" fullWidth>
                  Theme Editorへ
                </Button>
              </BlockStack>
            </Card>

            {/* 技術仕様 */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  技術仕様
                </Text>

                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text variant="bodySm">フレームワーク</Text>
                    <Badge>Remix</Badge>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text variant="bodySm">データベース</Text>
                    <Badge>Supabase</Badge>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text variant="bodySm">AI</Text>
                    <Badge>Azure OpenAI</Badge>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text variant="bodySm">デプロイ</Text>
                    <Badge>Vercel</Badge>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>

            {/* サポート */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  <Icon source={QuestionCircleIcon} />
                  サポート
                </Text>

                <BlockStack gap="200">
                  <Link url="mailto:support@corazon-muro.com">
                    お問い合わせ
                  </Link>
                  <Link url="https://github.com/your-repo/wiki">
                    ドキュメント
                  </Link>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}