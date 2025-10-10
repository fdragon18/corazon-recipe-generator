/**
 * 栄養基準ライブラリのテスト
 */

import {
  getNutritionStandard,
  calculatePFCRecommendations,
  parseSexToCode,
} from '../app/lib/nutrition-standards';

async function main() {
  console.log('=== 栄養基準ライブラリテスト ===\n');

  // テスト1: 通常ケース（成人男性30歳）
  console.log('1️⃣ 成人男性30歳（通常ケース）');
  const male30 = await getNutritionStandard('male', 30);
  console.log(`   年齢範囲: ${male30.ageRange}`);
  console.log(`   タンパク質推奨: ${male30.proteinRecommended}g/日`);
  console.log(`   デフォルト値: ${male30.isDefault ? 'はい' : 'いいえ'}`);
  console.log(`   注釈: ${male30.note}`);

  // PFC計算（1日2000kcalの場合）
  const pfc = calculatePFCRecommendations(male30, 2000);
  console.log('\n   【1日2000kcalの場合のPFC推奨値】');
  console.log(`   タンパク質: ${pfc.protein.targetMin}-${pfc.protein.targetMax}g (${male30.proteinTargetMin}-${male30.proteinTargetMax}%E)`);
  console.log(`   脂質: ${pfc.fat.targetMin}-${pfc.fat.targetMax}g (${male30.fatTargetMin}-${male30.fatTargetMax}%E)`);
  console.log(`   炭水化物: ${pfc.carbohydrate.targetMin}-${pfc.carbohydrate.targetMax}g (${male30.carbohydrateMin}-${male30.carbohydrateMax}%E)`);
  console.log(`   食物繊維: ${pfc.fiber.target}g`);
  console.log(`   ナトリウム: ${pfc.sodium.target}g`);

  // テスト2: 範囲外（2歳）
  console.log('\n2️⃣ 幼児2歳（範囲外 - 3歳未満）');
  const child2 = await getNutritionStandard('male', 2);
  console.log(`   デフォルト値: ${child2.isDefault ? 'はい' : 'いいえ'}`);
  console.log(`   年齢範囲: ${child2.ageRange}`);
  console.log(`   注釈: ${child2.note}`);

  // テスト3: 範囲外（100歳）
  console.log('\n3️⃣ 高齢者100歳（75歳超でもデータあり）');
  const elder100 = await getNutritionStandard('female', 100);
  console.log(`   デフォルト値: ${elder100.isDefault ? 'はい' : 'いいえ'}`);
  console.log(`   年齢範囲: ${elder100.ageRange}`);
  console.log(`   タンパク質推奨: ${elder100.proteinRecommended}g/日`);
  console.log(`   注釈: ${elder100.note}`);

  // テスト4: 性別未設定
  console.log('\n4️⃣ 性別未設定・年齢30歳');
  const noSex = await getNutritionStandard(null, 30);
  console.log(`   デフォルト値: ${noSex.isDefault ? 'はい' : 'いいえ'}`);
  console.log(`   年齢範囲: ${noSex.ageRange}`);
  console.log(`   注釈: ${noSex.note}`);

  // テスト5: 年齢未設定
  console.log('\n5️⃣ 性別男性・年齢未設定');
  const noAge = await getNutritionStandard('male', null);
  console.log(`   デフォルト値: ${noAge.isDefault ? 'はい' : 'いいえ'}`);
  console.log(`   年齢範囲: ${noAge.ageRange}`);
  console.log(`   注釈: ${noAge.note}`);

  // テスト6: 性別・年齢両方未設定
  console.log('\n6️⃣ 性別・年齢両方未設定');
  const noBoth = await getNutritionStandard(null, null);
  console.log(`   デフォルト値: ${noBoth.isDefault ? 'はい' : 'いいえ'}`);
  console.log(`   年齢範囲: ${noBoth.ageRange}`);
  console.log(`   注釈: ${noBoth.note}`);

  // テスト7: 性別変換
  console.log('\n7️⃣ 性別変換テスト');
  const sexTests = ['男性', '女性', '男', '女', 'male', 'female', 'M', 'F', null, ''];
  for (const sex of sexTests) {
    const parsed = parseSexToCode(sex);
    console.log(`   "${sex}" → ${parsed}`);
  }

  console.log('\n✅ すべてのテスト完了');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
