export function renderProducts(root, products, onAdd) {
  root.replaceChildren();
  for (const [index, product] of products.entries()) {
    const card = document.createElement('article');
    card.className = 'product-card';

    const swatch = document.createElement('div');
    swatch.className = 'product-swatch';
    swatch.classList.add(`product-swatch-${index % 7}`);
    swatch.setAttribute('aria-hidden', 'true');
    swatch.textContent = product.name.slice(0, 1);

    const category = document.createElement('p');
    category.className = 'product-category';
    category.textContent = product.category;

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = product.name;

    const description = document.createElement('p');
    description.className = 'product-description';
    description.textContent = product.description;

    const footer = document.createElement('div');
    footer.className = 'product-card-footer';
    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = `$${Number(product.price).toFixed(2)}`;
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'add-button';
    add.setAttribute('aria-label', `Add ${product.name} to cart`);
    add.textContent = 'Add to cart';
    add.addEventListener('click', () => onAdd(product.id));
    footer.append(price, add);
    card.append(swatch, category, name, description, footer);
    root.append(card);
  }
}