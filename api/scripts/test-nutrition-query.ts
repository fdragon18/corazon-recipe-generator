/**
 * 栄養基準データ検索テストスクリプト
 *
 * 使い方:
 *   npx tsx scripts/test-nutrition-query.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 年齢・性別から栄養基準を取得
async function getNutritionStandard(sex: 'male' | 'female', age: number) {
  const standard = await prisma.nutritionStandard.findFirst({
    where: {
      sex,
      ageMin: { lte: age },
      ageMax: { gte: age },
    },
  });

  return standard;
}

// デフォルト値を取得（成人男性30-49歳）
async function getDefaultNutritionStandard() {
  return await prisma.nutritionStandard.findFirst({
    where: {
      sex: 'male',
      ageMin: { lte: 30 },
      ageMax: { gte: 30 },
    },
  });
}

async function main() {
  console.log('=== 栄養基準データ検索テスト ===\n');

  // テストケース1: 成人男性30歳
  console.log('1️⃣ 成人男性30歳');
  const male30 = await getNutritionStandard('male', 30);
  if (male30) {
    console.log(`   年齢範囲: ${male30.ageRange}`);
    console.log(`   エネルギー（ふつう）: ${male30.energyModerate} kcal/日`);
    console.log(`   タンパク質推奨: ${male30.proteinRecommended} g/日`);
    console.log(`   タンパク質目標: ${male30.proteinTargetMin}-${male30.proteinTargetMax}%E`);
    console.log(`   脂質目標: ${male30.fatTargetMin}-${male30.fatTargetMax}%E`);
    console.log(`   炭水化物目標: ${male30.carbohydrateMin}-${male30.carbohydrateMax}%E`);
  } else {
    console.log('   ❌ データが見つかりません');
  }

  console.log('\n2️⃣ 成人女性25歳');
  const female25 = await getNutritionStandard('female', 25);
  if (female25) {
    console.log(`   年齢範囲: ${female25.ageRange}`);
    console.log(`   エネルギー（ふつう）: ${female25.energyModerate} kcal/日`);
    console.log(`   タンパク質推奨: ${female25.proteinRecommended} g/日`);
    console.log(`   タンパク質目標: ${female25.proteinTargetMin}-${female25.proteinTargetMax}%E`);
    console.log(`   脂質目標: ${female25.fatTargetMin}-${female25.fatTargetMax}%E`);
    console.log(`   炭水化物目標: ${female25.carbohydrateMin}-${female25.carbohydrateMax}%E`);
    console.log(`   ナトリウム目標: ${female25.sodiumTarget} g/日`);
  } else {
    console.log('   ❌ データが見つかりません');
  }

  console.log('\n3️⃣ 高齢者（男性75歳）');
  const male75 = await getNutritionStandard('male', 75);
  if (male75) {
    console.log(`   年齢範囲: ${male75.ageRange}`);
    console.log(`   エネルギー（ふつう）: ${male75.energyModerate} kcal/日`);
    console.log(`   タンパク質推奨: ${male75.proteinRecommended} g/日`);
    console.log(`   タンパク質目標: ${male75.proteinTargetMin}-${male75.proteinTargetMax}%E`);
  } else {
    console.log('   ❌ データが見つかりません');
  }

  console.log('\n4️⃣ 子供（女性8歳）');
  const female8 = await getNutritionStandard('female', 8);
  if (female8) {
    console.log(`   年齢範囲: ${female8.ageRange}`);
    console.log(`   エネルギー（ふつう）: ${female8.energyModerate} kcal/日`);
    console.log(`   タンパク質推奨: ${female8.proteinRecommended} g/日`);
    console.log(`   食物繊維目標: ${female8.fiberTarget} g/日`);
  } else {
    console.log('   ❌ データが見つかりません');
  }

  console.log('\n5️⃣ 範囲外（2歳未満）');
  const male1 = await getNutritionStandard('male', 1);
  if (male1) {
    console.log(`   年齢範囲: ${male1.ageRange}`);
    console.log(`   タンパク質推奨: ${male1.proteinRecommended} g/日`);
  } else {
    console.log('   ❌ データが見つかりません（3歳未満は未対応）');
    console.log('   → デフォルト値を使用します');
    const defaultData = await getDefaultNutritionStandard();
    if (defaultData) {
      console.log(`   デフォルト: ${defaultData.ageRange} ${defaultData.sex}`);
      console.log(`   タンパク質推奨: ${defaultData.proteinRecommended} g/日`);
    }
  }

  console.log('\n6️⃣ 範囲外（100歳）');
  const male100 = await getNutritionStandard('male', 100);
  if (male100) {
    console.log(`   年齢範囲: ${male100.ageRange}`);
    console.log(`   タンパク質推奨: ${male100.proteinRecommended} g/日`);
    console.log('   ✅ 75歳以上のデータで対応可能');
  } else {
    console.log('   ❌ データが見つかりません');
  }

  // 全データのサマリー
  console.log('\n=== 登録データサマリー ===');
  const allData = await prisma.nutritionStandard.findMany({
    orderBy: [{ sex: 'asc' }, { ageMin: 'asc' }],
    select: {
      sex: true,
      ageRange: true,
      ageMin: true,
      ageMax: true,
      proteinRecommended: true,
      energyModerate: true,
    },
  });

  console.log('\n男性:');
  console.table(
    allData
      .filter((d) => d.sex === 'male')
      .map((d) => ({
        年齢範囲: d.ageRange,
        'タンパク質(g)': d.proteinRecommended,
        'エネルギー(kcal)': d.energyModerate,
      }))
  );

  console.log('\n女性:');
  console.table(
    allData
      .filter((d) => d.sex === 'female')
      .map((d) => ({
        年齢範囲: d.ageRange,
        'タンパク質(g)': d.proteinRecommended,
        'エネルギー(kcal)': d.energyModerate,
      }))
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
