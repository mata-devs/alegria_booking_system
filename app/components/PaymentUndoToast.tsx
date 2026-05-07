'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle } from 'lucide-react';

const UNDO_DURATION = 8000;

interface PaymentUndoToastProps {
  bookingLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PaymentUndoToast({
  bookingLabel,
  onConfirm,
  onCancel,
}: PaymentUndoToastProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onConfirmRef = useRef(onConfirm);
  const onCancelRef = useRef(onCancel);
  const didActRef = useRef(false);

  useEffect(() => { onConfirmRef.current = onConfirm; }, [onConfirm]);
  useEffect(() => { onCancelRef.current = onCancel; }, [onCancel]);

  useEffect(() => {
    // animate in next frame
    const raf = requestAnimationFrame(() => setVisible(true));

    timerRef.current = setTimeout(() => {
      didActRef.current = true;
      onConfirmRef.current();
    }, UNDO_DURATION);

    return () => {
      cancelAnimationFrame(raf);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCancel = () => {
    if (didActRef.current) return;
    didActRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
    setTimeout(() => onCancelRef.current(), 300);
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-[200] w-80 -translate-x-1/2 rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10 ring-1 ring-gray-900/5 overflow-hidden transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <CheckCircle className="h-5 w-5 shrink-0 text-[#558B2F]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Payment marked as Paid</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Booking{' '}
            <span className="font-mono font-medium text-gray-700">{bookingLabel}</span>
            {' '}— confirmation email sends in {UNDO_DURATION / 1000}s.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-[#558B2F] origin-left"
          style={{
            animation: visible
              ? `payment-undo-progress ${UNDO_DURATION}ms linear forwards`
              : 'none',
          }}
        />
      </div>
      <style>{`
        @keyframes payment-undo-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
