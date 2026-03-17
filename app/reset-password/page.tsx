import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex flex-col">
          <main className="flex-1 flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-md rounded-2xl border border-gray-400 bg-white px-6 py-8 sm:px-10 sm:py-12 shadow-2xl shadow-gray-400">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center leading-snug">
                Alegria
                <br />
                Canyoneering
              </h1>

              <div className="mt-8 sm:mt-12">
                <p className="text-sm text-gray-700 text-center">
                  Verifying reset link…
                </p>
              </div>
            ) : null}

            {status === 'done' ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-gray-700">
                  Your password has been updated.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full rounded-xl bg-[#178893] px-6 py-3 text-white font-semibold hover:bg-[#156c84] transition-colors"
                >
                  Go to login
                </button>
              </div>
            ) : null}

            {status === 'ready' || status === 'saving' ? (
              <>
                <div className="space-y-1 text-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Set a new password
                  </h2>
                  <p className="text-sm text-gray-600">
                    {email
                      ? `Resetting password for ${email}`
                      : 'Choose a new password.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="mt-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">
                        New password
                      </label>
                      <input
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setFieldErrors((prev) => ({
                            ...prev,
                            password: undefined,
                          }));
                        }}
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={fieldErrors.password ? 'true' : 'false'}
                        className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-gray-900 outline-none focus:ring-2 disabled:bg-gray-50 ${fieldErrors.password
                            ? 'border-red-500 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-teal-200'
                          }`}
                      />
                      <p className="mt-2 text-xs text-red-600 min-h-4">
                        {fieldErrors.password ?? ''}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900">
                        Confirm password
                      </label>
                      <input
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setFieldErrors((prev) => ({
                            ...prev,
                            confirmPassword: undefined,
                          }));
                        }}
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={
                          fieldErrors.confirmPassword ? 'true' : 'false'
                        }
                        className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-gray-900 outline-none focus:ring-2 disabled:bg-gray-50 ${fieldErrors.confirmPassword
                            ? 'border-red-500 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-teal-200'
                          }`}
                      />
                      <p className="mt-2 text-xs text-red-600 min-h-4">
                        {fieldErrors.confirmPassword ?? ''}
                      </p>
                    </div>

                    <div className="pt-1 flex justify-center">
                      <button
                        type="submit"
                        disabled={status === 'saving'}
                        className="w-full rounded-xl bg-[#178893] px-6 py-3 text-white font-semibold hover:bg-[#156c84] disabled:opacity-60 transition-colors"
                      >
                        {status === 'saving' ? 'Saving…' : 'Save password'}
                      </button>
                    </div>

                    {error ? (
                      <p className="text-sm font-bold text-red-600 text-center">
                        {error}
                      </p>
                    ) : null}
                  </div>
                </form>
              </>
            ) : null}
          </div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}