/**
 * 日本食品成分表ベースの栄養価計算サービス
 *
 * Supabase（JapaneseFoodテーブル）から食品データを検索して栄養価を計算
 */

import type { Ingredient, Nutrition, Comparison } from '../types/recipe';
import prisma from '../db.server';
import { normalizeIngredientName, generateSearchKeywords } from '../data/ingredient-aliases';

/**
 * 材料名から食品データを検索（あいまい検索・類義語対応）
 *
 * @param ingredientName - 材料名（例: "鮭", "MUROの塩麹", "豚バラ"）
 * @param context - ログ用のコンテキスト情報（レシピ名など）
 * @returns マッチした食品データ（最も関連性の高いもの）
 */
export async function searchFood(ingredientName: string, context: string = '') {
  const prefix = context ? `[${context}] ` : '';

  console.log('\n========================================');
  console.log(`${prefix}🔍 食品検索開始`);
  console.log('========================================');
  console.log(`${prefix}📝 入力: "${ingredientName}"`);

  // 1. 類義語を正規化
  const normalizedName = normalizeIngredientName(ingredientName);

  if (normalizedName !== ingredientName) {
    console.log(`${prefix}🔄 類義語マッピング: "${ingredientName}" → "${normalizedName}"`);
  }

  // 2. 正規化された名前で完全一致検索
  let food = await prisma.japaneseFood.findFirst({
    where: { name: normalizedName }
  });

  if (food) {
    console.log(`${prefix}✅ 検索結果: 完全一致`);
    console.log(`${prefix}📦 DB名: "${food.name}"`);
    console.log(`${prefix}🏷️  MURO製品: ${food.isMuroProduct ? 'はい' : 'いいえ'}`);
    console.log(`${prefix}📊 栄養価: カロリー ${food.energyKcal}kcal, タンパク質 ${food.protein}g, 脂質 ${food.fat}g`);
    console.log('========================================\n');
    return food;
  }

  // 3. 部分一致検索（複数キーワード）
  const keywords = generateSearchKeywords(ingredientName);
  console.log(`${prefix}🔑 検索キーワード候補: [${keywords.join(', ')}]`);

  for (const keyword of keywords) {
    const foods = await prisma.japaneseFood.findMany({
      where: {
        OR: [
          { name: { contains: keyword } },
          { searchText: { contains: keyword } }
        ]
      },
      take: 5, // 候補を5件取得してログ出力
      orderBy: [
        { isMuroProduct: 'desc' }, // MURO製品を優先
        { name: 'asc' }
      ]
    });

    if (foods.length > 0) {
      console.log(`${prefix}✅ 検索結果: 部分一致 (キーワード: "${keyword}")`);
      console.log(`${prefix}📦 DB名: "${foods[0].name}"`);
      console.log(`${prefix}🏷️  MURO製品: ${foods[0].isMuroProduct ? 'はい' : 'いいえ'}`);
      console.log(`${prefix}📊 栄養価: カロリー ${foods[0].energyKcal}kcal, タンパク質 ${foods[0].protein}g, 脂質 ${foods[0].fat}g`);

      if (foods.length > 1) {
        console.log(`${prefix}💡 他の候補 (${foods.length - 1}件):`);
        foods.slice(1).forEach((f, i) => {
          console.log(`${prefix}   ${i + 1}. ${f.name}`);
        });
      }
      console.log('========================================\n');
      return foods[0];
    }
  }

  // 4. 最後の手段: 最初の1文字で検索
  const firstChar = ingredientName.charAt(0);
  const lastResort = await prisma.japaneseFood.findFirst({
    where: { name: { startsWith: firstChar } }
  });

  if (lastResort) {
    console.warn(`${prefix}⚠️ 検索結果: フォールバック検索（精度低）`);
    console.warn(`${prefix}📦 DB名: "${lastResort.name}"`);
    console.warn(`${prefix}💭 推測: 最初の文字 "${firstChar}" で検索`);
    console.warn(`${prefix}🚨 この結果は不正確な可能性があります！類義語マッピングの追加を検討してください。`);
    console.log('========================================\n');
    return lastResort;
  }

  console.error(`${prefix}❌ 検索結果: 見つかりません`);
  console.error(`${prefix}🚨 "${ingredientName}" に対応する食品データがDBに存在しません`);
  console.error(`${prefix}💡 対策: 類義語マッピング (ingredient-aliases.ts) に追加してください`);
  console.log('========================================\n');
  return null;
}

