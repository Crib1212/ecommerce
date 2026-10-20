
/* =========================================================
   WITTYFARE AGROVET & FARMS
   COMPLETE CHECKOUT.JS
   Cart | Product Variants | OPay | Confirmation
========================================================= */

"use strict";

let listCart = [];
let checkoutSubmitting = false;

/* =========================================================
   CONFIGURATION
========================================================= */

const CHECKOUT_CONFIG = {
    opayEndpoint: "/api/opay-init",
    confirmationPage: "confirmation.html",
    transferPage: "bank-transfer.html",
    currency: "₦",
    maxQuantity: 999
};

/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatNaira(amount) {
    const value = Number(amount);

    return CHECKOUT_CONFIG.currency +
        (Number.isFinite(value) ? value : 0).toLocaleString("en-NG", {
            maximumFractionDigits: 2
        });
}

function normalizeProduct(product) {
    if (!product || typeof product !== "object") {
        return null;
    }

    const rawPrice =
        product.price ??
        product.sellingPrice ??
        product.amount ??
        0;

    const rawQuantity =
        product.quantity ??
        product.qty ??
        product.count ??
        1;

    const quantity = Math.floor(Number(rawQuantity));

    return {
        id: String(
            product.id ??
            product.productId ??
            ""
        ).trim(),

        name: String(
            product.name ??
            product.title ??
            product.productName ??
            "Product"
        ),

        image: String(
            product.image ??
            product.img ??
            product.imageUrl ??
            product.productImage ??
            ""
        ),

        price: Number(rawPrice),

        quantity: Number.isFinite(quantity) && quantity >= 1
            ? quantity
            : 1,

        variantSku: product.variantSku
            ? String(product.variantSku).trim()
            : null,

        variantName: product.variantName
            ? String(product.variantName).trim()
            : null,

        variantLabel: product.variantLabel
            ? String(product.variantLabel).trim()
            : null
    };
}

/*
   A product and each of its variants must have
   different cart-item keys.

   Example:
   coctreat-001::COC-100
   coctreat-001::COC-250
*/

function getCartItemKey(product) {
    return `${String(product.id)}::${String(
        product.variantSku || "default"
    )}`;
}

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

            if (stored === null) {
                continue;
            }

            const parsed = JSON.parse(stored);

            if (Array.isArray(parsed)) {
                foundCart = parsed;

                console.log("Checkout cart loaded from:", key);
                break;
            }
        } catch (error) {
            console.warn(
                "Could not read cart:",
                key,
                error
            );
        }
    }

    listCart = Array.isArray(foundCart)
        ? foundCart.map(normalizeProduct)
        : [];

    listCart = listCart.filter(product =>
        product &&
        product.id &&
        Number.isFinite(product.price) &&
        product.price > 0 &&
        Number.isSafeInteger(product.quantity) &&
        product.quantity >= 1 &&
        product.quantity <= CHECKOUT_CONFIG.maxQuantity
    );

    /*
       Combine duplicate entries only when their product ID
       AND variant SKU match.
    */

    const mergedCart = new Map();

    listCart.forEach(product => {
        const key = getCartItemKey(product);
        const existing = mergedCart.get(key);

        if (existing) {
            existing.quantity = Math.min(
                CHECKOUT_CONFIG.maxQuantity,
                existing.quantity + product.quantity
            );
        } else {
            mergedCart.set(key, { ...product });
        }
    });

    listCart = Array.from(mergedCart.values());

    saveCart();

    console.log("Checkout products:", listCart);
}

/* =========================================================
   SAVE CART
========================================================= */

function saveCart() {
    try {
        localStorage.setItem(
            "listCart",
            JSON.stringify(listCart)
        );
    } catch (error) {
        console.error("Unable to save cart:", error);
    }
}

/* =========================================================
   CART TOTALS
========================================================= */

function getCartTotals() {
    let totalQuantity = 0;
    let totalPrice = 0;

    listCart.forEach(product => {
        const quantity = Number(product.quantity) || 0;
        const price = Number(product.price) || 0;

        totalQuantity += quantity;
        totalPrice += price * quantity;
    });

    return {
        totalQuantity,
        totalPrice
    };
}

/* =========================================================
   CART BADGES
========================================================= */

function updateCartBadge() {
    const totals = getCartTotals();

    document.querySelectorAll(
        ".cart-badge, .iconCart .totalQuantity"
    ).forEach(element => {
        element.textContent = totals.totalQuantity;

        element.style.display =
            totals.totalQuantity > 0 ? "flex" : "none";
    });
}

/* =========================================================
   ITEMS COUNT
========================================================= */

