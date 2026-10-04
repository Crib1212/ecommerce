const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const root = __dirname;

// Serve all normal files/folders
app.use(express.static(root));

// Clean product URLs
app.get("/product/:slug/", (req, res) => {
    res.sendFile(path.join(root, "product", "index.html"));
});

// Also support URL without trailing slash
app.get("/product/:slug", (req, res) => {
    res.sendFile(path.join(root, "product", "index.html"));
});

// Start server
app.listen(PORT, () => {
    console.log(`Wittyfare server running on port ${PORT}`);
});