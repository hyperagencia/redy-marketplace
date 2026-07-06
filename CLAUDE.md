# CLAUDE.md — REDY Marketplace

Marketplace C2C de equipamiento deportivo de segunda mano para Chile. Los vendedores publican productos, un admin los aprueba, los compradores pagan con MercadoPago y REDY cobra 15% de comisión.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (`@tailwindcss/postcss`) + shadcn/ui (Radix) + lucide-react
- **Supabase** — auth + Postgres (`@supabase/ssr`)
- **Cloudinary** — hosting de imágenes de producto (`next-cloudinary` + upload widget unsigned)
- **MercadoPago** — checkout con Payment Brick (`@mercadopago/sdk-react` en cliente, `mercadopago` SDK en servidor)
- Animación: framer-motion, gsap, lenis
- Fuente de marca: **Aktiv Grotesk** (local, `--font-aktiv`) + Geist

## Comandos

```bash
npm run dev            # desarrollo (localhost:3000)
npm run build          # build de producción
npm run lint           # eslint
npm test               # vitest run (unit/route handlers)
npm run test:watch     # vitest en watch
npm run test:coverage  # cobertura v8
npm run test:e2e       # playwright (E2E; reutiliza el dev server en :3000)
npm run test:e2e:ui    # playwright en modo UI
```

## Testing (Vitest)

- Framework: **Vitest** (no Jest — mejor encaje con Next 16 / React 19 / ESM). Config en `vitest.config.ts` (alias `@` → raíz, entorno `node`, setup `test/setup.ts`).
- Los tests viven en `test/**/*.test.ts` y están **excluidos del typecheck del build** (`tsconfig.json` → `exclude: ["node_modules","test"]`).
- Estrategia actual: **route handlers + lógica de dinero** mockeando Supabase y MercadoPago (sin red). Helper reutilizable en `test/helpers/supabase.ts` (`createSupabaseMock` con query-builder encadenable que registra `inserts`/`updates`; `createAuthMock`).
- Cubierto: `process-payment` (recálculo de precio server-side, guards 400/401/409, escrow `held`, decremento de stock, rechazo→`cancelled`), `webhook` (idempotencia, approved/rejected), `confirm-receipt` (`paid→delivered`+`released`, guards), y `lib/utils` + RUT (comisión 15/85, `formatPrice`, `validateRut`).
### E2E (Playwright)

- Config en `playwright.config.ts` (testDir `e2e/`, reutiliza el dev server en :3000, `workers:1`). Specs en `e2e/*.spec.ts`.
- `e2e/smoke.spec.ts` — sin auth ni mutación: landing, `/productos`, detalle, carrito.
- `e2e/purchase.spec.ts` — compra completa en navegador real usando `NEXT_PUBLIC_MP_TEST_BYPASS` (botón "Simular pago aprobado"): login → carrito → checkout → confirmación → confirmar recepción, + asserts en DB (orden `delivered`, transacción `released`, stock 0).
- **Aislamiento**: `e2e/helpers/provision.ts` crea un comprador y un producto de prueba dedicados vía service-role y los **borra en teardown** (no toca inventario/usuarios reales). Parsea `.env.local` a mano (Playwright no lo carga solo).
- Nota anti-flaky: los inputs controlados del checkout se llenan dentro de `expect(...).toPass()` para superar la carrera de hidratación de React.
- Pendiente: tests de componentes con React Testing Library (jsdom por archivo) y CI en GitHub Actions.

## Estructura de rutas (App Router)

Se usan route groups para separar layouts/navbars:

- `app/(public)/` → **Landing** en `/` (marketing). Layout propio. Incluye `api/newsletter`.
- `app/(marketplace)/` → **Tienda**: `/productos`, `/productos/[id]`, `/carrito`, `/checkout`, `/orden/[id]/confirmacion`. Layout propio con navbar de tienda.
- `app/admin/` → **Panel admin**: dashboard, `productos` (cola de aprobación), `productos/[id]`, `vendedores`. Protegido por `middleware.ts` (requiere `role='admin'`).
- `app/vendedor/` → **Panel vendedor**: dashboard, `nuevo` (wizard de alta), `ventas`.
- `app/login`, `app/registro` (cliente), `app/registro/vendedor` → auth (registros separados). `app/test-upload` → prueba de Cloudinary (temporal).
- `app/api/mercadopago/process-payment/` → procesa el pago server-side.

`app/layout.tsx` es el root: carga fuentes y envuelve todo en `CartProvider`.

## Modelo de datos (Supabase — proyecto `klockwlnyiqvpawafhvn`)

