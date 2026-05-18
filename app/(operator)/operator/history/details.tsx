'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

export type BookingStatus =
    | 'Reserved'
    | 'Paid'
    | 'Processing'
    | 'Cancelled'
    | 'Completed';

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

function uid() {
  const c = globalThis as { crypto?: { randomUUID?: () => string } };
  return c?.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

interface BookingDetailsCardProps {
  booking?: Booking | null;
  onClose?: () => void;
}

export default function BookingDetailsCard({
                                             booking,
                                             onClose,
                                           }: BookingDetailsCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const printSheetRef = useRef<HTMLDivElement | null>(null);

  const [visibleUploads, setVisibleUploads] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  useEffect(() => {
    if (!booking) {
      setVisibleUploads([]);
      return;
    }

    setVisibleUploads(booking.uploads ?? []);
  }, [booking]);

  const totals = useMemo(() => {
    if (!booking) return null;
    const subtotal = booking.payment.pricePerPerson * booking.payment.qty;
    const total = subtotal + booking.payment.serviceCharge;
    return { subtotal, total };
  }, [booking]);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    setVisibleUploads((prev) => [
      ...prev,
      ...arr.map((f) => ({
        id: uid(),
        name: f.name,
      })),
    ]);
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

    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
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

  const handlePrint = () => {
    const node = printSheetRef.current;
    if (!node) return;

    const width = 900;
    const height = 1200;

    const dualScreenLeft =
        window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    const dualScreenTop =
        window.screenTop !== undefined ? window.screenTop : window.screenY;

    const viewportWidth =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        screen.width;

    const viewportHeight =
        window.innerHeight ||
        document.documentElement.clientHeight ||
        screen.height;

    const left = dualScreenLeft + Math.max(0, (viewportWidth - width) / 2);
    const top = dualScreenTop + Math.max(0, (viewportHeight - height) / 2);

    const printWindow = window.open(
        '',
        '_blank',
        `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!printWindow) return;

    const headContent = Array.from(
        document.querySelectorAll('style, link[rel="stylesheet"]')
    )
        .map((el) => el.outerHTML)
        .join('\n');

    const printableHtml = node.outerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Booking Print</title>
          ${headContent}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }

            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
            }

            *, *::before, *::after {
              box-sizing: border-box;
            }

            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            #print-root {
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div id="print-root">
            ${printableHtml}
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.focus();
                window.print();
              }, 250);
            };

            window.onafterprint = function () {
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!booking) return null;

  return (
      <>
        <div className="flex-1 min-w-[600px] h-full min-h-0 w-full rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-neutral-200 bg-white px-5 py-3">
            <div className="w-[132px] shrink-0 flex justify-end">
              <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(true)}
                  className="inline-flex h-7 items-center justify-center rounded-full border border-lime-300 bg-lime-200 px-4 text-[11px] font-medium text-lime-900 hover:bg-lime-300"
              >
                preview printable
              </button>
            </div>

            <div className="flex-1 min-w-0 text-center leading-tight">
              <div className="text-[14px] text-gray-500">Booking Id:</div>
              <div className="truncate text-[20px] font-medium text-gray-500">
                {booking.bookingIdLabel ?? booking.id}
              </div>
            </div>

            <div className="w-10 h-10 shrink-5">
              {onClose ? (
                  <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close booking details"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-gray-100 text-neutral-600 hover:bg-neutral-100"
                  >
                    ✕
                  </button>
              ) : null}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-5">
            <div className="mt-4 space-y-2 text-[18px] text-neutral-700">
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

            <div className="mt-2 px-1 pl-3 text-[18px] text-neutral-700">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <Row
                    label="Name:"
                    value={<span className="font-semibold">{booking.representative.name}</span>}
                />
                <RowInline label="Age:" value={booking.representative.age} />
              </div>
              <RowInline label="Gender:" value={booking.representative.gender} />
              <RowInline label="Email:" value={booking.representative.email} />
              <RowInline label="Mobile Number:" value={booking.representative.mobile} />
            </div>

            <div className="mt-5 text-lg font-semibold text-neutral-700">Other Guests</div>

            <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200">
              <div className="grid grid-cols-6 gap-2 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-800">
                <div className="col-span-3 text-center md:text-left">Name</div>
                <div className="col-span-1 text-center">Age</div>
                <div className="col-span-2 text-center md:text-right">Gender</div>
              </div>

              <div>
                {booking.otherGuests.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-neutral-500">No other guests.</div>
                ) : (
                    booking.otherGuests.map((g, idx) => (
                        <div
                            key={`${g.name}-${idx}`}
                            className="grid grid-cols-6 gap-2 border-t border-neutral-200 px-3 py-2 text-sm text-neutral-800"
                        >
                          <div className="col-span-3 truncate font-semibold">{g.name}</div>
                          <div className="col-span-1 text-center font-semibold">{g.age}</div>
                          <div className="col-span-2 text-right font-semibold">{g.gender}</div>
                        </div>
                    ))
                )}
              </div>
            </div>

            <div className="mt-5 text-lg font-semibold text-neutral-800">Payment</div>

            <div className="mt-2 space-y-4 px-4 text-[12px] text-neutral-800 md:px-10">
              <div className="flex items-center justify-between gap-4">
              <span className="text-lg font-semibold text-neutral-800">
                {`${peso(booking.payment.pricePerPerson)} x ${booking.payment.qty}`}
              </span>
                <span className="text-lg font-semibold text-neutral-800">
                {peso(totals?.subtotal ?? 0)}
              </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-lg font-semibold text-neutral-800">Service charge</span>
                <span className="text-lg font-semibold text-neutral-800">
                {peso(booking.payment.serviceCharge)}
              </span>
              </div>

              <div className="h-px bg-neutral-200" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-lg font-semibold text-neutral-800">Total</span>
                <span className="text-lg font-semibold text-neutral-800">
                {peso(totals?.total ?? 0)}
              </span>
              </div>

              <div className="mt-2">
                <span className="text-[12px] text-neutral-800">Payment Option: </span>
                <span className="font-semibold text-neutral-800">{booking.payment.option}</span>
              </div>
            </div>

            <div className="mt-5 text-lg font-semibold text-neutral-800">File Upload</div>

            <div
                className={`mt-2 overflow-hidden rounded-xl border bg-white transition ${
                    isDragOver ? 'border-blue-400 bg-blue-50' : 'border-neutral-200'
                }`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
            >
              {visibleUploads.length === 0 ? (
                  <div className="px-3 py-3 text-[11px] text-neutral-500">
                    No files uploaded yet.
                  </div>
              ) : (
                  visibleUploads.map((f) => (
                      <div
                          key={f.id}
                          className="flex items-center justify-between border-b border-neutral-200 px-3 py-2 text-[12px] last:border-b-0"
                      >
                        <div className="flex min-w-0 items-center gap-2 text-neutral-700">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-neutral-100">
                      <Image src="/photos.png" alt="" width={20} height={20} />
                    </span>
                          <span className="truncate font-medium">{f.name}</span>
                        </div>

                        <button
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                            type="button"
                            aria-label="Delete file"
                            onClick={() => removeUpload(f.id)}
                        >
                          <Image src="/trash.png" alt="" width={18} height={18} />
                        </button>
                      </div>
                  ))
              )}

              <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-3">
                <div className="text-xs text-neutral-500">Drag files here or browse</div>
                <button
                    type="button"
                    onClick={onBrowse}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Browse files
                </button>
              </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={onInputChange}
            />
          </div>
        </div>

        {/* Print Preview Modal */}
        {isPrintPreviewOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
              <div className="relative w-full max-w-[400px] sm:max-w-[600px]">
                <button
                    type="button"
                    onClick={() => setIsPrintPreviewOpen(false)}
                    className="absolute -top-3 -right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md hover:bg-neutral-100"
                >
                  ✕
                </button>

                <div className="h-[87vh] overflow-y-auto rounded-sm bg-[#f6f6f6] shadow-2xl">
                  <div
                      ref={printSheetRef}
                      className="px-6 pt-6 pb-8 text-[15px] text-black"
                  >
                    <div className="mb-5 h-[5px] w-full bg-black" />

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <span className="w-[70px] shrink-0">Booking ID:</span>
                        <span className="font-medium">{booking.bookingIdLabel ?? booking.id}</span>
                      </div>

                      <div className="mt-4 font-medium">Representative:</div>

                      <div className="grid grid-cols-[60px_1fr_35px_1fr] gap-x-2 gap-y-1 pl-2">
                        <span>Name:</span>
                        <span className="font-medium">{booking.representative.name}</span>
                        <span>Age:</span>
                        <span className="font-medium">{booking.representative.age}</span>

                        <span>Email:</span>
                        <span className="font-medium break-all">{booking.representative.email}</span>
                        <span></span>
                        <span></span>

                        <span>Mobile Number:</span>
                        <span className="font-medium break-all">{booking.representative.mobile}</span>
                        <span></span>
                        <span></span>
                      </div>

                      <div className="mt-6 font-medium">Other Guests</div>

                      <div className="pl-2">
                        <div className="grid grid-cols-[1.6fr_0.5fr_0.8fr] gap-2 pb-1 text-center">
                          <div>Name</div>
                          <div>Age</div>
                          <div>Gender</div>
                        </div>

                        <div className="space-y-1">
                          {booking.otherGuests.map((guest, idx) => (
                              <div
                                  key={`${guest.name}-${idx}`}
                                  className="grid grid-cols-[1.6fr_0.5fr_0.8fr] gap-2 text-center"
                              >
                                <div className="text-left font-medium">{guest.name}</div>
                                <div className="font-medium">{guest.age}</div>
                                <div className="font-medium">{guest.gender}</div>
                              </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 font-medium">Payment</div>

                      <div className="space-y-2 pl-2">
                        <div className="flex items-center justify-between gap-4">
                      <span className="font-medium">
                        ₱{booking.payment.pricePerPerson} x {booking.payment.qty}
                      </span>
                          <span className="font-medium">{peso(totals?.subtotal ?? 0)}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium">Service charge</span>
                          <span className="font-medium">{peso(booking.payment.serviceCharge)}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-1">
                          <span className="font-medium">Total</span>
                          <span className="font-medium">{peso(totals?.total ?? 0)}</span>
                        </div>
                      </div>

                      <div className="mt-8 pl-2">
                        <div className="flex gap-2">
                          <span>Payment Option:</span>
                          <span className="font-medium">{booking.payment.option}</span>
                        </div>
                      </div>

                      <div className="mt-4 pl-2 space-y-1">
                        <div className="flex gap-2">
                          <span className="w-[70px] shrink-0">Tour Operator:</span>
                          <span className="font-medium">Operator 1</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="w-[70px] shrink-0">email:</span>
                          <span className="font-medium">tourop1@email.com</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="w-[70px] shrink-0">phone number:</span>
                          <span className="font-medium">0932221458</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-neutral-200 bg-white px-4 py-4">
                    <button
                        type="button"
                        onClick={() => setIsPrintPreviewOpen(false)}
                        className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Close
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                    >
                      Print
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </>
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