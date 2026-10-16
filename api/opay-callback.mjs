/*
 * Safe callback receiver template.
 * This endpoint intentionally does NOT mark orders as paid.
 * Add durable order storage and OPay status verification before live payments.
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ status: 'method_not_allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ status: 'invalid_payload' });
    }

    // Do not log the entire callback or customer/payment details.
    console.log('OPay callback received', {
      reference: typeof body.reference === 'string' ? body.reference.slice(0, 100) : null,
      status: typeof body.status === 'string' ? body.status.slice(0, 30) : null,
      receivedAt: new Date().toISOString()
    });

    // TODO before production:
    // 1) Find the saved pending order by reference.
    // 2) Query OPay cashier/status using the private-key HMAC signature.
    // 3) Verify reference, NGN currency, amount and status === SUCCESS.
    // 4) Update that durable order record idempotently to paid.
    // Never trust a callback body alone as proof of payment.
    return res.status(200).json({ status: 'received', verified: false });
  } catch (error) {
    console.error('OPay callback parse error:', error?.message || 'Invalid callback');
    return res.status(400).json({ status: 'invalid_callback' });
  }
}
