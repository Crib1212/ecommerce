export default async function handler(req, res) {
  const { reference } = req.query;
  if (!reference) {
    return res.status(400).json({ success: false, message: 'No reference' });
  }

  const env = (process.env.OPAY_ENV || 'sandbox').trim();
  const publicKey = process.env.OPAY_PUBLIC_KEY?.trim();
  const merchantId = process.env.OPAY_MERCHANT_ID?.trim();

  const baseUrl = env === 'production'
    ? 'https://liveapi.opaycheckout.com'
    : 'https://testapi.opaycheckout.com';

  // Sandbox: auto success for testing
  if (env === 'sandbox') {
    return res.json({ 
      success: true, 
      status: 'SUCCESS', 
      reference,
      message: 'Sandbox - mocked success' 
    });
  }

  // Production verify
  try {
    const resp = await fetch(`${baseUrl}/api/v1/international/cashier/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicKey}`,
        'MerchantId': merchantId
      },
      body: JSON.stringify({ reference })
    });

    const data = await resp.json();
    console.log('OPay verify response:', data);

    const isSuccess = data?.data?.status === 'SUCCESS' || data?.code === '00000';
    
    return res.json({ 
      success: isSuccess, 
      raw: data,
      reference 
    });
  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}