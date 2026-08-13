/*
 * CATÁLOGO - JavaScript Vanilla
 * Cambia únicamente WHATSAPP_NUMBER para configurar el contacto.
 */
const WHATSAPP_NUMBER = "51986437411";

const CATEGORY_META = {
  all: { label: "Todas", icon: "◈" },
  guantes: { label: "Guantes de Boxeo", icon: "◉" },
  vendas: { label: "Vendas", icon: "≋" },
  cascos: { label: "Cascos", icon: "⬡" },
  protectores: { label: "Protectores", icon: "◇" },
  sacos: { label: "Sacos", icon: "▣" },
  ropa: { label: "Ropa", icon: "□" },
  accesorios: { label: "Accesorios", icon: "◆" },
  mma: { label: "MMA", icon: "✦" }
};

const state = {
  category: "all",
  search: "",
  sort: "recommended"
};

const elements = {
  productsGrid: document.querySelector("#products-grid"),
  productCount: document.querySelector("#product-count"),
  emptyState: document.querySelector("#empty-state"),
  filterRow: document.querySelector("#filter-row"),
  categoriesGrid: document.querySelector("#categories-grid"),
  footerCategories: document.querySelector("#footer-categories"),
  searchInput: document.querySelector("#search-input"),
  sortSelect: document.querySelector("#sort-select"),
  clearFilters: document.querySelector("#clear-filters"),
  modal: document.querySelector("#product-modal"),
  modalContent: document.querySelector("#modal-content"),
  menuToggle: document.querySelector(".menu-toggle"),
  mainNav: document.querySelector("#main-nav")
};

function formatPrice(price, currency = "PEN") {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2
  }).format(price);
}

function getStockInfo(stock) {
  const stockMap = {
    available: { label: "Disponible", className: "stock-available" },
    low: { label: "Poco stock", className: "stock-low" },
    soldout: { label: "Agotado", className: "stock-soldout" }
  };
  return stockMap[stock] || stockMap.available;
}

function getCategoryLabel(category) {
  return CATEGORY_META[category]?.label || category;
}

function generateWhatsAppLink(product = null) {
  let message;

  if (product) {
    message = `Hola, estoy interesado en el producto:

${product.name}
SKU: ${product.sku}
Precio: ${formatPrice(product.price, product.currency)}

¿Podrían indicarme si está disponible?`;
  } else {
    message = "Hola, quisiera consultar sobre los productos del catálogo.";
  }

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function updateGeneralWhatsAppLinks() {
  document.querySelectorAll("[data-whatsapp-general]").forEach((link) => {
    link.href = generateWhatsAppLink();
  });
}

function createProductCard(product) {
  const stock = getStockInfo(product.stock);
  const whatsappDisabled = product.stock === "soldout";

  return `
    <article class="product-card">
      <div class="product-image-wrap">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <span class="category-badge">${getCategoryLabel(product.category)}</span>
      </div>
      <div class="product-card-body">
        <span class="product-brand">${product.brand}</span>
        <h3>${product.name}</h3>
        <p class="product-sku">SKU: ${product.sku}</p>
        <div class="product-price">${formatPrice(product.price, product.currency)}</div>
        <span class="stock-status ${stock.className}">
          <span class="stock-dot" aria-hidden="true"></span>${stock.label}
        </span>
        <div class="product-actions">
          <button class="btn btn-secondary btn-full" type="button" data-product-id="${product.id}">Ver producto</button>
          <a class="btn btn-whatsapp btn-full ${whatsappDisabled ? "is-disabled" : ""}"
             href="${whatsappDisabled ? "#" : generateWhatsAppLink(product)}"
             ${whatsappDisabled ? 'aria-disabled="true"' : 'target="_blank" rel="noopener"'}>
            ${whatsappDisabled ? "Agotado" : "WhatsApp"}
          </a>
        </div>
      </div>
    </article>
  `;
}

function getFilteredProducts() {
  const searchTerm = state.search.trim().toLowerCase();

  let result = products.filter((product) => {
    const matchesCategory = state.category === "all" || product.category === state.category;
    const searchable = [
      product.name,
      product.sku,
      product.brand,
      product.category,
      getCategoryLabel(product.category)
    ].join(" ").toLowerCase();

    return matchesCategory && (!searchTerm || searchable.includes(searchTerm));
  });

  switch (state.sort) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      result.sort((a, b) => a.name.localeCompare(b.name, "es"));
      break;
    default:
      result.sort((a, b) => a.id - b.id);
  }

  return result;
}

function renderProducts() {
  const filteredProducts = getFilteredProducts();

  elements.productsGrid.innerHTML = filteredProducts.map(createProductCard).join("");
  elements.emptyState.hidden = filteredProducts.length !== 0;

  const noun = filteredProducts.length === 1 ? "producto" : "productos";
  elements.productCount.textContent = `${filteredProducts.length} ${noun}`;

  elements.productsGrid.querySelectorAll("[data-product-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openProductModal(Number(button.dataset.productId));
    });
  });
}

