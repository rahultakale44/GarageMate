import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Camera, Loader2, MapPin, Plus, X, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import { useLocation as useUserLocation } from '@/hooks/useLocation';

interface VehicleRecord {
  _id: string;
  vehicleType: string;
  brand: string;
  vehicleModel: string;
  registrationNumber: string;
}

const issueCategoryOptions = [
  { value: 'TYRE_PUNCTURE', label: 'Tyre Puncture' },
  { value: 'DEAD_BATTERY', label: 'Dead Battery' },
  { value: 'VEHICLE_NOT_STARTING', label: 'Vehicle Not Starting' },
  { value: 'FUEL_SHORTAGE', label: 'Fuel Shortage' },
  { value: 'ENGINE_OVERHEATING', label: 'Engine Overheating' },
  { value: 'BRAKE_ISSUE', label: 'Brake Issue' },
  { value: 'ELECTRICAL_ISSUE', label: 'Electrical Issue' },
  { value: 'MINOR_MECHANICAL', label: 'Minor Mechanical' },
  { value: 'TOWING_REQUIRED', label: 'Towing Required' },
  { value: 'OTHER', label: 'Other' },
];

const urgencyOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

const bookingFee = 99;

const EmergencyRequestPage = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { user } = useAuth();
  const { location: savedLocation, requestLocation, loading: locationHookLoading } = useUserLocation();
  
  // Get prefilled data from location state
  const locationState = routerLocation.state as {
    selectedGarageId?: string;
    selectedGarageName?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    selectedService?: string;
    selectedVehicleId?: string;
  } | null;

  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(locationState?.selectedVehicleId || '');
  const [selectedGarageId, setSelectedGarageId] = useState(locationState?.selectedGarageId || '');
  const [selectedGarageName, setSelectedGarageName] = useState(locationState?.selectedGarageName || '');
  const [issueCategory, setIssueCategory] = useState(locationState?.selectedService || 'TYRE_PUNCTURE');
  const [issueDescription, setIssueDescription] = useState('');
  const [urgency, setUrgency] = useState('HIGH');
  const [address, setAddress] = useState(
    locationState?.address || savedLocation?.address || ''
  );
  const [latitude, setLatitude] = useState(
    locationState?.latitude?.toString() || savedLocation?.latitude.toString() || ''
  );
  const [longitude, setLongitude] = useState(
    locationState?.longitude?.toString() || savedLocation?.longitude.toString() || ''
  );
  const [images, setImages] = useState<string[]>([]);
  const [addressLookupLoading, setAddressLookupLoading] = useState(false);
  const [addressLookupError, setAddressLookupError] = useState<string | null>(null);
  
  // Quick vehicle addition modal
  const [showQuickVehicleModal, setShowQuickVehicleModal] = useState(false);
  const [quickVehicleData, setQuickVehicleData] = useState({
    vehicleType: 'CAR',
    brand: '',
    vehicleModel: '',
    registrationNumber: '',
    fuelType: 'Petrol',
    isTemporary: false,
  });
  const [savingQuickVehicle, setSavingQuickVehicle] = useState(false);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user) {
        return;
      }

      setLoadingVehicles(true);
      try {
        const response = await axiosInstance.get(API_ENDPOINTS.VEHICLES.LIST);
        const vehicleList = response.data?.data || [];
        setVehicles(vehicleList);
        
        // Set first vehicle if not already prefilled
        if (!selectedVehicleId && vehicleList[0]) {
          setSelectedVehicleId(vehicleList[0]._id);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load vehicles');
      } finally {
        setLoadingVehicles(false);
      }
    };

    void fetchVehicles();
  }, [user]);

  const handleLocationDetect = async () => {
    setAddressLookupLoading(true);
    setAddressLookupError(null);
    
    const success = await requestLocation();
    
    if (success && savedLocation) {
      setLatitude(savedLocation.latitude.toString());
      setLongitude(savedLocation.longitude.toString());
      
      // Set address if available, otherwise show coordinates
      if (savedLocation.address) {
        setAddress(savedLocation.address);
      } else {
        setAddress(`${savedLocation.latitude.toFixed(5)}, ${savedLocation.longitude.toFixed(5)}`);
        setAddressLookupError('Location detected but address lookup failed. You can edit the address manually.');
      }
    }
    
    setAddressLookupLoading(false);
  };

  const handleRetryAddressLookup = async () => {
    if (!latitude || !longitude) {
      setAddressLookupError('Please enter coordinates first.');
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setAddressLookupError('Invalid coordinates.');
      return;
    }

    setAddressLookupLoading(true);
    setAddressLookupError(null);

    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GARAGES.REVERSE_GEOCODE, {
        params: { latitude: lat, longitude: lng },
      });

      const data = response.data?.data;
      if (data?.displayName || data?.address) {
        setAddress(data.displayName || data.address);
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setAddressLookupError('Address not found. Please enter manually.');
      }
    } catch (error) {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setAddressLookupError('Address lookup failed. You can enter the address manually.');
    } finally {
      setAddressLookupLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    const previews: string[] = [];
    for (const file of files) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Could not read image'));
        reader.readAsDataURL(file);
      });
      previews.push(dataUrl);
    }

    setImages((prev) => [...prev, ...previews].slice(0, 4));
  };

  const removeImage = (imageToRemove: string) => {
    setImages((prev) => prev.filter((image) => image !== imageToRemove));
  };

  const clearSelectedGarage = () => {
    setSelectedGarageId('');
    setSelectedGarageName('');
  };
  
  const handleQuickVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!quickVehicleData.vehicleType) {
      setErrorMessage('Please select a vehicle type');
      return;
    }
    
    if (!quickVehicleData.isTemporary) {
      // For permanent vehicles, require all fields
      if (!quickVehicleData.brand || !quickVehicleData.vehicleModel || !quickVehicleData.registrationNumber) {
        setErrorMessage('Please fill all vehicle details or use temporary vehicle option');
        return;
      }
    } else {
      // For temporary vehicles, only type is required
      if (!quickVehicleData.vehicleType) {
        setErrorMessage('Please select a vehicle type');
        return;
      }
    }
    
    setSavingQuickVehicle(true);
    setErrorMessage(null);
    
    try {
      const payload: any = {
        vehicleType: quickVehicleData.vehicleType,
        brand: quickVehicleData.brand || 'Temporary',
        vehicleModel: quickVehicleData.vehicleModel || 'Unknown',
        registrationNumber: quickVehicleData.registrationNumber || `TEMP-${Date.now()}`,
        fuelType: quickVehicleData.fuelType,
        manufacturingYear: new Date().getFullYear(),
        notes: quickVehicleData.isTemporary ? 'Emergency temporary vehicle' : undefined,
      };
      
      const response = await axiosInstance.post(API_ENDPOINTS.VEHICLES.CREATE, payload);
      const newVehicle = response.data?.data;
      
      // Add to vehicles list and select it
      setVehicles((prev) => [newVehicle, ...prev]);
      setSelectedVehicleId(newVehicle._id);
      
      // Close modal and reset form
      setShowQuickVehicleModal(false);
      setQuickVehicleData({
        vehicleType: 'CAR',
        brand: '',
        vehicleModel: '',
        registrationNumber: '',
        fuelType: 'Petrol',
        isTemporary: false,
      });
      
      setSuccessMessage('Vehicle added successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setSavingQuickVehicle(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedVehicleId || !issueDescription.trim() || !address.trim() || !latitude || !longitude) {
      setErrorMessage('Please select a vehicle, describe the issue, and provide the location details.');
      return;
    }

    // Validate coordinates
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setErrorMessage('Invalid coordinates. Please check your location.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload: any = {
        vehicleId: selectedVehicleId,
        issueCategory,
        issueDescription: issueDescription.trim(),
        issueImages: images,
        latitude: lat,
        longitude: lng,
        address: address.trim(),
        urgency,
      };

      // Include selected garage if provided
      if (selectedGarageId) {
        payload.garageId = selectedGarageId;
      }

      await axiosInstance.post(API_ENDPOINTS.REQUESTS.CREATE, payload);

      setSuccessMessage('Request created successfully.');
      
      // Navigate to requests page after a brief delay
      setTimeout(() => {
        navigate('/user/requests');
      }, 1500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = useMemo(
    () => Boolean(selectedVehicleId && issueDescription.trim() && address.trim() && latitude && longitude),
    [address, issueDescription, latitude, longitude, selectedVehicleId]
  );

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ background: '#0a0f1a' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/user/dashboard"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <ArrowLeft className="h-4 w-4 text-slate-300" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Emergency Assistance</h1>
            <p className="text-sm text-slate-500">Create a roadside assistance request for your vehicle</p>
          </div>
        </div>

        {/* Selected Garage Banner */}
        {selectedGarageName && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.25)' }}>
            <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-orange-300 mb-1">Requesting help from {selectedGarageName}</h3>
              <p className="text-xs text-orange-400/70">This garage will be notified once you submit the request.</p>
            </div>
            <button type="button" onClick={clearSelectedGarage}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold whitespace-nowrap">Clear</button>
          </motion.div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm text-red-400"
            style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>{errorMessage}</div>
        )}
        {successMessage && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm text-green-400"
            style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.20)' }}>{successMessage}</div>
        )}

        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">

          {/* Left — Request Details */}
          <div className="space-y-5 rounded-2xl p-6"
            style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <h2 className="text-base font-bold text-white">Request Details</h2>
            </div>

            {/* Vehicle select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Select Vehicle</label>
                <button type="button" onClick={() => setShowQuickVehicleModal(true)}
                  className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors">
                  <Plus className="w-3 h-3" /> Add Vehicle Quickly
                </button>
              </div>
              {loadingVehicles ? (
                <div className="rounded-lg px-3 py-3 text-sm text-slate-500"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Loading vehicles...
                </div>
              ) : vehicles.length === 0 ? (
                <div className="space-y-2">
                  <div className="rounded-lg px-3 py-3 text-xs text-yellow-400"
                    style={{ background: 'rgba(234,179,8,0.10)', border: '1px solid rgba(234,179,8,0.20)' }}>
                    No vehicles found. Add a vehicle to continue.
                  </div>
                  <button type="button" onClick={() => setShowQuickVehicleModal(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-orange-400 transition-colors"
                    style={{ border: '1px solid rgba(249,115,22,0.25)' }}>
                    <Plus className="w-4 h-4" /> Add Vehicle Now
                  </button>
                </div>
              ) : (
                <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-white"
                  style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)' }} required>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>{v.brand} {v.vehicleModel} • {v.registrationNumber}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Issue + Urgency */}
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: 'Issue Category', value: issueCategory, setter: setIssueCategory, options: issueCategoryOptions },
                { label: 'Urgency', value: urgency, setter: setUrgency, options: urgencyOptions },
              ].map(({ label, value, setter, options }) => (
                <div key={label} className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
                  <select value={value} onChange={(e) => setter(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white"
                    style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)' }}>
                    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Issue Description</label>
              <textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} rows={5}
                placeholder="Describe what happened, where you are, and any visible symptoms."
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 resize-none focus:outline-none transition-all"
                style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)' }} required />
            </div>

            {/* Images */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Issue Images (Optional)</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-4 text-sm text-slate-500 transition-colors hover:border-orange-500/30"
                style={{ border: '2px dashed rgba(255,255,255,0.10)' }}>
                <Camera className="h-4 w-4" /> Upload photos
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((image, idx) => (
                    <div key={idx} className="relative overflow-hidden rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                      <img src={image} alt={`Issue ${idx + 1}`} className="h-24 w-full object-cover" />
                      <button type="button" onClick={() => removeImage(image)}
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right — Location + Booking */}
          <div className="space-y-5">
            {/* Location */}
            <div className="rounded-2xl p-6"
              style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-orange-400" />
                <h2 className="text-base font-bold text-white">Location</h2>
              </div>
              <button type="button" onClick={handleLocationDetect}
                disabled={locationHookLoading || addressLookupLoading}
                className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 mb-4"
                style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.30)' }}>
                {locationHookLoading || addressLookupLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                    {locationHookLoading ? 'Detecting…' : 'Looking up address…'}
                  </span>
                ) : (
                  <span className="text-orange-300">Use my current location</span>
                )}
              </button>

              {addressLookupError && (
                <div className="mb-4 p-3 rounded-lg text-xs" style={{ background: 'rgba(234,179,8,0.10)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.20)' }}>
                  {addressLookupError}
                  <button type="button" onClick={handleRetryAddressLookup} disabled={addressLookupLoading}
                    className="ml-2 underline">Retry</button>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 mb-4">
                {[
                  { label: 'Latitude', value: latitude, setter: setLatitude, placeholder: '18.5204' },
                  { label: 'Longitude', value: longitude, setter: setLongitude, placeholder: '73.8567' },
                ].map(({ label, value, setter, placeholder }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
                    <input type="number" step="any" value={value} onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
                      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)' }} required />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 14, MG Road, Pune"
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
                  style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)' }} required />
              </div>
            </div>

            {/* Booking Summary */}
            <div className="rounded-2xl p-6"
              style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
              <h2 className="text-base font-bold text-white mb-4">Booking Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Demo booking fee</span>
                  <span className="font-bold text-white">₹{bookingFee}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Service platform fee</span>
                  <span className="text-slate-400">Included</span>
                </div>
                {selectedGarageName && (
                  <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-xs text-slate-400">
                      Request sent to <span className="font-semibold text-white">{selectedGarageName}</span>
                    </p>
                  </div>
                )}
                <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(59,130,246,0.10)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.20)' }}>
                  <p className="font-semibold mb-1">ℹ️ Demo Mode</p>
                  <p>{selectedGarageName ? 'No actual payment processed.' : 'Eligible garages will be notified.'}</p>
                </div>
              </div>
              <button type="submit" disabled={!canSubmit || submitting || vehicles.length === 0}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: canSubmit && !submitting ? '#f97316' : 'rgba(249,115,22,0.4)', boxShadow: canSubmit && !submitting ? '0 4px 14px rgba(249,115,22,0.35)' : 'none' }}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                  : <><Plus className="h-4 w-4" /> Submit Assistance Request</>}
              </button>
            </div>
          </div>
        </motion.form>

        {/* Quick Vehicle Modal */}
        {showQuickVehicleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-white">Add Vehicle Quickly</h3>
                <button onClick={() => setShowQuickVehicleModal(false)}
                  className="rounded-lg p-2 text-slate-400 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleQuickVehicleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-300">
                    <input type="checkbox" checked={quickVehicleData.isTemporary}
                      onChange={(e) => setQuickVehicleData(prev => ({ ...prev, isTemporary: e.target.checked }))}
                      className="rounded accent-orange-500" />
                    This is a temporary/rented vehicle
                  </label>
                  {quickVehicleData.isTemporary && (
                    <p className="text-xs text-slate-500 ml-6">Only vehicle type is required for temporary vehicles</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Vehicle Type *</label>
                  <select value={quickVehicleData.vehicleType}
                    onChange={(e) => setQuickVehicleData(prev => ({ ...prev, vehicleType: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white"
                    style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)' }} required>
                    {['BIKE', 'SCOOTER', 'CAR', 'SUV', 'VAN', 'OTHER'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                {!quickVehicleData.isTemporary && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Brand *</label>
                        <input type="text" value={quickVehicleData.brand}
                          onChange={(e) => setQuickVehicleData(prev => ({ ...prev, brand: e.target.value }))}
                          placeholder="e.g. Maruti"
                          className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                          style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)' }}
                          required={!quickVehicleData.isTemporary} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Model *</label>
                        <input type="text" value={quickVehicleData.vehicleModel}
                          onChange={(e) => setQuickVehicleData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                          placeholder="e.g. Swift"
                          className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                          style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)' }}
                          required={!quickVehicleData.isTemporary} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Registration Number *</label>
                      <input type="text" value={quickVehicleData.registrationNumber}
                        onChange={(e) => setQuickVehicleData(prev => ({ ...prev, registrationNumber: e.target.value.toUpperCase() }))}
                        placeholder="e.g. MH12AB1234"
                        className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none uppercase"
                        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)' }}
                        required={!quickVehicleData.isTemporary} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Fuel Type *</label>
                      <select value={quickVehicleData.fuelType}
                        onChange={(e) => setQuickVehicleData(prev => ({ ...prev, fuelType: e.target.value }))}
                        className="w-full rounded-lg px-3 py-2.5 text-sm text-white"
                        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)' }}
                        required={!quickVehicleData.isTemporary}>
                        {['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map((f) => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                  </>
                )}
                
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowQuickVehicleModal(false)}
                    className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={savingQuickVehicle}
                    className="flex-1 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
                    {savingQuickVehicle ? 'Adding…' : 'Add Vehicle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyRequestPage;
