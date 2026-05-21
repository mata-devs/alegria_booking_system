'use client';

import { Suspense, useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import { collection, addDoc, serverTimestamp, doc, getDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseDb, firebaseStorage } from '@/app/lib/firebase';
import { Upload, X, FileImage, ArrowLeft, ShieldX, Check, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PhPhoneInput } from '@/app/components/ui/PhPhoneInput';
import { PhLandlineInput } from '@/app/components/ui/PhLandlineInput';
import { isValidPhE164, PH_PHONE_INVALID_MSG } from '@/app/lib/ph-phone';
import { isValidLandlineE164, PH_LANDLINE_INVALID_MSG } from '@/app/lib/ph-landline';
import { blurUnlessPhoneSibling } from '@/app/lib/phone-field-blur';

const LocationPicker = dynamic(() => import('@/app/components/LocationPicker'), { ssr: false });

interface FormData {
  name: string;
  companyName: string;
  phoneNumber: string;
  mobileNumber: string;
  email: string;
  address: string;
  lat: number | null;
  lng: number | null;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const DOCUMENT_SLOTS = [
  { id: 'validId', label: 'Valid ID (Government-issued)' },
  { id: 'businessPermit', label: 'Business Permit / Registration' },
  { id: 'proofOfAddress', label: 'Proof of Address' },
  { id: 'tin', label: 'Tax Identification Certificate' },
] as const;

type DocSlotId = (typeof DOCUMENT_SLOTS)[number]['id'];

const INITIAL_DOC_SLOTS: Record<DocSlotId, File | null> = {
  validId: null,
  businessPermit: null,
  proofOfAddress: null,
  tin: null,
};

const DOT_CERT_LABEL = 'DOT Accreditation Certificate (optional)';
const DOT_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const DOT_MAX_SIZE = 5 * 1024 * 1024;

const STEPS = ['Business info', 'Location', 'Documents'] as const;

function countFilledSlots(slots: Record<DocSlotId, File | null>): number {
  return DOCUMENT_SLOTS.filter((s) => slots[s.id] != null).length;
}

function DocumentUploadSlot({
  label,
  optional,
  file,
  onFile,
  onClear,
  onReject,
  inputId,
  maxBytes = MAX_FILE_SIZE,
}: {
  label: string;
  optional?: boolean;
  file: File | null;
  onFile: (file: File) => void;
  onClear: () => void;
  onReject?: (message: string) => void;
  inputId: string;
  maxBytes?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function acceptFile(raw: File) {
    if (!ALLOWED_TYPES.includes(raw.type)) {
      onReject?.('Use PDF, JPG, or PNG.');
      return;
    }
    if (raw.size > maxBytes) {
      onReject?.(`File must be under ${Math.round(maxBytes / (1024 * 1024))}MB.`);
      return;
    }
    onFile(raw);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        optional ? 'border-amber-100 bg-amber-50/40' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            PDF, JPG, or PNG — max {MAX_FILE_SIZE_MB}MB
            {optional ? ' · Not required' : ''}
          </p>
        </div>
        {file && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            <Check size={12} />
            Uploaded
          </span>
        )}
      </div>

      {file ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <FileImage size={16} className="shrink-0 text-teal-600" />
            <span className="truncate text-sm text-gray-700">{file.name}</span>
          </div>
          <button
            type="button"
            title={`Remove ${file.name}`}
            aria-label={`Remove ${file.name}`}
            onClick={onClear}
            className="shrink-0 text-red-400 hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="mt-3 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#558B2F]/50 px-4 py-5 text-center"
        >
          <Upload size={20} className="text-gray-400" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 rounded-full bg-[#558B2F] px-4 py-1 text-xs font-semibold text-white hover:bg-[#4a7a28]"
          >
            Upload file
          </button>
          <p className="mt-1 text-xs text-gray-400">or drop here</p>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleChange}
          />
        </div>
      )}
    </div>
  );
}

export default function OperatorSignUpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>Loading…</p></div>}>
      <OperatorSignUpContent />
    </Suspense>
  );
}

