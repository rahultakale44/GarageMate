# GarageMate Testing Guide

## 🚀 Servers Running

**Backend:** http://localhost:5000  
**Frontend:** http://localhost:5173  
**Health Check:** http://localhost:5000/health

---

## 📋 Quick Test Checklist

### 1. Landing Page
- Open: http://localhost:5173
- Verify homepage loads
- Check navbar and hero section
- Click "Get Started" → Should show role selection

### 2. User Registration & Login
**Register New User:**
- Go to: http://localhost:5173/auth/user/register
- Fill in details (email, password, name, mobile)
- Submit → Should redirect to login page
- Message: "Account created successfully. Please sign in to continue."

**Login:**
- Email: Use your registered email
- Password: Your password
- Click "Sign In" → Redirects to `/user/dashboard`

### 3. User Dashboard - Location & Nearby Garages

**Test Location:**
1. Dashboard shows "Where are you right now?"
2. Click "Use My Current Location"
3. Browser asks for permission → Allow
4. Location detected and displayed
5. Stats update with real counts
6. Nearby Garages section appears (top 3 garages)

**Test Garage Cards:**
1. Click on a garage card → Opens detail page
2. Click "View Details" → Opens detail page
3. Click "Request Help" → Opens emergency page with prefilled data
4. Click "View All" → Opens nearby garages page

### 4. Nearby Garages Page - Full Search

**Navigate:**
- From dashboard click "Find Garages" in sidebar
- Or click "View All" from nearby preview
- URL: http://localhost:5173/user/nearby-garages

**Test Search Flow:**
1. Click "Use My Current Location"
2. Watch radar animation:
   - "Detecting your location…"
   - "Finding highly rated garages near you…"
   - "Matching garages for your vehicle…"
   - "Nearby garages found"
3. Map shows:
   - Blue marker (your location)
   - Green markers (garages)
   - Dashed circle (search radius)
4. Results list shows garage cards

**Test Filters:**
1. Change radius: 2, 5, 10, 20 km
2. Select service type (e.g., "Tyre Puncture")
3. Select vehicle type (e.g., "CAR")
4. Set minimum rating (e.g., "4+")
5. Toggle "Open now"
6. Toggle "Available now"
7. Results update automatically

**Test Sorting:**
- Sort by Distance → Nearest first
- Sort by Rating → Highest rated first
- Sort by Visit Fee → Cheapest first

**Test Map:**
1. Click "List view" → Map hidden
2. Click "Map view" → Map visible
3. Click garage marker → Shows popup
4. Click "Recenter" → Returns to user location
5. Zoom in/out works smoothly

**Test Garage Actions:**
1. Click "View Garage" → Opens detail page
2. Click "Request Help" → Opens emergency with prefill
3. Click phone icon → Opens dialer (if phone available)
4. Click directions icon → Opens Google Maps

### 5. Garage Detail Page

**Navigate:**
- From nearby garages, click "View Garage"
- Or from dashboard garage card
- URL pattern: `/user/garages/:garageId`

**Verify Display:**
- Garage name with verified badge
- Demo badge (if demo garage in dev mode)
- Address and location info
- Distance from your location
- Estimated arrival time
- Star rating and reviews
- Services offered (grid layout)
- Supported vehicles (chips)
- Working hours and open/closed status
- Availability status
- Map with garage marker
- Visit fee and service radius

**Test Actions:**
1. Click "Request Help" → Emergency page with prefilled garage
2. Click "Call Garage" → Opens phone dialer
3. Click "Get Directions" → Opens Google Maps
4. Click "Back to Search" → Returns to nearby garages

### 6. Emergency Request Page - Selected Garage

**Navigate:**
- From garage detail, click "Request Help"
- Or from nearby garages card, click "Request Help"
- URL: http://localhost:5173/user/emergency

**Verify Prefill:**
1. Banner shows: "Requesting help from {Garage Name}"
2. Location fields prefilled (latitude, longitude, address)
3. Can click "Clear" to remove garage selection
4. Can change garage (removes banner)

**Test Request Creation:**
1. Select vehicle from dropdown
2. Select issue category (e.g., "Tyre Puncture")
3. Set urgency (HIGH, MEDIUM, LOW)
4. Enter issue description (minimum 10 characters)
5. Optionally upload photos (up to 4)
6. Verify location is filled
7. Click "Submit Assistance Request"
8. Success message appears
9. Redirects to `/user/requests` after 1.5 seconds

**Verify in Database:**
- Request should have `garageId` field set
- Coordinates in GeoJSON format: `[longitude, latitude]`

### 7. Vehicle Management

**Add Vehicle:**
1. In dashboard, click "+" button in "My Vehicles" section
2. Fill form:
   - Vehicle type (BIKE, SCOOTER, CAR, SUV, VAN, OTHER)
   - Brand (e.g., "Maruti")
   - Model (e.g., "Swift")
   - Registration number (e.g., "MH12AB1234")
   - Fuel type (Petrol, Diesel, CNG, Electric, Hybrid)
   - Manufacturing year
   - Optional notes
