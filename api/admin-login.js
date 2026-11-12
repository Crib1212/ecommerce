
import {
    scrypt as scryptCallback,
    timingSafeEqual,
    createHmac
} from 'node:crypto';

import { promisify } from 'node:util';

import {
    createAdminSessionToken,
    adminSessionCookie
} from './_lib/admin-auth.js';

import { supabaseRequest } from './_lib/supabase.js';

const scrypt = promisify(scryptCallback);

function send(res, status, payload) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');

    return res.status(status).json(payload);
}

async function verifyPassword(password, storedHash) {
    const parts = storedHash.split('$');

    if (parts.length !== 2) return false;

    const [salt, expectedHex] = parts;

    if (
        !/^[a-f0-9]{32}$/i.test(salt) ||
        !/^[a-f0-9]{128}$/i.test(expectedHex)
    ) {
        return false;
    }

    const expected = Buffer.from(expectedHex, 'hex');
    const actual = await scrypt(password, salt, 64);

    return timingSafeEqual(actual, expected);
}

function getClientIp(req) {
    const ip = req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for']?.split(',')[0]?.trim();

    return typeof ip === 'string' && ip.length <= 100
        ? ip
        : null;
}

function hashIp(ip) {
    return createHmac(
        'sha256',
        process.env.ADMIN_SESSION_SECRET
    ).update(ip).digest('hex');
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
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;

        if (!passwordHash) {
            return send(res, 500, {
                success: false,
                message: 'Admin login is not configured.'
            });
        }

        const body = typeof req.body === 'string'
            ? JSON.parse(req.body)
            : req.body;

        const password = body?.password;

        if (
            typeof password !== 'string' ||
            password.length < 1 ||
            password.length > 256
        ) {
            return send(res, 400, {
                success: false,
                message: 'Enter a valid password.'
            });
        }

        const ip = getClientIp(req);

        if (!ip) {
            return send(res, 503, {
                success: false,
                message: 'Login temporarily unavailable.'
            });
        }

        const allowed = await supabaseRequest(
            'rpc/check_admin_login_rate_limit',
            {
                method: 'POST',
                body: JSON.stringify({
                    p_ip_hash: hashIp(ip)
                })
            }
        );

        if (allowed !== true) {
            return send(res, 429, {
                success: false,
                message: 'Too many login attempts. Try again after 15 minutes.'
            });
        }

        const valid = await verifyPassword(password, passwordHash);

        if (!valid) {
            return send(res, 401, {
                success: false,
                message: 'Incorrect administrator password.'
            });
        }

        const token = createAdminSessionToken();

        res.setHeader('Set-Cookie', adminSessionCookie(token));

        return send(res, 200, {
            success: true,
            message: 'Login successful.'
        });

    } catch (error) {
        console.error('Admin login error:', error.message);

        return send(res, 503, {
            success: false,
            message: 'Login service temporarily unavailable.'
        });
    }
}

