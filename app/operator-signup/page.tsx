'use client';

import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseDb, firebaseStorage } from '@/lib/firebase';
import { Upload, X, FileImage, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface FormData {
  name: string;
  phoneNumber: string;
  mobileNumber: string;
  email: string;
  address: string;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const REQUIRED_DOCUMENTS = [
  'Valid ID (Government-issued)',
  'Business Permit / Registration',
  'Proof of Address',
  'Tax Identification Certificate',
];

export default function OperatorSignUpPage() {
  const [form, setForm] = useState<FormData>({
    name: '',
    phoneNumber: '',
    mobileNumber: '',
    email: '',
    address: '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleInput(e: ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError(`Photo must be under ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => ALLOWED_TYPES.includes(f.type),
    );
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setError(`Some files exceed ${MAX_FILE_SIZE_MB}MB and were skipped.`);
      const valid = files.filter((f) => f.size <= MAX_FILE_SIZE);
      setDocuments((prev) => [...prev, ...valid]);
      return;
    }
    setError(null);
    setDocuments((prev) => [...prev, ...files]);
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setError(`Some files exceed ${MAX_FILE_SIZE_MB}MB and were skipped.`);
      const valid = files.filter((f) => f.size <= MAX_FILE_SIZE);
      setDocuments((prev) => [...prev, ...valid]);
      e.target.value = '';
      return;
    }
    setError(null);
    setDocuments((prev) => [...prev, ...files]);
    e.target.value = '';
  }

  function removeDocument(index: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }

    if (!form.phoneNumber.trim() && !form.mobileNumber.trim()) {
      setError('Please provide at least one contact number.');
      return;
    }

    if (documents.length === 0) {
      setError('Please upload at least one required document.');
      return;
    }

    setSubmitting(true);

    try {
      // Generate a temporary ID for storage paths
      const tempId = crypto.randomUUID();

      // Upload photo
      let photoUrl: string | null = null;
      if (photo) {
        const photoRef = ref(
          firebaseStorage,
          `signup-requests/${tempId}/photo.jpg`,
        );
        await uploadBytes(photoRef, photo);
        photoUrl = await getDownloadURL(photoRef);
      }

      // Upload documents
      const uploadedDocs: { name: string; url: string }[] = [];
      for (const doc of documents) {
        const docRef = ref(
          firebaseStorage,
          `signup-requests/${tempId}/documents/${doc.name}`,
        );
        await uploadBytes(docRef, doc);
        const url = await getDownloadURL(docRef);
        uploadedDocs.push({ name: doc.name, url });
      }

      // Save to Firestore
      await addDoc(collection(firebaseDb, 'operator_signup_requests'), {
        applicantId: `I${tempId.replace(/-/g, '').slice(0, 5).toUpperCase()}`,
        name: form.name,
        email: form.email,
        phoneNumber: form.phoneNumber,
        mobileNumber: form.mobileNumber,
        address: form.address,
        photoUrl,
        documents: uploadedDocs,
        status: 'pending',
        submittedAt: serverTimestamp(),
        reviewedAt: null,
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Submission failed:', err);
      setError('Failed to submit your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Application Submitted</h1>
          <p className="text-sm text-gray-500">
            Your operator registration request has been submitted successfully.
            You will be notified once your application is reviewed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#558B2F] hover:underline"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-center text-2xl font-extrabold text-gray-900">
          Operator Sign Up Form
        </h1>

        {/* Photo + fields */}
        <div className="mt-8 flex gap-6">
          {/* Photo upload */}
          <div className="relative h-28 w-28 shrink-0">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-lime-100 text-sm text-gray-600 hover:bg-lime-200 transition-colors overflow-hidden"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <span className="font-medium">Add Photo</span>
              )}
            </button>
            {photoPreview && (
              <button
                type="button"
                onClick={removePhoto}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />

          {/* Form fields */}
          <div className="flex-1 space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleInput}
                className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Telephone number</label>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleInput}
                className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Mobile number</label>
              <input
                name="mobileNumber"
                value={form.mobileNumber}
                onChange={handleInput}
                className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Email address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleInput}
                className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                rows={2}
                className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 resize-none focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
              />
            </div>
          </div>
        </div>

        {/* Required documents section */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900">Required Documents</h2>
          <p className="mt-2 text-sm text-gray-500">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>

          <h3 className="mt-4 text-sm font-bold text-gray-900">List of required documents:</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-gray-600 space-y-0.5">
            {REQUIRED_DOCUMENTS.map((doc, i) => (
              <li key={i}>{doc}</li>
            ))}
          </ul>
        </div>

        {/* File upload area */}
        <div className="mt-6 flex gap-4">
          {/* Drop zone */}
          <div
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex w-48 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#558B2F] p-6 text-center"
          >
            <Upload size={24} className="text-gray-400" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 rounded-full bg-[#558B2F] px-4 py-1 text-xs font-semibold text-white hover:bg-[#4a7a28] transition-colors"
            >
              Browse
            </button>
            <p className="mt-1 text-xs text-gray-400">Drop a file here</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Uploaded files list */}
          <div className="flex-1 rounded-xl border border-gray-200 divide-y divide-gray-100">
            {documents.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">
                No files uploaded yet.
              </p>
            ) : (
              documents.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileImage size={16} className="shrink-0 text-teal-600" />
                    <span className="truncate text-sm text-gray-700">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument(i)}
                    className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-4 text-center text-sm text-red-500">{error}</p>
        )}

        {/* Submit button */}
        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#558B2F] px-10 py-2.5 text-sm font-bold text-white hover:bg-[#4a7a28] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}
