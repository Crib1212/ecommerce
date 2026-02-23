/* ==========================================
   🛒 CHECKOUT PAGE SCRIPT
   Works with localStorage cart system
========================================== */

let listCart = [];

/* ==========================================
   📦 LOAD CART FROM LOCAL STORAGE
========================================== */
function loadCart() {
    const stored = localStorage.getItem('listCart');
    listCart = stored ? JSON.parse(stored) : [];
}

/* ==========================================
   🧾 RENDER CART ITEMS ON CHECKOUT PAGE
========================================== */
function renderCheckoutCart() {
    const cartContainer = document.querySelector('.returnCart .list');
    const totalQuantityElement = document.querySelector('.totalQuantity');
    const totalPriceElement = document.querySelector('.totalPrice');

    if (!cartContainer) return;

    cartContainer.innerHTML = '';

    let totalQuantity = 0;
    let totalPrice = 0;

    listCart.forEach(product => {

        const item = document.createElement('div');
        item.classList.add('item');

        item.innerHTML = `
            <img src="${product.image}" width="60">
            <div class="info">
                <div class="name">${product.name}</div>
                <div class="price">₦${product.price}</div>
            </div>
            <div class="quantity">x${product.quantity}</div>
            <div class="returnPrice">
                ₦${(product.price * product.quantity).toLocaleString()}
            </div>
        `;

        cartContainer.appendChild(item);

        totalQuantity += Number(product.quantity);
        totalPrice += Number(product.price) * Number(product.quantity);
    });

    if (totalQuantityElement) {
        totalQuantityElement.innerText = totalQuantity;
    }

    if (totalPriceElement) {
        totalPriceElement.innerText = "₦" + totalPrice.toLocaleString();
    }
}

/* ==========================================
   📝 HANDLE CHECKOUT FORM SUBMISSION
========================================== */
function setupCheckoutForm() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Prevent submission if cart is empty
        if (listCart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        // HTML5 validation check
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Collect form data safely
        const formData = new FormData(form);
        const userDetails = Object.fromEntries(formData.entries());

        // Save user details
        sessionStorage.setItem('userDetails', JSON.stringify(userDetails));

        // Save cart snapshot for confirmation page
        sessionStorage.setItem('checkoutCart', JSON.stringify(listCart));

        // OPTIONAL: clear cart after successful checkout
        // localStorage.removeItem('listCart');

        // Redirect to confirmation page
        window.location.href = '/confirmation.html';
    });
}

/* ==========================================
   🚀 INITIALIZE CHECKOUT PAGE
========================================== */
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderCheckoutCart();
    setupCheckoutForm();
});