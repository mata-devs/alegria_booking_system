'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, Plus, Trash2, TriangleAlert, User } from 'lucide-react';
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

type Status =
  | { type: 'idle' }
  | { type: 'saving' }
  | { type: 'success'; msg: string }
  | { type: 'error'; msg: string };

type PaymentMethodKey = 'gcash' | 'maya' | 'credit_debit_card' | 'bank_transfer';

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
  { key: 'gcash', label: 'GCash (e-Wallet)' },
  { key: 'maya', label: 'Maya (e-Wallet)' },
  { key: 'credit_debit_card', label: 'Credit/Debit Card (bank)' },
  { key: 'bank_transfer', label: 'Bank Transfer' },
];

const LABEL = 'block text-[11px] font-semibold uppercase tracking-wide text-gray-500';
const INPUT =
  'mt-1.5 h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F] disabled:cursor-not-allowed disabled:opacity-60';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 h-10 rounded-md bg-[#558B2F] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#4a7a28] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

function newOption(): PaymentOption {
  return {
    id: crypto.randomUUID(),
    method: 'gcash',
    accountName: '',
    accountNumber: '',
    qrCodeUrl: null,
    qrFile: null,
    qrPreview: null,
    status: { type: 'idle' },
  };
}

export default function OperatorSettingsPage() {
  const { authState } = useAuth();
  const photoFileRef = useRef<HTMLInputElement | null>(null);
  const qrRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '' });
  const [profileStatus, setProfileStatus] = useState<Status>({ type: 'idle' });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStatus, setPasswordStatus] = useState<Status>({ type: 'idle' });

  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);

  useEffect(() => {
    if (authState.status !== 'authenticated') return;
    setProfile({
      firstName: authState.profile.firstName ?? '',
      lastName: authState.profile.lastName ?? '',
      email: authState.profile.email ?? '',
    });
    if (authState.user.photoURL) setPhotoPreview(authState.user.photoURL);

    getDoc(doc(firebaseDb, 'users', authState.user.uid)).then((snap) => {
      if (!snap.exists()) return;
      const stored = (
        snap.data().paymentOptions as Array<{
          id: string;
          method: PaymentMethodKey;
          accountName: string;
          accountNumber: string;
          qrCodeUrl: string | null;
        }>
      ) ?? [];
      setPaymentOptions(
        stored.map((o) => ({
          ...o,
          qrFile: null,
          qrPreview: o.qrCodeUrl,
          status: { type: 'idle' },
        }))
      );
    });
  }, [authState]);

  const onPickPhoto = () => photoFileRef.current?.click();

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authState.status !== 'authenticated') return;
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
      });

      try { sessionStorage.removeItem('sc_auth_v1'); } catch {}
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

  const onAddOption = () => setPaymentOptions((opts) => [...opts, newOption()]);

  const onRemoveOption = async (id: string) => {
    if (authState.status !== 'authenticated') return;
    const remaining = paymentOptions.filter((o) => o.id !== id);
    setPaymentOptions(remaining);
    const toStore = remaining.map(({ id: oid, method, accountName, accountNumber, qrCodeUrl }) => ({
      id: oid, method, accountName, accountNumber, qrCodeUrl: qrCodeUrl ?? null,
    }));
    try {
      await updateDoc(doc(firebaseDb, 'users', authState.user.uid), { paymentOptions: toStore });
    } catch (err) {
      console.error('Failed to remove payment option:', err);
    }
  };

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
        const path = `users/${uid}/payment-qr/${opt.id}.${ext}`;
        const ref = storageRef(firebaseStorage, path);
        await uploadBytes(ref, opt.qrFile);
        qrCodeUrl = await getDownloadURL(ref);
      }

      const toStore = snapshot.map((o) => ({
        id: o.id,
        method: o.id === id ? opt.method : o.method,
        accountName: o.id === id ? opt.accountName : o.accountName,
        accountNumber: o.id === id ? opt.accountNumber : o.accountNumber,
        qrCodeUrl: o.id === id ? (qrCodeUrl ?? null) : (o.qrCodeUrl ?? null),
      }));

      await updateDoc(doc(firebaseDb, 'users', uid), { paymentOptions: toStore });
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

  const loading = authState.status === 'loading';

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-16">
      {/* Profile Information */}
      <SettingsSection
        title="Profile Information"
        description="Update your account's profile information and email address."
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
              onRemove={() => onRemoveOption(opt.id)}
            />
          ))}

          <button
            type="button"
            onClick={onAddOption}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#558B2F] transition-colors"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add payment option
          </button>
        </div>
      </SettingsSection>
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
  onRemove,
}: {
  option: PaymentOption;
  index: number;
  qrRef: (el: HTMLInputElement | null) => void;
  onChange: (patch: Partial<PaymentOption>) => void;
  onQrChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPickQr: () => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-700">Payment Option {index + 1}</h3>
        <button
          type="button"
          onClick={onRemove}
          title="Remove"
          className="text-gray-300 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <label className={LABEL}>Payment Method</label>
          <select
            value={option.method}
            onChange={(e) => onChange({ method: e.target.value as PaymentMethodKey })}
            className="mt-1.5 h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F]"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
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
