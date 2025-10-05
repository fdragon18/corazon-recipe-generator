import { type ActionFunctionArgs, json } from "@remix-run/node";
import prisma from "../db.server";

/**
 * レシピお気に入りAPI
 * POST /apps/recipe_gen/favorite
 *
 * リクエストボディ（JSON）:
 * {
 *   recipeId: string,
 *   customerId: string,
 *   action: "add" | "remove"
 * }
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { recipeId, customerId, action } = body;

    // バリデーション
    if (!recipeId || !customerId) {
      return json(
        { success: false, error: "recipeId and customerId are required" },
        { status: 400 }
      );
    }

    if (action !== "add" && action !== "remove") {
      return json(
        { success: false, error: "action must be 'add' or 'remove'" },
        { status: 400 }
      );
    }

    console.log(`[お気に入りAPI] recipeId=${recipeId}, customerId=${customerId}, action=${action}`);

    // レシピの存在確認
    const recipe = await prisma.generatedRecipe.findUnique({
      where: { id: recipeId }
    });

    if (!recipe) {
      return json(
        { success: false, error: "Recipe not found" },
        { status: 404 }
      );
    }

    if (action === "add") {
      // お気に入り追加（upsert: 既存の場合は何もしない）
      const created = await prisma.recipeFavorite.upsert({
        where: {
          recipeId_customerId: {
            recipeId,
            customerId
          }
        },
        update: {},
        create: {
          recipeId,
          customerId
        }
      });

      // お気に入り数をインクリメント
      await prisma.generatedRecipe.update({
        where: { id: recipeId },
        data: { favoriteCount: { increment: 1 } }
      });

      console.log(`[お気に入りAPI] お気に入り追加成功: ${created.id}`);

      const updatedRecipe = await prisma.generatedRecipe.findUnique({
        where: { id: recipeId },
        select: { likeCount: true, favoriteCount: true }
      });

      return json({
        success: true,
        action: "added",
        likeCount: updatedRecipe?.likeCount || 0,
        favoriteCount: updatedRecipe?.favoriteCount || 0
      });

    } else {
      // お気に入り削除
      const deleted = await prisma.recipeFavorite.deleteMany({
        where: {
          recipeId,
          customerId
        }
      });

      if (deleted.count > 0) {
        // お気に入り数をデクリメント（0未満にはならないように）
        await prisma.generatedRecipe.update({
          where: { id: recipeId },
          data: {
            favoriteCount: {
              decrement: 1
            }
          }
        });

        // 0未満にならないように修正
        await prisma.$executeRaw`
          UPDATE "GeneratedRecipe"
          SET "favoriteCount" = GREATEST("favoriteCount", 0)
          WHERE id = ${recipeId}
        `;
      }

      console.log(`[お気に入りAPI] お気に入り削除成功: ${deleted.count}件`);

      const updatedRecipe = await prisma.generatedRecipe.findUnique({
        where: { id: recipeId },
        select: { likeCount: true, favoriteCount: true }
      });

      return json({
        success: true,
        action: "removed",
        likeCount: updatedRecipe?.likeCount || 0,
        favoriteCount: updatedRecipe?.favoriteCount || 0
      });
    }

  } catch (error: any) {
    console.error("[お気に入りAPI] エラー:", error);
    return json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
