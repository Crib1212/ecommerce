export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, email, reference, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: 'amount and email required' });
    }

    const publicKey = process.env.OPAY_PUBLIC_KEY?.trim();
    const privateKey = process.env.OPAY_PRIVATE_KEY?.trim();
    const merchantId = process.env.OPAY_MERCHANT_ID?.trim();
    const env = process.env.OPAY_ENV?.trim() || 'sandbox';

    console.log('ENV CHECK:', { hasPublic: !!publicKey, hasPrivate: !!privateKey, hasMerchant: !!merchantId, env });

    if (!publicKey || !privateKey || !merchantId) {
      return res.status(500).json({ error: 'OPay env vars missing in Vercel' });
    }

    const baseUrl = env === 'production' 
      ? 'https://liveapi.opaycheckout.com' 
      : 'https://testapi.opaycheckout.com';

    const payload = {
      amount: { total: Math.round(Number(amount) * 100), currency: 'NGN' },
      reference: reference || `wittyfare_${Date.now()}`,
      product: { name: name || 'Wittyfare Order', description: 'Wittyfare Order' },
      callbackUrl: 'https://wittyfare.com/order-success',
      returnUrl: 'https://wittyfare.com/order-success',
      customer: { email: email },
      merchantId: merchantId
    };

    const response = await fetch(`${baseUrl}/api/v1/international/cashier/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${privateKey}`,
        'MerchantId': merchantId
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log('OPay raw response:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: 'OPay returned non-JSON', raw: text });
    }

    if (!response.ok) {
      return res.status(500).json({ error: 'OPay failed', details: data });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}