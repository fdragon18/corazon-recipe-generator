/**
 * 日本食品成分表 + MURO製品データをSupabaseにインポート
 *
 * 使い方:
 * npx tsx scripts/import-food-data.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// GitHub JSONのフィールドマッピング
interface GitHubFoodData {
  foodId: number;
  foodName: string;
  enercKcal: number | null;
  prot: number | null;
  fat: number | null;
  choavl: number | null;
  na: number | null;
  groupId?: number;
}

// MURO製品データ
interface MuroProduct {
  foodCode: string;
  name: string;
  nameKana: string;
  category: string;
  energyKcal: number;
  protein: number;
  fat: number;
  carbs: number;
  sodium: number;
  isMuroProduct: boolean;
}

async function main() {
  console.log('📥 データインポート開始...');

  // 1. 既存データをクリア
  console.log('🗑️  既存データを削除中...');
  await prisma.japaneseFood.deleteMany({});
  console.log('✅ 削除完了');

  // 2. 日本食品成分表データを読み込み
  console.log('📖 日本食品成分表を読み込み中...');
  const githubDataPath = '/tmp/japanese-foods.json';
  const githubData: GitHubFoodData[] = JSON.parse(
    fs.readFileSync(githubDataPath, 'utf-8')
  );

  console.log(`📊 ${githubData.length}件の食品データを取得`);

  // 3. データ変換してインサート（バッチ処理）
  console.log('💾 データベースに保存中...');

  const batchSize = 500;
  for (let i = 0; i < githubData.length; i += batchSize) {
    const batch = githubData.slice(i, i + batchSize);

    await prisma.japaneseFood.createMany({
      data: batch.map((item: any) => ({
        foodCode: String(item.foodId),
        name: item.foodName,
        nameKana: null,
        category: null,
        // 基本栄養素
        energyKcal: typeof item.enercKcal === 'number' ? item.enercKcal : null,
        protein: typeof item.prot === 'number' ? item.prot : null,
        fat: typeof item.fat === 'number' ? item.fat : null,
        carbs: typeof item.choavl === 'number' ? item.choavl : null,
        sodium: typeof item.na === 'number' ? item.na : null,
        // 詳細栄養素
        fiber: typeof item.fib === 'number' ? item.fib : null,
        potassium: typeof item.k === 'number' ? item.k : null,
        calcium: typeof item.ca === 'number' ? item.ca : null,
        iron: typeof item.fe === 'number' ? item.fe : null,
        vitaminC: typeof item.vitC === 'number' ? item.vitC : null,
        vitaminA: typeof item.vitaRae === 'number' ? item.vitaRae : null,
        vitaminD: typeof item.vitD === 'number' ? item.vitD : null,
        vitaminB1: typeof item.thia === 'number' ? item.thia : null,
        vitaminB2: typeof item.ribf === 'number' ? item.ribf : null,
        cholesterol: typeof item.chole === 'number' ? item.chole : null,
        saltEquiv: typeof item.naclEq === 'number' ? item.naclEq : null,
        searchText: item.foodName,
        isMuroProduct: false
      })),
      skipDuplicates: true
    });

    console.log(`  ✓ ${i + batch.length}/${githubData.length}件完了`);
  }

  // 4. MURO製品データを追加
  console.log('🏪 MURO製品データを追加中...');
  const muroDataPath = '/tmp/muro-products.json';
  const muroData: MuroProduct[] = JSON.parse(
    fs.readFileSync(muroDataPath, 'utf-8')
  );

  for (const product of muroData) {
    await prisma.japaneseFood.create({
      data: {
        foodCode: product.foodCode,
        name: product.name,
        nameKana: product.nameKana,
        category: product.category,
        energyKcal: product.energyKcal,
        protein: product.protein,
        fat: product.fat,
        carbs: product.carbs,
        sodium: product.sodium,
        searchText: `${product.name} ${product.nameKana} ${product.category}`,
        isMuroProduct: true
      }
    });
  }

  console.log(`✅ ${muroData.length}件のMURO製品を追加完了`);

  // 5. 結果確認
  const totalCount = await prisma.japaneseFood.count();
  const muroCount = await prisma.japaneseFood.count({
    where: { isMuroProduct: true }
  });

  console.log('\n📊 インポート結果:');
  console.log(`  - 総食品数: ${totalCount}件`);
  console.log(`  - MURO製品: ${muroCount}件`);
  console.log(`  - 文科省データ: ${totalCount - muroCount}件`);
  console.log('\n✅ インポート完了！');
}

main()
  .catch((e) => {
    console.error('❌ エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
