/* ==========================================
   🛒 CHECKOUT PAGE SCRIPT (price between name & quantity)
========================================== */

let listCart = [];

// Load cart from localStorage
function loadCart() {
    const stored = localStorage.getItem('listCart');
    listCart = stored ? JSON.parse(stored) : [];
}

// Render cart items
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
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        item.style.padding = '10px 0';
        item.style.borderBottom = '1px solid #ddd';
        item.style.gap = '10px';

        const subtotal = (product.price * product.quantity).toLocaleString();

        item.innerHTML = `
            <img src="${product.image}" width="60">
            <div class="name" style="flex:2; font-weight:bold;">${product.name}</div>
            <div class="price" style="flex:1; text-align:right;">₦${product.price.toLocaleString()}</div>
            <div class="quantity" style="flex:1; text-align:center;">x${product.quantity}</div>
            <div class="returnPrice" style="flex:1; text-align:right;">₦${subtotal}</div>
            <button class="delete-btn" data-id="${product.id}" 
                style="background:red; color:white; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;">Delete</button>
        `;

        cartContainer.appendChild(item);

        totalQuantity += Number(product.quantity);
        totalPrice += Number(product.price) * Number(product.quantity);
    });

    if (totalQuantityElement) totalQuantityElement.innerText = totalQuantity;
    if (totalPriceElement) totalPriceElement.innerText = "₦" + totalPrice.toLocaleString();

    document.getElementById('totalQuantity').value = totalQuantity;
    document.getElementById('totalPrice').value = totalPrice.toFixed(2);
}

// Delete item from cart
function setupDeleteButtons() {
    document.addEventListener('click', function(e){
        if(e.target.classList.contains('delete-btn')){
            const id = e.target.dataset.id;
            listCart = listCart.filter(item => item.id !== id);
            localStorage.setItem('listCart', JSON.stringify(listCart));
            renderCheckoutCart();
        }
    });
}

// Handle checkout form submission
function setupCheckoutForm() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        if (listCart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const userDetails = Object.fromEntries(formData.entries());

        sessionStorage.setItem('userDetails', JSON.stringify(userDetails));
        sessionStorage.setItem('checkoutCart', JSON.stringify(listCart));

        window.location.href = '/confirmation.html';
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderCheckoutCart();
    setupDeleteButtons();
    setupCheckoutForm();
});