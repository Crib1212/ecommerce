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

function cleanText(value, max = 160) {
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function loadCatalogue() {
    const file = path.join(process.cwd(), 'product.json');
    const raw = await readFile(file, 'utf8');
    const catalogue = JSON.parse(raw);
    if (!Array.isArray(catalogue)) throw new Error('Invalid product catalogue.');
    return catalogue;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return send(res, 405, { success: false, message: 'Method not allowed.' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (!body || typeof body !== 'object') return send(res, 400, { success: false, message: 'Invalid order details.' });

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
        const byId = new Map(catalogue.map(product => [String(product.id), product]));
        let totalNaira = 0;
        const purchased = [];

        for (const item of items) {
            const id = cleanText(String(item?.id ?? ''), 160);
            const sku = cleanText(item?.sku, 100);
            const quantity = Number(item?.quantity);
            
            if (!id || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) {
                return send(res, 400, { success: false, message: 'Invalid product quantity or ID.' });
            }
            
            const product = byId.get(id);
            if (!product) {
                return send(res, 400, { success: false, message: 'A product in your cart is unavailable.' });
            }
            
            const price = Number(product.price);
            if (!Number.isSafeInteger(price) || price < 1) {
               
