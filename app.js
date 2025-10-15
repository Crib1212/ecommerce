document.addEventListener('DOMContentLoaded', () => {
    const iconCart = document.querySelector('.iconCart');
    const cart = document.querySelector('.cart');
    const container = document.querySelector('.container');
    const close = document.querySelector('.close');
    const category = document.querySelector('.category');

    // State tracking
    let isCartOpen = false;

    // MENU TOGGLE FUNCTION
    window.toggleMenu = function () {
        const menu = document.getElementById('menu');
        if (menu) menu.classList.toggle('open');
    };

    // GO HOME FUNCTION
    window.goHome = function () {
        window.location.href = "index.html";
    };

    // CLOSE TOAST
    window.closeToast = function () {
        const toast = document.querySelector('.notification-toast');
        if (toast) toast.style.display = 'none';
    };

    // 🛒 CART TOGGLE OPEN/CLOSE
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

    // PRODUCTS SETUP
    let products = null;

    fetch('product.json')
        .then(response => response.json())
        .then(data => {
            products = data;
            addDataToHTML(products);
        })
        .catch(error => console.error('Error loading products:', error));

    // NORMALIZE TEXT FOR SEARCH
    function normalizeText(text) {
        return text.toLowerCase().replace(/['’`"“”.,\-_/\\()]/g, '').replace(/\s+/g, '');
    }

    // ADD DATA TO HTML WITH HIGHLIGHT SUPPORT
    function addDataToHTML(productList = products, highlight = '') {
        const listProductHTML = document.querySelector('.listProduct');
        listProductHTML.innerHTML = '';

        if (productList && productList.length > 0) {
            productList.forEach(product => {
                let { name, description = '', category = '', image, price, id } = product;

                const highlightText = (text, keyword) => {
                    if (!keyword) return text;
                    const regex = new RegExp(`(${keyword})`, 'gi');
                    return text.replace(regex, '<span style="background-color:#fff176; font-weight:bold;">$1</span>');
                };

                // Apply highlight to name, category, and description
                name = highlightText(name, highlight);
                category = highlightText(category, highlight);
                description = highlightText(description, highlight);

                let newProduct = document.createElement('div');
                newProduct.classList.add('item');
                newProduct.innerHTML = `
                    <img src="${image}" alt="">
                    <h2>${name}</h2>
                    ${category ? `<p class="category">Category: ${category}</p>` : ''}
                    ${description ? `<p class="desc">${description}</p>` : ''}
                    <div class="price">&#8358;${price}</div>
                    <button onclick="addCart(${id})">Add to cart</button>
                `;
                listProductHTML.appendChild(newProduct);
            });
        } else {
            listProductHTML.innerHTML = `
                <p>No results found for "<strong>${highlight}</strong>".</p>
                <button id="showAllBtn">Show All Products</button>
            `;
            document.getElementById('showAllBtn').addEventListener('click', () => {
                addDataToHTML(products);
                document.getElementById('searchInput').value = '';
            });
        }
    }

    // 🛒 CART SYSTEM
    let listCart = [];

    function checkCart() {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('listCart='));
        if (cookieValue) {
            listCart = JSON.parse(cookieValue.split('=')[1]);
        } else {
            listCart = [];
        }
    }
    checkCart();

    window.addCart = function ($idProduct) {
        let productsCopy = JSON.parse(JSON.stringify(products));

        if (!listCart[$idProduct]) {
            listCart[$idProduct] = productsCopy.find(product => product.id == $idProduct);
            listCart[$idProduct].quantity = 1;
        } else {
            listCart[$idProduct].quantity++;
        }

        document.cookie = "listCart=" + JSON.stringify(listCart) + "; expires=Thu, 31 Dec 2025 23:59:59 UTC; path=/;";
        addCartToHTML();
    };

    function addCartToHTML() {
        let listCartHTML = document.querySelector('.listCart');
        let totalHTML = document.querySelector('.totalQuantity');
        listCartHTML.innerHTML = '';
        let totalQuantity = 0;

        if (listCart) {
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
        }

        totalHTML.innerText = totalQuantity;
    }

    window.changeQuantity = function ($idProduct, $type = null) {
        if ($type === '+') {
            listCart[$idProduct].quantity++;
        } else if ($type === '-') {
            listCart[$idProduct].quantity--;
            if (listCart[$idProduct].quantity <= 0) {
                delete listCart[$idProduct];
            }
        } else {
            let quantityInput = document.getElementById(`quantity-${$idProduct}`).value;
            listCart[$idProduct].quantity = parseInt(quantityInput) || 0;
            if (listCart[$idProduct].quantity <= 0) {
                delete listCart[$idProduct];
            }
        }

        document.cookie = "listCart=" + JSON.stringify(listCart) + "; expires=Thu, 31 Dec 2025 23:59:59 UTC; path=/;";
        addCartToHTML();
    };

    // 🔍 SEARCH FUNCTION WITH HIGHLIGHTING
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-button');

    function handleSearch() {
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
            if (e.key === 'Enter') handleSearch();
        });
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    addCartToHTML();
});
