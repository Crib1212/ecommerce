let listCart = [];
//mailfunction
document.querySelector('.buttonCheckout').addEventListener('click', function() {
    // Clear previous product details
    const productDetailsDiv = document.getElementById('product-details');
    productDetailsDiv.innerHTML = '';

    // Loop through each product in listCart and create hidden input fields for name and quantity
    listCart.forEach((product, index) => {
        // Create hidden input for product name
        const productNameInput = document.createElement('input');
        productNameInput.type = 'hidden';
        productNameInput.name = `product_${index + 1}_name`;  // e.g., product_1_name
        productNameInput.value = product.name;
        
        // Create hidden input for product quantity
        const productQuantityInput = document.createElement('input');
        productQuantityInput.type = 'hidden';
        productQuantityInput.name = `product_${index + 1}_quantity`;  // e.g., product_1_quantity
        productQuantityInput.value = product.quantity;

        // Append these hidden inputs to the product details div
        productDetailsDiv.appendChild(productNameInput);
        productDetailsDiv.appendChild(productQuantityInput);
    });
});

document.querySelector('.buttonCheckout').addEventListener('click', function() {
    // Clear any previous hidden fields
    const productDetailsDiv = document.getElementById('product-details');
    productDetailsDiv.innerHTML = '';

    // Assuming listCart contains your product data
    const listCart = [
        { name: 'PRODUCT 1', quantity: 5, price: 500 },
        { name: 'PRODUCT 2', quantity: 3, price: 300 }
    ]; // Example cart items; replace this with your actual cart data

    let totalPrice = 0; // Initialize total price variable

    listCart.forEach((product, index) => {
        // Calculate total price for each product
        totalPrice += product.quantity * product.price;

        // Create hidden fields for product details
        productDetailsDiv.innerHTML += `
            <input type="hidden" name="product_${index + 1}_name" value="${product.name}">
            <input type="hidden" name="product_${index + 1}_quantity" value="${product.quantity}">
            <input type="hidden" name="product_${index + 1}_price" value="${product.price}">
        `;
    });

    // Add the total price to hidden fields
    productDetailsDiv.innerHTML += `
        <input type="hidden" name="total_price" value="${totalPrice}">
        <input type="hidden" name="total_quantity" value="${document.querySelector('.totalQuantity').innerText}">
    `;

    // Optionally, submit the form programmatically
    document.querySelector('form').submit();
});


function checkCart(){
        var cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('listCart='));
        if(cookieValue){
            listCart = JSON.parse(cookieValue.split('=')[1]);
        }
}
checkCart();
addCartToHTML();
function addCartToHTML(){
    // clear data default
    let listCartHTML = document.querySelector('.returnCart .list');
    listCartHTML.innerHTML = '';

    let totalQuantityHTML = document.querySelector('.totalQuantity');
    let totalPriceHTML = document.querySelector('.totalPrice');
    let totalQuantity = 0;
    let totalPrice = 0;
    // if has product in Cart
    if(listCart){
        listCart.forEach(product => {
            if(product){
                let newCart = document.createElement('div');
                newCart.classList.add('item');
                newCart.innerHTML = 
                    `<img src="${product.image}">
                    <div class="info">
                        <div class="name">${product.name}</div>
                        <div class="price">&#8358;${product.price}/1 product</div>
                    </div>
                    <div class="quantity">${product.quantity}</div>
                    <div class="returnPrice">&#8358;${product.price * product.quantity}</div>`;
                listCartHTML.appendChild(newCart);
                totalQuantity = totalQuantity + product.quantity;
                totalPrice = totalPrice + (product.price * product.quantity);
            }
        })
    }
    totalQuantityHTML.innerText = totalQuantity;
    totalPriceHTML.innerText = '₦' + totalPrice;
}
function sendMail() {
    // Collect form and cart data, then send it to Zapier's webhook
    fetch('https://hooks.zapier.com/hooks/catch/20309823/2miue63/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            // Add other form and cart details here
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
