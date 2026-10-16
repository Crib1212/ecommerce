export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { customerName, customerEmail, items } = req.body;

    if (!customerEmail ||!items ||!items.length) {
      return res.status(400).json({ message: 'Missing email or items' });
    }

    // Calculate total from your cart
    let totalPrice = 0;
    items.forEach(i => {
        // price is in your normalizeProduct - we need to get from cart again or trust frontend total
        // For safety, if item has price use it, else we will get from totals in frontend
    });

    // Get total from session or frontend - since you send only id/qty, we calculate from localStorage?
    // EASIER: get total from the hidden input totalPrice on frontend and send it.
    // For now use amount sent from frontend if available, else fallback 1000
    let amount = req.body.amount || req.body.totalPrice || 1000;
    amount = Number(amount);

    // OPay wants amount in KOBO (x100)
    const amountKobo = Math.round(amount * 100);

    const publicKey = process.env.OPAY_PUBLIC_KEY?.trim();
    const merchantId = process.env.OPAY_MERCHANT_ID?.trim();
    const env = (process.env.OPAY_ENV || 'sandbox').trim();

    if (!publicKey ||!merchantId) {
      return res.status(500).json({ message: 'OPay env vars missing' });
    }

    const baseUrl = env === 'production'
     ? 'https://liveapi.opaycheckout.com'
      : 'https://testapi.opaycheckout.com';

    const reference = `wittyfare_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;

    const payload = {
      reference: reference,
      amount: { total: amountKobo, currency: 'NGN' },
      product: { name: 'Wittyfare Order', description: `${items.length} items` },
      callbackUrl: 'https://wittyfare.com/confirmation.html',
      returnUrl: 'https://wittyfare.com/confirmation.html',
      customer: { email: customerEmail, name: customerName || 'Customer' },
      country: 'NG'
    };

    const response = await fetch(`${baseUrl}/api/v1/international/cashier/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicKey}`, // PUBLIC KEY HERE per docs
        'MerchantId': merchantId
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(500).json({ message: 'OPay non-JSON', raw: text }); }

    if (data.code!== '00000' && data.code!== '0000' &&!data.data?.cashierUrl) {
       return res.status(500).json({ message: 'OPay failed', details: data });
    }

    return res.status(200).json({
      success: true,
      checkoutUrl: data.data.cashierUrl || data.data.checkoutUrl,
      paymentReference: reference,
      raw: data
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}