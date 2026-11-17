/**
 * Shared shell for booking flow steps.
 * Shows step indicator, back button and wraps content in the dark theme.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import { useBooking, BookingStep } from '@/context/BookingContext';
import GarageMateNavLogo from '@/components/shared/GarageMateNavLogo';

const STEPS: { id: BookingStep; label: string }[] = [
  { id: 'location',     label: 'Location' },
  { id: 'garages',      label: 'Select Garage' },
  { id: 'details',      label: 'Details' },
  { id: 'summary',      label: 'Summary' },
  { id: 'payment',      label: 'Payment' },
  { id: 'confirmation', label: 'Confirmed' },
];

const STEP_NUMS: Record<BookingStep, number> = {
  location: 1, garages: 2, details: 3, summary: 4, payment: 5, confirmation: 6,
};

interface BookingShellProps {
  children: React.ReactNode;
  /** Override back navigation — default goes to previous step */
  onBack?: () => void;
  hideProgress?: boolean;
}

const BookingShell: React.FC<BookingShellProps> = ({ children, onBack, hideProgress }) => {
  const navigate = useNavigate();
  const { step, setStep } = useBooking();
  const current = STEP_NUMS[step] ?? 1;

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    const prev = STEPS[current - 2];
    if (prev) setStep(prev.id);
    else navigate('/user/dashboard');
  };

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen" style={{ background: '#0a0f1a' }}>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0f1a' }}>
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-4"
        style={{ background: '#0d1526', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <button onClick={handleBack}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}
            aria-label="Go back">
            <ArrowLeft className="w-4 h-4 text-slate-300" />
          </button>
          <GarageMateNavLogo />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <Zap className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-bold text-red-300 uppercase tracking-wider">Emergency</span>
        </div>
      </header>

      {/* Step progress bar */}
      {!hideProgress && (
        <div className="flex-shrink-0 px-5 py-3" style={{ background: '#0d1526', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            {STEPS.filter(s => s.id !== 'confirmation').map((s, i) => {
              const num = i + 1;
              const done = current > num;
              const active = current === num;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={done
                        ? { background: '#f97316', color: '#fff' }
                        : active
                          ? { background: 'rgba(249,115,22,0.20)', border: '2px solid #f97316', color: '#f97316' }
                          : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#64748b' }
                      }>
                      {done ? '✓' : num}
                    </div>
                    <span className={`text-2xs hidden sm:block font-medium ${active ? 'text-orange-400' : done ? 'text-slate-400' : 'text-slate-700'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < 4 && (
                    <div className="flex-1 h-px" style={{ background: done ? '#f97316' : 'rgba(255,255,255,0.08)' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default BookingShell;
