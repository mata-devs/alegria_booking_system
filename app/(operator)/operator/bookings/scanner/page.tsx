'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { checkInBooking } from '@/app/lib/booking-service';

type ParsedQr = { bookingId: string; token: string };

function parseQrText(text: string): ParsedQr | null {
  try {
    const parsed = JSON.parse(text) as Partial<ParsedQr>;
    if (!parsed.bookingId || !parsed.token) return null;
    return { bookingId: parsed.bookingId, token: parsed.token };
  } catch {
    return null;
  }
}

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const [result, setResult] = useState<ParsedQr | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingScanner, setIsStartingScanner] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [manualBookingId, setManualBookingId] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [isSecureContextState, setIsSecureContextState] = useState(true);

  useEffect(() => {
    readerRef.current = new BrowserQRCodeReader();
    const reader = readerRef.current;
    const videoEl = videoRef.current;
    setIsSecureContextState(window.isSecureContext);

    return () => {
      if (videoEl) {
        reader.decodeFromVideoDevice(undefined, videoEl, () => {});
      }
      readerRef.current = null;
    };
  }, []);

  const startScanner = async () => {
    const reader = readerRef.current;
    const videoEl = videoRef.current;
    if (!reader || !videoEl) return;

    if (!window.isSecureContext) {
      setError('Camera access on mobile requires HTTPS (or localhost). Open this page using an HTTPS URL.');
      return;
    }

    setError(null);
    setIsStartingScanner(true);

    try {
      // Trigger permission prompt from a user gesture (required by many mobile browsers).
      const probeStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      probeStream.getTracks().forEach((track) => track.stop());

      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      const preferred =
        devices.find((d) => /back|rear|environment/i.test(d.label)) ?? devices[0];
      const deviceId = preferred?.deviceId;
      if (!deviceId) {
        setError('No camera device found.');
        return;
      }

      await reader.decodeFromVideoDevice(deviceId, videoEl, (scanResult) => {
        if (!scanResult) return;
        const parsed = parseQrText(scanResult.getText());
        if (!parsed) {
          setError('Invalid QR payload format.');
          return;
        }
        setResult(parsed);
        setManualBookingId(parsed.bookingId);
        setManualToken(parsed.token);
      });

      setIsScannerActive(true);
    } catch {
      setError('Unable to start camera. Check browser permission, HTTPS, and camera availability.');
    } finally {
      setIsStartingScanner(false);
    }
  };

  const submit = async () => {
    if (!manualBookingId || !manualToken) {
      setError('Booking ID and token are required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await checkInBooking(manualBookingId.trim(), manualToken.trim());
      setResult({ bookingId: manualBookingId.trim(), token: manualToken.trim() });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Check-in failed.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">QR Check-In Scanner</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm text-gray-600">Scan guest QR code</p>
          {!isSecureContextState && (
            <p className="mb-3 text-xs text-amber-700">
              Insecure context detected. On mobile, camera permission usually appears only on HTTPS.
            </p>
          )}
          <video
            ref={videoRef}
            className="w-full rounded-md bg-black"
            muted
            playsInline
            autoPlay
          />
          <button
            type="button"
            onClick={startScanner}
            disabled={isStartingScanner || isScannerActive}
            className="mt-3 rounded bg-[#558B2F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a7a28] disabled:opacity-60"
          >
            {isScannerActive ? 'Scanner Active' : isStartingScanner ? 'Starting camera...' : 'Enable Camera'}
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <p className="text-sm text-gray-600">Manual fallback</p>
          <input
            value={manualBookingId}
            onChange={(e) => setManualBookingId(e.target.value)}
            placeholder="Booking ID"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Check-in token"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting}
            className="rounded bg-[#558B2F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a7a28] disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting...' : 'Mark In Progress'}
          </button>

          {result && (
            <p className="text-sm text-green-700">
              Checked in booking <span className="font-semibold">{result.bookingId}</span>.
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

