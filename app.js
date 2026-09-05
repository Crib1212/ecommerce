/* =========================================================
   WITTYFARE CENTRAL APP.JS
   One product catalogue + one cart system
========================================================= */

let products = [];
let listCart = [];


/* =========================================================
   🔔 TOAST NOTIFICATION
========================================================= */

function showToast(message, title, image) {

    const toast = document.querySelector('.notification-toast');

    if (!toast) return;

    const toastImg = toast.querySelector('.toast-banner img');
    const toastMessage = toast.querySelector('.toast-message');
    const toastTitle = toast.querySelector('.toast-title');
    const toastTime = toast.querySelector('.toast-meta time');

    if (toastImg && image) {
        toastImg.src = image;
    }

    if (toastTitle) {
        toastTitle.innerText = title;
    }

    if (toastMessage) {
        toastMessage.innerText = message;
    }

    if (toastTime) {
        toastTime.innerText = "Just now";
    }

    toast.style.display = 'flex';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}


function closeToast() {

    const toast = document.querySelector('.notification-toast');

    if (toast) {
        toast.style.display = 'none';
    }
}


/* =========================================================
   🧭 MENU
========================================================= */

window.toggleMenu = function () {

    const menu = document.getElementById('menu');

    if (!menu) return;

    menu.classList.toggle('open');

    menu.style.display =
        menu.classList.contains('open')
            ? 'block'
            : 'none';
};


window.goHome = function () {

    window.location.href = '/';
};


/* =========================================================
   💰 MONEY FORMAT
========================================================= */

function formatPrice(price) {

    return '₦' + Number(price || 0).toLocaleString('en-NG');
}


/* =========================================================
   🛒 CART STORAGE
========================================================= */

function loadCart() {

    const stored = localStorage.getItem('listCart');

    try {

        listCart = stored
            ? JSON.parse(stored)
            : [];

        if (!Array.isArray(listCart)) {
            listCart = [];
        }

    } catch (error) {

        console.error('Cart loading error:', error);

        listCart = [];
    }
}


function saveCart() {

    localStorage.setItem(
        'listCart',
        JSON.stringify(listCart)
    );
}


/* =========================================================
   🛒 CART COUNTER
========================================================= */

function updateCartCounter() {

    const counters =
        document.querySelectorAll('.totalQuantity');

    let total = 0;

    listCart.forEach(item => {

        total += Number(item.quantity) || 0;

    });

    counters.forEach(el => {

        el.innerText = total;

    });
}


/* =========================================================
   💳 CHECKOUT TOTAL
========================================================= */

/* =========================================================
   💰 CART TOTAL
========================================================= */

/* =========================================================
   💰 CALCULATE CART TOTAL
========================================================= */

function calculateCheckoutTotal() {

    let total = 0;

    listCart.forEach(item => {

        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;

        total += price * quantity;

    });

    const formattedTotal = formatPrice(total);

    /* Product page cart total */
    document
        .querySelectorAll('.totalPrice')
        .forEach(element => {
            element.textContent = formattedTotal;
        });

    /* Checkout page total */
    document
        .querySelectorAll('.checkoutTotal')
        .forEach(element => {
            element.textContent = formattedTotal;
        });

    return total;
}
/* =========================================================
   🛒 ADD TO CART
========================================================= */

window.addCart = function (idProduct) {

    const product =
        products.find(
            p => String(p.id) === String(idProduct)
        );

    if (!product) {

        console.error(
            'Product not found:',
            idProduct
        );

        return;
    }

    const existing =
        listCart.find(
            p => String(p.id) === String(idProduct)
        );

    if (existing) {

        existing.quantity =
            Number(existing.quantity || 0) + 1;

    } else {

        listCart.push({

            ...product,

            quantity: 1

        });

    }

    saveCart();

    updateCartCounter();

    renderCartItems();

    calculateCheckoutTotal();

    showToast(
        "Added to cart",
        product.name,
        product.image
    );
};


/* =========================================================
   ➕➖ CHANGE QUANTITY
========================================================= */

window.changeQuantity = function (
    idProduct,
    type
) {

    const item =
        listCart.find(
            p => String(p.id) === String(idProduct)
        );

    if (!item) return;

    if (type === '+') {

        item.quantity =
            Number(item.quantity || 0) + 1;

    }

    if (type === '-') {

        item.quantity =
            Number(item.quantity || 0) - 1;

    }

    if (item.quantity <= 0) {

        listCart =
            listCart.filter(
                p =>
                    String(p.id) !==
                    String(idProduct)
            );
    }

    saveCart();

    updateCartCounter();

    renderCartItems();

    calculateCheckoutTotal();
};


/* =========================================================
   ✏️ MANUAL QUANTITY
========================================================= */

window.updateQuantity = function (
    idProduct,
    value
) {

    const item =
        listCart.find(
            p => String(p.id) === String(idProduct)
        );

    if (!item) return;

    let qty = parseInt(value);

    if (isNaN(qty) || qty < 1) {

        qty = 1;

    }

    item.quantity = qty;

    saveCart();

    updateCartCounter();

    renderCartItems();

    calculateCheckoutTotal();
};


/* =========================================================
   🗑 REMOVE ITEM
========================================================= */

window.removeItem = function (idProduct) {

    listCart =
        listCart.filter(
            p =>
                String(p.id) !==
                String(idProduct)
        );

    saveCart();

    updateCartCounter();

    renderCartItems();

    calculateCheckoutTotal();
};


/* =========================================================
   🧾 RENDER CART
========================================================= */

