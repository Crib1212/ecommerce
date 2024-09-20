const cartItemsContainer = document.querySelector('.cart-items');
const cart = JSON.parse(localStorage.getItem('cart')) || [];

const displayCartItems = () => {
    cart.forEach(item => {
        const newItem = document.createElement('div');
        newItem.innerHTML = `<div>Product ID: ${item.product_id}</div>
                             <div>Quantity: ${item.quantity}</div>`;
        cartItemsContainer.appendChild(newItem);
    });
};

displayCartItems();
