import { json } from "@remix-run/node";

// 環境変数のテスト用エンドポイント
export async function loader() {
  const hasEndpoint = !!process.env.AZURE_OPENAI_ENDPOINT;
  const hasApiKey = !!process.env.AZURE_OPENAI_API_KEY;

  const endpointPrefix = process.env.AZURE_OPENAI_ENDPOINT
    ? process.env.AZURE_OPENAI_ENDPOINT.substring(0, 50) + "..."
    : "Not set";

  const apiKeyPrefix = process.env.AZURE_OPENAI_API_KEY
    ? process.env.AZURE_OPENAI_API_KEY.substring(0, 10) + "..."
    : "Not set";

  return json({
    status: "Environment variables check",
    azure_endpoint_configured: hasEndpoint,
    azure_api_key_configured: hasApiKey,
    endpoint_preview: endpointPrefix,
    api_key_preview: apiKeyPrefix,
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}