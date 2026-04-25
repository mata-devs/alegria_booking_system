'use client';

import { KeyboardEvent } from 'react';

export type ToggleSwitchSize = 'sm' | 'md' | 'lg';

export interface ToggleSwitchProps {
  /** Current on/off state */
  checked: boolean;
  /** Called with the new state when the user toggles */
  onChange: (checked: boolean) => void;
  /** Disable interaction */
  disabled?: boolean;
  /** Visual size */
  size?: ToggleSwitchSize;
  /** Optional label rendered next to the switch */
  label?: string;
  /** Accessible label when no visible label is provided */
  ariaLabel?: string;
  /** Tailwind color class for the "on" track (default: bg-green-500) */
  onColor?: string;
  /** Tailwind color class for the "off" track (default: bg-gray-300) */
  offColor?: string;
  /** Extra class names for the wrapper */
  className?: string;
}

const SIZE_MAP: Record<ToggleSwitchSize, { track: string; thumb: string; translate: string }> = {
  sm: { track: 'h-4 w-7', thumb: 'h-3 w-3', translate: 'translate-x-3' },
  md: { track: 'h-5 w-9', thumb: 'h-4 w-4', translate: 'translate-x-4' },
  lg: { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: 'translate-x-5' },
};

/**
 * Reusable accessible toggle switch.
 * Inspired by https://medium.com/@divvyatripaathi/building-toggle-switch-using-react-typescript-styled-components-38b45f054ea0
 * but adapted to Tailwind CSS used in this project.
 */
export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  ariaLabel,
  onColor = 'bg-green-500',
  offColor = 'bg-gray-300',
  className = '',
}: ToggleSwitchProps) {
  const dims = SIZE_MAP[size];

  const toggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <label className={`inline-flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className={`relative inline-flex shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 ${
          dims.track
        } ${checked ? onColor : offColor} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            dims.thumb
          } ${checked ? dims.translate : 'translate-x-0'}`}
        />
      </button>
      {label && <span className="text-sm text-gray-700 select-none">{label}</span>}
    </label>
  );
}
