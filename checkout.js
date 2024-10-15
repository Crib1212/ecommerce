let listCart = [];

function getProductDetailsFromHTML() {
    const items = document.querySelectorAll('.list .item');
    items.forEach(item => {
        const productName = item.dataset.name; // Get product name from data attribute
        const productPrice = parseInt(item.dataset.price); // Get product price from data attribute
        const productQuantity = parseInt(item.dataset.quantity); // Get product quantity from data attribute
        
        // Push the product details into the listCart array
        listCart.push({
            name: productName,
            price: productPrice,
            quantity: productQuantity
        });
    });
}
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

    ]; // Example cart items; replace this with your actual cart data

   // Get the total price from the totalPrice div
const totalPrice = parseFloat(document.querySelector('.totalPrice').innerText.replace(/₦/g, '').replace(/,/g, '').trim());


    listCart.forEach((product, index) => {
        // Calculate total price for each product
        totalPrice += product.quantity * product.price;

        // Create hidden fields for product details
        productDetailsDiv.innerHTML += `
        <input type="hidden" id="product_${index + 1}_id" name="product_${index + 1}_id" value="${product.id}">
        <input type="hidden" id="product_${index + 1}_name" name="product_${index + 1}_name" value="${product.name}">
        <input type="hidden" id="product_${index + 1}_quantity" name="product_${index + 1}_quantity" value="${product.quantity}">
        <input type="hidden" id="product_${index + 1}_price" name="product_${index + 1}_price" value="${product.price}">
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
// Example of populating the country dropdown using JavaScript
document.addEventListener("DOMContentLoaded", function() {
    const countrySelect = document.getElementById("country");
    const citySelect = document.getElementById("city");
    
    // Populate the country dropdown
    const countries = [""];
    countries.forEach(country => {
        const option = document.createElement("option");
        option.value = country.toLowerCase().replace(/\s/g, "_");
        option.textContent = country;
        countrySelect.appendChild(option);
    });

    // Populate the city dropdown based on country selection
    countrySelect.addEventListener("change", function() {
        citySelect.innerHTML = ""; // Clear previous options
        const cities = {
            Nigeria: ["Choose..", "FCT Abuja", "Lagos", "Port Harcourt"],
           // Ghana: ["Choose..", "Accra", "Kumasi", "Tamale"],
           // Uk: ["Choose..", "London", "Manchester", "Birmingham"]
        };
        
        const selectedCountry = this.value;
        if (cities[selectedCountry]) {
            cities[selectedCountry].forEach(city => {
                const option = document.createElement("option");
                option.value = city.toLowerCase().replace(/\s/g, "_");
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
    });
});