7 tablas en `public`:

- **profiles** — 1:1 con `auth.users` (trigger `handle_new_user` crea el perfil con `role='buyer'`). Campos: `role` (`buyer|seller|admin`), `verified`, `blocked` (Activo/Bloqueado del vendedor), `rut` (único), datos de contacto/dirección, métricas (`products_count`, `total_sales`, `commission_earned`, `rating`).
- **categories** — `name`, `slug` (único), `icon`, `image_url`. El wizard de alta espera slugs: `running`, `ciclismo`, `natacion`, `triatlon`, `fitness`, `tecnologia`.
- **products** — `vendor_id`, `category_id`, `name`, `price` (bigint, CLP), `condition` (`excelente|bueno|aceptable`), `images` (text[]), `stock`, `approval_status` (`pending|approved|rejected`), `approved_by`, `rejection_reason`, `available`.
- **orders** — `buyer_id`, `vendor_id`, `subtotal`, `commission_total`, `total`, `status` (`pending|paid|processing|shipped|delivered|cancelled|refunded`), datos de envío + `buyer_rut`/`buyer_notes`, `payment_id`, `payment_status`.
- **order_items** — `order_id`, `product_id`, `vendor_id`, `price`, `commission_rate` (default 15), `commission_amount`, `vendor_amount`.
- **transactions** — `order_id`, `vendor_id`, `amount`, `commission`, `total`, `status` (`held|released|refunded`), `paid_out_at` (payout al vendedor registrado por el admin), `mercadopago_payment_id`, `mercadopago_status`. Modela el escrow. **Saldo pendiente por pagar** = `status='released'` y `paid_out_at IS NULL`; pago al vendedor = `amount - commission`.
- **reviews** — `order_id` (único), `buyer_id`, `vendor_id`, `rating` (1..5), `comment`. Puntuación del comprador al vendedor (la crea el portal de cliente; el admin lee el rating real).
- **claims** — `order_id`, `buyer_id`, `vendor_id`, `reason`, `description`, `status` (`open|in_review|resolved|rejected`). Reclamos; el admin ve los abiertos como alerta.
- **newsletter_subscribers** — `email` (único).

**Modelo de comisión:** REDY cobra **15%** sobre el precio; el vendedor recibe **85%** (`vendor_amount = price - commission_amount`).

## Convenciones Supabase

- `lib/supabase/server.ts` — `createClient()` para Server Components / route handlers (anon key + cookies de sesión).
- `lib/supabase/client.ts` — `createClient()` para Client Components (browser, anon key).
- `lib/supabase/database.ts` — capa de queries reutilizable (`getProducts`, `getProductById`, `getVendors`, `getCategories`, `getAdminStats`). Extender aquí en vez de repetir queries en páginas.
- `middleware.ts` — refresca sesión y protege `/admin`.
- **No existe aún** un cliente service-role; las operaciones privilegiadas (crear orden, descontar stock ajeno) deben migrar a uno.

## Helpers

- `lib/utils.ts` — `cn()`, `formatPrice()` (CLP), `formatDate()` (es-CL).
- `lib/utils/rut.ts` — `formatRut()`, `validateRut()` (RUT chileno).

