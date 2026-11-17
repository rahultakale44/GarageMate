/**
 * Emergency Booking Flow — entry point.
 * Wraps the BookingProvider and renders the correct step component.
 */
import React from 'react';
import { BookingProvider, useBooking } from '@/context/BookingContext';
import StepLocation from './StepLocation';
import StepGarages from './StepGarages';
import StepDetails from './StepDetails';
import StepSummary from './StepSummary';
import StepPayment from './StepPayment';
import StepConfirmation from './StepConfirmation';

const BookingStepRouter: React.FC = () => {
  const { step } = useBooking();

  switch (step) {
    case 'location':     return <StepLocation />;
    case 'garages':      return <StepGarages />;
    case 'details':      return <StepDetails />;
    case 'summary':      return <StepSummary />;
    case 'payment':      return <StepPayment />;
    case 'confirmation': return <StepConfirmation />;
    default:             return <StepLocation />;
  }
};

const BookingFlow: React.FC = () => (
  <BookingProvider>
    <BookingStepRouter />
  </BookingProvider>
);

export default BookingFlow;
