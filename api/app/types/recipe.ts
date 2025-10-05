// レシピ関連の型定義

// 材料（分量付き）
export interface Ingredient {
  item: string;      // 材料名
  amount?: number;   // 分量（数値）
  unit?: string;     // 単位（g, ml, 個など）
}

// 手順
export interface Step {
  step_number: number;  // 手順番号
  description: string;  // 手順の説明
}

// 栄養価情報
export interface Nutrition {
  protein: number;   // タンパク質 (g)
  fat: number;       // 脂質 (g)
  carbs: number;     // 炭水化物 (g)
  sodium: number;    // ナトリウム (mg)
  calories: number;  // カロリー (kcal)
}

// 減塩効果比較
export interface Comparison {
  traditionalSodium: number;  // 従来の塩分量 (mg)
  sodiumReduction: number;    // 減塩率 (%)
  kojiEffect: string;         // 麹の効果説明
}

// レシピ全体
export interface Recipe {
  name: string;
  ingredients: Ingredient[];
  steps: Step[];
  benefit: string;
  nutrition?: Nutrition;    // 栄養価（オプション）
  comparison?: Comparison;  // 減塩効果比較（オプション）
}

// DIFY APIレスポンス
export interface DifyRecipeResponse {
  data: {
    outputs: {
      recipes: Recipe[];
    };
  };
}
