# Fitness Management Platform — Mentor Review Submission

**Author:** Vineeth Sudarsanan Leena  
**Date:** June 18, 2026  
**Project Type:** Full-Stack Web Application  
**Review Type:** Mentor Code & Design Review

---

## 1. Project Overview

A full-stack Fitness Management Platform that connects gym **members**, **trainers**, and an **admin** through a single web application. The platform covers the complete fitness workflow: member onboarding, trainer selection, workout plan assignment, appointment booking, real-time messaging, a product shop, and a simulated payment system.

### Core Problem Solved
Members need a central place to find a trainer, receive and complete workout plans, and book/pay for sessions. Trainers need a portal to manage their client list, assign and track workout plans, and confirm appointments. Admins need oversight of the entire platform.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Payment | Simulated (dummy gateway — Stripe SDK installed) |
| State Management | React Context API (Auth + Cart) |
| Animation | Framer Motion 12 |
| External APIs | DummyJSON (motivational quotes), JSONPlaceholder (admin stats demo) |

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Vite/React)                  │
│  ┌────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │  AuthContext│  │  CartContext    │  │  ProtectedRoute│ │
│  └────────────┘  └─────────────────┘  └───────────────┘ │
│                                                           │
│  Pages: Home │ Login │ Register │ UserDashboard │         │
│          TrainerDashboard │ AdminDashboard │ ShopPage │   │
│          CartPage │ PaymentPage                           │
└──────────────────────┬───────────────────────────────────┘
                       │ Axios (Bearer JWT)
                       ▼
┌──────────────────────────────────────────────────────────┐
│              Backend (Express 5 REST API)                 │
│  Port 5001 · CORS: localhost only                        │
│                                                           │
│  Routes         Controllers         Middleware            │
│  /api/auth  ──► authController     protect (JWT verify)  │
│  /api/workouts ► workoutController authorizeRoles(...)   │
│  /api/appts ───► appointmentCtrl                         │
│  /api/payments ► paymentController                       │
│  /api/admin ───► adminController                         │
│  /api/messages ► messageController                       │
│  /api/trainers ► trainerController                       │
└──────────────────────┬───────────────────────────────────┘
                       │ Mongoose
                       ▼
┌──────────────────────────────────────────────────────────┐
│                     MongoDB Atlas                         │
│  Collections: users · trainers · workouts · appointments  │
│               payments · messages                         │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Data Models

### User
```
name, email, password (hashed), role (user|trainer|admin),
isVerified, specialization, fitnessGoals,
assignedTrainer → ref:Trainer, timestamps
```

### Trainer (separate collection)
```
name, email, password (hashed), role (default:'trainer'),
isVerified, specialization, timestamps
```
> Design note: Trainers are stored in a separate `Trainer` collection rather than the `User` collection. The `protect` middleware checks both collections so tokens work for either type.

### Workout
```
user → ref:User, trainer → ref:User, title,
exercises: [{ name, sets, reps, weight, completed }],
date, completed, timestamps
```
> A workout with a `trainer` field is an **assigned plan**; without one it is a self-created log.

### Appointment
```
user → ref:User, trainer → ref:Trainer, date,
status (pending|confirmed|completed|cancelled),
notes, isPaid, timestamps
```

### Payment
```
user → ref:User, appointment → ref:Appointment,
amount, currency, transactionId, status (succeeded|pending|failed),
cardLast4, cardBrand,
items: [{ name, description, price, quantity, type }],
timestamps
```

### Message
```
sender → ref:User, recipient → ref:User,
content, isRead, timestamps
```

---

## 5. Authentication & Authorization

- **Registration:** Users register with `name`, `email`, `password`, `role`. Trainers must also supply a secret `trainerCode` (`9989`). Admins are seeded directly in the DB.
- **JWT:** 30-day token returned on login/register, stored in `localStorage` as part of the `userInfo` object.
- **`protect` middleware:** Extracts Bearer token → verifies JWT → looks up user in `User` then `Trainer` collection → attaches to `req.user`.
- **`authorizeRoles(...roles)` middleware:** Checks `req.user.role` against the allowed list, returns 403 if not permitted.
- **Frontend `ProtectedRoute`:** Reads `userInfo` from `localStorage`, compares `role` against `allowedRoles`, redirects to `/login` if unauthorized.

---

## 6. API Endpoints

### Auth  `/api/auth`
| Method | Route | Description |
|---|---|---|
| POST | `/register` | Register user or trainer |
| POST | `/login` | Login, returns JWT |

