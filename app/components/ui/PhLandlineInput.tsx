'use client';

import { useState, useEffect, type FocusEvent, type ReactNode } from 'react';
import {
  fromLandlineE164ToDisplay,
  parseLandlineInput,
  toLandlineE164,
  PH_LANDLINE_HINT,
} from '@/app/lib/ph-landline';

const PHFlag = () => (
  <svg viewBox="0 0 20 15" width="20" height="15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="20" height="7.5" fill="#0038A8" />
    <rect y="7.5" width="20" height="7.5" fill="#CE1126" />
    <polygon points="0,0 10,7.5 0,15" fill="white" />
    <circle cx="3.6" cy="7.5" r="1.2" fill="#FCD116" />
  </svg>
);

type Accent = 'signup';

const accentStyles: Record<Accent, { border: string }> = {
  signup: { border: 'border-gray-300' },
};

export interface PhLandlineInputProps {
  id: string;
  label: ReactNode;
  valueE164: string;
  onChangeE164: (e164: string) => void;
  error?: string;
  hint?: string;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  accent?: Accent;
  labelClassName?: string;
}

export function PhLandlineInput({
  id,
  label,
  valueE164,
  onChangeE164,
  error,
  hint = PH_LANDLINE_HINT,
  onBlur,
  accent = 'signup',
  labelClassName = 'text-xs font-semibold text-gray-700',
}: PhLandlineInputProps) {
  const [display, setDisplay] = useState(() => fromLandlineE164ToDisplay(valueE164));
  const styles = accentStyles[accent];

  useEffect(() => {
    setDisplay(fromLandlineE164ToDisplay(valueE164));
  }, [valueE164]);

  function handleInput(raw: string) {
    const formatted = parseLandlineInput(raw);
    setDisplay(formatted);
    onChangeE164(toLandlineE164(formatted));
  }

  const placeholder =
    display.startsWith('02') || valueE164.includes('+632')
      ? '02 8123 4567'
      : '034 433 1234';

  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
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
          inputMode="tel"
          placeholder={placeholder}
          value={display}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={onBlur}
          aria-label={typeof label === 'string' ? label : 'Telephone number'}
          className={`flex-1 min-w-0 px-3 py-2.5 outline-none text-black placeholder:text-gray-300 bg-transparent text-sm rounded-r-xl focus:ring-2 focus:ring-inset focus:ring-[#558B2F]/25 ${
            error ? 'focus:ring-red-200' : ''
          }`}
          autoComplete="tel"
          maxLength={14}
        />
      </div>
      {!error && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}
