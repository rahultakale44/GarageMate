import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className = '',
}) => {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-modal animate-slide-up max-h-[90vh] flex flex-col ${className}`}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 flex-shrink-0">
            <div>
              {title && (
                <h2 id="modal-title" className="text-base font-semibold text-slate-900">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
};

// ── Confirm Dialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) => (
  <Modal open={open} onClose={onClose} size="sm">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-1.5">{description}</p>}
      </div>
      <div className="flex gap-3 pt-2">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading}
          fullWidth
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          loading={loading}
          fullWidth
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
);
