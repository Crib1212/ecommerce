
/* =========================================================
   WITTYFARE AGROVET & FARMS
   COMPLETE PRODUCT PRICE GENERATOR
   Images + Variants + Search + Categories
   PDF + JPEG + PRINT
========================================================= */

const PRODUCT_FILE = "/product.json";
const LOGO_IMAGE = "/images/logo.png";

let allProducts = [];
let filteredProducts = [];
let selectedProducts = new Set();
let currentCategory = "all";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const priceList = document.getElementById("priceList");
const searchInput = document.getElementById("searchProduct");
const categoryFilter = document.getElementById("categoryFilter");
const productCount = document.getElementById("productCount");


/* =========================================================
   FORMAT PRICE
========================================================= */

function formatPrice(price) {
    return "₦" + Number(price || 0).toLocaleString("en-NG");
}


/* =========================================================
   PRODUCT IMAGE
========================================================= */

function getProductImage(product) {

    const image = product.image || LOGO_IMAGE;

    if (/^https?:\/\//i.test(image)) {
        return image;
    }

    return image.startsWith("/")
        ? image
        : "/" + image;
}


function createProductImage(product, size = 75) {

    const image = document.createElement("img");

    image.src = getProductImage(product);
    image.alt = product.name || "WittyFare product";

    image.style.cssText = `
        width:${size}px;
        height:${size}px;
        object-fit:contain;
        border-radius:8px;
        background:#ffffff;
        flex-shrink:0;
    `;

    image.onerror = function() {
        this.onerror = null;
        this.src = LOGO_IMAGE;
    };

    return image;
}


/* =========================================================
   CATEGORY NAMES
========================================================= */

function categoryName(category) {

    const names = {
        hybrid: "Hybrid",
        "day-old": "Day-Old Chicks",
        "day-old-chicks": "Day-Old Chicks",
        feed: "Feeds",
        feeds: "Feeds",
        drugs: "Veterinary Drugs",
        vaccines: "Vaccines",
        fish: "Fish Products",
        equipment: "Equipment",
        chemical: "Chemicals",
        chemicals: "Chemicals",
        "pet-store": "Pet Products",
        "farm-packages": "Farm Packages"
    };

    return names[String(category || "").toLowerCase()]
        || String(category || "Other").replace(/-/g, " ");
}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

    try {

        priceList.innerHTML = "<p>Loading products...</p>";

        const response = await fetch(
            PRODUCT_FILE + "?t=" + Date.now()
        );

        if (!response.ok) {
            throw new Error(
                "Could not load product.json. HTTP " +
                response.status
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Product JSON must contain an array.");
        }

        allProducts = data.filter(product => {

            if (!product || !product.name) return false;

            if (product.hasVariants === true) {

                return Array.isArray(product.variants) &&
                    product.variants.length > 0;

            }

            return Number(product.price) > 0;

        });

        filteredProducts = [...allProducts];

        renderProducts();

    } catch (error) {

        console.error("WittyFare:", error);

        priceList.innerHTML = `
            <p style="color:red;">
                Unable to load products.
                Check product.json and server.py.
            </p>
        `;

        productCount.textContent = "0 Products";

    }
}


/* =========================================================
   DISPLAY PRODUCTS
========================================================= */

