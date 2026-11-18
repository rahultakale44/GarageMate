# GarageMate — End-to-End Demo Guide

## Quick Start

```bash
# Backend
cd backend && npm run dev        # Runs on http://localhost:5000

# Frontend
cd frontend && npm run dev       # Runs on http://localhost:5173

# Seed (run once per fresh DB)
cd backend
npm run seed:demo                # Admin + Demo User + Demo Garage (Pune FC Road)
npm run seed:garages             # 10 Pune-area garages
npm run seed:loni                # 8 Loni Kalbhor garages + showcase user
```

---

## Demo Credentials

### Primary Demo Accounts

| Role | Email | Password | Notes |
|---|---|---|---|
| User | `demo.loni.user@garagemate.com` | `Demo@12345` | Loni showcase user, 2 vehicles |
| User | `demo.user@garagemate.com` | `Demo@12345` | Original demo user |
| Admin | `demo.admin@garagemate.com` | `Demo@12345` | Full platform access |

### City Wheels Garage (Primary Demo Garage)

| Field | Value |
|---|---|
| Email | `demo.city@garagemate.com` |
| Password | `DemoGarage@123` |
| Garage | City Wheels Garage |
| Location | Near Phoenix Mall, Viman Nagar, Pune |
| Coordinates | 18.5679, 73.9143 |
| Services | Car Repair, Engine Repair, Brake Repair, AC Repair, Oil Change |

---

## Complete Garage Owner → Garage Mapping

| Garage Name | Owner Email | Password |
|---|---|---|
| Loni Auto Care | `demo.loni@garagemate.com` | `DemoGarage@123` |
| Highway Tyre Assistance | `demo.highway@garagemate.com` | `DemoGarage@123` |
| Sai Battery and Electricals | `demo.sai@garagemate.com` | `DemoGarage@123` |
| Kadam Motors (Kharadi) | `demo.kadam@garagemate.com` | `DemoGarage@123` |
| Pune Road Rescue | `demo.rescue@garagemate.com` | `DemoGarage@123` |
| Shree Ganesh Auto Garage | `demo.ganesh@garagemate.com` | `DemoGarage@123` |
| **City Wheels Garage ⭐** | `demo.city@garagemate.com` | `DemoGarage@123` |
| Express Car Care | `demo.express@garagemate.com` | `DemoGarage@123` |
| Reliable Bike Assistance | `demo.reliable@garagemate.com` | `DemoGarage@123` |
| East Pune Auto Service | `demo.east@garagemate.com` | `DemoGarage@123` |
| Demo Auto Care Center | `demo.garage@garagemate.com` | `Demo@12345` |
| GarageMate Demo Garage — Loni Kalbhor ⭐ | `owner.loni1@garagemate.com` | `Demo@12345` |
| Loni Auto Care Demo | `owner.loni2@garagemate.com` | `Demo@12345` |
| Highway Tyre & Battery Demo | `owner.loni3@garagemate.com` | `Demo@12345` |
| Express Roadside Assistance Demo | `owner.loni4@garagemate.com` | `Demo@12345` |
| Kalbhor Motor Works Demo | `owner.loni5@garagemate.com` | `Demo@12345` |
| Hadapsar Roadside Demo | `owner.loni6@garagemate.com` | `Demo@12345` |
| Wagholi Auto Service Demo | `owner.loni7@garagemate.com` | `Demo@12345` |
| Uruli Kanchan Auto Care Demo | `owner.loni8@garagemate.com` | `Demo@12345` |

---

## End-to-End Demo Workflow

### STEP 1 — Customer Books City Wheels Garage

1. Login as `demo.loni.user@garagemate.com`
2. Click **Emergency** in sidebar → opens `/user/book` (6-step booking flow)
3. **Location** — click "Use My Current Location" or enter manually:
   - Lat: `18.5679` Lng: `73.9143` Address: `Viman Nagar, Pune`
4. **Garages** — 19+ garages shown. Select **City Wheels Garage**
5. **Details** — pick Mahindra Thar, choose Tyre Puncture, write description
6. **Summary** — review ₹99 fee + "repair charges separate" note, check confirm box
7. **Payment** — click **⚡ Simulate Demo Payment — ₹99** (clearly labelled)
8. **Confirmation** — see "Your Assistance Request Has Been Sent!"
9. Click **Track My Assistance** to open the tracking page

### STEP 2 — City Wheels Garage Owner Receives

1. Login as `demo.city@garagemate.com` (password: `DemoGarage@123`)
2. Navigate to **Requests** in sidebar
3. See **"NEW"** badge on incoming request tab
4. Click on the request to open detail panel
5. See: customer name, Mahindra Thar, Tyre Puncture, ₹99 PAID badge
6. Click **Accept Request** → confirmation modal shows booking details
7. Click **Accept Request** in modal → "Request accepted! Customer has been notified."
8. Click **Set ETA** → pick 20 minutes → "ETA set, customer notified"

