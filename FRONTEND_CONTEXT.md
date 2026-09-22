# Project Context — E-Commerce Frontend (Angular)

> Read this file first, whether you are Claude, DeepSeek, Kiro, or any other AI assistant picking up this project.

## 1. What this project actually is

This is the frontend for a production-quality E-Commerce API portfolio project. The backend
(NestJS + Prisma + PostgreSQL) is fully built, tested, and complete — this frontend is being
built separately, in its own folder/repo, and consumes that backend purely over HTTP.

Goals:
1. Learn to use AI coding assistants professionally — deliberate, reasoned decisions, not
   blind copy-paste.
2. Produce a genuinely professional-looking, working E-Commerce storefront + admin flows
   for a freelance/job-hunting portfolio.

## 2. Tech stack

- **Framework:** Angular (latest stable), standalone components (no NgModules)
- **Language:** TypeScript, strict mode
- **Styling:** Tailwind CSS (utility-first, no Angular Material, no Bootstrap)
- **State:** Angular Signals + services (no NgRx — overkill for this project's size)
- **HTTP:** Angular `HttpClient` with a functional interceptor for auth headers + token refresh
- **Forms:** Reactive Forms (`FormGroup`/`FormControl`), never template-driven forms
- **Rendering:** CSR only (SSR/SSG explicitly declined — no SEO requirement, avoids
  hydration/localStorage complexity)

## 3. How AI tools are used on this project

Same workflow as the backend project:
1. Discuss the requirement/architecture decision with Claude first.
2. Claude gives the reasoning and one precise, scoped prompt — never a whole-feature or
   whole-app prompt at once.
3. Paste that prompt into DeepSeek/Kiro; let it generate the code.
4. Bring the resulting code back to Claude for review (correctness, security — e.g. token
   handling — and whether it matches this file's conventions).
5. Only then move to the next step.

**Golden rule:** if an AI proposes a large multi-file rewrite to work around a small problem,
stop and ask whether there's a simpler fix first.


## 4. Backend API contract

Base URL: `http://localhost:<PORT>/api/v1` (check backend `.env` for `PORT`)
Swagger reference: `http://localhost:<PORT>/api/docs`

### Auth (`/auth`) — all public except logout
| Method | Path                        | Auth | Notes                                              |
|--------|-----------------------------|------|-----------------------------------------------------|
| POST   | /auth/register              | –    | returns `{ accessToken, refreshToken }`             |
| POST   | /auth/login                 | –    | returns `{ accessToken, refreshToken }`; 403 if email not verified |
| POST   | /auth/refresh               | –    | body: `{ refreshToken }`, guarded by RefreshJwtGuard |
| POST   | /auth/logout                | JWT  | invalidates refresh token                            |
| POST   | /auth/verify-email          | –    | body: `{ token }`                                    |
| POST   | /auth/forgot-password       | –    | body: `{ email }`, always 204 (no enumeration)       |
| POST   | /auth/reset-password        | –    | body: `{ token, newPassword }`, invalidates sessions |
| POST   | /auth/resend-verification   | –    | body: `{ email }`, always 204                        |

### Users (`/users`)
| Method | Path        | Auth | Notes                          |
|--------|-------------|------|----------------------------------|
| GET    | /users/me   | JWT  | current user profile             |
| PATCH  | /users/me   | JWT  | update profile (name only)       |

### Products (`/products`) — reads public, writes admin-only
| Method | Path                          | Auth        | Notes                                   |
|--------|-------------------------------|-------------|-------------------------------------------|
| GET    | /products                     | Public      | paginated, query: search/filter/sort (`QueryProductDto`) |
| GET    | /products/category/:categoryId| Public      | products in a category                    |
| GET    | /products/:id                 | Public      | single product                            |
| POST   | /products                     | JWT + ADMIN | create                                     |
| PATCH  | /products/:id                 | JWT + ADMIN | update                                     |
| DELETE | /products/:id                 | JWT + ADMIN | delete, 204                               |

### Categories (`/categories`) — reads public, writes admin-only
| Method | Path              | Auth        | Notes                                          |
|--------|-------------------|-------------|--------------------------------------------------|
| GET    | /categories        | Public      | list all                                          |
| GET    | /categories/:id    | Public      | single category                                   |
| POST   | /categories        | JWT + ADMIN | create                                             |
| PATCH  | /categories/:id    | JWT + ADMIN | update                                             |
| DELETE | /categories/:id    | JWT + ADMIN | 400 if category still has products                |

### Cart (`/cart`) — all require auth, scoped to current user
| Method | Path                     | Notes                                          |
|--------|--------------------------|--------------------------------------------------|
| GET    | /cart                     | returns/creates the user's cart                   |
| POST   | /cart/items                | body: `{ productId, quantity }`, increments if exists |
| PATCH  | /cart/items/:productId      | body: `{ quantity }`, sets new quantity              |
| DELETE | /cart/items/:productId      | remove one item                                     |
| DELETE | /cart                       | clear whole cart                                    |

### Orders (`/orders`) — all require auth, scoped to current user
| Method | Path              | Notes                                                      |
|--------|-------------------|---------------------------------------------------------------|
| POST   | /orders/checkout   | creates order from cart, decrements stock, clears cart; 400 if cart empty/insufficient stock |
| GET    | /orders            | list current user's orders, most recent first                |
| GET    | /orders/:id         | single order (owner-only, 404 otherwise)                     |

### Payments (`/payments`)
| Method | Path                             | Auth   | Notes                                                        |
|--------|-----------------------------------|--------|-----------------------------------------------------------------|
| POST   | /payments/orders/:orderId/intent   | JWT    | returns Stripe `clientSecret`; order must belong to user and be `PENDING` |
| POST   | /payments/webhook                  | Public | Stripe → backend only, frontend never calls this                |

### Health
| Method | Path     | Notes                              |
|--------|----------|----------------------------------------|
| GET    | /health   | public, `{ status, timestamp, database }` |

### Order status values
`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` — payment success/failure transitions
`PENDING` via the webhook; frontend order UI should reflect these four states.

### Roles
Two roles exist: `CUSTOMER` (default) and `ADMIN`. Admin-only endpoints return 403 for

non-admins — the frontend should hide/disable admin actions for non-admin users, but the
real enforcement is always server-side.


## 5. Token storage decision

- **Access token:** `localStorage` — read by the HTTP interceptor on every request
- **Refresh token:** `sessionStorage` — cleared when the tab closes; user must log in again
  in a new tab/session
- **Reasoning:** the backend currently returns both tokens in the response body (not
  HttpOnly cookies), and changing that auth flow is out of scope right now. This is a
  known, accepted trade-off for a portfolio project: real risk is XSS (any injected script
  can read both tokens), mitigated by not adding untrusted third-party scripts/dependencies
  and relying on Angular's default template sanitization.
- **Future enhancement (not v1):** migrate to HttpOnly, Secure, SameSite cookies set by the
  backend — this requires backend changes (cookie-parser, CORS `credentials`, no
  tokens in the JSON body) and is explicitly deferred.

## 6. Folder structure
src/app/
core/ → singletons: auth.service, token.service, http interceptor,
auth.guard, role.guard, error interceptor
shared/ → reusable dumb components, pipes, directives used across features
features/
auth/ → login, register, verify-email, forgot/reset-password pages
catalog/ → products list/detail, categories (public)
cart/ → cart page, cart state
checkout/ → checkout flow, order confirmation
orders/ → order history
account/ → profile (GET/PATCH users/me)
app.routes.ts → lazy-loaded feature routes
app.config.ts → providers (HttpClient, interceptors, router)


Every new feature follows: `feature/pages/`, `feature/<feature>.service.ts`,
`feature/<feature>.routes.ts` (lazy-loaded).

## 7. Conventions

- Conversation/planning with Claude happens in Egyptian Arabic; all code, comments, commit
  messages, and documentation stay in English.
- Design tokens (colors, spacing, typography) always come from `DESIGN_SYSTEM.md` and
  Tailwind config — never hardcode a hex color or arbitrary spacing value in a component.
- No secrets/API URLs hardcoded outside `environment.ts` / `environment.prod.ts`.

## 8. Where to find the plan

See `ROADMAP.md` (to be created after the first setup step) for phase-by-phase status.


## 9. Exact data shapes & conventions

- **Roles are `ADMIN` and `CUSTOMER`** (not `USER` — correcting an earlier assumption)
- **All monetary values (`price`, `total`, `unitPrice`, `subtotal`) are serialized as
  STRINGS** (e.g. `"199.99"`), never numbers — Prisma Decimal → JSON. Parse with
  `parseFloat()`/`Number()` only for display/calculation, never send them back as numbers
  in request bodies where a string is expected.
- **Standard error shape** (NestJS default, no custom filter): `{ statusCode, message, error }`.
  `message` is a single string normally, but an **array of strings** for validation
  errors (`class-validator` failures) — the frontend error handler must handle both cases.
- **Auth response:** `POST /auth/register` and `/auth/login` return exactly
  `{ accessToken: string, refreshToken: string }` — no user object included, so if you need
  the user's name/role right after login, call `GET /users/me` next.
- **Paginated products:** `GET /products` returns
  `{ data: ProductResponseDto[], meta: { total, page, limit, totalPages } }`
- **Query params for `/products`:** `page`, `limit` (max 100), `search`, `minPrice`,
  `maxPrice`, `categoryId`, `sortBy` (`name` | `price` | `createdAt`), `sortOrder`
  (`asc` | `desc`) — all optional
- **Cart response:** `{ id, items: [{ productId, name, price, quantity, subtotal }], total }`
- **Order response:** `{ id, status, total, items: [{ productId, productName, unitPrice,
  quantity, subtotal }], createdAt, updatedAt }` — `status` is one of
  `PENDING | CONFIRMED | CANCELLED | COMPLETED`
- **Payment intent response:** `{ clientSecret: string }` — pass directly to Stripe.js
- **Password rules (register):** 8–72 chars, at least 1 uppercase, 1 lowercase, 1 number,
  1 special character — mirror this in the frontend form validator so the user gets instant
  feedback instead of a round-trip 400
- **Name field (register):** 2–50 characters
- **Token lifetimes:** access token 15m, refresh token 7d — relevant for how long the
  frontend can go before a silent refresh is needed