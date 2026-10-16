
/* =========================================================
   WITTYFARE AGROVET & FARMS
   COMPLETE CHECKOUT.JS
   Cart | Checkout | OPay | Confirmation
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
    currency: "₦"
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
        return {
            id: "",
            name: "Product",
            image: "",
            price: 0,
            quantity: 1
        };
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

        quantity: Math.max(
            1,
            Math.floor(Number(rawQuantity) || 1)
        )
    };
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

            if (!stored) continue;

            const parsed = JSON.parse(stored);

            if (Array.isArray(parsed) && parsed.length > 0) {
                foundCart = parsed;

                console.log("Checkout cart loaded from:", key);
                break;
            }
        } catch (error) {
            console.warn("Could not read cart:", key, error);
        }
    }

    listCart = Array.isArray(foundCart)
        ? foundCart.map(normalizeProduct)
        : [];

    // Ignore malformed entries. The backend must still validate
    // product IDs, quantities and prices before taking payment.
    listCart = listCart.filter(product =>
        product.id &&
        Number.isFinite(product.price) &&
        product.price >= 0 &&
        Number.isSafeInteger(product.quantity) &&
        product.quantity >= 1
    );

    saveCart();

    console.log("Checkout products:", listCart);
}

/* =========================================================
   SAVE CART
========================================================= */

