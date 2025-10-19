let listCart = []; // Holds cart items

// Function to get product details from HTML (update as per your HTML structure)
function getProductDetailsFromHTML() {
    const items = document.querySelectorAll('.list .item');
    items.forEach(item => {
        const productName = item.dataset.name;
        const productPrice = parseFloat(item.dataset.price);
        const productQuantity = parseInt(item.dataset.quantity);

        listCart.push({
            name: productName,
            price: productPrice,
            quantity: productQuantity
        });
    });
}
// Event listener for the checkout button
document.querySelector('.buttonCheckout').addEventListener('click', function(event) {
    event.preventDefault();  // Prevent default form submission
    
    // Gather user input data
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const email = document.getElementById('email').value;
    const country = document.getElementById('country').value;
    const city = document.getElementById('city').value;
    
    // Store the cart details and user details in sessionStorage
    sessionStorage.setItem('listCart', JSON.stringify(listCart));
    sessionStorage.setItem('userDetails', JSON.stringify({
        name,
        phone,
        address,
        email,
        country,
        city,
        totalQuantity: document.getElementById('totalQuantity').value,
        totalPrice: document.getElementById('totalPrice').value
    }));

    // Redirect to the confirmation page
    window.location.href = 'confirmation.html';  // Ensure the URL is correct
});

// Event listener for the checkout button
document.querySelector('.buttonCheckout').addEventListener('click', function(event) {
    event.preventDefault();  // Prevent default form submission
    
    // Store the cart details in a cookie
    document.cookie = `listCart=${JSON.stringify(listCart)}; path=/`;
    
    // Redirect to the confirmation page
    window.location.href = 'confirmation.html';  // Ensure the URL is correct
});

// Function to populate cart details in HTML
function addCartToHTML() {
    let listCartHTML = document.querySelector('.returnCart .list');
    listCartHTML.innerHTML = '';  // Clear existing items

    let totalQuantityHTML = document.querySelector('.totalQuantity');
    let totalPriceHTML = document.querySelector('.totalPrice');
    let totalQuantity = 0;
    let totalPrice = 0;

    // Populate cart items
    listCart.forEach(product => {
        if (product) {
            let newCart = document.createElement('div');
            newCart.classList.add('item');
            newCart.innerHTML = `
                <img src="${product.image}">
                <div class="info">
                    <div class="name">${product.name}</div>
                    <div class="price">₦${product.price}/1 item</div>
                </div>
                <div class="quantity">${product.quantity}</div>
                <div class="returnPrice">₦${product.price * product.quantity}</div>`;
            listCartHTML.appendChild(newCart);

            totalQuantity += product.quantity;
            totalPrice += product.price * product.quantity;
        }
    });

    totalQuantityHTML.innerText = totalQuantity;
    totalPriceHTML.innerText = '₦' + totalPrice.toLocaleString();
}

// On page load, check for existing cart items in cookies
document.addEventListener('DOMContentLoaded', () => {
    let cookieValue = document.cookie.split('; ').find(row => row.startsWith('listCart='));
    if (cookieValue) {
        listCart = JSON.parse(cookieValue.split('=')[1]);
    }
    addCartToHTML(); // Call to render the cart on page load
});
if (product && product.name && product.quantity) {
    // Only proceed if product and its properties are valid
    orderDetailsDiv.innerHTML += `<p>${product.name} - Quantity: ${product.quantity}</p>`;
} else {
    console.error('Invalid product data:', product);
}