function renderCartItems() {

    const listCartHTML =
        document.querySelector('.listCart');

    if (!listCartHTML) return;

    listCartHTML.innerHTML = '';

    if (listCart.length === 0) {

        listCartHTML.innerHTML = `
            <p class="empty-cart">
                Your cart is empty.
            </p>
        `;

        return;
    }


    listCart.forEach(product => {

        const item =
            document.createElement('div');

        item.classList.add('item');


        item.innerHTML = `

            <img
                src="${product.image}"
                alt="${escapeHTML(product.name)}"
            >

            <div class="content">

                <div class="name">
                    ${escapeHTML(product.name)}
                </div>

                <div class="price">
                    ${formatPrice(product.price)}
                </div>

            </div>

            <div class="cartControls">

                <button
                    class="deleteBtn"
                    onclick="removeItem('${product.id}')"
                    aria-label="Remove ${escapeHTML(product.name)}"
                >
                    🗑
                </button>


                <div class="verticalQty">

                    <button
                        onclick="changeQuantity('${product.id}', '+')"
                    >
                        +
                    </button>

                    <input
                        type="number"
                        min="1"
                        value="${product.quantity}"
                        id="qty-${product.id}"
                    >

                    <button
                        onclick="changeQuantity('${product.id}', '-')"
                    >
                        -
                    </button>

                </div>

            </div>
        `;


        listCartHTML.appendChild(item);


        const qtyInput =
            document.getElementById(
                `qty-${product.id}`
            );


        if (qtyInput) {

            qtyInput.addEventListener(
                'keydown',
                e => {

                    if (e.key === 'Enter') {

                        e.preventDefault();

                        updateQuantity(
                            product.id,
                            qtyInput.value
                        );
                    }

                }
            );


            qtyInput.addEventListener(
                'change',
                () => {

                    updateQuantity(
                        product.id,
                        qtyInput.value
                    );

                }
            );

        }

    });
}


/* =========================================================
   🔤 ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


/* =========================================================
   🔍 NORMALIZE SEARCH TEXT
========================================================= */

