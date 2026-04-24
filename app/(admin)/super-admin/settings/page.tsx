'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, TriangleAlert, User } from 'lucide-react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { firebaseAuth, firebaseDb, firebaseStorage } from '@/app/lib/firebase';
import { useAuth } from '@/app/context/AuthContext';

type Status =
  | { type: 'idle' }
  | { type: 'saving' }
  | { type: 'success'; msg: string }
  | { type: 'error'; msg: string };

const LABEL = 'block text-[11px] font-semibold uppercase tracking-wide text-gray-500';
const INPUT =
  'mt-1.5 h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F] disabled:cursor-not-allowed disabled:opacity-60';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 h-10 rounded-md bg-[#558B2F] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#4a7a28] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

export default function SuperAdminSettingsPage() {
  const { authState } = useAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [profileStatus, setProfileStatus] = useState<Status>({ type: 'idle' });
  const [passwordStatus, setPasswordStatus] = useState<Status>({ type: 'idle' });

  useEffect(() => {
    if (authState.status !== 'authenticated') return;
    setProfile({
      firstName: authState.profile.firstName ?? '',
      lastName: authState.profile.lastName ?? '',
      email: authState.profile.email ?? '',
    });
    const current = authState.user.photoURL;
    if (current) setPhotoPreview(current);
  }, [authState]);

  const onPickPhoto = () => fileRef.current?.click();

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
        const fileRefStorage = storageRef(firebaseStorage, path);
        await uploadBytes(fileRefStorage, photoFile);
        photoURL = await getDownloadURL(fileRefStorage);
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
      setPasswordStatus({ type: 'error', msg: 'New passwords do not match.' });
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
      else if (code === 'auth/requires-recent-login') msg = 'Please sign in again and retry.';
      else if (err instanceof Error) msg = err.message;
      setPasswordStatus({ type: 'error', msg });
    }
  };

  const loading = authState.status === 'loading';

  return (
    <div className="-m-6 min-h-[calc(100vh-0px)] bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Super Admin</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-xs text-gray-500">Manage your profile information and account security.</p>
      </header>

      <div className="px-6 py-6 md:px-8 md:py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-2">
          <form
            onSubmit={onSaveProfile}
            className="rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Profile Information</h2>
              <p className="mt-0.5 text-xs text-gray-500">Update your name and avatar.</p>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <span className={LABEL}>Photo</span>
                <div className="mt-2 flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
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
                    ref={fileRef}
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
                <p className="mt-1 text-[11px] text-gray-400">Contact another super admin to change your email.</p>
              </div>
            </div>

            <StatusLine status={profileStatus} />

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="submit"
                disabled={profileStatus.type === 'saving' || loading}
                className={BTN_PRIMARY}
              >
                {profileStatus.type === 'saving' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    Saving
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>
          </form>

          <form
            onSubmit={onSavePassword}
            className="rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Update Password</h2>
              <p className="mt-0.5 text-xs text-gray-500">Choose a strong password — at least 8 characters.</p>
            </div>

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
                <label className={LABEL}>Confirm New Password</label>
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

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="submit"
                disabled={passwordStatus.type === 'saving' || loading}
                className={BTN_PRIMARY}
              >
                {passwordStatus.type === 'saving' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    Saving
                  </>
                ) : (
                  'Update password'
                )}
              </button>
            </div>
          </form>
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
    <div className={`mx-6 mb-4 flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${cls}`}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span>{status.msg}</span>
    </div>
  );
}
