import { useEffect, useState } from 'react';
import { Car, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import UserPageLayout from '@/components/layout/UserPageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';

interface VehicleRecord {
  _id: string; vehicleType: string; brand: string; vehicleModel: string;
  registrationNumber: string; fuelType: string; manufacturingYear: number; notes?: string;
}
interface VehicleFormState {
  vehicleType: string; brand: string; vehicleModel: string; registrationNumber: string;
  fuelType: string; manufacturingYear: string; notes: string;
}

const defaultVehicleForm = (): VehicleFormState => ({
  vehicleType: 'CAR', brand: '', vehicleModel: '', registrationNumber: '',
  fuelType: '', manufacturingYear: new Date().getFullYear().toString(), notes: '',
});

const vehicleTypeOptions = ['BIKE', 'SCOOTER', 'CAR', 'SUV', 'VAN', 'OTHER'];
const fuelTypeOptions = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];

const fuelColors: Record<string, string> = {
  Petrol: 'bg-blue-50 text-blue-700', Diesel: 'bg-yellow-50 text-yellow-700',
  CNG: 'bg-green-50 text-green-700', Electric: 'bg-purple-50 text-purple-700',
  Hybrid: 'bg-teal-50 text-teal-700',
};

const MyVehiclesPage = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleRecord | null>(null);
  const [form, setForm] = useState<VehicleFormState>(defaultVehicleForm());

  const fetchVehicles = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.VEHICLES.LIST);
      setVehicles(res.data?.data || []);
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to load vehicles'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchVehicles(); }, [user?._id]);

  const openCreate = () => { setEditingVehicle(null); setForm(defaultVehicleForm()); setErrorMessage(null); setModalOpen(true); };
  const openEdit = (v: VehicleRecord) => {
    setEditingVehicle(v);
    setForm({ vehicleType: v.vehicleType, brand: v.brand, vehicleModel: v.vehicleModel, registrationNumber: v.registrationNumber, fuelType: v.fuelType, manufacturingYear: String(v.manufacturingYear), notes: v.notes || '' });
    setErrorMessage(null);
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingVehicle(null); setForm(defaultVehicleForm()); setErrorMessage(null); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = { ...form, manufacturingYear: Number(form.manufacturingYear) };
      if (editingVehicle) {
        const res = await axiosInstance.patch(API_ENDPOINTS.VEHICLES.UPDATE(editingVehicle._id), payload);
        setVehicles((p) => p.map((v) => v._id === editingVehicle._id ? res.data.data : v));
      } else {
        const res = await axiosInstance.post(API_ENDPOINTS.VEHICLES.CREATE, payload);
        setVehicles((p) => [res.data.data, ...p]);
      }
      closeModal();
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to save vehicle'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!window.confirm('Remove this vehicle from your profile?')) return;
    try {
      await axiosInstance.delete(API_ENDPOINTS.VEHICLES.DELETE(vehicleId));
      setVehicles((p) => p.filter((v) => v._id !== vehicleId));
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to delete vehicle'); }
  };

  const headerActions = (
    <button onClick={openCreate} className="btn-primary text-sm">
      <Plus className="w-4 h-4" /> Add Vehicle
    </button>
  );

  return (
    <UserPageLayout title="My Vehicles" subtitle="Manage your vehicles for emergency assistance requests" headerActions={headerActions}>
      {errorMessage && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between gap-3">
          {errorMessage}
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading vehicles…
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState icon={<Car className="w-7 h-7" />} title="No vehicles yet"
          description="Add your first vehicle to start requesting emergency assistance."
          action={<button onClick={openCreate} className="btn-primary text-sm">Add Vehicle</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((v) => (
            <div key={v._id} className="card p-5 hover:border-orange-200 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                  <Car className="w-5 h-5 text-orange-500" />
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{v.vehicleType}</span>
              </div>

              <h3 className="text-base font-semibold text-slate-900 mb-0.5">{v.brand} {v.vehicleModel}</h3>
              <p className="text-sm text-slate-500 mb-3">{v.registrationNumber}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${fuelColors[v.fuelType] ?? 'bg-slate-100 text-slate-600'}`}>
                    {v.fuelType || '—'}
                  </span>
                  <span className="text-xs text-slate-400">{v.manufacturingYear}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(v)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" aria-label="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => void handleDelete(v._id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" aria-label="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {v.notes && <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 italic">{v.notes}</p>}
            </div>
          ))}

          {/* Add another card */}
          <button onClick={openCreate}
            className="card p-5 border-dashed flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50/30 transition-all min-h-[160px]">
            <div className="w-11 h-11 border-2 border-dashed border-current rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Add Another Vehicle</span>
          </button>
        </div>
      )}

      {/* Vehicle Modal */}
      <Modal open={modalOpen} onClose={closeModal}
        title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
        description={editingVehicle ? 'Update your vehicle information.' : 'Add a new vehicle to your profile.'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{errorMessage}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Vehicle Type</label>
              <select value={form.vehicleType} onChange={(e) => setForm((p) => ({ ...p, vehicleType: e.target.value }))}
                className="input-field text-sm">
                {vehicleTypeOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Fuel Type</label>
              <select value={form.fuelType} onChange={(e) => setForm((p) => ({ ...p, fuelType: e.target.value }))}
                className="input-field text-sm">
                <option value="">Select</option>
                {fuelTypeOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Brand</label>
              <input value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                className="input-field text-sm" placeholder="e.g. Honda" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Model</label>
              <input value={form.vehicleModel} onChange={(e) => setForm((p) => ({ ...p, vehicleModel: e.target.value }))}
                className="input-field text-sm" placeholder="e.g. City" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Registration No.</label>
              <input value={form.registrationNumber} onChange={(e) => setForm((p) => ({ ...p, registrationNumber: e.target.value }))}
                className="input-field text-sm" placeholder="MH12AB1234" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Year</label>
              <input type="number" value={form.manufacturingYear}
                onChange={(e) => setForm((p) => ({ ...p, manufacturingYear: e.target.value }))}
                className="input-field text-sm" min={1990} max={new Date().getFullYear()} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Notes (optional)</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="input-field text-sm resize-none" rows={2} placeholder="Any specific notes about this vehicle" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1 text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 text-sm">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </UserPageLayout>
  );
};

export default MyVehiclesPage;
