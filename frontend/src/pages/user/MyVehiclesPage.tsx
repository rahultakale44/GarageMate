import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ArrowLeft,
  AlertCircle,
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

const MyVehiclesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [submittingVehicle, setSubmittingVehicle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleRecord | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleFormState>(defaultVehicleForm());

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

  useEffect(() => {
    void fetchVehicles();
  }, [user?._id]);

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

  const getVehicleIcon = () => {
    // Return different icons based on vehicle type if needed
    return <Car className="w-8 h-8 text-primary-600" />;
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/user/dashboard')}
            className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-dark-900">My Vehicles</h1>
              <p className="text-dark-600 mt-2">Manage your vehicles for emergency assistance requests</p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Vehicle
            </button>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Vehicles Grid */}
        {loadingVehicles ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
            <p className="text-dark-600">Loading your vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-dark-200 p-12 text-center"
          >
            <div className="w-20 h-20 bg-dark-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="w-10 h-10 text-dark-400" />
            </div>
            <h3 className="text-xl font-semibold text-dark-900 mb-2">No vehicles added yet</h3>
            <p className="text-dark-600 mb-6">Add your first vehicle to start requesting emergency assistance</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Vehicle
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-dark-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center">
                    {getVehicleIcon()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(vehicle)}
                      className="p-2 text-dark-600 hover:bg-dark-100 rounded-lg transition-colors"
                      aria-label="Edit vehicle"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => void handleDeleteVehicle(vehicle._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete vehicle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-dark-900">
                      {vehicle.brand} {vehicle.vehicleModel}
                    </h3>
                    <p className="text-primary-600 font-medium text-lg mt-1">
                      {vehicle.registrationNumber}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                      {vehicle.vehicleType}
                    </span>
                    <span className="px-3 py-1 bg-dark-100 text-dark-700 text-xs font-medium rounded-full">
                      {vehicle.fuelType}
                    </span>
                    <span className="px-3 py-1 bg-dark-100 text-dark-700 text-xs font-medium rounded-full">
                      {vehicle.manufacturingYear}
                    </span>
                  </div>

                  {vehicle.notes && (
                    <p className="text-sm text-dark-600 mt-3 line-clamp-2">{vehicle.notes}</p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-dark-100">
                  <Link
                    to="/user/emergency"
                    state={{ selectedVehicleId: vehicle._id }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-dark-50 text-dark-900 rounded-lg font-medium hover:bg-dark-100 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Request Assistance
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Banner */}
        {vehicles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Quick Tip</h4>
                <p className="text-sm text-blue-700">
                  Keep your vehicle information up to date for faster emergency assistance. 
                  You can request help for any of your vehicles at any time.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Vehicle Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-dark-900">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h3>
              <button onClick={closeVehicleModal} className="p-2 hover:bg-dark-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleVehicleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-dark-700">Vehicle Type *</span>
                  <select
                    value={vehicleForm.vehicleType}
                    onChange={(e) => setVehicleForm((prev) => ({ ...prev, vehicleType: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-dark-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    required
                  >
                    {vehicleTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-dark-700">Brand *</span>
                  <input
                    type="text"
                    value={vehicleForm.brand}
                    onChange={(e) => setVehicleForm((prev) => ({ ...prev, brand: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-dark-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder="e.g. Maruti, Honda"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-dark-700">Model *</span>
                  <input
                    type="text"
                    value={vehicleForm.vehicleModel}
                    onChange={(e) => setVehicleForm((prev) => ({ ...prev, vehicleModel: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-dark-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder="e.g. Swift, Activa"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-dark-700">Registration Number *</span>
                  <input
                    type="text"
                    value={vehicleForm.registrationNumber}
                    onChange={(e) => setVehicleForm((prev) => ({ ...prev, registrationNumber: e.target.value.toUpperCase() }))}
                    className="mt-1 w-full rounded-lg border border-dark-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder="e.g. MH12AB1234"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-dark-700">Fuel Type *</span>
                  <select
                    value={vehicleForm.fuelType}
                    onChange={(e) => setVehicleForm((prev) => ({ ...prev, fuelType: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-dark-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    required
                  >
                    <option value="">Select fuel type</option>
                    {fuelTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-dark-700">Manufacturing Year *</span>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={vehicleForm.manufacturingYear}
                    onChange={(e) => setVehicleForm((prev) => ({ ...prev, manufacturingYear: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-dark-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-dark-700">Notes (Optional)</span>
                <textarea
                  value={vehicleForm.notes}
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 w-full min-h-[100px] rounded-lg border border-dark-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  placeholder="Any additional notes about your vehicle..."
                />
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeVehicleModal}
                  className="px-6 py-2 border border-dark-300 rounded-lg font-medium text-dark-700 hover:bg-dark-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVehicle}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                >
                  {submittingVehicle && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submittingVehicle ? 'Saving...' : editingVehicle ? 'Save Changes' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MyVehiclesPage;