function normalizeText(text) {

    return String(text || '')
        .toLowerCase()
        .replace(/['’`"“”.,\-_/\\()]/g, '')
        .replace(/\s+/g, '');
}


/* =========================================================
   🔎 HIGHLIGHT SEARCH RESULT
========================================================= */

function highlightText(text, keyword) {

    if (!keyword) {

        return escapeHTML(text);

    }

    const safeText =
        escapeHTML(text);

    const safeKeyword =
        escapeHTML(keyword);

    if (!safeKeyword) {

        return safeText;

    }

    const regex =
        new RegExp(
            `(${safeKeyword})`,
            'gi'
        );

    return safeText.replace(
        regex,
        '<span style="background-color:#fff176;font-weight:bold;">$1</span>'
    );
}

function getProductPageURL(id) {
    const path = window.location.pathname;

    // Pages inside category folders
    if (
        path.includes('/category/')
    ) {
        return '../../product/index.html?id=' +
            encodeURIComponent(id);
    }

    // Product page itself
    if (
        path.includes('/product/')
    ) {
        return './index.html?id=' +
            encodeURIComponent(id);
    }

    // Homepage / root
    return 'product/index.html?id=' +
        encodeURIComponent(id);
}
/* =========================================================
   🛍 PRODUCT CARD
========================================================= */

/* =========================================================
   🛍 PRODUCT CARD
========================================================= */

function createProductCard(
    product,
    highlight = ''
) {
    const {
        name = '',
        category = '',
        description = '',
        vendor = '',
        image = '',
        price = 0,
        id,
        farmSize = '',
        includes = [],
        packageType = ''
    } = product;

    const highlightedName =
        highlightText(
            name,
            highlight
        );

    const highlightedCategory =
        highlightText(
            category,
            highlight
        );

    const highlightedDescription =
        highlightText(
            description,
            highlight
        );

    const newProduct =
        document.createElement('div');

    newProduct.classList.add('item');

    /* Add special class to farm packages */
    if (category === 'farm-packages') {
        newProduct.classList.add('farm-package-card');
    }

    /* Package contents */
    let packageContents = '';

    if (
        category === 'farm-packages' &&
        Array.isArray(includes) &&
        includes.length
    ) {
        packageContents = `
            <div class="package-includes">
                <strong>Includes:</strong>
                <ul>
                    ${includes
                        .slice(0, 4)
                        .map(item => `
                            <li>${escapeHTML(item)}</li>
                        `)
                        .join('')}
                </ul>

                ${
                    includes.length > 4
                        ? `<small>+ ${includes.length - 4} more items</small>`
                        : ''
                }
            </div>
        `;
    }

    newProduct.innerHTML = `
        <a
            href="${getProductPageURL(id)}"
            class="product-page-link"
        >

            <img
                src="${image}"
                alt="${escapeHTML(name)}"
                loading="lazy"
            >

            <h2>
                ${highlightedName}
            </h2>

            ${
                vendor
                    ? `
                        <p class="vendor">
                            Vendor: ${escapeHTML(vendor)}
                        </p>
                    `
                    : ''
            }

            ${
                category === 'farm-packages' && farmSize
                    ? `
                        <p class="package-farm-size">
                            🌱 Designed for: 
                            <strong>${escapeHTML(farmSize)}</strong>
                        </p>
                    `
                    : ''
            }

            ${
                category
                    ? `
                        <p class="category">
                            Category:
                            ${highlightedCategory}
                        </p>
                    `
                    : ''
            }

            ${
                description
                    ? `
                        <p class="desc">
                            ${highlightedDescription}
                        </p>
                    `
                    : ''
            }

            ${packageContents}

            <div class="price">
                ${formatPrice(price)}
            </div>

        </a>

        <button
            onclick="event.stopPropagation(); addCart('${id}')"
        >
            Add to cart
        </button>
    `;

    return newProduct;
}

/* =========================================================
   🎨 DISPLAY PRODUCTS
========================================================= */

function addDataToHTML(
    productList = products,
    highlight = ''
) {

    const listProductHTML =
        document.querySelector('.listProduct');

    if (!listProductHTML) return;

    listProductHTML.innerHTML = '';


    if (
        !productList ||
        productList.length === 0
    ) {

        listProductHTML.innerHTML = `

            <p>
                No results found
                ${
                    highlight
                        ? `for "<strong>${escapeHTML(highlight)}</strong>"`
                        : ''
                }.
            </p>

            ${
                highlight
                    ? '<button id="showAllBtn">Show All Products</button>'
                    : ''
            }

        `;


        const btn =
            document.getElementById(
                'showAllBtn'
            );


        if (btn) {

            btn.addEventListener(
                'click',
                () => {

                    addDataToHTML(products);

                    const input =
                        document.getElementById(
                            'searchInput'
                        );

                    if (input) {

                        input.value = '';

                    }

                }
            );

        }

        return;
    }


    productList.forEach(product => {

        listProductHTML.appendChild(
            createProductCard(
                product,
                highlight
            )
        );

    });
}

/* =========================================================
   🌱 FARM PACKAGES HOMEPAGE
========================================================= */

function renderFarmPackages() {

    const container =
        document.getElementById('farmPackagesList');

    if (!container) return;

    const farmPackages =
        products.filter(
            product =>
                product.category === 'farm-packages' &&
                product.featured === true
        );

    container.innerHTML = '';

    if (!farmPackages.length) {

        container.innerHTML = `
            <p class="no-packages">
                Farm packages coming soon.
            </p>
        `;

        return;
    }

    farmPackages.forEach(product => {

        const card =
            createProductCard(product);

        if (card) {
            container.appendChild(card);
        }

    });
}
/* =========================================================
   🏷️ CATEGORY FILTER
========================================================= */

function getPageCategory() {

    return document.body.dataset.category || '';
}


/* =========================================================
   🏷️ CATEGORY + FEATURED FILTER
========================================================= */

function getProductsForCurrentPage() {

    const category =
        getPageCategory();


    /* =====================================================
       CATEGORY PAGE
       Show ALL products in that category
       featured true OR false
    ===================================================== */

    if (category) {

        return products.filter(
            product =>
                String(product.category || '')
                    .toLowerCase() ===
                category.toLowerCase()
        );

    }


    /* =====================================================
       HOMEPAGE
       Show ONLY FEATURED products
    ===================================================== */

    return products.filter(
        product =>
            product.featured === true
    );

}


/* =========================================================
   📦 LOAD CENTRAL PRODUCT CATALOGUE
========================================================= */

function loadProducts() {

    fetch('/product.json', {
        cache: 'no-store'
    })

    .then(response => {

        if (!response.ok) {

            throw new Error(
                `HTTP error ${response.status}`
            );

        }

        return response.json();

    })

    .then(data => {

        if (!Array.isArray(data)) {

            throw new Error(
                'product.json must contain an array'
            );

        }

        products = data;

if (typeof initializeProductPage === 'function') {
    initializeProductPage();
}
      const pageProducts =
    getProductsForCurrentPage();

addDataToHTML(
    pageProducts
);

/* Render Farm Packages on homepage */
renderFarmPackages();

renderCartItems();

        updateCartCounter();

        calculateCheckoutTotal();

    })

    .catch(error => {

        console.error(
            'Product load error:',
            error
        );


        const listProductHTML =
            document.querySelector(
                '.listProduct'
            );


        if (listProductHTML) {

            listProductHTML.innerHTML = `

                <p>
                    Unable to load products.
                    Please refresh the page.
                </p>

            `;

        }

    });
}

/* =========================================================
   🔎 INDIVIDUAL PRODUCT PAGE + GOOGLE SEO
========================================================= */

function initializeProductPage() {

    // Only run on the individual product page
    if (!window.location.pathname.includes('/product')) {
        return;
    }

    const params = new URLSearchParams(window.location.search);

    const productId = params.get('id');
    const productSlug = params.get('slug');

    if (!productId && !productSlug) {
        console.warn('No product ID or slug found in URL.');
        return;
    }

    const product = products.find(item =>
        String(item.id) === String(productId) ||
        String(item.slug) === String(productSlug)
    );

    if (!product) {
        console.warn('Product not found:', productId || productSlug);
        return;
    }

    /* -----------------------------------------
       PRODUCT INFORMATION
    ----------------------------------------- */

    const name = product.name || 'Wittyfare Product';
    const description =
        product.description ||
        `Buy ${name} from Wittyfare Agrovet & Farms in Abuja, Nigeria.`;

    const category = product.category || 'Agrovet Products';
    const price = Number(product.price) || 0;

    const image = product.image
        ? new URL(product.image, window.location.origin).href
        : `${window.location.origin}/images/logo.png`;

    const productURL =
        `${window.location.origin}/product/?id=${encodeURIComponent(product.id)}`;


    /* -----------------------------------------
       PAGE TITLE
    ----------------------------------------- */

    document.title =
        `${name} | Wittyfare Agrovet & Farms Abuja`;


    /* -----------------------------------------
       META DESCRIPTION
    ----------------------------------------- */

    let descriptionTag =
        document.querySelector('meta[name="description"]');

    if (!descriptionTag) {

        descriptionTag =
            document.createElement('meta');

        descriptionTag.name = 'description';

        document.head.appendChild(descriptionTag);
    }

    descriptionTag.setAttribute(
        'content',
        description
    );


    /* -----------------------------------------
       CANONICAL URL
    ----------------------------------------- */

    let canonical =
        document.querySelector('link[rel="canonical"]');

    if (!canonical) {

        canonical =
            document.createElement('link');

        canonical.rel = 'canonical';

        document.head.appendChild(canonical);
    }

    canonical.href = productURL;


    /* -----------------------------------------
       PRODUCT CONTENT
    ----------------------------------------- */

    const nameElement =
        document.getElementById('productName');

    const categoryElement =
        document.getElementById('productCategory');

    const priceElement =
        document.getElementById('productPrice');

    const descriptionElement =
        document.getElementById('productDescription');

    const imageElement =
        document.getElementById('productImage');

    const detailsElement =
        document.getElementById('productDetails');


    if (nameElement) {
        nameElement.textContent = name;
    }

    if (categoryElement) {
        categoryElement.textContent =
            category.toUpperCase();
    }

    if (priceElement) {

        priceElement.textContent =
            `₦${price.toLocaleString('en-NG')}`;
    }

    if (descriptionElement) {
        descriptionElement.textContent =
            description;
    }

    if (imageElement) {

        imageElement.src = image;

        imageElement.alt =
            `${name} - Wittyfare Agrovet & Farms Abuja`;

        imageElement.loading = 'eager';
    }

    if (detailsElement) {

        detailsElement.innerHTML = `
            <p><strong>Product:</strong> ${name}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Price:</strong> ₦${price.toLocaleString('en-NG')}</p>
            <p>
                Buy ${name} from Wittyfare Agrovet & Farms,
                serving farmers and customers in Abuja, Nigeria.
            </p>
        `;
    }


    /* -----------------------------------------
       ADD TO CART
    ----------------------------------------- */

    const cartButton =
        document.getElementById('addProductToCart');

    if (cartButton) {

        cartButton.onclick = function () {

            addCart(product.id);

        };
    }


    /* -----------------------------------------
       GOOGLE PRODUCT STRUCTURED DATA
    ----------------------------------------- */

    const oldSchema =
        document.getElementById('product-schema');

    if (oldSchema) {
        oldSchema.remove();
    }

    const schema =
        document.createElement('script');

    schema.type = 'application/ld+json';

    schema.id = 'product-schema';

    schema.textContent =
        JSON.stringify({

            "@context": "https://schema.org",

            "@type": "Product",

            "name": name,

            "description": description,

            "image": [
                image
            ],

            "sku": String(product.id),

            "category": category,

            "brand": {
                "@type": "Brand",
                "name": "Wittyfare"
            },

            "offers": {

                "@type": "Offer",

                "url": productURL,

                "priceCurrency": "NGN",

                "price": price.toFixed(2),

                "availability":
                    "https://schema.org/InStock",

                "seller": {

                    "@type": "Organization",

                    "name":
                        "Wittyfare Agrovet & Farms Ltd"

                }

            }

        });

    document.head.appendChild(schema);


    /* -----------------------------------------
       OPEN GRAPH
    ----------------------------------------- */

    setProductMeta(
        'og:title',
        name
    );

    setProductMeta(
        'og:description',
        description
    );

    setProductMeta(
        'og:image',
        image
    );

    setProductMeta(
        'og:url',
        productURL
    );

    setProductMeta(
        'og:type',
        'product'
    );


    console.log(
        'SEO product page initialized:',
        name
    );
}


/* =========================================================
   META TAG HELPER
========================================================= */

function setProductMeta(property, content) {

    let meta =
        document.querySelector(
            `meta[property="${property}"]`
        );

    if (!meta) {

        meta =
            document.createElement('meta');

        meta.setAttribute(
            'property',
            property
        );

        document.head.appendChild(meta);
    }

    meta.setAttribute(
        'content',
        content
    );
}
/* =========================================================
   🔍 SEARCH ENGINE
========================================================= */

function performSearch(query) {
    const searchTerm = String(query || '').trim();

    // If search box is empty, show the normal products for the page
    if (!searchTerm) {
        const pageProducts = getProductsForCurrentPage();
        addDataToHTML(pageProducts);
        return;
    }

    const pageCategory = getPageCategory();

    // =========================================================
    // SEARCH SCOPE
    // =========================================================
    // Category page:
    // Search ALL products inside that category.
    //
    // Homepage:
    // Search ALL products, including featured and non-featured.
    // =========================================================

    let searchableProducts;

    if (pageCategory) {
        searchableProducts = products.filter(product =>
            String(product.category || '').toLowerCase() ===
            pageCategory.toLowerCase()
        );
    } else {
        // Homepage search = ALL products
        searchableProducts = products;
    }

    // =========================================================
    // SEARCH ALL IMPORTANT PRODUCT INFORMATION
    // =========================================================

    const normalizedQuery = normalizeText(searchTerm);

    const results = searchableProducts.filter(product => {

        const searchableText = [
            product.name,
            product.description,
            product.category,
            product.slug,
            product.vendor,
            product.farmSize,
            product.packageType,

            // Farm package contents
            Array.isArray(product.includes)
                ? product.includes.join(' ')
                : product.includes

        ]
            .filter(Boolean)
            .join(' ');

        return normalizeText(searchableText).includes(normalizedQuery);
    });

    // =========================================================
    // DISPLAY SEARCH RESULTS
    // =========================================================

    const listProduct = document.querySelector('.listProduct');

    if (!listProduct) return;

    listProduct.innerHTML = '';

    if (!results.length) {
        listProduct.innerHTML = `
            <div class="search-no-results">
                <h3>No products found</h3>
                <p>
                    We couldn't find any product matching
                    "<strong>${escapeHTML(searchTerm)}</strong>".
                </p>
            </div>
        `;
        return;
    }

    results.forEach(product => {
        const card = createProductCard(product, searchTerm);

        if (card) {
            listProduct.appendChild(card);
        }
    });
}


/* =========================================================
   🔍 SEARCH EVENTS
========================================================= */

function setupSearch() {

    const searchInput =
        document.getElementById('searchInput');

    const searchBtn =
        document.querySelector('.search-button');


    if (searchInput) {

        // Search as user types
        searchInput.addEventListener('input', function () {

            performSearch(this.value);

        });


        // Search when Enter is pressed
        searchInput.addEventListener('keypress', function (e) {

            if (e.key === 'Enter') {

                e.preventDefault();

                performSearch(this.value);

            }

        });

    }


    if (searchBtn) {

        searchBtn.addEventListener('click', function (e) {

            e.preventDefault();

            if (searchInput) {

                performSearch(searchInput.value);

            }

        });

    }

}


/*
   Keep compatibility with your homepage
   if it calls searchProducts()
*/

window.searchProducts = function () {

    const searchInput =
        document.getElementById('searchInput');

    if (searchInput) {

        performSearch(searchInput.value);

    }

};

/* =========================================================
   🛒 CART OPEN / CLOSE
========================================================= */

function setupCart() {

    const iconCart =
        document.querySelector(
            '.iconCart'
        );


    const cart =
        document.querySelector(
            '.cart'
        );


    const container =
        document.querySelector(
            '.container'
        );


    const close =
        document.querySelector(
            '.close'
        );


    let isCartOpen = false;


    function openCart() {

        if (!cart) return;


        cart.style.transition =
            'right 0.5s ease';

        cart.style.right = '0';


        if (container) {

            container.style.transition =
                'transform 0.5s ease';

            container.style.transform =
                'translateX(-400px)';

        }


        isCartOpen = true;

    }


    function closeCart() {

        if (!cart) return;


        cart.style.transition =
            'right 0.5s ease';

        cart.style.right =
            '-100%';


        if (container) {

            container.style.transition =
                'transform 0.5s ease';

            container.style.transform =
                'translateX(0)';

        }


        isCartOpen = false;

    }


    if (iconCart) {

        iconCart.addEventListener(
            'click',
            () => {

                if (isCartOpen) {

                    closeCart();

                } else {

                    openCart();

                }

            }
        );

    }


    if (close) {

        close.addEventListener(
            'click',
            closeCart
        );

    }

}

/* =========================================================
   🚀 INITIALIZE
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        loadCart();

        updateCartCounter();

        renderCartItems();

        calculateCheckoutTotal();

        setupCart();

        setupSearch();

        loadProducts();

    }
);

/* =========================================================
   CENTRAL PRODUCT PAGE SYSTEM
   ========================================================= */

async function initializeProductPage() {

    const productName = document.getElementById("productName");

    if (!productName) {
        return;
    }

    try {

        const response = await fetch("../product.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Unable to load product data.");
        }

        const data = await response.json();

        products = Array.isArray(data) ? data : [];

        const params = new URLSearchParams(window.location.search);

        const productId = params.get("id");

        if (!productId) {

            showProductPageError(
                "Product not found",
                "No product was selected."
            );

            return;
        }

        const product = products.find(
            item => String(item.id) === String(productId)
        );

        if (!product) {

            showProductPageError(
                "Product not found",
                "The product you are looking for could not be found."
            );

            return;
        }

        renderSingleProduct(product);

        renderRelatedProducts(product);

        updateProductSEO(product);

    } catch (error) {

        console.error("Product page error:", error);

        showProductPageError(
            "Unable to load product",
            "Please refresh the page and try again."
        );

    }

}


/* =========================================================
   RENDER SINGLE PRODUCT
========================================================= */

/* =========================================================
   RENDER SINGLE PRODUCT
========================================================= */

function renderSingleProduct(product) {

    const nameElement =
        document.getElementById("productName");

    const imageElement =
        document.getElementById("productImage");

    const priceElement =
        document.getElementById("productPrice");

    const descriptionElement =
        document.getElementById("productDescription");

    const categoryElement =
        document.getElementById("productCategory");

    const detailsElement =
        document.getElementById("productDetails");

    const addButton =
        document.getElementById("addProductToCart");


    /* =====================================================
       NAME
    ===================================================== */

    if (nameElement) {

        nameElement.textContent =
            product.name || "Product";

    }


    /* =====================================================
       IMAGE
    ===================================================== */

    if (imageElement) {

        imageElement.src =
            getProductImage(product.image);

        imageElement.alt =
            product.name ||
            "Wittyfare product";

    }


    /* =====================================================
       PRICE
    ===================================================== */

    if (priceElement) {

        priceElement.textContent =
            formatPrice(product.price);

    }


    /* =====================================================
       DESCRIPTION
    ===================================================== */

    if (descriptionElement) {

        descriptionElement.textContent =
            product.description ||
            `Buy ${product.name || "this product"} from Wittyfare Agrovet & Farms.`;

    }


    /* =====================================================
       CATEGORY
    ===================================================== */

    if (categoryElement) {

        categoryElement.textContent =
            product.category ||
            "Product";

    }


    /* =====================================================
       DETAILS
    ===================================================== */

    if (detailsElement) {

        /* FARM PACKAGE */

        if (
            product.category === "farm-packages"
        ) {

            let packageHTML = `
                <div class="farm-package-details">

                    <h3>
                        🌱 Farm Package Details
                    </h3>
            `;

            if (product.farmSize) {

                packageHTML += `
                    <p>
                        <strong>Designed for:</strong>
                        ${escapeHTML(product.farmSize)}
                    </p>
                `;

            }

            if (product.packageType) {

                packageHTML += `
                    <p>
                        <strong>Package type:</strong>
                        ${escapeHTML(product.packageType)}
                    </p>
                `;

            }

            if (
                Array.isArray(product.includes) &&
                product.includes.length
            ) {

                packageHTML += `
                    <h3>
                        What's Included
                    </h3>

                    <ul class="package-details-list">
                        ${product.includes
                            .map(item => `
                                <li>
                                    ✓ ${escapeHTML(item)}
                                </li>
                            `)
                            .join('')}
                    </ul>
                `;

            }

            if (product.vendor) {

                packageHTML += `
                    <p class="package-vendor">
                        <strong>Vendor:</strong>
                        ${escapeHTML(product.vendor)}
                    </p>
                `;

            }

            packageHTML += `
                </div>
            `;

            detailsElement.innerHTML =
                packageHTML;

        }

        /* NORMAL PRODUCT */

        else {

            let details = "";

            if (product.description) {

                details +=
                    product.description;

            }

            if (product.category) {

                if (details) {
                    details += "\n\n";
                }

                details +=
                    `Category: ${product.category}`;

            }

            if (product.vendor) {

                if (details) {
                    details += "\n\n";
                }

                details +=
                    `Vendor: ${product.vendor}`;

            }

            if (!details) {

                details =
                    `Quality ${
                        product.name ||
                        "agricultural product"
                    } available from Wittyfare Agrovet & Farms.`;

            }

            detailsElement.textContent =
                details;

        }

    }


    /* =====================================================
       ADD TO CART
    ===================================================== */

    if (addButton) {

        addButton.onclick =
            function () {

                addProductPageItem(
                    product
                );

            };

    }
}

/* =========================================================
   PRODUCT IMAGE PATH
========================================================= */

function getProductImage(image) {

    if (!image) {

        return "../images/logo.png";

    }

    let imagePath = String(image);

    /*
       Master product.json is in the root.

       Existing category JSON files sometimes used:

       ../images/example.png

       Because the product page is one level deeper,
       convert that to:

       ../images/example.png
    */

    if (imagePath.startsWith("../images/")) {

        return imagePath;

    }

    if (imagePath.startsWith("images/")) {

        return "../" + imagePath;

    }

    if (imagePath.startsWith("/")) {

        return imagePath;

    }

    return "../images/" + imagePath;

}


function addProductPageItem(product) {

    if (!product) {
        return;
    }

    const existing = listCart.find(
        item =>
            String(item.id) ===
            String(product.id)
    );

    if (existing) {

        existing.quantity =
            Number(existing.quantity || 0) + 1;

    } else {

        listCart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price) || 0,
            image: product.image,
            quantity: 1
        });
    }

    /* Save */
    saveCart();

    /* Refresh cart */
    updateCartCounter();
    renderCartItems();
    calculateCheckoutTotal();

    /* Notification */
    showToast(
        "Added to cart",
        product.name || "Product",
        getProductImage(product.image)
    );

    /* Open cart */
    const cart =
        document.querySelector(".cart");

    const container =
        document.querySelector(".container");

    if (cart) {
        cart.style.transition =
            "right 0.5s ease";
        cart.style.right = "0";
    }

    if (container) {
        container.style.transition =
            "transform 0.5s ease";
        container.style.transform =
            "translateX(-400px)";
    }
}
/* =========================================================
   🔗 RELATED PRODUCTS
========================================================= */

