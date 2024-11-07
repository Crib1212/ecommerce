let iconCart = document.querySelector('.iconCart');
let cart = document.querySelector('.cart');
let container = document.querySelector('.container');
let close = document.querySelector('.close');
let category = document.querySelector('.category');


function goHome() {
    window.location.href = "../../index.html"; // Adjust to your home page URL
}
function closeToast() {
    document.querySelector('.notification-toast').style.display = 'none';
}



function toggleMenu() {
    var menu = document.getElementById('menu');
    menu.classList.toggle('open');
  }
  

  iconCart.addEventListener('click', function() {
    // Always open the cart and adjust the container position
    cart.style.right = '0'; // Move the cart into view
    container.style.transform = 'translateX(-400px)'; // Shift the container
});

// Close the cart when the close button is clicked
close.addEventListener('click', function() {
    cart.style.right = '-100%'; // Move the cart off-screen
    container.style.transform = 'translateX(0)'; // Reset the container position
});

let products = null;
// get data from file json
fetch('product.json')
    .then(response => response.json())
    .then(data => {
        products = data;
        addDataToHTML();
})
.catch(error => console.error('Error loading products:', error));

//show datas product in list 
function addDataToHTML(){
    // remove datas default from HTML
    let listProductHTML = document.querySelector('.listProduct');
    listProductHTML.innerHTML = '';

    // add new datas
    if(products != null) // if has data
    {
        products.forEach(product => {
            let newProduct = document.createElement('div');
            newProduct.classList.add('item');
            newProduct.innerHTML = 
            `<img src="${product.image}" alt="">
            <h2>${product.name}</h2>
            <div class="price">&#8358;${product.price}</div>
            <button onclick="addCart(${product.id})">Add To Cart</button>`;

            listProductHTML.appendChild(newProduct);

        });
    }
}
//use cookie so the cart doesn't get lost on refresh page


let listCart = [];
function checkCart(){
    var cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('listCart='));
    if(cookieValue){
        listCart = JSON.parse(cookieValue.split('=')[1]);
    }else{
        listCart = [];
    }
}
checkCart();
function addCart($idProduct){
    let productsCopy = JSON.parse(JSON.stringify(products));
    //// If this product is not in the cart
    if(!listCart[$idProduct]) 
    {
        listCart[$idProduct] = productsCopy.filter(product => product.id == $idProduct)[0];
        listCart[$idProduct].quantity = 1;
    }else{
        //If this product is already in the cart.
        //I just increased the quantity
        listCart[$idProduct].quantity++;
    }
    document.cookie = "listCart=" + JSON.stringify(listCart) + "; expires=Thu, 31 Dec 2025 23:59:59 UTC; path=/;";

    addCartToHTML();
}
addCartToHTML();
function addCartToHTML(){
    // clear data default
    let listCartHTML = document.querySelector('.listCart');
    listCartHTML.innerHTML = '';

    let totalHTML = document.querySelector('.totalQuantity');
    let totalQuantity = 0;
    // if has product in Cart
    if(listCart){
        listCart.forEach(product => {
            if(product){
                let newCart = document.createElement('div');
                newCart.classList.add('item');
                newCart.innerHTML = 
                    `<img src="${product.image}">
                    <div class="content">
                        <div class="name">${product.name}</div>
                        <div class="price">&#8358;${product.price}</div>
                    </div>
                    <div class="quantity">
                    
                       <button onclick="changeQuantity(${product.id}, '+')">+</button> 
                       <input type="number" id="quantity-${product.id}" value="${product.quantity}" onchange="changeQuantity(${product.id})">
                       <button onclick="changeQuantity(${product.id}, '-')">-</button> 
                    </div>`;
                listCartHTML.appendChild(newCart);
                totalQuantity = totalQuantity + product.quantity;
            }
        })
    }
    totalHTML.innerText = totalQuantity;
}
function changeQuantity($idProduct, $type = null) {
    if ($type === '+') {
        listCart[$idProduct].quantity++;
    } else if ($type === '-') {
        listCart[$idProduct].quantity--;
        if (listCart[$idProduct].quantity <= 0) {
            delete listCart[$idProduct];
        }
    } else {
        // For manual input change
        let quantityInput = document.getElementById(`quantity-${$idProduct}`).value;
        listCart[$idProduct].quantity = parseInt(quantityInput) || 0;
        if (listCart[$idProduct].quantity <= 0) {
            delete listCart[$idProduct];
        }
    }

   // Function to search products
function searchProducts() {
    let searchInput = document.getElementById('searchInput').value.toLowerCase();
    let filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchInput)
    );
    
    addDataToHTML(filteredProducts); // Show the filtered products
}
    
    // save new data in cookie
    document.cookie = "listCart=" + JSON.stringify(listCart) + "; expires=Thu, 31 Dec 2025 23:59:59 UTC; path=/;";
    // reload html view cart
    addCartToHTML();
}
