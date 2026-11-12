
import { supabaseRequest } from './_lib/supabase.js';
import { verifyAdminSession } from './_lib/admin-auth.js';

function send(res, status, data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(status).json(data);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return send(res, 405, {
            success: false,
            message: 'Method not allowed.'
        });
    }

    if (!verifyAdminSession(req)) {
        return send(res, 401, {
            success: false,
            message: 'Administrator login required.'
        });
    }

    try {
        const body = typeof req.body === 'string'
            ? JSON.parse(req.body)
            : req.body;

        const reference = body?.reference;
        const action = body?.action;
        const note = typeof body?.note === 'string'
            ? body.note.trim().slice(0, 500)
            : '';

        if (
            typeof reference !== 'string' ||
            !/^[A-Za-z0-9_-]{6,100}$/.test(reference)
        ) {
            return send(res, 400, {
                success: false,
                message: 'Invalid order reference.'
            });
        }

        if (!['approve', 'reject'].includes(action)) {
            return send(res, 400, {
                success: false,
                message: 'Choose approve or reject.'
            });
        }

        if (action === 'reject' && !note) {
            return send(res, 400, {
                success: false,
                message: 'Enter a reason for rejecting this payment.'
            });
        }

        const result = await supabaseRequest(
            'rpc/admin_review_bank_transfer',
            {
                method: 'POST',
                body: JSON.stringify({
                    p_reference: reference,
                    p_action: action,
                    p_note: note || 'Bank credit confirmed by administrator.'
                })
            }
        );

        if (!result?.success) {
            return send(res, 409, {
                success: false,
                message: result?.message ||
                    'Order not found or already reviewed.'
            });
        }

        return send(res, 200, {
            success: true,
            message: action === 'approve'
                ? 'Bank transfer approved and audit record saved.'
                : 'Payment rejected and audit record saved.',
            order: result.order
        });

    } catch (error) {
        console.error('Payment verification error:', error.message);

        return send(res, 500, {
            success: false,
            message: 'Unable to update payment. Please try again.'
        });
    }
}

