"use client";

import Image from 'next/image';

interface RevenueCardProps {
  grossRevenue?: number;
  netRevenue?: number;
}

function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function RevenueCard({
  grossRevenue = 500000,
  netRevenue = 80000,
}: RevenueCardProps) {
  return (
    <div className="w-full min-w-0 rounded-2xl bg-white px-10 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-4">
          <div>
            <div className="text-xl font-extrabold leading-none text-[#8BC34A] md:text-2xl">
              {formatPeso(grossRevenue)}
            </div>
            <p className="mt-1 text-sm font-medium leading-none text-[#6B6B6B] md:text-lg">
              Gross Revenue
            </p>
          </div>

          <div>
            <div className="text-xl font-extrabold leading-none text-[#8BC34A] md:text-2xl">
              {formatPeso(netRevenue)}
            </div>
            <p className="mt-1 text-sm font-medium leading-none text-[#6B6B6B] md:text-lg">
              Net Revenue
            </p>
          </div>
        </div>

        <div className="w-full h-full flex items-center justify-end">
           <Image src="/money.png" alt="" width={75} height={10} />
        </div>
      </div>
    </div>
  );
}