3. Click "Add Vehicle"
4. Vehicle appears in list

**Edit/Delete Vehicle:**
- Click pencil icon → Edit form opens
- Click trash icon → Confirm deletion

---

## 🎯 Demo Garage Credentials

**Seeded Demo Garages:**
- 10 garages around Pune (Loni Kalbhor, Hadapsar, Manjari, etc.)
- All marked as APPROVED
- All have realistic data

**Demo Garage Owner Login:**
- Email: `demo.loni@garagemate.com`
- Password: `DemoGarage@123`
- Navigate to: http://localhost:5173/auth/garage/login

---

## 🧪 Advanced Testing

### Test Garage Selection Flow

**Full Flow:**
1. Dashboard → Enable location
2. Nearby preview shows 3 garages
3. Click first garage → Detail page opens
4. Verify distance calculated correctly
5. Click "Request Help" → Emergency page opens
6. Banner shows garage name
7. Location prefilled
8. Submit request
9. Check MongoDB: `garageId` field present

### Test Without Garage Selection

**Broadcast Request:**
1. Go directly to: http://localhost:5173/user/emergency
2. Don't select any garage
3. Fill form manually
4. Submit request
5. Request created without `garageId` (broadcast to all garages)

### Test Radar Animation

**Verify Animation:**
1. Go to nearby garages page
2. Clear location if set
3. Click "Use My Current Location"
4. Watch for:
   - Radar rings expanding from user marker
   - Rings fade as they expand
   - Multiple rings (up to 3 concurrent)
   - Animation stops when results appear
   - No infinite loop

### Test Map Fit Bounds

**Verify Automatic Zoom:**
1. Search with 2 km radius → Map zooms in tight
2. Search with 20 km radius → Map zooms out wider
3. Map always shows all results
4. User marker always visible
5. Padding around markers

### Test Mobile Responsive

**Resize Browser:**
1. Narrow to mobile width (< 768px)
2. Check layout adapts
3. Map remains functional
4. Filters stack vertically
5. Cards display properly

---

## 🐛 Known Warnings (Non-Breaking)

**Backend Console:**
- ⚠️ Deprecation warning for `url.parse()` - Safe to ignore
- ⚠️ Duplicate schema index warning - Safe to ignore
- ⚠️ Firebase not configured - Expected in development
- ⚠️ Cloudinary not configured - Expected in development
- ⚠️ Razorpay not configured - Expected in development

**These warnings don't affect functionality.**

---

## 📊 Database Verification

**Check MongoDB:**
```bash
# Connect to MongoDB
mongo mongodb://127.0.0.1:27017/garagemate

# Check garages
db.garages.find({ verificationStatus: 'APPROVED' }).count()
# Should return: 10

# Check a request with garage
db.assistancerequests.findOne({ garageId: { $exists: true } })
# Should show: garageId field with ObjectId

# Check GeoJSON format
db.assistancerequests.findOne({}, { location: 1 })
# Should show: { type: 'Point', coordinates: [lng, lat] }
```

---

## ✅ Expected Results

### After Complete Test Run:

**Dashboard:**
- ✅ Location detected and saved
- ✅ Real stats displayed (vehicles, requests, nearby garages)
- ✅ Top 3 nearby garages shown
- ✅ No hard-coded values

**Nearby Garages:**
- ✅ Radar animation plays during search
- ✅ Map shows user and garage markers
- ✅ Filters work correctly
- ✅ Sorting works correctly
- ✅ All actions functional

**Garage Detail:**
- ✅ Complete information displayed
- ✅ Distance calculated from user location
- ✅ All actions work (Request Help, Call, Directions)

**Emergency Request:**
- ✅ Selected garage shown in banner
- ✅ Location and garage prefilled
- ✅ Can clear or change garage
- ✅ Request created with garageId

**Database:**
- ✅ 10 demo garages exist
- ✅ Requests have garageId when selected
- ✅ Coordinates in correct GeoJSON format

---

## 🔧 Troubleshooting

**Map not loading:**
- Check browser console for errors
- Verify Leaflet CSS is loaded
- Check network tab for tile requests

**Location permission denied:**
- Browser blocks geolocation
- Use manual coordinates instead
- Or allow location in browser settings

**No nearby garages:**
- Verify location is in Pune area (18.5° N, 73.8° E)
- Try larger radius (20 km)
- Check if garages are APPROVED in database

**Backend not responding:**
- Check if MongoDB is running
- Verify port 5000 is not in use
- Check backend console for errors

---

## 🎉 Success Criteria

**All tests pass if:**
1. ✅ User can register and login
2. ✅ Location detection works
3. ✅ Nearby garages show on dashboard
4. ✅ Map displays correctly with markers
5. ✅ Radar animation plays smoothly
6. ✅ Filters and sorting work
7. ✅ Garage detail page loads
8. ✅ Request Help prefills garage and location
9. ✅ Request submission succeeds
10. ✅ garageId stored in database

---

**Happy Testing! 🚀**

For issues or questions, check the console logs in both backend and frontend terminals.