### Workouts  `/api/workouts`
| Method | Route | Guard | Description |
|---|---|---|---|
| POST | `/` | user/trainer | Create self workout |
| GET | `/` | any | Get own workouts (no trainer field) |
| POST | `/assign` | trainer | Assign plan to a member |
| GET | `/assigned` | user | Get plans assigned to me |
| PUT | `/:id` | owner | Toggle workout completed |
| PUT | `/:id/exercise/:index` | user | Toggle single exercise + auto-notify trainer |
| PUT | `/:id/complete` | trainer | Mark plan complete |
| GET | `/user/:userId` | admin/trainer | Get all workouts for a user |

### Appointments  `/api/appointments`
| Method | Route | Guard | Description |
|---|---|---|---|
| POST | `/` | user | Book appointment |
| GET | `/` | any | Get my appointments (role-filtered) |
| PUT | `/:id/status` | trainer (owner) | Update status |

### Payments  `/api/payments`
| Method | Route | Guard | Description |
|---|---|---|---|
| POST | `/` | user | Process dummy payment |
| GET | `/my` | user | My payment history |
| GET | `/all` | admin | All platform payments |

### Trainers  `/api/trainers`
| Method | Route | Guard | Description |
|---|---|---|---|
| GET | `/` | any | List all trainers |
| PUT | `/select/:trainerId` | user | Assign trainer to self |
| GET | `/my-trainer` | user | Get my assigned trainer |
| GET | `/my-members` | trainer | Get all members assigned to me |

### Messages  `/api/messages`
| Method | Route | Guard | Description |
|---|---|---|---|
| POST | `/` | any | Send message |
| GET | `/:otherUserId` | any | Get conversation thread |

### Admin  `/api/admin`
| Method | Route | Description |
|---|---|---|
| GET | `/users` | All users + trainers |
| PUT | `/verify-trainer/:id` | Verify a trainer |
| GET | `/stats` | Platform revenue + counts |

---

## 7. Frontend Pages & Features

### Home Page
- Animated hero section with floating particles, decorative blur blobs, and shimmer sweep
- Feature highlights: Track Workouts, Book Trainers, Secure Payments
- Platform stats bar (10K+ Members, 500+ Trainers, etc.)
- Article feed loaded from JSONPlaceholder API (demo content)
- CTA buttons that route to Register/Shop based on auth state

### Login & Register
- Clean full-width forms
- Role selection dropdown (user / trainer / admin)
- Conditional `trainerCode` field appears only when trainer role is selected
- Saves `userInfo` JSON to `localStorage` on success

### User Dashboard (4 Tabs)

**Overview Tab**
- 3 animated stat cards: Active Streak (3 Days), Workouts Done (12), Total Time (4h 30m)
- Spring counter animation on numbers when they enter the viewport
- 3D tilt effect on cards (Framer Motion `useMotionValue` + `useTransform`)
- Daily motivational quote fetched live from DummyJSON API (random 1–100)

**Find Trainer Tab**
- Lists all registered trainers from `/api/trainers`
- Skeleton shimmer loading states
- Select Trainer button → calls PUT `/api/trainers/select/:id` → updates `assignedTrainer` on User

**My Trainer Tab (3 sub-sections)**
- *Chat* — real-time-style message thread with trainer; own messages right-aligned in indigo gradient bubbles; trainer messages left-aligned; auto-scroll to latest
- *Book Appointment* — datetime picker + notes field → POST to `/api/appointments`
- *My Appointments* — list with colored status badges (pending/confirmed/completed/cancelled)

**My Exercises Tab**
- Lists all workout plans assigned by trainer
- Per-plan progress bar (X/Y exercises done)
- Exercise table: name, sets, reps, weight, Mark Done checkbox
- Toggling an exercise calls PUT `/api/workouts/:id/exercise/:index`
- Auto-marks plan complete when all exercises are ticked
- Toast notification when an exercise is marked done
- Backend automatically sends a message to the trainer on completion

### Trainer Dashboard (3 Tabs)

**Appointments Tab**
- Lists all incoming appointments from members
- Each card shows member name/email, date/time, notes, current status
- Three action buttons: Confirm / Complete / Cancel

**My Members Tab**
- Grid of member cards with completion indicator (green badge = all plans done)
- Per-card: Chat button (opens full modal), Progress button (opens plans modal), Assign button
- Chat Modal — full conversation thread, auto-scroll, send messages
- Progress Modal — view each workout plan's exercise table, progress bar, and completion banner

