# GarageMate Subscription System - Quick Reference

## Payment Flow

### Driver Pro
```
User → /pro page → Click "Upgrade to Pro" → Razorpay → Payment → Active Subscription
```

### Partner Plans
```
Garage Owner → /garage-plans → Click "Upgrade to Pro" → Fetch Garage ID → Razorpay → Payment → Active Subscription
```

---

## Pricing

| Plan | Monthly | Annual | Savings |
|------|---------|--------|---------|
| Driver Pro | ₹199 | ₹1,999 | ₹400 (17%) |
| Partner Pro | ₹499 | ₹4,999 | ₹500 (17%) |
| Partner Business | ₹1,499 | ₹14,999 | ₹1,500 (17%) |

**Note:** Prices defined in `backend/src/config/subscriptionPlans.ts`

---

## API Endpoints

### Subscription Management
```
GET    /api/subscriptions/plans              - Get available plans
POST   /api/subscriptions/create-order       - Create payment order
POST   /api/subscriptions/verify-payment     - Verify and activate
GET    /api/subscriptions/my-subscription    - Get current subscription
DELETE /api/subscriptions/:id                - Cancel subscription
```

### Payments (Existing)
```
POST   /api/payments/create-order            - For booking fees
POST   /api/payments/verify                  - Verify booking payment
```

---

## Frontend Components

### Payment Modal
```typescript
import RazorpayCheckout from '@/components/payment/RazorpayCheckout';

<RazorpayCheckout
  plan={SubscriptionPlan.DRIVER_PRO}
  billingInterval={BillingInterval.MONTHLY}
  amount={199}
  garageId={garageId} // Optional, for garage owners only
  onSuccess={handleSuccess}
  onClose={handleClose}
/>
```

### Subscription Service
```typescript
import { 
  getMySubscription,
  createSubscriptionOrder,
  verifySubscriptionPayment 
} from '@/services/subscriptionService';

// Get current subscription
const subscription = await getMySubscription();

// Check if Pro
const isPro = subscription.plan === SubscriptionPlan.DRIVER_PRO;
```

---

## Backend Middleware

### Protect a Route
```typescript
import { requireProSubscription } from '../middlewares/checkSubscription';

// Require any Pro subscription
router.get('/premium', authenticate, requireProSubscription, controller);

// Require specific plan
router.get('/business', authenticate, requirePlan(SubscriptionPlan.PARTNER_BUSINESS), controller);

// Require Partner Pro or Business
router.get('/analytics', authenticate, requirePartnerSubscription, controller);

// Soft check (doesn't block)
router.get('/search', authenticate, checkSubscription, controller);
```

### Access Subscription in Controller
```typescript
export const controller = async (req: AuthRequest, res: Response) => {
  const subscription = req.subscription;
  
  if (subscription) {
    console.log('Plan:', subscription.plan);
    console.log('Expires:', subscription.currentPeriodEnd);
  }
};
```

---

## Test Cards

### Success
```
Card: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

### Failure (for testing error handling)
```
Card: 4000 0000 0000 0002
```

---

## Subscription Status

| Status | Meaning |
|--------|---------|
| `PENDING` | Payment initiated, not completed |
| `ACTIVE` | Subscription active and valid |
| `PAST_DUE` | Payment failed, grace period |
| `EXPIRED` | Subscription period ended |
| `CANCELLED` | User cancelled subscription |

---

## Environment Variables

### Backend (.env)
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=optional
```

### Frontend (.env)
```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

---

## Common Tasks

### Add New Premium Feature

1. **Backend:**
```typescript
// Add route with middleware
router.get('/new-feature',
  authenticate,
  requireProSubscription,
  newFeatureController
);
```

2. **Frontend:**
```typescript
// Check subscription before showing
const { subscription } = useSubscription();

{subscription.isPro && (
  <Link to="/new-feature">Premium Feature</Link>
)}
```

### Check Subscription in Code

**Frontend:**
```typescript
const { subscription } = useAuth(); // or useSubscription()
const isPro = subscription?.status === 'ACTIVE' && 
              subscription?.plan !== 'DRIVER_FREE';
```

**Backend:**
```typescript
const subscription = await Subscription.findOne({
  userId: req.user!.userId,
  status: SubscriptionStatus.ACTIVE
});

const isPro = subscription && 
              subscription.plan !== SubscriptionPlan.DRIVER_FREE;
```

### Get Subscription Details

**Frontend:**
```typescript
import { getMySubscription } from '@/services/subscriptionService';

