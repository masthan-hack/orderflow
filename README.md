# OrderFlow - full source starter

## Included
- Supabase email/password login, signup and password reset
- Dashboard summary
- Orders: add, edit, delete, update status, search, CSV export
- Customers: add, edit, delete, search
- Products: add, edit, delete, search
- Responsive desktop/mobile layout

## Install
1. Keep a backup of your current project.
2. Copy these files into your Vite project, preserving the `src` folder structure.
3. Keep your existing `.env` file. If you do not have one, copy `.env.example` to `.env` and fill in your Supabase project URL and publishable/anon key.
4. In the project terminal run:
   ```bash
   npm install
   npm run dev
   ```

## Database compatibility warning
This frontend expects:
- `orders`: `id`, `order_number` (optional), `customer_name` (or `customer`), `product` (or `product_name`), `quantity`, `amount`, `status`, `order_date` (optional), `created_at`
- `customers`: `id`, `name`, `phone`, `email`, `created_at`
- `products`: `id`, `name`, `sku`, `unit`, `price`, `stock_quantity`, `created_at`

For inserts/updates, the app writes the customer name to `orders.customer_name`, product name to `orders.product`, and product/customer fields shown in the forms. If your existing `orders` table uses different required column names or has required `business_id`, adjust the insert payload/schema before testing. Do not drop or recreate your existing tables or RLS policies to make this starter fit.

Your RLS policies must ensure authenticated users can access only their own rows. If your tables require `business_id`, add it server-side from the authenticated user in a trusted database policy/trigger or include `business_id: session.user.id` in each insert payload after confirming your schema. Never put a service_role key or database password in frontend code.

## Safety
Use sample data while testing. Do not upload real customer details until access policies have been verified. Ask a trusted adult to help review real customer-data handling, payments, and business agreements.
