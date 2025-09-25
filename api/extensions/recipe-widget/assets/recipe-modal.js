// Theme App Extension: Recipe Modal JavaScript
// App Proxy経由でAPIにアクセス

let currentPage = 1;
const totalPages = 3;
let generatedRecipes = [];

// フローティングボタンのトグル
function toggleFormWindow() {
  const formWindow = document.getElementById('formPopupWindow');
  const isOpen = formWindow.classList.contains('active');

  if (isOpen) {
    formWindow.classList.remove('active');
  } else {
    formWindow.classList.add('active');
    // 通知ドットを非表示
    const dot = document.querySelector('.notification-dot');
    if (dot) dot.style.display = 'none';
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

// フォーム送信処理（App Proxy経由）
document.getElementById('kojiRecipeForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('generateRecipeBtn');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');

  // UI制御
  submitBtn.disabled = true;
  loadingIndicator.classList.remove('hidden');
  errorMessage.classList.add('hidden');

  // フォームデータ取得
  const condition = document.getElementById('userConditionInput').value.trim();
  const needs = document.getElementById('dietaryNeedsInput').value.trim();
  const kojiType = document.getElementById('kojiTypeSelect').value;
  const otherIngredients = document.getElementById('otherIngredientsInput').value.trim();

  try {
    // App Proxy経由でAPIを呼び出し
    // Shopifyが自動的にHMAC署名を付与
    const response = await fetch('/apps/recipe-generator/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        condition: condition,
        needs: needs,
        kojiType: kojiType,
        otherIngredients: otherIngredients
      })
    });

    if (!response.ok) {
      throw new Error(`APIエラー: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.recipes) {
      generatedRecipes = data.recipes;

      if (generatedRecipes.length === 3) {
        displayRecipes();
        openRecipeModal();
        toggleFormWindow(); // フォームを閉じる
      } else {
        throw new Error('レシピの生成に失敗しました');
      }
    } else {
      throw new Error(data.message || 'レシピの生成に失敗しました');
    }

  } catch (error) {
    console.error('エラー:', error);
    errorMessage.querySelector('p').textContent = error.message || 'レシピの生成に失敗しました。もう一度お試しください。';
    errorMessage.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    loadingIndicator.classList.add('hidden');
  }
});

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
    steps.forEach((step, index) => {
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