function renderRelatedProducts(currentProduct) {

    const container =
        document.getElementById("relatedProducts");

    if (!container) {
        return;
    }

    let related = [];

    /* -----------------------------------------------------
       1. First find products from the same category
    ----------------------------------------------------- */

    if (currentProduct.category) {

        related = products.filter(product =>

            String(product.id) !==
            String(currentProduct.id)

            &&

            normalizeText(product.category) ===
            normalizeText(currentProduct.category)

        );
    }


    /* -----------------------------------------------------
       2. If fewer than 4, add other products
    ----------------------------------------------------- */

    if (related.length < 4) {

        const additional =
            products.filter(product =>

                String(product.id) !==
                String(currentProduct.id)

                &&

                !related.some(
                    item =>
                        String(item.id) ===
                        String(product.id)
                )
            );

        related = related.concat(additional);
    }


    /* -----------------------------------------------------
       3. Maximum 4 related products
    ----------------------------------------------------- */

    related = related.slice(0, 4);


    /* -----------------------------------------------------
       4. Nothing found
    ----------------------------------------------------- */

    if (!related.length) {

        container.innerHTML = "";
        return;
    }


    /* -----------------------------------------------------
       5. IMPORTANT:
          createProductCard() returns a DOM element.
          DO NOT use .map().join("") here.
    ----------------------------------------------------- */

    container.innerHTML = "";

    related.forEach(product => {

        const productCard =
            createProductCard(product);

        if (productCard) {
            container.appendChild(productCard);
        }

    });
}

