
let allArticles = [];
let currentCategory = "All";
let currentSearch = "";

const BLOG_URL = "https://www.wittyfare.com/blog/";


// -----------------------------
// HELPER FUNCTIONS
// -----------------------------

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}


function getArticleURL(slug) {
    return `/blog/${encodeURIComponent(slug)}/`;
}


function getImageURL(image) {

    if (!image) return "/images/logo.png";

    // Convert old relative image paths to permanent site paths
    if (image.startsWith("../images/")) {
        return image.replace("../images/", "/images/");
    }

    if (image.startsWith("images/")) {
        return "/" + image;
    }

    return image;
}


function getArticleDate(date) {

    if (!date) return "";

    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


// -----------------------------
// LOAD ARTICLES
// -----------------------------

async function loadArticles() {

    try {

        const response = await fetch("/blog/articles.json", {
            cache: "no-cache"
        });

        if (!response.ok) {
            throw new Error("Could not load articles");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid articles.json format");
        }

        allArticles = data.filter(article =>
            article.status !== "draft" &&
            article.slug &&
            article.title
        );

        // Sort newest first
        allArticles.sort((a, b) =>
            new Date(b.date || 0) - new Date(a.date || 0)
        );

        displayFeaturedArticle();

        applyArticleFilters();

        displaySingleArticle();

        displayRelatedArticles();

    } catch (error) {

        console.error("Blog loading error:", error);

        const container = document.getElementById("articleContainer");

        if (container) {
            container.innerHTML = `
                <p>Articles could not be loaded.
                Please refresh the page.</p>
            `;
        }
    }
}


// -----------------------------
// FEATURED ARTICLE
// -----------------------------

function displayFeaturedArticle() {

    const container = document.getElementById("featuredArticle");

    if (!container) return;

    const article = allArticles.find(item =>
        item.featured === true
    );

    if (!article) {
        container.innerHTML = "";
        return;
    }

    const url = getArticleURL(article.slug);

    container.innerHTML = `

        <article class="article-card featured-card">

            <a href="${url}">
                <img
                    src="${escapeHTML(getImageURL(article.image))}"
                    alt="${escapeHTML(article.title)}"
                    loading="eager"
                    onerror="this.src='/images/logo.png'"
                >
            </a>

            <div class="article-card-content">

                <span class="article-category">
                    ${escapeHTML(article.category)}
                </span>

                <h2>
                    <a href="${url}">
                        ${escapeHTML(article.title)}
                    </a>
                </h2>

                <p>${escapeHTML(article.description)}</p>

                <a href="${url}" class="read-more">
                    Read Featured Article →
                </a>

            </div>

        </article>

    `;
}


// -----------------------------
// SEARCH AND CATEGORY FILTER
// -----------------------------

function applyArticleFilters() {

    let filtered = [...allArticles];

    if (currentCategory !== "All") {

        filtered = filtered.filter(article =>
            (article.category || "").toLowerCase() ===
            currentCategory.toLowerCase()
        );
    }

    if (currentSearch) {

        filtered = filtered.filter(article => {

            const searchableText = [

                article.title,
                article.category,
                article.description,
                article.content,
                article.author

            ].join(" ").toLowerCase();

            return searchableText.includes(currentSearch);
        });
    }

    // Keep the featured article out of the latest articles list
    filtered = filtered.filter(article =>
        !(article.featured === true && currentCategory === "All")
    );

    displayArticles(filtered);
}


function searchArticles() {

    const input = document.getElementById("articleSearch");

    if (!input) return;

    currentSearch = input.value.toLowerCase().trim();

    applyArticleFilters();
}


function filterCategory(category) {

    currentCategory = category;

    // Update selected category button
    document.querySelectorAll("[onclick^='filterCategory']").forEach(button => {

        const match = button.getAttribute("onclick")
            .match(/filterCategory\(['"](.+?)['"]\)/);

        const buttonCategory = match ? match[1] : "";

        button.classList.toggle(
            "active",
            buttonCategory.toLowerCase() === category.toLowerCase()
        );

    });

    applyArticleFilters();
}


// -----------------------------
// DISPLAY ARTICLE CARDS
// -----------------------------

function displayArticles(articles) {

    const container = document.getElementById("articleContainer");

    if (!container) return;

    if (!articles.length) {

        container.innerHTML = `
            <div class="no-articles">
                <h3>No articles found</h3>
                <p>Try another search or category.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = articles.map(article => {

        const url = getArticleURL(article.slug);

        return `

            <article class="article-card">

                <a href="${url}">
                    <img
                        src="${escapeHTML(getImageURL(article.image))}"
                        alt="${escapeHTML(article.title)}"
                        loading="lazy"
                        onerror="this.src='/images/logo.png'"
                    >
                </a>

                <div class="article-card-content">

                    <span class="article-category">
                        ${escapeHTML(article.category)}
                    </span>

                    <h3>
                        <a href="${url}">
                            ${escapeHTML(article.title)}
                        </a>
                    </h3>

                    <p>${escapeHTML(article.description)}</p>

                    <small>
                        ${escapeHTML(getArticleDate(article.date))}
                    </small>

                    <a href="${url}" class="read-more">
                        Read More →
                    </a>

                </div>

            </article>

        `;

    }).join("");
}


// -----------------------------
// FIND ARTICLE FROM URL
// -----------------------------

function getCurrentSlug() {

    // Support clean URL:
    // /blog/how-to-start-catfish-farming-in-nigeria/

    const path = window.location.pathname;

    const blogPrefix = "/blog/";

    if (path.startsWith(blogPrefix)) {

        const remaining = path
            .slice(blogPrefix.length)
            .replace(/\/$/, "");

        if (remaining && remaining !== "index.html") {
            return decodeURIComponent(remaining.split("/")[0]);
        }
    }

    // Backward compatibility:
    // article.html?slug=example

    const params = new URLSearchParams(window.location.search);

    return params.get("slug");
}


// -----------------------------
// SEO META TAGS
// -----------------------------

function setMetaTag(name, content, property = false) {

    if (!content) return;

    const attribute = property ? "property" : "name";

    let tag = document.querySelector(
        `meta[${attribute}="${name}"]`
    );

    if (!tag) {

        tag = document.createElement("meta");

        tag.setAttribute(attribute, name);

        document.head.appendChild(tag);
    }

    tag.setAttribute("content", content);
}


function setArticleSEO(article) {

    const title = `${article.title} | WittyFare`;
    const description = article.description || article.title;
    const url = BLOG_URL + encodeURIComponent(article.slug) + "/";
    const image = new URL(
        getImageURL(article.image),
        window.location.origin
    ).href;

    document.title = title;

    setMetaTag("description", description);
    setMetaTag("robots", "index, follow");

    setMetaTag("og:title", title, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:type", "article", true);
    setMetaTag("og:url", url, true);
    setMetaTag("og:image", image, true);

    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);
    setMetaTag("twitter:image", image);

    let canonical = document.querySelector(
        'link[rel="canonical"]'
    );

    if (!canonical) {

        canonical = document.createElement("link");

        canonical.rel = "canonical";

        document.head.appendChild(canonical);
    }

    canonical.href = url;

    // Article structured data for search engines
    const structuredData = {

        "@context": "https://schema.org",
        "@type": "Article",

        "headline": article.title,
        "description": description,
        "image": [image],

        "datePublished": article.date || undefined,
        "dateModified": article.updatedAt || article.date || undefined,

        "author": {
            "@type": "Person",
            "name": article.author || "WittyFare Editorial Team"
        },

        "publisher": {
            "@type": "Organization",
            "name": "WittyFare Agrovet & Farms",
            "url": "https://www.wittyfare.com/",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.wittyfare.com/images/logo.png"
            }
        },

        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": url
        }

    };

    let schema = document.getElementById("articleStructuredData");

    if (!schema) {

        schema = document.createElement("script");

        schema.id = "articleStructuredData";
        schema.type = "application/ld+json";

        document.head.appendChild(schema);
    }

    schema.textContent = JSON.stringify(structuredData);
}


// -----------------------------
// DISPLAY SINGLE ARTICLE
// -----------------------------

function displaySingleArticle() {

    const container = document.getElementById("articleDetails");

    if (!container) return;

    const slug = getCurrentSlug();

    if (!slug) return;

    const article = allArticles.find(item =>
        item.slug === slug
    );

    if (!article) {

        container.innerHTML = `
            <h1>Article not found</h1>
            <p>The article may have been moved or is unavailable.</p>
            <a href="/blog/">Return to Blog</a>
        `;

        document.title = "Article Not Found | WittyFare";

        return;
    }

    setArticleSEO(article);

    const title = document.getElementById("articleTitle");
    const category = document.getElementById("articleCategory");
    const description = document.getElementById("articleDescription");
    const author = document.getElementById("articleAuthor");
    const date = document.getElementById("articleDate");
    const breadcrumb = document.getElementById("articleBreadcrumb");
    const image = document.getElementById("articleImage");
    const content = document.getElementById("articleContent");

    if (title) title.textContent = article.title;

    if (category) category.textContent = article.category || "";

    if (description) {
        description.textContent = article.description || "";
    }

    if (author) {
        author.textContent = article.author || "WittyFare Editorial Team";
    }

    if (date) {
        date.textContent = getArticleDate(article.date);
    }

    if (breadcrumb) {
        breadcrumb.textContent = article.title;
    }

    if (image) {

        image.src = getImageURL(article.image);
        image.alt = article.title;

        image.onerror = function () {
            this.src = "/images/logo.png";
        };
    }

    if (content) {

        // Only publish trusted, manually reviewed HTML content here.
        content.innerHTML = article.content || "";
    }
}


// -----------------------------
// RELATED ARTICLES
// -----------------------------

function displayRelatedArticles() {

    const container = document.getElementById("relatedArticles");

    if (!container) return;

    const slug = getCurrentSlug();

    if (!slug) return;

    const currentArticle = allArticles.find(item =>
        item.slug === slug
    );

    if (!currentArticle) return;

    const related = allArticles
        .filter(article =>
            article.slug !== slug &&
            article.category === currentArticle.category
        )
        .slice(0, 3);

    if (!related.length) {

        container.innerHTML = "";

        return;
    }

    container.innerHTML = `

        <h2>Related Articles</h2>

        <div class="related-articles-grid">

            ${related.map(article => `

                <article class="article-card">

                    <a href="${getArticleURL(article.slug)}">

                        <img
                            src="${escapeHTML(getImageURL(article.image))}"
                            alt="${escapeHTML(article.title)}"
                            loading="lazy"
                        >

                    </a>

                    <div class="article-card-content">

                        <h3>
                            <a href="${getArticleURL(article.slug)}">
                                ${escapeHTML(article.title)}
                            </a>
                        </h3>

                        <a href="${getArticleURL(article.slug)}">
                            Read More →
                        </a>

                    </div>

                </article>

            `).join("")}

        </div>

    `;
}


// -----------------------------
// INITIALIZE BLOG
// -----------------------------

document.addEventListener("DOMContentLoaded", function () {

    const year = document.getElementById("currentYear");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    const searchInput = document.getElementById("articleSearch");

    if (searchInput) {

        searchInput.addEventListener("input", searchArticles);

        searchInput.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {
                searchArticles();
            }

        });
    }

    loadArticles();

});
