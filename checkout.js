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

                console.log("Checkout cart loaded from:", key);

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
   RENDER CHECKOUT CART
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


        updateCartBadge();

        updateItemsCount(0);

        return;
    }


    /* =====================================================
       TOTALS
    ===================================================== */

    let totalQuantity = 0;

    let totalPrice = 0;


    /* =====================================================
       PRODUCTS
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


        /* -----------------------------------------------
           PRODUCT ELEMENT
        ----------------------------------------------- */

        const item =
            document.createElement("div");


        /*
           IMPORTANT:
           Use checkout-product-item because
           that is what your CSS styles.
        */

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
       UPDATE TOTALS
    ===================================================== */

    quantityElements.forEach(element => {

        element.textContent =
            totalQuantity.toLocaleString();

    });


    priceElements.forEach(element => {

        element.textContent =
            "₦" + totalPrice.toLocaleString();

    });


    if (hiddenQuantity) {

        hiddenQuantity.value =
            totalQuantity;

    }


    if (hiddenPrice) {

        hiddenPrice.value =
            totalPrice.toFixed(2);

    }


    /* =====================================================
       CHECKOUT BUTTON
    ===================================================== */

    const buttonTotal =
        document.querySelector(
            ".checkout-button-total"
        );


    if (buttonTotal) {

        buttonTotal.textContent =
            "₦" + totalPrice.toLocaleString();

    }


    updateItemsCount(totalQuantity);

    updateCartBadge();


    console.log(
        "✅ Checkout rendered:",
        listCart
    );

}


/* =========================================================
   ITEMS COUNT
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
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


/* =========================================================
   CART BADGE
========================================================= */

function updateCartBadge() {

    const badges =
        document.querySelectorAll(
            ".cart-badge"
        );


    const total =
        listCart.reduce(

            (sum, product) => {

                return sum +
                    Number(
                        product.quantity || 0
                    );

            },

            0

        );


    badges.forEach(badge => {

        badge.textContent = total;

        badge.style.display =
            total > 0
                ? "flex"
                : "none";

    });

}


/* =========================================================
   REMOVE PRODUCT
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


            listCart =
                listCart.filter(
                    product =>
                        String(product.id) !== id
                );


            saveCart();


            renderCheckoutCart();

        }
    );

}


/* =========================================================
   UPDATE QUANTITY
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


            const quantity =
                parseInt(
                    input.value,
                    10
                );


            if (
                quantity <= 0 ||
                isNaN(quantity)
            ) {

                listCart =
                    listCart.filter(
                        product =>
                            String(product.id) !== id
                    );

            } else {

                const product =
                    listCart.find(
                        item =>
                            String(item.id) === id
                    );


                if (product) {

                    product.quantity =
                        quantity;

                }

            }


            saveCart();

            renderCheckoutCart();

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


            /* -----------------------------------------
               Check cart
            ----------------------------------------- */

            if (
                !Array.isArray(listCart) ||
                listCart.length === 0
            ) {

                alert(
                    "Your cart is empty. Please add a product before checking out."
                );

                return;

            }


            /* -----------------------------------------
               Validate form
            ----------------------------------------- */

            if (!form.checkValidity()) {

                form.reportValidity();

                return;

            }


            /* -----------------------------------------
               Normalize cart
            ----------------------------------------- */

            listCart =
                listCart.map(
                    normalizeProduct
                );


            /* -----------------------------------------
               Calculate totals
            ----------------------------------------- */

            let totalQuantity = 0;

            let totalPrice = 0;


            listCart.forEach(product => {

                totalQuantity +=
                    Number(product.quantity);


                totalPrice +=
                    Number(product.price) *
                    Number(product.quantity);

            });


            /* -----------------------------------------
               Customer information
            ----------------------------------------- */

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


            /* -----------------------------------------
               SAVE CUSTOMER
            ----------------------------------------- */

            sessionStorage.setItem(
                "userDetails",
                JSON.stringify(
                    userDetails
                )
            );


            /* -----------------------------------------
               SAVE PRODUCTS
            ----------------------------------------- */

            sessionStorage.setItem(
                "checkoutCart",
                JSON.stringify(
                    listCart
                )
            );


            /* -----------------------------------------
               SAVE COMPLETE ORDER
            ----------------------------------------- */

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


            /* -----------------------------------------
               GO TO CONFIRMATION
            ----------------------------------------- */

            window.location.href =
                "confirmation.html";

        }
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "========== WITTYFARE CHECKOUT =========="
        );


        loadCart();

        renderCheckoutCart();

        setupDeleteButtons();

        setupQuantityInputs();

        setupPaymentOptions();

        setupCheckoutForm();

    }
);