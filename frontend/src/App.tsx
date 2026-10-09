import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy, useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RedirectHandler from './components/auth/RedirectHandler';

// Loader
import PageLoader from './components/animation/PageLoader';

// Public pages
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const RoleSelection = lazy(() => import('./pages/auth/RoleSelection'));

// Auth pages
const UserLogin = lazy(() => import('./pages/auth/UserLogin'));
const UserRegister = lazy(() => import('./pages/auth/UserRegister'));
const GarageLogin = lazy(() => import('./pages/auth/GarageLogin'));
const GarageRegister = lazy(() => import('./pages/auth/GarageRegister'));
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'));

// User pages
const UserDashboard = lazy(() => import('./pages/user/UserDashboard'));
const EmergencyRequestPage = lazy(() => import('./pages/user/EmergencyRequestPage'));
const MyRequestsPage = lazy(() => import('./pages/user/MyRequestsPage'));
const NearbyGaragesPage = lazy(() => import('./pages/user/NearbyGaragesPage'));
const GarageDetailPage = lazy(() => import('./pages/user/GarageDetailPage'));
const MyVehiclesPage = lazy(() => import('./pages/user/MyVehiclesPage'));
const MyReviewsPage = lazy(() => import('./pages/user/MyReviewsPage'));

// Garage pages
const GarageDashboard = lazy(() => import('./pages/garage/GarageDashboard'));
const GarageRequestsPage = lazy(() => import('./pages/garage/GarageRequestsPage'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminRequestsPage = lazy(() => import('./pages/admin/AdminRequestsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AppRoutes() {
  const [showLoader, setShowLoader] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    const loaderShown = sessionStorage.getItem('loaderShown');

    if (loaderShown) {
      setShowLoader(false);
      setHasLoadedOnce(true);
    } else {
      const timer = setTimeout(() => {
        setShowLoader(false);
        setHasLoadedOnce(true);
        sessionStorage.setItem('loaderShown', 'true');
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      {showLoader && !hasLoadedOnce && <PageLoader />}
      <Router>
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/get-started" element={<RoleSelection />} />

            <Route path="/auth/user/login" element={<UserLogin />} />
            <Route path="/auth/user/register" element={<UserRegister />} />
            <Route path="/auth/garage/login" element={<GarageLogin />} />
            <Route path="/auth/garage/register" element={<GarageRegister />} />
            <Route path="/auth/admin/login" element={<AdminLogin />} />

            <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/user/emergency" element={<EmergencyRequestPage />} />
              <Route path="/user/requests" element={<MyRequestsPage />} />
              <Route path="/user/requests/:id" element={<MyRequestsPage />} />
              <Route path="/user/nearby-garages" element={<NearbyGaragesPage />} />
              <Route path="/user/garages/:garageId" element={<GarageDetailPage />} />
              <Route path="/user/vehicles" element={<MyVehiclesPage />} />
              <Route path="/user/reviews" element={<MyReviewsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['GARAGE_OWNER']} />}>
              <Route path="/garage/dashboard" element={<GarageDashboard />} />
              <Route path="/garage/requests" element={<GarageRequestsPage />} />
              <Route path="/garage/requests/:id" element={<GarageRequestsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/requests" element={<AdminRequestsPage />} />
            </Route>

            <Route path="/redirect" element={<RedirectHandler />} />
            <Route path="*" element={<div className="min-h-screen flex items-center justify-center p-8 text-center"><div><h1 className="text-3xl font-bold text-dark-900 mb-4">Page Not Found</h1><p className="text-dark-600">The page you are looking for does not exist.</p></div></div>} />
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
