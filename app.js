document.addEventListener('DOMContentLoaded', () => {
    let iconCart = document.querySelector('.iconCart');
    let cart = document.querySelector('.cart');
    let container = document.querySelector('.container');
    let close = document.querySelector('.close');

    // Cart open/close animations
    iconCart.addEventListener('click', function () {
        cart.style.right = '0';
        container.style.transform = 'translateX(-400px)';
    });

    close.addEventListener('click', function () {
        cart.style.right = '-100%';
        container.style.transform = 'translateX(0)';
    });

    let products = null;

    // Load products from JSON
    fetch('product.json')
        .then(response => response.json())
        .then(data => {
            products = data;
            addDataToHTML(); // Load all products
        })
        .catch(error => console.error('Error loading products:', error));

    // ✅ Normalize text (remove punctuation, spaces, special chars)
    function normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/['’`"“”.,\-_/\\()]/g, '') // remove punctuation
            .replace(/\s+/g, ''); // remove all spaces
    }

    // ✅ Display products (with optional highlighting)
    function addDataToHTML(productList = products, highlight = '') {
        const listProductHTML = document.querySelector('.listProduct');
        listProductHTML.innerHTML = '';

        if (productList && productList.length > 0) {
            productList.forEach(product => {
                let { name, description = '', category = '', image, price, id } = product;

                // Highlight helper
                const highlightText = (text, keyword) => {
                    if (!keyword) return text;
                    const regex = new RegExp(`(${keyword})`, 'gi');
                    return text.replace(regex, '<mark>$1</mark>');
                };

                // Apply highlights
                name = highlightText(name, highlight);
                description = highlightText(description, highlight);
                category = highlightText(category, highlight);

                let newProduct = document.createElement('div');
                newProduct.classList.add('item');
                newProduct.innerHTML = `
                    <img src="${image}" alt="${name}">
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

    // 🛒 Cart setup
    let listCart = [];

    function checkCart() {
        let cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('listCart='));
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

        document.cookie =
            "listCart=" +
            JSON.stringify(listCart) +
            "; expires=Thu, 31 Dec 2025 23:59:59 UTC; path=/;";
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

        document.cookie =
            "listCart=" +
            JSON.stringify(listCart) +
            "; expires=Thu, 31 Dec 2025 23:59:59 UTC; path=/;";
        addCartToHTML();
    };

    // 🔍 Smart Live Search + Highlight
    const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') handleSearch();
    });

    function handleSearch() {
        const searchValueRaw = searchInput.value.toLowerCase().trim();
        const normalizedSearch = normalizeText(searchValueRaw);

        if (normalizedSearch === '') {
            addDataToHTML(products);
            return;
        }

        const filteredProducts = products.filter(product => {
            const name = normalizeText(product.name || '');
            const desc = normalizeText(product.description || '');
            const category = normalizeText(product.category || '');
            return (
                name.includes(normalizedSearch) ||
                desc.includes(normalizedSearch) ||
                category.includes(normalizedSearch)
            );
        });

        addDataToHTML(filteredProducts, searchValueRaw);
    }

    // Load cart on start
    addCartToHTML();
});
