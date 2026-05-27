'use client';

import { useState, useEffect, type FocusEvent, type ReactNode } from 'react';
import {
  fromPhE164ToDisplay,
  parsePhPhoneInput,
  toPhE164,
  PH_PHONE_HINT,
} from '@/app/lib/ph-phone';

const PHFlag = () => (
  <svg viewBox="0 0 20 15" width="20" height="15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="20" height="7.5" fill="#0038A8" />
    <rect y="7.5" width="20" height="7.5" fill="#CE1126" />
    <polygon points="0,0 10,7.5 0,15" fill="white" />
    <circle cx="3.6" cy="7.5" r="1.2" fill="#FCD116" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
      const rad = (deg * Math.PI) / 180;
      return (
        <line
          key={deg}
          x1={3.6 + Math.cos(rad) * 1.3}
          y1={7.5 + Math.sin(rad) * 1.3}
          x2={3.6 + Math.cos(rad) * 1.9}
          y2={7.5 + Math.sin(rad) * 1.9}
          stroke="#FCD116"
          strokeWidth="0.35"
        />
      );
    })}
    <text x="1.5" y="4.2" fontSize="1.6" fill="#FCD116">
      ★
    </text>
    <text x="5.2" y="4.2" fontSize="1.6" fill="#FCD116">
      ★
    </text>
    <text x="3.3" y="13.2" fontSize="1.6" fill="#FCD116">
      ★
    </text>
  </svg>
);

type Accent = 'booking' | 'signup';

const accentStyles: Record<Accent, { border: string }> = {
  booking: { border: 'border-gray-300' },
  signup: { border: 'border-gray-300' },
};

export interface PhPhoneInputProps {
  id: string;
  label: ReactNode;
  valueE164: string;
  onChangeE164: (e164: string) => void;
  error?: string;
  hint?: string;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  accent?: Accent;
  labelClassName?: string;
  showHint?: boolean;
}

export function PhPhoneInput({
  id,
  label,
  valueE164,
  onChangeE164,
  error,
  hint = PH_PHONE_HINT,
  onBlur,
  accent = 'booking',
  labelClassName,
  showHint = true,
}: PhPhoneInputProps) {
  const [display, setDisplay] = useState(() => fromPhE164ToDisplay(valueE164));
  const styles = accentStyles[accent];

  useEffect(() => {
    setDisplay(fromPhE164ToDisplay(valueE164));
  }, [valueE164]);

  function handleInput(raw: string) {
    const formatted = parsePhPhoneInput(raw);
    setDisplay(formatted);
    onChangeE164(toPhE164(formatted));
  }

  const labelCls =
    labelClassName ??
    (accent === 'booking'
      ? 'block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase'
      : 'text-xs font-semibold text-gray-700');

  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <div
        className={`mt-0.5 flex items-stretch rounded-xl overflow-hidden border bg-white transition ${
          error ? 'border-red-400 bg-red-50' : styles.border
        }`}
      >
        <div
          className="flex items-center gap-1.5 px-3 bg-gray-50 border-r border-gray-200 shrink-0 select-none pointer-events-none"
          aria-hidden="true"
        >
          <PHFlag />
          <span className="text-sm font-medium text-gray-600">+63</span>
        </div>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          placeholder="917 123 4567"
          value={display}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={onBlur}
          aria-label={typeof label === 'string' ? label : 'Mobile number'}
          className={`flex-1 min-w-0 px-3 py-2.5 outline-none text-black placeholder:text-gray-300 bg-transparent text-sm rounded-r-xl focus:ring-2 focus:ring-inset ${
            error
              ? 'focus:ring-red-200'
              : accent === 'signup'
                ? 'focus:ring-[#558B2F]/25'
                : 'focus:ring-[#74C00F]/25'
          }`}
          autoComplete="tel-national"
          maxLength={13}
        />
      </div>
      {showHint && !error && (
        <p className="mt-1 text-[11px] text-gray-400">{hint}</p>
      )}
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}
