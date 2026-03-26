'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { X, Printer } from 'lucide-react';

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

interface BookingDetailsCardProps {
  booking?: Booking;
  onClose?: () => void;
}

export default function BookingDetailsCard({
                                             booking,
                                             onClose,
                                           }: BookingDetailsCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const printSheetRef = useRef<HTMLDivElement | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [visibleUploads, setVisibleUploads] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<BookingStatus>('Reserved');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

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

  if (!booking) {
    return (
        <div className="w-full rounded-lg border border-gray-200 bg-white p-8 flex items-center justify-center text-sm text-gray-400">
          Select a booking from the list.
        </div>
    );
  }

  return (
      <>
        <div className="w-full rounded-lg border border-gray-200 bg-white overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-500">
              Booking ID: <span className="font-medium text-gray-700">{booking.bookingIdLabel ?? booking.id}</span>
            </p>

            <div className="flex items-center gap-1">
              <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(true)}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-[#558B2F] transition-colors"
                  title="Print preview"
              >
                <Printer size={16} />
              </button>
              {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close booking details"
                    className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5">
            {/* Schedule + Representative */}
            <div className="mt-3 space-y-1.5 text-sm text-gray-700">
              <Row
                  label="Tour Schedule:"
                  value={
                    <span className="font-semibold text-gray-900">
                  {booking.scheduleLabel}
                </span>
                  }
              />
              <Row label="Representative:" value="" />
            </div>

            <div className="mt-2 pl-3 space-y-1 text-sm text-gray-700">
              <div className="flex items-center gap-6">
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

            {/* Other Guests */}
            <div className="mt-4 text-sm font-bold text-gray-900">Other Guests</div>

            <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-6 gap-2 px-3 py-2 text-xs text-gray-500 font-medium bg-gray-50">
                <div className="col-span-3">Name</div>
                <div className="col-span-1 text-center">Age</div>
                <div className="col-span-2 text-right">Gender</div>
              </div>
              <div className="divide-y divide-gray-100">
                {booking.otherGuests.map((g, idx) => (
                    <div
                        key={idx}
                        className="grid grid-cols-6 gap-2 px-3 py-1.5 text-sm text-gray-700"
                    >
                      <div className="col-span-3 font-medium truncate">{g.name}</div>
                      <div className="col-span-1 text-center">{g.age}</div>
                      <div className="col-span-2 text-right">{g.gender}</div>
                    </div>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="mt-4 text-sm font-bold text-gray-900">Payment</div>

            <div className="mt-2 text-sm text-gray-700 space-y-3 px-2">
              <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {`₱${booking.payment.pricePerPerson} x ${booking.payment.qty}`}
              </span>
                <span className="text-sm font-medium text-gray-700">
                {peso(totals?.subtotal ?? 0)}
              </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Service charge</span>
                <span className="text-sm font-medium text-gray-700">
                {peso(booking.payment.serviceCharge)}
              </span>
              </div>

              <div className="h-px bg-gray-200" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-sm font-bold text-gray-900">
                {peso(totals?.total ?? 0)}
              </span>
              </div>

              <div className="mt-1">
                <span className="text-xs text-gray-500">Payment Option: </span>
                <span className="text-xs font-semibold text-gray-700">{booking.payment.option}</span>
              </div>
            </div>

            {/* File Upload */}
            <div className="mt-4 text-sm font-bold text-gray-900">File Upload</div>

            <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden bg-white divide-y divide-gray-200">
              {visibleUploads.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-400">
                    No files uploaded yet.
                  </div>
              ) : (
                  visibleUploads.map((f) => (
                      <div
                          key={f.id}
                          className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-gray-700">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 border border-gray-200">
                      <Image src="/photos.png" alt="" width={25} height={2} />
                    </span>
                          <span className="font-medium text-sm">{f.name}</span>
                        </div>

                        <button
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50 transition-colors"
                            type="button"
                            aria-label="Delete file"
                            onClick={() => removeUpload(f.id)}
                        >
                          <Image src="/trash.png" alt="" width={20} height={2} />
                        </button>
                      </div>
                  ))
              )}
            </div>

            {/* Dropzone */}
            <div
                className={[
                  'mt-3 rounded-lg border-2 border-dashed bg-green-50 px-4 py-2',
                  isDragOver ? 'border-[#558B2F]' : 'border-green-300',
                ].join(' ')}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
              <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={onInputChange}
              />

              <div className="flex items-center justify-center gap-5">
                <button
                    type="button"
                    onClick={onBrowse}
                    className="inline-flex items-center gap-1 px-2 py-2 text-white text-[12px] font-semibold"
                >
                  <Image src="/browse.png" alt="" width={75} height={75} />
                </button>

                <div className="text-[12px] text-neutral-500">Drop a file here</div>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4 flex items-center justify-center">
              <div className="relative inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700">
                <span className={`h-2 w-2 rounded-full ${statusDot[status]}`} />

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BookingStatus)}
                    className="appearance-none bg-transparent pr-6 font-medium outline-none cursor-pointer"
                >
                  <option value="Reserved">Reserved</option>
                  <option value="Paid">Paid</option>
                  <option value="Processing">Processing</option>
                </select>

                <span className="pointer-events-none absolute right-3 text-neutral-400">▾</span>
              </div>
            </div>
          </div>
        </div>

        {/* Print Preview Modal */}
        {isPrintPreviewOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
              <div className="relative w-full max-w-[420px] sm:max-w-[540px] max-h-[90vh] flex flex-col rounded-lg bg-white shadow-2xl overflow-hidden">
                {/* Modal close */}
                <button
                    type="button"
                    onClick={() => setIsPrintPreviewOpen(false)}
                    className="absolute top-3 right-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                >
                  <X size={16} />
                </button>

                {/* Scrollable content */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <div
                      ref={printSheetRef}
                      className="px-8 pt-8 pb-6 text-[13px] text-neutral-800"
                  >
                    {/* Header */}
                    <div className="border-b-2 border-[#558B2F] pb-4 mb-5">
                      <h3 className="text-lg font-bold text-[#558B2F] tracking-tight">Booking Confirmation</h3>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs text-neutral-500">
                          Booking ID: <span className="font-semibold text-neutral-800">{booking.bookingIdLabel ?? booking.id}</span>
                        </div>
                        <div className="text-xs text-neutral-500">
                          Date: <span className="font-semibold text-neutral-800">{booking.requestDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tour Schedule */}
                    <div className="mb-5 rounded-md bg-green-50 border border-green-100 px-4 py-3">
                      <div className="text-[11px] font-medium uppercase tracking-wider text-[#558B2F]">Tour Schedule</div>
                      <div className="mt-1 text-sm font-bold text-neutral-900">{booking.scheduleLabel}</div>
                    </div>

                    {/* Representative */}
                    <div className="mb-5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Representative</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                        <div>
                          <span className="text-neutral-500">Name:</span>{' '}
                          <span className="font-medium">{booking.representative.name}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Age:</span>{' '}
                          <span className="font-medium">{booking.representative.age}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Gender:</span>{' '}
                          <span className="font-medium">{booking.representative.gender}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Email:</span>{' '}
                          <span className="font-medium break-all">{booking.representative.email}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-neutral-500">Mobile:</span>{' '}
                          <span className="font-medium">{booking.representative.mobile}</span>
                        </div>
                      </div>
                    </div>

                    {/* Other Guests */}
                    {booking.otherGuests.length > 0 && (
                      <div className="mb-5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                          Other Guests ({booking.otherGuests.length})
                        </div>
                        <table className="w-full text-[13px]">
                          <thead>
                            <tr className="border-b border-neutral-200">
                              <th className="py-1.5 text-left font-semibold text-neutral-600">#</th>
                              <th className="py-1.5 text-left font-semibold text-neutral-600">Name</th>
                              <th className="py-1.5 text-center font-semibold text-neutral-600">Age</th>
                              <th className="py-1.5 text-right font-semibold text-neutral-600">Gender</th>
                            </tr>
                          </thead>
                          <tbody>
                            {booking.otherGuests.map((guest, idx) => (
                              <tr key={`${guest.name}-${idx}`} className="border-b border-neutral-100">
                                <td className="py-1.5 text-neutral-400">{idx + 1}</td>
                                <td className="py-1.5 font-medium">{guest.name}</td>
                                <td className="py-1.5 text-center">{guest.age}</td>
                                <td className="py-1.5 text-right">{guest.gender}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Payment */}
                    <div className="mb-5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Payment Summary</div>
                      <div className="rounded-md border border-neutral-200 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 text-[13px]">
                          <span className="text-neutral-600">₱{booking.payment.pricePerPerson} × {booking.payment.qty} guest{booking.payment.qty !== 1 ? 's' : ''}</span>
                          <span className="font-medium">{peso(totals?.subtotal ?? 0)}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2 text-[13px] border-t border-neutral-100">
                          <span className="text-neutral-600">Service charge</span>
                          <span className="font-medium">{peso(booking.payment.serviceCharge)}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2.5 text-sm font-bold border-t border-neutral-200 bg-neutral-50">
                          <span>Total</span>
                          <span>{peso(totals?.total ?? 0)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[13px] text-neutral-500">
                        Payment Option: <span className="font-medium text-neutral-800">{booking.payment.option}</span>
                      </div>
                    </div>

                    {/* Operator Info */}
                    <div className="border-t border-neutral-200 pt-4">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Tour Operator</div>
                      <div className="text-[13px] space-y-0.5">
                        <div className="font-medium">Operator 1</div>
                        <div className="text-neutral-500">tourop1@email.com</div>
                        <div className="text-neutral-500">0932221458</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-6 py-3 shrink-0">
                  <button
                      type="button"
                      onClick={() => setIsPrintPreviewOpen(false)}
                      className="rounded-md border border-neutral-300 px-4 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                      type="button"
                      onClick={handlePrint}
                      className="rounded-md bg-[#558B2F] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#4a7a28] transition-colors"
                  >
                    Print
                  </button>
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