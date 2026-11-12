
import { verifyAndUpdateOrder } from './opay-verify.mjs';

function send(res, status, data) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  return res.status(status).json(data);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');

    return send(res, 405, {
      status: 'method_not_allowed'
    });
  }

  try {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return send(res, 400, {
        status: 'invalid_payload'
      });
    }

    const payload = body.payload || body;

    const reference = typeof payload.reference === 'string'
      ? payload.reference.trim()
      : '';

    if (!/^[A-Za-z0-9_-]{6,100}$/.test(reference)) {
      return send(res, 400, {
        status: 'invalid_reference'
      });
    }

    console.log('OPay callback received:', {
      reference,
      notificationStatus: payload.status || 'unknown'
    });

    const result = await verifyAndUpdateOrder(reference);

    console.log('OPay callback verification:', {
      reference,
      verified: result.success,
      status: result.status
    });

    return send(res, 200, {
      status: 'received',
      verified: result.success,
      paymentStatus: result.status
    });

  } catch (error) {
    console.error('OPay callback error:', error.message);

    return send(res, 500, {
      status: 'verification_failed'
    });
  }
}

