# WittyFare OPay integration correction pack

## Included
- `api/opay-init.mjs`: Vercel serverless payment initializer. Reads trusted prices from root `product.json`, rejects duplicate IDs, sends NGN amount in minor units, and redirects through OPay's Cashier API.
- `api/opay-callback.mjs`: callback receiver only. It deliberately does not mark orders paid.
- `vercel.json`: preserves the `/product/:slug` rewrite and includes `product.json` for the init function.
- `checkout.js.patch.txt`: precise edits to make in your existing checkout.js.
- `scripts/validate-product-catalogue.mjs`: validates unique product IDs/slugs and valid product prices.
- `.env.example`: variable names only; put actual values in Vercel settings.

## Install
1. Copy `api/opay-init.mjs` and `api/opay-callback.mjs` into the site's `api/` directory.
2. Merge `vercel.json` with your existing file if it contains additional rewrites/headers. Do not discard other existing configuration.
3. Apply the two checkout.js edits from `checkout.js.patch.txt` to your current checkout.js.
4. Put `product.json` at the project root (the same level as `vercel.json`).
5. Run `node scripts/validate-product-catalogue.mjs` after copying your real product.json to the project root and the `scripts/` directory into the project. Fix every duplicate ID/slug it reports without guessing which price is correct.
6. Add `OPAY_PUBLIC_KEY`, `OPAY_MERCHANT_ID`, `OPAY_ENV=sandbox`, and `OPAY_CALLBACK_URL` in Vercel Project Settings > Environment Variables.
7. Deploy and test in sandbox.

## Production safety limitation
This is not a complete production payment/order system. No durable order database is present in the files supplied, so the callback cannot safely map a payment reference to the original order or update an order status. Before setting `OPAY_ENV=production`, add persistent order storage and implement OPay Cashier Status verification with the private key's documented HMAC signature. Do not mark orders paid from the callback payload alone. The initializer uses the public key for the cashier-create API; never expose the private/secret key in browser code or Git.
