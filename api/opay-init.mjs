import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const SITE_URL = 'https://www.wittyfare.com';
const API_URLS = {
  sandbox: 'https://testapi.opaycheckout.com/api/v1/international/cashier/create',
  production: 'https://liveapi.opaycheckout.com/api/v1/international/cashier/create'
};

function send(res, status, payload) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(payload);
}

function cleanText(value, max = 160) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function loadCatalogue() {
  const file = path.join(process.cwd(), 'product.json');
  const raw = await readFile(file, 'utf8');
  const catalogue = JSON.parse(raw);
  if (!Array.isArray(catalogue)) throw new Error('product.json must be a JSON array.');

  const ids = new Set();
  for (const product of catalogue) {
    const id = String(product?.id ?? '').trim();
    if (!id) throw new Error('Every product in product.json must have an id.');
    if (ids.has(id)) throw new Error(`Duplicate product ID in product.json: ${id}`);
    ids.add(id);
    if (!Number.isSafeInteger(Number(product.price)) || Number(product.price) < 0) {
      throw new Error(`Product ${id} has an invalid price.`);
    }
  }
  return catalogue;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { success: false, message: 'Method not allowed.' });
  }

  const publicKey = process.env.OPAY_PUBLIC_KEY;
  const merchantId = process.env.OPAY_MERCHANT_ID;
  const env = String(process.env.OPAY_ENV || 'sandbox').toLowerCase();
  const callbackUrl = process.env.OPAY_CALLBACK_URL || `${SITE_URL}/api/opay-callback`;

  if (!publicKey || !merchantId) {
    return send(res, 500, { success: false, message: 'OPay is not configured on the server.' });
  }
  if (!API_URLS[env]) {
    return send(res, 500, { success: false, message: 'OPAY_ENV must be sandbox or production.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const customerName = cleanText(body?.customerName, 100);
    const customerEmail = cleanText(body?.customerEmail, 180).toLowerCase();
    const customerPhone = cleanText(body?.customerPhone, 30);
    const items = body?.items;

    if (!customerName || !/^\S+@\S+\.\S+$/.test(customerEmail) || !customerPhone) {
      return send(res, 400, { success: false, message: 'Enter your name, valid email, and phone number.' });
    }
    if (!Array.isArray(items) || items.length < 1 || items.length > 50) {
      return send(res, 400, { success: false, message: 'Your cart is empty or contains too many items.' });
    }

    const catalogue = await loadCatalogue();
    const byId = new Map(catalogue.map(p => [String(p.id), p]));
    let totalNaira = 0;
    const purchased = [];

    for (const item of items) {
      const id = cleanText(String(item?.id ?? ''), 160);
      const quantity = Number(item?.quantity);
      if (!id || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) {
        return send(res, 400, { success: false, message: 'A cart item has an invalid product ID or quantity.' });
      }
      const product = byId.get(id);
      if (!product) return send(res, 400, { success: false, message: `Product not found: ${id}` });
      const price = Number(product.price);
      totalNaira += price * quantity;
      purchased.push({ id, name: String(product.name || id), quantity, unitPrice: price });
    }

    if (!Number.isSafeInteger(totalNaira) || totalNaira < 1 || totalNaira > 100000000) {
      return send(res, 400, { success: false, message: 'The order total is invalid.' });
    }

    // The reference identifies the attempted payment. Durable order storage and
    // payment-status verification must be added before production use.
    const reference = `WF${Date.now()}${randomBytes(5).toString('hex').toUpperCase()}`;
    const productSummary = purchased.length === 1
      ? purchased[0].name
      : `${purchased[0].name} and ${purchased.length - 1} other item(s)`;

    const opayPayload = {
      country: 'NG',
      reference,
      amount: { currency: 'NGN', total: totalNaira * 100 },
      returnUrl: `${SITE_URL}/checkout.html?opay_return=1`,
      callbackUrl,
      cancelUrl: `${SITE_URL}/checkout.html?opay_cancel=1`,
      expireAt: 30,
      customerVisitSource: 'BROWSER',
      userInfo: {
        userName: customerName,
        userEmail: customerEmail,
        userMobile: customerPhone
      },
      product: {
        name: 'WittyFare order',
        description: productSummary.slice(0, 250)
      }
    };

    const opayResponse = await fetch(API_URLS[env], {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${publicKey}`,
        MerchantId: merchantId,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(opayPayload),
      signal: AbortSignal.timeout(15000)
    });

    let result;
    try { result = await opayResponse.json(); }
    catch { return send(res, 502, { success: false, message: 'OPay returned an unreadable response.' }); }

    const checkoutUrl = result?.data?.cashierUrl;
    if (!opayResponse.ok || result?.code !== '00000' || typeof checkoutUrl !== 'string' || !/^https:\/\//i.test(checkoutUrl)) {
      console.error('OPay create-payment failure', { httpStatus: opayResponse.status, code: result?.code, message: result?.message });
      return send(res, 502, { success: false, message: 'OPay could not start this payment. Please try again.' });
    }

    // NOTE: this response is not a durable order database. Persist the reference,
    // customer, item snapshot, amount and pending status before production use.
    return send(res, 200, {
      success: true,
      checkoutUrl,
      paymentReference: reference,
      amountNaira: totalNaira,
      orderStatus: 'pending'
    });
  } catch (error) {
    console.error('OPay initialization error:', error?.message || 'Unknown error');
    if (String(error?.message || '').startsWith('Duplicate product ID') || String(error?.message || '').includes('product.json')) {
      return send(res, 500, { success: false, message: 'The product catalogue needs correction before checkout can continue.' });
    }
    return send(res, 500, { success: false, message: 'Unable to start payment right now. Please try again.' });
  }
}
