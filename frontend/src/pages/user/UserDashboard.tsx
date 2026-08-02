import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Car,
  MapPin,
  Clock,
  Star,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';

interface VehicleRecord {
  _id: string;
  vehicleType: string;
  brand: string;
  vehicleModel: string;
  registrationNumber: string;
  fuelType: string;
  manufacturingYear: number;
  notes?: string;
}

interface RequestRecord {
  _id: string;
  issueCategory: string;
  status: string;
  createdAt: string;
  garageId?: { name?: string };
}

interface DashboardStats {
  nearbyGarages: number;
  activeRequests: number;
  completedRequests: number;
  vehicles: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  locality?: string;
  city?: string;
  address?: string;
}

interface VehicleFormState {
  vehicleType: string;
  brand: string;
  vehicleModel: string;
  registrationNumber: string;
  fuelType: string;
  manufacturingYear: string;
  notes: string;
}

const defaultVehicleForm = (): VehicleFormState => ({
  vehicleType: 'CAR',
  brand: '',
  vehicleModel: '',
  registrationNumber: '',
  fuelType: '',
  manufacturingYear: new Date().getFullYear().toString(),
  notes: '',
});

const vehicleTypeOptions = ['BIKE', 'SCOOTER', 'CAR', 'SUV', 'VAN', 'OTHER'];
const fuelTypeOptions = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [submittingVehicle, setSubmittingVehicle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleRecord | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleFormState>(defaultVehicleForm());
  
  // Location state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Dashboard stats
  const [stats, setStats] = useState<DashboardStats>({
    nearbyGarages: 0,
    activeRequests: 0,
    completedRequests: 0,
    vehicles: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const navItems = [
    { icon: AlertCircle, label: 'Dashboard', active: true, path: '/user/dashboard' },
    { icon: MapPin, label: 'Find Garages', path: '/user/nearby-garages' },
    { icon: AlertCircle, label: 'Emergency Help', path: '/user/emergency' },
    { icon: Clock, label: 'My Requests', path: '/user/requests' },
    { icon: Car, label: 'My Vehicles', path: '/user/dashboard' },
    { icon: Star, label: 'Reviews', path: '/user/dashboard' },
  ];

  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  // Load saved location from sessionStorage
  useEffect(() => {
    const savedLocation = sessionStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        setUserLocation(JSON.parse(savedLocation));
      } catch {
        // Invalid saved location
      }
    }
  }, []);
  
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    
    setRequestingLocation(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Call reverse geocoding API
          const response = await axiosInstance.get(API_ENDPOINTS.GARAGES.REVERSE_GEOCODE, {
            params: { latitude, longitude },
          });
          
          const locationData: UserLocation = {
            latitude,
            longitude,
            address: response.data?.data?.displayName || response.data?.data?.address,
            locality: response.data?.data?.locality,
            city: response.data?.data?.city,
          };
          
          setUserLocation(locationData);
          sessionStorage.setItem('userLocation', JSON.stringify(locationData));
          
          // Fetch nearby garages count
          await fetchNearbyGaragesCount(latitude, longitude);
        } catch (error) {
          // Still save location even if reverse geocoding fails
          const locationData: UserLocation = {
            latitude,
            longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          };
          setUserLocation(locationData);
          sessionStorage.setItem('userLocation', JSON.stringify(locationData));
        } finally {
          setRequestingLocation(false);
        }
      },
      (error) => {
        setRequestingLocation(false);
        if (error.code === 1) {
          setLocationError('Location permission denied. You can enter your location manually.');
        } else if (error.code === 2) {
          setLocationError('Location is currently unavailable.');
        } else if (error.code === 3) {
          setLocationError('Location request timed out.');
        } else {
          setLocationError('Unable to detect your location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };
  
  const fetchNearbyGaragesCount = async (lat: number, lng: number) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GARAGES.NEARBY, {
        params: {
          latitude: lat,
          longitude: lng,
          radius: 10, // 10 km default
        },
      });
      const garageCount = response.data?.data?.length || 0;
      setStats(prev => ({ ...prev, nearbyGarages: garageCount }));
    } catch {
      // Silently fail
    }
  };

  const fetchVehicles = async () => {
    if (!user) {
      setVehicles([]);
      return;
    }

    setLoadingVehicles(true);
    setErrorMessage(null);

    try {
      const response = await axiosInstance.get(API_ENDPOINTS.VEHICLES.LIST);
      setVehicles(response.data?.data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load vehicles';
      setErrorMessage(message);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchRequests = async () => {
    if (!user) {
      return;
    }

    setLoadingRequests(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.REQUESTS.MY);
      const allRequests = response.data?.data || [];
      setRequests(allRequests.slice(0, 3));
      
      // Update stats
      const active = allRequests.filter((r: RequestRecord) => 
        !['CANCELLED', 'CLOSED', 'PAID', 'SERVICE_COMPLETED'].includes(r.status)
      ).length;
      const completed = allRequests.filter((r: RequestRecord) => 
        ['CLOSED', 'PAID', 'SERVICE_COMPLETED'].includes(r.status)
      ).length;
      
      setStats(prev => ({ ...prev, activeRequests: active, completedRequests: completed }));
    } catch {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    void fetchVehicles();
    void fetchRequests();
    
    // Fetch nearby garages if location is already saved
    if (userLocation) {
      void fetchNearbyGaragesCount(userLocation.latitude, userLocation.longitude);
    }
  }, [user?._id]);
  
  useEffect(() => {
    setStats(prev => ({ ...prev, vehicles: vehicles.length }));
  }, [vehicles.length]);

  const openCreateModal = () => {
    setEditingVehicle(null);
    setVehicleForm(defaultVehicleForm());
    setErrorMessage(null);
    setIsVehicleModalOpen(true);
  };

  const openEditModal = (vehicle: VehicleRecord) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      vehicleType: vehicle.vehicleType,
      brand: vehicle.brand,
      vehicleModel: vehicle.vehicleModel,
      registrationNumber: vehicle.registrationNumber,
      fuelType: vehicle.fuelType,
      manufacturingYear: String(vehicle.manufacturingYear),
      notes: vehicle.notes || '',
    });
    setErrorMessage(null);
    setIsVehicleModalOpen(true);
  };

  const closeVehicleModal = () => {
    setIsVehicleModalOpen(false);
    setEditingVehicle(null);
    setVehicleForm(defaultVehicleForm());
    setErrorMessage(null);
  };

  const handleVehicleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingVehicle(true);
    setErrorMessage(null);

    try {
      const payload = {
        ...vehicleForm,
        manufacturingYear: Number(vehicleForm.manufacturingYear),
      };

      let response: { data: { data: VehicleRecord } };
      if (editingVehicle) {
        response = await axiosInstance.patch(API_ENDPOINTS.VEHICLES.UPDATE(editingVehicle._id), payload);
        setVehicles((prev) => prev.map((vehicle) => (vehicle._id === editingVehicle._id ? response.data.data : vehicle)));
      } else {
        response = await axiosInstance.post(API_ENDPOINTS.VEHICLES.CREATE, payload);
        setVehicles((prev) => [response.data.data, ...prev]);
      }

      closeVehicleModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save vehicle';
      setErrorMessage(message);
    } finally {
      setSubmittingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    const confirmed = window.confirm('Delete this vehicle from your profile?');
    if (!confirmed) {
      return;
    }

    try {
      await axiosInstance.delete(API_ENDPOINTS.VEHICLES.DELETE(vehicleId));
      setVehicles((prev) => prev.filter((vehicle) => vehicle._id !== vehicleId));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete vehicle';
      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen bg-dark-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-dark-200 z-50 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-dark-200 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-white">G</span>
            </div>
            <span className="text-xl font-display font-bold">GarageMate</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.path) {
                  navigate(item.path);
                }
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active ? 'bg-primary-50 text-primary-600' : 'text-dark-600 hover:bg-dark-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-200">
          <div className="flex items-center gap-3 p-3 bg-dark-50 rounded-lg mb-2">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-dark-500 truncate">{user?.email || 'No email'}</p>
            </div>
          </div>
          <button
            onClick={() => void logout().then(() => navigate('/'))}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="bg-white border-b border-dark-200 sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-dark-900">Dashboard</h1>
            <button className="relative p-2 hover:bg-dark-50 rounded-lg transition-colors">
              <Bell className="w-6 h-6 text-dark-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
            </button>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          {/* Location Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-dark-200 mb-6"
          >
            {!userLocation ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-primary-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-dark-900">Where are you right now?</h3>
                    <p className="text-sm text-dark-600">We'll find the nearest garages for you</p>
                  </div>
                </div>
                {locationError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {locationError}
                  </div>
                )}
                <button
                  onClick={handleUseCurrentLocation}
                  disabled={requestingLocation}
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {requestingLocation ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Detecting location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      Use My Current Location
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-6 h-6 text-green-600 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-dark-900">
                        You're currently near {userLocation.locality || userLocation.city || 'your location'}
                      </h3>
                      <p className="text-sm text-dark-600 mt-1">{userLocation.address}</p>
                      <p className="text-xs text-dark-500 mt-2">
                        {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleUseCurrentLocation}
                    disabled={requestingLocation}
                    className="px-4 py-2 border border-dark-300 rounded-lg text-sm font-medium hover:bg-dark-50 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
                <Link
                  to="/user/nearby-garages"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Find nearby garages →
                </Link>
              </div>
            )}
          </motion.div>

          {/* Emergency CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 md:p-8 text-white mb-8"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Need Emergency Help?</h2>
                <p className="text-red-100">Get roadside assistance from nearby verified garages</p>
              </div>
              <Link 
                to={vehicles.length === 0 ? "#" : "/user/emergency"} 
                onClick={(e) => {
                  if (vehicles.length === 0) {
                    e.preventDefault();
                    alert('Please add a vehicle first before requesting emergency assistance.');
                    setIsVehicleModalOpen(true);
                  }
                }}
                className="px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors whitespace-nowrap flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5" />
                Get Help Now
              </Link>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 border border-dark-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-dark-900">{stats.nearbyGarages}</span>
              </div>
              <h3 className="text-sm font-medium text-dark-600">Nearby Garages</h3>
              {!userLocation && (
                <p className="text-xs text-dark-500 mt-1">Enable location to see garages</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 border border-dark-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-2xl font-bold text-dark-900">{stats.activeRequests}</span>
              </div>
              <h3 className="text-sm font-medium text-dark-600">Active Requests</h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 border border-dark-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-dark-900">{stats.completedRequests}</span>
              </div>
              <h3 className="text-sm font-medium text-dark-600">Completed Requests</h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-6 border border-dark-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary-50 rounded-lg">
                  <Car className="w-6 h-6 text-primary-600" />
                </div>
                <span className="text-2xl font-bold text-dark-900">{stats.vehicles}</span>
              </div>
              <h3 className="text-sm font-medium text-dark-600">My Vehicles</h3>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl border border-dark-200"
            >
              <div className="p-6 border-b border-dark-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-dark-900">Recent Requests</h3>
                <Link to="/user/requests" className="text-sm font-medium text-primary-600">View all</Link>
              </div>
              <div className="divide-y divide-dark-200">
                {loadingRequests ? (
                  <div className="p-6 text-sm text-dark-600">Loading requests...</div>
                ) : requests.length === 0 ? (
                  <div className="p-6 text-sm text-dark-600">No requests yet. Create one from the emergency button.</div>
                ) : requests.map((request) => (
                  <div key={request._id} className="p-6 hover:bg-dark-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-dark-900">{request.issueCategory.replace(/_/g, ' ')}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${['PAID', 'CLOSED', 'SERVICE_COMPLETED'].includes(request.status) ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-dark-600">{request.garageId?.name || 'Garage pending'}</p>
                    <p className="text-xs text-dark-500 mt-1">{new Date(request.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl border border-dark-200"
            >
              <div className="p-6 border-b border-dark-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-dark-900">My Vehicles</h3>
                <button
                  onClick={openCreateModal}
                  className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  aria-label="Add vehicle"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {errorMessage && (
                <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="divide-y divide-dark-200">
                {loadingVehicles ? (
                  <div className="flex items-center justify-center p-8 text-sm text-dark-600">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading vehicles...
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="p-6 text-sm text-dark-600">
                    No vehicles saved yet. Add your first vehicle to get started.
                  </div>
                ) : (
                  vehicles.map((vehicle) => (
                    <div key={vehicle._id} className="p-6 hover:bg-dark-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Car className="w-6 h-6 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-medium text-dark-900">{vehicle.brand} {vehicle.vehicleModel}</h4>
                            <span className="px-3 py-1 bg-dark-100 text-dark-700 text-xs rounded-full">{vehicle.vehicleType}</span>
                          </div>
                          <p className="text-sm text-dark-600 mt-1">{vehicle.registrationNumber}</p>
                          <p className="text-xs text-dark-500 mt-2">{vehicle.fuelType} • {vehicle.manufacturingYear}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(vehicle)}
                            className="rounded-lg p-2 text-dark-600 hover:bg-dark-100"
                            aria-label={`Edit ${vehicle.brand}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void handleDeleteVehicle(vehicle._id)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            aria-label={`Delete ${vehicle.brand}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark-900">{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
              <button onClick={closeVehicleModal} className="rounded-lg p-2 text-dark-600 hover:bg-dark-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleVehicleSubmit} className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-dark-700">
                  Vehicle type
                  <select
                    value={vehicleForm.vehicleType}
                    onChange={(event) => setVehicleForm((prev) => ({ ...prev, vehicleType: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-dark-200 px-3 py-2 outline-none focus:border-primary-500"
                  >
                    {vehicleTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-medium text-dark-700">
                  Brand
                  <input
                    value={vehicleForm.brand}
                    onChange={(event) => setVehicleForm((prev) => ({ ...prev, brand: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-dark-200 px-3 py-2 outline-none focus:border-primary-500"
                    placeholder="Maruti"
                    required
                  />
                </label>

                <label className="text-sm font-medium text-dark-700">
                  Model
                  <input
                    value={vehicleForm.vehicleModel}
                    onChange={(event) => setVehicleForm((prev) => ({ ...prev, vehicleModel: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-dark-200 px-3 py-2 outline-none focus:border-primary-500"
                    placeholder="Swift"
                    required
                  />
                </label>

                <label className="text-sm font-medium text-dark-700">
                  Registration number
                  <input
                    value={vehicleForm.registrationNumber}
                    onChange={(event) => setVehicleForm((prev) => ({ ...prev, registrationNumber: event.target.value.toUpperCase() }))}
                    className="mt-1 w-full rounded-lg border border-dark-200 px-3 py-2 outline-none focus:border-primary-500"
                    placeholder="MH12AB1234"
                    required
                  />
                </label>

                <label className="text-sm font-medium text-dark-700">
                  Fuel type
                  <select
                    value={vehicleForm.fuelType}
                    onChange={(event) => setVehicleForm((prev) => ({ ...prev, fuelType: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-dark-200 px-3 py-2 outline-none focus:border-primary-500"
                    required
                  >
                    <option value="">Select fuel type</option>
                    {fuelTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-medium text-dark-700">
                  Manufacturing year
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={vehicleForm.manufacturingYear}
                    onChange={(event) => setVehicleForm((prev) => ({ ...prev, manufacturingYear: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-dark-200 px-3 py-2 outline-none focus:border-primary-500"
                    required
                  />
                </label>
              </div>

              <label className="text-sm font-medium text-dark-700">
                Notes
                <textarea
                  value={vehicleForm.notes}
                  onChange={(event) => setVehicleForm((prev) => ({ ...prev, notes: event.target.value }))}
                  className="mt-1 min-h-[90px] w-full rounded-lg border border-dark-200 px-3 py-2 outline-none focus:border-primary-500"
                  placeholder="Optional service notes"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeVehicleModal}
                  className="rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 hover:bg-dark-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVehicle}
                  className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submittingVehicle ? 'Saving...' : editingVehicle ? 'Save Changes' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
