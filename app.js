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

function createProductCard(
    product,
    highlight = ''
) {

    const {
        name = '',
        category = '',
        description = '',
        image = '',
        price = 0,
        id
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
   🏷️ CATEGORY FILTER
========================================================= */

function getPageCategory() {

    return document.body.dataset.category || '';
}


function getProductsForCurrentPage() {

    const category =
        getPageCategory();

    if (!category) {

        return products;

    }

    return products.filter(
        product =>
            String(product.category || '')
                .toLowerCase() ===
            category.toLowerCase()
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


        const pageProducts =
            getProductsForCurrentPage();


        addDataToHTML(
            pageProducts
        );


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
   🔍 SEARCH ENGINE
========================================================= */

function performSearch() {

    if (!products.length) return;


    const searchInput =
        document.getElementById(
            'searchInput'
        );


    if (!searchInput) return;


    const rawSearch =
        searchInput.value
            .trim()
            .toLowerCase();


    const pageCategory =
        getPageCategory();


    let searchableProducts =
        products;


    /*
       If we're inside a category,
       search only that category.
    */

    if (pageCategory) {

        searchableProducts =
            products.filter(
                product =>
                    String(
                        product.category || ''
                    ).toLowerCase() ===
                    pageCategory.toLowerCase()
            );

    }


    if (!rawSearch) {

        addDataToHTML(
            searchableProducts
        );

        return;
    }


    const normalizedSearch =
        normalizeText(
            rawSearch
        );


    const filtered =
        searchableProducts.filter(
            product => {

                const name =
                    normalizeText(
                        product.name
                    );


                const desc =
                    normalizeText(
                        product.description
                    );


                const category =
                    normalizeText(
                        product.category
                    );


                const slug =
                    normalizeText(
                        product.slug
                    );


                return (

                    name.includes(
                        normalizedSearch
                    ) ||

                    desc.includes(
                        normalizedSearch
                    ) ||

                    category.includes(
                        normalizedSearch
                    ) ||

                    slug.includes(
                        normalizedSearch
                    )

                );

            }
        );


    addDataToHTML(
        filtered,
        rawSearch
    );
}


/* =========================================================
   🔍 SEARCH EVENTS
========================================================= */

function setupSearch() {

    const searchInput =
        document.getElementById(
            'searchInput'
        );


    const searchBtn =
        document.querySelector(
            '.search-button'
        );


    if (searchInput) {

        searchInput.addEventListener(
            'input',
            performSearch
        );


        searchInput.addEventListener(
            'keypress',
            e => {

                if (e.key === 'Enter') {

                    e.preventDefault();

                    performSearch();

                }

            }
        );

    }


    if (searchBtn) {

        searchBtn.addEventListener(
            'click',
            e => {

                e.preventDefault();

                performSearch();

            }
        );

    }
}


/*
   Keep compatibility with your homepage
   if it calls searchProducts()
*/

window.searchProducts =
    function () {

        performSearch();

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


    if (nameElement) {

        nameElement.textContent =
            product.name || "Product";

    }


    if (imageElement) {

        imageElement.src =
            getProductImage(product.image);

        imageElement.alt =
            product.name || "Wittyfare product";

    }


    if (priceElement) {

        priceElement.textContent =
            formatPrice(product.price);

    }


    if (descriptionElement) {

        descriptionElement.textContent =
            product.description ||
            `Buy ${product.name || "this product"} from Wittyfare Agrovet & Farms.`;

    }


    if (categoryElement) {

        categoryElement.textContent =
            product.category || "Product";

    }


    if (detailsElement) {

        let details = "";

        if (product.description) {

            details += product.description;

        }

        if (product.category) {

            if (details) {
                details += "\n\n";
            }

            details +=
                `Category: ${product.category}`;

        }

        if (!details) {

            details =
                `Quality ${product.name || "agricultural product"} available from Wittyfare Agrovet & Farms.`;

        }

        detailsElement.textContent = details;

    }


    if (addButton) {

        addButton.onclick = function () {

            addProductPageItem(product);

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