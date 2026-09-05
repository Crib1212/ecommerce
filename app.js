/* =========================================================
   WITTYFARE CENTRAL APP.JS
   One product catalogue + one cart system
========================================================= */

let products = [];
let listCart = [];
let chatOpen = false;


/* =========================================================
   🔔 TOAST NOTIFICATION
========================================================= */

function showToast(message, title = "Wittyfare", image = "") {

    const toast = document.querySelector(".notification-toast");

    if (!toast) return;

    const toastImg = toast.querySelector(".toast-banner img");
    const toastMessage = toast.querySelector(".toast-message");
    const toastTitle = toast.querySelector(".toast-title");
    const toastTime = toast.querySelector(".toast-meta time");

    if (toastImg && image) {
        toastImg.src = image;
        toastImg.alt = title || "Product";
    }

    if (toastTitle) {
        toastTitle.textContent = title;
    }

    if (toastMessage) {
        toastMessage.textContent = message;
    }

    if (toastTime) {
        toastTime.textContent = "Just now";
    }

    toast.style.display = "flex";

    clearTimeout(toast._hideTimer);

    toast._hideTimer = setTimeout(() => {
        toast.style.display = "none";
    }, 3000);
}


function closeToast() {

    const toast = document.querySelector(".notification-toast");

    if (toast) {
        toast.style.display = "none";
    }
}


/* =========================================================
   🧭 MENU
========================================================= */

window.toggleMenu = function () {

    const menu = document.getElementById("menu");

    if (!menu) return;

    const isOpen = menu.classList.toggle("open");

    /*
       Do not force display:none/block if CSS controls
       the drawer animation.
    */

    menu.setAttribute("aria-hidden", String(!isOpen));

    const overlay = document.getElementById("menuOverlay");

    if (overlay) {
        overlay.classList.toggle("active", isOpen);
    }
};


window.closeMenu = function () {

    const menu = document.getElementById("menu");

    if (menu) {
        menu.classList.remove("open");
        menu.setAttribute("aria-hidden", "true");
    }

    const overlay = document.getElementById("menuOverlay");

    if (overlay) {
        overlay.classList.remove("active");
    }
};


window.goHome = function () {

    window.location.href = "/";
};


/* =========================================================
   💰 MONEY FORMAT
========================================================= */

function formatPrice(price) {

    return "₦" +
        Number(price || 0).toLocaleString("en-NG");
}


/* =========================================================
   🖼 PRODUCT IMAGE PATH
========================================================= */

function getProductImage(image) {

    if (!image) {
        return "../images/logo.png";
    }

    const imagePath = String(image).trim();

    /*
       Absolute URL
    */

    if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("data:")
    ) {
        return imagePath;
    }

    /*
       Root-relative image
       Example:
       /images/feed.png
    */

    if (imagePath.startsWith("/")) {
        return imagePath;
    }

    /*
       Product JSON normally stores:
       images/feed.png

       Product page is:
       /product/index.html

       Therefore:
       ../images/feed.png
    */

    if (imagePath.startsWith("../")) {
        return imagePath;
    }

    if (imagePath.startsWith("./")) {
        return "../" + imagePath.substring(2);
    }

    if (imagePath.startsWith("images/")) {
        return "../" + imagePath;
    }

    return "../images/" + imagePath;
}


/* =========================================================
   🛒 CART STORAGE
========================================================= */

function loadCart() {

    const stored = localStorage.getItem("listCart");

    try {

        listCart = stored
            ? JSON.parse(stored)
            : [];

        if (!Array.isArray(listCart)) {
            listCart = [];
        }

    } catch (error) {

        console.error("Cart loading error:", error);

        listCart = [];
    }
}


function saveCart() {

    try {

        localStorage.setItem(
            "listCart",
            JSON.stringify(listCart)
        );

    } catch (error) {

        console.error("Cart saving error:", error);
    }
}


/* =========================================================
   🛒 CART COUNTER
========================================================= */

function updateCartCounter() {

    const counters =
        document.querySelectorAll(".totalQuantity");

    let total = 0;

    listCart.forEach(item => {

        total += Number(item.quantity) || 0;

    });

    counters.forEach(element => {

        element.textContent = total;

    });
}


/* =========================================================
   💰 CART TOTAL
========================================================= */

function calculateCheckoutTotal() {

    let total = 0;

    listCart.forEach(item => {

        const price =
            Number(item.price) || 0;

        const quantity =
            Number(item.quantity) || 0;

        total += price * quantity;

    });

    const formattedTotal =
        formatPrice(total);

    /*
       Cart total
    */

    document
        .querySelectorAll(".totalPrice")
        .forEach(element => {

            element.textContent =
                formattedTotal;

        });


    /*
       Checkout total
    */

    document
        .querySelectorAll(".checkoutTotal")
        .forEach(element => {

            element.textContent =
                formattedTotal;

        });


    /*
       Other possible total elements
    */

    document
        .querySelectorAll("[data-cart-total]")
        .forEach(element => {

            element.textContent =
                formattedTotal;

        });

    return total;
}


