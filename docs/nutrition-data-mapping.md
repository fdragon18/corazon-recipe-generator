# 栄養素データ カラムマッピング仕様

## 概要
厚生労働省「日本人の食事摂取基準（2025年版）」のCSVデータを、英語カラム名でデータベースにインポートするためのマッピング定義。

## 基本情報

| 日本語カラム名 | 英語カラム名 | データ型 | 備考 |
|--------------|------------|---------|------|
| 性別 | sex | String | "男性"→"male", "女性"→"female", "妊婦"→"pregnant", "授乳婦"→"lactating" |
| 年齢区分 | age_range | String | 元データ（例: "3-5(歳)", "18-29(歳)"） |
| - | age_min | Integer | パース結果（例: 3, 18） |
| - | age_max | Integer | パース結果（例: 5, 29） |

## エネルギー（身体活動レベル別）

| 日本語カラム名 | 英語カラム名 | データ型 | 単位 |
|--------------|------------|---------|------|
| 身体活動レベル_低い | energy_low | Integer | kcal/日 |
| 身体活動レベル_ふつう | energy_moderate | Integer | kcal/日 |
| 身体活動レベル_高い | energy_high | Integer | kcal/日 |

## 炭水化物

| 日本語カラム名 | 英語カラム名 | データ型 | 単位 |
|--------------|------------|---------|------|
| 炭水化物目標(%) | carbohydrate_target | String | 元データ（例: "50-65"） |
| - | carbohydrate_min | Float | % エネルギー |
| - | carbohydrate_max | Float | % エネルギー |
| 食物繊維目標(g) | fiber_target | Float | g/日 |

## タンパク質

| 日本語カラム名 | 英語カラム名 | データ型 | 単位 |
|--------------|------------|---------|------|
| タンパク質必要量(g) | protein_required | Float | g/日 |
| タンパク質推奨(g) | protein_recommended | Float | g/日 |
| タンパク質目安(g) | protein_adequate | Float | g/日 |
| タンパク質目標 | protein_target | String | 元データ（例: "13-20"） |
| - | protein_target_min | Float | % エネルギー |
| - | protein_target_max | Float | % エネルギー |

## 脂質

| 日本語カラム名 | 英語カラム名 | データ型 | 単位 |
|--------------|------------|---------|------|
| 脂質目安 | fat_adequate | Float | g/日 |
| 脂質目標下限 | fat_target_min | Float | % エネルギー |
| 脂質目標上限 | fat_target_max | Float | % エネルギー |
| 飽和脂肪酸目標 | saturated_fat_target | Float | % エネルギー |
| n-6系脂肪酸目安 | n6_fatty_acid_adequate | Float | g/日 |
| 脂質_n-3系脂肪酸_目安量 | n3_fatty_acid_adequate | Float | g/日 |

## ビタミン（脂溶性）

| 日本語カラム名 | 英語カラム名 | データ型 | 単位 |
|--------------|------------|---------|------|
| ビタミンA推奨(μgRAE) | vitamin_a_recommended | Float | μgRAE/日 |
| ビタミンA上限(μgRAE) | vitamin_a_upper_limit | Float | μgRAE/日 |
| ビタミンD目安 | vitamin_d_adequate | Float | μg/日 |
| ビタミンD上限 | vitamin_d_upper_limit | Float | μg/日 |
| ビタミンE目安 | vitamin_e_adequate | Float | mg/日 |
| ビタミンE上限 | vitamin_e_upper_limit | Float | mg/日 |
| ビタミンK目安 | vitamin_k_adequate | Float | μg/日 |

## ビタミン（水溶性）

| 日本語カラム名 | 英語カラム名 | データ型 | 単位 |
|--------------|------------|---------|------|
| ビタミンB1推奨mg | vitamin_b1_recommended | Float | mg/日 |
| ビタミンB2推奨mg | vitamin_b2_recommended | Float | mg/日 |
| ナイアシン推奨mgNE | niacin_recommended | Float | mgNE/日 |
| ナイアシン上限mgNE | niacin_upper_limit | Float | mgNE/日 |
| ビタミンB6推奨mg | vitamin_b6_recommended | Float | mg/日 |
| ビタミンB6上限mg | vitamin_b6_upper_limit | Float | mg/日 |
| ビタミンB12目安µg | vitamin_b12_adequate | Float | μg/日 |
| 葉酸推奨µg | folate_recommended | Float | μg/日 |
| 葉酸上限µg | folate_upper_limit | Float | μg/日 |
| パントテン酸目安mg | pantothenic_acid_adequate | Float | mg/日 |
| ビオチン目安µg | biotin_adequate | Float | μg/日 |
| ビタミンC推奨mg | vitamin_c_recommended | Float | mg/日 |

