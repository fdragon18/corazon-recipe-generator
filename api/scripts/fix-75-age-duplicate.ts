/**
 * 75歳以上の重複データを修正
 * 「75以上(歳)」を削除し、「75-99(歳)」のデータを補完
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 75歳以上データの重複修正 ===\n');

  // 現状確認
  const age75Data = await prisma.nutritionStandard.findMany({
    where: {
      ageMin: 75,
    },
    orderBy: [{ sex: 'asc' }, { ageRange: 'asc' }],
  });

  console.log('現在の75歳データ:');
  console.table(
    age75Data.map((d) => ({
      性別: d.sex,
      年齢範囲: d.ageRange,
      'タンパク質推奨': d.proteinRecommended,
      'エネルギー（ふつう）': d.energyModerate,
      'タンパク質目標': d.proteinTarget,
    }))
  );

  // 「75以上(歳)」のデータを使って「75-99(歳)」を更新
  for (const sex of ['male', 'female']) {
    const above75 = await prisma.nutritionStandard.findFirst({
      where: { sex, ageRange: '75以上(歳)' },
    });

    const range75_99 = await prisma.nutritionStandard.findFirst({
      where: { sex, ageRange: '75-99(歳)' },
    });

    if (above75 && range75_99) {
      console.log(`\n${sex === 'male' ? '男性' : '女性'}75歳データを統合中...`);

      // 「75-99(歳)」に「75以上(歳)」の値をマージ
      await prisma.nutritionStandard.update({
        where: { id: range75_99.id },
        data: {
          // nullの場合のみ上書き
          proteinRecommended: range75_99.proteinRecommended ?? above75.proteinRecommended,
          proteinTarget: range75_99.proteinTarget ?? above75.proteinTarget,
          proteinTargetMin: range75_99.proteinTargetMin ?? above75.proteinTargetMin,
          proteinTargetMax: range75_99.proteinTargetMax ?? above75.proteinTargetMax,
          fatTargetMin: range75_99.fatTargetMin ?? above75.fatTargetMin,
          fatTargetMax: range75_99.fatTargetMax ?? above75.fatTargetMax,
          carbohydrateTarget: range75_99.carbohydrateTarget ?? above75.carbohydrateTarget,
          carbohydrateMin: range75_99.carbohydrateMin ?? above75.carbohydrateMin,
          carbohydrateMax: range75_99.carbohydrateMax ?? above75.carbohydrateMax,
          fiberTarget: range75_99.fiberTarget ?? above75.fiberTarget,
          sodiumTarget: range75_99.sodiumTarget ?? above75.sodiumTarget,
        },
      });

      console.log('  ✅ データ統合完了');
    }
  }

  // 「75以上(歳)」を削除
  const deleteResult = await prisma.nutritionStandard.deleteMany({
    where: { ageRange: '75以上(歳)' },
  });

  console.log(`\n✅ 「75以上(歳)」削除完了: ${deleteResult.count}件`);

  // 統合後の確認
  const after75Data = await prisma.nutritionStandard.findMany({
    where: {
      ageMin: 75,
    },
    orderBy: [{ sex: 'asc' }],
  });

  console.log('\n=== 統合後の75歳データ ===');
  console.table(
    after75Data.map((d) => ({
      性別: d.sex,
      年齢範囲: d.ageRange,
      'タンパク質推奨': d.proteinRecommended,
      'エネルギー（ふつう）': d.energyModerate,
      'タンパク質目標': `${d.proteinTargetMin}-${d.proteinTargetMax}%`,
    }))
  );

  // 最終確認
  const totalCount = await prisma.nutritionStandard.count();
  console.log(`\n✅ 最終レコード数: ${totalCount}件`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
