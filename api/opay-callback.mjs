import { supabaseRequest } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      status: 'method_not_allowed'
    });
  }

  try {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({
        status: 'invalid_payload'
      });
    }

    const reference = typeof body.reference === 'string'
      ? body.reference.trim()
      : '';

    if (!/^[A-Za-z0-9_-]{6,100}$/.test(reference)) {
      return res.status(400).json({
        status: 'invalid_reference'
      });
    }

    const orders = await supabaseRequest(
      `orders?reference=eq.${encodeURIComponent(reference)}&payment_method=eq.opay&select=reference,payment_status`
    );

    if (!Array.isArray(orders) || !orders.length) {
      console.log('OPay callback: order not found', reference);

      return res.status(200).json({
        status: 'received',
        verified: false
      });
    }

    console.log('OPay callback received', {
      reference,
      receivedAt: new Date().toISOString()
    });

    // A callback is only a notification.
    // Payment must be independently verified through opay-verify.mjs.
    return res.status(200).json({
      status: 'received',
      verified: false
    });

  } catch (error) {
    console.error('OPay callback error:', error.message);

    return res.status(500).json({
      status: 'server_error'
    });
  }
}
