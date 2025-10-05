// Theme App Extension: Recipe Modal JavaScript
// App Proxy経由でAPIにアクセス

let currentPage = 1;
const totalPages = 3;
let generatedRecipes = [];

// ボタンテキストのレスポンシブサイズ調整
function adjustButtonTextSize() {
  const buttonText = document.querySelector('.button-text');
  if (buttonText) {
    const text = buttonText.textContent.trim();
    const length = text.length;

    // 既存のdata-length属性を削除
    buttonText.removeAttribute('data-length');

    // 文字数に応じてdata-length属性を設定
    if (length === 1) {
      buttonText.setAttribute('data-length', '1');
    } else if (length === 2) {
      buttonText.setAttribute('data-length', '2');
    } else if (length === 3) {
      buttonText.setAttribute('data-length', '3');
    } else {
      buttonText.setAttribute('data-length', '4+');
    }
  }
}

// ページ読み込み時にボタンサイズを調整
document.addEventListener('DOMContentLoaded', adjustButtonTextSize);

// テキスト変更を監視（Theme Editorでの変更に対応）
if (window.MutationObserver) {
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        adjustButtonTextSize();
      }
    });
  });

  // ボタンテキストの変更を監視
  const buttonText = document.querySelector('.button-text');
  if (buttonText) {
    observer.observe(buttonText, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
}

// フローティングボタンのトグル
function toggleFormWindow() {
  const formWindow = document.getElementById('formPopupWindow');
  const isOpen = formWindow.classList.contains('active');

  if (isOpen) {
    formWindow.classList.remove('active');
  } else {
    formWindow.classList.add('active');
  }
}

// ウィンドウ外クリックで閉じる
document.addEventListener('click', function(e) {
  const formWindow = document.getElementById('formPopupWindow');
  const button = document.querySelector('.floating-toggle-btn');

  if (formWindow && button && !formWindow.contains(e.target) && !button.contains(e.target)) {
    formWindow.classList.remove('active');
  }
});

// フォーム送信処理
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('kojiRecipeForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
});

async function handleFormSubmit(e) {
  e.preventDefault();

  // フォームデータを取得
  const condition = document.getElementById('userConditionInput').value.trim();
  const needs = document.getElementById('dietaryNeedsInput').value.trim();
  const kojiType = document.getElementById('kojiTypeSelect').value;
  const otherIngredients = document.getElementById('otherIngredientsInput').value.trim();

  // バリデーション
  if (!condition) {
    showError('現在の体調やお悩みを入力してください。');
    return;
  }

  // ローディング表示
  showLoading();
  hideError();

  try {
    // FormDataを作成
    const formData = new FormData();
    formData.append('condition', condition);
    formData.append('needs', needs);
    formData.append('kojiType', kojiType);
    formData.append('otherIngredients', otherIngredients);

    // 顧客IDを追加（Liquidから取得した値）
    const customerId = document.getElementById('customerIdField')?.value || '';
    if (customerId) {
      formData.append('customerId', customerId);
      console.log('顧客ID:', customerId);
    } else {
      console.log('ゲストユーザー（顧客IDなし）');
    }

    // APIエンドポイントを構築
    const apiUrl = `/apps/recipe_gen/generate`;

    console.log('APIリクエスト送信:', { condition, needs, kojiType, otherIngredients, customerId: customerId || 'guest' });

    // API呼び出し
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (data.success && data.recipes && data.recipes.length === 3) {
      // レシピ生成成功
      generatedRecipes = data.recipes;

      // 顧客情報を保存（栄養推奨量計算用）
      window.customerInfo = data.customer || { age: null, sex: null };
      console.log('顧客情報を保存:', window.customerInfo);

      displayRecipes(data.recipes);
      hideLoading();
      toggleFormWindow(); // フォームを閉じる
      openRecipeModal(); // レシピモーダルを表示
    } else {
      throw new Error(data.message || 'レシピの生成に失敗しました');
    }

  } catch (error) {
    console.error('レシピ生成エラー:', error);
    hideLoading();
    showError(error.message || 'レシピ生成中にエラーが発生しました。しばらく時間をおいて再試行してください。');
  }
}

// ローディング表示/非表示
function showLoading() {
  const loadingContainer = document.getElementById('loadingIndicator');
  const submitButton = document.getElementById('generateRecipeBtn');

  if (loadingContainer) {
    loadingContainer.classList.remove('hidden');
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'レシピ作成中...';
  }
}

function hideLoading() {
  const loadingContainer = document.getElementById('loadingIndicator');
  const submitButton = document.getElementById('generateRecipeBtn');

  if (loadingContainer) {
    loadingContainer.classList.add('hidden');
  }

  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = '麹レシピ生成';
  }
}