**Assign Exercise Tab**
- Trainer selects a member (or preselected when coming from Members tab via "Assign" button)
- Plan title input
- Dynamic exercise rows: name, sets, reps, weight (kg)
- Add / Remove exercise rows
- Submits to POST `/api/workouts/assign`

### Admin Dashboard
- Animated dark gradient header with rotating gear icon and "System Online" pulsing indicator
- 4 stat cards (Community Members, Published Articles, Workouts Completed, Completion Rate) loaded from JSONPlaceholder
- User Management panel (UserManagement component) — lists all users, verify trainer button

### Shop Page
- 6 products defined in `CartContext`: Basic Membership ($29.99), Premium Membership ($79.99), Personal Training Session ($49.99), 10-Session Package ($399.99), Nutrition Consultation ($74.99), Group Training Class ($24.99)
- Filter bar: All / Membership / Session / Package / Consultation / Class
- Animated product cards with gradient top section, icon bob animation
- Add to Cart with "Added!" confirmation flash

### Cart Page
- Lists cart items with quantity controls and remove button
- Subtotal + 8% tax + total calculation
- Persistent across page reloads via `localStorage`
- Checkout button links to Payment Page

### Payment Page
- Simulated card entry form (card number, name, expiry, CVV)
- Card brand detection (Visa / Mastercard / Amex / Discover) from first digits
- Test decline: card ending in `0002` always returns declined
- On success → creates Payment record, marks appointment `isPaid: true`

---

## 8. Frontend Technical Highlights

### Animation System (Framer Motion)
- **Floating Particles:** Randomized animated dots as ambient background decoration — used on all major headers
- **TiltCard:** 3D perspective tilt on mouse move using `useMotionValue` + `useTransform`. Cards appear to physically respond to the cursor
- **SpringCounter:** Numbers animate from 0 to their target value using `useSpring` + `useInView` (fires once when element enters the viewport)
- **Shimmer Skeleton:** Loading states use an animated gradient that sweeps left-to-right over a gray block
- **AnimatePresence:** Tab switching uses `mode="wait"` so the outgoing tab fades/slides out before the incoming one appears
- **layoutId tabs:** Active tab indicator slides smoothly between tab buttons using Framer Motion's `layoutId` shared-layout animation

### Context API
- **AuthContext** — stores `userInfo` (from localStorage), exposes `login`, `logout`
- **CartContext** — stores cart `items` array, exposes `addItem`, `removeItem`, `updateQty`, `clearCart`, plus computed `subtotal`, `tax`, `total`, `count`. Cart persists to `localStorage`

### ProtectedRoute
- Higher-order component accepting `allowedRoles` prop
- Redirects to `/login` if no token, or to home if wrong role

---

## 9. Backend Technical Highlights

### Dual-Collection Auth Strategy
Trainers live in a separate `Trainer` collection (not just a role flag on `User`). The `protect` middleware and `authUser` controller both search `User` first, then `Trainer`. This allows trainer-specific fields (like `specialization`) without complicating the user schema, but adds lookup overhead and some complexity.

### Auto-Notification on Exercise Completion
When a member marks an exercise done, `completeExercise` controller:
1. Toggles `ex.completed`
2. Checks if all exercises in the plan are done → sets `workout.completed = true`
3. Uses `workout.markModified('exercises')` to force Mongoose to detect subdocument array changes
4. Automatically creates a `Message` to the assigned trainer — either a single-exercise completion note or a full-plan completion celebration message

### Dummy Payment Gateway
No real Stripe charge is made. The `processDummyPayment` controller:
- Detects card brand from the card number prefix
- Declines cards ending in `0002` (test scenario)
- Generates a `TXN-{timestamp}-{random}` transaction ID
- Creates a real `Payment` record in MongoDB
- Updates the linked appointment's `isPaid` flag

### Role-Based Route Guards
Every sensitive route is protected with `protect` (JWT check) and `authorizeRoles(...)`. Examples:
- `POST /workouts/assign` — trainer only
- `GET /workouts/assigned` — user only
- `PUT /workouts/:id/exercise/:index` — user only
- `GET /admin/users` — admin only

### Global Error Handler
A catch-all Express error middleware at the bottom of `server.js` returns structured JSON `{ message }` for any unhandled errors with appropriate status codes.

---

