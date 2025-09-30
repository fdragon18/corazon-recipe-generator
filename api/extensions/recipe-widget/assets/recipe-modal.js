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

    // APIエンドポイントを構築
    const apiUrl = `/apps/recipe_gen/generate`;

    console.log('APIリクエスト送信:', { condition, needs, kojiType, otherIngredients });

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
    document.getElementById(`recipe${pageNum}Ingredients`).textContent = recipe.ingredients || '';

    // 作り方をステップごとに表示
    const stepsContainer = document.getElementById(`recipe${pageNum}Steps`);
    stepsContainer.innerHTML = '';
    const steps = recipe.steps ? recipe.steps.split('\n').filter(s => s.trim()) : [];
    steps.forEach((step) => {
      const stepDiv = document.createElement('div');
      stepDiv.className = 'recipe-step';
      stepDiv.textContent = step.trim();
      stepsContainer.appendChild(stepDiv);
    });

    document.getElementById(`recipe${pageNum}Benefit`).textContent = recipe.benefit || '';
  }
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