/* =========================================================
   PRODUCT SEO
========================================================= */

function updateProductSEO(product) {

    const name =
        product.name || "Product";

    const category =
        product.category || "Agrovet Product";


    document.title =
        `${name} | ${category} | Wittyfare`;


    const description =
        product.description
        ? String(product.description).substring(0, 155)
        : `Buy ${name} from Wittyfare Agrovet & Farms in Abuja.`;


    setMetaDescription(description);


    /*
       Canonical product URL currently uses ?id=
    */

    const canonical =
        document.querySelector(
            'link[rel="canonical"]'
        );


    if (canonical) {

        canonical.href =
            `${window.location.origin}/product/?id=${encodeURIComponent(product.id)}`;

    }

}


function openChat() {
    if (typeof Tawk_API === "undefined") return;

    if (chatOpen) {
        Tawk_API.minimize();
        chatOpen = false;
    } else {
        Tawk_API.showWidget();
        Tawk_API.maximize();
        chatOpen = true;
    }
}

/* =========================================================
   META DESCRIPTION
========================================================= */

function setMetaDescription(description) {

    let meta =
        document.querySelector(
            'meta[name="description"]'
        );


    if (!meta) {

        meta =
            document.createElement("meta");

        meta.name = "description";

        document.head.appendChild(meta);

    }


    meta.content =
        String(description).substring(0, 160);

}


