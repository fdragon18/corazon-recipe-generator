/**
 * 栄養基準データ取得ユーティリティ
 * 厚生労働省「日本人の食事摂取基準（2025年版）」に基づく
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type NutritionStandardResult = {
  sex: string;
  ageRange: string;
  ageMin: number;
  ageMax: number;
  energyModerate: number | null;
  proteinRecommended: number | null;
  proteinTargetMin: number | null;
  proteinTargetMax: number | null;
  fatTargetMin: number | null;
  fatTargetMax: number | null;
  carbohydrateMin: number | null;
  carbohydrateMax: number | null;
  fiberTarget: number | null;
  sodiumTarget: number | null;
  isDefault?: boolean; // デフォルト値かどうか
  note?: string; // 注釈メッセージ
};

/**
 * 性別・年齢から栄養基準を取得
 *
 * @param sex - "male" | "female" または null（未設定）
 * @param age - 年齢 または null（未設定）
 * @returns 栄養基準データ
 */
export async function getNutritionStandard(
  sex: string | null,
  age: number | null
): Promise<NutritionStandardResult> {
  // 性別・年齢が両方設定されている場合
  if (sex && age !== null) {
    // 対応年齢範囲: 3歳～75歳
    if (age >= 3 && age <= 99) {
      const standard = await prisma.nutritionStandard.findFirst({
        where: {
          sex,
          ageMin: { lte: age },
          ageMax: { gte: age },
        },
      });

      if (standard) {
        return {
          ...standard,
          isDefault: false,
          note: '厚生労働省「日本人の食事摂取基準（2025年版）」に基づく推奨値',
        };
      }
    }

    // 範囲外の場合は注釈付きでデフォルト値
    const defaultStandard = await getDefaultNutritionStandard();
    return {
      ...defaultStandard,
      isDefault: true,
      note: `※ 推奨値は3歳～75歳を対象としています。範囲外のため一般的な推奨値を表示しています。`,
    };
  }

  // 性別または年齢が未設定の場合はデフォルト値
  const defaultStandard = await getDefaultNutritionStandard();
  return {
    ...defaultStandard,
    isDefault: true,
    note: '※ 性別・年齢が未設定のため、一般的な推奨値を表示しています。',
  };
}

/**
 * デフォルト栄養基準を取得（成人男性30-49歳）
 */
async function getDefaultNutritionStandard(): Promise<NutritionStandardResult> {
  const standard = await prisma.nutritionStandard.findFirst({
    where: {
      sex: 'male',
      ageMin: { lte: 30 },
      ageMax: { gte: 30 },
    },
  });

  if (!standard) {
    throw new Error('デフォルト栄養基準データが見つかりません');
  }

  return {
    ...standard,
    isDefault: true,
  };
}

/**
 * PFC（タンパク質・脂質・炭水化物）の推奨値を計算
 *
 * @param standard - 栄養基準データ
 * @param totalCalories - レシピの総カロリー（kcal）
 * @returns PFC推奨値（g）
 */
export function calculatePFCRecommendations(
  standard: NutritionStandardResult,
  totalCalories: number
) {
  return {
    // タンパク質: 推奨量（g）またはカロリーベース
    protein: {
      recommended: standard.proteinRecommended,
      targetMin: standard.proteinTargetMin
        ? Math.round((totalCalories * standard.proteinTargetMin) / 100 / 4) // 1g = 4kcal
        : null,
      targetMax: standard.proteinTargetMax
        ? Math.round((totalCalories * standard.proteinTargetMax) / 100 / 4)
        : null,
    },
    // 脂質: カロリーベース
    fat: {
      targetMin: standard.fatTargetMin
        ? Math.round((totalCalories * standard.fatTargetMin) / 100 / 9) // 1g = 9kcal
        : null,
      targetMax: standard.fatTargetMax
        ? Math.round((totalCalories * standard.fatTargetMax) / 100 / 9)
        : null,
    },
    // 炭水化物: カロリーベース
    carbohydrate: {
      targetMin: standard.carbohydrateMin
        ? Math.round((totalCalories * standard.carbohydrateMin) / 100 / 4) // 1g = 4kcal
        : null,
      targetMax: standard.carbohydrateMax
        ? Math.round((totalCalories * standard.carbohydrateMax) / 100 / 4)
        : null,
    },
    // 食物繊維
    fiber: {
      target: standard.fiberTarget,
    },
    // ナトリウム
    sodium: {
      target: standard.sodiumTarget,
    },
  };
}

/**
 * 性別の日本語名を英語コードに変換
 */
export function parseSexToCode(sex: string | null): 'male' | 'female' | null {
  if (!sex) return null;

  const lowerSex = sex.toLowerCase().trim();

  // 日本語
  if (lowerSex === '男性' || lowerSex === '男') return 'male';
  if (lowerSex === '女性' || lowerSex === '女') return 'female';

  // 英語
  if (lowerSex === 'male' || lowerSex === 'm') return 'male';
  if (lowerSex === 'female' || lowerSex === 'f') return 'female';

  return null;
}
