/**
 * 栄養基準データクリーンアップスクリプト
 * 対象年齢範囲: 3歳～75歳のみ残す
 *
 * 使い方:
 *   npx tsx scripts/clean-nutrition-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 栄養基準データクリーンアップ ===\n');

  // 削除前のデータ確認
  const beforeCount = await prisma.nutritionStandard.count();
  console.log(`削除前のレコード数: ${beforeCount}`);

  // 削除対象データの確認
  const toDelete = await prisma.nutritionStandard.findMany({
    where: {
      OR: [
        { ageMax: { lt: 3 } },  // 3歳未満
        { ageMin: { gt: 75 } }, // 75歳超
      ],
    },
    orderBy: [{ sex: 'asc' }, { ageMin: 'asc' }],
  });

  console.log('\n削除対象レコード:');
  console.table(
    toDelete.map((item) => ({
      性別: item.sex,
      年齢範囲: item.ageRange,
      '年齢Min': item.ageMin,
      '年齢Max': item.ageMax,
    }))
  );

  // 削除実行
  const result = await prisma.nutritionStandard.deleteMany({
    where: {
      OR: [
        { ageMax: { lt: 3 } },  // 3歳未満
        { ageMin: { gt: 75 } }, // 75歳超
      ],
    },
  });

  console.log(`\n✅ 削除完了: ${result.count}件`);

  // 削除後のデータ確認
  const afterCount = await prisma.nutritionStandard.count();
  console.log(`削除後のレコード数: ${afterCount}`);

  // 残ったデータのサマリー
  const remaining = await prisma.nutritionStandard.findMany({
    orderBy: [{ sex: 'asc' }, { ageMin: 'asc' }],
    select: {
      sex: true,
      ageRange: true,
      ageMin: true,
      ageMax: true,
    },
  });

  console.log('\n=== 残ったデータ（3歳～75歳） ===');
  console.log('\n男性:');
  console.table(
    remaining
      .filter((d) => d.sex === 'male')
      .map((d) => ({
        年齢範囲: d.ageRange,
        '年齢Min': d.ageMin,
        '年齢Max': d.ageMax,
      }))
  );

  console.log('\n女性:');
  console.table(
    remaining
      .filter((d) => d.sex === 'female')
      .map((d) => ({
        年齢範囲: d.ageRange,
        '年齢Min': d.ageMin,
        '年齢Max': d.ageMax,
      }))
  );

  console.log('\n✅ 対応年齢範囲: 3歳～75歳');
  console.log(`   合計レコード数: ${afterCount}件`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
