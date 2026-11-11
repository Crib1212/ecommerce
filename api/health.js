
const { supabaseRequest } = require("../lib/supabase");

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    try {
        await supabaseRequest("orders?select=id&limit=1");

        return res.status(200).json({
            success: true,
            message: "WittyFare database connection successful."
        });

    } catch (error) {
        console.error("Database connection test failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Database connection failed. Check your Vercel environment variables and Supabase orders table."
        });
    }
};

