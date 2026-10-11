// api/monnify-init.js
// Wittyfare Monnify Payment Initialization

const crypto = require("crypto");
const products = require("../product.json");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({
            success: false,
            message: "Method not allowed."
        });
    }

    const {
        items,
        customerName,
        customerEmail
    } = req.body || {};

    if (
        !Array.isArray(items) ||
        items.length === 0 ||
        items.length > 100 ||
        typeof customerName !== "string" ||
        !customerName.trim() ||
        customerName.trim().length > 100 ||
        typeof customerEmail !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide valid order items, name and email."
        });
    }

    if (
        !process.env.MONNIFY_API_KEY ||
        !process.env.MONNIFY_SECRET_KEY ||
        !process.env.MONNIFY_CONTRACT_CODE
    ) {
        return res.status(500).json({
            success: false,
            message: "Payment service is not configured."
        });
    }

    try {
        const catalogue = new Map(
            products.map(product => [String(product.id), product])
        );

        const seenIds = new Set();
        let amount = 0;
        const orderItems = [];

        for (const item of items) {
            const id = String(item.id || "");
            const quantity = Number(item.quantity);
            const product = catalogue.get(id);

            if (
                !product ||
                seenIds.has(id) ||
                !Number.isSafeInteger(quantity) ||
                quantity < 1 ||
                quantity > 100 ||
                !Number.isFinite(Number(product.price)) ||
                Number(product.price) <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "An order item is invalid. Please refresh your cart."
                });
            }

            seenIds.add(id);

            const price = Number(product.price);
            amount += price * quantity;

            orderItems.push({
                id,
                name: product.name,
                price,
                quantity
            });
        }

        if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 5000000) {
            return res.status(400).json({
                success: false,
                message: "The order total is invalid."
            });
        }

        const baseUrl = (
            process.env.MONNIFY_BASE_URL ||
            "https://sandbox.monnify.com"
        ).replace(/\/+$/, "");

        if (
            !["https://sandbox.monnify.com", "https://api.monnify.com"]
                .includes(baseUrl)
        ) {
            throw new Error("Invalid payment service configuration.");
        }

        const siteUrl = (
            process.env.SITE_URL ||
            "https://www.wittyfare.com"
        ).replace(/\/+$/, "");

        if (
            ![
                "https://www.wittyfare.com",
                "https://wittyfare.com"
            ].includes(siteUrl)
        ) {
            throw new Error("Invalid site URL configuration.");
        }

        const credentials = Buffer.from(
            `${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`
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
            authData.requestSuccessful !== true ||
            !authData.responseBody?.accessToken
        ) {
            console.error("Monnify authentication failed.");
            return res.status(502).json({
                success: false,
                message: "Unable to connect to the payment service."
            });
        }

        const paymentReference =
            `WF-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`;

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
                    amount,
                    customerName: customerName.trim(),
                    customerEmail: customerEmail.trim(),
                    paymentReference,
                    paymentDescription: "WittyFare product order",
                    currencyCode: "NGN",
                    contractCode: process.env.MONNIFY_CONTRACT_CODE,
                    redirectUrl:
                        `${siteUrl}/confirmation.html?payment=monnify&ref=${paymentReference}`
                })
            }
        );

        const paymentData = await paymentResponse.json();

        if (
            !paymentResponse.ok ||
            paymentData.requestSuccessful !== true ||
            !paymentData.responseBody?.checkoutUrl
        ) {
            console.error("Monnify checkout initialization failed:", paymentData);
            return res.status(502).json({
                success: false,
                message: "Could not start payment. Please try again."
            });
        }

        return res.status(200).json({
            success: true,
            checkoutUrl: paymentData.responseBody.checkoutUrl,
            paymentReference,
            amount,
            items: orderItems
        });
    } catch (error) {
        console.error("Payment initialization error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Payment could not be started. Please try again."
        });
    }
};