function renderProducts() {

    priceList.innerHTML = "";

    if (!filteredProducts.length) {

        priceList.innerHTML = "<p>No products found.</p>";

        productCount.textContent = "0 Products";

        return;
    }

    const grouped = {};

    filteredProducts.forEach(product => {

        const category = categoryName(product.category);

        if (!grouped[category]) {
            grouped[category] = [];
        }

        grouped[category].push(product);

    });

    Object.keys(grouped).sort().forEach(category => {

        const heading = document.createElement("h3");

        heading.className = "category-title";
        heading.textContent = category;

        priceList.appendChild(heading);

        grouped[category].forEach(product => {

            const card = document.createElement("div");

            card.className = "price-product";

            card.style.cssText = `
                display:flex;
                align-items:center;
                gap:12px;
                padding:12px;
                margin-bottom:10px;
                border:1px solid #ddd;
                border-radius:10px;
                background:#fff;
            `;

            const checkbox = document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.checked = selectedProducts.has(
                String(product.id)
            );

            checkbox.addEventListener("change", () => {

                const id = String(product.id);

                if (checkbox.checked) {
                    selectedProducts.add(id);
                } else {
                    selectedProducts.delete(id);
                }

            });

            const image = createProductImage(product, 75);

            const info = document.createElement("div");

            info.className = "product-information";
            info.style.flex = "1";

            const name = document.createElement("strong");

            name.textContent = product.name;

            info.appendChild(name);

            if (
                product.hasVariants === true &&
                Array.isArray(product.variants)
            ) {

                product.variants.forEach(variant => {

                    const line = document.createElement("p");

                    line.style.margin = "5px 0";

                    line.textContent =
                        (variant.label ||
                        variant.name ||
                        variant.sku ||
                        "Variant") +
                        " — " +
                        formatPrice(variant.price);

                    info.appendChild(line);

                });

            } else {

                const price = document.createElement("p");

                price.style.margin = "5px 0";
                price.textContent = formatPrice(product.price);

                info.appendChild(price);

            }

            card.appendChild(checkbox);
            card.appendChild(image);
            card.appendChild(info);

            priceList.appendChild(card);

        });

    });

    productCount.textContent =
        filteredProducts.length + " Products";

}


/* =========================================================
   SEARCH
========================================================= */

if (searchInput) {
    searchInput.addEventListener("input", filterProducts);
}


function filterProducts() {

    const search = searchInput.value.toLowerCase().trim();

    filteredProducts = allProducts.filter(product => {

        const name = String(product.name || "").toLowerCase();
        const category = String(product.category || "").toLowerCase();
        const subcategory = String(product.subcategory || "").toLowerCase();

        const matchesSearch =
            name.includes(search) ||
            category.includes(search) ||
            subcategory.includes(search);

        const matchesCategory =
            currentCategory === "all" ||
            category === currentCategory ||
            (
                currentCategory === "day-old-chicks" &&
                category === "day-old"
            ) ||
            (
                currentCategory === "feeds" &&
                category === "feed"
            ) ||
            (
                currentCategory === "chemical" &&
                category === "chemicals"
            );

        return matchesSearch && matchesCategory;

    });

    renderProducts();

}


/* =========================================================
   CATEGORY FILTER
========================================================= */

function filterCategory(category) {

    currentCategory = category;

    filterProducts();

}


/* =========================================================
   SELECT ALL
========================================================= */

function selectAllProducts() {

    filteredProducts.forEach(product => {
        selectedProducts.add(String(product.id));
    });

    renderProducts();

}


/* =========================================================
   CLEAR ALL
========================================================= */

function clearAllProducts() {

    selectedProducts.clear();

    renderProducts();

}


/* =========================================================
   GET SELECTED PRODUCTS
========================================================= */

function getSelectedProducts() {

    return allProducts.filter(product =>
        selectedProducts.has(String(product.id))
    );

}


/* =========================================================
   WAIT FOR IMAGES
========================================================= */

async function waitForImages(container) {

    const images = Array.from(
        container.querySelectorAll("img")
    );

    await Promise.all(images.map(image => {

        if (image.complete && image.naturalWidth > 0) {
            return Promise.resolve();
        }

        return new Promise(resolve => {

            image.onload = resolve;
            image.onerror = resolve;

        });

    }));

}


/* =========================================================
   CREATE EXPORT PRICE LIST
========================================================= */

