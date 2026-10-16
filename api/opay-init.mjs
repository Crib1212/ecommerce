
import fs from "node:fs/promises";
import path from "node:path";

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
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { customerName, customerEmail, items } = body || {};

    if (
      typeof customerEmail !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ||
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid customer email and order items are required."
      });
    }

    // Read the trusted catalogue from the deployed project root.
    const cataloguePath = path.join(process.cwd(), "product.json");
    const catalogue = JSON.parse(
      await fs.readFile(cataloguePath, "utf8")
    );

    if (!Array.isArray(catalogue)) {
      throw new Error("Product catalogue format is invalid.");
    }

    let totalNaira = 0;
    const seen = new Set();

    for (const item of items) {
      const id = String(item?.id ?? "");
      const quantity = Number(item?.quantity);

      if (
        !id ||
        seen.has(id) ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 1000
      ) {
        return res.status(400).json({
          success: false,
          message: "An order item or quantity is invalid."
        });
      }

      seen.add(id);

      const matches = catalogue.filter(
        product => String(product.id) === id
      );

      if (matches.length === 0) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart is no longer available."
        });
      }

      if (matches.length > 1) {
        return res.status(409).json({
          success: false,
          message:
            `The catalogue has duplicate IDs for ${id}. ` +
            "Please correct the product catalogue before ordering it."
        });
      }

      const price = Number(matches[0].price);

      if (!Number.isSafeInteger(price) || price <= 0) {
        return res.status(500).json({
          success: false,
          message: "A product price needs to be corrected."
        });
      }

      totalNaira += price * quantity;

      if (!Number.isSafeInteger(totalNaira)) {
        return res.status(400).json({
          success: false,
          message: "Order total is too large."
        });
      }
    }

    if (totalNaira <= 0) {
      return res.status(400).json({
        success: false,
        message: "The order total must be greater than zero."
      });
    }

    const publicKey = process.env.OPAY_PUBLIC_KEY?.trim();
    const merchantId = process.env.OPAY_MERCHANT_ID?.trim();
    const env = (process.env.OPAY_ENV || "sandbox").trim();
    const callbackUrl = process.env.OPAY_CALLBACK_URL?.trim();

    if (
      !publicKey ||
      !merchantId ||
      !callbackUrl ||
      !["sandbox", "production"].includes(env)
    ) {
      console.error("OPay configuration is incomplete.");
      return res.status(503).json({
        success: false,
        message: "Online payment is not fully configured yet."
      });
    }

    const baseUrl =
      env === "production"
        ? "https://liveapi.opaycheckout.com"
        : "https://testapi.opaycheckout.com";

    const reference =
      `wittyfare_${Date.now()}_` +
      Math.random().toString(36).slice(2, 9);

    const payload = {
      country: "NG",
      reference,
      amount: {
        total: totalNaira * 100,
        currency: "NGN"
      },
      product: {
        name: "WittyFare Order",
        description: `${items.length} product type(s)`
      },
      userInfo: {
        userEmail: customerEmail,
        userName:
          typeof customerName === "string" && customerName.trim()
            ? customerName.trim().slice(0, 100)
            : "Customer"
      },
      callbackUrl,
      returnUrl: "https://www.wittyfare.com/confirmation.html",
      cancelUrl: "https://www.wittyfare.com/checkout.html"
    };

    const opayResponse = await fetch(
      `${baseUrl}/api/v1/international/cashier/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicKey}`,
          MerchantId: merchantId
        },
        body: JSON.stringify(payload)
      }
    );

    const responseText = await opayResponse.text();
    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      console.error("OPay returned a non-JSON response.");
      return res.status(502).json({
        success: false,
        message: "The payment provider returned an invalid response."
      });
    }

    const checkoutUrl = result?.data?.cashierUrl;

    if (
      !opayResponse.ok ||
      result?.code !== "00000" ||
      typeof checkoutUrl !== "string" ||
      !checkoutUrl.startsWith("https://")
    ) {
      console.error("OPay session creation failed:", {
        httpStatus: opayResponse.status,
        providerCode: result?.code
      });

      return res.status(502).json({
        success: false,
        message: "OPay could not create the payment session."
      });
    }

    return res.status(200).json({
      success: true,
      checkoutUrl,
      paymentReference: reference
    });
  } catch (error) {
    console.error("OPay initialization error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to initialize payment. Please try again."
    });
  }
}
