/* =========================================================
   WITTYFARE CHECKOUT
   Cart → Checkout → Confirmation
========================================================= */

let listCart = [];


/* =========================================================
   LOAD CART
========================================================= */

function loadCart() {

    const possibleKeys = [
        "listCart",
        "cart",
        "cartItems",
        "shoppingCart"
    ];

    let foundCart = null;

    for (const key of possibleKeys) {

        try {

            const stored = localStorage.getItem(key);

            if (!stored) continue;

            const parsed = JSON.parse(stored);

            if (Array.isArray(parsed) && parsed.length > 0) {

                foundCart = parsed;

                console.log(
                    "Checkout cart loaded from:",
                    key
                );

                break;
            }

        } catch (error) {

            console.warn(
                "Could not read cart key:",
                key,
                error
            );

        }
    }


    if (!foundCart) {

        console.warn(
            "No cart found in localStorage."
        );

        listCart = [];

        return;
    }


    listCart = foundCart.map(normalizeProduct);


    console.log(
        "Products in checkout:",
        listCart
    );

}


/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

function normalizeProduct(product) {

    if (!product || typeof product !== "object") {

        return {
            id: "",
            name: "Product",
            image: "",
            price: 0,
            quantity: 1
        };

    }


    return {

        id: String(
            product.id ??
            product.productId ??
            ""
        ),

        name:
            product.name ??
            product.title ??
            product.productName ??
            "Product",

        image:
            product.image ??
            product.img ??
            product.imageUrl ??
            product.productImage ??
            "",

        price:
            Number(
                product.price ??
                product.sellingPrice ??
                product.amount ??
                0
            ),

        quantity: Math.max(
            1,
            Number(
                product.quantity ??
                product.qty ??
                product.count ??
                1
            )
        )

    };

}


/* =========================================================
   SAVE CART
========================================================= */

function saveCart() {

    localStorage.setItem(
        "listCart",
        JSON.stringify(listCart)
    );

}


/* =========================================================
   GET CART TOTALS
========================================================= */

function getCartTotals() {

    let totalQuantity = 0;
    let totalPrice = 0;


    if (!Array.isArray(listCart)) {

        return {
            totalQuantity: 0,
            totalPrice: 0
        };

    }


    listCart.forEach(product => {

        const quantity =
            Number(product.quantity) || 0;

        const price =
            Number(product.price) || 0;


        totalQuantity += quantity;

        totalPrice +=
            price * quantity;

    });


    return {
        totalQuantity,
        totalPrice
    };

}


/* =========================================================
   UPDATE ALL CART BADGES
========================================================= */

function updateCartBadge() {

    const totals =
        getCartTotals();


    const badges =
        document.querySelectorAll(
            ".cart-badge, .iconCart .totalQuantity"
        );


    badges.forEach(badge => {

        badge.textContent =
            totals.totalQuantity;


        badge.style.display =
            totals.totalQuantity > 0
                ? "flex"
                : "none";

    });

}


/* =========================================================
   UPDATE ITEMS COUNT
========================================================= */

