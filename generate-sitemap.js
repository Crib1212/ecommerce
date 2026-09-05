const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, 'product.json');
const sitemapPath = path.join(__dirname, 'sitemap.xml');

const products = JSON.parse(
    fs.readFileSync(productsPath, 'utf8')
);

const baseURL = 'https://www.wittyfare.com';

const urls = [];

/* Homepage */
urls.push(`
    <url>
        <loc>${baseURL}/</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
`);

/* Individual products */
products.forEach(product => {

    if (!product.id) return;

    urls.push(`
    <url>
        <loc>${baseURL}/product/?id=${encodeURIComponent(product.id)}</loc>
        <changefreq>weekly</changefreq>
        <priority>${
            product.category === 'farm-packages'
                ? '1.0'
                : '0.9'
        }</priority>
    </url>
    `);

});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

fs.writeFileSync(
    sitemapPath,
    sitemap.trim() + '\n',
    'utf8'
);

console.log(
    `Sitemap generated successfully: ${products.length} products`
);