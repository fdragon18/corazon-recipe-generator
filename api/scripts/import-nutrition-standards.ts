/**
 * 厚生労働省「日本人の食事摂取基準（2025年版）」データインポートスクリプト
 *
 * 使い方:
 *   npx tsx scripts/import-nutrition-standards.ts ~/Downloads/栄養\ -\ 総まとめ.csv
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// 性別マッピング
const sexMapping: Record<string, string> = {
  '男性': 'male',
  '女性': 'female',
};

// 数値パース（空白・ハイフン処理）
function parseNumber(value: string): number | null {
  if (!value || value === '-' || value.trim() === '') return null;
  // 注釈記号（※）を除去
  const cleaned = value.replace(/※/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// 範囲値パース（例: "50-65", "13-20"）
function parseRange(value: string): { min: number; max: number } | null {
  if (!value || value === '-' || value.trim() === '') return null;
  const match = value.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/);
  if (match) {
    return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
  }
  return null;
}

// 年齢範囲パース
function parseAgeRange(range: string): { min: number; max: number } | null {
  if (!range || range.trim() === '') return null;

  // "18-29(歳)" パターン
  let match = range.match(/(\d+)-(\d+)\(歳\)/);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }

  // "3-5(歳)" パターン
  match = range.match(/(\d+)-(\d+)/);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }

  // "75以上(歳)" パターン
  match = range.match(/(\d+)以上/);
  if (match) {
    return { min: parseInt(match[1]), max: 999 };
  }

  // "0-5(月)" パターン（月齢は年齢に変換：0歳として扱う）
  match = range.match(/(\d+)-(\d+)\(月\)/);
  if (match) {
    return { min: 0, max: 0 };
  }

  return null;
}

// CSVパース（シンプル実装）
function parseCSV(content: string): string[][] {
  const lines = content.split('\n');
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    // 行番号プレフィックス（"1→"）を除去
    const cleanedLine = line.replace(/^\d+→/, '');
    const cells = cleanedLine.split(',');
    rows.push(cells);
  }

  return rows;
}

// インポート対象行かどうか判定
function shouldImportRow(row: string[]): boolean {
  const sex = row[0]?.trim();
  const ageRange = row[1]?.trim();

  // ヘッダー行をスキップ
  if (sex === '性別') return false;

  // 性別が未定義の行をスキップ
  if (!sex || !sexMapping[sex]) return false;

  // 年齢区分が未定義の行をスキップ
  if (!ageRange) return false;

  // 付加量行をスキップ
  if (ageRange.includes('付加量')) return false;

  // 0-11ヶ月のデータをスキップ（データが不完全なため）
  if (ageRange.includes('月')) return false;

  return true;
}

// 行をデータベースオブジェクトに変換
function rowToData(row: string[]) {
  const sex = sexMapping[row[0]?.trim()] || '';
  const ageRange = row[1]?.trim() || '';
  const parsedAge = parseAgeRange(ageRange);

  if (!parsedAge) {
    console.warn(`Age range parse failed: ${ageRange}`);
    return null;
  }

  // 炭水化物目標のパース
  const carbohydrateRange = parseRange(row[7]);

  // タンパク質目標のパース
  const proteinTargetRange = parseRange(row[12]);

  return {
    sex,
    ageRange,
    ageMin: parsedAge.min,
    ageMax: parsedAge.max,

    // エネルギー
    energyLow: parseNumber(row[4]) ? Math.floor(parseNumber(row[4])!) : null,
    energyModerate: parseNumber(row[5]) ? Math.floor(parseNumber(row[5])!) : null,
    energyHigh: parseNumber(row[6]) ? Math.floor(parseNumber(row[6])!) : null,

    // 炭水化物
    carbohydrateTarget: row[7]?.trim() || null,
    carbohydrateMin: carbohydrateRange?.min || null,
    carbohydrateMax: carbohydrateRange?.max || null,
    fiberTarget: parseNumber(row[8]),

    // タンパク質
    proteinRequired: parseNumber(row[9]),
    proteinRecommended: parseNumber(row[10]),
    proteinAdequate: parseNumber(row[11]),
    proteinTarget: row[12]?.trim() || null,
    proteinTargetMin: proteinTargetRange?.min || null,
    proteinTargetMax: proteinTargetRange?.max || null,

    // 脂質
    fatAdequate: parseNumber(row[13]),
    fatTargetMin: parseNumber(row[14]),
    fatTargetMax: parseNumber(row[15]),
    saturatedFatTarget: parseNumber(row[16]),
    n6FattyAcidAdequate: parseNumber(row[17]),
    n3FattyAcidAdequate: parseNumber(row[56]),

    // ビタミン（脂溶性）
    vitaminARecommended: parseNumber(row[18]),
    vitaminAUpperLimit: parseNumber(row[19]),
    vitaminDAdequate: parseNumber(row[20]),
    vitaminDUpperLimit: parseNumber(row[21]),
    vitaminEAdequate: parseNumber(row[22]),
    vitaminEUpperLimit: parseNumber(row[23]),
    vitaminKAdequate: parseNumber(row[24]),

    // ビタミン（水溶性）
    vitaminB1Recommended: parseNumber(row[26]),
    vitaminB2Recommended: parseNumber(row[29]),
    niacinRecommended: parseNumber(row[32]),
    niacinUpperLimit: parseNumber(row[34]),
    vitaminB6Recommended: parseNumber(row[36]),
    vitaminB6UpperLimit: parseNumber(row[38]),
    vitaminB12Adequate: parseNumber(row[39]),
    folateRecommended: parseNumber(row[41]),
    folateUpperLimit: parseNumber(row[43]),
    pantothenicAcidAdequate: parseNumber(row[44]),
    biotinAdequate: parseNumber(row[45]),
    vitaminCRecommended: parseNumber(row[47]),

    // ミネラル
    sodiumTarget: parseNumber(row[48]),
    potassiumAdequate: parseNumber(row[49]),
    potassiumTarget: parseNumber(row[50]),
    calciumRecommended: parseNumber(row[52]),
    calciumUpperLimit: parseNumber(row[54]),
    magnesiumRecommended: parseNumber(row[56]),
    magnesiumUpperLimit: parseNumber(row[58]),
    phosphorusAdequate: parseNumber(row[59]),
    phosphorusUpperLimit: parseNumber(row[60]),
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/import-nutrition-standards.ts <csv-file-path>');
    process.exit(1);
  }

  const csvPath = args[0];

  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`Reading CSV file: ${csvPath}`);
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(content);

  console.log(`Total rows: ${rows.length}`);

  // 既存データをクリア
  console.log('Clearing existing data...');
  await prisma.nutritionStandard.deleteMany({});

  let importedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!shouldImportRow(row)) {
      skippedCount++;
      continue;
    }

    const data = rowToData(row);
    if (!data) {
      console.warn(`Row ${i + 1}: Failed to parse`);
      skippedCount++;
      continue;
    }

    try {
      await prisma.nutritionStandard.create({ data });
      importedCount++;
      console.log(`Row ${i + 1}: ✅ ${data.sex} ${data.ageRange}`);
    } catch (error) {
      console.error(`Row ${i + 1}: ❌ Failed to import`, error);
      skippedCount++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`Total rows: ${rows.length}`);
  console.log(`Imported: ${importedCount}`);
  console.log(`Skipped: ${skippedCount}`);

  // インポート結果の確認
  const allData = await prisma.nutritionStandard.findMany({
    orderBy: [{ sex: 'asc' }, { ageMin: 'asc' }],
  });

  console.log('\n=== Imported Data Summary ===');
  console.log(`Total records: ${allData.length}`);
  console.log('\nBy Sex:');
  const bySex = allData.reduce((acc, item) => {
    acc[item.sex] = (acc[item.sex] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.table(bySex);

  console.log('\nSample records:');
  console.table(
    allData.slice(0, 5).map((item) => ({
      sex: item.sex,
      ageRange: item.ageRange,
      protein: item.proteinRecommended,
      carbs: `${item.carbohydrateMin}-${item.carbohydrateMax}%`,
      fat: `${item.fatTargetMin}-${item.fatTargetMax}%`,
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
