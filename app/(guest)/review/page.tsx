'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Star } from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL ||
  'http://localhost:5001/alegria-booking-system/asia-southeast1/api';

interface BookingInfo {
  bookingId: string;
  alreadySubmitted: boolean;
  guestName: string;
  guestNationality: string;
  tourName: string;
  sourceType: string;
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50"><p className="text-sm text-gray-400">Loading…</p></div>}>
      <ReviewForm />
    </Suspense>
  );
}

function ReviewForm() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') ?? '';
  const token = searchParams.get('token') ?? '';

  const [info, setInfo] = useState<BookingInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState('');
  const [country, setCountry] = useState('');
  const [displayConsent, setDisplayConsent] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId || !token) {
      setLoadError('Invalid review link. Please check your email and try again.');
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/review/${encodeURIComponent(bookingId)}?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load review details.');
        return data as BookingInfo;
      })
      .then((data) => {
        setInfo(data);
        setCountry(data.guestNationality);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load review details.');
        setLoading(false);
      });
  }, [bookingId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setSubmitError('Please select a star rating.');
      return;
    }
    if (!text.trim()) {
      setSubmitError('Please write a short review.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`${API_URL}/review/${encodeURIComponent(bookingId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, text: text.trim(), reviewerCountry: country, displayConsent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to submit review.');
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-sm font-medium text-red-600">{loadError}</p>
        </div>
      </div>
    );
  }

  if (info?.alreadySubmitted || submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-sm border border-gray-100 p-8 text-center space-y-3">
          <div className="flex justify-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F5E9]">
              <Star className="h-7 w-7 fill-[#558B2F] text-[#558B2F]" />
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            {submitted ? 'Thank you!' : 'Review already submitted'}
          </h2>
          <p className="text-sm text-gray-500">
            {submitted
              ? 'Your review has been submitted and is pending moderation. We appreciate your feedback!'
              : 'You have already submitted a review for this booking.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#558B2F] px-6 py-5">
          <h1 className="text-lg font-bold text-white">Leave a Review</h1>
          <p className="text-sm text-green-100 mt-0.5">{info?.tourName}</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <p className="text-sm text-gray-600">
            Hi <strong>{info?.guestName}</strong>, how was your experience?
          </p>

          {/* Star rating */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="p-0.5 focus:outline-none"
                  aria-label={`${star} star`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hovered || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review text */}
          <div>
            <label htmlFor="review-text" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              id="review-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Tell us about your experience…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#558B2F] resize-none"
            />
          </div>

          {/* Country */}
          <div>
            <label htmlFor="review-country" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Nationality / Country
            </label>
            <input
              id="review-country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Filipino, American…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#558B2F]"
            />
          </div>

          {/* Display consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={displayConsent}
              onChange={(e) => setDisplayConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#558B2F] focus:ring-[#558B2F]"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              I consent to my name and review being publicly displayed on the website.
            </span>
          </label>

          {submitError && (
            <p className="text-xs font-medium text-red-600">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#558B2F] py-2.5 text-sm font-semibold text-white hover:bg-[#4a7a28] disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
