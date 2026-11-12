
import { clearAdminSessionCookie } from './_lib/admin-auth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(405).json({
            success: false,
            message: 'Method not allowed.'
        });
    }

    res.setHeader('Set-Cookie', clearAdminSessionCookie());
    res.setHeader('Cache-Control', 'no-store');

    return res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
    });
}

