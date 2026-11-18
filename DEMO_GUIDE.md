# GarageMate — End-to-End Demo Guide

## Overview
This guide walks through the complete roadside assistance booking workflow
across all three roles: **User → Garage Owner → Admin**.

---

## Setup

### 1. Seed demo data (run once)

```bash
# From the backend directory
npm run seed:demo     # Creates demo User, Garage Owner, Admin + Demo Garage (Pune FC Road)
npm run seed:loni     # Creates 8 Loni Kalbhor area garages + showcase user with 2 vehicles
npm run seed:garages  # Creates 10 Pune-area garages (optional, extra coverage)
```

> All seed scripts are **idempotent** — safe to run multiple times.
> They only target `NODE_ENV=development` databases.

### 2. Frontend environment (.env)

Create `frontend/.env` based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_DEMO_MODE=true
```

`VITE_DEMO_MODE=true` enables the simulated ₹99 payment experience.
The backend independently validates `NODE_ENV=development` — the frontend flag alone
is never trusted for payment simulation.

---

## Demo Credentials

### Loni Kalbhor Showcase (primary demo)

| Role | Email | Password |
|---|---|---|
| User | `demo.loni.user@garagemate.com` | `Demo@12345` |
| Garage Owner | `owner.loni1@garagemate.com` | `Demo@12345` |
| Admin | `demo.admin@garagemate.com` | `Demo@12345` |

### Original Demo Accounts

| Role | Email | Password |
|---|---|---|
| User | `demo.user@garagemate.com` | `Demo@12345` |
| Garage Owner | `demo.garage@garagemate.com` | `Demo@12345` |
| Admin | `demo.admin@garagemate.com` | `Demo@12345` |

### All Loni Garage Owners

| Garage | Email |
|---|---|
| GarageMate Demo Garage — Loni Kalbhor | `owner.loni1@garagemate.com` |
| Loni Auto Care Demo | `owner.loni2@garagemate.com` |
| Highway Tyre & Battery Demo | `owner.loni3@garagemate.com` |
| Express Roadside Assistance Demo | `owner.loni4@garagemate.com` |
| Kalbhor Motor Works Demo | `owner.loni5@garagemate.com` |
| Hadapsar Roadside Demo | `owner.loni6@garagemate.com` |
| Wagholi Auto Service Demo | `owner.loni7@garagemate.com` |
| Uruli Kanchan Auto Care Demo | `owner.loni8@garagemate.com` |

All Loni garage owner passwords: `Demo@12345`

---

## End-to-End Demo Workflow

### Step 1 — User Books Assistance

1. Log in as `demo.loni.user@garagemate.com`
2. Click **Emergency** in the left sidebar (or **Get Help Now** on dashboard)
3. Click **Use My Current Location** — OR — select **Enter Location Manually**
   - For Loni Kalbhor demo: Lat `18.4723`, Lng `73.9385`
4. See nearby garages appear from the seeded data
5. Select **GarageMate Demo Garage — Loni Kalbhor**
6. Choose vehicle: **Mahindra Thar** (or Maruti Swift)
7. Choose issue: **Tyre Puncture**
8. Write description: *"Front left tyre punctured near Loni Kalbhor Phata"*
9. Click **Review Booking Summary**
10. Check the confirmation box → Click **Proceed to Pay ₹99**
11. Click **⚡ Simulate Demo Payment — ₹99** (clearly labelled as simulation)
12. See the success screen: **"Your Assistance Request Has Been Sent!"**
13. Note the **Booking ID** shown on screen
14. Click **Track My Assistance** to see the live status

### Step 2 — Garage Owner Receives & Processes

1. Log out as User
2. Log in as `owner.loni1@garagemate.com`
3. Navigate to **Requests** in the sidebar
4. See the incoming request with **GARAGE_SELECTED** status and **₹99 PAID** badge
5. Click **Accept** to accept the request (status → GARAGE_ACCEPTED)
6. If mechanics are configured: assign a mechanic (status → MECHANIC_ASSIGNED)
7. Click **Mechanic on Way** (status → MECHANIC_ON_THE_WAY)

### Step 3 — Admin Monitors

1. Log out as Garage Owner
2. Log in as `demo.admin@garagemate.com`
3. Go to **Admin Dashboard → Verifications** or **Admin → Requests**
4. See the same booking record with:
   - Customer name
   - Selected garage
   - Payment amount ₹99
   - Current status

---

## Payment Modes

| Mode | How to use | Real money? |
|---|---|---|
| Razorpay Test | Configure `RAZORPAY_KEY_ID` in backend `.env` with Rzp test key | No (test mode) |
| Demo Simulation | `VITE_DEMO_MODE=true` + `NODE_ENV=development` | Never |

### Razorpay Test Credentials (when configured)
Use Razorpay test card: `4111 1111 1111 1111`, any future expiry, any CVV.
Or use UPI test: `success@razorpay`

---

## Booking Flow Route

The new multi-step booking flow is at: `/user/book`

The old emergency form is preserved at: `/user/emergency`

The sidebar Emergency button now goes to `/user/book`.

---

## Socket.IO Real-Time Events

The app uses Socket.IO for live updates. Events:

| Event | Who receives |
|---|---|
| `request:new` | Garage owner (new assignment) |
| `payment:success` | User (payment confirmed) |
| `request:status-changed` | User + Admin (status update) |

The **NotificationBell** component in the header shows an unread count badge
and subscribes to these events automatically when the user is authenticated.

---

## Loni Kalbhor Demo Area Coordinates

| Garage | Latitude | Longitude |
|---|---|---|
| GarageMate Demo Garage | 18.4723 | 73.9385 |
| Loni Auto Care Demo | 18.4698 | 73.9412 |
| Highway Tyre & Battery | 18.4680 | 73.9460 |
| Express Roadside Demo | 18.4760 | 73.9330 |
| Kalbhor Motor Works | 18.4745 | 73.9400 |
| Hadapsar Roadside | 18.5018 | 73.9278 |
| Wagholi Auto Service | 18.5790 | 73.9822 |
| Uruli Kanchan Auto Care | 18.4467 | 74.0073 |

---

## Security Notes

- Demo payment endpoints are **backend-gated** by `NODE_ENV !== 'production'`
- Frontend `VITE_DEMO_MODE` flag is never trusted alone for payment confirmation
- Demo payments are stored with `type: DEMO_BOOKING_FEE` and `status: DEMO_PAID`
  — clearly distinguishable from real `BOOKING_FEE` / `SUCCESS` records
- No real money is charged in demo mode
- Seed scripts refuse to run in production (`process.env.NODE_ENV === 'production'` exits)
