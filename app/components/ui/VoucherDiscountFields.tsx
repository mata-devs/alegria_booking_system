'use client'

import type { VoucherDiscountType } from '@/app/lib/voucher-discount'

type Props = {
  discountType: VoucherDiscountType
  onDiscountTypeChange: (type: VoucherDiscountType) => void
  discountValue: string
  onDiscountValueChange: (value: string) => void
  disabled?: boolean
}

export function VoucherDiscountFields({
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
  disabled = false,
}: Props) {
  return (
    <div className="space-y-3">
      <div>
        <span className="field-label">Discount type</span>
        <div className="mt-1.5 flex gap-2">
          {(['percent', 'fixed'] as const).map((type) => (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => onDiscountTypeChange(type)}
              className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${
                discountType === type
                  ? 'border-[#7BCA0D] bg-[#f0fde4] text-[#4a8c00]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              } disabled:opacity-50`}
            >
              {type === 'percent' ? 'Percentage' : 'Fixed amount'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="field-label">
          {discountType === 'percent' ? 'Discount (%)' : 'Discount (₱)'}
        </label>
        <input
          type="number"
          min={discountType === 'percent' ? 1 : 0.01}
          max={discountType === 'percent' ? 100 : undefined}
          step={discountType === 'percent' ? 1 : 0.01}
          value={discountValue}
          onChange={(e) => onDiscountValueChange(e.target.value)}
          className="w-full field-input"
          placeholder={discountType === 'percent' ? '20' : '500'}
          disabled={disabled}
        />
        {discountType === 'fixed' && (
          <p className="mt-1 text-[11px] text-gray-400">Flat peso off subtotal (incl. convenience fee).</p>
        )}
      </div>
    </div>
  )
}
