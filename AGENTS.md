# AGENTS.md

## Project Summary
- Project: `zayrah-life-ecommerce`
- Type: Vue 3 + TypeScript frontend for the ZayrahLife storefront and admin panel
- Goal: Provide a production-oriented frontend that can work with a Django-style backend API without a major refactor
- Package manager: `pnpm`
- Build tool: `Vite`

## Stack
- Vue 3 with Composition API and `<script setup>`
- TypeScript in strict mode
- Vue Router
- Pinia
- Tailwind CSS
- ESLint flat config

## App Shape
- This repo contains two UX surfaces in one SPA:
- Public storefront routes live under `/`
- Admin routes live under `/admin`
- [`src/App.vue`](/home/shaon/Desktop/ZayrahLife/src/App.vue) switches layout behavior by route:
- Non-admin routes render inside [`src/components/layout/PageLayout.vue`](/home/shaon/Desktop/ZayrahLife/src/components/layout/PageLayout.vue)
- Admin routes render their own layout directly

## Key Directories
- [`src/pages`](/home/shaon/Desktop/ZayrahLife/src/pages): storefront pages
- [`src/admin/pages`](/home/shaon/Desktop/ZayrahLife/src/admin/pages): admin pages
- [`src/router`](/home/shaon/Desktop/ZayrahLife/src/router): main router that merges public and admin routes
- [`src/admin/router`](/home/shaon/Desktop/ZayrahLife/src/admin/router): admin route tree and auth guard
- [`src/components/layout`](/home/shaon/Desktop/ZayrahLife/src/components/layout): public shell
- [`src/components/common`](/home/shaon/Desktop/ZayrahLife/src/components/common): shared UI primitives
- [`src/components/admin`](/home/shaon/Desktop/ZayrahLife/src/components/admin): admin UI components
- [`src/stores`](/home/shaon/Desktop/ZayrahLife/src/stores): public Pinia stores
- [`src/stores/admin`](/home/shaon/Desktop/ZayrahLife/src/stores/admin): admin Pinia stores
- [`src/api`](/home/shaon/Desktop/ZayrahLife/src/api): typed API layer and HTTP client
- [`src/composables`](/home/shaon/Desktop/ZayrahLife/src/composables): reusable composables
- [`src/mock`](/home/shaon/Desktop/ZayrahLife/src/mock): fallback/mock data used in parts of the app
- [`src/assets/main.css`](/home/shaon/Desktop/ZayrahLife/src/assets/main.css): global CSS variables and dark-mode overrides

## Routing Notes
- Public routes include home, products, cart, checkout, auth, orders, invoice, and profile.
- Admin routes are lazy-loaded and nested under `/admin`.
- Admin auth is guarded in [`src/admin/router/index.ts`](/home/shaon/Desktop/ZayrahLife/src/admin/router/index.ts).
- The main router has special recovery logic for admin chunk-load failures in [`src/router/index.ts`](/home/shaon/Desktop/ZayrahLife/src/router/index.ts).

## State And Data Flow
- Pinia is the state layer.
- Public auth in [`src/stores/auth.ts`](/home/shaon/Desktop/ZayrahLife/src/stores/auth.ts) is currently mock-style and lightweight.
- Admin auth in [`src/stores/admin/adminAuth.ts`](/home/shaon/Desktop/ZayrahLife/src/stores/admin/adminAuth.ts) is real API-backed and persists profile/token state via `localStorage`.
- Public product data in [`src/stores/products.ts`](/home/shaon/Desktop/ZayrahLife/src/stores/products.ts) maps backend models into storefront-friendly view models.
- Many admin domains have dedicated stores for orders, customers, accounts, inventory, purchases, suppliers, and campaigns.

## API Notes
- Base client lives in [`src/api/http.ts`](/home/shaon/Desktop/ZayrahLife/src/api/http.ts).
- Default API base URL falls back to `https://apizayrahlife.rkshaon.info` when `VITE_API_BASE_URL` is absent.
- The HTTP client:
- Attaches bearer tokens automatically
- Refreshes access tokens on `401`
- Queues concurrent requests during refresh
- Dispatches `auth:logout` when refresh fails
- When changing API integrations, keep store contracts stable unless the UI is updated with them.

## Styling Notes
- Tailwind is the main styling layer.
- Theme colors are extended in [`tailwind.config.mjs`](/home/shaon/Desktop/ZayrahLife/tailwind.config.mjs) with `primary` and `gold` palettes.
- Global CSS variables in [`src/assets/main.css`](/home/shaon/Desktop/ZayrahLife/src/assets/main.css) drive light/dark surfaces and text colors.
- Dark mode is class-based via `html.dark`.
- Existing UI favors utility classes plus a few reusable base components.

## Conventions For AI Changes
- Prefer TypeScript-safe changes over quick template-only patches.
- Preserve the public/admin split. Do not mix admin concerns into storefront components.
- Reuse existing components in [`src/components/common`](/home/shaon/Desktop/ZayrahLife/src/components/common) and [`src/components/admin`](/home/shaon/Desktop/ZayrahLife/src/components/admin) before adding new primitives.
- Do not duplicate component UI, modal markup, or form logic for the same feature in multiple pages.
- If the same create/edit flow appears in more than one place, extract and reuse one shared component instead of copying the implementation.
- If repeated submit/validation logic is needed by multiple screens, move it into a shared composable or helper rather than duplicating page-level code.
- Prefer extending an existing shared component over creating a second component with nearly identical fields and behavior.
- Keep route components lazy-loaded following current router patterns.
- Use the `@/` alias for imports from `src`.
- Match the existing Vue style: `<script setup>`, Composition API, and computed refs over ad hoc inline logic.
- Put cross-page state in Pinia, not in deeply nested component state.
- If a feature depends on backend data, check whether a typed API module and a store already exist before adding new fetch logic inside a page.
- Avoid introducing a new design language unless the task explicitly calls for a redesign.

## Commands
- Install: `pnpm install`
- Dev: `pnpm dev`
- Staging dev: `pnpm dev:staging`
- Production-mode dev: `pnpm dev:prod`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Auto-fix lint: `pnpm lint:fix`
- Type-check: `pnpm type-check`

## Safe Workflow For Future AI Sessions
1. Read [`package.json`](/home/shaon/Desktop/ZayrahLife/package.json), [`src/router/index.ts`](/home/shaon/Desktop/ZayrahLife/src/router/index.ts), and the relevant store/page before editing.
2. Decide whether the task belongs to storefront, admin, shared UI, store, or API.
3. Make the smallest coherent change in the existing architectural style.
4. Run `pnpm lint` and `pnpm type-check` after meaningful code changes.

## Known Realities
- There is no test suite configured in `package.json` at the moment.
- Some areas are mock-driven while admin authentication and parts of the admin data layer are API-driven.
- Product mapping currently normalizes backend product data into storefront-specific shapes rather than exposing raw API responses directly.

## Good Prompts For AI Working In This Repo
- "Add a new admin page and register it under `/admin` using the existing admin layout and store patterns."
- "Extend the storefront product flow without breaking the backend-to-store mapping in `src/stores/products.ts`."
- "Refactor a shared component only if the same pattern appears in multiple pages."
- "Keep changes aligned with Vue 3 Composition API, Pinia, Tailwind, and the existing public/admin architecture."