function OperatorSignUpContent() {
  const searchParams = useSearchParams();
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState<FormData>({
    name: '',
    companyName: '',
    phoneNumber: '',
    mobileNumber: '',
    email: '',
    address: '',
    lat: null,
    lng: null,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [docSlots, setDocSlots] = useState<Record<DocSlotId, File | null>>(INITIAL_DOC_SLOTS);
  const [dotCert, setDotCert] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTakenError, setEmailTakenError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [phoneErrors, setPhoneErrors] = useState<{ phoneNumber?: string; mobileNumber?: string }>({});
  const [phonesTouched, setPhonesTouched] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function validateToken() {
      const token = searchParams.get('token');
      if (!token) {
        setTokenValid(false);
        return;
      }
      try {
        const snap = await getDoc(doc(firebaseDb, 'app_config', 'operator_signup_link'));
        if (snap.exists() && snap.data().token === token) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
      } catch {
        setTokenValid(false);
      }
    }
    validateToken();
  }, [searchParams]);

  function handleInput(e: ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'email') setEmailTakenError(null);
  }

  async function checkEmailAvailable(email: string): Promise<boolean> {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return true;
    setCheckingEmail(true);
    try {
      const [reqSnap, userSnap] = await Promise.all([
        getDocs(query(collection(firebaseDb, 'operator_signup_requests'), where('email', '==', trimmed))),
        getDocs(query(collection(firebaseDb, 'users'), where('email', '==', trimmed))),
      ]);

      const hasActiveRequest = reqSnap.docs.some((d) => {
        const s = d.data().status;
        return s === 'pending' || s === 'approved';
      });

      if (hasActiveRequest) {
        setEmailTakenError('An application with this email already exists.');
        return false;
      }
      if (!userSnap.empty) {
        setEmailTakenError('An account with this email already exists.');
        return false;
      }
      setEmailTakenError(null);
      return true;
    } catch {
      return true;
    } finally {
      setCheckingEmail(false);
    }
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError(`Photo must be under ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setError(null);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  }

  function setSlotFile(id: DocSlotId, file: File) {
    setError(null);
    setDocSlots((prev) => ({ ...prev, [id]: file }));
  }

  function clearSlot(id: DocSlotId) {
    setDocSlots((prev) => ({ ...prev, [id]: null }));
  }

  function handleDotCertFile(file: File) {
    if (!DOT_ALLOWED_TYPES.includes(file.type)) {
      setError('DOT certificate must be PDF, JPG, or PNG.');
      return;
    }
    if (file.size > DOT_MAX_SIZE) {
      setError('DOT certificate must be under 5MB.');
      return;
    }
    setError(null);
    setDotCert(file);
  }

  function validatePhones(): { phoneNumber?: string; mobileNumber?: string; formError?: string } {
    const errs: { phoneNumber?: string; mobileNumber?: string } = {};
    const phoneFilled = form.phoneNumber.trim().length > 0;
    const mobileFilled = form.mobileNumber.trim().length > 0;

    if (phoneFilled && !isValidLandlineE164(form.phoneNumber)) {
      errs.phoneNumber = PH_LANDLINE_INVALID_MSG;
    }
    if (mobileFilled && !isValidPhE164(form.mobileNumber)) {
      errs.mobileNumber = PH_PHONE_INVALID_MSG;
    }
    if (!phoneFilled && !mobileFilled) {
      return { ...errs, formError: 'Please provide at least one contact number (telephone or mobile).' };
    }
    const hasValid =
      (phoneFilled && isValidLandlineE164(form.phoneNumber)) ||
      (mobileFilled && isValidPhE164(form.mobileNumber));
    if (!hasValid) {
      return {
        ...errs,
        formError: 'Enter at least one valid landline or mobile number.',
      };
    }
    return errs;
  }

  function validateStep(target: number): string | null {
    if (target >= 2) {
      if (!form.name.trim() || !form.companyName.trim() || !form.email.trim()) {
        return 'Name, company name, and email are required.';
      }
      const phoneResult = validatePhones();
      setPhoneErrors(phoneResult);
      setPhonesTouched(true);
      if (phoneResult.formError) return phoneResult.formError;
      if (phoneResult.phoneNumber || phoneResult.mobileNumber) {
        return 'Fix telephone or mobile number before continuing.';
      }
    }
    if (target >= 3) {
      if (!form.address.trim()) {
        return 'Please enter or select your business address.';
      }
      if (form.lat == null || form.lng == null) {
        return 'Tap the map or search an address to confirm your location pin.';
      }
    }
    return null;
  }

  async function goNext() {
    setError(null);
    const msg = validateStep(step + 1);
    if (msg) {
      setError(msg);
      return;
    }
    if (step === 1 && form.email.trim()) {
      const ok = await checkEmailAvailable(form.email);
      if (!ok) return;
    }
    setStep((s) => Math.min(3, s + 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const msg = validateStep(3);
    if (msg) {
      setError(msg);
      setStep(msg.includes('map') || msg.includes('address') ? 2 : 1);
      return;
    }

    const missing = DOCUMENT_SLOTS.filter((s) => !docSlots[s.id]);
    if (missing.length > 0) {
      setError(`Upload all required documents (${countFilledSlots(docSlots)}/4 done). Missing: ${missing[0].label}`);
      setStep(3);
      return;
    }

    const emailAvailable = await checkEmailAvailable(form.email);
    if (!emailAvailable) {
      setStep(1);
      return;
    }

    setSubmitting(true);

    try {
      const tempId = crypto.randomUUID();

      let photoUrl: string | null = null;
      if (photo) {
        const photoRef = ref(firebaseStorage, `signup-requests/${tempId}/photo.jpg`);
        await uploadBytes(photoRef, photo);
        photoUrl = await getDownloadURL(photoRef);
      }

      const uploadedDocs: { name: string; url: string }[] = [];

      if (dotCert) {
        const dotRef = ref(firebaseStorage, `signup-requests/${tempId}/documents/${dotCert.name}`);
        await uploadBytes(dotRef, dotCert);
        uploadedDocs.push({ name: DOT_CERT_LABEL, url: await getDownloadURL(dotRef) });
      }

      for (const slot of DOCUMENT_SLOTS) {
        const file = docSlots[slot.id]!;
        const docRef = ref(firebaseStorage, `signup-requests/${tempId}/documents/${slot.id}-${file.name}`);
        await uploadBytes(docRef, file);
        uploadedDocs.push({ name: slot.label, url: await getDownloadURL(docRef) });
      }

      await addDoc(collection(firebaseDb, 'operator_signup_requests'), {
        applicantId: `I${tempId.replace(/-/g, '').slice(0, 5).toUpperCase()}`,
        name: form.name,
        companyName: form.companyName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        mobileNumber: form.mobileNumber,
        address: form.address,
        ...(form.lat != null && form.lng != null ? { lat: form.lat, lng: form.lng } : {}),
        photoUrl,
        documents: uploadedDocs,
        status: 'pending',
        submittedAt: serverTimestamp(),
        reviewedAt: null,
      });

      await deleteDoc(doc(firebaseDb, 'app_config', 'operator_signup_link'));
      setSubmitted(true);
    } catch (err) {
      console.error('Submission failed:', err);
      setError('Failed to submit your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const filledCount = countFilledSlots(docSlots);

  if (tokenValid === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Validating link…</p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Invalid or Expired Link</h1>
          <p className="text-sm text-gray-500">
            This application link is no longer valid. Please contact the administrator
            to request a new link.
          </p>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#558B2F] hover:underline">
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </div>
    );
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
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#558B2F] hover:underline">
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-100 px-3 py-8 sm:items-center sm:px-4 sm:py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-8"
      >
        <h1 className="text-center text-2xl font-extrabold text-gray-900">Operator Sign Up</h1>

        {/* Step progress */}
        <div className="mt-6">
          <p className="text-center text-xs font-medium text-gray-500">
            Step {step} of 3 · {STEPS[step - 1]}
          </p>
          <div className="mt-2 flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-[#558B2F]' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <>
            <p className="mt-4 text-sm text-gray-600">
              Tell us about your business. You can add a logo now or skip it.
            </p>
            <div className="mt-6 flex gap-4 sm:gap-6">
              <div className="relative mt-2 h-24 w-24 shrink-0 sm:h-28 sm:w-28">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-lime-100 text-sm text-gray-600 hover:bg-lime-200 overflow-hidden"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-center font-medium leading-tight px-1">Add Logo</span>
                  )}
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    title="Remove photo"
                    aria-label="Remove photo"
                    onClick={removePhoto}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" aria-label="Upload profile photo" className="hidden" onChange={handlePhotoChange} />
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <label htmlFor="signup-name" className="text-xs font-semibold text-gray-700">Name</label>
                  <input id="signup-name" name="name" required value={form.name} onChange={handleInput} className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]" />
                </div>
                <div>
                  <label htmlFor="signup-company" className="text-xs font-semibold text-gray-700">Company / Agency Name</label>
                  <input id="signup-company" name="companyName" required value={form.companyName} onChange={handleInput} className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]" />
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <p className="text-xs text-gray-500">
                Landline (02 / provincial) or mobile (09). At least one required. Stored as +63.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PhLandlineInput
                  id="signup-phone"
                  label="Telephone number (landline)"
                  valueE164={form.phoneNumber}
                  onChangeE164={(v) => {
                    setForm((prev) => ({ ...prev, phoneNumber: v }));
                    if (phonesTouched) setPhoneErrors(validatePhones());
                  }}
                  error={phonesTouched ? phoneErrors.phoneNumber : undefined}
                  onBlur={(e) => {
                    blurUnlessPhoneSibling(e, 'signup-mobile', () => {
                      setPhonesTouched(true);
                      setPhoneErrors(validatePhones());
                    });
                  }}
                />
                <PhPhoneInput
                  id="signup-mobile"
                  label="Mobile number"
                  valueE164={form.mobileNumber}
                  onChangeE164={(v) => {
                    setForm((prev) => ({ ...prev, mobileNumber: v }));
                    if (phonesTouched) setPhoneErrors(validatePhones());
                  }}
                  error={phonesTouched ? phoneErrors.mobileNumber : undefined}
                  onBlur={(e) => {
                    blurUnlessPhoneSibling(e, 'signup-phone', () => {
                      setPhonesTouched(true);
                      setPhoneErrors(validatePhones());
                    });
                  }}
                  accent="signup"
                />
              </div>
              <div>
                <label htmlFor="signup-email" className="text-xs font-semibold text-gray-700">Email address</label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleInput}
                  onBlur={() => { if (form.email.trim()) checkEmailAvailable(form.email); }}
                  className={`mt-0.5 w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 ${emailTakenError ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-gray-300 focus:border-[#558B2F] focus:ring-[#558B2F]'}`}
                />
                {checkingEmail && <p className="mt-0.5 text-xs text-gray-400">Checking…</p>}
                {emailTakenError && <p className="mt-0.5 text-xs text-red-500">{emailTakenError}</p>}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="mt-4 text-sm text-gray-600">
              Search for your address or tap the map to place a pin. We use this for your operator profile location.
            </p>
            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-700">Business address</label>
              <div className="mt-0.5">
                <LocationPicker
                  value={form.address}
                  onChange={(address, lat, lng) => setForm((prev) => ({ ...prev, address, lat, lng }))}
                />
              </div>
            </div>
            {form.lat != null && form.lng != null ? (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-green-100 bg-green-50 px-3 py-2.5 text-sm text-green-900">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#558B2F]" />
                <div>
                  <p className="font-medium">Location confirmed on map</p>
                  <p className="mt-0.5 text-xs text-green-800">
                    {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                  </p>
                </div>
              </div>
            ) : form.address.trim() ? (
              <p className="mt-3 text-xs text-amber-700 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                Address entered — tap the map or pick a search result to set your location pin.
              </p>
            ) : null}
          </>
        )}

        {step === 3 && (
          <>
            <p className="mt-4 text-sm text-gray-600">
              Upload one file per item below. CPTO reviews your full application (all documents together), not only DOT accreditation.
            </p>
            <p className="mt-2 text-xs font-semibold text-gray-700">
              Required documents ({filledCount} of {DOCUMENT_SLOTS.length})
            </p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-[#558B2F] transition-all"
                style={{ width: `${(filledCount / DOCUMENT_SLOTS.length) * 100}%` }}
              />
            </div>
            <div className="mt-4 space-y-3">
              {DOCUMENT_SLOTS.map((slot) => (
                <DocumentUploadSlot
                  key={slot.id}
                  inputId={`doc-slot-${slot.id}`}
                  label={slot.label}
                  file={docSlots[slot.id]}
                  onFile={(f) => setSlotFile(slot.id, f)}
                  onClear={() => clearSlot(slot.id)}
                  onReject={setError}
                />
              ))}
            </div>
            <div className="mt-4">
              <DocumentUploadSlot
                inputId="doc-slot-dot"
                label={DOT_CERT_LABEL}
                optional
                file={dotCert}
                maxBytes={DOT_MAX_SIZE}
                onFile={handleDotCertFile}
                onClear={() => setDotCert(null)}
                onReject={setError}
              />
            </div>
            {step === 3 && filledCount === DOCUMENT_SLOTS.length && (
              <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">Ready to submit</p>
                <p>✓ {DOCUMENT_SLOTS.length} required documents</p>
                <p>{dotCert ? '✓' : '○'} DOT certificate (optional)</p>
              </div>
            )}
          </>
        )}

        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1 rounded-lg bg-[#558B2F] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#4a7a28]"
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || filledCount < DOCUMENT_SLOTS.length}
              className="rounded-lg bg-[#558B2F] px-8 py-2.5 text-sm font-bold text-white hover:bg-[#4a7a28] disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
