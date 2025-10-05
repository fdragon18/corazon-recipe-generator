/**
 * 食材の類義語・別名マッピング
 *
 * LLMが出力する食材名とDB内の正式名称のズレを吸収
 */

export interface IngredientAlias {
  variations: string[];  // LLMが出力する可能性のある名前
  dbName: string;        // DB内の正式名称
}

/**
 * よく使われる食材の類義語マッピング
 */
export const INGREDIENT_ALIASES: IngredientAlias[] = [
  // 肉類
  {
    variations: ['豚バラ', '豚ばら', '豚バラ肉', 'ぶたばら', 'ブタバラ', 'pork belly'],
    dbName: '豚肉 ばら'
  },
  {
    variations: ['豚もも', '豚モモ', '豚もも肉', 'ぶたもも', 'pork loin'],
    dbName: '豚肉 もも'
  },
  {
    variations: ['鶏むね', '鶏胸', '鶏むね肉', '鶏胸肉', 'とりむね', 'chicken breast'],
    dbName: '鶏肉 むね'
  },
  {
    variations: ['鶏もも', '鶏モモ', '鶏もも肉', 'とりもも', 'chicken thigh'],
    dbName: '鶏肉 もも'
  },

  // 魚介類
  {
    variations: ['鮭', 'サケ', 'さけ', '生鮭', 'salmon'],
    dbName: 'さけ 生'
  },
  {
    variations: ['鯖', 'サバ', 'さば', '生鯖', 'mackerel'],
    dbName: 'さば 生'
  },
  {
    variations: ['海老', 'エビ', 'えび', 'shrimp'],
    dbName: 'えび'
  },

  // 野菜
  {
    variations: ['玉ねぎ', 'タマネギ', 'たまねぎ', '玉葱', 'onion'],
    dbName: 'たまねぎ'
  },
  {
    variations: ['人参', 'にんじん', 'ニンジン', '胡蘿蔔', 'carrot'],
    dbName: 'にんじん'
  },
  {
    variations: ['じゃがいも', 'ジャガイモ', '馬鈴薯', 'potato'],
    dbName: 'じゃがいも'
  },
  {
    variations: ['トマト', 'tomato', 'とまと'],
    dbName: 'トマト'
  },
  {
    variations: ['キャベツ', 'cabbage', 'きゃべつ'],
    dbName: 'キャベツ'
  },
  {
    variations: ['ほうれん草', 'ホウレンソウ', 'ほうれんそう', 'spinach'],
    dbName: 'ほうれんそう'
  },
  {
    variations: ['大根', 'だいこん', 'ダイコン', 'daikon'],
    dbName: 'だいこん'
  },

  // きのこ類
  {
    variations: ['しめじ', 'シメジ', 'ぶなしめじ', 'ブナシメジ'],
    dbName: 'しめじ'
  },
  {
    variations: ['椎茸', 'シイタケ', 'しいたけ', 'shiitake'],
    dbName: 'しいたけ'
  },
  {
    variations: ['えのき', 'エノキ', 'えのきたけ', 'エノキタケ'],
    dbName: 'えのきたけ'
  },

  // 調味料
  {
    variations: ['醤油', 'しょうゆ', 'ショウユ', 'soy sauce'],
    dbName: '醤油'
  },
  {
    variations: ['味噌', 'みそ', 'ミソ', 'miso'],
    dbName: 'みそ'
  },
  {
    variations: ['砂糖', 'さとう', 'サトウ', 'sugar'],
    dbName: '砂糖'
  },
  {
    variations: ['塩', 'しお', 'シオ', 'salt'],
    dbName: '食塩'
  },
  {
    variations: ['酢', 'す', 'ス', 'vinegar'],
    dbName: '穀物酢'
  },

  // MURO製品（完全一致も追加）
  {
    variations: ['塩麹', 'しおこうじ', 'シオコウジ', '塩こうじ', 'MURO塩麹', 'MUROの塩麹'],
    dbName: 'MUROの塩麹'
  },
  {
    variations: ['醤油麹', 'しょうゆこうじ', 'ショウユコウジ', '醤油こうじ', 'MURO醤油麹', 'MUROの醤油麹'],
    dbName: 'MUROの醤油麹'
  },
  {
    variations: ['にんにく麹', 'ニンニク麹', 'にんにくこうじ', 'MUROにんにく麹', 'MUROのにんにく麹'],
    dbName: 'MUROのにんにく麹'
  },
  {
    variations: ['米麹', 'こめこうじ', 'コメコウジ', '米こうじ', 'MURO米麹', 'MUROの米麹'],
    dbName: 'MUROの米麹'
  }
];

/**
 * 食材名を正規化してDB検索用の名前を取得
 *
 * @param rawName - LLMが出力した食材名
 * @returns DB内の正式名称（見つからない場合は元の名前）
 */
export function normalizeIngredientName(rawName: string): string {
  // 類義語マッピングをチェック
  for (const alias of INGREDIENT_ALIASES) {
    if (alias.variations.some(v => rawName.includes(v) || v.includes(rawName))) {
      return alias.dbName;
    }
  }

  // マッピングがない場合は元の名前を返す
  return rawName;
}

/**
 * 複数の検索キーワードを生成（フォールバック用）
 *
 * @param rawName - 食材名
 * @returns 検索候補のキーワード配列
 */
export function generateSearchKeywords(rawName: string): string[] {
  const keywords = [rawName];

  // 類義語も含める
  for (const alias of INGREDIENT_ALIASES) {
    if (alias.variations.some(v => rawName.includes(v) || v.includes(rawName))) {
      keywords.push(alias.dbName);
      keywords.push(...alias.variations);
      break;
    }
  }

  return [...new Set(keywords)]; // 重複削除
}
