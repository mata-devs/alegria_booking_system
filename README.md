# VisitCebu

A Cebu tourism booking platform for guests, tour operators, and super-admins. Guests browse locations, activities, and tour packages, then book and pay online. Operators manage bookings, check-ins, and analytics. Super-admins oversee operators, revenue, vouchers, reviews, and site content.

---

## Tech Stack

### Frontend (`app/`)

| Tool | Version | Purpose |
|------|---------|---------|
| [Next.js](https://nextjs.org) | 15 | Full-stack React framework (App Router) |
| [React](https://react.dev) | 18.3 | UI framework |
| [TypeScript](https://www.typescriptlang.org) | 5 | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | 3.4 | Utility-first styling |
| [Firebase SDK](https://firebase.google.com) | 12 | Auth, Firestore, Storage (client) |
| [Recharts](https://recharts.org) | 2.15 | Analytics charts (bar, line, pie) |
| [Radix UI](https://www.radix-ui.com) | — | Headless UI primitives |
| [Lucide React](https://lucide.dev) | — | Icon set |
| [react-icons](https://react-icons.github.io/react-icons) | 5 | Additional icon set |
| [vaul](https://vaul.emilkowal.ski) | 1 | Slide-out drawer primitive |
| [dnd-kit](https://dndkit.com) | — | Drag-and-drop (site-content CMS) |
| [Zod](https://zod.dev) | 4 | Search param schema validation |
| [@tanstack/react-table](https://tanstack.com/table) | 8 | Table primitives |
| [react-qr-code](https://github.com/rosskhanas/react-qr-code) | 2.0 | Scannable QR code generation |
| [@zxing/browser](https://github.com/zxing-js/library) | 0.2 | QR code scanning (operator check-in) |
| [@sankyu/react-circle-flags](https://github.com/HatScripts/circle-flags) | — | Country flag icons (phone prefix picker) |
| [country-data-list](https://github.com/planet-cards/country-data-list) | — | Country + dial-code data |
| [class-variance-authority](https://cva.style) | — | Variant-based className utility |
| [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) | — | `cn()` className helper |
| [ESLint](https://eslint.org) | 9 | Linting |
| [@playwright/test](https://playwright.dev) | 1.59 | E2E testing |

### Backend (`functions/`)

| Tool | Version | Purpose |
|------|---------|---------|
| [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) | 13 | Server-side Firestore, Auth, Storage |
| [Firebase Functions v2](https://firebase.google.com/docs/functions) | 7 | Cloud Functions (HTTP + Firestore triggers) |
| [Express](https://expressjs.com) | 5 | HTTP API framework for booking + operator endpoints |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | 7 | Rate limiting on booking API |
| [Helmet](https://helmetjs.github.io) | 8 | HTTP security headers |
| [Nodemailer](https://nodemailer.com) | 7 | Transactional email (review requests, signup links) |
| [qrcode](https://github.com/soldair/node-qrcode) | 1.5 | Server-side QR code generation |
| Node.js | 24 | Runtime |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Frontend

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000` and is accessible on the local network (bound to `0.0.0.0`). Use `http://<your-local-ip>:3000` to open from a phone or other device on the same network.

### Backend (Cloud Functions)

```bash
cd functions
npm install
npm run build
```

Deploy with `firebase deploy --only functions`.

**CORS (required for browser booking):** copy `functions/.env.example` to `functions/.env` and set `ALLOWED_ORIGINS` to every origin that calls the API (comma-separated), for example:

```env
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.web.app,https://your-app.firebaseapp.com
```

Redeploy functions after changing `functions/.env`. Without this, production blocks all cross-origin requests and the browser shows a CORS / "Failed to fetch" error.

### Firestore Rules, Indexes & Storage Rules

Deploy `firestore.rules`, `firestore.indexes.json`, and `storage.rules` in one shot:

```powershell
npx -y firebase-tools@latest deploy --only firestore:rules,firestore:indexes,storage
```

Note: storage uses `storage` (not `storage:rules`) — `storage:<name>` is reserved for `firebase target:apply` deploy targets.

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FUNCTIONS_BASE_URL=https://asia-southeast1-alegria-booking-system.cloudfunctions.net/api
```

Use the Cloud Run URL from `apphosting.yaml` if that is what you deploy with (`https://api-….run.app`). `next.config.ts` allows both `*.cloudfunctions.net` and `*.run.app` in `connect-src`.

### Other Scripts

```bash
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Run ESLint
npm run test:e2e        # Run Playwright E2E tests (headless)
npm run test:e2e:ui     # Run Playwright E2E tests (interactive UI)
npm run scan            # Trivy: scan deps + secrets + misconfigs + licenses (HIGH/CRITICAL)
npm run scan:vuln       # Trivy: scan dependencies only (HIGH/CRITICAL)
npm run scan:secrets    # Trivy: scan for hardcoded secrets
npm run scan:license    # Trivy: scan for license issues
npm run scan:sonar      # SonarQube analysis (@sonar/scan)
```

---

## E2E Testing

Playwright is used for end-to-end tests. Tests live in `tests/e2e/`.

```bash
npm run test:e2e        # headless
npm run test:e2e:ui     # interactive UI mode
```

### Test suites

| File | Description |
|------|-------------|
| `bookingActivities.spec.ts` | Activity booking flow (guest info → payment with inline confirmation) |
| `booking-tour-package.spec.ts` | Tour package booking: guest constraints, form validation, full happy path |

### Happy path tests (Firestore writes)

The full happy path tests are skipped by default. Set these in `.env` to enable:

```env
ENABLE_BOOKING_TESTS=true
TEST_PACKAGE_ID=<firestore-package-id>
TEST_PACKAGE_NAME=<package-name>
TEST_PACKAGE_OPERATOR_ID=<operator-uid>
TEST_PACKAGE_MIN_GUESTS=2
TEST_PACKAGE_MAX_GUESTS=10
```

---

## Security Scanning

[Trivy](https://trivy.dev) scans the codebase locally for vulnerabilities, secrets, misconfigurations, and license issues. Install via Scoop on Windows:

```powershell
scoop install trivy
```

Then run:

```bash
npm run scan            # full scan (vuln + secrets + misconfigs + licenses, HIGH/CRITICAL only)
npm run scan:vuln       # CVEs in node_modules only (HIGH/CRITICAL)
npm run scan:secrets    # hardcoded API keys / tokens
npm run scan:license    # license compliance
```

Run `npm run scan:secrets` before committing — the project contains Firebase credentials in `.env`.

[SonarQube](https://www.sonarsource.com) static analysis via `@sonar/scan`:

```bash
npm run scan:sonar
```

Requires a `sonar-project.properties` file or `-Dsonar.*` env vars configured for your SonarQube server.

---

## Project Structure

```
app/
├── layout.tsx                           # Root layout — fonts, providers
├── globals.css                          # Global styles + Tailwind base
├── types.ts                             # Shared TypeScript interfaces (Location, Activity, TourPackage)
│
├── (guest)/                             # Guest-facing pages
│   ├── _components/
│   │   ├── HomeCarousels.tsx            # Operator marquee + discovery carousels (locations, activities, packages, offers)
│   │   └── HomeHero.tsx                 # Hero slideshow + SearchBar — CMS-driven images with FallbackHero fallback
│   ├── layout.tsx                       # Guest layout (Navbar + Footer)
│   ├── page.tsx                         # Landing page (hero slideshow, carousels, ticker)
│   ├── accommodations/
│   │   └── page.tsx                     # Filterable accommodations grid with sorting
│   ├── activities/
│   │   ├── page.tsx                     # Filterable activity grid + overlapping SearchBar (filters by location/date/travelers)
│   │   └── [activityId]/
│   │       └── page.tsx                 # Activity detail page
│   ├── locations/
│   │   ├── page.tsx                     # Location grid with search — CMS-ordered, approved reviews
│   │   └── [municipalityId]/
│   │       └── page.tsx                 # Per-location hero (CMS image) + SearchBar + activity cards + reviews + other locations carousel
│   ├── operators/
│   │   ├── page.tsx                     # Operators listing with ratings
│   │   └── [operatorId]/
│   │       └── page.tsx                 # Public operator profile page
│   ├── review/
│   │   └── page.tsx                     # Guest review submission form
│   ├── tour-packages/
│   │   ├── page.tsx                     # Filterable tour packages grid + overlapping SearchBar (filters by location/date/travelers)
│   │   └── [packageId]/
│   │       └── page.tsx                 # Package detail, itinerary, guides, chatbot
│   └── booking/
│       ├── _components/
│       │   └── ItemDetailModal.tsx      # Shared booking-flow item detail modal
│       ├── guest-info/
│       │   ├── page.tsx                 # Guest info form + payment method select (GCash/Maya, BDO, BPI)
│       │   └── _components/
│       │       ├── BookingSidebar.tsx   # Sticky package/price summary sidebar
│       │       ├── CountryDropdown.tsx  # Country + phone-prefix picker
│       │       ├── FormActions.tsx      # Bottom Go Back / Next nav
│       │       ├── GuestsList.tsx       # Per-guest fields list (adult/child)
│       │       ├── RepresentativeForm.tsx # Lead-guest form
│       │       └── TourOperatorDropdown.tsx # Operator selector
│       └── payment/
│           ├── page.tsx                 # Operator-specific payment instructions, receipt upload, inline success + booking reference
│           └── _components/
│               ├── BookingSummary.tsx   # Price + booking recap
│               ├── PaymentInstructions.tsx # Bank / e-wallet step-by-step + QR when applicable
│               └── UploadPayment.tsx    # Drag & drop receipt uploader
│
├── (operator)/                          # Tour operator portal
│   └── operator/
│       ├── layout.tsx                   # Operator layout (sidebar nav)
│       ├── page.tsx                     # Operator home / redirect
│       ├── _components/                 # Shared operator-portal components (decoupled from pages)
│       │   ├── ui/                      # Local chart UI primitives (shadcn-style)
│       │   │   ├── chart.tsx
│       │   │   ├── card.tsx
│       │   │   └── button.tsx
│       │   ├── shared/                  # Cross-feature primitives (used by activities + tour-packages)
│       │   │   ├── StarDisplay.tsx
│       │   │   ├── StatusBadge.tsx
│       │   │   ├── FormSectionHeader.tsx
│       │   │   ├── LivePreviewPane.tsx  # Desktop/mobile preview switcher shell
│       │   │   ├── compress-image.ts    # Canvas-based JPEG compression
│       │   │   ├── constants.ts         # MIN_IMAGES, MAX_IMAGES, MAX_SIZE_MB
│       │   │   ├── types.ts             # ImageSlot discriminated union
│       │   │   └── images/
│       │   │       ├── SortableImageCard.tsx   # dnd-kit sortable image slot
│       │   │       └── PackageImagesEditor.tsx # Image grid + reorder + upload
│       │   ├── activities/              # Activities CRUD modals + helpers
│       │   │   ├── AddActivityModal.tsx
│       │   │   ├── EditActivityModal.tsx
│       │   │   ├── DeleteActivityModal.tsx
│       │   │   ├── ViewDetailsModal.tsx
│       │   │   ├── FiltersModal.tsx
│       │   │   ├── ActivityPreviewPanel.tsx    # Live preview body
│       │   │   ├── OperatorActivityCard.tsx
│       │   │   ├── MunicipalityCombobox.tsx
│       │   │   ├── compress-image.ts
│       │   │   ├── constants.ts         # EMPTY_FORM, EMPTY_FILTERS, image limits
│       │   │   ├── types.ts             # OperatorActivity, Filters, form state, FormErrors
│       │   │   └── images/
│       │   │       └── ActivityImagesEditor.tsx
│       │   └── tour-packages/           # Tour-package CRUD modals + helpers
│       │       ├── AddPackageModal.tsx
│       │       ├── EditPackageModal.tsx
│       │       ├── DeletePackageModal.tsx
│       │       ├── ViewDetailsModal.tsx
│       │       ├── FiltersModal.tsx
│       │       ├── PackagePreviewPanel.tsx     # Live preview body
│       │       ├── OperatorPackageCard.tsx
│       │       ├── ItineraryEditor.tsx
│       │       ├── TagCombobox.tsx
│       │       ├── constants.ts
│       │       └── types.ts
│       ├── bookings/                    # Live booking management (calendar + list)
│       │   ├── page.tsx
│       │   ├── calendar.tsx             # Week-view calendar component
│       │   ├── list.tsx                 # Booking request list
│       │   ├── details.tsx              # Booking detail modal
│       │   ├── modalfilter.tsx
│       │   └── scanner/
│       │       └── page.tsx             # QR code scanner for booking check-in
│       ├── history/                     # Past booking history with filters
│       │   ├── page.tsx
│       │   ├── list.tsx
│       │   ├── details.tsx
│       │   └── modalfilter.tsx
│       ├── notifications/
│       │   └── page.tsx                 # Operator notifications inbox
│       ├── analytics/                   # Revenue, booking, and promo charts (+ CSV export)
│       │   ├── page.tsx                 # Dashboard shell with KPI cards inline
│       │   ├── loading.tsx              # Skeleton loader
│       │   ├── filter.tsx
│       │   ├── linechart.tsx            # Bookings trend (dynamic Y-axis)
│       │   ├── barchart.tsx             # Age distribution
│       │   ├── barcharty.tsx            # Affiliated entities horizontal bar
│       │   ├── piechart.tsx             # Tourist nationalities (circle-flags per country)
│       │   ├── piechart2.tsx            # Promo code usage
│       │   └── payment.tsx              # Payment methods
│       ├── activities/
│       │   └── page.tsx                 # Operator-managed activities CRUD (thin shell; modals + form live in _components/activities/)
│       ├── tour-packages/
│       │   └── page.tsx                 # Operator-managed tour packages CRUD (thin shell; modals + form live in _components/tour-packages/)
│       ├── voucher-codes/
│       │   └── page.tsx                 # Operator promo / voucher codes
│       └── settings/
│           └── page.tsx                 # Operator profile + payment methods settings
│
├── (admin)/                             # Super-admin portal
│   └── super-admin/
│       ├── layout.tsx                   # Admin layout (sidebar nav)
│       ├── operators/                   # Operator account management
│       │   ├── page.tsx
│       │   └── loading.tsx
│       ├── analytics/                   # Platform-wide analytics with operator filter
│       │   ├── page.tsx
│       │   ├── loading.tsx
│       │   └── _components/
│       │       └── filter.tsx
│       ├── homepage/                    # Legacy homepage CMS (hero + ticker)
│       │   ├── page.tsx
│       │   ├── loading.tsx
│       │   └── _components/
│       │       ├── HeroEditor.tsx
│       │       ├── PreviewPane.tsx
│       │       └── TickerEditor.tsx
│       ├── site-content/                # Full site content CMS (hero + ticker + locations grid)
│       │   ├── page.tsx
│       │   ├── loading.tsx
│       │   └── _components/
│       │       ├── HeroEditor.tsx
│       │       ├── LocationsEditor.tsx  # Drag-and-drop location ordering + image upload
│       │       ├── PreviewPane.tsx      # Live preview (ticker + locations grid)
│       │       └── TickerEditor.tsx
│       ├── notifications/
│       │   └── page.tsx                 # Super-admin notifications inbox
│       ├── revenue/                     # Revenue reports
│       │   ├── page.tsx
│       │   └── loading.tsx
│       ├── reviews/                     # Review moderation (approve / reject / flag)
│       │   ├── page.tsx
│       │   └── loading.tsx
│       ├── vouchers/                    # Voucher code oversight
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── loading.tsx
│       │   ├── code/
│       │   │   └── page.tsx
│       │   └── entity/
│       │       └── page.tsx
│       └── settings/                    # Admin profile, photo, password
│           ├── page.tsx
│           └── loading.tsx
│
├── login/
│   └── page.tsx                         # Unified login page (guest / operator / admin)
│
├── operator-signup/
│   └── page.tsx                         # Operator signup form (token-validated invite)
│
├── reset-password/
│   ├── page.tsx                         # Password reset entry
│   └── ResetPasswordClient.tsx          # Client-side reset flow
│
├── api/
│   └── payment-image/
│       └── route.ts                     # Proxy + allow-list for Firebase Storage receipt images
│
├── components/
│   ├── Navbar.tsx                       # Logo + nav links + currency converter (guest layout)
│   ├── Footer.tsx                       # Dark green footer
│   ├── SearchBar.tsx                    # Where / When / Travelers search bar — CMS location thumbnails, activity + package counts
│   ├── ActivityCard.tsx                 # Activity listing wrapper → ui/PackageCard (cardKind=activity)
│   ├── LocationCard.tsx                 # Location card with activity count
│   ├── LocationOfferCounts.tsx          # Activity + package count badges for location cards
│   ├── GuestReviewCard.tsx              # Approved guest review display
│   ├── MunicipalityTicker.tsx           # Scrolling news ticker with municipality highlights
│   ├── LocationPicker.tsx               # Leaflet map picker (value/onChange) — used in operator signup
│   ├── AccountAvatar.tsx                # User avatar with initials fallback
│   ├── NotificationsBell.tsx            # Bell icon with unread badge
│   ├── NotificationToast.tsx            # In-app toast for new notifications
│   ├── NotificationThumbnail.tsx        # Compact notification preview card
│   ├── PaymentUndoToast.tsx             # Toast with undo action for payment status changes
│   ├── RightRail.tsx                    # Sticky right-rail slot (detail pages)
│   ├── ToastItem.tsx                    # Generic toast primitive
│   ├── Auth.tsx                         # Firebase auth UI component
│   ├── auth/
│   │   ├── LoginPanel.tsx               # Email/password login panel
│   │   ├── ResetPasswordPanel.tsx       # Password reset panel
│   │   └── types.ts                     # Auth panel shared types
│   ├── ui/
│   │   ├── Skeleton.tsx                 # Skeleton loader primitives (Skeleton, SkeletonCard, SkeletonRow)
│   │   ├── BentoGallery.tsx             # Bento-grid image gallery with Lightbox
│   │   ├── PackageCard.tsx              # Shared listing card — activities + tour packages (cardKind badge, gray placeholder when no image)
│   │   ├── ToggleSwitch.tsx             # Toggle switch primitive
│   │   └── drawer.tsx                   # Slide-out drawer (Drawer, DrawerHeader, DrawerFooter)
│   ├── (operator)/
│   │   ├── OperatorSidebar.tsx          # Operator nav sidebar
│   │   └── RoleGuard.tsx                # Role-based route protection
│   └── (admin)/
│       └── SuperAdminSidebar.tsx        # Super-admin nav sidebar
│
├── context/
│   ├── AuthContext.tsx                  # Firebase auth state (AuthProvider + useAuth)
│   └── BookingContext.tsx               # Booking flow state (BookingProvider + useBooking)
│
├── hooks/
│   ├── useNotifications.ts              # Firestore real-time notifications stream
│   ├── useOperatorBookings.ts           # Firestore booking stream for operators
│   └── useSessionStorage.ts             # Type-safe sessionStorage hook
│
├── lib/
│   ├── firebase.ts                      # Firebase client SDK init + exports
│   ├── types.ts                         # UserRole, UserStatus, UserProfile types
│   ├── schema.ts                        # Firestore schema constants + form value types
│   ├── analytics-service.ts             # Analytics data fetch + sample dashboard
│   ├── booking-service.ts               # Client-side booking helpers (payment status, operator info)
│   ├── firestoreToBooking.ts            # Firestore document → Booking type mapper
│   ├── reviews-service.ts               # Fetch approved reviews for activities / packages / catalog
│   ├── homepage-cms.ts                  # Homepage CMS read/write helpers (hero, ticker, locations)
│   ├── homepage-cms.server.ts           # Server-side CMS helpers (REST API direct read)
│   ├── guest-location-list.ts           # Merge Firestore counts for guest location browse UI
│   ├── cebu-municipalities.ts           # Municipality slug ↔ label helpers
│   ├── getDayCapacity.ts                # Same-day booking counts for availability hints on grids
│   ├── csvExport.ts                     # Client-side CSV download helpers (operator analytics)
│   ├── activity-tags.ts                 # Activity tag taxonomy
│   ├── searchSchema.ts                  # Guest listing search param parser (Zod)
│   ├── serviceCharge.ts                 # Service charge constant
│   └── utils.ts                         # cn() utility (clsx + tailwind-merge)
│
└── data/
    └── mockData.ts                      # Static seed data (locations, activities, packages, reviews)

functions/src/
├── index.ts                             # Entry point — re-exports all Cloud Functions
├── shared/
│   ├── firebase.ts                      # Admin SDK init (guarded), db/auth/bucket exports
│   ├── helpers.ts                       # assertSuperAdmin, generateOperatorId, copyFile, extractPathFromUrl
│   └── mailer.ts                        # Nodemailer transporter + from-address resolver
├── booking/
│   ├── api.http.ts                      # onRequest wrapper (asia-southeast1)
│   ├── app.ts                           # Express app — CORS, Helmet, rate-limit, auth; public booking/review routes; operator check-in, complete, reschedule, resend-review
│   ├── routes/bookings.routes.ts        # POST /bookings, POST /bookings/:bookingId/confirm
│   ├── controllers/booking.controller.ts
│   └── services/booking.service.ts      # Full booking creation logic (idempotency, slots, promos)
├── operator/
│   ├── syncAuthStatus.ts                # Firestore trigger — sync operator auth disabled flag
│   ├── approveSignup.ts                 # onCall — approve operator signup, create Auth user
│   ├── declineSignup.ts                 # onCall — decline operator signup
│   └── sendSignupLink.ts                # onCall — email a tokenised signup link
├── notifications/
│   ├── onBookingCreate.ts               # Firestore trigger — write notification on new booking
│   └── writeNotification.ts             # Helper — write notification document to Firestore
└── reviews/
    ├── completeInProgressBookings.ts    # Scheduled — auto-complete in-progress bookings after grace period
    ├── onReviewStatusChanged.ts         # Firestore trigger — react to review approve/reject/flag
    └── sendReviewEmail.ts               # Send review-request email to guest after booking completion
```

---

## Pages & Routing

### Guest

| Route | Page | Description |
|-------|------|-------------|
| `/` | LandingPage | Auto-rotating hero slideshow + discovery carousels + municipality ticker |
| `/accommodations` | AccommodationsPage | Filterable accommodations grid with sorting |
| `/locations` | LocationsPage | Browse and search Cebu locations; CMS-ordered with approved reviews |
| `/locations/[municipalityId]` | MunicipalityView | CMS hero image, linked activities + packages, reviews, other locations carousel |
| `/activities` | ActivitiesPage | All activities with SearchBar, filter chips, and same-day capacity hints |
| `/activities/[activityId]` | ActivityDetail | Single-activity detail + approved reviews |
| `/tour-packages` | TourPackagesPage | All tour packages with SearchBar, filter chips, and same-day capacity hints |
| `/tour-packages/[packageId]` | TourPackageDetail | Package detail, itinerary, guides, chatbot, approved reviews |
| `/operators` | OperatorsPage | Browse tour operators with ratings |
| `/operators/[operatorId]` | OperatorProfilePage | Public operator profile with ratings breakdown |
| `/review` | ReviewPage | Guest review submission form (post-booking) |
| `/booking/guest-info` | GuestInfoForm | Guest details + payment method selection (e-wallet or bank) |
| `/booking/payment` | PaymentPage | Operator-specific payment instructions, receipt upload, inline confirmation with booking reference |

### Operator

| Route | Description |
|-------|-------------|
| `/operator` | Operator home / redirect |
| `/operator/bookings` | Live booking management (week-view calendar + request list) |
| `/operator/bookings/scanner` | QR code scanner for booking check-in |
| `/operator/history` | Past booking history with search and filters |
| `/operator/notifications` | Notifications inbox |
| `/operator/analytics` | Revenue, booking trend, age, nationality, promo, payment charts; CSV download |
| `/operator/activities` | Operator-managed activities CRUD |
| `/operator/tour-packages` | Operator-managed tour packages CRUD |
| `/operator/voucher-codes` | Operator promo / voucher code management |
| `/operator/settings` | Operator profile + payment method configuration |

### Super-Admin

| Route | Description |
|-------|-------------|
| `/super-admin/operators` | Approve / manage operator accounts |
| `/super-admin/analytics` | Platform-wide analytics with operator + demographic filters |
| `/super-admin/revenue` | Revenue reports |
| `/super-admin/site-content` | CMS — hero images, municipality ticker, locations grid (drag-and-drop, image upload) |
| `/super-admin/notifications` | Notifications inbox |
| `/super-admin/vouchers` | Voucher code oversight (code + entity sub-pages) |
| `/super-admin/reviews` | Review moderation (approve / reject / flag) |
| `/super-admin/settings` | Profile, photo, and password |

### Auth

| Route | Description |
|-------|-------------|
| `/login` | Unified login (routes to operator or admin portal by role) |
| `/operator-signup` | Token-validated operator signup form |
| `/reset-password` | Password reset flow |

### API Routes

| Route | Description |
|-------|-------------|
| `/api/payment-image` | Allow-listed proxy for Firebase Storage receipt images |

---

## Booking Flow

```
Landing → Locations → Municipality View → Tour Package Detail
       → Guest Info Form → Payment (upload receipt → success + booking reference on same page)
```

---

## Key Features

- **Hero slideshow** — Auto-rotating CMS-driven background images on the landing page
- **Municipality ticker** — Scrolling news-style ticker with location highlights on the landing page
- **CMS-driven location images** — Super-admin uploads images per municipality via site-content editor; guest `/locations` grid, `/locations/[municipalityId]` hero, and SearchBar "Where" suggestions use these images in real-time
- **Searchable location dropdown** — Shared `SearchBar` on the landing page, `/activities`, `/tour-packages`, and municipality views: filters municipalities with live activity + tour-package counts; shows CMS thumbnails when configured (pin icon fallback otherwise); dropdown stacks above listing card overlays
- **Floating chatbot** — Context-aware assistant on the Tour Package Detail page
- **Approved guest reviews** — Firestore-backed reviews on locations catalog, activity detail, and tour package detail
- **Guest review submission** — Post-booking review form at `/review`
- **Availability hints** — Same-day capacity counts on activities and tour-packages grids
- **Dynamic location catalog** — Activity/package counts per municipality merged from Firestore
- **Operator public profiles** — Browsable operator listing with ratings at `/operators`; initials avatar when no profile photo
- **Operator analytics export** — Download dashboard metrics as CSV
- **Multiple payment methods** — GCash/Maya (with QR when configured), BDO, BPI; operator-specific account details from Firestore
- **File upload** — Drag & drop or browse for payment screenshot upload
- **Sticky booking sidebar** — Date picker, adult/child traveler count, and Book Now on package detail
- **Fixed bottom navigation** — Go Back / Next buttons on booking flow pages
- **Role-based auth** — Firebase Auth with `UserRole` guard (guest / operator / super-admin)
- **Operator booking calendar** — Week-view calendar + booking request list
- **QR check-in scanner** — Operator scans guest QR code to mark booking attended
- **Operator booking reschedule** — Operators can reschedule confirmed bookings
- **Notifications system** — Real-time Firestore-backed notifications with bell icon, toast, and inbox for operators and super-admin
- **Analytics dashboards** — Bar, line, and pie charts via Recharts for operators and super-admin; CSV export; dynamic Y-axis scaling; per-card skeleton loaders; sticky filter sidebar
- **Super-admin analytics filters** — Filter platform analytics by operator, date range, age, gender, and nationality
- **Site content CMS** — Super-admin drag-and-drop editor for hero images, municipality ticker, and locations grid with image upload; live preview pane; changes reflect immediately on guest pages
- **Review moderation** — Super-admin approve / reject / flag guest reviews
- **Voucher / promo codes** — Manage promo codes and affiliated entities; super-admin oversight
- **Loading states** — Per-page `loading.tsx` files; skeleton loaders on analytics cards
- **Idempotent booking API** — `X-Idempotency-Key` header prevents duplicate bookings
- **Firebase App Check** — Optional enforcement on the booking Cloud Function
- **Firestore security rules** — Super-admin rules cover voucher codes and affiliated entity management
- **Automated review emails** — Cloud Function sends review-request email after booking completion grace period
- **Mobile responsive** — All pages adapt to mobile with stacked layouts and hamburger menu
- **No external placeholder images** — All guest-facing cards use real Firebase Storage images; gray placeholder rendered locally when no image is set

---

## State Management

| Context | File | Purpose |
|---------|------|---------|
| `AuthProvider` | `app/context/AuthContext.tsx` | Firebase auth state, user role, profile |
| `BookingProvider` | `app/context/BookingContext.tsx` | Booking flow state across guest pages |

`BookingProvider` is mounted in `app/layout.tsx`. `AuthProvider` is mounted in the operator (`app/(operator)/operator/layout.tsx`) and admin (`app/(admin)/super-admin/layout.tsx`) sub-layouts only.

---

## Brand & Design

- **App name:** Visit Cebu
- **Logo font:** Potta One (Google Fonts)
- **Body font:** Inter (Google Fonts)
- **Primary color:** Green (`#4ade80`)
- **Background:** Light greenish-white (`#f0fdf4`)
- **Footer / dark sections:** Dark green (`#0d3320`)
- **Currency:** Philippine Peso (₱)

---

## Architecture Notes

Key abstractions identified from codebase graph analysis:

| Symbol | Role |
|--------|------|
| `useAuth()` | Cross-cutting auth hook — consumed by guest, operator, and admin layers |
| `BookingProvider` | Central booking flow state — bridges guest-info and payment pages |
| `PackageCard` | Shared display primitive — used across home carousels, activity grids, package grids, and location detail pages |
| `parseHomepageCms()` | CMS data pipeline entry point — guest pages and `SearchBar` that read CMS location images depend on this |
| `mergeGuestLocations()` | Merges per-municipality activity + package counts from Firestore — used by locations browse UI and SearchBar suggestions |
| `createBooking()` | Central booking creation — called from operator portal and booking API |
| `getAnalyticsDashboard()` | Single analytics data source — both operator and super-admin dashboards depend on it |
| `assertSuperAdmin()` | Cloud Function auth guard — all admin-only functions call this |
| `uploadReceiptImage()` | Payment receipt storage — called from both guest upload and operator confirmation flows |

`BookingState` (in `types.ts`) and `FieldErrors` (in `components/auth/types.ts`) are the highest PageRank nodes in the import graph — changes to these types have the widest blast radius.
