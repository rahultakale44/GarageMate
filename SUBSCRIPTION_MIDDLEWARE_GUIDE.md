# Subscription Middleware Usage Guide

## Overview

The subscription middleware provides entitlement enforcement for premium features in GarageMate. It ensures that users have active subscriptions before accessing Pro features.

## Available Middlewares

### 1. `requireProSubscription`

**Purpose:** Checks if user has ANY Pro subscription (Driver Pro, Partner Pro, or Partner Business)

**Use Case:** Generic Pro features that work for all Pro users

**Example:**
```typescript
import { requireProSubscription } from '../middlewares/checkSubscription';

router.get('/premium-feature', 
  authenticate, 
  requireProSubscription, 
  premiumFeatureController
);
```

---

### 2. `requirePlan(plan: SubscriptionPlan)`

**Purpose:** Checks if user has a specific subscription plan

**Use Case:** Features exclusive to a particular plan tier

**Example:**
```typescript
import { requirePlan } from '../middlewares/checkSubscription';
import { SubscriptionPlan } from '../models/Subscription';

// Only Partner Business can access
router.get('/advanced-analytics', 
  authenticate, 
  requirePlan(SubscriptionPlan.PARTNER_BUSINESS), 
  advancedAnalyticsController
);
```

---

### 3. `requireAnyOfPlans(plans: SubscriptionPlan[])`

**Purpose:** Checks if user has any one of the specified plans

**Use Case:** Features available to multiple plan tiers

**Example:**
```typescript
import { requireAnyOfPlans } from '../middlewares/checkSubscription';
import { SubscriptionPlan } from '../models/Subscription';

// Available to Partner Pro OR Partner Business
router.get('/business-analytics', 
  authenticate, 
  requireAnyOfPlans([
    SubscriptionPlan.PARTNER_PRO,
    SubscriptionPlan.PARTNER_BUSINESS
  ]), 
  businessAnalyticsController
);
```

---

### 4. `requirePartnerSubscription`

**Purpose:** Checks if garage owner has Partner Pro or Business subscription

**Use Case:** Garage-specific premium features

**Example:**
```typescript
import { requirePartnerSubscription } from '../middlewares/checkSubscription';

// Garage owners with Partner Pro/Business only
router.get('/garage-analytics', 
  authenticate, 
  authorize(UserRole.GARAGE_OWNER),
  requirePartnerSubscription, 
  garageAnalyticsController
);
```

---

### 5. `requireDriverProSubscription`

**Purpose:** Checks if driver has Driver Pro subscription

**Use Case:** Driver-specific premium features

**Example:**
```typescript
import { requireDriverProSubscription } from '../middlewares/checkSubscription';

// Drivers with Driver Pro only
router.get('/family-vehicles', 
  authenticate, 
  authorize(UserRole.USER),
  requireDriverProSubscription, 
  familyVehiclesController
);
```

---

### 6. `checkSubscription` (Soft Check)

**Purpose:** Adds subscription info to request WITHOUT blocking access

**Use Case:** Features that behave differently for Pro vs Free users

**Example:**
```typescript
import { checkSubscription } from '../middlewares/checkSubscription';

// Works for all users, but behavior changes for Pro
router.get('/search-garages', 
  authenticate, 
  checkSubscription,  // Adds req.subscription
  searchGaragesController
);

// In controller:
export const searchGaragesController = async (req: AuthRequest, res: Response) => {
  const isPro = req.subscription && req.subscription.status === 'ACTIVE';
  
  const limit = isPro ? 50 : 10; // Pro users see more results
  const includeAnalytics = isPro; // Pro users get analytics
  
  // ... rest of logic
};
```

---

## Practical Examples

### Example 1: Premium Analytics Endpoint

```typescript
// routes/analytics.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { requirePartnerSubscription } from '../middlewares/checkSubscription';
import { getBusinessAnalytics } from '../controllers/analyticsController';

const router = Router();

// Only Partner Pro/Business can access
router.get('/business-analytics',
  authenticate,
  requirePartnerSubscription,
  getBusinessAnalytics
);

export default router;
```

### Example 2: Tiered Feature Access

```typescript
// routes/features.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { requireAnyOfPlans, checkSubscription } from '../middlewares/checkSubscription';
import { SubscriptionPlan } from '../models/Subscription';

const router = Router();

// Basic search - free for all, enhanced for Pro
router.get('/search',
  authenticate,
  checkSubscription,
  searchController
);

// Advanced search - only Pro users
router.get('/advanced-search',
  authenticate,
  requireAnyOfPlans([
    SubscriptionPlan.DRIVER_PRO,
    SubscriptionPlan.PARTNER_PRO,
    SubscriptionPlan.PARTNER_BUSINESS
  ]),
  advancedSearchController
);

export default router;
```

### Example 3: Driver Pro Features

```typescript
// routes/vehicles.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { requireDriverProSubscription } from '../middlewares/checkSubscription';
import { UserRole } from '../types';

const router = Router();

// Basic vehicle management - free
router.get('/my-vehicles',
  authenticate,
  authorize(UserRole.USER),
  getMyVehiclesController
);

// Family vehicle management - Pro only
router.get('/family-vehicles',
  authenticate,
  authorize(UserRole.USER),
  requireDriverProSubscription,
  getFamilyVehiclesController
);

// Maintenance reminders - Pro only
router.get('/maintenance-reminders',
  authenticate,
  authorize(UserRole.USER),
  requireDriverProSubscription,
  getMaintenanceRemindersController
);

export default router;
```

