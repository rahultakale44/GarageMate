/**
 * BookingContext — multi-step emergency booking flow state.
 * Preserves selections across all steps. Backend is source of truth
 * for payment status; this context only holds transient UI state.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

export type BookingStep =
  | 'location'       // Step 1 — share location
  | 'garages'        // Step 2 — pick a garage
  | 'details'        // Step 3 — vehicle + issue
  | 'summary'        // Step 4 — booking summary + confirm
  | 'payment'        // Step 5 — pay ₹99
  | 'confirmation';  // Step 6 — success screen

export interface BookingLocation {
  latitude: number;
  longitude: number;
  address: string;
  locality?: string;
  city?: string;
}

export interface BookingGarage {
  _id: string;
  name: string;
  phone?: string;
  address: string;
  distance?: number;
  rating?: number;
  reviewCount?: number;
  isAvailable?: boolean;
  visitingCharge?: number;
  services?: string[];
}

export interface BookingDetails {
  vehicleId: string;
  vehicleName: string;    // display only
  issueCategory: string;
  issueDescription: string;
  issueImages: string[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface BookingConfirmation {
  requestId: string;
  paymentId: string;
  paymentRef: string;
  amount: number;
  isDemoPayment: boolean;
  garageName: string;
  garagePhone?: string;
  vehicleName: string;
  issueCategory: string;
  address: string;
}

interface BookingState {
  step: BookingStep;
  location: BookingLocation | null;
  garage: BookingGarage | null;
  details: BookingDetails | null;
  confirmation: BookingConfirmation | null;
  // Transient IDs after request creation
  draftRequestId: string | null;
  demoOrderId: string | null;
  demoPaymentDbId: string | null;
}

interface BookingContextValue extends BookingState {
  setStep: (step: BookingStep) => void;
  setLocation: (loc: BookingLocation) => void;
  setGarage: (garage: BookingGarage) => void;
  setDetails: (details: BookingDetails) => void;
  setConfirmation: (conf: BookingConfirmation) => void;
  setDraftRequestId: (id: string) => void;
  setDemoOrder: (orderId: string, paymentDbId: string) => void;
  reset: () => void;
}

const initialState: BookingState = {
  step: 'location',
  location: null,
  garage: null,
  details: null,
  confirmation: null,
  draftRequestId: null,
  demoOrderId: null,
  demoPaymentDbId: null,
};

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BookingState>(initialState);

  const setStep = useCallback((step: BookingStep) =>
    setState(p => ({ ...p, step })), []);

  const setLocation = useCallback((location: BookingLocation) =>
    setState(p => ({ ...p, location })), []);

  const setGarage = useCallback((garage: BookingGarage) =>
    setState(p => ({ ...p, garage })), []);

  const setDetails = useCallback((details: BookingDetails) =>
    setState(p => ({ ...p, details })), []);

  const setConfirmation = useCallback((confirmation: BookingConfirmation) =>
    setState(p => ({ ...p, confirmation })), []);

  const setDraftRequestId = useCallback((id: string) =>
    setState(p => ({ ...p, draftRequestId: id })), []);

  const setDemoOrder = useCallback((orderId: string, paymentDbId: string) =>
    setState(p => ({ ...p, demoOrderId: orderId, demoPaymentDbId: paymentDbId })), []);

  const reset = useCallback(() => setState(initialState), []);

  return (
    <BookingContext.Provider value={{ ...state, setStep, setLocation, setGarage, setDetails, setConfirmation, setDraftRequestId, setDemoOrder, reset }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider');
  return ctx;
};
