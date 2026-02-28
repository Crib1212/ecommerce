// Close button functionality
function closeToast() {
    const toast = document.querySelector('.notification-toast');
    if (toast) {
        toast.style.display = 'none';
    }
}
document.addEventListener('DOMContentLoaded', () => {

    const iconCart = document.querySelector('.iconCart');
    const cart = document.querySelector('.cart');
    const container = document.querySelector('.container');
    const close = document.querySelector('.close');

    let isCartOpen = false;
    let products = [];
    let listCart = [];

    /* ===============================
       🧭 MENU
    ================================*/
    window.toggleMenu = function () {
        const menu = document.getElementById('menu');
        if (!menu) return;
        menu.classList.toggle('open');
        menu.style.display = menu.classList.contains('open') ? 'block' : 'none';
    };

    window.goHome = function () {
        window.location.href = "../../index.html";
    };

    /* ===============================
       🛒 CART TOGGLE
    ================================*/
    if (iconCart) {
        iconCart.addEventListener('click', function () {
            if (isCartOpen) {
                cart.style.transition = 'right 0.5s ease';
                cart.style.right = '-100%';
                container.style.transition = 'transform 0.5s ease';
                container.style.transform = 'translateX(0)';
            } else {
                cart.style.transition = 'right 0.5s ease';
                cart.style.right = '0';
                container.style.transition = 'transform 0.5s ease';
                container.style.transform = 'translateX(-400px)';
            }
            isCartOpen = !isCartOpen;
        });
    }

    if (close) {
        close.addEventListener('click', function () {
            cart.style.transition = 'right 0.5s ease';
            cart.style.right = '-100%';
            container.style.transition = 'transform 0.5s ease';
            container.style.transform = 'translateX(0)';
            isCartOpen = false;
        });
    }

    /* ===============================
       🧾 LOAD PRODUCTS
    ================================*/
    fetch(window.location.pathname.includes('category') ? 'product.json' : 'product.json')
        .then(res => res.json())
        .then(data => {
            products = data;
            addDataToHTML(products);
        })
        .catch(err => console.error("Product load error:", err));

    /* ===============================
       🛍 CART SYSTEM
    ================================*/
    function loadCart() {
        const stored = localStorage.getItem('listCart');
        listCart = stored ? JSON.parse(stored) : [];
    }

    function saveCart() {
        localStorage.setItem('listCart', JSON.stringify(listCart));
    }

    function updateCartCounter() {
        const counters = document.querySelectorAll('.totalQuantity');
        let total = 0;
        listCart.forEach(item => total += item.quantity);
        counters.forEach(el => el.innerText = total);
    }

    function calculateCheckoutTotal() {
        const totalElement = document.querySelector('.checkoutTotal');
        if (!totalElement) return;

        let total = 0;
        listCart.forEach(item => {
            total += item.price * item.quantity;
        });

        totalElement.innerText = "₦" + total.toLocaleString();
    }

    window.addCart = function (idProduct) {
        const product = products.find(p => p.id == idProduct);
        if (!product) return;

        const existing = listCart.find(p => p.id == idProduct);

        if (existing) {
            existing.quantity++;
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
    };

    window.changeQuantity = function (idProduct, type) {
        const item = listCart.find(p => p.id == idProduct);
        if (!item) return;

        if (type === '+') item.quantity++;
        if (type === '-') item.quantity--;

        if (item.quantity <= 0) {
            listCart = listCart.filter(p => p.id != idProduct);
        }

        saveCart();
        updateCartCounter();
        renderCartItems();
        calculateCheckoutTotal();
    };

        /* ===============================
       RENDER CART ITEMS
    ================================*/

function renderCartItems() {
    const listCartHTML = document.querySelector('.listCart');
    if (!listCartHTML) return;

    listCartHTML.innerHTML = '';

    listCart.forEach(product => {
        const item = document.createElement('div');
        item.classList.add('item');

        item.innerHTML = `
            <img src="${product.image}">

            <div class="content">
                <div class="name">${product.name}</div>
                <div class="price">₦${product.price}</div>
            </div>

            <div class="cartControls">
                <!-- DELETE ON LEFT -->
                <button class="deleteBtn" onclick="removeItem(${product.id})">🗑</button>

                <!-- VERTICAL QUANTITY ON RIGHT -->
                <div class="verticalQty">
                    <button onclick="changeQuantity(${product.id}, '+')">+</button>

                    <input 
                        type="number" 
                        min="1" 
                        value="${product.quantity}" 
                        id="qty-${product.id}"
                    >

                    <button onclick="changeQuantity(${product.id}, '-')">-</button>
                </div>
            </div>
        `;

        listCartHTML.appendChild(item);

        // Attach Enter key listener to the input
        const qtyInput = document.getElementById(`qty-${product.id}`);
        qtyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // prevent form submission if inside a form
                updateQuantity(product.id, qtyInput.value);
            }
        });

        // Also trigger update when input changes normally
        qtyInput.addEventListener('change', () => {
            updateQuantity(product.id, qtyInput.value);
        });
    });
}
// Update quantity manually
window.updateQuantity = function(idProduct, value) {
    const item = listCart.find(p => p.id == idProduct);
    if (!item) return;

    let qty = parseInt(value);
    if (isNaN(qty) || qty < 1) qty = 1;
    item.quantity = qty;

    saveCart();
    updateCartCounter();
    renderCartItems();
    calculateCheckoutTotal();
};