/* =========================================================
   🛒 ADD TO CART
========================================================= */

window.addCart = function (idProduct) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(idProduct)
        );

    if (!product) {

        console.error(
            "Wittyfare: Product not found:",
            idProduct
        );

        return;
    }


    const existing =
        listCart.find(
            item =>
                String(item.id) ===
                String(idProduct)
        );


    if (existing) {

        existing.quantity =
            Number(existing.quantity || 0) + 1;

    } else {

        listCart.push({

            ...product,

            price:
                Number(product.price) || 0,

            quantity: 1

        });
    }


    saveCart();

    updateCartCounter();

    renderCartItems();

    calculateCheckoutTotal();


    showToast(
        "Added to cart",
        product.name || "Product",
        getToastImage(product.image)
    );


    /*
       Optional:
       Open the cart automatically only when the
       product page specifically requests it.

       We do NOT automatically open the cart here
       because it can be annoying on homepage/category pages.
    */

};


/* =========================================================
   🖼 TOAST IMAGE
========================================================= */

function getToastImage(image) {

    if (!image) {

        return "/images/logo.png";
    }

    const imagePath = String(image);

    if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("/")
    ) {

        return imagePath;
    }

    /*
       On root/category pages the image from product.json
       normally points to images/...
    */

    if (imagePath.startsWith("../images/")) {

        return "/" +
            imagePath.replace("../", "");

    }

    if (imagePath.startsWith("images/")) {

        return "/" + imagePath;
    }

    return "/images/" + imagePath;
}


/* =========================================================
   ➕➖ CHANGE QUANTITY
========================================================= */

window.changeQuantity = function (
    idProduct,
    type
) {

    const item =
        listCart.find(
            product =>
                String(product.id) ===
                String(idProduct)
        );

    if (!item) return;


    if (type === "+") {

        item.quantity =
            Number(item.quantity || 0) + 1;
    }


    if (type === "-") {

        item.quantity =
            Number(item.quantity || 0) - 1;
    }


    if (item.quantity <= 0) {

        listCart =
            listCart.filter(
                product =>
                    String(product.id) !==
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
            product =>
                String(product.id) ===
                String(idProduct)
        );

    if (!item) return;


    let quantity =
        parseInt(value, 10);


    if (
        Number.isNaN(quantity) ||
        quantity < 1
    ) {

        quantity = 1;
    }


    item.quantity = quantity;


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
            product =>
                String(product.id) !==
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
        document.querySelector(".listCart");

    if (!listCartHTML) return;


    listCartHTML.innerHTML = "";


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
            document.createElement("div");

        item.classList.add("item");


        const image =
            getCartImage(product.image);


        item.innerHTML = `

            <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(product.name || "Product")}"
                loading="lazy"
            >

            <div class="content">

                <div class="name">
                    ${escapeHTML(product.name || "Product")}
                </div>

                <div class="price">
                    ${formatPrice(product.price)}
                </div>

            </div>

            <div class="cartControls">

                <button
                    type="button"
                    class="deleteBtn"
                    data-remove-id="${escapeAttribute(product.id)}"
                    aria-label="Remove ${escapeAttribute(product.name || "product")}"
                >
                    🗑
                </button>

                <div class="verticalQty">

                    <button
                        type="button"
                        data-qty-action="increase"
                        data-product-id="${escapeAttribute(product.id)}"
                    >
                        +
                    </button>

                    <input
                        type="number"
                        min="1"
                        value="${Number(product.quantity) || 1}"
                        id="qty-${escapeAttribute(product.id)}"
                        aria-label="Quantity for ${escapeAttribute(product.name || "product")}"
                    >

                    <button
                        type="button"
                        data-qty-action="decrease"
                        data-product-id="${escapeAttribute(product.id)}"
                    >
                        -
                    </button>

                </div>

            </div>
        `;


        listCartHTML.appendChild(item);


        /*
           Delete button
        */

        const deleteButton =
            item.querySelector(
                "[data-remove-id]"
            );

        if (deleteButton) {

            deleteButton.addEventListener(
                "click",
                () => {

                    removeItem(
                        product.id
                    );

                }
            );
        }


        /*
           Increase/decrease
        */

        const quantityButtons =
            item.querySelectorAll(
                "[data-qty-action]"
            );


        quantityButtons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const action =
                        button.dataset.qtyAction;

                    changeQuantity(
                        product.id,
                        action === "increase"
                            ? "+"
                            : "-"
                    );

                }
            );

        });


        /*
           Manual quantity
        */

        const qtyInput =
            item.querySelector(
                `#qty-${CSS.escape(String(product.id))}`
            );


        if (qtyInput) {

            qtyInput.addEventListener(
                "keydown",
                event => {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        updateQuantity(
                            product.id,
                            qtyInput.value
                        );
                    }

                }
            );


            qtyInput.addEventListener(
                "change",
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
   🖼 CART IMAGE
========================================================= */

function getCartImage(image) {

    if (!image) {
        return "/images/logo.png";
    }

    const imagePath =
        String(image).trim();


    if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("/")
    ) {

        return imagePath;
    }


    if (imagePath.startsWith("../images/")) {

        return "/" +
            imagePath.replace("../", "");
    }


    if (imagePath.startsWith("images/")) {

        return "/" + imagePath;
    }


    return "/images/" + imagePath;
}


