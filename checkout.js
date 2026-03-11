/* ==========================================
   🛒 CHECKOUT PAGE SCRIPT (delete after subtotal + x in quantity)
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

    if(listCart.length === 0){
        cartContainer.innerHTML = '<p>Your cart is empty</p>';
        if(totalQuantityElement) totalQuantityElement.innerText = 0;
        if(totalPriceElement) totalPriceElement.innerText = '₦0';
        document.getElementById('totalQuantity').value = 0;
        document.getElementById('totalPrice').value = 0;
        return;
    }

    listCart.forEach(product => {
        const subtotal = product.price * product.quantity;
        totalQuantity += Number(product.quantity);
        totalPrice += subtotal;

        const item = document.createElement('div');
        item.classList.add('cart-item');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        item.style.padding = '10px 0';
        item.style.borderBottom = '1px solid #ddd';

        item.innerHTML = `
            <!-- Image + Name -->
            <div style="display:flex; align-items:center; gap:10px; flex:2;">
                <img src="${product.image}" alt="${product.name}" style="width:60px; height:60px; object-fit:cover; border-radius:5px;">
                <div class="name" style="font-weight:bold;">${product.name}</div>
            </div>

            <!-- Price -->
            <div class="price" style="width:80px; text-align:right; flex:1;">₦${product.price.toLocaleString()}</div>

            <!-- Quantity with x -->
            <div class="quantity" style="width:60px; text-align:center; flex:1;">
                x <input type="number" class="quantity-input" data-id="${product.id}" value="${product.quantity}" min="1" style="width:50px; text-align:center;">
            </div>

            <!-- Subtotal -->
            <div class="returnPrice" style="width:100px; text-align:right; flex:1;">₦${subtotal.toLocaleString()}</div>

            <!-- Delete button after subtotal -->
            <div style="flex:0.5; text-align:right;">
                <button class="delete-btn" data-id="${product.id}" 
                    style="background:red; color:white; border:none; border-radius:4px; cursor:pointer; padding:4px 8px;">Delete</button>
            </div>
        `;

        cartContainer.appendChild(item);
    });

    // Update totals
    if (totalQuantityElement) totalQuantityElement.innerText = totalQuantity;
    if (totalPriceElement) totalPriceElement.innerText = "₦" + totalPrice.toLocaleString();

    // Update hidden inputs for sessionStorage
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

// Quantity change
function setupQuantityInputs() {
    document.addEventListener('change', function(e){
        if(e.target.classList.contains('quantity-input')){
            const id = e.target.dataset.id;
            const item = listCart.find(i => i.id === id);
            const value = parseInt(e.target.value);
            if(item && value > 0){
                item.quantity = value;
            } else {
                // Remove item if quantity <= 0
                listCart = listCart.filter(i => i.id !== id);
            }
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

        // Save user details and cart snapshot to sessionStorage
        sessionStorage.setItem('userDetails', JSON.stringify(userDetails));
        sessionStorage.setItem('checkoutCart', JSON.stringify(listCart));

        // Redirect to confirmation page
        window.location.href = '/confirmation.html';
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderCheckoutCart();
    setupCheckoutForm();
    setupDeleteButtons();
    setupQuantityInputs();
});