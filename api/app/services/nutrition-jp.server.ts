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
 * MURO調味料の塩分濃度データ（%）
 * 出典: Q. 麹調味料は塩分量が少なくて健康に良さそうだけど、味は塩分量が少なくても満足出来ますか？
 */
const MURO_SALT_CONCENTRATION: Record<string, number> = {
  '塩麹': 11.6,
  'にんにく麹': 11.0,
  'ハーブ麹': 11.6,
  'トマト麹': 7.2,
  '醤油麹': 6.2,
  '赤辛麹': 11.6
};

/**
 * 麹調味料のタイプ判定
 */
function determineKojiType(ingredientName: string): string | null {
  const lowerName = ingredientName.toLowerCase();

  if (lowerName.includes('にんにく麹') || lowerName.includes('garlic koji')) {
    return 'にんにく麹';
  }
  if (lowerName.includes('ハーブ麹') || lowerName.includes('herb koji')) {
    return 'ハーブ麹';
  }
  if (lowerName.includes('トマト麹') || lowerName.includes('tomato koji')) {
    return 'トマト麹';
  }
  if (lowerName.includes('醤油麹') || lowerName.includes('しょうゆ麹') || lowerName.includes('shoyu koji')) {
    return '醤油麹';
  }
  if (lowerName.includes('赤辛麹') || lowerName.includes('spicy koji')) {
    return '赤辛麹';
  }
  if (lowerName.includes('塩麹') || lowerName.includes('shio koji')) {
    return '塩麹';
  }

  return null;
}

/**
 * 減塩効果を計算（MURO公式データベース）
 *
 * 計算根拠:
 * - 塩小さじ1 (5g) = 塩分量 5.00g (100%)
 * - 塩麹小さじ2 (10g) = 塩分量 1.06g (21.2%) → 減塩率 78.8%
 * - 塩麹小さじ3 (15g) = 塩分量 1.59g (31.8%) → 減塩率 68.2%
 * - 推奨: 塩小さじ1に対して、麹調味料小さじ2-3
 * - うま味成分（グルタミン酸、アミノ酸）により、塩分控えめでも満足感
 *
 * 出典: Journal of Heath & Science 55(5), 667-673 (2009)
 *       "Taste active components of food, with concentration on Umami compounds"
 */
export function calculateSaltReduction(
  ingredients: Ingredient[]
): Comparison {
  // 麹調味料を検索
  const kojiIngredients = ingredients.filter(ing => {
    const type = determineKojiType(ing.item);
    return type !== null;
  });

  if (kojiIngredients.length === 0) {
    // 麹がない場合はデフォルト値
    return {
      traditionalSodium: 0,
      sodiumReduction: 0,
      kojiEffect: ''
    };
  }

  // 複数の麹がある場合は合算
  let totalKojiSodium = 0;
  let totalTraditionalSalt = 0;
  const kojiTypes: string[] = [];

  for (const kojiIng of kojiIngredients) {
    const kojiType = determineKojiType(kojiIng.item);
    if (!kojiType || !kojiIng.amount) continue;

    const saltConcentration = MURO_SALT_CONCENTRATION[kojiType];
    kojiTypes.push(kojiType);

    // 麹調味料の塩分量（g）
    const kojiSaltGrams = (kojiIng.amount * saltConcentration) / 100;

    // ナトリウム量（mg）= 塩分量（g） × 1000 × 塩分中のナトリウム比率（約0.4）
    // 実際には食塩相当量 = ナトリウム（mg） × 2.54 / 1000
    // 逆算: ナトリウム（mg） = 食塩相当量（g） × 1000 / 2.54
    const kojiSodiumMg = (kojiSaltGrams * 1000) / 2.54;

    totalKojiSodium += kojiSodiumMg;

    // 💡 推奨置き換え: 塩麹小さじ2-3 (10-15g) ≈ 塩小さじ1 (5g)
    // → 麹調味料の分量から、それに相当する塩の量を逆算
    // → 平均として、麹調味料 12.5g ≈ 塩 5g とすると、係数は 5 / 12.5 = 0.4
    const equivalentSaltGrams = kojiIng.amount * 0.4;
    const traditionalSaltSodiumMg = (equivalentSaltGrams * 1000) / 2.54;

    totalTraditionalSalt += traditionalSaltSodiumMg;

    console.log(`[減塩計算] ${kojiType} ${kojiIng.amount}${kojiIng.unit || 'g'}`);
    console.log(`  塩分濃度: ${saltConcentration}%`);
    console.log(`  塩分量: ${kojiSaltGrams.toFixed(2)}g`);
    console.log(`  ナトリウム: ${Math.round(kojiSodiumMg)}mg`);
    console.log(`  相当する塩: ${equivalentSaltGrams.toFixed(1)}g (${Math.round(traditionalSaltSodiumMg)}mg Na)`);
  }

  // 減塩率の計算
  const reduction = totalTraditionalSalt > 0
    ? ((totalTraditionalSalt - totalKojiSodium) / totalTraditionalSalt) * 100
    : 0;

  // 麹の効果説明
  const kojiTypeStr = kojiTypes.length === 1
    ? kojiTypes[0]
    : `${kojiTypes.join('、')}`;

  const umamiComponent = kojiTypes.some(t => t === '醤油麹')
    ? 'アミノ酸とグルタミン酸'
    : 'グルタミン酸';

  const effectDescription = totalTraditionalSalt > 0
    ? `${kojiTypeStr}の旨味成分（${umamiComponent}）により、塩分を${Math.round(reduction)}%削減しながら同等の塩味を実現。麹の100種の酵素が生み出す甘味・うま味・こく味で満足感が得られ、高血圧予防に貢献します。`
    : '';

  console.log(`[減塩計算結果]`);
  console.log(`  合計ナトリウム（麹）: ${Math.round(totalKojiSodium)}mg`);
  console.log(`  合計ナトリウム（塩換算）: ${Math.round(totalTraditionalSalt)}mg`);
  console.log(`  減塩率: ${Math.round(reduction * 10) / 10}%`);

  return {
    traditionalSodium: Math.round(totalTraditionalSalt),
    sodiumReduction: Math.round(reduction * 10) / 10,
    kojiEffect: effectDescription
  };
}