// Delete item
window.removeItem = function(idProduct) {
    listCart = listCart.filter(p => p.id != idProduct);
    saveCart();
    updateCartCounter();
    renderCartItems();
    calculateCheckoutTotal();
};

    /* ===============================
       🎨 DISPLAY PRODUCTS WITH HIGHLIGHT
    ================================*/
    function normalizeText(text) {
        return text.toLowerCase().replace(/['’`"“”.,\-_/\\()]/g, '').replace(/\s+/g, '');
    }

    function addDataToHTML(productList = products, highlight = '') {
        const listProductHTML = document.querySelector('.listProduct');
        if (!listProductHTML) return;

        listProductHTML.innerHTML = '';

        if (!productList || productList.length === 0) {
            listProductHTML.innerHTML = `
                <p>No results found for "<strong>${highlight}</strong>".</p>
                <button id="showAllBtn">Show All Products</button>
            `;
            const btn = document.getElementById('showAllBtn');
            if (btn) btn.addEventListener('click', () => {
                addDataToHTML(products);
                if (searchInput) searchInput.value = '';
            });
            return;
        }

        productList.forEach(product => {
            let { name, category = '', description = '', image, price, id } = product;

            const highlightText = (text, keyword) => {
                if (!keyword) return text;
                const regex = new RegExp(`(${keyword})`, 'gi');
                return text.replace(regex, '<span style="background-color:#fff176; font-weight:bold;">$1</span>');
            };

            name = highlightText(name, highlight);
            category = highlightText(category, highlight);
            description = highlightText(description, highlight);

            const newProduct = document.createElement('div');
            newProduct.classList.add('item');
            newProduct.innerHTML = `
                <img src="${image}" alt="">
                <h2>${name}</h2>
                ${category ? `<p class="category">Category: ${category}</p>` : ''}
                ${description ? `<p class="desc">${description}</p>` : ''}
                <div class="price">₦${price.toLocaleString()}</div>
                <button onclick="addCart(${id})">Add to cart</button>
            `;
            listProductHTML.appendChild(newProduct);
        });
    }

    /* ===============================
       🔍 SEARCH ENGINE
    ================================*/
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-button');

    function handleSearch(e) {
        if (e) e.preventDefault();
        if (!products || !products.length) return;

        const rawSearch = searchInput.value.trim().toLowerCase();
        if (!rawSearch) {
            addDataToHTML(products);
            return;
        }

        const normalizedSearch = normalizeText(rawSearch);
        const filtered = products.filter(product => {
            const name = normalizeText(product.name || '');
            const desc = normalizeText(product.description || '');
            const cat = normalizeText(product.category || '');
            return name.includes(normalizedSearch) || desc.includes(normalizedSearch) || cat.includes(normalizedSearch);
        });

        addDataToHTML(filtered, rawSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') handleSearch(e);
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    /* ===============================
       🚀 INITIAL LOAD
    ================================*/
    loadCart();
    updateCartCounter();
    renderCartItems();
    calculateCheckoutTotal();

});