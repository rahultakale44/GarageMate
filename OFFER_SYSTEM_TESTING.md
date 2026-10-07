# Offer System - Testing Guide

## Overview
This document outlines the complete testing procedure for the multi-garage offer system in GarageMate.

## Prerequisites

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
Ensure `.env` file has proper configuration:
```
MONGODB_URI=mongodb://localhost:27017/garagemate
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### 3. Seed Database
```bash
npm run seed:garages
```

## Testing Flow

### Phase 1: User Creates Emergency Request

#### Step 1.1: User Registration & Login
- Navigate to user registration
- Register new user account
- Login and verify JWT token

#### Step 1.2: Add Vehicle
- **Option A:** Add permanent vehicle with full details
- **Option B:** Add temporary/rented vehicle (only type required)
- Verify vehicle appears in user's vehicle list

#### Step 1.3: Create Emergency Request
- Go to Emergency Request page
- Fill in issue details:
  - Issue category (e.g., TYRE_PUNCTURE)
  - Description
  - Location (use map or current location)
  - Upload issue images (optional)
  - Select urgency level
- Select vehicle from dropdown
- **Validation checks:**
  - Cannot proceed without vehicle
  - Location must be set
  - All required fields validated

#### Step 1.4: Pay Demo Booking Fee
- Review booking fee (₹99 demo)
- Initiate Razorpay payment
- **Expected:** Payment success → Request status changes to BROADCASTED
- Verify request appears in "My Requests" with BROADCASTED status

**Backend Verification:**
```bash
# Check request created
curl -H "Authorization: Bearer <user_token>" \
  http://localhost:5000/api/requests/my

# Expected status: BROADCASTED
```

---

### Phase 2: Garages Receive & Submit Offers

#### Step 2.1: Garage Login
- Login as garage owner (use seeded garage or register new)
- Verify garage is APPROVED and isAvailable=true

#### Step 2.2: View Broadcasted Requests
- Navigate to Garage Requests page
- **Expected:** See BROADCASTED or OFFERS_RECEIVED requests
- Requests within 20km radius appear
- Status badge shows "BROADCASTED"

#### Step 2.3: Submit Offer
- Click on a broadcasted request
- Click "Submit Your Offer" button
- Fill offer form:
  - **ETA:** 5-180 minutes (e.g., 30)
  - **Visit Fee:** Amount in ₹ (e.g., 200)
  - **Message:** Optional note (max 500 chars)
- Submit offer
- **Expected:**
  - Success message appears
  - Blue badge shows "✓ Offer Sent"
  - Request status may change to OFFERS_RECEIVED

#### Step 2.4: Multiple Garages Submit Offers
- Repeat Step 2.1-2.3 with 2-3 different garage accounts
- Each garage submits different ETA and visit fee
- **Backend:** Each offer stored with status=PENDING, expiresAt=+24h

**Backend Verification:**
```bash
# Check offers for request
curl -H "Authorization: Bearer <user_token>" \
  http://localhost:5000/api/offers/request/<requestId>

# Expected: Array of offers with PENDING status
```

---

### Phase 3: User Views & Accepts Offer

#### Step 3.1: View Offers
- User logs in
- Navigate to "My Requests"
- Click on request with OFFERS_RECEIVED status
- **Expected:** OffersDisplay component shows:
  - Grid of pending offers
  - Each showing: ETA, visit fee, distance, rating
  - Garage message if provided
  - "Accept Offer" button on each

#### Step 3.2: Compare Offers
- Review different offers
- Compare:
  - Estimated arrival time
  - Visit fee
  - Garage rating
  - Distance from location

#### Step 3.3: Accept an Offer
- Click "Accept Offer" on chosen garage
- **Expected:**
  - Offer status changes to ACCEPTED
  - Request status changes to GARAGE_SELECTED
  - All other offers automatically REJECTED
  - Selected garage shown in request details
  - Success message: "Offer accepted successfully"

**Backend Verification:**
```bash
# Check offer status
curl -H "Authorization: Bearer <user_token>" \
  http://localhost:5000/api/offers/request/<requestId>

