const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, 'product.json');
const sitemapPath = path.join(__dirname, 'sitemap.xml');
const productPagesPath = path.join(__dirname, 'product');

const products = JSON.parse(
    fs.readFileSync(productsPath, 'utf8')
);

const baseURL = 'https://www.wittyfare.com';

const urls = [];


/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


function cleanDescription(product) {
    const description =
        product.description ||
        `Buy ${product.name || 'quality farm product'} from Wittyfare Agrovet & Farms.`;

    return String(description)
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 160);
}


function getImageURL(product) {

    if (!product.image) {
        return `${baseURL}/images/logo.png`;
    }

    const image = String(product.image);

    if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
    }

    if (image.startsWith('/')) {
        return `${baseURL}${image}`;
    }

    if (image.startsWith('images/')) {
        return `${baseURL}/${image}`;
    }

    return `${baseURL}/images/${image}`;
}


function getPrice(product) {

    const rawPrice =
        product.price ??
        product.amount ??
        0;

    const numericPrice = String(rawPrice)
        .replace(/[^\d.]/g, '');

    return numericPrice || '0';
}


function getProductURL(product) {
    return `${baseURL}/product/${encodeURIComponent(product.slug)}/`;
}


/* =========================================================
   HOMEPAGE
========================================================= */

urls.push(`
    <url>
        <loc>${baseURL}/</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
`);


/* =========================================================
   GENERATE INDIVIDUAL PRODUCT PAGES
========================================================= */

products.forEach(product => {

    if (!product.slug) {
        return;
    }


    const productName =
        product.name ||
        'Wittyfare Product';

    const category =
        product.category ||
        'Agrovet Product';

    const description =
        cleanDescription(product);

    const imageURL =
        getImageURL(product);

    const price =
        getPrice(product);

    const productURL =
        getProductURL(product);


    /* -----------------------------------------------------
       Product directory
    ----------------------------------------------------- */

    const productDirectory =
        path.join(
            productPagesPath,
            product.slug
        );


    fs.mkdirSync(
        productDirectory,
        { recursive: true }
    );


    /* -----------------------------------------------------
       Product structured data
    ----------------------------------------------------- */

    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",

        "name": productName,

        "description": description,

        "image": [
            imageURL
        ],

        "url": productURL,

        "sku":
            String(
                product.sku ||
                product.id ||
                product.slug
            ),

        "category": category,

        "brand": {
            "@type": "Brand",
            "name": "Wittyfare Agrovet & Farms"
        },

        "offers": {
            "@type": "Offer",

            "url": productURL,

            "priceCurrency": "NGN",

            "price": price,

            "availability":
                "https://schema.org/InStock",

            "seller": {
                "@type": "Organization",
                "name": "Wittyfare Agrovet & Farms"
            }
        }
    };


    /* -----------------------------------------------------
       Static HTML
    ----------------------------------------------------- */

    const html = `<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        ${escapeHtml(productName)}
        | ${escapeHtml(category)}
        | Wittyfare Agrovet & Farms
    </title>

    <meta
        name="description"
        content="${escapeHtml(description)}"
    >

    <meta
        name="robots"
        content="index, follow"
    >

    <link
        rel="canonical"
        href="${escapeHtml(productURL)}"
    >


    <!-- Open Graph -->

    <meta
        property="og:type"
        content="product"
    >

    <meta
        property="og:title"
        content="${escapeHtml(productName)} | Wittyfare Agrovet & Farms"
    >

    <meta
        property="og:description"
        content="${escapeHtml(description)}"
    >

    <meta
        property="og:image"
        content="${escapeHtml(imageURL)}"
    >

    <meta
        property="og:url"
        content="${escapeHtml(productURL)}"
    >

    <meta
        property="og:site_name"
        content="Wittyfare Agrovet & Farms"
    >


    <!-- Product structured data -->

    <script type="application/ld+json">
${JSON.stringify(productSchema, null, 4)}
    </script>


    <link
        rel="stylesheet"
        href="/styles.css"
    >

</head>


<body>

    <main class="product-page">

        <div class="product-image">

            <img
                src="${escapeHtml(imageURL)}"
                alt="${escapeHtml(productName)}"
                id="productImage"
            >

        </div>


        <div class="product-information">

            <span id="productCategory">
                ${escapeHtml(category)}
            </span>


            <h1 id="productName">
                ${escapeHtml(productName)}
            </h1>


            <div id="productPrice">
                ₦${escapeHtml(price)}
            </div>


            <p id="productDescription">
                ${escapeHtml(description)}
            </p>


            <button
                id="addProductToCart"
                type="button"
            >
                Add to Cart
            </button>


            <div id="productDetails">

                ${escapeHtml(
                    product.details ||
                    product.description ||
                    ''
                )}

            </div>

        </div>

    </main>


    <div id="relatedProducts"></div>


    <script src="/app.js"></script>

</body>

</html>`;


    /* -----------------------------------------------------
       Write product HTML
    ----------------------------------------------------- */

    const productHTMLPath =
        path.join(
            productDirectory,
            'index.html'
        );


    fs.writeFileSync(
        productHTMLPath,
        html,
        'utf8'
    );


    /* -----------------------------------------------------
       Add product to sitemap
    ----------------------------------------------------- */

    urls.push(`
    <url>
        <loc>${productURL}</loc>
        <changefreq>weekly</changefreq>
        <priority>${
            product.category === 'farm-packages'
                ? '1.0'
                : '0.9'
        }</priority>
    </url>
    `);

});


/* =========================================================
   CREATE SITEMAP
========================================================= */

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${urls.join('\n')}
</urlset>
`;


fs.writeFileSync(
    sitemapPath,
    sitemap.trim() + '\n',
    'utf8'
);


console.log(
    `Generated ${products.filter(p => p.slug).length} product pages`
);

console.log(
    `Sitemap generated successfully`
);