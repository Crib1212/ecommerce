// api/opay-init.js - OPay Cashier v3 for Wittyfare
export default async function handler(req, res) {
  if (req.method!== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, email, orderId, customerName } = req.body;

  // NEVER expose secret in frontend - keep these in Vercel Env
  const OPAY_PUBLIC_KEY = process.env.OPAY_PUBLIC_KEY;
  const OPAY_PRIVATE_KEY = process.env.OPAY_PRIVATE_KEY;
  const OPAY_MERCHANT_ID = process.env.OPAY_MERCHANT_ID;
  const IS_PROD = process.env.OPAY_ENV === 'production';

  const baseUrl = IS_PROD
   ? 'https://cashierapi.opayweb.com'
    : 'https://sandboxcashierapi.opayweb.com';

  const payload = {
    merchantId: OPAY_MERCHANT_ID,
    reference: orderId || `WF-${Date.now()}`,
    amount: {
      total: Math.round(amount * 100), // OPay expects kobo
      currency: 'NGN'
    },
    callbackUrl: `https://${req.headers.host}/api/opay-callback`,
    returnUrl: `https://${req.headers.host}/payment-success?ref=${orderId}`,
    customer: {
      email: email,
      name: customerName || 'Wittyfare Customer'
    },
    product: {
      name: 'Wittyfare Order',
      description: `Order ${orderId}`
    }
  };

  try {
    const response = await fetch(`${baseUrl}/api/v3/cashier/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPAY_PUBLIC_KEY}`,
        'MerchantId': OPAY_MERCHANT_ID
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.code === '00000' || data.data?.cashierUrl) {
      return res.status(200).json({
        success: true,
        paymentUrl: data.data.cashierUrl || data.data.checkoutUrl,
        reference: payload.reference
      });
    } else {
      console.error('OPay init error', data);
      return res.status(400).json({ success: false, error: data.message });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'OPay init failed' });
  }
}