function saveCart() {
    try {
        localStorage.setItem("listCart", JSON.stringify(listCart));
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
            `${totalQuantity} ${totalQuantity === 1 ? "Item" : "Items"}`;
    }
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
        console.error("Checkout product container not found.");
        return;
    }

    cartContainer.replaceChildren();

    const totals = getCartTotals();

    quantityElements.forEach(element => {
        element.textContent = totals.totalQuantity.toLocaleString();
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

        const item = document.createElement("div");
        item.className = "checkout-product-item";

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

        const info = document.createElement("div");
        info.className = "checkout-product-info";

        const name = document.createElement("h3");
        name.textContent = product.name;

        const meta = document.createElement("div");
        meta.className = "checkout-product-meta";
        meta.textContent = `${formatNaira(price)} × ${quantity}`;

        info.append(name, meta);

        const right = document.createElement("div");
        right.className = "checkout-product-right";

        const subtotalElement = document.createElement("strong");
        subtotalElement.textContent = formatNaira(subtotal);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "delete-btn checkout-delete";
        removeButton.dataset.id = product.id;
        removeButton.title = "Remove product";
        removeButton.setAttribute(
            "aria-label",
            `Remove ${product.name}`
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

        const image = document.createElement("img");
        image.alt = product.name;

        if (product.image) {
            image.src = product.image;
            image.addEventListener("error", () => {
                image.style.display = "none";
            }, { once: true });
        } else {
            image.style.display = "none";
        }

        const content = document.createElement("div");
        content.className = "content";

        const name = document.createElement("div");
        name.className = "name";
        name.textContent = product.name;

        const price = document.createElement("div");
        price.className = "price";
        price.textContent = formatNaira(
            product.price * product.quantity
        );

        content.append(name, price);

        const controls = document.createElement("div");
        controls.className = "cartControls";

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "deleteBtn slide-cart-delete";
        remove.dataset.id = product.id;
        remove.textContent = "🗑";
        remove.setAttribute("aria-label", `Remove ${product.name}`);

        const qtyControls = document.createElement("div");
        qtyControls.className = "verticalQty";

        const plus = document.createElement("button");
        plus.type = "button";
        plus.className = "slide-cart-plus";
        plus.dataset.id = product.id;
        plus.textContent = "+";
        plus.setAttribute("aria-label", "Increase quantity");

        const input = document.createElement("input");
        input.type = "number";
        input.min = "1";
        input.step = "1";
        input.value = String(product.quantity);
        input.className = "slide-cart-qty";
        input.dataset.id = product.id;
        input.setAttribute("aria-label", "Quantity");

        const minus = document.createElement("button");
        minus.type = "button";
        minus.className = "slide-cart-minus";
        minus.dataset.id = product.id;
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
   REMOVE / CHANGE QUANTITY
========================================================= */

function removeProduct(productId) {
    const id = String(productId);

    listCart = listCart.filter(
        product => String(product.id) !== id
    );

    refreshCartUI();
}

function increaseQuantity(productId) {
    const product = listCart.find(
        item => String(item.id) === String(productId)
    );

    if (!product) return;

    if (product.quantity >= 999) {
        alert("The maximum quantity allowed here is 999.");
        return;
    }

    product.quantity += 1;
    refreshCartUI();
}

function decreaseQuantity(productId) {
    const product = listCart.find(
        item => String(item.id) === String(productId)
    );

    if (!product) return;

    if (product.quantity <= 1) {
        removeProduct(productId);
        return;
    }

    product.quantity -= 1;
    refreshCartUI();
}

function setProductQuantity(productId, quantity) {
    const product = listCart.find(
        item => String(item.id) === String(productId)
    );

    if (!product) return;

    const newQuantity = Number(quantity);

    if (!Number.isSafeInteger(newQuantity) ||
        newQuantity < 1 ||
        newQuantity > 999) {
        alert("Please enter a quantity between 1 and 999.");
        renderSlideCart();
        return;
    }

    product.quantity = newQuantity;
    refreshCartUI();
}

/* =========================================================
   SET UP SLIDE CART
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
            checkoutContainer.style.transform = "translateX(-400px)";
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

        const isOpen = cart.style.right === "0px" ||
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

        const removeCheckout = target.closest(".checkout-delete");
        if (removeCheckout) {
            removeProduct(removeCheckout.dataset.id);
            return;
        }

        const removeSlide = target.closest(".slide-cart-delete");
        if (removeSlide) {
            removeProduct(removeSlide.dataset.id);
            return;
        }

        const plus = target.closest(".slide-cart-plus");
        if (plus) {
            increaseQuantity(plus.dataset.id);
            return;
        }

        const minus = target.closest(".slide-cart-minus");
        if (minus) {
            decreaseQuantity(minus.dataset.id);
        }
    });

    document.addEventListener("change", event => {
        const input = event.target.closest(".slide-cart-qty");

        if (input) {
            setProductQuantity(input.dataset.id, input.value);
            return;
        }

        const checkoutInput = event.target.closest(".quantity-input");

        if (checkoutInput) {
            setProductQuantity(
                checkoutInput.dataset.id,
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

    options.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');

        if (!radio) return;

        radio.addEventListener("change", () => {
            options.forEach(item => item.classList.remove("selected"));

            if (radio.checked) {
                option.classList.add("selected");
            }
        });

        if (radio.checked) {
            option.classList.add("selected");
        }
    });
}

/* =========================================================
   SAVE ORDER SNAPSHOT FOR THE EXISTING CONFIRMATION PAGE
========================================================= */

function saveOrderSnapshot(userDetails, paymentMethod) {
    const totals = getCartTotals();

    const order = {
        customer: userDetails,
        products: listCart.map(product => ({ ...product })),
        totalQuantity: totals.totalQuantity,
        totalPrice: totals.totalPrice,
        paymentMethod,
        paymentStatus: "pending",
        createdAt: new Date().toISOString()
    };

    sessionStorage.setItem("userDetails", JSON.stringify(userDetails));
    sessionStorage.setItem("checkoutCart", JSON.stringify(listCart));
    sessionStorage.setItem("currentOrder", JSON.stringify(order));

    return order;
}

/* =========================================================
   CHECKOUT FORM
========================================================= */

function setupCheckoutForm() {
    const form = document.getElementById("checkoutForm");

    if (!form) return;

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
        const userDetails = Object.fromEntries(formData.entries());

        const selectedPayment = form.querySelector(
            'input[name="paymentMethod"]:checked'
        );

        if (!selectedPayment) {
            alert("Please select a payment method.");
            return;
        }

        const paymentMethod = selectedPayment.value;

        // Validate cart structure before sending it to the server.
        const invalidCart = listCart.some(product =>
            !product.id ||
            !Number.isSafeInteger(Number(product.quantity)) ||
            Number(product.quantity) < 1 ||
            Number(product.quantity) > 999
        );

        if (invalidCart) {
            alert("Your cart contains an invalid item. Please refresh and try again.");
            return;
        }

        // Online checkout requires an email for the payment request.
        if (paymentMethod === "online") {
            if (!userDetails.name?.trim() ||
                !userDetails.email?.trim() ||
                !userDetails.phone?.trim()) {
                alert("Enter your full name, phone number and email address for online payment.");
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

        const originalButtonHTML = submitButton?.innerHTML;

        checkoutSubmitting = true;

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent =
                paymentMethod === "online"
                    ? "Connecting to OPay..."
                    : "Preparing order...";
        }

        try {
            if (paymentMethod === "online") {
                /*
                 * IMPORTANT:
                 * The server must load product.json and calculate prices
                 * independently. Never trust browser-submitted prices.
                 */
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

                if (!response.ok ||
                    !result ||
                    result.success !== true ||
                    typeof result.checkoutUrl !== "string" ||
                    !result.checkoutUrl) {
                    throw new Error(
                        result?.message ||
                        `Unable to start OPay payment (HTTP ${response.status}).`
                    );
                }

                // Accept only HTTPS checkout URLs from the payment provider.
                let checkoutURL;

                try {
                    checkoutURL = new URL(result.checkoutUrl);
                } catch {
                    throw new Error("The payment server returned an invalid checkout link.");
                }

                if (checkoutURL.protocol !== "https:") {
                    throw new Error("The payment server returned an insecure checkout link.");
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

            /*
             * BANK TRANSFER AND PAY ON DELIVERY
             *
             * This retains the existing confirmation-page flow.
             * Make sure confirmation.html handles each method separately.
             * This redirect does not permanently save the order to a server.
             */
            if (paymentMethod === "transfer" ||
                paymentMethod === "delivery") {
                window.location.assign(CHECKOUT_CONFIG.confirmationPage);
                return;
            }

            throw new Error("Please select a supported payment method.");

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