## ミネラル

| 日本語カラム名 | 英語カラム名 | データ型 | 単位 |
|--------------|------------|---------|------|
| ナトリウム目標g/日 | sodium_target | Float | g/日 |
| カリウム目安mg/日 | potassium_adequate | Float | mg/日 |
| カリウム目標mg/日 | potassium_target | Float | mg/日 |
| カルシウム推奨mg/日 | calcium_recommended | Float | mg/日 |
| カルシウム上限mg/日 | calcium_upper_limit | Float | mg/日 |
| マグネシウム推奨mg/日 | magnesium_recommended | Float | mg/日 |
| マグネシウム上限mg/日 | magnesium_upper_limit | Float | mg/日 |
| リン目安mg/日 | phosphorus_adequate | Float | mg/日 |
| リン上限mg/日 | phosphorus_upper_limit | Float | mg/日 |

## データ変換ルール

### 1. 性別変換
```typescript
const sexMapping: Record<string, string> = {
  "男性": "male",
  "女性": "female",
  "妊婦": "pregnant",
  "授乳婦": "lactating"
};
```

### 2. 年齢範囲パース
```typescript
// 例: "3-5(歳)" → { min: 3, max: 5 }
// 例: "18-29(歳)" → { min: 18, max: 29 }
// 例: "75以上(歳)" → { min: 75, max: 999 }
function parseAgeRange(range: string): { min: number; max: number } {
  const match = range.match(/(\d+)-(\d+)/);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }
  const aboveMatch = range.match(/(\d+)以上/);
  if (aboveMatch) {
    return { min: parseInt(aboveMatch[1]), max: 999 };
  }
  const singleMatch = range.match(/(\d+)-(\d+)\(月\)|(\d+)-(\d+)\(歳\)/);
  if (singleMatch) {
    return {
      min: parseInt(singleMatch[1] || singleMatch[3]),
      max: parseInt(singleMatch[2] || singleMatch[4])
    };
  }
  throw new Error(`Cannot parse age range: ${range}`);
}
```

### 3. 範囲値パース（例: "50-65", "13-20"）
```typescript
function parseRange(value: string): { min: number; max: number } | null {
  if (!value || value === "-") return null;
  const match = value.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/);
  if (match) {
    return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
  }
  return null;
}
```

### 4. 数値変換（空白・ハイフン処理）
```typescript
function parseNumber(value: string): number | null {
  if (!value || value === "-" || value.trim() === "") return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}
```

### 5. 特殊記号の除去
- `※` マーク（注釈記号）を除去
- 全角スペースを半角に変換
- `以上`、`以下` の文字列処理

## 欠損値処理

| 値 | 処理方法 |
|---|---------|
| `-` | `null` |
| 空文字 | `null` |
| 全角スペース | `null` |

## インポート除外行

以下の行はデータとして不完全なため、インポート時にスキップ:

1. **0-5ヶ月、6-11ヶ月**（32-33行目）: 一部栄養素のみ記載
2. **付加量行**（41-42行目）: 妊婦・授乳婦の付加量（将来的に加算処理で対応）

## 出力フォーマット例

```json
{
  "sex": "male",
  "age_range": "18-29(歳)",
  "age_min": 18,
  "age_max": 29,
  "energy_low": 2250,
  "energy_moderate": 2650,
  "energy_high": 3050,
  "carbohydrate_target": "50-65",
  "carbohydrate_min": 50,
  "carbohydrate_max": 65,
  "protein_recommended": 65,
  "protein_target": "13-20",
  "protein_target_min": 13,
  "protein_target_max": 20,
  "fat_target_min": 20,
  "fat_target_max": 30,
  "fiber_target": 20,
  "sodium_target": 7.5
}
```

## 注意事項

1. **単位の統一**: すべて「/日」あたりの推奨量
2. **%エネルギー**: 炭水化物・タンパク質・脂質の目標値は総エネルギーに対する割合
3. **年齢の月/歳表記**: 0-2歳は「月」単位、3歳以上は「歳」単位
4. **妊婦・授乳婦**: 基礎値+付加量の合計値（将来実装）
5. **欠損値**: データベースには `null` として保存
