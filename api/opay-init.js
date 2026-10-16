
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const { customerName, customerEmail, items } = req.body || {};

    if (
      typeof customerEmail !== "string" ||
      !customerEmail.trim() ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email and cart items."
      });
    }

    if (
      items.some(item =>
        !item ||
        typeof item.id !== "string" ||
        !item.id.trim() ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1 ||
        Number(item.quantity) > 100
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Your cart contains invalid products or quantities."
      });
    }

    /*
      SECURITY:
      Connect product.json or a trusted server-side catalogue here.
      Look up each submitted product ID and calculate the total using
      server-side prices. Never trust an amount from the browser.
    */

    return res.status(501).json({
      success: false,
      message:
        "Online payment is temporarily unavailable while product pricing is configured securely."
    });

  } catch (error) {
    console.error("OPay initialization error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to initialize payment. Please try again."
    });
  }
}