function updateItemsCount(totalQuantity) {

    const itemsCount =
        document.querySelector(
            ".items-count"
        );


    if (!itemsCount)
        return;


    itemsCount.textContent =
        `${totalQuantity} ${
            totalQuantity === 1
                ? "Item"
                : "Items"
        }`;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


/* =========================================================
   RENDER CHECKOUT ORDER SUMMARY
========================================================= */

function renderCheckoutCart() {

    const cartContainer =
        document.querySelector(
            ".order-summary-card .list"
        ) ||
        document.querySelector(
            ".returnCart .list"
        ) ||
        document.querySelector(
            ".list"
        );


    if (!cartContainer) {

        console.error(
            "❌ Checkout product container not found."
        );

        return;
    }


    const quantityElements =
        document.querySelectorAll(
            ".totalQuantity"
        );


    const priceElements =
        document.querySelectorAll(
            ".totalPrice"
        );


    const hiddenQuantity =
        document.getElementById(
            "totalQuantity"
        );


    const hiddenPrice =
        document.getElementById(
            "totalPrice"
        );


    const buttonTotal =
        document.querySelector(
            ".checkout-button-total"
        );


    cartContainer.innerHTML = "";


    /* =====================================================
       EMPTY CART
    ===================================================== */

    if (
        !Array.isArray(listCart) ||
        listCart.length === 0
    ) {

        cartContainer.innerHTML = `

            <div class="empty-checkout-cart">

                <div class="empty-cart-icon">
                    <i class="fa-solid fa-cart-shopping"></i>
                </div>

                <h3>Your cart is empty</h3>

                <p>
                    You haven't added any products yet.
                </p>

                <a href="index.html">
                    Browse Products
                </a>

            </div>

        `;


        quantityElements.forEach(element => {

            element.textContent = "0";

        });


        priceElements.forEach(element => {

            element.textContent = "₦0";

        });


        if (hiddenQuantity) {

            hiddenQuantity.value = "0";

        }


        if (hiddenPrice) {

            hiddenPrice.value = "0";

        }


        if (buttonTotal) {

            buttonTotal.textContent = "₦0";

        }


        updateItemsCount(0);

        updateCartBadge();

        renderSlideCart();

        return;
    }


    /* =====================================================
       CALCULATE TOTALS
    ===================================================== */

    let totalQuantity = 0;

    let totalPrice = 0;


    /* =====================================================
       RENDER PRODUCTS
    ===================================================== */

    listCart.forEach(product => {

        const quantity =
            Number(product.quantity) || 1;


        const price =
            Number(product.price) || 0;


        const subtotal =
            price * quantity;


        totalQuantity += quantity;

        totalPrice += subtotal;


        const item =
            document.createElement("div");


        item.className =
            "checkout-product-item";


        item.innerHTML = `

            <div class="checkout-product-image">

                ${
                    product.image

                    ?

                    `
                    <img
                        src="${escapeHTML(product.image)}"
                        alt="${escapeHTML(product.name)}"
                        onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-box\\'></i>';"
                    >
                    `

                    :

                    `
                    <i class="fa-solid fa-box"></i>
                    `
                }

            </div>


            <div class="checkout-product-info">

                <h3>
                    ${escapeHTML(product.name)}
                </h3>


                <div class="checkout-product-meta">

                    <span>
                        ₦${price.toLocaleString()}
                    </span>

                    <span>
                        × ${quantity}
                    </span>

                </div>

            </div>


            <div class="checkout-product-right">

                <strong>
                    ₦${subtotal.toLocaleString()}
                </strong>


                <button
                    type="button"
                    class="delete-btn checkout-delete"
                    data-id="${escapeHTML(product.id)}"
                    title="Remove product"
                    aria-label="Remove ${escapeHTML(product.name)}"
                >

                    <i class="fa-solid fa-trash"></i>

                    Remove

                </button>

            </div>

        `;


        cartContainer.appendChild(item);

    });


    /* =====================================================
       UPDATE TOTAL QUANTITY
    ===================================================== */

    quantityElements.forEach(element => {

        element.textContent =
            totalQuantity.toLocaleString();

    });


    /* =====================================================
       UPDATE TOTAL PRICE
    ===================================================== */

    priceElements.forEach(element => {

        element.textContent =
            "₦" +
            totalPrice.toLocaleString();

    });


    /* =====================================================
       UPDATE HIDDEN INPUTS
    ===================================================== */

    if (hiddenQuantity) {

        hiddenQuantity.value =
            totalQuantity;

    }


    if (hiddenPrice) {

        hiddenPrice.value =
            totalPrice.toFixed(2);

    }


    /* =====================================================
       UPDATE CHECKOUT BUTTON
    ===================================================== */

    if (buttonTotal) {

        buttonTotal.textContent =
            "₦" +
            totalPrice.toLocaleString();

    }


    /* =====================================================
       UPDATE OTHER CART ELEMENTS
    ===================================================== */

    updateItemsCount(totalQuantity);

    updateCartBadge();


    console.log(
        "✅ Checkout rendered:",
        listCart
    );

}


/* =========================================================
   RENDER SLIDE-OUT CART
========================================================= */

function renderSlideCart() {

    const cartContainer =
        document.querySelector(
            ".listCart"
        );


    if (!cartContainer)
        return;


    cartContainer.innerHTML = "";


    /* =====================================================
       EMPTY CART
    ===================================================== */

    if (
        !Array.isArray(listCart) ||
        listCart.length === 0
    ) {

        cartContainer.innerHTML = `

            <div class="empty-cart">

                <i class="fa-solid fa-cart-shopping"></i>

                <p>
                    Your cart is empty.
                </p>

            </div>

        `;

        return;
    }


    /* =====================================================
       RENDER PRODUCTS
    ===================================================== */

    listCart.forEach(product => {

        const quantity =
            Number(product.quantity) || 1;


        const price =
            Number(product.price) || 0;


        const subtotal =
            price * quantity;


        const item =
            document.createElement("div");


        item.className =
            "item";


        item.innerHTML = `

            <img
                src="${escapeHTML(product.image)}"
                alt="${escapeHTML(product.name)}"
                onerror="this.style.display='none';"
            >


            <div class="content">

                <div class="name">
                    ${escapeHTML(product.name)}
                </div>


                <div class="price">
                    ₦${subtotal.toLocaleString()}
                </div>

            </div>


            <div class="cartControls">

                <button
                    type="button"
                    class="deleteBtn slide-cart-delete"
                    data-id="${escapeHTML(product.id)}"
                    title="Remove product"
                    aria-label="Remove ${escapeHTML(product.name)}"
                >
                    🗑
                </button>


                <div class="verticalQty">

                    <button
                        type="button"
                        class="slide-cart-plus"
                        data-id="${escapeHTML(product.id)}"
                        aria-label="Increase quantity"
                    >
                        +
                    </button>


                    <input
                        type="number"
                        min="1"
                        value="${quantity}"
                        class="slide-cart-qty"
                        data-id="${escapeHTML(product.id)}"
                        aria-label="Quantity"
                    >


                    <button
                        type="button"
                        class="slide-cart-minus"
                        data-id="${escapeHTML(product.id)}"
                        aria-label="Decrease quantity"
                    >
                        −
                    </button>

                </div>

            </div>

        `;


        cartContainer.appendChild(item);

    });

}


/* =========================================================
   OPEN / CLOSE SLIDE CART
========================================================= */

function setupCart() {

    const iconCart =
        document.querySelector(
            ".iconCart"
        );


    const cart =
        document.querySelector(
            ".cart"
        );


    const close =
        document.querySelector(
            ".cart .close"
        );


    const container =
        document.querySelector(
            ".checkout-container"
        );


    if (!iconCart || !cart) {

        console.warn(
            "Cart icon or cart panel not found."
        );

        return;
    }


    let isCartOpen = false;


    /* =====================================================
       OPEN CART
    ===================================================== */

    function openCart() {

        renderSlideCart();


        cart.style.transition =
            "right 0.5s ease";


        cart.style.right =
            "0";


        if (container) {

            container.style.transition =
                "transform 0.5s ease";


            container.style.transform =
                "translateX(-400px)";

        }


        isCartOpen = true;

    }


    /* =====================================================
       CLOSE CART
    ===================================================== */

    function closeCart() {

        cart.style.transition =
            "right 0.5s ease";


        cart.style.right =
            "-100%";


        if (container) {

            container.style.transition =
                "transform 0.5s ease";


            container.style.transform =
                "translateX(0)";

        }


        isCartOpen = false;

    }


    /* =====================================================
       CART ICON CLICK
    ===================================================== */

    iconCart.addEventListener(
        "click",
        function(event) {

            event.preventDefault();


            if (isCartOpen) {

                closeCart();

            } else {

                openCart();

            }

        }
    );


    /* =====================================================
       CLOSE BUTTON
    ===================================================== */

    if (close) {

        close.addEventListener(
            "click",
            closeCart
        );

    }


    /* =====================================================
       MAKE FUNCTIONS AVAILABLE
    ===================================================== */

    window.openCheckoutCart =
        openCart;


    window.closeCheckoutCart =
        closeCart;

}


/* =========================================================
   REMOVE PRODUCT FROM CHECKOUT
========================================================= */

function removeProduct(productId) {

    const id =
        String(productId);


    listCart =
        listCart.filter(
            product =>
                String(product.id) !== id
        );


    saveCart();


    renderCheckoutCart();

    renderSlideCart();

    updateCartBadge();


    console.log(
        "🗑 Product removed:",
        id
    );

}


/* =========================================================
   INCREASE PRODUCT QUANTITY
========================================================= */

function increaseQuantity(productId) {

    const id =
        String(productId);


    const product =
        listCart.find(
            item =>
                String(item.id) === id
        );


    if (!product)
        return;


    product.quantity =
        (Number(product.quantity) || 1) + 1;


    saveCart();


    renderCheckoutCart();

    renderSlideCart();

    updateCartBadge();

}


/* =========================================================
   DECREASE PRODUCT QUANTITY
========================================================= */

function decreaseQuantity(productId) {

    const id =
        String(productId);


    const product =
        listCart.find(
            item =>
                String(item.id) === id
        );


    if (!product)
        return;


    const newQuantity =
        (Number(product.quantity) || 1) - 1;


    if (newQuantity <= 0) {

        removeProduct(id);

        return;

    }


    product.quantity =
        newQuantity;


    saveCart();


    renderCheckoutCart();

    renderSlideCart();

    updateCartBadge();

}


/* =========================================================
   SET PRODUCT QUANTITY
========================================================= */

function setProductQuantity(
    productId,
    quantity
) {

    const id =
        String(productId);


    const product =
        listCart.find(
            item =>
                String(item.id) === id
        );


    if (!product)
        return;


    let newQuantity =
        parseInt(
            quantity,
            10
        );


    if (
        isNaN(newQuantity) ||
        newQuantity <= 0
    ) {

        removeProduct(id);

        return;

    }


    product.quantity =
        newQuantity;


    saveCart();


    renderCheckoutCart();

    renderSlideCart();

    updateCartBadge();

}


/* =========================================================
   CHECKOUT DELETE BUTTONS
========================================================= */

function setupDeleteButtons() {

    document.addEventListener(
        "click",
        function(event) {

            const button =
                event.target.closest(
                    ".checkout-delete"
                );


            if (!button)
                return;


            const id =
                String(
                    button.dataset.id
                );


            removeProduct(id);

        }
    );

}


/* =========================================================
   CHECKOUT QUANTITY INPUTS
========================================================= */

function setupQuantityInputs() {

    document.addEventListener(
        "change",
        function(event) {

            const input =
                event.target.closest(
                    ".quantity-input"
                );


            if (!input)
                return;


            const id =
                String(
                    input.dataset.id
                );


            setProductQuantity(
                id,
                input.value
            );

        }
    );

}


/* =========================================================
   SLIDE CART CONTROLS
========================================================= */

function setupSlideCartControls() {

    /* =====================================================
       BUTTONS
    ===================================================== */

    document.addEventListener(
        "click",
        function(event) {


            /* ---------------------------------------------
               DELETE
            --------------------------------------------- */

            const deleteButton =
                event.target.closest(
                    ".slide-cart-delete"
                );


            if (deleteButton) {

                const id =
                    String(
                        deleteButton.dataset.id
                    );


                removeProduct(id);

                return;

            }


            /* ---------------------------------------------
               PLUS
            --------------------------------------------- */

            const plusButton =
                event.target.closest(
                    ".slide-cart-plus"
                );


            if (plusButton) {

                const id =
                    String(
                        plusButton.dataset.id
                    );


                increaseQuantity(id);

                return;

            }


            /* ---------------------------------------------
               MINUS
            --------------------------------------------- */

            const minusButton =
                event.target.closest(
                    ".slide-cart-minus"
                );


            if (minusButton) {

                const id =
                    String(
                        minusButton.dataset.id
                    );


                decreaseQuantity(id);

                return;

            }

        }
    );


    /* =====================================================
       MANUAL QUANTITY
    ===================================================== */

    document.addEventListener(
        "change",
        function(event) {

            const input =
                event.target.closest(
                    ".slide-cart-qty"
                );


            if (!input)
                return;


            const id =
                String(
                    input.dataset.id
                );


            setProductQuantity(
                id,
                input.value
            );

        }
    );

}


/* =========================================================
   PAYMENT OPTIONS
========================================================= */

function setupPaymentOptions() {

    const options =
        document.querySelectorAll(
            ".payment-option"
        );


    options.forEach(option => {

        const radio =
            option.querySelector(
                'input[type="radio"]'
            );


        if (!radio)
            return;


        radio.addEventListener(
            "change",
            function() {

                options.forEach(item => {

                    item.classList.remove(
                        "selected"
                    );

                });


                if (radio.checked) {

                    option.classList.add(
                        "selected"
                    );

                }

            }
        );

    });

}


/* =========================================================
   CHECKOUT FORM
========================================================= */

function setupCheckoutForm() {

    const form =
        document.getElementById(
            "checkoutForm"
        );


    if (!form)
        return;


    form.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            /* ---------------------------------------------
               CHECK CART
            --------------------------------------------- */

            if (
                !Array.isArray(listCart) ||
                listCart.length === 0
            ) {

                alert(
                    "Your cart is empty. Please add a product before checking out."
                );

                return;

            }


            /* ---------------------------------------------
               VALIDATE FORM
            --------------------------------------------- */

            if (!form.checkValidity()) {

                form.reportValidity();

                return;

            }


            /* ---------------------------------------------
               NORMALIZE CART
            --------------------------------------------- */

            listCart =
                listCart.map(
                    normalizeProduct
                );


            /* ---------------------------------------------
               CALCULATE TOTALS
            --------------------------------------------- */

            const totals =
                getCartTotals();


            const totalQuantity =
                totals.totalQuantity;


            const totalPrice =
                totals.totalPrice;


            /* ---------------------------------------------
               GET CUSTOMER INFORMATION
            --------------------------------------------- */

            const formData =
                new FormData(form);


            const userDetails =
                Object.fromEntries(
                    formData.entries()
                );


            userDetails.totalQuantity =
                totalQuantity;


            userDetails.totalPrice =
                totalPrice.toFixed(2);


            /* ---------------------------------------------
               SAVE CUSTOMER DETAILS
            --------------------------------------------- */

            sessionStorage.setItem(
                "userDetails",
                JSON.stringify(
                    userDetails
                )
            );


            /* ---------------------------------------------
               SAVE CART
            --------------------------------------------- */

            sessionStorage.setItem(
                "checkoutCart",
                JSON.stringify(
                    listCart
                )
            );


            /* ---------------------------------------------
               CREATE ORDER SNAPSHOT
            --------------------------------------------- */

            const orderSnapshot = {

                customer:
                    userDetails,

                products:
                    listCart,

                totalQuantity:
                    totalQuantity,

                totalPrice:
                    totalPrice,

                createdAt:
                    new Date().toISOString()

            };


            /* ---------------------------------------------
               SAVE ORDER
            --------------------------------------------- */

            sessionStorage.setItem(
                "currentOrder",
                JSON.stringify(
                    orderSnapshot
                )
            );


            console.log(
                "✅ Order saved:",
                orderSnapshot
            );


            /* ---------------------------------------------
               GO TO CONFIRMATION
            --------------------------------------------- */

            window.location.href =
                "confirmation.html";

        }
    );

}