function renderFilters() {
  elements.filterRow.innerHTML = Object.entries(CATEGORY_META)
    .map(([key, meta]) => `
      <button class="filter-btn ${state.category === key ? "is-active" : ""}" type="button" data-category="${key}">
        ${meta.label}
      </button>
    `).join("");

  elements.filterRow.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      renderFilters();
      renderProducts();
    });
  });
}

function renderCategories() {
  const categoryEntries = Object.entries(CATEGORY_META).filter(([key]) => key !== "all");

  elements.categoriesGrid.innerHTML = categoryEntries.map(([key, meta]) => {
    const count = products.filter((product) => product.category === key).length;

    return `
      <button class="category-card" type="button" data-category-card="${key}">
        <span class="category-icon" aria-hidden="true">${meta.icon}</span>
        <span class="category-name">${meta.label}</span>
        <span class="category-count">${count} ${count === 1 ? "producto" : "productos"}</span>
      </button>
    `;
  }).join("");

  elements.categoriesGrid.querySelectorAll("[data-category-card]").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.categoryCard;
      renderFilters();
      renderProducts();
      document.querySelector("#productos").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function renderFooterCategories() {
  elements.footerCategories.innerHTML = Object.entries(CATEGORY_META)
    .filter(([key]) => key !== "all")
    .map(([key, meta]) => `<a href="#productos" data-footer-category="${key}">${meta.label}</a>`)
    .join("");

  elements.footerCategories.querySelectorAll("[data-footer-category]").forEach((link) => {
    link.addEventListener("click", () => {
      state.category = link.dataset.footerCategory;
      renderFilters();
      renderProducts();
    });
  });
}

function openProductModal(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const stock = getStockInfo(product.stock);
  const whatsappDisabled = product.stock === "soldout";

  elements.modalContent.innerHTML = `
    <div class="modal-image">
      <img src="${product.image}" alt="${product.name}">
    </div>
    <div class="modal-details">
      <span class="eyebrow">${getCategoryLabel(product.category)}</span>
      <span class="product-brand">${product.brand}</span>
      <h2 id="modal-product-name">${product.name}</h2>
      <p class="product-sku">SKU: ${product.sku}</p>
      <div class="modal-price">${formatPrice(product.price, product.currency)}</div>
      <span class="stock-status ${stock.className}">
        <span class="stock-dot" aria-hidden="true"></span>${stock.label}
      </span>
      <p class="modal-description">${product.description}</p>

      <div class="detail-block">
        <h3>Características</h3>
        <ul>${product.features.map((feature) => `<li>${feature}</li>`).join("")}</ul>
      </div>

      <div class="detail-columns">
        <div>
          <h3>Tallas</h3>
          <p>${product.sizes.join(" · ")}</p>
        </div>
        <div>
          <h3>Colores</h3>
          <p>${product.colors.join(" · ")}</p>
        </div>
      </div>

      <a class="btn btn-whatsapp btn-large ${whatsappDisabled ? "is-disabled" : ""}"
         href="${whatsappDisabled ? "#" : generateWhatsAppLink(product)}"
         ${whatsappDisabled ? 'aria-disabled="true"' : 'target="_blank" rel="noopener"'}>
        ${whatsappDisabled ? "Producto agotado" : "Consultar por WhatsApp"}
      </a>
    </div>
  `;

  elements.modal.classList.add("is-open");
  elements.modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  elements.modal.querySelector(".modal-close").focus();
}

function closeProductModal() {
  elements.modal.classList.remove("is-open");
  elements.modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function toggleMobileMenu() {
  const isOpen = elements.mainNav.classList.toggle("is-open");
  elements.menuToggle.classList.toggle("is-open", isOpen);
  elements.menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function closeMobileMenu() {
  elements.mainNav.classList.remove("is-open");
  elements.menuToggle.classList.remove("is-open");
  elements.menuToggle.setAttribute("aria-expanded", "false");
}

function initEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderProducts();
  });

  elements.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderProducts();
  });

  elements.clearFilters.addEventListener("click", () => {
    state.category = "all";
    state.search = "";
    state.sort = "recommended";
    elements.searchInput.value = "";
    elements.sortSelect.value = "recommended";
    renderFilters();
    renderProducts();
  });

  document.querySelectorAll("[data-close-modal]").forEach((element) => {
    element.addEventListener("click", closeProductModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeProductModal();
      closeMobileMenu();
    }
  });

  elements.menuToggle.addEventListener("click", toggleMobileMenu);

  elements.mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });
}

function init() {
  updateGeneralWhatsAppLinks();
  renderCategories();
  renderFooterCategories();
  renderFilters();
  renderProducts();
  initEvents();

  document.querySelector("#current-year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", init);
