## E‑commerce Web (Client + Server)

Polished e‑commerce demo with React + Vite (client) and Express + MySQL (server). Includes themed UI, wishlist/cart, checkout with eSewa/Khalti/COD, admin analytics, and a minimal payment ledger/verification endpoint for reconciliation discussion.

### Tech stack
- Client: React 18, Vite, TypeScript, Tailwind, shadcn/ui, lucide-react
- Server: Node/Express, MySQL (mysql2/promise)
- Payments: eSewa (sandbox), Khalti (sandbox), Cash on Delivery (COD)

---

## Quick start

Prerequisites:
- Node.js 18+
- MySQL 8.x (or compatible MariaDB)

1) Server setup
- Copy `Server/.env.example` to `Server/.env` and fill values (DB, JWT, payments). At minimum set DB creds and JWT_SECRET.
- From repo root:

```cmd
cd Server
npm install
npm start
```

The server will:
- Ensure DB and tables exist (see `Server/config/initDb.js`)
- Serve API at http://localhost:5000
- Expose uploads at http://localhost:5000/uploads

2) Client setup
- Copy `Client/.env.example` to `Client/.env` (defaults to `VITE_API_URL=http://localhost:5000`).

```cmd
cd Client
npm install
npm run dev
```

Client runs at http://localhost:5173 (default Vite port). Make sure `VITE_API_URL` points to the server.

---

## Environment variables

See example files:
- `Server/.env.example` — DB config, JWT, eSewa, Khalti, client/server base URLs
- `Client/.env.example` — API base URL

Key server vars:
- DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
- JWT_SECRET
- CLIENT_BASE_URL (e.g., http://localhost:5173)
- SERVER_BASE_URL (e.g., http://localhost:5000)
- ESEWA_ENV=sandbox, ESEWA_MERCHANT_CODE, ESEWA_SECRET_KEY
- KHALTI_SECRET_KEY

---

## Demo credentials

Use these in your demo (if not present, sign up new users and/or set `ADMIN_EMAIL` in `Server/.env` to promote to admin on next server start):

- Admin: admin@example.com / admin123
- Buyer: buyer@example.com / buyer123

Note: If these accounts don’t exist in your DB yet, create them via Sign Up then set `ADMIN_EMAIL=admin@example.com` in server `.env` and restart to promote the admin.

---

## Notable features to demo

- Themed UI: inputs, selects, dropdowns; discount badges; brand styling
- Listings: filters (category, price, sort, brand, condition, size) + quick filters: On Sale, Featured
- Product Detail: Similar items via reusable `ProductCard` (heuristic recommendation)
- Checkout: COD, eSewa, Khalti; idempotent order creation
- Admin: lazy‑loaded analytics chart with small session cache
- Seller UX: toast feedback + drag & drop image upload (up to 8 images)
- Seller Trust (Peer Feedback): buyers review sellers post‑purchase; trust badge on Product Detail; Shop filter label updated to “Trusted Sellers”. Legacy verification endpoints exist but the admin verification UI has been removed.
- Payment ledger: minimal SQL table & generic verification endpoint
- Order audit log: tracks status/payment transitions for traceability
- Admin bulk import: upload CSV on Admin → Products to create many products at once

---

## Reconciliation talking points

- Table: `payment_ledger` (id, order_id, method, gateway_txn_id, amount, currency, status, raw_payload, created_at)
- Endpoints:
	- POST `/api/payments/verify` — accepts `{ method, orderId?, txn? }`, checks `orders` mappings (eSewa UUID or Khalti pidx), writes a ledger row and returns `{ reconciled, orderId }`
	- GET `/api/payments/ledger` — returns last 50 ledger entries
- Existing flows already map `orders.esewa_transaction_uuid` and `orders.khalti_pidx` during initiation and mark Paid on provider callbacks

---

## Seller Verification

	- POST `/api/sellers/verify/apply` — multipart form with `shop_name` and `documents[]` (images or PDF). Requires auth.
	- GET `/api/sellers/:id/status` — verification status and latest application.
	- Admin:
		- GET `/api/sellers/admin/sellers/pending` — list pending applications
		- PUT `/api/sellers/admin/sellers/:id/approve` — approve, set `users.is_verified_seller=1`
		- PUT `/api/sellers/admin/sellers/:id/reject` — reject with optional notes
	- Page `/apply-verification` to submit/update application.
	- Badge on seller name and a “Verified Sellers” filter in Shop.
	- Sell page blocks publishing until verified (shows CTA to apply).
## Seller Trust (Peer Feedback)

Originally a pre‑listing verification system; now shifted to post‑purchase peer feedback so buyers build seller reputation organically.

### Schema
- `seller_feedback` table: `id, order_id, seller_id, buyer_id, as_described TINYINT(1), rating TINYINT, comment TEXT, created_at`.
- Legacy `users.is_verified_seller` and `seller_verifications` remain for backward compatibility but are no longer enforced for listing.

### Endpoints
- POST `/api/sellers/feedback` — body `{ orderId, sellerId?, rating (1-5), as_described (boolean), comment? }`. Requires buyer auth. One per seller per order.
- GET `/api/sellers/:id/feedback/summary` — returns `{ seller_id, total, positives, percentage, avgRating, recent[] }`.
- GET `/api/sellers/:id/feedback` — list (recent) feedback rows including `order_id` for client dedup.

### Client UX
- Product Detail shows a trust badge once feedback exists: `92% as-described · ★4.6 (42)`.
- Order Detail: after payment, buyer can submit feedback (or sees their existing review instead of the form).
- Shop “Verified Sellers” label repurposed as “Trusted Sellers”. Threshold logic can be added later (e.g., percentage >= 80 with >=5 reviews).

### Future Enhancements
- Add server-side trusted flag in product list based on thresholds.
- Admin moderation (hide abusive comments, aggregate suspicious patterns).
- Time‑decay weighting so recent feedback counts more.

### Legacy Verification (Optional)
Endpoints under `/api/sellers/verify/*` and the `/apply-verification` page still exist but publishing is no longer gated; consider removing when no longer needed.

---

## Scripts

Server:
- `npm start` — start server (with DB init)

Client:
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run preview` — preview build

---

## Troubleshooting

- If images don’t load: ensure `Server/public/uploads` exists (it’s created automatically) and that product images were uploaded.
- If bulk CSV import skips rows: confirm required headers `title,price` are present and price > 0.
- If payments fail in sandbox: verify keys and base URLs in `.env` match your local ports.
- If tables are missing: restart the server; `initDb.js` creates/patches tables on boot.

## Bulk import products (CSV)

Admin users can upload a CSV to create many products.

Endpoint: `POST /api/admin/products/bulk` (multipart/form-data, field `file`)

Headers (case-insensitive):
`title,price,originalPrice,brand,category,size,productCondition,location,imageUrl`

Notes:
- `title` (required), `price` (required > 0)
- `imageUrl` can contain multiple absolute URLs separated by `|`; first becomes main image, all stored in `product_images`.
- Rows failing minimal validation are skipped (not aborted).
- Products are attributed to the uploading admin.

Example:
```
title,price,originalPrice,brand,category,size,productCondition,location,imageUrl
Vintage Denim Jacket,2500,4000,Levis,women,M,excellent,Kathmandu,https://example.com/a.jpg|https://example.com/b.jpg
Classic White Tee,800,,Uniqlo,men,L,good,Lalitpur,https://example.com/tee.jpg
```

For SQL-based bulk import, you can craft `INSERT INTO products (...) VALUES (...);` statements; see `Server/config/initDb.js` for column names.

---

## License

For educational/demo purposes.