/* =========================================================
   🔤 ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    return escapeHTML(value);
}


/* =========================================================
   🔍 NORMALIZE SEARCH TEXT
========================================================= */

function normalizeText(text) {

    return String(text || "")
        .toLowerCase()
        .replace(
            /['’`"“”.,\\\-_/()[\]]/g,
            ""
        )
        .replace(/\s+/g, "");
}


/* =========================================================
   🔎 HIGHLIGHT SEARCH RESULT
========================================================= */

function highlightText(text, keyword) {

    const safeText =
        escapeHTML(text);


    if (!keyword) {

        return safeText;
    }


    /*
       Escape keyword before creating RegExp
    */

    const safeKeyword =
        escapeHTML(keyword)
            .replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );


    if (!safeKeyword) {

        return safeText;
    }


    const regex =
        new RegExp(
            `(${safeKeyword})`,
            "gi"
        );


    return safeText.replace(
        regex,
        '<span class="search-highlight">$1</span>'
    );
}


/* =========================================================
   🔗 PRODUCT PAGE URL
========================================================= */

function getProductPageURL(id) {

    const path =
        window.location.pathname;


    /*
       Category pages:
       /category/feed/index.html

       Product page:
       /product/index.html
    */

    if (
        path.includes("/category/")
    ) {

        return (
            "../../product/index.html?id=" +
            encodeURIComponent(id)
        );
    }


    /*
       Product page itself
    */

    if (
        path.includes("/product/")
    ) {

        return (
            "./index.html?id=" +
            encodeURIComponent(id)
        );
    }


    /*
       Homepage/root
    */

    return (
        "product/index.html?id=" +
        encodeURIComponent(id)
    );
}


/* =========================================================
   🛍 PRODUCT CARD
========================================================= */

function createProductCard(
    product,
    highlight = ""
) {

    if (!product) {
        return null;
    }


    const {
        name = "",
        category = "",
        description = "",
        vendor = "",
        image = "",
        price = 0,
        id,
        farmSize = "",
        includes = [],
        packageType = ""
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
        document.createElement("div");


    newProduct.classList.add("item");


    /*
       Farm package special class
    */

    if (
        category === "farm-packages"
    ) {

        newProduct.classList.add(
            "farm-package-card"
        );
    }


    /*
       Package contents
    */

    let packageContents = "";


    if (
        category === "farm-packages" &&
        Array.isArray(includes) &&
        includes.length
    ) {

        packageContents = `

            <div class="package-includes">

                <strong>
                    Includes:
                </strong>

                <ul>

                    ${includes
                        .slice(0, 4)
                        .map(item => `
                            <li>
                                ${escapeHTML(item)}
                            </li>
                        `)
                        .join("")}

                </ul>

                ${
                    includes.length > 4
                        ? `
                            <small>
                                + ${includes.length - 4}
                                more items
                            </small>
                        `
                        : ""
                }

            </div>
        `;
    }


    const productURL =
        getProductPageURL(id);


    const productImage =
        getCardImage(image);


    newProduct.innerHTML = `

        <a
            href="${escapeAttribute(productURL)}"
            class="product-page-link"
        >

            <img
                src="${escapeAttribute(productImage)}"
                alt="${escapeAttribute(name)}"
                loading="lazy"
            >

            <h2>
                ${highlightedName}
            </h2>


            ${
                vendor
                    ? `
                        <p class="vendor">
                            Vendor:
                            ${escapeHTML(vendor)}
                        </p>
                    `
                    : ""
            }


            ${
                category === "farm-packages" &&
                farmSize
                    ? `
                        <p class="package-farm-size">
                            🌱 Designed for:
                            <strong>
                                ${escapeHTML(farmSize)}
                            </strong>
                        </p>
                    `
                    : ""
            }


            ${
                category
                    ? `
                        <p class="category">
                            Category:
                            ${highlightedCategory}
                        </p>
                    `
                    : ""
            }


            ${
                description
                    ? `
                        <p class="desc">
                            ${highlightedDescription}
                        </p>
                    `
                    : ""
            }


            ${packageContents}


            <div class="price">
                ${formatPrice(price)}
            </div>

        </a>


        <button
            type="button"
            class="add-to-cart-btn"
            data-add-product="${escapeAttribute(id)}"
        >
            Add to cart
        </button>
    `;


    /*
       Add-to-cart button
    */

    const addButton =
        newProduct.querySelector(
            "[data-add-product]"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                addCart(id);

            }
        );
    }


    return newProduct;
}


