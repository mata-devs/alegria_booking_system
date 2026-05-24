'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Eye, Loader2, TriangleAlert, User } from 'lucide-react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { firebaseAuth, firebaseDb, firebaseStorage } from '@/app/lib/firebase';
import { useAuth } from '@/app/context/AuthContext';
import { PhPhoneInput } from '@/app/components/ui/PhPhoneInput';
import { PhLandlineInput } from '@/app/components/ui/PhLandlineInput';
import { isValidPhE164, PH_PHONE_INVALID_MSG, normalizeStoredMobileE164 } from '@/app/lib/ph-phone';
import {
  isValidLandlineE164,
  PH_LANDLINE_INVALID_MSG,
  normalizeStoredLandlineE164,
} from '@/app/lib/ph-landline';
import { blurUnlessPhoneSibling } from '@/app/lib/phone-field-blur';
import { DocumentPreviewDrawer, type PreviewDocument } from '@/app/components/admin/DocumentPreviewDrawer';
import {
  DOT_CERT_LABEL,
  isDotCertDocumentName,
  sortComplianceDocuments,
} from '@/app/lib/operator-signup-documents';

type Status =
  | { type: 'idle' }
  | { type: 'saving' }
  | { type: 'success'; msg: string }
  | { type: 'error'; msg: string };

type PaymentMethodKey = 'gcash_maya' | 'bdo' | 'bpi';

interface PaymentOption {
  id: string;
  method: PaymentMethodKey;
  accountName: string;
  accountNumber: string;
  qrCodeUrl: string | null;
  qrFile: File | null;
  qrPreview: string | null;
  status: Status;
}

const PAYMENT_METHODS: { key: PaymentMethodKey; label: string }[] = [
  { key: 'gcash_maya', label: 'Gcash / Maya' },
  { key: 'bdo', label: 'BDO' },
  { key: 'bpi', label: 'BPI' },
];

const PAYMENT_METHOD_INDEX: Record<PaymentMethodKey, number> = {
  gcash_maya: 0,
  bdo: 1,
  bpi: 2,
};

type StoredPaymentMethod = {
  gcashMayaAccountName?: string;
  gcashMayaAccountNumber?: string;
  gcashMayaImageUrl?: string;
  bdoAccountName?: string;
  bdoAccountNumber?: string;
  bdoImageUrl?: string;
  bpiAccountName?: string;
  bpiAccountNumber?: string;
  bpiImageUrl?: string;
};

const LABEL = 'block text-[11px] font-semibold uppercase tracking-wide text-gray-500';
const READONLY_INPUT =
  'mt-1.5 h-10 w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none';
