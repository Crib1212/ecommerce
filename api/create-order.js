
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
    return typeof value === 'string'
        ? value.trim().slice(0, max)
        : '';
}

async function loadCatalogue() {
    const file = path.join(process.cwd(), 'product.json');
    const raw = await readFile(file, 'utf8');
    const catalogue = JSON.parse(raw);

    if (!Array.isArray(catalogue)) {
        throw new Error('Invalid product catalogue.');
    }

    return catalogue;
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

        if (
            !Array.isArray(items) ||
            items.length < 1 ||
            items.length > 50
        ) {
            return send(res, 400, {
                success: false,
                message: 'Invalid order items.'
            });
        }

        const catalogue = await loadCatalogue();

        const byId = new Map(
            catalogue.map(product => [
                String(product.id),
                product
            ])
        );

        let totalNaira = 0;
        const purchased = [];
        const stockRequested = new Map();

        for (const item of items) {
            const id = cleanText(
                String(item?.id ?? ''),
                160
            );

            const sku = cleanText(item?.sku, 100);

            const quantity = Number(item?.quantity);

            if (
                !id ||
                !Number.isSafeInteger(quantity) ||
                quantity < 1 ||
                quantity > 1000
            ) {
                return send(res, 400, {
                    success: false,
                    message: 'Invalid product quantity or ID.'
                });
            }

            const product = byId.get(id);

            if (!product) {
                return send(res, 400, {
                    success: false,
                    message: 'A product in your cart is unavailable.'
                });
            }

            const variants = Array.isArray(product.variants)
                ? product.variants
                : [];

            const hasVariants = product.hasVariants === true ||
                variants.length > 0;

            let selectedVariant = null;
            let price;
            let itemName;
            let stock;

            if (hasVariants) {
                if (!variants.length || !sku) {
                    return send(res, 400, {
                        success: false,
                        message: `Please select a valid variant for ${product.name}.`
                    });
                }

                selectedVariant = variants.find(
                    variant => String(variant.sku) === sku
                );

                if (!selectedVariant) {
                    return send(res, 400, {
                        success: false,
                        message: `The selected variant for ${product.name} is invalid.`
                    });
                }

                price = Number(selectedVariant.price);
                itemName = String(
                    selectedVariant.name || product.name
                );

                stock = selectedVariant.stock;
            } else {
                if (sku) {
                    return send(res, 400, {
                        success: false,
                        message: 'Unexpected product variant.'
                    });
                }

                price = Number(product.price);
                itemName = String(product.name || id);
                stock = product.stock;
            }

            if (
                !Number.isSafeInteger(price) ||
                price < 1
            ) {
                throw new Error(
                    `Invalid catalogue price for product ${id}.`
                );
            }

            const itemKey = `${id}::${sku || 'default'}`;

            const previousQuantity =
                stockRequested.get(itemKey)?.quantity || 0;

            const combinedQuantity = previousQuantity + quantity;

            if (stock !== undefined && stock !== null) {
                const availableStock = Number(stock);

                if (
                    !Number.isSafeInteger(availableStock) ||
                    availableStock < 0
                ) {
                    throw new Error(
                        `Invalid catalogue stock for ${id}.`
                    );
                }

                if (combinedQuantity > availableStock) {
                    return send(res, 409, {
                        success: false,
                        message: `Insufficient stock for ${itemName}. Available: ${availableStock}.`
                    });
                }
            }

            stockRequested.set(itemKey, {
                quantity: combinedQuantity
            });

            const lineTotal = price * quantity;

            if (!Number.isSafeInteger(lineTotal)) {
                return send(res, 400, {
                    success: false,
                    message: 'Order amount is too large.'
                });
            }

            totalNaira += lineTotal;

            if (!Number.isSafeInteger(totalNaira)) {
                return send(res, 400, {
                    success: false,
                    message: 'Invalid order total.'
                });
            }

            purchased.push({
                id,
                sku: sku || null,
                name: String(product.name || id),
                variantName: selectedVariant
                    ? itemName
                    : null,
                quantity,
                unitPrice: price,
                lineTotal
            });
        }

        if (
            totalNaira < 1 ||
            totalNaira > 100000000
        ) {
            return send(res, 400, {
                success: false,
                message: 'Order amount is outside the permitted limit.'
            });
        }

        const reference =
            `WFBT${Date.now()}${randomBytes(5).toString('hex').toUpperCase()}`;

        const savedOrder = await supabaseRequest('orders', {
            method: 'POST',
            headers: {
                Prefer: 'return=representation'
            },
            body: JSON.stringify({
                reference,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                items: purchased,
                amount_kobo: totalNaira * 100,
                currency: 'NGN',
                payment_method: 'bank_transfer',
                payment_status: 'pending',
                order_status: 'pending'
            })
        });

        if (!Array.isArray(savedOrder) || !savedOrder[0]) {
            throw new Error('Order was not saved.');
        }

        return send(res, 201, {
            success: true,
            message: 'Order saved successfully.',
            reference,
            amountNaira: totalNaira,
            paymentStatus: 'pending'
        });

    } catch (error) {
        console.error(
            'Create order error:',
            error.message
        );

        return send(res, 500, {
            success: false,
            message: 'Unable to save your order. Please try again.'
        });
    }
}