function updateItemsCount(totalQuantity) {
    const element = document.querySelector(".items-count");

    if (element) {
        element.textContent =
            `${totalQuantity} ${
                totalQuantity === 1 ? "Item" : "Items"
            }`;
    }
}

/* =========================================================
   VARIANT DISPLAY
========================================================= */

function getProductDisplayName(product) {
    if (product.variantName) {
        const label = product.variantLabel || "Size";

        return `${product.name} — ${label}: ${product.variantName}`;
    }

    return product.name;
}

/* =========================================================
   RENDER CHECKOUT SUMMARY
========================================================= */

function renderCheckoutCart() {
    const cartContainer = document.querySelector(
        ".order-summary-card .list"
    );

    const quantityElements =
        document.querySelectorAll(".totalQuantity");

    const priceElements =
        document.querySelectorAll(".totalPrice");

    const hiddenQuantity =
        document.getElementById("totalQuantity");

    const hiddenPrice =
        document.getElementById("totalPrice");

    const buttonTotal =
        document.querySelector(".checkout-button-total");

    if (!cartContainer) {
        console.warn("Checkout product container not found.");
        return;
    }

    cartContainer.replaceChildren();

    const totals = getCartTotals();

    quantityElements.forEach(element => {
        element.textContent =
            totals.totalQuantity.toLocaleString("en-NG");
    });

    priceElements.forEach(element => {
        element.textContent = formatNaira(totals.totalPrice);
    });

    if (hiddenQuantity) {
        hiddenQuantity.value = String(totals.totalQuantity);
    }

    if (hiddenPrice) {
        hiddenPrice.value = totals.totalPrice.toFixed(2);
    }

    if (buttonTotal) {
        buttonTotal.textContent = formatNaira(totals.totalPrice);
    }

    updateItemsCount(totals.totalQuantity);
    updateCartBadge();

    if (listCart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-checkout-cart">
                <div class="empty-cart-icon">
                    <i class="fa-solid fa-cart-shopping"></i>
                </div>
                <h3>Your cart is empty</h3>
                <p>You haven't added any products yet.</p>
                <a href="index.html">Browse Products</a>
            </div>
        `;

        return;
    }

    listCart.forEach(product => {
        const quantity = Number(product.quantity);
        const price = Number(product.price);
        const subtotal = quantity * price;
        const itemKey = getCartItemKey(product);

        const item = document.createElement("div");
        item.className = "checkout-product-item";

        /* Product image */

        const imageContainer = document.createElement("div");
        imageContainer.className = "checkout-product-image";

        if (product.image) {
            const image = document.createElement("img");

            image.src = product.image;
            image.alt = product.name;
            image.loading = "lazy";

            image.addEventListener("error", function () {
                imageContainer.replaceChildren();

                const icon = document.createElement("i");
                icon.className = "fa-solid fa-box";

                imageContainer.appendChild(icon);
            }, { once: true });

            imageContainer.appendChild(image);
        } else {
            const icon = document.createElement("i");
            icon.className = "fa-solid fa-box";

            imageContainer.appendChild(icon);
        }

        /* Product details */

        const info = document.createElement("div");
        info.className = "checkout-product-info";

        const name = document.createElement("h3");
        name.textContent = product.name;

        if (product.variantName) {
            const variant = document.createElement("div");

            variant.className = "checkout-variant-name";
            variant.textContent =
                `${product.variantLabel || "Size"}: ${product.variantName}`;

            info.append(name, variant);
        } else {
            info.appendChild(name);
        }

        const meta = document.createElement("div");
        meta.className = "checkout-product-meta";
        meta.textContent =
            `${formatNaira(price)} × ${quantity}`;

        info.appendChild(meta);

        /* Subtotal and remove button */

        const right = document.createElement("div");
        right.className = "checkout-product-right";

        const subtotalElement = document.createElement("strong");
        subtotalElement.textContent = formatNaira(subtotal);

        const removeButton = document.createElement("button");

        removeButton.type = "button";
        removeButton.className = "delete-btn checkout-delete";
        removeButton.dataset.key = itemKey;
        removeButton.title = "Remove product";

        removeButton.setAttribute(
            "aria-label",
            `Remove ${getProductDisplayName(product)}`
        );

        removeButton.innerHTML =
            '<i class="fa-solid fa-trash"></i> Remove';

        right.append(subtotalElement, removeButton);
        item.append(imageContainer, info, right);

        cartContainer.appendChild(item);
    });
}

/* =========================================================
   RENDER SLIDE-OUT CART
========================================================= */

function renderSlideCart() {
    const cartContainer = document.querySelector(".listCart");

    if (!cartContainer) return;

    cartContainer.replaceChildren();

    if (listCart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fa-solid fa-cart-shopping"></i>
                <p>Your cart is empty.</p>
            </div>
        `;

        return;
    }

    listCart.forEach(product => {
        const item = document.createElement("div");
        item.className = "item";

        const itemKey = getCartItemKey(product);

        /* Image */

        const image = document.createElement("img");
        image.alt = product.name;
        image.loading = "lazy";

        if (product.image) {
            image.src = product.image;

            image.addEventListener("error", () => {
                image.style.display = "none";
            }, { once: true });
        } else {
            image.style.display = "none";
        }

        /* Name and price */

        const content = document.createElement("div");
        content.className = "content";

        const name = document.createElement("div");
        name.className = "name";
        name.textContent = product.name;

        if (product.variantName) {
            const variant = document.createElement("div");

            variant.className = "variant-name";
            variant.textContent =
                `${product.variantLabel || "Size"}: ${product.variantName}`;

            name.appendChild(variant);
        }

        const price = document.createElement("div");
        price.className = "price";

        price.textContent = formatNaira(
            product.price * product.quantity
        );

        content.append(name, price);

        /* Controls */

        const controls = document.createElement("div");
        controls.className = "cartControls";

        const remove = document.createElement("button");

        remove.type = "button";
        remove.className = "deleteBtn slide-cart-delete";
        remove.dataset.key = itemKey;
        remove.textContent = "🗑";

        remove.setAttribute(
            "aria-label",
            `Remove ${getProductDisplayName(product)}`
        );

        const qtyControls = document.createElement("div");
        qtyControls.className = "verticalQty";

        const plus = document.createElement("button");

        plus.type = "button";
        plus.className = "slide-cart-plus";
        plus.dataset.key = itemKey;
        plus.textContent = "+";
        plus.setAttribute("aria-label", "Increase quantity");

        const input = document.createElement("input");

        input.type = "number";
        input.min = "1";
        input.max = String(CHECKOUT_CONFIG.maxQuantity);
        input.step = "1";
        input.value = String(product.quantity);
        input.className = "slide-cart-qty";
        input.dataset.key = itemKey;
        input.setAttribute("aria-label", "Quantity");

        const minus = document.createElement("button");

        minus.type = "button";
        minus.className = "slide-cart-minus";
        minus.dataset.key = itemKey;
        minus.textContent = "−";
        minus.setAttribute("aria-label", "Decrease quantity");

        qtyControls.append(plus, input, minus);
        controls.append(remove, qtyControls);

        item.append(image, content, controls);
        cartContainer.appendChild(item);
    });
}

