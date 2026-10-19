import { api } from './api.js';
import { renderCart } from './cart.js';
import { renderProducts } from './catalog.js';
import { state } from './state.js';

const elements = {
  pageHeading: document.querySelector('#page-heading'),
  loginView: document.querySelector('[data-page-view="login"]'),
  catalogView: document.querySelector('[data-page-view="catalog"]'),
  loginForm: document.querySelector('[data-login-form]'),
  loginMessage: document.querySelector('[data-login-message]'),
  demoHint: document.querySelector('[data-demo-hint]'),
  modeDescription: document.querySelector('[data-mode-description]'),
  modeButtons: [...document.querySelectorAll('[data-mode]')],
  navButtons: [...document.querySelectorAll('[data-view]')],
  searchInput: document.querySelector('[data-search-input]'),
  clearSearch: document.querySelector('[data-clear-search]'),
  catalogStatus: document.querySelector('[data-catalog-status]'),
  productGrid: document.querySelector('[data-product-grid]'),
  cartPanel: document.querySelector('[data-cart-panel]'),
  cartToggle: document.querySelector('[data-cart-toggle]'),
  cartClose: document.querySelector('[data-cart-close]'),
  cartItems: document.querySelector('[data-cart-items]'),
  cartCount: document.querySelector('[data-cart-count]'),
  cartHeadingCount: document.querySelector('[data-cart-heading-count]'),
  cartTotal: document.querySelector('[data-cart-total]'),
  toast: document.querySelector('[data-toast]')
};

function setMessage(text, isError = false) {
  elements.loginMessage.textContent = text;
  elements.loginMessage.classList.toggle('is-error', isError);
}

function showToast(text) {
  elements.toast.textContent = text;
  elements.toast.classList.add('is-visible');
  window.setTimeout(() => elements.toast.classList.remove('is-visible'), 1500);
}

function setHeading(view) {
  elements.pageHeading.replaceChildren();
  if (view === 'catalog') {
    elements.pageHeading.append('Small comforts,');
  } else {
    elements.pageHeading.append('Good things,');
  }
  elements.pageHeading.append(document.createElement('br'));
  const emphasis = document.createElement('em');
  emphasis.textContent = view === 'catalog' ? 'well chosen.' : 'kept simple.';
  elements.pageHeading.append(emphasis);
}

function setView(view) {
  state.currentView = view;
  elements.loginView.classList.toggle('is-hidden', view !== 'login');
  elements.catalogView.classList.toggle('is-hidden', view !== 'catalog');
  setHeading(view);
  elements.navButtons.forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  if (view === 'catalog') loadProducts(elements.searchInput.value.trim());
}

function setMode(mode) {
  state.mode = mode;
  elements.modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('is-selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  elements.modeDescription.textContent = mode === 'safe'
    ? 'Safe mode checks input and creates a short-lived, HttpOnly demo session.'
    : 'Training mode accepts the login request only as a simulation; it never grants a session.';
  elements.demoHint.textContent = mode === 'safe'
    ? 'Use the synthetic credentials listed in the project README.'
    : 'No account is needed. The simulated response never unlocks the account API.';
  setMessage('');
}

function refreshCart() {
  renderCart(elements.cartItems, state, elements.cartCount, elements.cartHeadingCount, elements.cartTotal);
}

async function loadProducts(query = '') {
  elements.catalogStatus.textContent = 'Loading the local catalog…';
  try {
    const result = await api.products(query);
    state.products = result.items;
    renderProducts(elements.productGrid, result.items, addToCart);
    elements.catalogStatus.textContent = `${result.count} ${result.count === 1 ? 'piece' : 'pieces'}${query ? ` matching “${query}”` : ' in the edit'}.`;
  } catch (error) {
    elements.catalogStatus.textContent = error.message;
    elements.productGrid.replaceChildren();
  }
}

function addToCart(productId) {
  const current = state.cart.get(productId) || 0;
  state.cart.set(productId, current + 1);
  refreshCart();
  showToast('Added to your basket');
}

elements.navButtons.forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
elements.modeButtons.forEach((button) => button.addEventListener('click', async () => {
  try {
    const result = await api.mode(button.dataset.mode);
    setMode(result.mode);
  } catch (error) {
    setMessage(error.message, true);
  }
}));

let searchTimer;
elements.searchInput.addEventListener('input', () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => loadProducts(elements.searchInput.value.trim()), 180);
});
elements.clearSearch.addEventListener('click', () => {
  elements.searchInput.value = '';
  loadProducts();
  elements.searchInput.focus();
});

elements.cartToggle.addEventListener('click', () => elements.cartPanel.classList.toggle('is-hidden'));
elements.cartClose.addEventListener('click', () => elements.cartPanel.classList.add('is-hidden'));

elements.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(elements.loginForm);
  const email = String(form.get('email') || '');
  const password = String(form.get('password') || '');
  setMessage('Checking the local demo…');
  try {
    const result = await api.login(email, password);
    setMessage(result.message);
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    elements.loginForm.elements.password.value = '';
  }
});

try {
  const config = await api.config();
  setMode(config.mode);
  refreshCart();
} catch (error) {
  setMessage(`Local API unavailable: ${error.message}`, true);
}