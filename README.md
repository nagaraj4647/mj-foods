# Sivani Foods - React + Tailwind + Express + Supabase

Production-oriented guest e-commerce application. The active order path is **Products → Cart → Customer details → server-validated Supabase order → WhatsApp**. No online payment is included. The order schema already has payment status/provider/reference fields so Razorpay can be added later behind a payment service without replacing cart, checkout or orders.

## 1. What was implemented
- React/Vite storefront using Tailwind CSS, React Router, Lucide React and Context API.
- Home, Shop, Product details, persistent Cart, Checkout and Order success routes.
- Search, category filter, sort, stock controls, quantity limits and responsive mobile navigation.
- Express API backed by real Supabase tables. Products and categories are never supplied by a fake API or final hardcoded catalogue.
- Guest order endpoint that re-reads products, validates stock, recalculates prices, creates a readable daily order number, snapshots items, reduces stock transactionally, and then lets the client open WhatsApp.
- Supabase Auth admin login and role-protected dashboard, product/category management, order search/status updates and inventory view.
- Storage bucket definition with admin-only writes, 5 MB limit and JPEG/PNG/WebP/AVIF allow-list.
- RLS, centralized business config, user-friendly error handling, Helmet security headers, CORS and API rate limits.
- SEO titles/meta/canonical tags, Open Graph basics, Product JSON-LD, robots.txt and sitemap.xml.

## Local preview and bundled images
All 50 product JPGs are physically included in `frontend/public/products/`. With no credentials, the storefront automatically reads `frontend/src/data/sample-catalogue.json`, whose image paths are `/products/<file>.jpg`. No external image URL is needed for catalogue rendering. Search, category filters, sorting, details, cart and stock limits work locally; saving an order and admin actions stay gated until Supabase is configured.

Quick local preview:
```bash
npm run install:all
npm --prefix frontend run dev
```
Open http://localhost:5173. The local catalogue needs no `.env`.

The same 50 original image files are duplicated under `supabase/sample-data/images/` for the production Storage upload script.

## 2. Database tables created
`profiles`, `categories`, `products`, `orders`, `order_items`, `order_counters`. The seed loads 6 categories and 50 sample products; image files live in `supabase/sample-data/images/` with a manifest in `supabase/sample-data/products.json`. Enums: `user_role`, `order_status`, `payment_status`. The `product-images` storage bucket and policies are created too.

## 3. Environment variables required
Copy `frontend/.env.example` to `frontend/.env` and `backend/.env.example` to `backend/.env`.
- Frontend: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WHATSAPP_NUMBER`, `VITE_SITE_URL`, public business details and `VITE_DELIVERY_CHARGE`.
- Backend: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_ORIGIN`, `DELIVERY_CHARGE`, `PORT`.
- Never put the service-role key in the frontend or commit either `.env`.

## 4. How to run frontend
```bash
cp frontend/.env.example frontend/.env
npm --prefix frontend install
npm --prefix frontend run dev
```
Open http://localhost:5173.

## 5. How to run backend
```bash
cp backend/.env.example backend/.env
npm --prefix backend install
npm --prefix backend run dev
```
API health: http://localhost:4000/health.

## 6. Configure Supabase
1. Create a Supabase project.
2. Run `supabase/migrations/001_initial.sql` in the SQL editor.
3. Optionally run `supabase/seed.sql`. It inserts a SAMPLE catalogue of 50 products across 6 categories (snacks, sweets, masala and powders, pickles, ready-to-eat mixes, health mix and flours). This is development data with realistic names and prices; it is not claimed to be Sivani Foods' real catalogue. Every row stays editable and deactivatable from the admin panel.
4. Then load the 50 bundled sample product photos into the `product-images` Storage bucket and link them to the seeded rows:
   ```bash
   node scripts/upload-sample-images.mjs
   ```
   The script uses only the Supabase REST/Storage APIs plus `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `backend/.env`, upserts `supabase/sample-data/images/*` into the bucket, and rewrites each product's `image_url` to the real public URL. Alternative: upload the files manually in the dashboard and replace `YOUR_PROJECT_REF` in `supabase/seed.sql` with your project ref before seeding.
5. Create an Auth email/password user.
6. Promote only the intended account: `update public.profiles set role='admin' where email='ADMIN_EMAIL';`
7. Add the project URL, anon key and server-only service-role key to the correct environment files.
8. Product images can also be uploaded one by one from the admin product form. Express validates the file size and MIME type, then writes to the `product-images` bucket. A public URL can also be entered directly.

## 7. Configure WhatsApp
Set `VITE_WHATSAPP_NUMBER` to the business number with country code and digits only, such as `91XXXXXXXXXX`. It is read from one central config. A cart is cleared only after the API successfully creates the order. WhatsApp then opens with the exact saved order and readable `SF-YYYYMMDD-NNN` ID.

## 8. Remaining setup required
- Add real Supabase credentials and apply the migration.
- Replace the 50-product sample catalogue, its bundled images, reviews and editable about copy with approved Sivani Foods facts. All sample products are manageable (edit, deactivate, delete) from the admin panel.
- Set verified business contact information, WhatsApp number, delivery fee and production URLs.
- Promote the first admin as described above.
- Deploy frontend and backend and restrict `FRONTEND_ORIGIN` to the deployed frontend.

## 9. Known limitations
- No payment integration by requirement. Payment columns are reserved but remain `pending`.
- WhatsApp may be blocked by browser popup policies; the success page keeps a second WhatsApp button.
- Public order lookup intentionally returns only a limited summary. It is not used by the success screen.
- This ZIP cannot prove a live Supabase workflow without the owner's project credentials. SQL transaction, API validation and authorization paths are included and locally syntax/build tested.

## 10. Exact commands
```bash
npm run install:all
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
# fill both .env files and run the SQL migration
npm --prefix backend run dev
npm --prefix frontend run dev
# production verification
npm run build
npm test
npm --prefix frontend run lint
```
