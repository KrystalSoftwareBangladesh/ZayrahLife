# ZayrahLife E-Commerce

## Overview
A complete Vue 3 e-commerce frontend built with Vite, Vue Router, and Pinia. This is a production-ready frontend designed to connect to a Django backend without refactoring.

## Tech Stack
- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Routing**: Vue Router
- **State Management**: Pinia
- **Styling**: Tailwind CSS

## Theme Colors
- **Primary**: Dark green/teal (#1a5c4e to #143d35)
- **Accent**: Gold (#d9982d to #c17a22)
- Logo: `/public/logo.png`

## Project Structure
```
src/
├── assets/          # CSS and static assets
├── components/      # Reusable Vue components
│   ├── common/      # Button, Input, Modal, etc.
│   ├── product/     # ProductCard
│   ├── cart/        # OrderSummary
│   └── layout/      # PageLayout, Header, Footer
├── pages/           # Page components
├── router/          # Vue Router configuration
├── stores/          # Pinia stores (products, cart, auth, orders)
├── composables/     # Reusable composition functions
├── mock/            # Mock data (products, orders)
├── utils/           # Utility functions
├── App.vue          # Root component
└── main.js          # Application entry point
```

## Features
- Landing page with hero, categories, and featured products
- Product listing with category/price filters
- Product detail page with variant selection
- Shopping cart with quantity management
- Checkout flow with shipping/billing forms
- Invoice page (printable)
- Authentication UI (login/register with mock state)
- Order history and order details

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