/* =========================================================
   🖼 CARD IMAGE
========================================================= */

function getCardImage(image) {

    if (!image) {
        return "/images/logo.png";
    }


    const imagePath =
        String(image).trim();


    if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("/")
    ) {

        return imagePath;
    }


    if (
        imagePath.startsWith("../images/")
    ) {

        return "/" +
            imagePath.replace("../", "");
    }


    if (
        imagePath.startsWith("images/")
    ) {

        return "/" + imagePath;
    }


    return "/images/" + imagePath;
}


/* =========================================================
   🎨 DISPLAY PRODUCTS
========================================================= */

function addDataToHTML(
    productList = products,
    highlight = ""
) {

    /*
       IMPORTANT:
       Do not use the relatedProducts container
       as the main product listing.
    */

    const listProductHTML =
        document.querySelector(
            ".listProduct:not(#relatedProducts)"
        );


    if (!listProductHTML) {
        return;
    }


    listProductHTML.innerHTML = "";


    if (
        !productList ||
        productList.length === 0
    ) {

        listProductHTML.innerHTML = `

            <div class="search-no-results">

                <p>
                    No results found

                    ${
                        highlight
                            ? `
                                for
                                "<strong>
                                    ${escapeHTML(highlight)}
                                </strong>"
                            `
                            : ""
                    }.
                </p>

                ${
                    highlight
                        ? `
                            <button
                                type="button"
                                id="showAllBtn"
                            >
                                Show All Products
                            </button>
                        `
                        : ""
                }

            </div>
        `;


        const button =
            document.getElementById(
                "showAllBtn"
            );


        if (button) {

            button.addEventListener(
                "click",
                () => {

                    addDataToHTML(
                        getProductsForCurrentPage()
                    );


                    const input =
                        document.getElementById(
                            "searchInput"
                        );


                    if (input) {
                        input.value = "";
                    }

                }
            );
        }


        return;
    }


    productList.forEach(product => {

        const card =
            createProductCard(
                product,
                highlight
            );


        if (card) {

            listProductHTML.appendChild(
                card
            );
        }

    });
}


/* =========================================================
   🌱 FARM PACKAGES HOMEPAGE
========================================================= */