## 10. Folder Structure

```
Fitnesss Management/
├── backend/
│   ├── config/
│   │   └── db.js                   # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── workoutController.js
│   │   ├── appointmentController.js
│   │   ├── paymentController.js
│   │   ├── adminController.js
│   │   ├── messageController.js
│   │   └── trainerController.js
│   ├── middleware/
│   │   └── authMiddleware.js        # protect + authorizeRoles
│   ├── models/
│   │   ├── User.js
│   │   ├── Trainer.js
│   │   ├── Workout.js
│   │   ├── Appointment.js
│   │   ├── Payment.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── workoutRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── messageRoutes.js
│   │   └── trainerRoutes.js
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── CheckoutForm.jsx
    │   │   ├── WorkoutTracker.jsx
    │   │   └── UserManagement.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── CartContext.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── UserDashboard.jsx
    │   │   ├── TrainerDashboard.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   ├── ShopPage.jsx
    │   │   ├── CartPage.jsx
    │   │   └── PaymentPage.jsx
    │   ├── services/
    │   │   └── workoutService.js
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## 11. How to Run Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas URI (or local MongoDB)

### Backend
```bash
cd backend
npm install
# Create .env with:
#   MONGO_URI=your_mongodb_connection_string
#   JWT_SECRET=your_jwt_secret
#   PORT=5001
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
# API calls go to http://localhost:5001/api
```

### Test Accounts (after seeding)
| Role | How to create |
|---|---|
| Member | Register normally at `/register` |
| Trainer | Register with `trainerCode: 9989` |
| Admin | Manually set `role: 'admin'` in MongoDB |

### Test Payment Cards
| Card Number | Result |
|---|---|
| Any valid-looking number | Success |
| `**** **** **** 0002` | Declined |

---

## 12. External API Usage

| API | Where Used | Purpose |
|---|---|---|
| DummyJSON `/quotes/:id` | UserDashboard → Overview Tab | Motivational quote of the day |
| JSONPlaceholder `/users`, `/posts`, `/todos` | AdminDashboard | Platform overview stats (demo data) |

---

## 13. Known Limitations & Honest Self-Assessment

| Area | Current State | What Would Be Better |
|---|---|---|
| Real-time messaging | HTTP polling / manual fetch on open | WebSocket / Socket.io for live delivery |
| Payment | Simulated dummy gateway | Real Stripe integration with `stripe.paymentIntents.create` |
| Admin stats | Pulled from JSONPlaceholder (fake data) | Wired to real `/api/admin/stats` endpoint that already exists |
| Trainer code security | Hardcoded `'9989'` in controller | Env variable, or admin-generated invite codes |
| Overview tab stats | Hardcoded (3 Days, 12 workouts) | Computed from real workout data |
| No refresh tokens | 30-day JWT, no rotation | Refresh token pattern for security |
| No input sanitization | Basic validation only | express-validator or Zod for all routes |
| Duplicate UI components | FloatingParticles, TiltCard defined in each page | Extract to shared `components/` and import |
| No test suite | Zero unit/integration tests | Jest + React Testing Library + Supertest |

---

## 14. What I Learned Building This

1. **JWT auth flows** — including the dual-collection lookup challenge when models are split
2. **Mongoose subdocument arrays** — discovered that `.save()` alone doesn't always detect nested changes; needed `markModified('exercises')`
3. **Framer Motion patterns** — `layoutId` for shared animations, `AnimatePresence` for unmount transitions, `useInView` + `useSpring` for scroll-triggered counters
4. **Context API at scale** — separating Auth and Cart into their own contexts kept components clean
5. **Role-based access control** — both on the API (middleware) and the frontend (ProtectedRoute)
6. **Backend-triggered messaging** — side effects in controllers (creating a Message when an exercise is completed) are powerful but need to be failure-safe

---

## 15. Questions for My Mentor

1. Is the dual-collection strategy (User + Trainer) a reasonable design, or should everything be in one `users` collection with a `role` field?
2. What is the cleanest way to add real-time messaging without a full Socket.io overhaul?
3. How should I handle the JWT `localStorage` storage for production — is `httpOnly` cookie a better approach?
4. The `authorizeRoles` middleware relies on `req.user.role` but the trainer's role comes from a hardcoded default in the Trainer schema. Is this robust enough?
5. Should the exercise completion auto-message be a background job/event rather than a synchronous part of the HTTP response?

---

*Submitted for mentor review — June 18, 2026*
