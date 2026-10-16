function setupCheckoutForm() {
    const form = document.getElementById("checkoutForm");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (!Array.isArray(listCart) || listCart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const userDetails = Object.fromEntries(formData.entries());
        const selectedPayment = form.querySelector('input[name="paymentMethod"]:checked');

        if (!selectedPayment) {
            alert("Please select a payment method.");
            return;
        }

        const paymentMethod = selectedPayment.value;
        listCart = listCart.map(normalizeProduct);
        const totals = getCartTotals();

        userDetails.totalQuantity = totals.totalQuantity;
        userDetails.totalPrice = totals.totalPrice.toFixed(2);
        sessionStorage.setItem("userDetails", JSON.stringify(userDetails));
        sessionStorage.setItem("checkoutCart", JSON.stringify(listCart));
        sessionStorage.setItem("currentOrder", JSON.stringify({
            customer: userDetails,
            products: listCart,
            totalQuantity: totals.totalQuantity,
            totalPrice: totals.totalPrice,
            paymentMethod: paymentMethod,
            createdAt: new Date().toISOString()
        }));

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton ? submitButton.textContent : "";

        try {
            if (paymentMethod === "online" || paymentMethod === "transfer") {
                if (!userDetails.name || !userDetails.email) {
                    alert("Please enter name and email.");
                    return;
                }

                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = "Connecting to OPay...";
                }

                console.log("Starting OPay with", totals.totalPrice);

                const response = await fetch("/api/opay-init", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        customerName: userDetails.name,
                        customerEmail: userDetails.email,
                        amount: totals.totalPrice,
                        totalPrice: totals.totalPrice,
                        items: listCart
                    })
                });

                const result = await response.json();
                console.log("OPay result", result);

                if (!response.ok || !result.success || !result.checkoutUrl) {
                    throw new Error(result.message || JSON.stringify(result.details) || "OPay failed");
                }

                sessionStorage.setItem("opayPaymentReference", result.paymentReference);
                // THIS IS THE REDIRECT - must be last line
                window.location.href = result.checkoutUrl;
                return; // stop here, don't go to confirmation
            }

            // Pay on delivery only
            window.location.href = "confirmation.html";

        } catch (error) {
            console.error("Checkout error:", error);
            alert(error.message);
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText || "Pay Now";
            }
        }
    });
}