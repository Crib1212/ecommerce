
/* public/js/opay-init.js */

async function initializeOpayCheckout(order) {
  const button = document.querySelector("#opay-checkout");

  if (button) {
    button.disabled = true;
    button.textContent = "Connecting to OPay...";
  }

  try {
    const response = await fetch("/api/opay/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({
        orderId: order.orderId
      })
    });

    const result = await response.json();

    if (!response.ok || !result.checkoutUrl) {
      throw new Error(result.message || "Unable to initialize payment.");
    }

    window.location.assign(result.checkoutUrl);
  } catch (error) {
    console.error("OPay checkout error:", error.message);
    alert("Payment could not be started. Please try again.");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Pay with OPay";
    }
  }
}

window.initializeOpayCheckout = initializeOpayCheckout;
