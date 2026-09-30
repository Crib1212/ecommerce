# WittyFare SEO Rewire

Generated from the WittyFare product catalogue supplied in this conversation.

## Core change
Google no longer needs to discover products through the internal JavaScript search. Category and subcategory HTML contains normal links to every product, and every product has its own static `/product/<slug>/` page.

## Included
- 42 product pages
- 9 category landing pages
- 13 data-backed subcategory pages
- patched `app.js`
- supplied `product.json`
- `sitemap.xml`
- `robots.txt`

## Deployment
Back up the current website first. Copy the contents of this build into the WittyFare site root, merging folders.

Keep the existing `style.css`, `images/`, `checkout.html` and other assets.

The current catalogue classifies `Booster Poultry Feed` as `pet-store / poultry-products`; this build preserves that classification rather than silently changing product data.

After deployment, open a product URL directly and use View Source. The product name, description and canonical URL should be present in the original HTML source, not only after JavaScript runs. Then submit `/sitemap.xml` in Google Search Console.