---

## Error Responses

When subscription check fails, the middleware returns:

**Status Code:** `403 Forbidden`

**Response Body:**
```json
{
  "success": false,
  "message": "This feature requires a Pro subscription. Please upgrade your account to access premium features."
}
```

**Other error messages:**
- `"This feature requires Driver Pro subscription. Please upgrade to access premium features."`
- `"This feature requires Partner Pro or Business subscription. Please upgrade to access analytics and advanced features."`
- `"Your subscription has expired. Please renew to continue accessing Pro features."`
- `"This feature requires PARTNER_BUSINESS subscription. Please upgrade to access this feature."`

---

## Subscription Info in Request

After middleware runs successfully, subscription data is available in the controller:

```typescript
export const premiumFeatureController = async (req: AuthRequest, res: Response) => {
  // Access subscription info
  const subscription = req.subscription;
  
  console.log('Plan:', subscription.plan);
  console.log('Expires:', subscription.currentPeriodEnd);
  console.log('Status:', subscription.status);
  
  // Use subscription data to customize response
  const features = getAvailableFeatures(subscription.plan);
  
  res.json({
    success: true,
    data: features
  });
};
```

---

## Best Practices

### 1. **Always Use with `authenticate` First**
```typescript
// ✅ Correct
router.get('/pro-feature', authenticate, requireProSubscription, controller);

// ❌ Wrong - authentication required first
router.get('/pro-feature', requireProSubscription, controller);
```

### 2. **Use Specific Middlewares When Possible**
```typescript
// ✅ Better - more explicit
router.get('/garage-analytics', requirePartnerSubscription, controller);

// ⚠️ Less clear - generic check
router.get('/garage-analytics', requireProSubscription, controller);
```

### 3. **Combine with Role Authorization**
```typescript
// ✅ Correct - check both role and subscription
router.get('/driver-feature',
  authenticate,
  authorize(UserRole.USER),
  requireDriverProSubscription,
  controller
);
```

### 4. **Use Soft Check for Tiered Features**
```typescript
// ✅ Good - different experience for Pro users
router.get('/search',
  authenticate,
  checkSubscription,  // Doesn't block
  searchController
);
```

---

## Testing Subscription Middleware

### Test Case 1: User Without Subscription
```typescript
// Should return 403
GET /api/premium-feature
Authorization: Bearer <user_token_without_subscription>

Response: 403 Forbidden
{
  "success": false,
  "message": "This feature requires a Pro subscription..."
}
```

### Test Case 2: User With Active Pro
```typescript
// Should succeed
GET /api/premium-feature
Authorization: Bearer <user_token_with_active_pro>

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

### Test Case 3: Expired Subscription
```typescript
// Should return 403
GET /api/premium-feature
Authorization: Bearer <user_token_with_expired_subscription>

Response: 403 Forbidden
{
  "success": false,
  "message": "Your subscription has expired..."
}
```

---

## Future Premium Features to Protect

### Driver Features (Require Driver Pro)
- ✅ Family vehicle management
- ✅ Maintenance reminders
- ✅ Service history tracking
- ✅ Member discounts
- ✅ Priority request matching

### Partner Features (Require Partner Pro/Business)
- ✅ Business analytics dashboard
- ✅ Promotional tools
- ✅ Enhanced garage profile
- ✅ Service catalogue management
- ✅ Advanced insights

### Partner Business Only
- ✅ Multi-location management
- ✅ Unlimited staff accounts
- ✅ API access
- ✅ White-label reports
- ✅ Dedicated account manager

---

## Implementation Checklist

When adding a premium feature:

- [ ] Identify which subscription tier(s) should have access
- [ ] Choose appropriate middleware from above
- [ ] Add middleware to route after `authenticate`
- [ ] Update API documentation
- [ ] Add frontend entitlement checks (optional but recommended)
- [ ] Test with free user (should be blocked)
- [ ] Test with Pro user (should succeed)
- [ ] Test with expired subscription (should be blocked)

---

## Frontend Integration

While backend enforces entitlements, frontend should also check to improve UX:

```typescript
// Example: Hide Pro features for free users
const { subscription } = useSubscription();

{subscription.isPro ? (
  <Link to="/premium-feature">
    Access Premium Feature
  </Link>
) : (
  <Link to="/pro-membership">
    Upgrade to Pro to Unlock
  </Link>
)}
```

This provides:
- Better user experience (no failed requests)
- Clear upgrade prompts
- Backend still enforces security

---

## Summary

| Middleware | Use Case | Plans Allowed |
|------------|----------|---------------|
| `requireProSubscription` | Any Pro feature | Driver Pro, Partner Pro, Partner Business |
| `requirePlan(plan)` | Specific plan only | Single plan |
| `requireAnyOfPlans(plans)` | Multiple specific plans | Array of plans |
| `requirePartnerSubscription` | Garage Pro features | Partner Pro, Partner Business |
| `requireDriverProSubscription` | Driver Pro features | Driver Pro only |
| `checkSubscription` | Soft check (doesn't block) | All users |

---

**Status:** ✅ Implemented and Ready to Use  
**Location:** `backend/src/middlewares/checkSubscription.ts`  
**Next Step:** Apply to premium feature endpoints as they're developed