function createExportContent() {

    const selected = getSelectedProducts();

    if (!selected.length) {

        alert("Please select at least one product.");

        return null;

    }

    const wrapper = document.createElement("div");

    wrapper.style.cssText = `
        width:900px;
        padding:40px;
        box-sizing:border-box;
        background:#ffffff;
        color:#222222;
        font-family:Arial,sans-serif;
    `;


    /* HEADER */

    const header = document.createElement("div");

    header.style.cssText = `
        text-align:center;
        border-bottom:4px solid #28a745;
        padding-bottom:20px;
        margin-bottom:25px;
    `;

    header.innerHTML = `
        <h1 style="
            color:#28a745;
            font-size:38px;
            margin:0;
        ">WITTYFARE</h1>

        <h3 style="margin:5px 0;">
            AGROVET & FARMS
        </h3>

        <h2 style="margin:20px 0 5px;">
            PRODUCT PRICE LIST
        </h2>

        <p>Quality Agro & Veterinary Products</p>
        <p>www.wittyfare.com</p>
    `;

    const date = document.createElement("p");

    date.textContent =
        "Date: " + new Date().toLocaleDateString("en-GB");

    header.appendChild(date);

    wrapper.appendChild(header);


    /* GROUP PRODUCTS */

    const groups = {};

    selected.forEach(product => {

        const category = categoryName(product.category);

        if (!groups[category]) {
            groups[category] = [];
        }

        groups[category].push(product);

    });


    /* CREATE CATEGORY TABLES */

    Object.entries(groups).forEach(([category, products]) => {

        const section = document.createElement("section");

        section.style.cssText = `
            margin-bottom:30px;
        `;

        const heading = document.createElement("h2");

        heading.textContent = category;

        heading.style.cssText = `
            background:#28a745;
            color:#ffffff;
            padding:12px;
            font-size:20px;
            margin-bottom:0;
        `;

        section.appendChild(heading);


        const table = document.createElement("table");

        table.style.cssText = `
            width:100%;
            border-collapse:collapse;
            font-size:15px;
        `;

        table.innerHTML = `
            <thead>
                <tr style="background:#e8f5e9;">
                    <th style="padding:12px;border:1px solid #ccc;text-align:left;">
                        PRODUCT
                    </th>

                    <th style="padding:12px;border:1px solid #ccc;text-align:left;">
                        SIZE
                    </th>

                    <th style="padding:12px;border:1px solid #ccc;text-align:right;">
                        PRICE
                    </th>
                </tr>
            </thead>

            <tbody></tbody>
        `;

        const tbody = table.querySelector("tbody");


        products.forEach(product => {

            const variants =
                product.hasVariants === true &&
                Array.isArray(product.variants) &&
                product.variants.length
                    ? product.variants
                    : [{
                        label:
                            product.size ||
                            product.unit ||
                            "Standard",
                        price: product.price
                    }];


            variants.forEach((variant, index) => {

                const row = document.createElement("tr");


                /* PRODUCT COLUMN */

                const productCell = document.createElement("td");

                productCell.style.cssText = `
                    padding:10px;
                    border:1px solid #ccc;
                    vertical-align:middle;
                    width:55%;
                `;

                if (index === 0) {

                    const productBox = document.createElement("div");

                    productBox.style.cssText = `
                        display:flex;
                        align-items:center;
                        gap:12px;
                    `;

                    const image = createProductImage(product, 65);

                    image.style.width = "65px";
                    image.style.height = "65px";

                    const name = document.createElement("strong");

                    name.textContent = product.name;

                    productBox.appendChild(image);
                    productBox.appendChild(name);

                    productCell.appendChild(productBox);

                }


                /* SIZE COLUMN */

                const sizeCell = document.createElement("td");

                sizeCell.style.cssText = `
                    padding:10px;
                    border:1px solid #ccc;
                `;

                sizeCell.textContent =
                    variant.label ||
                    variant.name ||
                    variant.sku ||
                    product.size ||
                    product.unit ||
                    "Standard";


                /* PRICE COLUMN */

                const priceCell = document.createElement("td");

                priceCell.style.cssText = `
                    padding:10px;
                    border:1px solid #ccc;
                    text-align:right;
                    font-weight:bold;
                    color:#218838;
                `;

                priceCell.textContent = formatPrice(variant.price);


                row.appendChild(productCell);
                row.appendChild(sizeCell);
                row.appendChild(priceCell);

                tbody.appendChild(row);

            });

        });


        section.appendChild(table);

        wrapper.appendChild(section);

    });


    /* FOOTER */

    const footer = document.createElement("div");

    footer.style.cssText = `
        text-align:center;
        border-top:3px solid #28a745;
        padding-top:20px;
        margin-top:30px;
        font-weight:bold;
    `;

    footer.innerHTML = `
        <p>WITTYFARE AGROVET & FARMS</p>
        <p>www.wittyfare.com</p>
        <p>Quality Products. Affordable Prices.</p>
    `;

    wrapper.appendChild(footer);

    return wrapper;

}


