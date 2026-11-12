
import { verifyAdminSession } from './_lib/admin-auth.js';

export default function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({
            success: false
        });
    }

    if (!verifyAdminSession(req)) {
        return res.status(401).json({
            success: false,
            authenticated: false
        });
    }

    return res.status(200).json({
        success: true,
        authenticated: true
    });
}

