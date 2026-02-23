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
        window.location.href = "index.html";
    };

    /* ===============================
       🛒 CART TOGGLE
    ================================*/
    if (iconCart) {
        iconCart.addEventListener('click', function () {
            if (isCartOpen) {
                cart.style.right = '-100%';
                container.style.transform = 'translateX(0)';
            } else {
                cart.style.right = '0';
                container.style.transform = 'translateX(-400px)';
            }
            isCartOpen = !isCartOpen;
        });
    }

    if (close) {
        close.addEventListener('click', function () {
            cart.style.right = '-100%';
            container.style.transform = 'translateX(0)';
            isCartOpen = false;
        });
    }

    /* ===============================
       🧾 LOAD PRODUCTS
    ================================*/
    fetch(window.location.pathname.includes('category') ? '../../product.json' : 'product.json')
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
                <div class="quantity">
                    <button onclick="changeQuantity(${product.id}, '-')">-</button>
                    <span>${product.quantity}</span>
                    <button onclick="changeQuantity(${product.id}, '+')">+</button>
                </div>
            `;
            listCartHTML.appendChild(item);
        });
    }

    /* ===============================
       🎨 DISPLAY PRODUCTS
    ================================*/
    function addDataToHTML(productList) {
        const listProductHTML = document.querySelector('.listProduct');
        if (!listProductHTML) return;

        listProductHTML.innerHTML = '';

        productList.forEach(product => {
            const newProduct = document.createElement('div');
            newProduct.classList.add('item');
            newProduct.innerHTML = `
                <img src="${product.image}" alt="">
                <h2>${product.name}</h2>
                <div class="price">₦${product.price}</div>
                <button onclick="addCart(${product.id})">Add to cart</button>
            `;
            listProductHTML.appendChild(newProduct);
        });
    }

    /* ===============================
       🔍 SEARCH
    ================================*/
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-button');

    function normalizeText(text) {
        return text.toLowerCase().replace(/\s+/g, '');
    }

    function handleSearch() {
        if (!products) return;

        const raw = searchInput.value.trim().toLowerCase();
        if (!raw) {
            addDataToHTML(products);
            return;
        }

        const filtered = products.filter(product =>
            normalizeText(product.name).includes(normalizeText(raw)) ||
            normalizeText(product.category || '').includes(normalizeText(raw))
        );

        addDataToHTML(filtered);
    }

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') handleSearch();
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