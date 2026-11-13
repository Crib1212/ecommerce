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
    const candidates = [
        path.resolve(process.cwd(), 'product.json'),
        new URL('../product.json', import.meta.url)
    ];

    for (const file of candidates) {
        try {
            const raw = await readFile(file, 'utf8');
            const catalogue = JSON.parse(raw);

            if (Array.isArray(catalogue)) {
                return catalogue;
            }
        } catch (error) {
            // Try the next catalogue location.
        }
    }

    throw new Error('Unable to load the product catalogue.');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return send(res, 405, {
            success: false,
            message: 'Method not allowed.'
        });
    }

    try {
        const body = typeof req.body === 'string'
            ? JSON.parse(req.body)
            : req.body;

        if (!body || typeof body !== 'object') {
            return send(res, 400, {
                success: false,
                message: 'Invalid order details.'
            });
        }

        const customerName = cleanText(body.customerName, 100);
        const customerEmail = cleanText(body.customerEmail, 180).toLowerCase();
        const customerPhone = cleanText(body.customerPhone, 30);
        const items = body.items;

        if (
            !customerName ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ||
            !customerPhone
        ) {
            return send(res, 400, {
                success: false,
                message: 'Please provide valid customer details.'
            });
        }

        if (!Array.isArray(items) || items.length < 1 || items.length > 100) {
            return send(res, 400, {
                success: false,
                message: 'Invalid order items.'
            });
        }

        const catalogue = await loadCatalogue();
        const byId = new Map(
            catalogue.map(product => [String(product.id), product])
        );

        let totalNaira = 0;
        const purchased = [];

        for (const item of items) {
            const id = cleanText(item?.id, 160);
            const sku = cleanText(item?.sku, 100);
            const quantity = Number(item?.quantity);

            if (
                !id ||
                !Number.isSafeInteger(quantity) ||
                quantity < 1 ||
                quantity > 10000
            ) {
                return send(res, 400, {
                    success: false,
                    message: 'Invalid product or quantity.'
                });
            }

            const product = byId.get(id);

            if (!product) {
                return send(res, 400, {
                    success: false,
                    message: `Product ${id} is unavailable.`
                });
            }

            let selectedVariant = null;
            let price;
            let purchasedName = product.name || id;

            if (Array.isArray(product.variants) && product.variants.length > 0) {
                if (!sku) {
                    return send(res, 400, {
                        success: false,
                        message: `Please select a variant for ${purchasedName}.`
                    });
                }

                selectedVariant = product.variants.find(
                    variant => String(variant.sku) === sku
                );

                if (!selectedVariant) {
                    return send(res, 400, {
                        success: false,
                        message: `The selected variant for ${purchasedName} is unavailable.`
                    });
                }

                price = Number(selectedVariant.price);
                purchasedName = `${purchasedName} - ${selectedVariant.name || sku}`;
            } else {
                if (sku) {
                    return send(res, 400, {
                        success: false,
                        message: `Invalid variant selection for ${purchasedName}.`
                    });
                }

                price = Number(product.price);
            }

            if (!Number.isSafeInteger(price) || price < 0) {
                throw new Error(`Invalid catalogue price for ${id}.`);
            }

            const lineTotal = price * quantity;

            if (!Number.isSafeInteger(lineTotal)) {
                throw new Error('Order amount is too large.');
            }

            totalNaira += lineTotal;

            if (!Number.isSafeInteger(totalNaira)) {
                throw new Error('Order total is too large.');
            }

            purchased.push({
                id,
                sku: selectedVariant ? String(selectedVariant.sku) : null,
                name: purchasedName,
                variantName: selectedVariant?.name || null,
                variantLabel: selectedVariant?.label || null,
                quantity,
                unitPrice: price,
                lineTotal
            });
        }

        const amountKobo = totalNaira * 100;

        if (!Number.isSafeInteger(amountKobo)) {
            throw new Error('Order amount exceeds the supported limit.');
        }

        const reference =
            `WFBT${Date.now()}${randomBytes(5).toString('hex').toUpperCase()}`;

        const orderData = {
            reference,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            subtotal: totalNaira,
            total_price: totalNaira,
            amount_kobo: amountKobo,
            payment_method: 'bank_transfer',
            payment_status: 'pending',
            order_status: 'pending',
            currency: 'NGN',
            customer: {
                name: customerName,
                email: customerEmail,
                phone: customerPhone
            },
            items: purchased
        };

        const saved = await supabaseRequest('orders', {
            method: 'POST',
            headers: {
                Prefer: 'return=representation'
            },
            body: JSON.stringify(orderData)
        });

        if (!Array.isArray(saved) || !saved[0]) {
            throw new Error('Supabase did not confirm that the order was saved.');
        }

        return send(res, 201, {
            success: true,
            reference,
            amountNaira: totalNaira,
            paymentStatus: 'pending'
        });

    } catch (error) {
        console.error('Create-order error:', error);

        return send(res, 500, {
            success: false,
            message: error.message || 'Unable to create order.'
        });
    }
}