/* =========================================================
   INITIALIZE CHECKOUT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "========== WITTYFARE CHECKOUT =========="
        );


        /* ---------------------------------------------
           LOAD CART
        --------------------------------------------- */

        loadCart();


        /* ---------------------------------------------
           RENDER ORDER
        --------------------------------------------- */

        renderCheckoutCart();


        /* ---------------------------------------------
           RENDER SLIDE CART
        --------------------------------------------- */

        renderSlideCart();


        /* ---------------------------------------------
           SETUP CART
        --------------------------------------------- */

        setupCart();


        /* ---------------------------------------------
           DELETE
        --------------------------------------------- */

        setupDeleteButtons();


        /* ---------------------------------------------
           QUANTITY
        --------------------------------------------- */

        setupQuantityInputs();


        /* ---------------------------------------------
           SLIDE CART CONTROLS
        --------------------------------------------- */

        setupSlideCartControls();


        /* ---------------------------------------------
           PAYMENT
        --------------------------------------------- */

        setupPaymentOptions();


        /* ---------------------------------------------
           CHECKOUT FORM
        --------------------------------------------- */

        setupCheckoutForm();


        /* ---------------------------------------------
           UPDATE BADGE
        --------------------------------------------- */

        updateCartBadge();


        console.log(
            "✅ WittyFare checkout initialized successfully."
        );

    }
);