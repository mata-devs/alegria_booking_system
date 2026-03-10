'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

export type BookingStatus = 'Reserved' | 'Paid' | 'Processing' | 'Cancelled'| 'Completed';

export type Guest = {
  name: string;
  age: number;
  gender: string;
};

export type UploadedFile = {
  id: string;
  name: string;
};

export type Booking = {
  id: string;
  bookingIdLabel?: string;
  scheduleLabel: string;
requestDate: string;
  representative: {
    name: string;
    age: number;
    gender: string;
    email: string;
    mobile: string;
  };

  otherGuests: Guest[];

  payment: {
    pricePerPerson: number;
    qty: number;
    serviceCharge: number;
    option: string;
  };

  status: BookingStatus;
  uploads: UploadedFile[];
};

function peso(n: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(n);
}

const statusDot: Record<BookingStatus, string> = {
  Reserved: 'bg-yellow-300',
  Paid: 'bg-green-500',
  Processing: 'bg-orange-500',
  Completed: 'bg-green-500',
  Cancelled: 'bg-orange-500',
};

function uid() {
  const c: any = globalThis as any;
  return c?.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function BookingDetailsCard({ booking }: { booking?: Booking }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);


  const [visibleUploads, setVisibleUploads] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<BookingStatus>('Reserved');


  useEffect(() => {
    if (!booking) return;
    setVisibleUploads(booking.uploads ?? []);
    setStatus(booking.status);
  }, [booking?.id]); 

  const totals = useMemo(() => {
    if (!booking) return null;
    const subtotal = booking.payment.pricePerPerson * booking.payment.qty;
    const total = subtotal + booking.payment.serviceCharge;
    return { subtotal, total };
  }, [booking]);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    setVisibleUploads((prev) => {
      const next = [...prev];
      for (const f of arr) {
        next.push({ id: uid(), name: f.name });
      }
      return next;
    });
  };

  const onBrowse = () => fileInputRef.current?.click();

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.files) addFiles(e.target.files);
    
    e.target.value = '';
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const removeUpload = (id: string) => {
    setVisibleUploads((prev) => prev.filter((x) => x.id !== id));
  };

  if (!booking) {
    return (
      <div className="h-full min-h-0 w-full rounded-2xl border border-neutral-200 bg-white flex items-center justify-center text-sm text-neutral-500">
        Select a booking from the list.
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-0 rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className=" bg-white flex  py-1">
        <div className="flex items-center w-[100%] pl-55 justify-center">
          <div className="text-[15px] text-gray-500  leading-tight">
            Booking Id:{' '}
            <div className='flex items-center w-[100%] justify-center'>
            <span className="font-medium text-gray-500">
              {booking.bookingIdLabel ?? booking.id}
            </span>
            </div>
          </div>
</div>
          <div className='w-full flex items-center w-full justify-end py-1 px-2'>
          <span className="w-[60%] flex items-center justify-center text-[10px] px-3 py-1 rounded-full bg-lime-200  text-lime-900 border border-lime-300 font-medium">
            preview printable
          </span>
          </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-12 pb-5">
        {/* Schedule + Representative */}
        <div className="mt-2 space-y-2 text-[18px] text-neutral-700">
          <Row
            label="Tour Schedule:"
            value={
              <span className="font-semibold text-neutral-900">
                {booking.scheduleLabel}
              </span>
            }
          />
          <Row label="Representative:" value="" />
        </div>

        <div className="mt-2 px-1 text-[18px] text-neutral-700 pl-3">
          <div className="flex items-center gap-6">
            <Row label="Name:" value={<span className="font-semibold">{booking.representative.name}</span>} />
            <RowInline label="Age:" value={booking.representative.age} />
          </div>
          <RowInline label="Gender:" value={booking.representative.gender} />
          <RowInline label="Email:" value={booking.representative.email} />
          <RowInline label="Mobile Number:" value={booking.representative.mobile} />
        </div>

        {/* Other Guests */}
        <div className="mt-2 text-lg text-neutral-700 font-semibold">Other Guests</div>

        <div className="mt-2  overflow-hidden">
          <div className="grid grid-cols-6 gap-2 px-3 py-2 text-sm text-neutral-800 font-medium">
            <div className="col-span-3 text-center md:text-left">Name</div>
            <div className="col-span-1 text-center">Age</div>
            <div className="col-span-2 text-center md:text-right">Gender</div>
          </div>
          <div className="">
            {booking.otherGuests.map((g, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-2 px-3 py-1 text-sm text-neutral-800">
                <div className="col-span-3 font-semibold truncate">{g.name}</div>
                <div className="col-span-1 font-semibold text-center">{g.age}</div>
                <div className="col-span-2 text-right font-semibold">{g.gender}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="mt-5 text-lg text-neutral-800 font-semibold">Payment</div>

        <div className="mt-2 text-[12px] text-neutral-800 space-y-4 px-10">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-neutral-800">{`₱${booking.payment.pricePerPerson} x ${booking.payment.qty}`}</span>
            <span className="text-lg font-semibold text-neutral-800">{peso(totals?.subtotal ?? 0)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-neutral-800">Service charge</span>
            <span className="text-lg font-semibold text-neutral-800">{peso(booking.payment.serviceCharge)}</span>
          </div>

          <div className="h-px bg-neutral-200" />

          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-neutral-800">Total</span>
            <span className="text-lg font-semibold text-neutral-800">{peso(totals?.total ?? 0)}</span>
          </div>

          <div className="mt-2">
            <span className="text-[12px] text-neutral-800">Payment Option: </span>
            <span className="font-semibold text-neutral-800">{booking.payment.option}</span>
          </div>
        </div>

        {/* File Upload */}
        <div className="mt-5 text-lg text-neutral-800 font-semibold">File Upload</div>

        {/* visible file list */}
        <div className="mt-2 rounded-xl border border-neutral-200 overflow-hidden bg-white">
          {visibleUploads.length === 0 ? (
            <div className="px-2 py-2 text-[11px] text-neutral-500">
              No files uploaded yet.
            </div>
          ) : (
            visibleUploads.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between px-3 py-2 text-[12px] border-b last:border-b-0 border-neutral-200"
              >
                <div className="flex items-center gap-2 text-neutral-700">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100 border border-neutral-200">
                    <Image src="/photos.png" alt="" width={25} height={2} />
                  </span>
                  <span className="font-medium">{f.name}</span>
                </div>

                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                  type="button"
                  aria-label="Delete file"
                  onClick={() => removeUpload(f.id)}
                >
                  <Image src="/trash.png" alt="" width={25} height={2} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-neutral-600">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function RowInline({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-700">{label}</span>
      <span className="font-semibold text-neutral-900">{value}</span>
    </div>
  );
}