// エラー表示/非表示
function showError(message) {
  const errorContainer = document.getElementById('errorMessage');
  const errorText = errorContainer?.querySelector('.error-text');

  if (errorContainer && errorText) {
    errorText.textContent = message;
    errorContainer.classList.remove('hidden');
  }
}

function hideError() {
  const errorContainer = document.getElementById('errorMessage');
  if (errorContainer) {
    errorContainer.classList.add('hidden');
  }
}

// レシピをモーダルに表示
function displayRecipes() {
  for (let i = 0; i < 3; i++) {
    const recipe = generatedRecipes[i];
    const pageNum = i + 1;

    document.getElementById(`recipe${pageNum}Name`).textContent = recipe.name || `レシピ${pageNum}`;

    // 材料を分量付きで表示
    const ingredientsContainer = document.getElementById(`recipe${pageNum}Ingredients`);
    ingredientsContainer.innerHTML = '';

    if (Array.isArray(recipe.ingredients)) {
      recipe.ingredients.forEach(ing => {
        const ingDiv = document.createElement('div');
        ingDiv.className = 'ingredient-item';

        // 分量がある場合は「鶏むね肉 200g」形式で表示
        if (ing.amount && ing.unit) {
          ingDiv.textContent = `${ing.item} ${ing.amount}${ing.unit}`;
        } else {
          ingDiv.textContent = ing.item || ing;
        }

        ingredientsContainer.appendChild(ingDiv);
      });
    } else {
      ingredientsContainer.textContent = recipe.ingredients || '';
    }

    // 作り方をステップごとに表示（配列形式に対応）
    const stepsContainer = document.getElementById(`recipe${pageNum}Steps`);
    stepsContainer.innerHTML = '';
    const steps = Array.isArray(recipe.steps)
      ? recipe.steps
      : (recipe.steps ? recipe.steps.split('\n').filter(s => s.trim()) : []);

    steps.forEach((step) => {
      const stepDiv = document.createElement('div');
      stepDiv.className = 'recipe-step';
      // stepがオブジェクトの場合はdescriptionを取得、文字列ならそのまま使用
      stepDiv.textContent = typeof step === 'object' ? step.description : step.trim();
      stepsContainer.appendChild(stepDiv);
    });

    document.getElementById(`recipe${pageNum}Benefit`).textContent = recipe.benefit || '';

    // 栄養素を表示
    if (recipe.nutrition) {
      displayNutrition(pageNum, recipe.nutrition);
    }

    // 減塩効果を表示
    if (recipe.comparison) {
      displayComparison(pageNum, recipe.comparison);
    }
  }
}

/**
 * 年齢・性別に基づく1日の推奨摂取量を計算
 * @param {number|null} age - 年齢（Metafieldから取得、nullの場合はデフォルト）
 * @param {string|null} sex - 性別（'male', 'female', またはnull）
 * @returns {Object} 推奨摂取量
 */
function getDailyRecommended(age = null, sex = null) {
  // 🔮 将来実装: 年齢・性別による動的計算
  // 現在はデフォルト値（成人平均）を返す

  // 参考値：
  // - 成人男性（18-64歳）: カロリー 2200-2700kcal, タンパク質 65g, 脂質 55g, 炭水化物 330g, 塩分 7.5g
  // - 成人女性（18-64歳）: カロリー 1700-2000kcal, タンパク質 50g, 脂質 45g, 炭水化物 260g, 塩分 6.5g
  // - 高齢者（65歳以上）: カロリー 1800-2200kcal, タンパク質 60g, 塩分 7.0g

  // TODO: 顧客Metafield（custom.age, custom.sex）から取得した値で動的計算
  // if (age && sex) {
  //   if (sex === 'male') {
  //     if (age >= 65) return { calories: 2000, protein: 60, fat: 50, carbs: 275, sodium: 7.0 };
  //     return { calories: 2400, protein: 65, fat: 55, carbs: 330, sodium: 7.5 };
  //   } else if (sex === 'female') {
  //     if (age >= 65) return { calories: 1700, protein: 50, fat: 45, carbs: 230, sodium: 6.5 };
  //     return { calories: 1850, protein: 50, fat: 45, carbs: 260, sodium: 6.5 };
  //   }
  // }

  // デフォルト値（成人平均）
  return {
    calories: 2000,     // kcal
    protein: 60,        // g
    fat: 50,            // g
    carbs: 300,         // g
    sodium: 7.5         // g（食塩相当量）
  };
}

