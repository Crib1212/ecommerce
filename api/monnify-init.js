
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      amount,
      customerName,
      customerEmail
    } = req.body || {};

    // Basic validation. Validate prices against your real
    // product catalogue before using this in production.
    if (
      !Number.isFinite(Number(amount)) ||
      Number(amount) < 20 ||
      !customerEmail ||
      !customerName
    ) {
      return res.status(400).json({
        error: "Enter a valid amount, name and email."
      });
    }

    const apiKey = process.env.MONNIFY_API_KEY;
    const secretKey = process.env.MONNIFY_SECRET_KEY;
    const contractCode = process.env.MONNIFY_CONTRACT_CODE;
    const baseUrl =
      process.env.MONNIFY_BASE_URL ||
      "https://sandbox.monnify.com";

    if (!apiKey || !secretKey || !contractCode) {
      return res.status(500).json({
        error: "Monnify environment variables are missing."
      });
    }

    // Get Monnify access token
    const credentials = Buffer.from(
      `${apiKey}:${secretKey}`
    ).toString("base64");

    const authResponse = await fetch(
      `${baseUrl}/api/v1/auth/login`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json"
        }
      }
    );

    const authData = await authResponse.json();

    if (
      !authResponse.ok ||
      !authData.requestSuccessful ||
      !authData.responseBody?.accessToken
    ) {
      console.error("Monnify authentication failed");
      return res.status(502).json({
        error: "Could not authenticate with Monnify."
      });
    }

    // Create a unique payment reference
    const paymentReference =
      `WF-${Date.now()}-${crypto.randomUUID()}`;

    const paymentResponse = await fetch(
      `${baseUrl}/api/v1/merchant/transactions/init-transaction`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${authData.responseBody.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: Number(amount),
          customerName,
          customerEmail,
          paymentReference,
          paymentDescription: "WittyFare order",
          currencyCode: "NGN",
          contractCode,
          redirectUrl:
            "https://www.wittyfare.com/payment-callback.html",
          paymentMethods: ["CARD", "ACCOUNT_TRANSFER"]
        })
      }
    );

    const paymentData = await paymentResponse.json();

    if (
      !paymentResponse.ok ||
      !paymentData.requestSuccessful ||
      !paymentData.responseBody?.checkoutUrl
    ) {
      console.error("Monnify initialization failed");
      return res.status(502).json({
        error: "Monnify could not start the payment."
      });
    }

    return res.status(200).json({
      checkoutUrl: paymentData.responseBody.checkoutUrl,
      paymentReference,
      transactionReference:
        paymentData.responseBody.transactionReference
    });
  } catch (error) {
    console.error("Payment initialization error:", error);
    return res.status(500).json({
      error: "Unable to start payment. Please try again."
    });
  }
}
