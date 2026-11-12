
import {
    createHmac,
    timingSafeEqual
} from 'node:crypto';

const COOKIE_NAME = 'wittyfare_admin_session';
const SESSION_DURATION = 8 * 60 * 60;

function getSecret() {
    const secret = process.env.ADMIN_SESSION_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error('ADMIN_SESSION_SECRET must contain at least 32 characters.');
    }

    return secret;
}

function sign(value) {
    return createHmac('sha256', getSecret())
        .update(value)
        .digest('base64url');
}

export function createAdminSessionToken() {
    const now = Math.floor(Date.now() / 1000);

    const payload = {
        role: 'admin',
        iat: now,
        exp: now + SESSION_DURATION
    };

    const encoded = Buffer
        .from(JSON.stringify(payload))
        .toString('base64url');

    return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminSession(req) {
    try {
        const cookieHeader = req.headers.cookie || '';

        const cookie = cookieHeader
            .split(';')
            .map(part => part.trim())
            .find(part => part.startsWith(`${COOKIE_NAME}=`));

        if (!cookie) return false;

        const token = cookie.slice(COOKIE_NAME.length + 1);
        const parts = token.split('.');

        if (parts.length !== 2) return false;

        const [encoded, signature] = parts;
        const expected = sign(encoded);

        const actualBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expected);

        if (
            actualBuffer.length !== expectedBuffer.length ||
            !timingSafeEqual(actualBuffer, expectedBuffer)
        ) {
            return false;
        }

        const payload = JSON.parse(
            Buffer.from(encoded, 'base64url').toString('utf8')
        );

        const now = Math.floor(Date.now() / 1000);

        return (
            payload.role === 'admin' &&
            Number.isInteger(payload.exp) &&
            payload.exp > now &&
            payload.iat <= now
        );

    } catch {
        return false;
    }
}

export function adminSessionCookie(token) {
    return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION}`;
}

export function clearAdminSessionCookie() {
    return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