/**
 * 材料リストから栄養価を計算（日本食品成分表 + MURO製品）
 */
export async function calculateNutrition(
  ingredients: Ingredient[],
  recipeContext: string = ''
): Promise<Nutrition> {
  const prefix = recipeContext ? `[${recipeContext}] ` : '';

  console.log('\n🧮 栄養価計算開始');
  console.log('========================================');
  console.log(`${prefix}📋 材料数: ${ingredients.length}件\n`);

  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalSodium = 0;
  let totalCalories = 0;
  let successCount = 0;
  let failCount = 0;

  for (const ing of ingredients) {
    const food = await searchFood(ing.item, recipeContext);

    if (food) {
      // 100gあたりのデータを使用
      const amount = ing.amount || 0;
      const factor = amount / 100; // 100gあたりを基準に係数計算

      const contributedProtein = Number(food.protein || 0) * factor;
      const contributedFat = Number(food.fat || 0) * factor;
      const contributedCarbs = Number(food.carbs || 0) * factor;
      const contributedSodium = Number(food.sodium || 0) * factor;
      const contributedCalories = Number(food.energyKcal || 0) * factor;

      totalProtein += contributedProtein;
      totalFat += contributedFat;
      totalCarbs += contributedCarbs;
      totalSodium += contributedSodium;
      totalCalories += contributedCalories;

      console.log(`${prefix}📊 材料 #${successCount + 1}: ${ing.item} (${amount}${ing.unit || 'g'})`);
      console.log(`${prefix}   → 寄与: カロリー ${Math.round(contributedCalories)}kcal, P ${contributedProtein.toFixed(1)}g, F ${contributedFat.toFixed(1)}g, C ${contributedCarbs.toFixed(1)}g, Na ${Math.round(contributedSodium)}mg`);
      successCount++;
    } else {
      console.error(`${prefix}❌ 材料 #${successCount + failCount + 1}: ${ing.item} → 検索失敗`);
      failCount++;
    }
  }

  const result = {
    protein: Math.round(totalProtein * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
    carbs: Math.round(totalCarbs * 10) / 10,
    sodium: Math.round(totalSodium),
    calories: Math.round(totalCalories)
  };

  console.log(`\n${prefix}📊 栄養価計算完了`);
  console.log('========================================');
  console.log(`${prefix}✅ 成功: ${successCount}件 / ❌ 失敗: ${failCount}件`);
  console.log(`\n${prefix}🍽️ 合計栄養価（1人前）:`);
  console.log(`${prefix}   カロリー: ${result.calories}kcal`);
  console.log(`${prefix}   タンパク質: ${result.protein}g`);
  console.log(`${prefix}   脂質: ${result.fat}g`);
  console.log(`${prefix}   炭水化物: ${result.carbs}g`);
  console.log(`${prefix}   ナトリウム: ${result.sodium}mg (食塩相当量: ${(result.sodium / 1000 * 2.54).toFixed(1)}g)`);
  console.log('========================================\n');

  return result;
}

/**
 * 減塩効果を計算（ロジックベース）
 */
export function calculateSaltReduction(
  ingredients: Ingredient[]
): Comparison {
  // 麹を特定（MUROの米麹も含む）
  const kojiIngredient = ingredients.find(ing =>
    ing.item.includes('塩麹') ||
    ing.item.includes('醤油麹') ||
    ing.item.includes('しょうゆ麹') ||
    ing.item.includes('米麹') ||  // 🆕 MUROの米麹を含む
    ing.item.toLowerCase().includes('shio koji') ||
    ing.item.toLowerCase().includes('shoyu koji') ||
    ing.item.toLowerCase().includes('kome koji')
  );

  if (!kojiIngredient || !kojiIngredient.amount) {
    // 麹がない場合はデフォルト値
    return {
      traditionalSodium: 0,
      sodiumReduction: 0,
      kojiEffect: ''
    };
  }

  // 麹の種類を判定
  let isShoyuKoji = kojiIngredient.item.includes('醤油') ||
                    kojiIngredient.item.includes('しょうゆ') ||
                    kojiIngredient.item.toLowerCase().includes('shoyu');

  let isShioKoji = kojiIngredient.item.includes('塩麹') ||
                   kojiIngredient.item.toLowerCase().includes('shio koji');

  // 🆕 「MUROの米麹」の場合は、他の材料から推測
  // 注意: MUROの全製品は米麹ベース（塩麹、醤油麹、甘麹）
  if (kojiIngredient.item.includes('MURO') || kojiIngredient.item.includes('米麹')) {
    // 醤油が別途ある → 醤油麹の可能性が高い
    const hasShoyu = ingredients.some(ing =>
      ing.item.includes('醤油') ||
      ing.item.includes('しょうゆ') ||
      ing.item.includes('味噌')
    );

    // 塩が別途ある → 塩麹の可能性が高い
    const hasSalt = ingredients.some(ing =>
      ing.item.includes('塩') && !ing.item.includes('塩麹') && !ing.item.includes('醤油')
    );

    // 砂糖やはちみつがある → 甘麹（甘酒）の可能性
    const hasSweet = ingredients.some(ing =>
      ing.item.includes('砂糖') ||
      ing.item.includes('はちみつ') ||
      ing.item.includes('蜂蜜')
    );

    if (hasShoyu) {
      isShoyuKoji = true;
      console.log(`[減塩計算] MUROの米麹を醤油麹として判定（醤油/味噌が材料に含まれる）`);
    } else if (hasSalt) {
      isShioKoji = true;
      console.log(`[減塩計算] MUROの米麹を塩麹として判定（塩が材料に含まれる）`);
    } else if (hasSweet) {
      // 甘麹は塩分ゼロなので減塩効果なし
      console.log(`[減塩計算] MUROの米麹を甘麹として判定（甘味料が含まれる）→ 減塩効果なし`);
      return {
        traditionalSodium: 0,
        sodiumReduction: 0,
        kojiEffect: '米麹甘酒の自然な甘みで砂糖を削減し、腸内環境を整える効果が期待できます'
      };
    } else {
      // デフォルトは塩麹として扱う（最も一般的なため）
      isShioKoji = true;
      console.log(`[減塩計算] MUROの米麹を塩麹として判定（デフォルト）`);
    }
  }

  // 塩麹: 100gあたり約8000mg、醤油麹: 100gあたり約6200mg
  const sodiumPer100g = isShoyuKoji ? 6200 : 8000;
  const kojiSodium = (kojiIngredient.amount / 100) * sodiumPer100g;

  // 通常の塩・醤油で同じ塩味を出す場合のナトリウム量（麹の旨味効果で1.5倍相当）
  const traditionalSodium = kojiSodium * 1.5;

  // 減塩率
  const reduction = ((traditionalSodium - kojiSodium) / traditionalSodium) * 100;

  const kojiType = isShoyuKoji ? '醤油麹' : '塩麹';
  const umami = isShoyuKoji ? 'アミノ酸' : 'グルタミン酸';

  return {
    traditionalSodium: Math.round(traditionalSodium),
    sodiumReduction: Math.round(reduction * 10) / 10,
    kojiEffect: `${kojiType}の旨味成分（${umami}）により、塩分を${Math.round(reduction)}%削減しながら同等の塩味を実現し、高血圧予防に貢献`
  };
}
