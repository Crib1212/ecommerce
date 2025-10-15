document.addEventListener('DOMContentLoaded', () => {
    const iconCart = document.querySelector('.iconCart');
    const cart = document.querySelector('.cart');
    const container = document.querySelector('.container');
    const close = document.querySelector('.close');
    const category = document.querySelector('.category');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-button');
    let isCartOpen = false;
    let products = [];
    let listCart = [];

    /* ===============================
       🧭 MENU TOGGLE (animated)
    ================================*/
    window.toggleMenu = function () {
        const menu = document.getElementById('menu');
        if (!menu) return;
        menu.classList.toggle('open');
        if (menu.classList.contains('open')) {
            menu.style.display = 'block';
            setTimeout(() => {
                menu.style.opacity = '1';
                menu.style.transform = 'translateY(0)';
            }, 10);
        } else {
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-15px)';
            setTimeout(() => {
                menu.style.display = 'none';
            }, 300);
        }
    };

    /* ===============================
       🛒 CART TOGGLE (animated)
    ================================*/
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

    close.addEventListener('click', function () {
        cart.style.right = '-100%';
        container.style.transform = 'translateX(0)';
        isCartOpen = false;
    });

    /* ===============================
       🧾 LOAD PRODUCTS
    ================================*/
    fetch('product.json')
        .then(res => res.json())
        .then(data => {
            products = data;
            addDataToHTML(products);
        })
        .catch(err => console.error('Error loading product.json:', err));

    /* ===============================
       🔠 NORMALIZE TEXT (for search)
    ================================*/
    function normalizeText(text) {
        return text
            ? text.toLowerCase().replace(/['’`"“”.,\-_/\\()]/g, '').replace(/\s+/g, '')
            : '';
    }

    /* ===============================
       🎨 DISPLAY PRODUCTS + HIGHLIGHT
    ================================*/
    function addDataToHTML(productList = products, highlight = '') {
        const listProductHTML = document.querySelector('.listProduct');
        listProductHTML.innerHTML = '';

        if (productList.length === 0) {
            listProductHTML.innerHTML = `
                <div class="no-results">
                    <p>No products found for "<strong>${highlight}</strong>"</p>
                    <button id="showAllBtn">Show All Products</button>
                </div>`;
            document.getElementById('showAllBtn').addEventListener('click', () => {
                addDataToHTML(products);
                searchInput.value = '';
            });
            return;
        }

        const highlightText = (text, keyword) => {
            if (!keyword || !text) return text;
            const regex = new RegExp(`(${keyword})`, 'gi');
            return text.replace(regex, '<span style="background-color:#fff176; font-weight:bold;">$1</span>');
        };

        productList.forEach(product => {
            let { name, description = '', category = '', image, price, id } = product;

            const keyword = highlight.trim();
            const highlightedName = highlightText(name, keyword);
            const highlightedCategory = highlightText(category, keyword);
            const highlightedDesc = highlightText(description, keyword);

            let newProduct = document.createElement('div');
            newProduct.classList.add('item');
            newProduct.innerHTML = `
                <img src="${image}" alt="${name}">
                <h2>${highlightedName}</h2>
                ${category ? `<p class="category">Category: ${highlightedCategory}</p>` : ''}
                ${description ? `<p class="desc">${highlightedDesc}</p>` : ''}
                <div class="price">&#8358;${price}</div>
                <button onclick="addCart(${id})">Add to cart</button>
            `;
            listProductHTML.appendChild(newProduct);

            // subtle fade-in
            newProduct.style.opacity = '0';
            newProduct.style.transform = 'translateY(10px)';
            setTimeout(() => {
                newProduct.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                newProduct.style.opacity = '1';
                newProduct.style.transform = 'translateY(0)';
            }, 10);
        });
    }

    /* ===============================
       🛍 CART FUNCTIONS
    ================================*/
    function checkCart() {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('listCart='));
        if (cookieValue) listCart = JSON.parse(cookieValue.split('=')[1]);
    }
    checkCart();

    window.addCart = function (id) {
        let productsCopy = JSON.parse(JSON.stringify(products));
        if (!listCart[id]) {
            listCart[id] = productsCopy.find(p => p.id == id);
            listCart[id].quantity = 1;
        } else {
            listCart[id].quantity++;
        }
        document.cookie = "listCart=" + JSON.stringify(listCart) + "; expires=Thu, 31 Dec 2026 23:59:59 UTC; path=/;";
        addCartToHTML();
    };

    function addCartToHTML() {
        let listCartHTML = document.querySelector('.listCart');
        let totalHTML = document.querySelector('.totalQuantity');
        listCartHTML.innerHTML = '';
        let totalQuantity = 0;

        listCart.forEach(product => {
            if (product) {
                let newCart = document.createElement('div');
                newCart.classList.add('item');
                newCart.innerHTML = `
                    <img src="${product.image}">
                    <div class="content">
                        <div class="name">${product.name}</div>
                        <div class="price">&#8358;${product.price}</div>
                    </div>
                    <div class="quantity">
                        <button onclick="changeQuantity(${product.id}, '+')">+</button>
                        <input type="number" id="quantity-${product.id}" value="${product.quantity}" onchange="changeQuantity(${product.id})">
                        <button onclick="changeQuantity(${product.id}, '-')">-</button>
                    </div>
                `;
                listCartHTML.appendChild(newCart);
                totalQuantity += product.quantity;
            }
        });
        totalHTML.innerText = totalQuantity;
    }

    window.changeQuantity = function (id, type = null) {
        if (type === '+') {
            listCart[id].quantity++;
        } else if (type === '-') {
            listCart[id].quantity--;
            if (listCart[id].quantity <= 0) delete listCart[id];
        } else {
            const input = document.getElementById(`quantity-${id}`);
            listCart[id].quantity = parseInt(input.value) || 0;
            if (listCart[id].quantity <= 0) delete listCart[id];
        }
        document.cookie = "listCart=" + JSON.stringify(listCart) + "; expires=Thu, 31 Dec 2026 23:59:59 UTC; path=/;";
        addCartToHTML();
    };

    /* ===============================
       🔍 SEARCH BAR (title + desc + category)
    ================================*/
    function handleSearch() {
        const rawSearch = searchInput.value.trim().toLowerCase();
        if (!rawSearch) {
            addDataToHTML(products);
            return;
        }

        const normalizedSearch = normalizeText(rawSearch);
        const filtered = products.filter(product => {
            const name = normalizeText(product.name);
            const desc = normalizeText(product.description);
            const cat = normalizeText(product.category);
            return (
                name.includes(normalizedSearch) ||
                desc.includes(normalizedSearch) ||
                cat.includes(normalizedSearch)
            );
        });

        addDataToHTML(filtered, rawSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') handleSearch();
        });
    }
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);

    addCartToHTML();
});
