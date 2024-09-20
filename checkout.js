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
document.querySelector('.checkout-button').addEventListener('click', function() {
    // Perform any validation or actions here if necessary, I just added this right now
    window.location.href = 'confirmation.html'; // Redirect to the confirmation page, i just added this right now
});//just added this right now
