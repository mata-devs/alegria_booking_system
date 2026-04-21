# SuroyCebu

A Cebu tourism booking platform for guests, tour operators, and super-admins. Guests browse locations, activities, and tour packages, then book and pay online. Operators manage bookings and analytics. Super-admins oversee operators, revenue, and vouchers.

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
| [react-qr-code](https://github.com/rosskhanas/react-qr-code) | 2.0 | Scannable QR code generation |
| [ESLint](https://eslint.org) | 9 | Linting |

### Backend (`functions/`)

| Tool | Version | Purpose |
|------|---------|---------|
| [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) | 13 | Server-side Firestore, Auth, Storage |
| [Firebase Functions v2](https://firebase.google.com/docs/functions) | 7 | Cloud Functions (HTTP + Firestore triggers) |
| [Express](https://expressjs.com) | 5 | HTTP API framework for booking endpoint |
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

App runs at `http://localhost:3000`.

### Backend (Cloud Functions)

```bash
cd functions
npm install
npm run build
```

Deploy with `firebase deploy --only functions`.

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Other Scripts

```bash
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

---

## Project Structure

```
app/
├── layout.tsx                           # Root layout — fonts, providers
├── globals.css                          # Global styles + Tailwind base
├── types.ts                             # Shared TypeScript interfaces
│
├── (guest)/                             # Guest-facing pages
│   ├── layout.tsx                       # Guest layout (Navbar + Footer)
│   ├── page.tsx                         # Landing page (hero slideshow, carousels)
│   ├── activities/
│   │   └── page.tsx                     # Filterable activity grid
│   ├── locations/
│   │   ├── page.tsx                     # Location grid with search
│   │   └── [municipalityId]/
│   │       └── page.tsx                 # Per-location map hero + activity cards + reviews
│   ├── tour-packages/
│   │   ├── page.tsx                     # Filterable tour packages grid
│   │   └── [packageId]/
│   │       └── page.tsx                 # Package detail, itinerary, guides, chatbot
│   └── booking/
│       ├── guest-info/
│       │   └── page.tsx                 # Guest info form + payment method select
│       ├── payment/
│       │   └── page.tsx                 # GCash QR code, instructions, file upload
│       └── confirmation/
│           └── page.tsx                 # Reservation received screen with booking ID
│
├── (operator)/                          # Tour operator portal
│   └── Operator/
│       ├── layout.tsx                   # Operator layout (sidebar nav)
│       ├── page.tsx                     # Operator home / redirect
│       ├── bookings/                    # Live booking management (calendar + list)
│       ├── history/                     # Past booking history with filters
│       ├── Analytics/                   # Revenue, booking, and promo charts
│       ├── VoucherCodes/                # Promo code and entity management
│       │   ├── Code/
│       │   └── Entity/
│       └── Settings/                    # Operator profile settings
│
├── (admin)/                             # Super-admin portal
│   └── super-admin/
│       ├── layout.tsx                   # Admin layout (sidebar nav)
│       ├── operators/                   # Operator account management
│       ├── analytics/                   # Platform-wide analytics
│       ├── revenue/                     # Revenue reports
│       ├── vouchers/                    # Voucher code oversight
│       └── settings/                   # Platform settings
│
├── login/
│   └── page.tsx                         # Unified login page (guest / operator / admin)
│
├── components/
│   ├── Navbar.tsx                       # Logo + nav links (guest layout)
│   ├── Footer.tsx                       # Dark green footer
│   ├── SearchBar.tsx                    # Where / When / Travelers search bar
│   ├── ActivityCard.tsx                 # Activity card with rating + price
│   ├── TourPackageCard.tsx              # Tour package card with overlay
│   ├── LocationCard.tsx                 # Location card with activity count
│   ├── Auth.tsx                         # Firebase auth UI component
│   ├── auth/
│   │   ├── LoginPanel.tsx               # Email/password login panel
│   │   └── ResetPasswordPanel.tsx       # Password reset panel
│   ├── (operator)/
│   │   ├── OperatorSidebar.tsx          # Operator nav sidebar
│   │   └── RoleGuard.tsx               # Role-based route protection
│   └── (admin)/
│       └── SuperAdminSidebar.tsx        # Super-admin nav sidebar
│
├── context/
│   ├── AuthContext.tsx                  # Firebase auth state (AuthProvider + useAuth)
│   └── BookingContext.tsx               # Booking flow state (BookingProvider + useBooking)
│
├── hooks/
│   └── useOperatorBookings.ts           # Firestore booking stream for operators
│
├── lib/
│   ├── firebase.ts                      # Firebase client SDK init + exports
│   ├── types.ts                         # UserRole, UserStatus, UserProfile types
│   ├── schema.ts                        # Firestore schema constants
│   ├── analytics-service.ts             # Analytics data fetch + sample dashboard
│   └── utils.ts                         # cn() utility (clsx + tailwind-merge)
│
└── data/
    └── mockData.ts                      # Static seed data (locations, activities, packages)

functions/src/
├── index.ts                             # Entry point — re-exports all Cloud Functions
├── shared/
│   ├── firebase.ts                      # Admin SDK init (guarded), db/auth/bucket exports
│   └── helpers.ts                       # assertSuperAdmin, generateOperatorId, copyFile, extractPathFromUrl
├── operator/
│   ├── syncAuthStatus.ts                # Firestore trigger — sync operator auth disabled flag
│   ├── approveSignup.ts                 # onCall — approve operator signup, create Auth user
│   └── declineSignup.ts                 # onCall — decline operator signup
└── booking/
    ├── api.http.ts                      # onRequest wrapper (asia-southeast1)
    ├── app.ts                           # Express app — CORS, App Check middleware
    ├── routes/bookings.routes.ts        # POST /bookings
    ├── controllers/booking.controller.ts
    └── services/booking.service.ts      # Full booking creation logic (idempotency, slots, promos)
```

---

## Pages & Routing

### Guest

| Route | Page | Description |
|-------|------|-------------|
| `/` | LandingPage | Auto-rotating hero slideshow + discovery sections |
| `/locations` | LocationsPage | Browse and search all Cebu locations |
| `/locations/[municipalityId]` | MunicipalityView | Activities for a specific location |
| `/activities` | ActivitiesPage | All activities with filter chips |
| `/tour-packages` | TourPackagesPage | All tour packages with filter chips |
| `/tour-packages/[packageId]` | TourPackageDetail | Package detail, itinerary, guides, chatbot |
| `/booking/guest-info` | GuestInfoForm | Guest details + payment method selection |
| `/booking/payment` | PaymentPage | GCash QR code payment + screenshot upload |
| `/booking/confirmation` | BookingConfirmation | Confirmation screen with booking ID |

### Operator

| Route | Description |
|-------|-------------|
| `/Operator` | Operator home |
| `/Operator/bookings` | Live booking management (calendar + list view) |
| `/Operator/history` | Past booking history with search and filters |
| `/Operator/Analytics` | Revenue, booking volume, promo code charts |
| `/Operator/VoucherCodes/Code` | Manage promo codes |
| `/Operator/VoucherCodes/Entity` | Manage voucher entities |
| `/Operator/Settings` | Operator profile |

### Super-Admin

| Route | Description |
|-------|-------------|
| `/super-admin/operators` | Approve / manage operator accounts |
| `/super-admin/analytics` | Platform-wide analytics |
| `/super-admin/revenue` | Revenue reports |
| `/super-admin/vouchers` | Voucher oversight |
| `/super-admin/settings` | Platform settings |

### Auth

| Route | Description |
|-------|-------------|
| `/login` | Unified login (routes to operator or admin portal by role) |

---

## Booking Flow

```
Landing → Locations → Municipality View → Tour Package Detail
       → Guest Info Form → Payment → Confirmation
```

---

## Key Features

- **Hero slideshow** — Auto-rotating background images on the landing page
- **Searchable location dropdown** — "Where" field filters Cebu locations with thumbnails
- **Floating chatbot** — Context-aware assistant on the Tour Package Detail page
- **GCash QR code** — Real scannable QR code generated via `react-qr-code`
- **File upload** — Drag & drop or browse for payment screenshot upload
- **Sticky booking sidebar** — Date picker, traveler count, and Book Now on package detail
- **Fixed bottom navigation** — Go Back / Next buttons on booking flow pages
- **Role-based auth** — Firebase Auth with `UserRole` guard (guest / operator / super-admin)
- **Operator booking calendar** — Week-view calendar + booking request list
- **Analytics dashboards** — Bar, line, and pie charts via Recharts for both operators and admin
- **Voucher / promo codes** — Create and manage promo codes with entity grouping
- **Idempotent booking API** — `X-Idempotency-Key` header prevents duplicate bookings
- **Firebase App Check** — Optional enforcement on the booking Cloud Function
- **Mobile responsive** — All pages adapt to mobile with stacked layouts and hamburger menu

---

## State Management

| Context | File | Purpose |
|---------|------|---------|
| `AuthProvider` | `app/context/AuthContext.tsx` | Firebase auth state, user role, profile |
| `BookingProvider` | `app/context/BookingContext.tsx` | Booking flow state across guest pages |

Both providers are mounted in `app/layout.tsx`.

---

## Brand & Design

- **App name:** SuroyCebu
- **Logo font:** Potta One (Google Fonts)
- **Body font:** Inter (Google Fonts)
- **Primary color:** Green (`#4ade80`)
- **Background:** Light greenish-white (`#f0fdf4`)
- **Footer / dark sections:** Dark green (`#0d3320`)
- **Currency:** Philippine Peso (₱)