/* =========================================================
   PRODUCT ERROR
========================================================= */

function showProductPageError(title, message) {

    const nameElement =
        document.getElementById("productName");

    const descriptionElement =
        document.getElementById("productDescription");


    if (nameElement) {

        nameElement.textContent = title;

    }


    if (descriptionElement) {

        descriptionElement.textContent = message;

    }


    const addButton =
        document.getElementById("addProductToCart");


    if (addButton) {

        addButton.style.display = "none";

    }

}

/* =========================================================
   🚀 WITTYFARE PRODUCT PAGE + SEO SYSTEM
========================================================= */

function getProductFromURL() {

    const params = new URLSearchParams(window.location.search);

    const id = params.get("id");
    const slug = params.get("slug");

    if (!id && !slug) {
        return null;
    }

    return products.find(product =>
        String(product.id) === String(id) ||
        String(product.slug || "") === String(slug)
    );
}


/* =========================================================
   SEO HELPER
========================================================= */

function setMetaTag(name, content) {

    let tag = document.querySelector(`meta[name="${name}"]`);

    if (!tag) {

        tag = document.createElement("meta");

        tag.setAttribute("name", name);

        document.head.appendChild(tag);
    }

    tag.setAttribute("content", content);
}


/* =========================================================
   JSON-LD HELPER
========================================================= */