# Expected: 
# - One offer with status=ACCEPTED
# - Other offers with status=REJECTED
```

---

### Phase 4: Garage Processes Accepted Offer

#### Step 4.1: Notification
- Garage owner receives notification (check bell icon)
- "Your Offer Was Accepted" notification appears

#### Step 4.2: View Accepted Request
- Navigate to Garage Requests
- Request now shows "GARAGE_SELECTED" status
- Blue badge shows "✓ Accepted"

#### Step 4.3: Assign Mechanic
- Click on accepted request
- Assign mechanic dropdown appears
- Select available mechanic
- Click "Assign Mechanic"
- **Expected:** Status → MECHANIC_ASSIGNED

#### Step 4.4: Continue Normal Flow
- Update status through normal workflow:
  - MECHANIC_ON_THE_WAY
  - MECHANIC_ARRIVED
  - INSPECTION_STARTED
  - Send quotation
  - SERVICE_IN_PROGRESS
  - SERVICE_COMPLETED

---

### Phase 5: Offer Expiry Testing

#### Test 5.1: Automatic Expiry (24h)
```bash
# Manually trigger expiry job (for testing)
# In backend console or create test endpoint
curl -X POST http://localhost:5000/api/test/expire-offers
```

**Expected:**
- Offers older than 24h marked as EXPIRED
- If all offers expired → Request status becomes EXPIRED

#### Test 5.2: Manual Expiry Check
- User tries to accept expired offer
- **Expected:** Error: "This offer has expired"
- Offer status automatically changed to EXPIRED

---

### Phase 6: Edge Cases & Validation

#### Test 6.1: Duplicate Offer Prevention
- Garage submits offer
- Same garage tries to submit again
- **Expected:** Error: "You have already submitted an offer"

#### Test 6.2: Invalid Status Transition
- Try accepting offer when request is not BROADCASTED/OFFERS_RECEIVED
- **Expected:** Error: "Request is no longer accepting offers"

#### Test 6.3: Offer Form Validation
- ETA < 5 minutes → Error
- ETA > 180 minutes → Error
- Negative visit fee → Error
- Message > 500 chars → Truncated/Error

#### Test 6.4: Garage Unavailable
- Set garage isAvailable=false
- Try submitting offer
- **Expected:** Error: "Garage is currently unavailable"

#### Test 6.5: Unapproved Garage
- Set garage verificationStatus=PENDING
- Try submitting offer
- **Expected:** Error: "Garage must be approved to submit offers"

---

## API Endpoints Reference

### User Endpoints
```
GET    /api/offers/request/:requestId     # View offers for my request
POST   /api/offers/:offerId/accept        # Accept an offer
```

### Garage Endpoints
```
POST   /api/offers/request/:requestId     # Submit offer
GET    /api/offers/my-offers              # View my submitted offers
POST   /api/offers/:offerId/withdraw      # Withdraw my offer
```

---

## Database Verification Queries

```javascript
// Check offer expiry job
db.garageoffers.find({ 
  status: 'PENDING', 
  expiresAt: { $lte: new Date() } 
})

// Check cascade deletion
// Delete request → all related offers deleted
db.assistancerequests.deleteOne({ _id: ObjectId('...') })
db.garageoffers.find({ requestId: ObjectId('...') }) // Should return empty

// Check status transitions
db.assistancerequests.findOne({ _id: ObjectId('...') }, { statusHistory: 1 })
```

---

## Expected Results Summary

### ✅ Success Criteria
1. User can see multiple offers from different garages
2. Offer comparison UI displays all relevant information
3. Accepting offer updates all related statuses correctly
4. Rejected offers cannot be accepted
5. Expired offers marked and cannot be accepted
6. Cron job runs hourly and expires old offers
7. Cascade deletion prevents orphan data
8. All validation rules enforced
9. Status transitions follow state machine
10. Notifications sent at key events

### ❌ Known Limitations
1. Offer expiry cron runs every hour (not real-time)
2. Demo garages clearly marked (no real dispatch)
3. Cloudinary integration requires configuration
4. Real payment processing disabled in demo mode

---

## Troubleshooting

### Issue: No offers appearing
- Check garage is within 20km radius
- Verify garage isAvailable=true
- Confirm garage verificationStatus=APPROVED
- Check request status is BROADCASTED or OFFERS_RECEIVED

### Issue: Cannot accept offer
- Verify offer is still PENDING
- Check offer has not expired
- Confirm user owns the request
- Ensure request status allows acceptance

### Issue: Cron job not running
- Check server logs for "✓ Offer expiry job scheduled"
- Verify node-cron installed: `npm list node-cron`
- Test manual expiry: create test endpoint

---

## Git Commands

After testing and verification:

```bash
# Backend changes
git add backend/src/controllers/offerController.ts
git add backend/src/utils/offerExpiry.ts
git add backend/src/jobs/offerExpiryJob.ts
git add backend/src/index.ts
git add backend/src/models/AssistanceRequest.ts
git add backend/src/models/Garage.ts
git add backend/src/middlewares/upload.ts
git add backend/package.json

# Frontend changes
git add frontend/src/pages/garage/GarageRequestsPage.tsx
git add frontend/src/pages/user/MyRequestsPage.tsx
git add frontend/src/components/garage/SubmitOfferModal.tsx
git add frontend/src/components/user/OffersDisplay.tsx

# Documentation
git add OFFER_SYSTEM_TESTING.md

git commit -m "feat: complete offer system with UI integration and expiry mechanism

- Integrated SubmitOfferModal into GarageRequestsPage
- Integrated OffersDisplay into MyRequestsPage
- Added offer status badges to request lists
- Implemented 24-hour offer expiry mechanism
- Added cron job for automatic offer expiration
- Enhanced upload validation with detailed error messages
- Added cascade deletion for AssistanceRequest and Garage models
- Installed node-cron dependency for background jobs
- Created comprehensive testing guide

Status: Offer system fully functional end-to-end"

git push origin main
```