// 栄養素を表示
function displayNutrition(pageNum, nutrition) {
  const container = document.getElementById(`recipe${pageNum}Nutrition`);
  if (!container) return;

  // 顧客情報を取得（APIレスポンスから保存されたもの）
  const customerInfo = window.customerInfo || { age: null, sex: null };

  // 1日の推奨摂取量を取得（顧客の年齢・性別を考慮）
  const dailyRecommended = getDailyRecommended(customerInfo.age, customerInfo.sex);

  // 推奨量に対する割合を計算
  const proteinPercent = Math.round((nutrition.protein / dailyRecommended.protein) * 100);
  const fatPercent = Math.round((nutrition.fat / dailyRecommended.fat) * 100);
  const carbsPercent = Math.round((nutrition.carbs / dailyRecommended.carbs) * 100);
  const sodiumPercent = Math.round(((nutrition.sodium / 1000) / dailyRecommended.sodium) * 100);

  container.innerHTML = `
    <div class="nutrition-item">
      <span class="nutrition-label">カロリー</span>
      <span class="nutrition-value">${nutrition.calories} kcal</span>
    </div>
    <div class="nutrition-item">
      <span class="nutrition-label">タンパク質</span>
      <div class="nutrition-bar">
        <div class="nutrition-bar-fill" style="width: ${Math.min(proteinPercent, 100)}%"></div>
        <span class="nutrition-bar-text">${nutrition.protein}g（1日の${proteinPercent}%）</span>
      </div>
    </div>
    <div class="nutrition-item">
      <span class="nutrition-label">脂質</span>
      <div class="nutrition-bar">
        <div class="nutrition-bar-fill" style="width: ${Math.min(fatPercent, 100)}%"></div>
        <span class="nutrition-bar-text">${nutrition.fat}g（1日の${fatPercent}%）</span>
      </div>
    </div>
    <div class="nutrition-item">
      <span class="nutrition-label">炭水化物</span>
      <div class="nutrition-bar">
        <div class="nutrition-bar-fill" style="width: ${Math.min(carbsPercent, 100)}%"></div>
        <span class="nutrition-bar-text">${nutrition.carbs}g（1日の${carbsPercent}%）</span>
      </div>
    </div>
    <div class="nutrition-item">
      <span class="nutrition-label">塩分</span>
      <div class="nutrition-bar">
        <div class="nutrition-bar-fill sodium" style="width: ${Math.min(sodiumPercent, 100)}%"></div>
        <span class="nutrition-bar-text">${(nutrition.sodium / 1000).toFixed(1)}g（1日の${sodiumPercent}%）</span>
      </div>
    </div>
  `;
}

// 減塩効果を表示
function displayComparison(pageNum, comparison) {
  const container = document.getElementById(`recipe${pageNum}Comparison`);
  if (!container) return;

  const kojiSodium = comparison.traditionalSodium * (1 - comparison.sodiumReduction / 100);

  container.innerHTML = `
    <div class="comparison-bars">
      <div class="comparison-item traditional">
        <span class="comparison-label">従来レシピ</span>
        <div class="comparison-bar">
          <div class="comparison-bar-fill traditional" style="width: 100%"></div>
          <span class="comparison-value">${(comparison.traditionalSodium / 1000).toFixed(1)}g</span>
        </div>
      </div>
      <div class="comparison-item koji">
        <span class="comparison-label">麹レシピ</span>
        <div class="comparison-bar">
          <div class="comparison-bar-fill koji" style="width: ${100 - comparison.sodiumReduction}%"></div>
          <span class="comparison-value">${(kojiSodium / 1000).toFixed(1)}g (-${comparison.sodiumReduction.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
    <p class="koji-effect">${comparison.kojiEffect}</p>
  `;
}

// モーダル制御
function openRecipeModal() {
  document.getElementById('recipeModal').classList.add('active');
  currentPage = 1;
  showRecipePage(currentPage);
}

function closeRecipeModal() {
  document.getElementById('recipeModal').classList.remove('active');
}

// ページ切り替え
function changeRecipePage(direction) {
  const newPage = currentPage + direction;
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    showRecipePage(currentPage);
  }
}

function showRecipePage(pageNum) {
  // すべてのページを非表示
  for (let i = 1; i <= totalPages; i++) {
    document.getElementById(`recipePage${i}`).classList.remove('active');
  }

  // 指定ページを表示
  document.getElementById(`recipePage${pageNum}`).classList.add('active');

  // ページインジケーター更新
  document.getElementById('pageIndicator').textContent = `${pageNum} / ${totalPages}`;

  // ボタン状態更新
  document.getElementById('prevBtn').disabled = pageNum === 1;
  document.getElementById('nextBtn').disabled = pageNum === totalPages;
}

// モーダル外クリックで閉じる
document.getElementById('recipeModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeRecipeModal();
  }
});

// ESCキーで閉じる
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const recipeModal = document.getElementById('recipeModal');
    const formWindow = document.getElementById('formPopupWindow');

    if (recipeModal && recipeModal.classList.contains('active')) {
      closeRecipeModal();
    } else if (formWindow && formWindow.classList.contains('active')) {
      toggleFormWindow();
    }
  }
});