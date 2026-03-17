'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

export default function ProfileSettingsPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const onPickPhoto = () => fileRef.current?.click();

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const onSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call your API
    console.log('save profile', profile);
  };

  const onSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call your API
    console.log('save password', passwords);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <h1 className="text-sm font-semibold text-gray-800">Profile Settings</h1>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left card: Profile Information */}
            <form
              onSubmit={onSaveProfile}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-center text-sm font-semibold text-gray-800">
                Profile Information
              </h2>

              <div className="mt-6">
                <div className="text-xs font-bold text-gray-800">Photo</div>

                <div className="mt-3 flex flex-col items-start gap-2">
                  <div className="relative h-18 w-18 overflow-hidden rounded-full bg-gray-200">
                    {photoPreview ? (
                      // Using <img> here for blob preview; you can switch to <Image> if you prefer remote/static
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg
                          width="42"
                          height="42"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-gray-500"
                        >
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
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Select a Photo
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={onPhotoChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    type="text"
                    className="mt-2 h-9 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    type="email"
                    className="mt-2 h-9 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200"
                  />
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  type="submit"
                  className="h-9 rounded-md bg-green-600 px-6 text-sm font-semibold text-white hover:bg-green-700 active:scale-[0.99]"
                >
                  Save
                </button>
              </div>
            </form>

            {/* Right card: Update Password */}
            <form
              onSubmit={onSavePassword}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-center text-sm font-semibold text-gray-800">
                Update Password
              </h2>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    value={passwords.currentPassword}
                    onChange={(e) =>
                      setPasswords((p) => ({ ...p, currentPassword: e.target.value }))
                    }
                    type="password"
                    className="mt-2 h-9 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    value={passwords.newPassword}
                    onChange={(e) =>
                      setPasswords((p) => ({ ...p, newPassword: e.target.value }))
                    }
                    type="password"
                    className="mt-2 h-9 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))
                    }
                    type="password"
                    className="mt-2 h-9 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200"
                  />
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  type="submit"
                  className="h-9 rounded-md bg-green-600 px-6 text-sm font-semibold text-white hover:bg-green-700 active:scale-[0.99]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}