### STEP 3 — Customer Sees Acceptance (Live Tracking)

1. Customer's tracking page (or `/user/requests/<id>`) shows:
   - Green banner: "✅ Your request has been accepted!"
   - "City Wheels Garage has accepted your request. Help is on the way!"
   - "⏱️ Mechanic arriving in ~20 minutes"
   - Status badge: GARAGE_ACCEPTED

### STEP 4 — Garage Owner Advances Status

Click buttons in order:
1. **Mark Mechanic Assigned** (or assign from mechanics list)
2. **On The Way** → customer sees "Mechanic is on the way!"
3. **Mechanic Arrived** → customer sees "Mechanic has arrived"
4. **Start Inspection** → inspection started
5. **Start Service** → service in progress
6. **Mark Service Completed** → completion modal → Confirm

### STEP 5 — Customer Sees Completion

Customer tracking shows:
- "✅ Service Completed!"
- Full timeline: all 10 status history entries
- Booking ID, ₹99 PAID, City Wheels Garage contact

### STEP 6 — Admin Monitors

1. Login as `demo.admin@garagemate.com`
2. Go to **Requests** → see SERVICE_COMPLETED filter
3. See: customer, City Wheels Garage, ₹99 PAID, 10-entry status history

---

## Loni Kalbhor Demo (Alternative)

For the Loni area demo, use `demo.loni.user@garagemate.com` and select
**GarageMate Demo Garage — Loni Kalbhor** (owner: `owner.loni1@garagemate.com`).

Coordinates for Loni: Lat `18.4723` Lng `73.9385`

---

## Payment Modes

| Mode | Config | Real money? |
|---|---|---|
| **Demo Simulation** ⭐ | `VITE_DEMO_MODE=true` (default in dev) | Never |
| Razorpay Test | Add test keys to `backend/.env` | No (test mode) |

Demo payments store `type: DEMO_BOOKING_FEE` and `status: DEMO_PAID`.
Never confused with real `BOOKING_FEE` / `SUCCESS` records.

### Razorpay Test Card (when keys configured)
Card: `4111 1111 1111 1111` | Expiry: any future | CVV: any
UPI test: `success@razorpay`

---

## New Features (Phase 3–8)

### Garage Owner Request Page (`/garage/requests`)
- **NEW badge** on incoming requests (GARAGE_SELECTED status)
- **New request alert banner** (animates in when socket event fires)
- **Tab navigation**: New Requests / Active Jobs / Completed
- **Accept modal** — shows customer + vehicle + ₹99 PAID before confirming
- **ETA modal** — pick 5/10/15/20/30/45/60 min or custom
- **Status buttons** — appear dynamically based on current status
- **Service completion modal** — confirmation before marking complete
- **Status timeline** — last 6 entries, most recent highlighted orange
- **Real-time updates** via Socket.IO

### Customer Tracking (`/user/requests`)
- Green banner when garage accepts: "Your request has been accepted!"
- ETA display: "⏱️ Mechanic arriving in ~20 minutes"
- Completion banner when service done
- Payment status: ₹99 PAID badge
- Real-time Socket.IO updates on status change + ETA update

### Socket.IO Events
| Event | Sent to |
|---|---|
| `request:new` | Garage owner |
| `request:status-changed` | Customer + Admin |
| `request:eta-updated` | Customer |

---

## Status Lifecycle

```
DRAFT → PAYMENT_PENDING → GARAGE_SELECTED → GARAGE_ACCEPTED
     → MECHANIC_ASSIGNED → MECHANIC_ON_THE_WAY → MECHANIC_ARRIVED
     → INSPECTION_STARTED → SERVICE_IN_PROGRESS → SERVICE_COMPLETED
```

New: `INSPECTION_STARTED` can now transition directly to `SERVICE_IN_PROGRESS`
(skipping quotation step for demo/emergency use cases).

---

## Security Notes

- Demo payment endpoints: backend enforces `NODE_ENV !== 'production'`
- Garage isolation: `GARAGE_SELECTED`+ requests require `garageId == owning garage`
- ETA endpoint: validates garage ownership before updating
- Status updates: validates garage ownership and transition rules
- Cross-user payment: `userId` check prevents garage owners confirming user payments
- Rate limiter: 10 auth attempts per 15 min (correct security behavior)

---

## Known Limitations

1. **Razorpay live**: Not tested — credentials not configured. Architecture is correct.
2. **Socket.IO browser testing**: Server emits verified in code + logs. Full push-to-browser requires live browser session.
3. **Mechanic tracking map**: Shows static garage location. Live GPS tracking not implemented.
4. **SMS notifications**: Not implemented — notifications stored in DB and sent via Socket.IO only.
5. **Quotation flow**: Simplified for demo — `INSPECTION_STARTED → SERVICE_IN_PROGRESS` allowed directly.
