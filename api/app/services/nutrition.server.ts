// 栄養価計算サービス（Nutritionix API使用 - 無料枠: 月50,000リクエスト）

import type { Ingredient, Nutrition, Comparison } from '../types/recipe';

// Nutritionix API設定（無料プラン）
const NUTRITIONIX_CONFIG = {
  endpoint: 'https://trackapi.nutritionix.com/v2/natural/nutrients',
  appId: process.env.NUTRITIONIX_APP_ID || '',
  appKey: process.env.NUTRITIONIX_APP_KEY || ''
};

/**
 * 材料リストから栄養価を計算（Nutritionix API使用）
 */
export async function calculateNutrition(
  ingredients: Ingredient[]
): Promise<Nutrition> {
  try {
    // APIキーチェック
    if (!NUTRITIONIX_CONFIG.appId || !NUTRITIONIX_CONFIG.appKey) {
      console.warn('⚠️ Nutritionix APIキーが未設定。デフォルト値を返します。');
      return getDefaultNutrition();
    }

    // 材料をクエリ文字列に変換（例: "200g chicken breast, 30g shio koji"）
    const query = ingredients.map(ing => {
      if (ing.amount && ing.unit) {
        return `${ing.amount}${ing.unit} ${ing.item}`;
      }
      return ing.item;
    }).join(', ');

    console.log('📊 Nutritionix API リクエスト:', { query });

    // Nutritionix APIに送信
    const response = await fetch(NUTRITIONIX_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'x-app-id': NUTRITIONIX_CONFIG.appId,
        'x-app-key': NUTRITIONIX_CONFIG.appKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        timezone: 'Asia/Tokyo'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Nutritionix APIエラー:', response.status, errorText);
      return getDefaultNutrition();
    }

    const data = await response.json();
    console.log('✅ Nutritionix APIレスポンス受信');

    // レスポンスから栄養素を合計
    const foods = data.foods || [];
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let totalSodium = 0;
    let totalCalories = 0;

    foods.forEach((food: any) => {
      totalProtein += food.nf_protein || 0;
      totalFat += food.nf_total_fat || 0;
      totalCarbs += food.nf_total_carbohydrate || 0;
      totalSodium += food.nf_sodium || 0;
      totalCalories += food.nf_calories || 0;
    });

    return {
      protein: Math.round(totalProtein * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      sodium: Math.round(totalSodium),
      calories: Math.round(totalCalories)
    };

  } catch (error) {
    console.error('❌ 栄養価計算エラー:', error);
    return getDefaultNutrition();
  }
}

/**
 * 減塩効果を計算（ロジックベース）
 */
export function calculateSaltReduction(
  ingredients: Ingredient[]
): Comparison {
  // 塩麹・醤油麹を特定
  const kojiIngredient = ingredients.find(ing =>
    ing.item.includes('塩麹') ||
    ing.item.includes('醤油麹') ||
    ing.item.includes('しょうゆ麹') ||
    ing.item.toLowerCase().includes('shio koji') ||
    ing.item.toLowerCase().includes('shoyu koji')
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
  const isShoyuKoji = kojiIngredient.item.includes('醤油') ||
                      kojiIngredient.item.includes('しょうゆ') ||
                      kojiIngredient.item.toLowerCase().includes('shoyu');

  // 塩麹: 100gあたり約8000mg、醤油麹: 100gあたり約6000mg
  const sodiumPer100g = isShoyuKoji ? 6000 : 8000;
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

/**
 * デフォルト栄養価（APIエラー時）
 */
function getDefaultNutrition(): Nutrition {
  return {
    protein: 0,
    fat: 0,
    carbs: 0,
    sodium: 0,
    calories: 0
  };
}
