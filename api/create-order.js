cat > api/create-order.js << 'EOF'
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { supabaseRequest } from './_lib/supabase.js';

function send(res, status, payload) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(status).json(payload);
}
function cleanText(v, max=160){ return typeof v==='string'?v.trim().slice(0,max):''; }

async function loadCatalogue() {
    const possiblePaths = [
        path.join(process.cwd(), 'product.json'),
        path.join(process.cwd(), '../product.json'),
        path.join(process.cwd(), 'shared/ecommerce/product.json'),
        '/vercel/path0/product.json'
    ];
    for (const p of possiblePaths) {
        try { 
            const raw = await readFile(p, 'utf8');
            const cat = JSON.parse(raw);
            if (Array.isArray(cat)) { console.log('Catalogue loaded from', p); return cat; }
        } catch(e){}
    }
    // Fallback to fetch from same file dir
    try {
        const file = new URL('../product.json', import.meta.url);
        const raw = await readFile(file, 'utf8');
        const cat = JSON.parse(raw);
        if (Array.isArray(cat)) return cat;
    } catch(e){}
    throw new Error('product.json not found - checked ' + possiblePaths.join(', '));
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return send(res, 405, { success: false, message: 'Method not allowed.' });
    }
    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (!body) return send(res, 400, { success: false, message: 'Invalid order details.' });

        const customerName = cleanText(body.customerName, 100);
        const customerEmail = cleanText(body.customerEmail, 180).toLowerCase();
        const customerPhone = cleanText(body.customerPhone, 30);
        const items = body.items;

        if (!customerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || !customerPhone) {
            return send(res, 400, { success: false, message: 'Please provide valid customer details.' });
        }
        if (!Array.isArray(items) || items.length < 1) {
            return send(res, 400, { success: false, message: 'Invalid order items.' });
        }

        const catalogue = await loadCatalogue();
        const byId = new Map(catalogue.map(p => [String(p.id), p]));
        let totalNaira = 0;
        const purchased = [];

        for (const item of items) {
            const id = cleanText(String(item?.id ?? ''), 160);
            const quantity = Number(item?.quantity);
            if (!id || !Number.isSafeInteger(quantity) || quantity < 1) return send(res, 400, { success: false, message: 'Invalid quantity' });
            const product = byId.get(id);
            if (!product) return send(res, 400, { success: false, message: `Product ${id} unavailable` });
            const price = Number(product.price);
            if (!Number.isSafeInteger(price)) throw new Error(`Invalid price for ${id}`);
            totalNaira += price * quantity;
            purchased.push({ id, name: product.name||id, quantity, unitPrice: price, lineTotal: price*quantity });
        }

        const reference = `WFBT${Date.now()}${randomBytes(5).toString('hex').toUpperCase()}`;
        const orderData = {
            reference: reference,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            subtotal: totalNaira,
            total_price: totalNaira,
            amount_kobo: totalNaira * 100,
            payment_method: 'bank_transfer',
            payment_status: 'pending',
            order_status: 'pending',
            currency: 'NGN',
            customer: { name: customerName, email: customerEmail, phone: customerPhone },
            items: purchased
        };

        console.log('Saving:', orderData.reference);
        const saved = await supabaseRequest('orders', {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify(orderData)
        });

        if (!Array.isArray(saved) || !saved[0]) throw new Error('Order not saved - empty response');

        return send(res, 201, { success: true, reference, amountNaira: totalNaira, paymentStatus: 'pending' });

    } catch (error) {
        console.error('Create-order 500:', error);
        return send(res, 500, { success: false, message: error.message || 'Server error' });
    }
}
EOF
