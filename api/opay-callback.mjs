
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      status: "method_not_allowed"
    });
  }

  try {
    // Do not mark an order as paid from an unverified callback.
    // First confirm OPay's documented callback signature and fields.
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json({
        status: "invalid_payload"
      });
    }

    // Log only limited diagnostic information.
    // Do not log customer or payment secrets.
    console.log("OPay callback received", {
      hasReference: Boolean(body.reference),
      hasStatus: Boolean(body.status),
      receivedAt: new Date().toISOString()
    });

    // Verification and order update still need implementing.
    return res.status(501).json({
      status: "verification_not_implemented"
    });

  } catch (error) {
    console.error("OPay callback processing failed", error.message);

    return res.status(400).json({
      status: "invalid_callback"
    });
  }
}
