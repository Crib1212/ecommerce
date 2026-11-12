import { createHmac } from 'node:crypto';
import { supabaseRequest } from './_lib/supabase.js';

const API_URLS = {
  sandbox: 'https://testapi.opaycheckout.com',
  production: 'https://liveapi.opaycheckout.com'
};

function send(res, status, data) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(data);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, {
      success: false,
      message: 'Method not allowed.'
    });
  }

  try {
    const reference = String(req.query?.reference || '').trim();

    if (!/^[A-Za-z0-9_-]{6,100}$/.test(reference)) {
      return send(res, 400, {
        success: false,
        message: 'Invalid payment reference.'
      });
    }

    const env = String(process.env.OPAY_ENV || 'sandbox').trim().toLowerCase();
    const merchantId = process.env.OPAY_MERCHANT_ID?.trim();
    const secretKey = process.env.OPAY_SECRET_KEY?.trim();

    if (!API_URLS[env] || !merchantId || !secretKey) {
      return send(res, 500, {
        success: false,
        message: 'OPay verification is not configured.'
      });
    }

    // Find the original order.
    const orders = await supabaseRequest(
      `orders?reference=eq.${encodeURIComponent(reference)}&select=reference,amount_kobo,currency,payment_method,payment_status,order_status`
    );

    const order = Array.isArray(orders) ? orders[0] : null;

    if (!order || order.payment_method !== 'opay') {
      return send(res, 404, {
        success: false,
        message: 'OPay order not found.'
      });
    }

    if (order.payment_status === 'paid') {
      return send(res, 200, {
        success: true,
        status: 'SUCCESS',
        reference,
        message: 'Payment already confirmed.'
      });
    }

    // OPay requires this exact JSON body to be signed.
    const requestBody = JSON.stringify({
      country: 'NG',
      reference
    });

    const signature = createHmac('sha512', secretKey)
      .update(requestBody)
      .digest('hex');

    const response = await fetch(
      `${API_URLS[env]}/api/v1/international/cashier/status`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${signature}`,
          MerchantId: merchantId,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: requestBody,
        signal: AbortSignal.timeout(15000)
      }
    );

    const result = await response.json();
    const payment = result?.data;

    if (!response.ok || result?.code !== '00000' || !payment) {
      console.error('OPay status check failed:', {
        httpStatus: response.status,
        code: result?.code
      });

      return send(res, 502, {
        success: false,
        status: 'UNKNOWN',
        message: 'Unable to verify payment with OPay.'
      });
    }

    // Never accept a different reference, amount or currency.
    const amountMatches =
      Number(payment.amount?.total) === Number(order.amount_kobo);

    const validPayment =
      payment.reference === reference &&
      payment.status === 'SUCCESS' &&
      payment.amount?.currency === 'NGN' &&
      order.currency === 'NGN' &&
      amountMatches;

    if (!validPayment) {
      return send(res, 200, {
        success: false,
        status: payment.status || 'UNKNOWN',
        reference,
        message: 'Payment has not been confirmed.'
      });
    }

    // Update only the matching pending OPay order.
    const updated = await supabaseRequest(
      `orders?reference=eq.${encodeURIComponent(reference)}&payment_method=eq.opay&payment_status=eq.pending`,
      {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          payment_status: 'paid',
          order_status: 'paid'
        })
      }
    );

    if (!Array.isArray(updated) || !updated.length) {
      // Check whether another request already completed the update.
      const check = await supabaseRequest(
        `orders?reference=eq.${encodeURIComponent(reference)}&select=payment_status`
      );

      if (check?.[0]?.payment_status !== 'paid') {
        throw new Error('Could not update the confirmed order.');
      }
    }

    return send(res, 200, {
      success: true,
      status: 'SUCCESS',
      reference,
      message: 'Payment successfully verified.'
    });

  } catch (error) {
    console.error('OPay verification error:', error.message);

    return send(res, 500, {
      success: false,
      message: 'Payment verification failed. Please try again.'
    });
  }
}
