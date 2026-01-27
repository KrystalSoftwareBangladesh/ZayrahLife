# ZayrahLife E-Commerce

## Overview
A complete Vue 3 e-commerce frontend built with Vite, Vue Router, and Pinia. This is a production-ready frontend designed to connect to a Django backend without refactoring.

## Tech Stack
- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Routing**: Vue Router
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Linting**: ESLint with TypeScript and Vue support
- **Type Checking**: vue-tsc

## Theme Colors
- **Primary**: Dark green/teal (#1a5c4e to #143d35)
- **Accent**: Gold (#d9982d to #c17a22)
- Logo: `/public/logo.png`

## Project Structure
```
src/
├── admin/           # Admin panel (separate from public website)
│   ├── pages/       # Admin page components
│   └── router/      # Admin routing configuration
├── assets/          # CSS and static assets
├── components/      # Reusable Vue components
│   ├── admin/       # Admin-only components (DataTable, StatCard, etc.)
│   ├── common/      # Button, Input, Modal, etc.
│   ├── product/     # ProductCard
│   ├── cart/        # OrderSummary
│   └── layout/      # PageLayout, Header, Footer
├── pages/           # Public page components
├── router/          # Vue Router configuration
├── stores/          # Pinia stores
│   └── admin/       # Admin-specific stores
├── mock/            # Mock data
│   └── admin/       # Admin mock data (customers, orders, inventory, etc.)
├── composables/     # Reusable composition functions
├── utils/           # Utility functions
├── App.vue          # Root component
└── main.js          # Application entry point
```

## Features

### Public Website
- Landing page with hero, categories, and featured products
- Product listing with category/price filters
- Product detail page with variant selection
- Shopping cart with quantity management
- Checkout flow with shipping/billing forms
- Invoice page (printable)
- Authentication UI (login/register with mock state)
- Order history and order details
- User profile page

### Admin Panel (ERP/CRM MVP)
- **Dashboard**: KPI cards (orders, revenue, expenses, stock count), low stock alerts, recent orders, financial overview
- **Billing / POS**: Full POS-style interface with product grid, cart sidebar, multiple sales channels (Walk-in, Facebook, Instagram, WhatsApp, Phone, Website), customer selection with quick-add, payment methods (Cash, Card, bKash, Nagad, Bank), order history with filters
- **Customers**: Customer list, details, notes management, **add new customers**
- **Products & Inventory**: Product catalog, variant stock levels, manual stock adjustment, **add new products with variants**
- **Suppliers**: Vendor management with contact info, payment terms, order history, **add new suppliers**
- **Purchase Orders**: Create and track purchase orders from suppliers with **variant-level tracking** (color/size/SKU), status updates (pending/ordered/received), payment tracking (unpaid/partial/paid), automatic stock replenishment when orders are received
- **Accounts & Finance**: Chart of Accounts with tabs, **add accounts and transactions**, transaction tracking
- **Reports & Analytics**: Overview dashboard, sales reports by channel, top products, inventory reports by category, low stock alerts, financial reports (profit/loss, income vs expenses)
- **Campaigns**: Marketing campaign tracking with ROI calculations

### Admin Access
- URL: `/admin/login`
- Demo credentials:
  - Admin: `admin@zayrahlife.com` / `admin123`
  - Staff: `staff@zayrahlife.com` / `staff123`

## Running the Project
```bash
pnpm install
pnpm dev          # Development server on port 5000
pnpm build        # Production build
```

## Environment Variables
- `VITE_APP_NAME`: Application name
- `VITE_ENV`: Environment (development/staging/production)
- `VITE_API_BASE_URL`: Backend API URL (for future integration)

## Notes
- All data is mocked - no backend integration yet
- Designed to easily connect to Django REST API
- Mobile responsive design