## Variables de entorno (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY / MERCADOPAGO_ACCESS_TOKEN
NEXT_PUBLIC_POSTHOG_KEY / NEXT_PUBLIC_POSTHOG_HOST   # analítica (opcional; sin key → no-op)
```
Cloudinary usa el upload preset **unsigned** `redy_products` (carpeta `redy/products`).

## Registro e identidad (fricción tipo MercadoLibre)

- **Explorar libre**: se puede navegar y **armar el carrito sin sesión** (`AddToCartButton` y `/carrito` no exigen login). La cuenta se pide **recién en el checkout**: el botón "Continuar" del carrito va a `/login?redirect=/checkout` si no hay sesión.
- **Auth honra `?redirect=`**: `LoginForm`/`RegisterForm` ([components/auth/](components/auth/)) leen `redirect` (páginas envueltas en `<Suspense>` porque usan `useSearchParams`). Tras login/registro, vuelven a `redirect` o, si no hay, por rol (buyer→`/cuenta`, seller→`/vendedor`, admin→`/admin`).
- **Registros separados**: `/registro` = cliente (`role='buyer'`), `/registro/vendedor` = vendedor (`role='seller'`); el `RegisterForm` recibe `role`. El CTA "Vender" del navbar apunta a `/registro/vendedor`.
- **Navbar auth-aware** ([components/landing/Navbar.tsx](components/landing/Navbar.tsx)): logueado → solo ícono de perfil → `/cuenta`; deslogueado → "Ingresar" + "Crear cuenta".
- **Analítica**: al registrarse se dispara `user_signed_up` + `identify` (PostHog). Supabase Auth con **auto-confirm** (sin verificación de email) para no frenar la compra.
- **Usuario de prueba**: `cliente@redy.cl` / `password123` (comprador); `vendedor1@redy.cl` / `password123` (vendedor). Onboarding step-by-step (deporte, talla…) queda para más adelante (`preferences jsonb` futura).

## Portal de cliente (`/cuenta`)

Área del comprador (bajo el grupo `(marketplace)`, usa el navbar de tienda). Requiere sesión; usa `createClient()` (RLS permite al comprador leer sus órdenes y perfiles de vendedores).
- **Mis compras** ([app/(marketplace)/cuenta/page.tsx](app/(marketplace)/cuenta/page.tsx) → [components/marketplace/account/OrderCard.tsx](components/marketplace/account/OrderCard.tsx)): órdenes del comprador con productos, **contacto del vendedor** (nombre + teléfono + WhatsApp, para coordinar la entrega del producto usado), estado, y acciones: **marcar recibido** (reusa `ConfirmReceiptButton`), **puntuar al vendedor** y **presentar reclamo** (modales).
- **Mi perfil** ([app/(marketplace)/cuenta/perfil/page.tsx](app/(marketplace)/cuenta/perfil/page.tsx) → [components/marketplace/account/ProfileForm.tsx](components/marketplace/account/ProfileForm.tsx)): editar datos y dirección (update de `profiles` vía RLS propia).
- **APIs**: `POST /api/orders/[id]/review` (crea `reviews` una-por-orden y recalcula `profiles.rating`; requiere orden `delivered`) y `POST /api/orders/[id]/claim` (crea `claims`; un reclamo abierto por orden). Ambas validan que la orden sea del comprador.
- El navbar ([components/landing/Navbar.tsx](components/landing/Navbar.tsx)) es auth-aware: "Mi cuenta" (→ `/cuenta`) si hay sesión, "Ingresar" si no.

## Panel Admin

- **Datos con service-role**: las políticas RLS de `orders` solo dejan ver al comprador/vendedor, así que el admin lee vía `createServiceClient()`. Toda la capa de datos admin está en [lib/supabase/admin.ts](lib/supabase/admin.ts): `getVendorsWithStats`, `getSalesStats`, `getSales`, `getOpenClaims`. Ojo: `transactions.vendor_id`/`claims.vendor_id` referencian `auth.users` (no `profiles`), por eso los nombres de vendedor se mapean aparte (`vendorNameMap`), no con embed de PostgREST.
- **Vendedores** ([app/admin/vendedores/page.tsx](app/admin/vendedores/page.tsx) → [components/admin/VendorsClient.tsx](components/admin/VendorsClient.tsx)): vendedores reales con products_count/GMV/comisión/rating/saldo pendiente, badge Activo/Bloqueado, alerta de reclamos, y acción **Bloquear/Reactivar**.
- **Ventas** ([app/admin/ventas/page.tsx](app/admin/ventas/page.tsx) → [components/admin/SalesClient.tsx](components/admin/SalesClient.tsx)): KPIs (GMV, ingreso REDY, saldo por pagar, AOV, take rate, comisión mes), tabla filtrable por fecha/vendedor/estado (query params), **payouts por vendedor** ("Marcar pagado") y alertas de reclamos.
- **APIs admin** (protegidas por `requireAdmin()` en [lib/supabase/server.ts](lib/supabase/server.ts) — el middleware solo cubre las páginas): `POST /api/admin/vendors/[id]/block` (togglea `blocked`) y `POST /api/admin/vendors/[id]/payout` (marca `paid_out_at` de las released pendientes).
- **Bloqueo**: enforced server-side por la policy RLS de INSERT de `products` (exige `profiles.blocked=false`).
- `lib/mock-data.ts` fue **eliminado** (ya no se usan datos ficticios).

## Analítica (PostHog)

- `posthog-js` (cliente) + `posthog-node` (servidor). **Gated por `NEXT_PUBLIC_POSTHOG_KEY`**: sin key, todo queda no-op (no rompe nada).
- Cliente: provider en `app/PostHogProvider.tsx` (montado en `app/layout.tsx`) que inicializa PostHog, captura `$pageview` en cada cambio de ruta e **`identify()` con el `user.id` de Supabase** (une sesión anónima → usuario). `components/analytics/TrackEvent.tsx` dispara un evento al montar (para páginas que son Server Components).
- Servidor: `lib/posthog/server.ts` → `captureServer(userId, event, props)` para eventos que ocurren en route handlers (resultado del pago, entrega). Nunca lanza: la analítica no debe romper el negocio.
- **Reverse proxy** en `next.config.ts` (`/ingest/*` → PostHog) para esquivar adblockers.
- Taxonomía centralizada en `lib/analytics/events.ts`. Funnel: `product_viewed → add_to_cart → checkout_started → payment_submitted → payment_approved → order_delivered` (los dos últimos disparados **desde el servidor**).

## Flujo de compra (estado real)

1. Producto se agrega al carrito (`CartContext`, persistido en `localStorage`). **Un solo vendedor por carrito.**
2. `/checkout` (client) pide datos de envío y el `Payment` Brick envía `{ items, shipping, paymentData }` a `/api/mercadopago/process-payment`.
3. **Todo server-side**: el route handler autentica al comprador por cookie, **recalcula precios/total desde `products`** (integridad de precio), crea `orders` + `order_items`, cobra en MercadoPago, y en `approved` registra `transactions` (escrow `held`) y descuenta stock — todo con `createServiceClient()` (service-role).
4. Éxito → limpia carrito, redirige a `/orden/{orderId}/confirmacion`.
5. **Webhook** `/api/mercadopago/webhook` reconcilia pagos asíncronos (`pending → approved/rejected`), idempotente. Requiere registrar la URL en el panel de MercadoPago.
6. Comprador confirma recepción en la página de confirmación → `/api/orders/[id]/confirm-receipt` pasa la orden a `delivered` y libera el escrow (`transactions → released`).
7. Vendedor ve la venta en `/vendedor/ventas` (pagos `held` = por confirmar; `delivered`/`released` = disponibles) y coordina entrega por WhatsApp.

**Estados**: `orders.status` usa `pending|paid|delivered|cancelled`; `transactions.status` usa `held|released`.

## Estado / deuda técnica

MVP funcional en el "happy path" (tarjeta aprobada), pero con bloqueadores conocidos. Ver detalle y prioridad en las memorias del proyecto. Resumen:

- 🔴 **RLS**: estaba desactivado en `products` (políticas ya existían). Revisar estado actual antes de asumir.
- 🔴 **Insert de `transactions`** usaba columnas/estados inexistentes → fallaba silenciosamente. Verificar si ya se corrigió.
- 🔴 **Estados de orden inválidos** (`pending_payment`, `payment_failed`) violan el CHECK de `orders`.
- 🟠 **Integridad de precio**: la orden/total se generaban en el cliente. El total debe recalcularse server-side desde `product.price`.
- 🟡 **Landing** en `/` es placeholder; newsletter sin form conectado. `lib/mock-data.ts` obsoleto. Navbars duplicados (`Navbar` + `LandingNavbar`).
- 🟡 **Registro**: crea el perfil vía trigger y actualiza el rol desde el cliente; puede fallar si Auth tiene confirmación de email activada (sin sesión, la update queda sin `auth.uid()`).
- 🟡 **Auth**: activar *leaked password protection* en el dashboard de Supabase.

**Ya resuelto (jul-2026):** RLS activado en `products`/`newsletter_subscribers`; flujo de compra movido a servidor con recálculo de precio; `transactions` y estados de orden corregidos; **webhook** de MercadoPago y **confirmación de recepción** (libera escrow) implementados.

**Pendiente configuración:** registrar la URL del webhook (`/api/mercadopago/webhook`) en el panel de MercadoPago. Falta una vista "mis órdenes" para que el comprador vuelva a confirmar recepción más tarde (hoy solo desde la página de confirmación).

**⚠️ Bloqueador MercadoPago (sandbox MLC):** la API de MP Chile devuelve 500 en `payment_methods/installments` para las credenciales de prueba actuales → el Payment Brick no carga ("failed to get payment methods"). No es bug del proyecto; se resuelve regenerando credenciales de prueba de la app en el panel de MP y/o usando usuarios de prueba.

**⚠️ Modo prueba (QUITAR antes de producción):** con `NEXT_PUBLIC_MP_TEST_BYPASS=1` (y access token `TEST-`), el checkout muestra un botón "Simular pago aprobado" y `process-payment` simula la aprobación sin llamar a MP. Sirvió para verificar el flujo end-to-end (orden `paid→delivered`, transacción `held→released`, stock, comisión 15/85). Desactivar (env var a 0 o borrarla) antes de desplegar.
