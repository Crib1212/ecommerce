
import { supabaseRequest } from './_lib/supabase.js';
import { verifyAdminSession } from './_lib/admin-auth.js';

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

    if (!verifyAdminSession(req)) {
        return send(res, 401, {
            success: false,
            message: 'Please log in as administrator.'
        });
    }

    try {
        const orders = await supabaseRequest(
            'orders?select=reference,customer_name,customer_email,customer_phone,items,amount_kobo,currency,payment_method,payment_status,order_status,created_at&payment_status=eq.pending&payment_method=eq.bank_transfer&order=created_at.desc',
            { method: 'GET' }
        );

        return send(res, 200, {
            success: true,
            orders
        });

    } catch (error) {
        console.error('Admin orders error:', error.message);

        return send(res, 500, {
            success: false,
            message: 'Unable to retrieve orders.'
        });
    }
}

