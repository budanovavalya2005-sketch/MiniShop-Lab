export function renderCart(itemsRoot, state, countRoot, headingCountRoot, totalRoot) {
  itemsRoot.replaceChildren();
  let count = 0;
  let total = 0;
  const rows = [...state.cart.entries()];

  if (rows.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-cart';
    empty.textContent = 'Your basket is still empty.';
    itemsRoot.append(empty);
  }

  for (const [id, quantity] of rows) {
    const product = state.products.find((item) => item.id === id);
    if (!product) continue;
    count += quantity;
    total += product.price * quantity;
    const row = document.createElement('div');
    row.className = 'cart-row';
    const name = document.createElement('span');
    name.className = 'cart-row-name';
    name.textContent = product.name;
    const lineTotal = document.createElement('strong');
    lineTotal.textContent = `$${(product.price * quantity).toFixed(2)}`;
    const meta = document.createElement('span');
    meta.className = 'cart-row-meta';
    meta.textContent = `Qty ${quantity} · $${product.price.toFixed(2)} each`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'cart-remove';
    remove.textContent = 'Remove one';
    remove.addEventListener('click', () => {
      if (quantity <= 1) state.cart.delete(id);
      else state.cart.set(id, quantity - 1);
      renderCart(itemsRoot, state, countRoot, headingCountRoot, totalRoot);
    });
    row.append(name, lineTotal, meta, remove);
    itemsRoot.append(row);
  }

  countRoot.textContent = String(count);
  headingCountRoot.textContent = `(${count})`;
  totalRoot.textContent = `$${total.toFixed(2)}`;
}