/* =========================================================
   REFRESH CART UI
========================================================= */

function refreshCartUI() {
    saveCart();
    renderCheckoutCart();
    renderSlideCart();
    updateCartBadge();
}

/* =========================================================
   REMOVE PRODUCT
========================================================= */

function removeProduct(itemKey) {
    if (!itemKey) return;

    listCart = listCart.filter(
        product => getCartItemKey(product) !== String(itemKey)
    );

    refreshCartUI();
}

/* =========================================================
   INCREASE QUANTITY
========================================================= */

function increaseQuantity(itemKey) {
    const product = listCart.find(
        item => getCartItemKey(item) === String(itemKey)
    );

    if (!product) return;

    if (product.quantity >= CHECKOUT_CONFIG.maxQuantity) {
        alert("The maximum quantity allowed here is 999.");
        return;
    }

    product.quantity += 1;

    refreshCartUI();
}

/* =========================================================
   DECREASE QUANTITY
========================================================= */

function decreaseQuantity(itemKey) {
    const product = listCart.find(
        item => getCartItemKey(item) === String(itemKey)
    );

    if (!product) return;

    if (product.quantity <= 1) {
        removeProduct(itemKey);
        return;
    }

    product.quantity -= 1;

    refreshCartUI();
}

/* =========================================================
   SET QUANTITY
========================================================= */

function setProductQuantity(itemKey, quantity) {
    const product = listCart.find(
        item => getCartItemKey(item) === String(itemKey)
    );

    if (!product) return;

    const newQuantity = Number(quantity);

    if (
        !Number.isSafeInteger(newQuantity) ||
        newQuantity < 1 ||
        newQuantity > CHECKOUT_CONFIG.maxQuantity
    ) {
        alert("Please enter a quantity between 1 and 999.");

        renderSlideCart();
        renderCheckoutCart();

        return;
    }

    product.quantity = newQuantity;

    refreshCartUI();
}

