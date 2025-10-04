import { json } from "@remix-run/node";

// /apps/recipe_gen へのGETリクエスト対応
export async function loader() {
  return json({
    message: "Recipe Generator API",
    version: "1.0.0",
    endpoints: {
      generate: "/apps/recipe_gen/generate (POST)"
    }
  });
}

export default function RecipeGenIndex() {
  return null;
}
