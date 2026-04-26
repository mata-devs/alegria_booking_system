'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

export default function ProfileSettingsPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const onPickPhoto = () => fileRef.current?.click();

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  };

  const onSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('save profile', profile);
  };

  const onSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('save password', passwords);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Profile Information */}
        <form
          onSubmit={onSaveProfile}
          className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
        >
          <h2 className="text-base font-bold text-gray-900">Profile Information</h2>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-600">Photo</p>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gray-100 shrink-0">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                    width={64}
                    height={64}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                      <path
                        d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onPickPhoto}
                className="text-sm font-semibold text-green-600 hover:text-green-700 hover:underline"
              >
                Select a Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name</label>
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                type="text"
                placeholder="Your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                type="email"
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white text-sm font-semibold rounded-full hover:bg-green-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>

        {/* Update Password */}
        <form
          onSubmit={onSavePassword}
          className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
        >
          <h2 className="text-base font-bold text-gray-900">Update Password</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Password</label>
              <input
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
              <input
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password</label>
              <input
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white text-sm font-semibold rounded-full hover:bg-green-700 transition-colors"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