function addStructuredData(data, id) {

    const oldSchema =
        document.getElementById(id);

    if (oldSchema) {
        oldSchema.remove();
    }

    const script =
        document.createElement("script");

    script.type =
        "application/ld+json";

    script.id = id;

    script.textContent =
        JSON.stringify(data);

    document.head.appendChild(script);
}


/* =========================================================
   PRODUCT PAGE
========================================================= */

function initializeProductPage() {

    /*
       Wait until product.json has finished loading.
    */

    if (!Array.isArray(products) || products.length === 0) {

        setTimeout(
            initializeProductPage,
            100
        );

        return;
    }


    const product =
        getProductFromURL();


    if (!product) {

        console.warn(
            "Wittyfare: Product not found."
        );

        const name =
            document.getElementById("productName");

        if (name) {
            name.textContent =
                "Product not found";
        }

        return;
    }


    /* =====================================================
       PRODUCT VALUES
    ===================================================== */

    const productName =
        product.name ||
        "Wittyfare Product";

    const description =
        product.description ||
        `Buy ${productName} from Wittyfare Agrovet & Farms in Abuja, Nigeria.`;

    const price =
        Number(product.price || 0);

    const category =
        product.category ||
        "Farm Products";

    const image =
        product.image ||
        "/images/logo.png";

    const slug =
        product.slug ||
        String(product.id)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");


    /* =====================================================
       PRODUCT URL
    ===================================================== */

    const productURL =
        `https://www.wittyfare.com/product/?id=${encodeURIComponent(product.id)}`;


    /* =====================================================
       PAGE TITLE
    ===================================================== */

    document.title =
        `${productName} | Wittyfare Agrovet & Farms`;


    /* =====================================================
       META DESCRIPTION
    ===================================================== */

    setMetaTag(
        "description",
        `${productName} available at Wittyfare Agrovet & Farms in Abuja, Nigeria. ${description}`
            .substring(0, 160)
    );


    /* =====================================================
       KEYWORDS
    ===================================================== */

    setMetaTag(
        "keywords",
        `${productName}, ${category}, agrovet products Abuja, farm products Nigeria, Wittyfare`
    );


    /* =====================================================
       CANONICAL
    ===================================================== */

    let canonical =
        document.getElementById("canonicalUrl");

    if (!canonical) {

        canonical =
            document.createElement("link");

        canonical.id =
            "canonicalUrl";

        canonical.rel =
            "canonical";

        document.head.appendChild(canonical);
    }

    canonical.href =
        productURL;


    /* =====================================================
       PRODUCT IMAGE
    ===================================================== */

    const productImage =
        document.getElementById("productImage");

    if (productImage) {

        productImage.src =
            image;

        productImage.alt =
            `${productName} - Wittyfare Agrovet & Farms`;

        productImage.loading =
            "eager";
    }


    /* =====================================================
       PRODUCT NAME
    ===================================================== */

    const productNameElement =
        document.getElementById("productName");

    if (productNameElement) {

        productNameElement.textContent =
            productName;
    }


    /* =====================================================
       CATEGORY
    ===================================================== */

    const productCategory =
        document.getElementById("productCategory");

    if (productCategory) {

        productCategory.textContent =
            category;
    }


    /* =====================================================
       PRICE
    ===================================================== */

    const productPrice =
        document.getElementById("productPrice");

    if (productPrice) {

        productPrice.textContent =
            `₦${price.toLocaleString()}`;
    }


    /* =====================================================
       DESCRIPTION
    ===================================================== */

    const productDescription =
        document.getElementById("productDescription");

    if (productDescription) {

        productDescription.textContent =
            description;
    }


    /* =====================================================
       PRODUCT DETAILS
    ===================================================== */

    const productDetails =
        document.getElementById("productDetails");

    if (productDetails) {

        let detailsHTML = "";

        if (product.vendor) {

            detailsHTML += `
                <p>
                    <strong>Vendor:</strong>
                    ${product.vendor}
                </p>
            `;
        }

        if (product.farmSize) {

            detailsHTML += `
                <p>
                    <strong>Farm Size:</strong>
                    ${product.farmSize}
                </p>
            `;
        }

        if (product.packageType) {

            detailsHTML += `
                <p>
                    <strong>Package Type:</strong>
                    ${product.packageType}
                </p>
            `;
        }

        if (
            Array.isArray(product.includes) &&
            product.includes.length
        ) {

            detailsHTML += `
                <h3>Package Includes</h3>
                <ul>
                    ${product.includes.map(item =>
                        `<li>${item}</li>`
                    ).join("")}
                </ul>
            `;
        }

        if (!detailsHTML) {

            detailsHTML =
                `<p>${description}</p>`;
        }

        productDetails.innerHTML =
            detailsHTML;
    }


    /* =====================================================
       ADD TO CART
    ===================================================== */

    const addButton =
        document.getElementById(
            "addProductToCart"
        );

    if (addButton) {

        addButton.onclick =
            function () {

                addCart(product.id);

            };
    }


    /* =====================================================
       PRODUCT STRUCTURED DATA
    ===================================================== */

    const absoluteImage =
        image.startsWith("http")
            ? image
            : `https://www.wittyfare.com${image}`;


    const productSchema = {

        "@context":
            "https://schema.org",

        "@type":
            "Product",

        "name":
            productName,

        "description":
            description,

        "image": [
            absoluteImage
        ],

        "sku":
            String(product.id),

        "url":
            productURL,

        "brand": {

            "@type":
                "Brand",

            "name":
                "Wittyfare"

        },

        "offers": {

            "@type":
                "Offer",

            "url":
                productURL,

            "priceCurrency":
                "NGN",

            "price":
                price.toString(),

            "availability":
                "https://schema.org/InStock",

            "seller": {

                "@type":
                    "Organization",

                "name":
                    "Wittyfare Agrovet & Farms"

            }

        }

    };


    addStructuredData(
        productSchema,
        "wittyfare-product-schema"
    );


    /* =====================================================
       BREADCRUMB SCHEMA
    ===================================================== */

    const breadcrumbSchema = {

        "@context":
            "https://schema.org",

        "@type":
            "BreadcrumbList",

        "itemListElement": [

            {

                "@type":
                    "ListItem",

                "position":
                    1,

                "name":
                    "Home",

                "item":
                    "https://www.wittyfare.com/"

            },

            {

                "@type":
                    "ListItem",

                "position":
                    2,

                "name":
                    category,

                "item":
                    `https://www.wittyfare.com/category/${category}/`

            },

            {

                "@type":
                    "ListItem",

                "position":
                    3,

                "name":
                    productName,

                "item":
                    productURL

            }

        ]

    };


    addStructuredData(
        breadcrumbSchema,
        "wittyfare-breadcrumb-schema"
    );


    /* =====================================================
       RELATED PRODUCTS
    ===================================================== */

    renderRelatedProducts(product);


    console.log(
        "✅ Wittyfare SEO loaded:",
        productName
    );
}


/* =========================================================
   RELATED PRODUCTS
========================================================= */

function renderRelatedProducts(currentProduct) {

    const container =
        document.getElementById(
            "relatedProducts"
        );

    if (!container) return;


    const related =
        products
            .filter(product =>
                product.id !== currentProduct.id &&
                product.category === currentProduct.category
            )
            .slice(0, 6);


    container.innerHTML = "";


    related.forEach(product => {

        const card =
            document.createElement("div");

        card.className =
            "item";


        const productURL =
            `/product/?id=${encodeURIComponent(product.id)}`;


        card.innerHTML = `

            <a
                href="${productURL}"
                style="text-decoration:none;color:inherit;"
            >

                <img
                    src="${product.image || '/images/logo.png'}"
                    alt="${product.name}"
                    loading="lazy"
                >

                <h2>
                    ${product.name}
                </h2>

            </a>

            <div class="price">
                ₦${Number(product.price || 0).toLocaleString()}
            </div>

            <button
                type="button"
                onclick="addCart('${product.id}')"
            >
                Add to cart
            </button>

        `;


        container.appendChild(card);

    });

}