/* =========================================================
   SET UP SLIDE-OUT CART
========================================================= */

function setupCart() {
    const iconCart = document.querySelector(".iconCart");
    const cart = document.querySelector(".cart");
    const closeButton = document.querySelector(".cart .close");

    const checkoutContainer =
        document.querySelector(".checkout-container");

    if (!iconCart || !cart) return;

    function openCart() {
        renderSlideCart();

        cart.style.transition = "right 0.3s ease";
        cart.style.right = "0";

        if (checkoutContainer) {
            checkoutContainer.style.transform =
                "translateX(-400px)";
        }
    }

    function closeCart() {
        cart.style.transition = "right 0.3s ease";
        cart.style.right = "-100%";

        if (checkoutContainer) {
            checkoutContainer.style.transform = "translateX(0)";
        }
    }

    iconCart.addEventListener("click", event => {
        event.preventDefault();

        const isOpen =
            cart.style.right === "0px" ||
            cart.style.right === "0";

        if (isOpen) {
            closeCart();
        } else {
            openCart();
        }
    });

    if (closeButton) {
        closeButton.addEventListener("click", closeCart);
    }

    window.openCheckoutCart = openCart;
    window.closeCheckoutCart = closeCart;
}

/* =========================================================
   CART EVENT HANDLERS
========================================================= */

function setupCartControls() {
    document.addEventListener("click", event => {
        const target = event.target;

        if (!(target instanceof Element)) return;

        const removeCheckout =
            target.closest(".checkout-delete");

        if (removeCheckout) {
            removeProduct(removeCheckout.dataset.key);
            return;
        }

        const removeSlide =
            target.closest(".slide-cart-delete");

        if (removeSlide) {
            removeProduct(removeSlide.dataset.key);
            return;
        }

        const plus = target.closest(".slide-cart-plus");

        if (plus) {
            increaseQuantity(plus.dataset.key);
            return;
        }

        const minus = target.closest(".slide-cart-minus");

        if (minus) {
            decreaseQuantity(minus.dataset.key);
        }
    });

    document.addEventListener("change", event => {
        const target = event.target;

        if (!(target instanceof Element)) return;

        const input = target.closest(".slide-cart-qty");

        if (input) {
            setProductQuantity(
                input.dataset.key,
                input.value
            );

            return;
        }

        const checkoutInput =
            target.closest(".quantity-input");

        if (checkoutInput) {
            setProductQuantity(
                checkoutInput.dataset.key,
                checkoutInput.value
            );
        }
    });
}

/* =========================================================
   PAYMENT OPTION STYLING
========================================================= */

function setupPaymentOptions() {
    const options = document.querySelectorAll(".payment-option");
    const form = document.getElementById("checkoutForm");

    options.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');

        if (!radio) return;

        radio.addEventListener("change", () => {
            options.forEach(item => item.classList.remove("selected"));

            if (radio.checked) {
                option.classList.add("selected");
            }

            // Automatically submit when the customer chooses a method.
            if (radio.checked && form) {
                form.requestSubmit();
            }
        });

        if (radio.checked) {
            option.classList.add("selected");
        }
    });
}


/* =========================================================
   SAVE ORDER SNAPSHOT
========================================================= */

function saveOrderSnapshot(userDetails, paymentMethod) {
    const totals = getCartTotals();

    const order = {
        customer: userDetails,

        products: listCart.map(product => ({
            ...product
        })),

        totalQuantity: totals.totalQuantity,
        totalPrice: totals.totalPrice,
        paymentMethod,
        paymentStatus: "pending",
        createdAt: new Date().toISOString()
    };

    try {
        sessionStorage.setItem(
            "userDetails",
            JSON.stringify(userDetails)
        );

        sessionStorage.setItem(
            "checkoutCart",
            JSON.stringify(listCart)
        );

        sessionStorage.setItem(
            "currentOrder",
            JSON.stringify(order)
        );
    } catch (error) {
        console.error("Unable to save order snapshot:", error);
    }

    return order;
}

/* =========================================================
   CHECKOUT FORM
========================================================= */

