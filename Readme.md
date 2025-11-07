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
- Listings: filters (category, price, sort) + new quick filters: On Sale, Featured
- Product Detail: Similar items now reuse the same ProductCard for consistent actions
- Checkout: COD, eSewa, Khalti; idempotent order creation
- Admin: lazy‑loaded analytics chart with small session cache
- Seller UX: toast feedback on listing submission
- Payment ledger: minimal SQL table for reconciliation tales; generic verification endpoint

---

## Reconciliation talking points

- Table: `payment_ledger` (id, order_id, method, gateway_txn_id, amount, currency, status, raw_payload, created_at)
- Endpoints:
	- POST `/api/payments/verify` — accepts `{ method, orderId?, txn? }`, checks `orders` mappings (eSewa UUID or Khalti pidx), writes a ledger row and returns `{ reconciled, orderId }`
	- GET `/api/payments/ledger` — returns last 50 ledger entries
- Existing flows already map `orders.esewa_transaction_uuid` and `orders.khalti_pidx` during initiation and mark Paid on provider callbacks

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
- If payments fail in sandbox: verify keys and base URLs in `.env` match your local ports.
- If tables are missing: restart the server; `initDb.js` creates/patches tables on boot.

---

## License

For educational/demo purposes.
