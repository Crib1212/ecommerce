
import { createHmac } from 'node:crypto';
import { supabaseRequest } from './_lib/supabase.js';

const ENV = process.env.OPAY_ENV || 'sandbox';

const BASE_URL = ENV === 'production'
  ? 'https://liveapi.opaycheckout.com'
  : 'https://testapi.opaycheckout.com';

function send(res, status, data) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(data);
}

function signRequest(body) {
  const secret = process.env.OPAY_SECRET_KEY;

  if (!secret) {
    throw new Error('OPAY_SECRET_KEY is missing.');
  }

  return createHmac('sha512', secret)
    .update(JSON.stringify(body))
    .digest('hex');
}

async function getOrder(reference) {
  const rows = await supabaseRequest(
    `orders?reference=eq.${encodeURIComponent(reference)}&payment_method=eq.opay&select=reference,amount_kobo,currency,payment_method,payment_status,order_status`
  );

  return Array.isArray(rows) ? rows[0] : null;
}

export async function verifyAndUpdateOrder(reference) {
  if (!reference || typeof reference !== 'string') {
    throw new Error('Invalid payment reference.');
  }

  const merchantId = process.env.OPAY_MERCHANT_ID;

  if (!merchantId) {
    throw new Error('OPAY_MERCHANT_ID is missing.');
  }

  const order = await getOrder(reference);

  if (!order) {
    return {
      success: false,
      status: 'ORDER_NOT_FOUND',
      reference
    };
  }

  if (
    order.payment_status === 'paid' &&
    order.order_status === 'paid'
  ) {
    return {
      success: true,
      status: 'SUCCESS',
      reference,
      alreadyPaid: true
    };
  }

  if (
    order.payment_method !== 'opay' ||
    order.currency !== 'NGN' ||
    !Number.isSafeInteger(Number(order.amount_kobo)) ||
    Number(order.amount_kobo) <= 0
  ) {
    throw new Error('Order payment details are invalid.');
  }

  const requestBody = {
    country: 'NG',
    reference
  };

  const signature = signRequest(requestBody);

  const response = await fetch(
    `${BASE_URL}/api/v1/international/cashier/status`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${signature}`,
        MerchantId: merchantId
      },
      body: JSON.stringify(requestBody)
    }
  );

  const result = await response.json().catch(() => null);

  if (!response.ok || !result) {
    throw new Error('Unable to query OPay payment status.');
  }

  if (result.code !== '00000' || !result.data) {
    throw new Error(
      `OPay status query failed: ${result.message || result.code}`
    );
  }

  const payment = result.data;

  if (payment.reference !== reference) {
    throw new Error('OPay reference mismatch.');
  }

  const status = String(payment.status || '').toUpperCase();

  if (status !== 'SUCCESS') {
    return {
      success: false,
      status,
      reference,
      message: payment.failureReason || 'Payment is not successful.'
    };
  }

  const paidAmount = Number(payment.amount?.total);
  const expectedAmount = Number(order.amount_kobo);

  if (
    payment.amount?.currency !== 'NGN' ||
    !Number.isSafeInteger(paidAmount) ||
    paidAmount !== expectedAmount
  ) {
    throw new Error('Payment amount or currency mismatch.');
  }

  const updated = await supabaseRequest(
    `orders?reference=eq.${encodeURIComponent(reference)}&payment_method=eq.opay&payment_status=eq.pending`,
    {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation'
      },
      body: {
        payment_status: 'paid',
        order_status: 'paid'
      }
    }
  );

  if (!Array.isArray(updated) || updated.length === 0) {
    const latestOrder = await getOrder(reference);

    if (
      latestOrder?.payment_status !== 'paid' ||
      latestOrder?.order_status !== 'paid'
    ) {
      throw new Error('Could not update the order payment status.');
    }
  }

  console.log('OPay payment verified:', reference);

  return {
    success: true,
    status: 'SUCCESS',
    reference,
    amount_kobo: paidAmount
  };
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

    const result = await verifyAndUpdateOrder(reference);

    if (result.status === 'ORDER_NOT_FOUND') {
      return send(res, 404, result);
    }

    return send(res, 200, result);

  } catch (error) {
    console.error('OPay verification error:', error.message);

    return send(res, 502, {
      success: false,
      message: 'Payment verification temporarily unavailable.'
    });
  }
}

