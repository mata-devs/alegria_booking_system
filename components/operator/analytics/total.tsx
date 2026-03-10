"use client";

import Image from 'next/image';

interface TotalBookingsCardProps {
  total?: number;
}

export default function TotalBookingsCard({
  total = 451,
}: TotalBookingsCardProps) {
  return (
    <div className="w-full rounded-2xl bg-white px-10 py-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-20 w-20 items-center justify-center rounded-md  text-white">
          <Image src="/vector.png" alt="" width={50} height={10} />
        </div>

        <div className="text-center">
          <div className="text-3xl font-extrabold leading-none text-[#8BC34A] md:text-4xl">
            {total}
          </div>
          <p className="mb-3 mt-2 text-sm font-semibold leading-none text-[#5F5F5F] md:text-lg">
            Total Number of bookings
          </p>
        </div>
      </div>
    </div>
  );
}