/* =========================================================
   DOWNLOAD JPEG
========================================================= */

async function downloadPriceJPEG() {

    if (typeof html2canvas === "undefined") {

        alert("JPEG library not loaded. Check your internet connection.");

        return;

    }

    const content = createExportContent();

    if (!content) return;

    document.body.appendChild(content);

    try {

        await waitForImages(content);

        const canvas = await html2canvas(content, {

            scale: 2,

            backgroundColor: "#ffffff",

            useCORS: true,

            logging: false

        });

        const link = document.createElement("a");

        link.download = "WittyFare-Price-List.jpg";

        link.href = canvas.toDataURL("image/jpeg", 0.95);

        link.click();

    } catch (error) {

        console.error(error);

        alert("Could not create JPEG. Please try again.");

    } finally {

        content.remove();

    }

}


/* =========================================================
   DOWNLOAD PDF
========================================================= */

async function downloadPricePDF() {

    if (
        !window.jspdf ||
        typeof html2canvas === "undefined"
    ) {

        alert("PDF libraries not loaded. Check your internet connection.");

        return;

    }

    const content = createExportContent();

    if (!content) return;

    document.body.appendChild(content);

    try {

        await waitForImages(content);

        const canvas = await html2canvas(content, {

            scale: 2,

            backgroundColor: "#ffffff",

            useCORS: true,

            logging: false

        });

        const image = canvas.toDataURL("image/jpeg", 0.95);

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF("p", "mm", "a4");

        const pageWidth = pdf.internal.pageSize.getWidth();

        const pageHeight = pdf.internal.pageSize.getHeight();

        const imageHeight =
            canvas.height * pageWidth / canvas.width;

        let remainingHeight = imageHeight;

        let position = 0;

        pdf.addImage(
            image,
            "JPEG",
            0,
            position,
            pageWidth,
            imageHeight
        );

        remainingHeight -= pageHeight;

        while (remainingHeight > 0) {

            position = remainingHeight - imageHeight;

            pdf.addPage();

            pdf.addImage(
                image,
                "JPEG",
                0,
                position,
                pageWidth,
                imageHeight
            );

            remainingHeight -= pageHeight;

        }

        pdf.save("WittyFare-Price-List.pdf");

    } catch (error) {

        console.error(error);

        alert("Could not create PDF. Please try again.");

    } finally {

        content.remove();

    }

}


/* =========================================================
   PRINT PRICE LIST
========================================================= */

function printPriceList() {

    const content = createExportContent();

    if (!content) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {

        content.remove();

        alert("Allow pop-ups to print the price list.");

        return;

    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>

            <title>WittyFare Price List</title>

            <style>

                body {
                    margin:0;
                    padding:15px;
                    font-family:Arial,sans-serif;
                }

                @page {
                    size:A4;
                    margin:12mm;
                }

                table {
                    page-break-inside:auto;
                }

                tr {
                    page-break-inside:avoid;
                }

            </style>

        </head>

        <body>

            ${content.outerHTML}

        </body>

        </html>
    `);

    printWindow.document.close();

    content.remove();

    printWindow.onload = async function() {

        const images = Array.from(
            printWindow.document.images
        );

        await Promise.all(images.map(image => {

            if (image.complete) return Promise.resolve();

            return new Promise(resolve => {

                image.onload = resolve;
                image.onerror = resolve;

            });

        }));

        printWindow.print();

    };

}


/* =========================================================
   START GENERATOR
========================================================= */

loadProducts();

