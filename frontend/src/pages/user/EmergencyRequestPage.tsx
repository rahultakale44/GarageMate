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
    <div className="min-h-screen bg-dark-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/user/dashboard" className="rounded-full bg-white p-2 shadow-sm hover:bg-dark-50 transition-colors">
            <ArrowLeft className="h-5 w-5 text-dark-700" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-dark-900">Emergency Assistance</h1>
            <p className="text-sm text-dark-600">Create a roadside assistance request for your vehicle</p>
          </div>
        </div>

        {/* Selected Garage Banner */}
        {selectedGarageName && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-primary-200 bg-primary-50 p-4 flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-primary-900 mb-1">
                Requesting help from {selectedGarageName}
              </h3>
              <p className="text-xs text-primary-700">
                This garage will be notified once you submit the request. You can change or clear the selection below.
              </p>
            </div>
            <button
              type="button"
              onClick={clearSelectedGarage}
              className="text-xs text-primary-700 hover:text-primary-900 font-medium whitespace-nowrap"
            >
              Clear
            </button>
          </motion.div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]"
        >
          <div className="space-y-6 rounded-2xl border border-dark-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <h2 className="text-lg font-semibold text-dark-900">Request Details</h2>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-700">Select Vehicle</label>
              {loadingVehicles ? (
                <div className="rounded-lg border border-dark-200 bg-dark-50 px-3 py-3 text-sm text-dark-600">
                  Loading vehicles...
                </div>
              ) : vehicles.length === 0 ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                  No vehicles found. Please add a vehicle first.
                </div>
              ) : (
                <select
                  value={selectedVehicleId}
                  onChange={(event) => setSelectedVehicleId(event.target.value)}
                  className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900"
                  required
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.brand} {vehicle.vehicleModel} • {vehicle.registrationNumber}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-700">Issue Category</label>
                <select
                  value={issueCategory}
                  onChange={(event) => setIssueCategory(event.target.value)}
                  className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900"
                >
                  {issueCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-700">Urgency</label>
                <select
                  value={urgency}
                  onChange={(event) => setUrgency(event.target.value)}
                  className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900"
                >
                  {urgencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-700">Issue Description</label>
              <textarea
                value={issueDescription}
                onChange={(event) => setIssueDescription(event.target.value)}
                rows={5}
                placeholder="Describe what happened, where you are, and any visible symptoms."
                className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-700">Issue Images (Optional)</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-dark-300 bg-dark-50 px-3 py-4 text-sm text-dark-600 hover:bg-dark-100 transition-colors">
                <Camera className="h-4 w-4" />
                Upload photos
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((image, idx) => (
                    <div key={idx} className="relative overflow-hidden rounded-lg border border-dark-200">
                      <img src={image} alt={`Issue preview ${idx + 1}`} className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(image)}
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-black transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-dark-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-primary-600 mb-4">
                <MapPin className="h-5 w-5" />
                <h2 className="text-lg font-semibold text-dark-900">Location</h2>
              </div>
              
              <button
                type="button"
                onClick={handleLocationDetect}
                disabled={locationHookLoading || addressLookupLoading}
                className="w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {locationHookLoading || addressLookupLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {locationHookLoading ? 'Detecting location…' : 'Looking up address…'}
                  </span>
                ) : (
                  'Use my current location'
                )}
              </button>
              
              {addressLookupError && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 mb-2">{addressLookupError}</p>
                  <button
                    type="button"
                    onClick={handleRetryAddressLookup}
                    disabled={addressLookupLoading}
                    className="text-xs text-yellow-700 hover:text-yellow-900 font-medium underline"
                  >
                    Retry address lookup
                  </button>
                </div>
              )}
              
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark-700">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(event) => setLatitude(event.target.value)}
                    className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900"
                    placeholder="18.5204"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark-700">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(event) => setLongitude(event.target.value)}
                    className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900"
                    placeholder="73.8567"
                    required
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium text-dark-700">Address</label>
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="e.g. 14, MG Road, Pune"
                  className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900"
                  required
                />
              </div>
            </div>

            <div className="rounded-2xl border border-dark-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Booking Summary</h2>
              <div className="space-y-3 text-sm text-dark-600">
                <div className="flex items-center justify-between">
                  <span>Booking fee</span>
                  <span className="font-semibold text-dark-900">₹{bookingFee}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Service platform fee</span>
                  <span>Included</span>
                </div>
                {selectedGarageName && (
                  <div className="pt-3 border-t border-dark-200">
                    <p className="text-xs text-dark-600">
                      Your request will be sent to <span className="font-medium text-dark-900">{selectedGarageName}</span>
                    </p>
                  </div>
                )}
                <div className="rounded-lg border border-dark-200 bg-dark-50 px-3 py-3 text-xs text-dark-500">
                  {selectedGarageName 
                    ? 'The selected garage will be notified. Mechanic assignment will be confirmed after acceptance.'
                    : 'Garage and mechanic assignments will be confirmed after the request is submitted.'}
                </div>
              </div>
              <button
                type="submit"
                disabled={!canSubmit || submitting || vehicles.length === 0}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-3 font-semibold text-white hover:bg-primary-600 transition-colors disabled:cursor-not-allowed disabled:bg-primary-300"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Submit Assistance Request
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default EmergencyRequestPage;