const INPUT =
  'mt-1.5 h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F] disabled:cursor-not-allowed disabled:opacity-60';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 h-10 rounded-md bg-[#558B2F] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#4a7a28] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

function newOption(method: PaymentMethodKey): PaymentOption {
  return {
    id: method,
    method,
    accountName: '',
    accountNumber: '',
    qrCodeUrl: null,
    qrFile: null,
    qrPreview: null,
    status: { type: 'idle' },
  };
}

function toStoredPaymentMethod(option: PaymentOption): StoredPaymentMethod {
  if (option.method === 'gcash_maya') {
    return {
      gcashMayaAccountName: option.accountName,
      gcashMayaAccountNumber: option.accountNumber,
      gcashMayaImageUrl: option.qrCodeUrl ?? '',
    };
  }
  if (option.method === 'bdo') {
    return {
      bdoAccountName: option.accountName,
      bdoAccountNumber: option.accountNumber,
      bdoImageUrl: option.qrCodeUrl ?? '',
    };
  }
  return {
    bpiAccountName: option.accountName,
    bpiAccountNumber: option.accountNumber,
    bpiImageUrl: option.qrCodeUrl ?? '',
  };
}

function fromStoredPaymentMethods(stored: StoredPaymentMethod[] | undefined): PaymentOption[] {
  return PAYMENT_METHODS.map(({ key }) => {
    const entry = stored?.[PAYMENT_METHOD_INDEX[key]] ?? {};
    if (key === 'gcash_maya') {
      return {
        ...newOption(key),
        accountName: entry.gcashMayaAccountName ?? '',
        accountNumber: entry.gcashMayaAccountNumber ?? '',
        qrCodeUrl: entry.gcashMayaImageUrl ?? null,
        qrPreview: entry.gcashMayaImageUrl ?? null,
      };
    }
    if (key === 'bdo') {
      return {
        ...newOption(key),
        accountName: entry.bdoAccountName ?? '',
        accountNumber: entry.bdoAccountNumber ?? '',
        qrCodeUrl: entry.bdoImageUrl ?? null,
        qrPreview: entry.bdoImageUrl ?? null,
      };
    }
    return {
      ...newOption(key),
      accountName: entry.bpiAccountName ?? '',
      accountNumber: entry.bpiAccountNumber ?? '',
      qrCodeUrl: entry.bpiImageUrl ?? null,
      qrPreview: entry.bpiImageUrl ?? null,
    };
  });
}

type OperatorFile = { name: string; url: string };

export default function OperatorSettingsPage() {
  const { authState } = useAuth();
  const photoFileRef = useRef<HTMLInputElement | null>(null);
  const qrRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    phoneNumber: '',
    mobileNumber: '',
  });
  const [profileStatus, setProfileStatus] = useState<Status>({ type: 'idle' });
  const [phoneErrors, setPhoneErrors] = useState<{ phoneNumber?: string; mobileNumber?: string }>({});

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStatus, setPasswordStatus] = useState<Status>({ type: 'idle' });

  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>(
    PAYMENT_METHODS.map(({ key }) => newOption(key)),
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingOption, setDeletingOption] = useState(false);
  const [customInclusionChips, setCustomInclusionChips] = useState<string[]>([]);
  const [customExclusionChips, setCustomExclusionChips] = useState<string[]>([]);
  const [chipsStatus, setChipsStatus] = useState<Status>({ type: 'idle' });

  const [businessLocation, setBusinessLocation] = useState({
    address: '',
    lat: null as number | null,
    lng: null as number | null,
  });
  const [complianceFiles, setComplianceFiles] = useState<OperatorFile[]>([]);
  const [dotProofUrl, setDotProofUrl] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PreviewDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (authState.status !== 'authenticated') return;
    setProfile((prev) => ({
      ...prev,
      firstName: authState.profile.firstName ?? '',
      lastName: authState.profile.lastName ?? '',
      email: authState.profile.email ?? '',
    }));
    if (authState.user.photoURL) {
      setPhotoPreview(authState.user.photoURL);
    }

    getDoc(doc(firebaseDb, 'users', authState.user.uid)).then(async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as {
        companyName?: string;
        phoneNumber?: string;
        mobileNumber?: string;
        paymentMethods?: StoredPaymentMethod[];
        customInclusionChips?: string[];
        customExclusionChips?: string[];
        profileImage?: string;
        address?: string;
        lat?: number;
        lng?: number;
        files?: OperatorFile[];
        dotProofUrl?: string | null;
      };

      setProfile((prev) => ({
        ...prev,
        companyName: data.companyName ?? '',
        phoneNumber: normalizeStoredLandlineE164(data.phoneNumber ?? ''),
        mobileNumber: normalizeStoredMobileE164(data.mobileNumber ?? ''),
      }));

      setPaymentOptions(fromStoredPaymentMethods(data.paymentMethods));
      setCustomInclusionChips(Array.isArray(data.customInclusionChips) ? data.customInclusionChips : []);
      setCustomExclusionChips(Array.isArray(data.customExclusionChips) ? data.customExclusionChips : []);

      setBusinessLocation({
        address: data.address ?? '',
        lat: typeof data.lat === 'number' ? data.lat : null,
        lng: typeof data.lng === 'number' ? data.lng : null,
      });

      const rawFiles = Array.isArray(data.files)
        ? data.files.filter(
            (f): f is OperatorFile =>
              f != null && typeof f === 'object' && typeof f.name === 'string',
          )
        : [];
      setComplianceFiles(
        sortComplianceDocuments(rawFiles.filter((f) => !isDotCertDocumentName(f.name))),
      );
      const dotFromFiles = rawFiles.find((f) => isDotCertDocumentName(f.name))?.url;
      const resolvedDot =
        typeof data.dotProofUrl === 'string' && data.dotProofUrl.startsWith('http')
          ? data.dotProofUrl
          : typeof dotFromFiles === 'string' && dotFromFiles.startsWith('http')
            ? dotFromFiles
            : null;
      setDotProofUrl(resolvedDot);

      if (authState.user.photoURL) return;

      if (typeof data.profileImage === 'string' && data.profileImage.startsWith('http')) {
        setPhotoPreview(data.profileImage);
        return;
      }

      const uid = authState.user.uid;
      for (const path of [`profile-pictures/${uid}.jpg`, `users/${uid}/avatar.jpg`]) {
        try {
          const url = await getDownloadURL(storageRef(firebaseStorage, path));
          setPhotoPreview(url);
          return;
        } catch {
          // try next path
        }
      }
    });
  }, [authState]);

  function openDocumentPreview(file: { name: string; url: string }) {
    setPreviewDoc({ name: file.name, url: file.url });
    setPreviewOpen(true);
  }

  async function saveCustomChips() {
    if (authState.status !== 'authenticated') return;
    setChipsStatus({ type: 'saving' });
    try {
      await updateDoc(doc(firebaseDb, 'users', authState.user.uid), {
        customInclusionChips,
        customExclusionChips,
      });
      setChipsStatus({ type: 'success', msg: 'Custom chips saved.' });
    } catch {
      setChipsStatus({ type: 'error', msg: 'Failed to save custom chips.' });
    }
  }

  function removeCustomChip(kind: 'inclusion' | 'exclusion', chip: string) {
    if (authState.status !== 'authenticated') return;
    const field = kind === 'inclusion' ? 'customInclusionChips' : 'customExclusionChips';
  const uid = authState.user.uid;

    if (kind === 'inclusion') {
      setCustomInclusionChips((prev) => {
        const next = prev.filter((c) => c !== chip);
        void updateDoc(doc(firebaseDb, 'users', uid), { [field]: next }).catch(() => {
          setChipsStatus({ type: 'error', msg: 'Failed to remove custom chip.' });
        });
        return next;
      });
      return;
    }

    setCustomExclusionChips((prev) => {
      const next = prev.filter((c) => c !== chip);
      void updateDoc(doc(firebaseDb, 'users', uid), { [field]: next }).catch(() => {
        setChipsStatus({ type: 'error', msg: 'Failed to remove custom chip.' });
      });
      return next;
    });
  }

  const onPickPhoto = () => photoFileRef.current?.click();

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setProfileStatus({ type: 'error', msg: 'Only JPEG and PNG images are allowed.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileStatus({ type: 'error', msg: 'Photo must be under 5 MB.' });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  function validateProfilePhones(): { phoneNumber?: string; mobileNumber?: string; formError?: string } {
    const errs: { phoneNumber?: string; mobileNumber?: string } = {};
    const phoneFilled = profile.phoneNumber.trim().length > 0;
    const mobileFilled = profile.mobileNumber.trim().length > 0;

    if (phoneFilled && !isValidLandlineE164(profile.phoneNumber)) {
      errs.phoneNumber = PH_LANDLINE_INVALID_MSG;
    }
    if (mobileFilled && !isValidPhE164(profile.mobileNumber)) {
      errs.mobileNumber = PH_PHONE_INVALID_MSG;
    }
    if (!phoneFilled && !mobileFilled) {
      return { ...errs, formError: 'Provide at least one contact number (landline or mobile).' };
    }
    const hasValid =
      (phoneFilled && isValidLandlineE164(profile.phoneNumber)) ||
      (mobileFilled && isValidPhE164(profile.mobileNumber));
    if (!hasValid) {
      return { ...errs, formError: 'Enter at least one valid landline or mobile number.' };
    }
    return errs;
  }

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authState.status !== 'authenticated') return;

    const phoneResult = validateProfilePhones();
    setPhoneErrors(phoneResult);
    if (phoneResult.formError || phoneResult.phoneNumber || phoneResult.mobileNumber) {
      setProfileStatus({
        type: 'error',
        msg: phoneResult.formError ?? 'Fix telephone or mobile number.',
      });
      return;
    }

    setProfileStatus({ type: 'saving' });
    try {
      const user = authState.user;
      let photoURL = user.photoURL ?? undefined;

      if (photoFile) {
        const ext = photoFile.name.split('.').pop() || 'jpg';
        const path = `users/${user.uid}/avatar.${ext}`;
        const ref = storageRef(firebaseStorage, path);
        await uploadBytes(ref, photoFile);
        photoURL = await getDownloadURL(ref);
      }

      const displayName = `${profile.firstName} ${profile.lastName}`.trim();
      await updateProfile(user, { displayName, photoURL: photoURL ?? null });
      await updateDoc(doc(firebaseDb, 'users', user.uid), {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber.trim(),
        mobileNumber: profile.mobileNumber.trim(),
        ...(photoURL ? { profileImage: photoURL } : {}),
      });

      try { sessionStorage.removeItem('vc_auth_v1'); } catch {}
      setPhotoFile(null);
      setProfileStatus({ type: 'success', msg: 'Profile updated.' });
    } catch (err) {
      setProfileStatus({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Failed to update profile.',
      });
    }
  };

  const onSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authState.status !== 'authenticated') return;

    if (passwords.newPassword.length < 8) {
      setPasswordStatus({ type: 'error', msg: 'New password must be at least 8 characters.' });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordStatus({ type: 'error', msg: 'Passwords do not match.' });
      return;
    }

    setPasswordStatus({ type: 'saving' });
    try {
      const user = firebaseAuth.currentUser;
      if (!user || !user.email) throw new Error('No authenticated user.');
      const credential = EmailAuthProvider.credential(user.email, passwords.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwords.newPassword);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStatus({ type: 'success', msg: 'Password updated.' });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      let msg = 'Failed to update password.';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') msg = 'Current password is incorrect.';
      else if (code === 'auth/weak-password') msg = 'New password is too weak.';
      else if (code === 'auth/requires-recent-login') msg = 'Sign in again and retry.';
      else if (err instanceof Error) msg = err.message;
      setPasswordStatus({ type: 'error', msg });
    }
  };

  const updateOption = (id: string, patch: Partial<PaymentOption>) =>
    setPaymentOptions((opts) => opts.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const onQrChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateOption(id, { qrFile: file, qrPreview: URL.createObjectURL(file) });
  };

  const onSaveOption = async (id: string) => {
    if (authState.status !== 'authenticated') return;
    const opt = paymentOptions.find((o) => o.id === id);
    if (!opt) return;
    const snapshot = [...paymentOptions];

    updateOption(id, { status: { type: 'saving' } });
    try {
      const uid = authState.user.uid;
      let qrCodeUrl = opt.qrCodeUrl;

      if (opt.qrFile) {
        const ext = opt.qrFile.name.split('.').pop() || 'jpg';
        const path = `users/${uid}/payment-qr/${opt.method}.${ext}`;
        const ref = storageRef(firebaseStorage, path);
        await uploadBytes(ref, opt.qrFile);
        qrCodeUrl = await getDownloadURL(ref);
      }

      const toStore = snapshot.map((o) =>
        toStoredPaymentMethod({
          ...o,
          accountName: o.id === id ? opt.accountName : o.accountName,
          accountNumber: o.id === id ? opt.accountNumber : o.accountNumber,
          qrCodeUrl: o.id === id ? (qrCodeUrl ?? null) : (o.qrCodeUrl ?? null),
        }),
      );

      await updateDoc(doc(firebaseDb, 'users', uid), { paymentMethods: toStore });
      updateOption(id, {
        qrCodeUrl,
        qrFile: null,
        status: { type: 'success', msg: 'Payment option saved.' },
      });
    } catch (err) {
      updateOption(id, {
        status: {
          type: 'error',
          msg: err instanceof Error ? err.message : 'Failed to save.',
        },
      });
    }
  };

  const onDeleteOption = async (id: string) => {
    if (authState.status !== 'authenticated') return;
    const uid = authState.user.uid;

    const nextOptions = paymentOptions.map((option) =>
      option.id === id
        ? {
            ...option,
            accountName: '',
            accountNumber: '',
            qrCodeUrl: null,
            qrFile: null,
            qrPreview: null,
            status: { type: 'idle' as const },
          }
        : option,
    );

    setDeletingOption(true);
    try {
      const toStore = nextOptions.map((option) => toStoredPaymentMethod(option));
      await updateDoc(doc(firebaseDb, 'users', uid), { paymentMethods: toStore });
      setPaymentOptions(nextOptions);
      setDeleteConfirmId(null);
    } catch (err) {
      updateOption(id, {
        status: {
          type: 'error',
          msg: err instanceof Error ? err.message : 'Failed to delete payment option.',
        },
      });
    } finally {
      setDeletingOption(false);
    }
  };

  const loading = authState.status === 'loading';

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-16">
      {/* Profile Information */}
      <SettingsSection
        title="Profile Information"
        description="Update your profile, contact numbers, and photo."
      >
        <form onSubmit={onSaveProfile} className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-5 space-y-5">
            <div>
              <span className={LABEL}>Photo</span>
              <div className="mt-2 flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border border-gray-200 bg-gray-100 shrink-0">
                  {photoPreview ? (
                    <Image
                      src={photoPreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                      width={80}
                      height={80}
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <User className="h-8 w-8" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={onPickPhoto}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-[#558B2F] hover:text-[#558B2F]"
                  >
                    <Camera className="h-3.5 w-3.5" strokeWidth={2} />
                    {photoPreview ? 'Change photo' : 'Upload photo'}
                  </button>
                  <p className="mt-1.5 text-[11px] text-gray-400">PNG or JPG, up to 5MB.</p>
                </div>
                <input
                  ref={photoFileRef}
                  type="file"
                  accept="image/*"
                  onChange={onPhotoChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>First Name</label>
                <input
                  value={profile.firstName}
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  type="text"
                  disabled={loading}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Last Name</label>
                <input
                  value={profile.lastName}
                  onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  type="text"
                  disabled={loading}
                  className={INPUT}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PhLandlineInput
                id="settings-phone"
                label="Telephone"
                labelClassName={LABEL}
                valueE164={profile.phoneNumber}
                onChangeE164={(v) => {
                  setProfile((p) => ({ ...p, phoneNumber: v }));
                  setPhoneErrors(validateProfilePhones());
                }}
                error={phoneErrors.phoneNumber}
                onBlur={(e) =>
                  blurUnlessPhoneSibling(e, 'settings-mobile', () =>
                    setPhoneErrors(validateProfilePhones()),
                  )
                }
              />
              <PhPhoneInput
                id="settings-mobile"
                label="Mobile Number"
                labelClassName={LABEL}
                valueE164={profile.mobileNumber}
                onChangeE164={(v) => {
                  setProfile((p) => ({ ...p, mobileNumber: v }));
                  setPhoneErrors(validateProfilePhones());
                }}
                error={phoneErrors.mobileNumber}
                onBlur={(e) =>
                  blurUnlessPhoneSibling(e, 'settings-phone', () =>
                    setPhoneErrors(validateProfilePhones()),
                  )
                }
                accent="signup"
              />
            </div>
            <p className="text-[11px] text-gray-400 -mt-2">
              At least one valid number required. Metro 02 8XXX XXXX or provincial 0XX XXX XXXX for landline; 9XX for mobile.
            </p>

            <div>
              <label className={LABEL}>Company Name</label>
              <input
                value={profile.companyName}
                type="text"
                readOnly
                className="mt-1.5 h-10 w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none"
              />
              <p className="mt-1 text-[11px] text-gray-400">Company name is set by admin and cannot be changed here.</p>
            </div>

            <div>
              <label className={LABEL}>Email</label>
              <input
                value={profile.email}
                type="email"
                readOnly
                className="mt-1.5 h-10 w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none"
              />
              <p className="mt-1 text-[11px] text-gray-400">Contact support to change your email.</p>
            </div>
          </div>

          <StatusLine status={profileStatus} />

          <div className="flex justify-end border-t border-gray-100 px-6 py-4">
            <button
              type="submit"
              disabled={profileStatus.type === 'saving' || loading}
              className={BTN_PRIMARY}
            >
              {profileStatus.type === 'saving' ? (
                <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />Saving</>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </SettingsSection>

      <SettingsSection
        title="Business Location"
        description="Registered business address from your operator application."
      >
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className={LABEL}>Address</label>
              <input
                value={businessLocation.address || '—'}
                type="text"
                readOnly
                className={READONLY_INPUT}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Latitude</label>
                <input
                  value={businessLocation.lat != null ? String(businessLocation.lat) : '—'}
                  type="text"
                  readOnly
                  className={READONLY_INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Longitude</label>
                <input
                  value={businessLocation.lng != null ? String(businessLocation.lng) : '—'}
                  type="text"
                  readOnly
                  className={READONLY_INPUT}
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              Location details are set during registration and cannot be changed here.
            </p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Registration Documents"
        description="Compliance documents submitted with your operator application."
      >
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="divide-y divide-gray-100">
            {complianceFiles.length === 0 ? (
              <p className="px-6 py-5 text-sm text-gray-400">No registration documents on file.</p>
            ) : (
              complianceFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between gap-3 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-[11px] text-gray-400">Submitted at registration</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDocumentPreview(file)}
                    disabled={!file.url}
                    title={file.url ? 'View document' : 'Document unavailable'}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-600 transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Eye className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </SettingsSection>

      {dotProofUrl ? (
        <SettingsSection
          title="DOT Accreditation"
          description="Optional accreditation certificate from your registration."
        >
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 px-6 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{DOT_CERT_LABEL}</p>
                <p className="text-[11px] text-gray-400">
                  Submitted during registration — cannot be modified
                </p>
              </div>
              <button
                type="button"
                onClick={() => openDocumentPreview({ name: DOT_CERT_LABEL, url: dotProofUrl })}
                title="View DOT accreditation"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-600 transition-colors hover:bg-teal-100"
              >
                <Eye className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </SettingsSection>
      ) : null}

      {/* Update Password */}
      <SettingsSection
        title="Update Password"
        description="Ensure your account is using a long, random password to stay secure."
      >
        <form onSubmit={onSavePassword} className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className={LABEL}>Current Password</label>
              <input
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                type="password"
                autoComplete="current-password"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>New Password</label>
              <input
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                type="password"
                autoComplete="new-password"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Confirm Password</label>
              <input
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                type="password"
                autoComplete="new-password"
                className={INPUT}
              />
            </div>
          </div>

          <StatusLine status={passwordStatus} />

          <div className="flex justify-end border-t border-gray-100 px-6 py-4">
            <button
              type="submit"
              disabled={passwordStatus.type === 'saving' || loading}
              className={BTN_PRIMARY}
            >
              {passwordStatus.type === 'saving' ? (
                <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />Saving</>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </SettingsSection>

      {/* Payment Options */}
      <SettingsSection
        title="Payment Options"
        description="Choose a preferred way for guests to pay for their reservation."
      >
        <div className="space-y-4">
          {paymentOptions.map((opt, idx) => (
            <PaymentOptionCard
              key={opt.id}
              option={opt}
              index={idx}
              qrRef={(el) => {
                if (el) qrRefs.current.set(opt.id, el);
                else qrRefs.current.delete(opt.id);
              }}
              onChange={(patch) => updateOption(opt.id, patch)}
              onQrChange={(e) => onQrChange(opt.id, e)}
              onPickQr={() => qrRefs.current.get(opt.id)?.click()}
              onSave={() => onSaveOption(opt.id)}
              onDelete={() => setDeleteConfirmId(opt.id)}
            />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="My Custom Chips"
        description="Manage inclusion and exclusion chips available when editing your listings."
      >
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-5 space-y-5">
          <div>
            <p className={LABEL}>Custom inclusion chips</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {customInclusionChips.length === 0 ? (
                <p className="text-xs text-gray-400">None yet — add from a listing edit modal.</p>
              ) : (
                customInclusionChips.map((chip) => (
                  <span key={chip} className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs text-green-800">
                    {chip}
                    <button type="button" onClick={() => removeCustomChip('inclusion', chip)} className="text-green-600 hover:text-red-600">×</button>
                  </span>
                ))
              )}
            </div>
          </div>
          <div>
            <p className={LABEL}>Custom exclusion chips</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {customExclusionChips.length === 0 ? (
                <p className="text-xs text-gray-400">None yet — add from a listing edit modal.</p>
              ) : (
                customExclusionChips.map((chip) => (
                  <span key={chip} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                    {chip}
                    <button type="button" onClick={() => removeCustomChip('exclusion', chip)} className="text-gray-500 hover:text-red-600">×</button>
                  </span>
                ))
              )}
            </div>
          </div>
          <StatusLine status={chipsStatus} />
          <div className="flex justify-end">
            <button type="button" onClick={() => void saveCustomChips()} className={BTN_PRIMARY}>
              Save custom chips
            </button>
          </div>
        </div>
      </SettingsSection>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">Delete payment option?</h3>
              <p className="mt-1 text-sm text-gray-500">
                This clears account name, account number, and QR code for this payment method.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deletingOption}
                className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onDeleteOption(deleteConfirmId)}
                disabled={deletingOption}
                className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {deletingOption ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DocumentPreviewDrawer
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        document={previewDoc}
      />
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <div className="lg:col-span-2">{children}</div>
    </div>
  );
}

function PaymentOptionCard({
  option,
  index,
  qrRef,
  onChange,
  onQrChange,
  onPickQr,
  onSave,
  onDelete,
}: {
  option: PaymentOption;
  index: number;
  qrRef: (el: HTMLInputElement | null) => void;
  onChange: (patch: Partial<PaymentOption>) => void;
  onQrChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPickQr: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const methodLabel = PAYMENT_METHODS.find((m) => m.key === option.method)?.label ?? option.method;
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-700">Payment Option {index + 1}</h3>
        <span className="text-xs font-semibold text-[#558B2F]">{methodLabel}</span>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <label className={LABEL}>Payment Method</label>
          <input
            type="text"
            readOnly
            value={methodLabel}
            className="mt-1.5 h-10 w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 text-sm font-semibold text-gray-600 outline-none"
          />
        </div>

        <div>
          <label className={LABEL}>Account Name</label>
          <input
            value={option.accountName}
            onChange={(e) => onChange({ accountName: e.target.value })}
            type="text"
            className={INPUT}
          />
        </div>

        <div>
          <label className={LABEL}>Account Number</label>
          <input
            value={option.accountNumber}
            onChange={(e) => onChange({ accountNumber: e.target.value })}
            type="text"
            className={INPUT}
          />
        </div>

        <div>
          <label className={LABEL}>Upload QR Code</label>
          <div className="mt-1.5 space-y-2">
            {option.qrPreview && (
              <div className="h-28 w-28 overflow-hidden rounded-lg border border-gray-200">
                <Image
                  src={option.qrPreview}
                  alt="QR code"
                  width={112}
                  height={112}
                  className="h-full w-full object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onPickQr}
                className="inline-flex items-center rounded-md bg-[#558B2F] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#4a7a28]"
              >
                Choose File
              </button>
              <span className="text-xs text-gray-400">
                {option.qrFile
                  ? '1 file selected'
                  : option.qrCodeUrl
                  ? '1 file uploaded'
                  : 'No file chosen'}
              </span>
            </div>
            <input
              ref={qrRef}
              type="file"
              accept="image/*"
              onChange={onQrChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <StatusLine status={option.status} />

      <div className="flex justify-end border-t border-gray-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            disabled={option.status.type === 'saving'}
            className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={option.status.type === 'saving'}
            className={BTN_PRIMARY}
          >
            {option.status.type === 'saving' ? (
              <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />Saving</>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.type === 'idle' || status.type === 'saving') return null;
  const isSuccess = status.type === 'success';
  const cls = isSuccess
    ? 'border-green-200 bg-green-50 text-green-700'
    : 'border-red-200 bg-red-50 text-red-700';
  const Icon = isSuccess ? Check : TriangleAlert;
  return (
    <div className={`mx-5 mb-3 flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${cls}`}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span>{status.msg}</span>
    </div>
  );
}
