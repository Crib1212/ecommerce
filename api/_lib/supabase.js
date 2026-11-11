
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

async function supabaseRequest(path, options = {}) {
    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
        throw new Error("Supabase environment variables are missing.");
    }

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${path}`,
        {
            ...options,
            headers: {
                apikey: SUPABASE_SECRET_KEY,
                Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Supabase error:", response.status, errorText);
        throw new Error("Database request failed.");
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

module.exports = { supabaseRequest };