function setupCheckoutForm() {
    const form = document.getElementById("checkoutForm");

    if (!form) return;
        // Restore checkout when the browser returns to this page.
    const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    const defaultButtonHTML = submitButton?.innerHTML;

    window.addEventListener("pageshow", () => {
        checkoutSubmitting = false;

        if (submitButton) {
            submitButton.disabled = false;

            if (defaultButtonHTML !== undefined) {
                submitButton.innerHTML = defaultButtonHTML;
            }
        }
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (checkoutSubmitting) return;

        if (!listCart.length) {
            alert("Your cart is empty. Please add a product first.");
            return;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);

        const userDetails =
            Object.fromEntries(formData.entries());

        const selectedPayment = form.querySelector(
            'input[name="paymentMethod"]:checked'
        );

        if (!selectedPayment) {
            alert("Please select a payment method.");
            return;
        }

        const paymentMethod = selectedPayment.value;

        /* Validate cart structure */

        const invalidCart = listCart.some(product =>
            !product.id ||
            !Number.isSafeInteger(Number(product.quantity)) ||
            Number(product.quantity) < 1 ||
            Number(product.quantity) > CHECKOUT_CONFIG.maxQuantity ||
            !Number.isFinite(Number(product.price)) ||
            Number(product.price) <= 0
        );

        if (invalidCart) {
            alert(
                "Your cart contains an invalid item. Please refresh and try again."
            );

            return;
        }

        /* Validate online payment details */

        if (paymentMethod === "online") {
            if (
                !userDetails.name?.trim() ||
                !userDetails.email?.trim() ||
                !userDetails.phone?.trim()
            ) {
                alert(
                    "Enter your full name, phone number and email address for online payment."
                );

                return;
            }
        }

        const totals = getCartTotals();

        userDetails.totalQuantity = totals.totalQuantity;
        userDetails.totalPrice = totals.totalPrice.toFixed(2);

        saveOrderSnapshot(userDetails, paymentMethod);

        const submitButton = form.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        const originalButtonHTML =
            submitButton?.innerHTML;

        checkoutSubmitting = true;

        if (submitButton) {
            submitButton.disabled = true;

            submitButton.textContent =
                paymentMethod === "online"
                    ? "Connecting to OPay..."
                    : "Preparing order...";
        }

        try {
            /* =============================================
               ONLINE PAYMENT — OPay
            ============================================= */

            if (paymentMethod === "online") {
                const response = await fetch(
                    CHECKOUT_CONFIG.opayEndpoint,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            customerName: userDetails.name.trim(),
                            customerEmail: userDetails.email.trim(),
                            customerPhone: userDetails.phone.trim(),

                            items: listCart.map(product => ({
                                id: product.id,

                                // The backend must validate this SKU.
                                sku: product.variantSku || null,

                                quantity: Number(product.quantity)
                            }))
                        })
                    }
                );

                let result;

                try {
                    result = await response.json();
                } catch {
                    throw new Error(
                        `Payment server returned an invalid response (HTTP ${response.status}).`
                    );
                }

                if (
                    !response.ok ||
                    !result ||
                    result.success !== true ||
                    typeof result.checkoutUrl !== "string" ||
                    !result.checkoutUrl
                ) {
                    throw new Error(
                        result?.message ||
                        `Unable to start OPay payment (HTTP ${response.status}).`
                    );
                }

                let checkoutURL;

                try {
                    checkoutURL = new URL(result.checkoutUrl);
                } catch {
                    throw new Error(
                        "The payment server returned an invalid checkout link."
                    );
                }

                if (checkoutURL.protocol !== "https:") {
                    throw new Error(
                        "The payment server returned an insecure checkout link."
                    );
                }

                if (result.paymentReference) {
                    sessionStorage.setItem(
                        "opayPaymentReference",
                        String(result.paymentReference)
                    );
                }

                window.location.assign(checkoutURL.href);

                return;
            }

            /* =============================================
               BANK TRANSFER
            ============================================= */

            if (paymentMethod === "transfer") {
                window.location.assign(
                    CHECKOUT_CONFIG.transferPage
                );

                return;
            }

            /* =============================================
               PAY ON DELIVERY
            ============================================= */

            if (paymentMethod === "delivery") {
                window.location.assign(
                    CHECKOUT_CONFIG.confirmationPage
                );

                return;
            }

            throw new Error(
                "Please select a supported payment method."
            );

        } catch (error) {
            console.error("Checkout error:", error);

            alert(
                error.message ||
                "Checkout could not be started. Please try again."
            );

            checkoutSubmitting = false;

            if (submitButton) {
                submitButton.disabled = false;

                if (originalButtonHTML !== undefined) {
                    submitButton.innerHTML = originalButtonHTML;
                }
            }
        }
    });
}

/* =========================================================
   INITIALIZE CHECKOUT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    console.log("WITTYFARE CHECKOUT INITIALIZING");

    loadCart();

    renderCheckoutCart();
    renderSlideCart();

    setupCart();
    setupCartControls();
    setupPaymentOptions();
    setupCheckoutForm();

    updateCartBadge();

    console.log("WittyFare checkout initialized.");
});