function renderFarmPackages() {

    const container =
        document.getElementById(
            "farmPackagesList"
        );


    if (!container) {
        return;
    }


    const farmPackages =
        products.filter(
            product =>
                product.category ===
                    "farm-packages" &&
                product.featured === true
        );


    container.innerHTML = "";


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
   🏷️ CATEGORY
========================================================= */

function getPageCategory() {

    return (
        document.body.dataset.category ||
        ""
    );
}


/* =========================================================
   🏷️ CATEGORY + FEATURED FILTER
========================================================= */

function getProductsForCurrentPage() {

    const category =
        getPageCategory();


    /*
       CATEGORY PAGE
       Show all products in category
    */

    if (category) {

        return products.filter(
            product =>

                String(
                    product.category || ""
                ).toLowerCase() ===
                category.toLowerCase()
        );
    }


    /*
       HOMEPAGE
       Show only featured products
    */

    return products.filter(
        product =>
            product.featured === true
    );
}


/* =========================================================
   📦 LOAD CENTRAL PRODUCT CATALOGUE
========================================================= */

async function loadProducts() {

    try {

        const response =
            await fetch(
                "/product.json",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP error ${response.status}`
            );
        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "product.json must contain an array."
            );
        }


        products = data;


        /*
           If this is the product page,
           initialize it from the same catalogue.
        */

        if (
            document.getElementById(
                "productName"
            )
        ) {

            initializeProductPage();
        }


        /*
           Normal homepage/category products
        */

        if (
            !document.getElementById(
                "productName"
            )
        ) {

            const pageProducts =
                getProductsForCurrentPage();


            addDataToHTML(
                pageProducts
            );


            renderFarmPackages();
        }


        /*
           Cart can render on every page.
        */

        renderCartItems();

        updateCartCounter();

        calculateCheckoutTotal();


        console.log(
            `✅ Wittyfare: ${products.length} products loaded.`
        );

    } catch (error) {

        console.error(
            "Product load error:",
            error
        );


        const listProductHTML =
            document.querySelector(
                ".listProduct"
            );


        if (listProductHTML) {

            listProductHTML.innerHTML = `

                <div class="search-no-results">

                    <h3>
                        Unable to load products
                    </h3>

                    <p>
                        Please refresh the page
                        and try again.
                    </p>

                </div>

            `;
        }


        showProductPageError(
            "Unable to load product",
            "Please refresh the page and try again."
        );
    }
}


/* =========================================================
   🔗 GET PRODUCT FROM URL
========================================================= */

function getProductFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        params.get("id");


    const slug =
        params.get("slug");


    if (!id && !slug) {

        return null;
    }


    return products.find(
        product =>

            (
                id &&
                String(product.id) ===
                String(id)
            )

            ||

            (
                slug &&
                String(product.slug || "") ===
                String(slug)
            )
    );
}


/* =========================================================
   🖼️ PRODUCT PAGE
========================================================= */

function initializeProductPage() {

    /*
       Only run if this is actually the
       individual product page.
    */

    const productNameElement =
        document.getElementById(
            "productName"
        );


    if (!productNameElement) {

        return;
    }


    if (
        !Array.isArray(products) ||
        products.length === 0
    ) {

        console.warn(
            "Wittyfare: Product catalogue is empty."
        );

        return;
    }


    const product =
        getProductFromURL();


    if (!product) {

        showProductPageError(
            "Product not found",
            "The product you are looking for could not be found."
        );

        return;
    }


    /*
       Render product
    */

    renderSingleProduct(
        product
    );


    /*
       Related products
    */

    renderRelatedProducts(
        product
    );


    /*
       SEO
    */

    updateProductSEO(
        product
    );


    console.log(
        "✅ Wittyfare product page loaded:",
        product.name
    );
}


/* =========================================================
   🛍 RENDER SINGLE PRODUCT
========================================================= */

function renderSingleProduct(product) {

    if (!product) {
        return;
    }


    const nameElement =
        document.getElementById(
            "productName"
        );


    const imageElement =
        document.getElementById(
            "productImage"
        );


    const priceElement =
        document.getElementById(
            "productPrice"
        );


    const descriptionElement =
        document.getElementById(
            "productDescription"
        );


    const categoryElement =
        document.getElementById(
            "productCategory"
        );


    const detailsElement =
        document.getElementById(
            "productDetails"
        );


    const addButton =
        document.getElementById(
            "addProductToCart"
        );


    /*
       NAME
    */

    if (nameElement) {

        nameElement.textContent =
            product.name ||
            "Product";
    }


    /*
       IMAGE
    */

    if (imageElement) {

        imageElement.src =
            getProductImage(
                product.image
            );


        imageElement.alt =
            product.name ||
            "Wittyfare product";


        imageElement.loading =
            "eager";
    }


    /*
       PRICE
    */

    if (priceElement) {

        priceElement.textContent =
            formatPrice(
                product.price
            );
    }


    /*
       DESCRIPTION
    */

    const description =
        product.description ||
        `Buy ${product.name || "this product"} from Wittyfare Agrovet & Farms.`;


    if (descriptionElement) {

        descriptionElement.textContent =
            description;
    }


    /*
       CATEGORY
    */

    if (categoryElement) {

        categoryElement.textContent =
            product.category ||
            "Product";
    }


    /*
       DETAILS
    */

    if (detailsElement) {

        let detailsHTML = "";


        /*
           Farm package
        */

        if (
            product.category ===
            "farm-packages"
        ) {

            detailsHTML += `

                <div class="farm-package-details">

                    <h3>
                        🌱 Farm Package Details
                    </h3>

            `;


            if (product.farmSize) {

                detailsHTML += `

                    <p>

                        <strong>
                            Designed for:
                        </strong>

                        ${escapeHTML(
                            product.farmSize
                        )}

                    </p>

                `;
            }


            if (product.packageType) {

                detailsHTML += `

                    <p>

                        <strong>
                            Package Type:
                        </strong>

                        ${escapeHTML(
                            product.packageType
                        )}

                    </p>

                `;
            }


            if (
                Array.isArray(
                    product.includes
                ) &&
                product.includes.length
            ) {

                detailsHTML += `

                    <h3>
                        What's Included
                    </h3>

                    <ul class="package-details-list">

                        ${
                            product.includes
                                .map(
                                    item => `
                                        <li>
                                            ✓
                                            ${escapeHTML(item)}
                                        </li>
                                    `
                                )
                                .join("")
                        }

                    </ul>

                `;
            }


            if (product.vendor) {

                detailsHTML += `

                    <p class="package-vendor">

                        <strong>
                            Vendor:
                        </strong>

                        ${escapeHTML(
                            product.vendor
                        )}

                    </p>

                `;
            }


            detailsHTML += `
                </div>
            `;


            detailsElement.innerHTML =
                detailsHTML;
        }


        /*
           Normal product
        */

        else {

            if (product.vendor) {

                detailsHTML += `

                    <p>

                        <strong>
                            Vendor:
                        </strong>

                        ${escapeHTML(
                            product.vendor
                        )}

                    </p>

                `;
            }


            if (product.category) {

                detailsHTML += `

                    <p>

                        <strong>
                            Category:
                        </strong>

                        ${escapeHTML(
                            product.category
                        )}

                    </p>

                `;
            }


            detailsHTML += `

                <p>
                    ${escapeHTML(description)}
                </p>

            `;


            detailsElement.innerHTML =
                detailsHTML;
        }
    }


    /*
       ADD TO CART
    */

    if (addButton) {

        addButton.type =
            "button";


        addButton.onclick =
            function () {

                addCart(
                    product.id
                );

            };
    }
}


/* =========================================================
   🔗 RELATED PRODUCTS
========================================================= */

function renderRelatedProducts(
    currentProduct
) {

    const container =
        document.getElementById(
            "relatedProducts"
        );


    if (!container) {
        return;
    }


    let related = [];


    /*
       First:
       Same category
    */

    if (
        currentProduct.category
    ) {

        related =
            products.filter(
                product =>

                    String(product.id) !==
                    String(currentProduct.id)

                    &&

                    normalizeText(
                        product.category
                    ) ===
                    normalizeText(
                        currentProduct.category
                    )
            );
    }


    /*
       If fewer than 4,
       add other products.
    */

    if (
        related.length < 4
    ) {

        const additional =
            products.filter(
                product =>

                    String(product.id) !==
                    String(currentProduct.id)

                    &&

                    !related.some(
                        item =>
                            String(item.id) ===
                            String(product.id)
                    )
            );


        related =
            related.concat(
                additional
            );
    }


    /*
       Maximum 4
    */

    related =
        related.slice(0, 4);


    container.innerHTML =
        "";


    if (!related.length) {
        return;
    }


    related.forEach(product => {

        const card =
            createProductCard(
                product
            );


        if (card) {

            container.appendChild(
                card
            );
        }

    });
}


/* =========================================================
   🔍 PRODUCT SEO
========================================================= */

function updateProductSEO(product) {

    if (!product) {
        return;
    }


    const productName =
        product.name ||
        "Wittyfare Product";


    const category =
        product.category ||
        "Agrovet Product";


    const description =
        product.description
            ? String(
                product.description
            ).substring(0, 155)

            : `Buy ${productName} from Wittyfare Agrovet & Farms in Abuja, Nigeria.`;


    /*
       Product URL
    */

    const productURL =
        `${window.location.origin}/product/?id=${encodeURIComponent(product.id)}`;


    /*
       TITLE
    */

    document.title =
        `${productName} | ${category} | Wittyfare`;


    /*
       DESCRIPTION
    */

    setMetaTag(
        "description",
        description
    );


    /*
       KEYWORDS
    */

    setMetaTag(
        "keywords",
        `${productName}, ${category}, agrovet products Abuja, farm products Nigeria, Wittyfare`
    );


    /*
       CANONICAL
    */

    let canonical =
        document.querySelector(
            'link[rel="canonical"]'
        );


    if (!canonical) {

        canonical =
            document.createElement(
                "link"
            );

        canonical.rel =
            "canonical";

        document.head.appendChild(
            canonical
        );
    }


    canonical.href =
        productURL;


    /*
       PRODUCT IMAGE
    */

    const imagePath =
        getProductImage(
            product.image
        );


    const absoluteImage =
        imagePath.startsWith("http")
            ? imagePath
            : new URL(
                imagePath,
                window.location.href
            ).href;


    /*
       OPEN GRAPH
    */

    setProductMeta(
        "og:title",
        productName
    );


    setProductMeta(
        "og:description",
        description
    );


    setProductMeta(
        "og:image",
        absoluteImage
    );


    setProductMeta(
        "og:url",
        productURL
    );


    setProductMeta(
        "og:type",
        "product"
    );


    setProductMeta(
        "og:site_name",
        "Wittyfare"
    );


    /*
       PRODUCT SCHEMA
    */

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

        "category":
            category,

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
                Number(
                    product.price || 0
                ).toFixed(2),

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


    /*
       BREADCRUMB SCHEMA
    */

    const categorySlug =
        String(category)
            .toLowerCase()
            .trim()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                "");


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
                    `${window.location.origin}/`
            },


            {

                "@type":
                    "ListItem",

                "position":
                    2,

                "name":
                    category,

                "item":
                    `${window.location.origin}/category/${encodeURIComponent(categorySlug)}/`
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
}


/* =========================================================
   🏷️ META TAG HELPER
========================================================= */

function setMetaTag(
    name,
    content
) {

    let tag =
        document.querySelector(
            `meta[name="${name}"]`
        );


    if (!tag) {

        tag =
            document.createElement(
                "meta"
            );

        tag.setAttribute(
            "name",
            name
        );

        document.head.appendChild(
            tag
        );
    }


    tag.setAttribute(
        "content",
        String(content || "")
    );
}


/* =========================================================
   🌐 OPEN GRAPH META HELPER
========================================================= */

function setProductMeta(
    property,
    content
) {

    let meta =
        document.querySelector(
            `meta[property="${property}"]`
        );


    if (!meta) {

        meta =
            document.createElement(
                "meta"
            );

        meta.setAttribute(
            "property",
            property
        );

        document.head.appendChild(
            meta
        );
    }


    meta.setAttribute(
        "content",
        String(content || "")
    );
}


/* =========================================================
   🧾 STRUCTURED DATA HELPER
========================================================= */

function addStructuredData(
    data,
    id
) {

    const oldSchema =
        document.getElementById(id);


    if (oldSchema) {

        oldSchema.remove();
    }


    const script =
        document.createElement(
            "script"
        );


    script.type =
        "application/ld+json";


    script.id =
        id;


    script.textContent =
        JSON.stringify(data);


    document.head.appendChild(
        script
    );
}


/* =========================================================
   🔍 SEARCH ENGINE
========================================================= */

function performSearch(query) {

    const searchTerm =
        String(query || "")
            .trim();


    /*
       Empty search
    */

    if (!searchTerm) {

        const pageProducts =
            getProductsForCurrentPage();


        addDataToHTML(
            pageProducts
        );


        return;
    }


    const pageCategory =
        getPageCategory();


    let searchableProducts;


    /*
       Category page:
       Search only that category.
    */

    if (pageCategory) {

        searchableProducts =
            products.filter(
                product =>

                    String(
                        product.category || ""
                    ).toLowerCase() ===
                    pageCategory.toLowerCase()
            );

    }


    /*
       Homepage:
       Search ALL products.
    */

    else {

        searchableProducts =
            products;
    }


    const normalizedQuery =
        normalizeText(
            searchTerm
        );


    const results =
        searchableProducts.filter(
            product => {

                const searchableText = [

                    product.name,

                    product.description,

                    product.category,

                    product.slug,

                    product.vendor,

                    product.farmSize,

                    product.packageType,

                    Array.isArray(
                        product.includes
                    )
                        ? product.includes.join(" ")
                        : product.includes

                ]
                    .filter(Boolean)
                    .join(" ");


                return normalizeText(
                    searchableText
                ).includes(
                    normalizedQuery
                );

            }
        );


    const listProduct =
        document.querySelector(
            ".listProduct:not(#relatedProducts)"
        );


    if (!listProduct) {
        return;
    }


    listProduct.innerHTML =
        "";


    if (!results.length) {

        listProduct.innerHTML = `

            <div class="search-no-results">

                <h3>
                    No products found
                </h3>

                <p>

                    We couldn't find any product
                    matching

                    "<strong>
                        ${escapeHTML(searchTerm)}
                    </strong>".

                </p>

            </div>

        `;

        return;
    }


    results.forEach(product => {

        const card =
            createProductCard(
                product,
                searchTerm
            );


        if (card) {

            listProduct.appendChild(
                card
            );
        }

    });
}


/* =========================================================
   🔍 SEARCH EVENTS
========================================================= */

function setupSearch() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const searchBtn =
        document.querySelector(
            ".search-button"
        );


    if (searchInput) {

        /*
           Search while typing
        */

        searchInput.addEventListener(
            "input",
            function () {

                performSearch(
                    this.value
                );

            }
        );


        /*
           Enter key
        */

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    performSearch(
                        this.value
                    );
                }

            }
        );
    }


    if (searchBtn) {

        searchBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                if (searchInput) {

                    performSearch(
                        searchInput.value
                    );
                }

            }
        );
    }
}


/*
   Compatibility with homepage
   if it calls searchProducts()
*/

window.searchProducts =
    function () {

        const searchInput =
            document.getElementById(
                "searchInput"
            );


        if (searchInput) {

            performSearch(
                searchInput.value
            );
        }
    };


/* =========================================================
   🛒 CART OPEN / CLOSE
========================================================= */

function setupCart() {

    const iconCart =
        document.querySelector(
            ".iconCart"
        );


    /*
       NEW CART SYSTEM
    */

    const cartTab =
        document.querySelector(
            ".cartTab"
        );


    const cartOverlay =
        document.querySelector(
            ".cart-overlay"
        );


    const closeCartButton =
        document.querySelector(
            ".closeCart"
        );


    /*
       OLD CART SYSTEM
    */

    const oldCart =
        document.querySelector(
            ".cart"
        );


    const container =
        document.querySelector(
            ".container"
        );


    const oldClose =
        document.querySelector(
            ".close"
        );


    let isCartOpen = false;


    /*
       NEW OPEN
    */

    function openCart() {

        isCartOpen = true;


        if (cartTab) {

            cartTab.classList.add(
                "active"
            );
        }


        if (cartOverlay) {

            cartOverlay.classList.add(
                "active"
            );
        }


        /*
           OLD cart fallback
        */

        if (
            oldCart &&
            !cartTab
        ) {

            oldCart.style.right =
                "0";
        }


        if (
            container &&
            oldCart &&
            !cartTab
        ) {

            container.style.transform =
                "translateX(-400px)";
        }
    }


    /*
       CLOSE
    */

    function closeCart() {

        isCartOpen = false;


        if (cartTab) {

            cartTab.classList.remove(
                "active"
            );
        }


        if (cartOverlay) {

            cartOverlay.classList.remove(
                "active"
            );
        }


        /*
           OLD cart fallback
        */

        if (
            oldCart &&
            !cartTab
        ) {

            oldCart.style.right =
                "-100%";
        }


        if (
            container &&
            oldCart &&
            !cartTab
        ) {

            container.style.transform =
                "translateX(0)";
        }
    }


    /*
       Make global close function
    */

    window.closeCart =
        closeCart;


    /*
       Cart icon
    */

    if (iconCart) {

        iconCart.addEventListener(
            "click",
            event => {

                event.preventDefault();

                if (isCartOpen) {

                    closeCart();

                } else {

                    openCart();

                }

            }
        );
    }


    /*
       New close button
    */

    if (closeCartButton) {

        closeCartButton.addEventListener(
            "click",
            closeCart
        );
    }


    /*
       Cart overlay
    */

    if (cartOverlay) {

        cartOverlay.addEventListener(
            "click",
            closeCart
        );
    }


    /*
       Old close button
    */

    if (oldClose) {

        oldClose.addEventListener(
            "click",
            closeCart
        );
    }


    /*
       Allow HTML onclick="hideCart()"
    */

    window.hideCart =
        closeCart;
}


/* =========================================================
   💬 CHAT
========================================================= */

window.openChat = function () {

    try {

        if (
            typeof Tawk_API ===
            "undefined"
        ) {

            console.warn(
                "Tawk.to is not ready yet."
            );

            return;
        }


        if (chatOpen) {

            Tawk_API.minimize();

            chatOpen = false;

        } else {

            Tawk_API.showWidget();

            Tawk_API.maximize();

            chatOpen = true;
        }

    } catch (error) {

        console.error(
            "Chat error:",
            error
        );
    }
};


/* =========================================================
   🚨 PRODUCT PAGE ERROR
========================================================= */

function showProductPageError(
    title,
    message
) {

    const nameElement =
        document.getElementById(
            "productName"
        );


    const descriptionElement =
        document.getElementById(
            "productDescription"
        );


    if (nameElement) {

        nameElement.textContent =
            title;
    }


    if (descriptionElement) {

        descriptionElement.textContent =
            message;
    }


    const addButton =
        document.getElementById(
            "addProductToCart"
        );


    if (addButton) {

        addButton.style.display =
            "none";
    }
}


/* =========================================================
   🛒 PRODUCT PAGE CART COMPATIBILITY
========================================================= */

function addProductPageItem(product) {

    /*
       Keep this function only for compatibility
       with any old product page code.

       It now uses the ONE central cart system.
    */

    if (!product) {
        return;
    }


    addCart(
        product.id
    );
}


/* =========================================================
   ⏳ WAIT FOR TAWK
========================================================= */

window.addEventListener(
    "tawkLoad",
    () => {

        console.log(
            "Tawk.to loaded."
        );

    }
);


/* =========================================================
   🚀 INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
           CART
        */

        loadCart();

        updateCartCounter();

        renderCartItems();

        calculateCheckoutTotal();


        /*
           MENU OVERLAY
        */

        const menuOverlay =
            document.getElementById(
                "menuOverlay"
            );


        if (menuOverlay) {

            menuOverlay.addEventListener(
                "click",
                () => {

                    closeMenu();

                }
            );
        }


        /*
           ESCAPE KEY
        */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeMenu();

                    if (
                        typeof window.closeCart ===
                        "function"
                    ) {

                        window.closeCart();
                    }
                }

            }
        );


        /*
           CART
        */

        setupCart();


        /*
           SEARCH
        */

        setupSearch();


        /*
           PRODUCTS
        */

        loadProducts();

    }
);


/* =========================================================
   🔄 STORAGE EVENT
   Keep cart synchronized if another tab changes it.
========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            "listCart"
        ) {

            loadCart();

            updateCartCounter();

            renderCartItems();

            calculateCheckoutTotal();
        }
    }
);


/* =========================================================
   ✅ END OF WITTYFARE APP.JS
========================================================= */