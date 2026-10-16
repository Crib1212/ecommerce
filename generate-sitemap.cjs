const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, 'product.json');
const templatePath = path.join(__dirname, 'product', 'index.html');
const sitemapPath = path.join(__dirname, 'sitemap.xml');
const productDirectory = path.join(__dirname, 'product');

const baseURL = 'https://www.wittyfare.com';

const products = JSON.parse(
    fs.readFileSync(productsPath, 'utf8')
);

const template = fs.readFileSync(
    templatePath,
    'utf8'
);

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


function escapeJson(value) {
    return JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}


function getDescription(product) {

    return String(
        product.description ||
        `Buy ${product.name || 'quality agrovet product'} from Wittyfare Agrovet & Farms.`
    )
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 160);
}


function getImageURL(product) {

    if (!product.image) {
        return `${baseURL}/images/logo.png`;
    }

    const image = String(product.image);

    if (
        image.startsWith('http://') ||
        image.startsWith('https://')
    ) {
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

    return String(rawPrice)
        .replace(/[^\d.]/g, '') || '0';
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
   GENERATE PRODUCT PAGES
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
        getDescription(product);

    const imageURL =
        getImageURL(product);

    const price =
        getPrice(product);

    const productURL =
        getProductURL(product);


    /* =====================================================
       PRODUCT SCHEMA
    ===================================================== */

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

                "name":
                    "Wittyfare Agrovet & Farms"

            }

        }

    };


    /* =====================================================
       BREADCRUMB SCHEMA
    ===================================================== */

    const breadcrumbSchema = {

        "@context": "https://schema.org",

        "@type": "BreadcrumbList",

        "itemListElement": [

            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": `${baseURL}/`
            },

            {
                "@type": "ListItem",
                "position": 2,
                "name": category,
                "item":
                    `${baseURL}/category/${encodeURIComponent(category)}/`
            },

            {
                "@type": "ListItem",
                "position": 3,
                "name": productName,
                "item": productURL
            }

        ]

    };


    /* =====================================================
       START WITH YOUR REAL PRODUCT PAGE TEMPLATE
    ===================================================== */

    let html = template;


    /* =====================================================
       FIX ROOT-RELATIVE PATHS
    ===================================================== */

    html = html
        .replaceAll('../style.css', '/style.css')
        .replaceAll('../app.js', '/app.js')
        .replaceAll('../images/', '/images/')
        .replaceAll('../index.html', '/')
        .replaceAll('../checkout.html', '/checkout.html')
        .replaceAll('../category/', '/category/');


    /* =====================================================
       TITLE
    ===================================================== */

    html = html.replace(
        /<title>[\s\S]*?<\/title>/,
        `<title>${escapeHtml(productName)} | ${escapeHtml(category)} | Wittyfare Agrovet & Farms</title>`
    );


    /* =====================================================
       META DESCRIPTION
    ===================================================== */

    html = html.replace(
        /<meta id="metaDescription"[\s\S]*?>/,
        `<meta id="metaDescription"
      name="description"
      content="${escapeHtml(description)}">`
    );


    /* =====================================================
       KEYWORDS
    ===================================================== */

    const keywords =
        `${productName}, ${category}, agrovet products Abuja, farm products Abuja, Wittyfare Agrovet`;

    html = html.replace(
        /<meta id="metaKeywords"[\s\S]*?>/,
        `<meta id="metaKeywords"
      name="keywords"
      content="${escapeHtml(keywords)}">`
    );


    /* =====================================================
       CANONICAL
    ===================================================== */

    html = html.replace(
        /<link id="canonicalUrl"[\s\S]*?>/,
        `<link id="canonicalUrl"
      rel="canonical"
      href="${escapeHtml(productURL)}">`
    );


    /* =====================================================
       PRODUCT IMAGE
    ===================================================== */

    html = html.replace(
        /<img id="productImage"[\s\S]*?>/,
        `<img id="productImage"
             src="${escapeHtml(imageURL)}"
             alt="${escapeHtml(productName)}"
             loading="lazy">`
    );


    /* =====================================================
       CATEGORY
    ===================================================== */

    html = html.replace(
        /<span id="productCategory"[\s\S]*?>[\s\S]*?<\/span>/,
        `<span id="productCategory"
              class="product-category">

                ${escapeHtml(category)}

            </span>`
    );


    /* =====================================================
       PRODUCT NAME
    ===================================================== */

    html = html.replace(
        /<h1 id="productName">[\s\S]*?<\/h1>/,
        `<h1 id="productName">

                ${escapeHtml(productName)}

            </h1>`
    );


    /* =====================================================
       PRICE
    ===================================================== */

    html = html.replace(
        /<div id="productPrice"[\s\S]*?>[\s\S]*?<\/div>/,
        `<div id="productPrice"
             class="product-page-price">

                ₦${escapeHtml(price)}

            </div>`
    );


    /* =====================================================
       DESCRIPTION
    ===================================================== */

    html = html.replace(
        /<p id="productDescription"[\s\S]*?>[\s\S]*?<\/p>/,
        `<p id="productDescription"
               class="product-page-description">

                ${escapeHtml(description)}

            </p>`
    );


    /* =====================================================
       PRODUCT DETAILS
    ===================================================== */

    const details =
        product.details ||
        product.description ||
        description;

    html = html.replace(
        /<div id="productDetails">[\s\S]*?<\/div>/,
        `<div id="productDetails">

                ${escapeHtml(details)}

            </div>`
    );


    /* =====================================================
       REMOVE OLD PRODUCT-PAGE STARTUP
       
       app.js already handles product initialization
       after product.json has loaded.
    ===================================================== */

    html = html.replace(
        /<!-- =====================================================\s*PRODUCT PAGE STARTUP[\s\S]*?<\/script>\s*<\/body>/,
        '</body>'
    );


    /* =====================================================
       ADD PRODUCT JSON-LD
    ===================================================== */

    const structuredData = `
<script type="application/ld+json">
${escapeJson(productSchema)}
</script>

<script type="application/ld+json">
${escapeJson(breadcrumbSchema)}
</script>
`;


    html = html.replace(
        '</head>',
        `${structuredData}\n</head>`
    );


    /* =====================================================
       CREATE PRODUCT DIRECTORY
    ===================================================== */

    const productPath =
        path.join(
            productDirectory,
            product.slug
        );

    fs.mkdirSync(
        productPath,
        { recursive: true }
    );


    /* =====================================================
       WRITE PRODUCT PAGE
    ===================================================== */

    fs.writeFileSync(
        path.join(productPath, 'index.html'),
        html,
        'utf8'
    );


    /* =====================================================
       ADD TO SITEMAP
    ===================================================== */

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
    `Generated ${
        products.filter(product => product.slug).length
    } product pages`
);

console.log(
    'Sitemap generated successfully'
);