const data = await getMySubscription();
console.log('Plan:', data.plan);
console.log('Status:', data.status);
console.log('Expires:', data.subscription?.currentPeriodEnd);
```

**Backend:**
```typescript
const subscription = await Subscription.findOne({
  userId: req.user!.userId,
  status: SubscriptionStatus.ACTIVE
}).sort({ createdAt: -1 });
```

---

## Error Codes

| Code | Message | Fix |
|------|---------|-----|
| 403 | "This feature requires a Pro subscription" | Upgrade to Pro |
| 403 | "Your subscription has expired" | Renew subscription |
| 400 | "You already have an active subscription" | Can't purchase duplicate |
| 400 | "Invalid payment signature" | Payment verification failed |
| 404 | "Subscription not found" | Subscription doesn't exist |

---

## Subscription Plans Enum

```typescript
export enum SubscriptionPlan {
  DRIVER_FREE = 'DRIVER_FREE',
  DRIVER_PRO = 'DRIVER_PRO',
  PARTNER_FREE = 'PARTNER_FREE',
  PARTNER_PRO = 'PARTNER_PRO',
  PARTNER_BUSINESS = 'PARTNER_BUSINESS',
}
```

---

## Billing Intervals

```typescript
export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}
```

---

## File Locations

### Backend
```
backend/src/
├── config/
│   └── subscriptionPlans.ts        # Pricing configuration
├── controllers/
│   ├── subscriptionController.ts   # Subscription logic
│   └── paymentController.ts        # Payment logic
├── middlewares/
│   ├── auth.ts                     # Authentication
│   └── checkSubscription.ts        # Entitlement checks
├── models/
│   └── Subscription.ts             # Subscription schema
└── routes/
    └── subscriptions.ts            # Subscription routes
```

### Frontend
```
frontend/src/
├── components/
│   └── payment/
│       └── RazorpayCheckout.tsx    # Payment modal
├── pages/
│   ├── public/
│   │   └── ProMembershipPage.tsx   # Driver Pro page
│   └── garage/
│       └── GaragePlansPage.tsx     # Partner plans page
├── services/
│   └── subscriptionService.ts      # API calls
└── types/
    └── subscription.ts             # Type definitions
```

---

## Quick Commands

### Start Development
```bash
# Backend
cd backend
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev
```

### Build for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Test Payment Flow
```bash
# 1. Open browser: http://localhost:5173
# 2. Register/login as user or garage owner
# 3. Go to /pro or /garage-plans
# 4. Click "Upgrade to Pro"
# 5. Use test card: 4111 1111 1111 1111
# 6. Complete payment
# 7. Verify in dashboard
```

---

## Common Patterns

### Tiered Features
```typescript
// Different behavior for Pro vs Free
router.get('/search', authenticate, checkSubscription, async (req, res) => {
  const isPro = req.subscription?.status === 'ACTIVE';
  const limit = isPro ? 50 : 10;
  
  const results = await search({ limit });
  res.json({ data: results, isPro });
});
```

### Upgrade Prompt
```typescript
// Show upgrade button for free users
{!isPro && (
  <button onClick={() => navigate('/pro')}>
    Upgrade to Pro
  </button>
)}
```

### Plan-Specific Features
```typescript
// Only show for specific plan
{subscription.plan === SubscriptionPlan.PARTNER_BUSINESS && (
  <AdvancedAnalytics />
)}
```

---

## Debug Checklist

Payment not working?
- [ ] Check Razorpay keys in .env files
- [ ] Verify backend is running
- [ ] Check browser console for errors
- [ ] Verify network requests in DevTools
- [ ] Check backend logs for API errors

Subscription not activating?
- [ ] Check payment verification signature
- [ ] Verify order ID matches
- [ ] Check subscription status in database
- [ ] Look for errors in backend logs

Middleware blocking access?
- [ ] Verify user has active subscription
- [ ] Check subscription hasn't expired
- [ ] Verify correct middleware used
- [ ] Check authentication token is valid

---

## Support Resources

- **Payment Setup:** See `PAYMENT_SETUP_GUIDE.md`
- **Full Implementation:** See `PHASE_3_PAYMENT_INTEGRATION_REPORT.md`
- **Middleware Guide:** See `SUBSCRIPTION_MIDDLEWARE_GUIDE.md`
- **This Session:** See `PHASE_3_CONTINUATION_SUMMARY.md`

---

**Last Updated:** December 2024  
**Status:** ✅ Production Ready

