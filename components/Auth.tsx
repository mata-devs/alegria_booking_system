'use client';

import { useEffect, useRef, useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { z } from 'zod';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { firebaseAuth, googleAuthProvider } from '@/lib/firebase';

// TODO: refactor and modularize

const emailPasswordSignInSchema = z.object({
  email: z
    .email('Please enter a valid email address.')
    .trim()
    .min(1, 'Please fill out this field.'),
  password: z.string().min(1, 'Please fill out this field.'),
});

const resetPasswordSchema = z.object({
  email: z
    .email('Please enter a valid email address.')
    .trim()
    .min(1, 'Please fill out this field.'),
});

type FieldErrors = Partial<Record<'email' | 'password', string>>;

function getFirebaseAuthErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  if (!('code' in error)) return null;
  const value = (error as any).code;
  return typeof value === 'string' ? value : null;
}

function getAuthErrorMessage(error: unknown): string {
  const code = getFirebaseAuthErrorCode(error);

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';

    default:
      return 'Please try again later.';
  }
}

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [resetStep, setResetStep] = useState<'form' | 'sent'>('form');
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isMountedRef = useRef(true);
  const emailErrorId = 'auth-email-error';
  const passwordErrorId = 'auth-password-error';

  useEffect(() => {
    isMountedRef.current = true;
    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      if (!isMountedRef.current) return;
      setUser(nextUser);
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (resendCooldownSeconds <= 0) return;
    const intervalId = window.setInterval(() => {
      setResendCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [resendCooldownSeconds]);

  function formatCooldown(seconds: number): string {
    const clamped = Math.max(0, seconds);
    const mm = Math.floor(clamped / 60);
    const ss = clamped % 60;
    return `${mm}:${ss.toString().padStart(2, '0')}`;
  }

  async function handleGoogleAuth() {
    setError(null);
    setCredentialError(null);

    try {
      await signInWithPopup(firebaseAuth, googleAuthProvider);
    } catch (e) {
      const code = getFirebaseAuthErrorCode(e);

      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        return;
      }

      if (!isMountedRef.current) return;
      setError(getAuthErrorMessage(e));
    }
  }

  async function handleSignOut() {
    setError(null);

    try {
      await signOut(firebaseAuth);
    } catch (e) {
      if (!isMountedRef.current) return;
      setError('Failed to sign out. Please try again.');
    }
  }

  async function handleEmailPasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setCredentialError(null);
    setResetError(null);

    const parsed = emailPasswordSignInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const nextFieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'email' || key === 'password') {
          nextFieldErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextFieldErrors);
      return;
    }

    try {
      await signInWithEmailAndPassword(
        firebaseAuth,
        parsed.data.email,
        parsed.data.password,
      );
    } catch (e) {
      if (!isMountedRef.current) return;
      const code = getFirebaseAuthErrorCode(e);
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found'
      ) {
        setCredentialError('Invalid email or password.');
        return;
      }

      if (code === 'auth/too-many-requests') {
        setCredentialError('Too many attempts. Please try again later.');
        return;
      }

      setError(getAuthErrorMessage(e));
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setResetError(null);

    const parsed = resetPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      const nextFieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'email') {
          nextFieldErrors.email = issue.message;
        }
      }
      setFieldErrors(nextFieldErrors);
      return;
    }

    try {
      await sendPasswordResetEmail(firebaseAuth, parsed.data.email);
      if (!isMountedRef.current) return;
      setResetStep('sent');
    } catch (err) {
      if (!isMountedRef.current) return;
      const code = getFirebaseAuthErrorCode(err);

      if (code === 'auth/too-many-requests') {
        setResetError('Too many attempts. Please try again later.');
        return;
      }

      setResetError(getAuthErrorMessage(err));
    }
  }

  async function handleResendResetEmail() {
    if (resendCooldownSeconds > 0) return;

    setError(null);
    setFieldErrors({});
    setResetError(null);

    setResendCooldownSeconds(30);

    const parsed = resetPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      const nextFieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'email') {
          nextFieldErrors.email = issue.message;
        }
      }
      setFieldErrors(nextFieldErrors);
      setResetStep('form');
      return;
    }

    try {
      await sendPasswordResetEmail(firebaseAuth, parsed.data.email);
    } catch (err) {
      if (!isMountedRef.current) return;
      const code = getFirebaseAuthErrorCode(err);

      if (code === 'auth/too-many-requests') {
        setResetError('Too many attempts. Please try again later.');
        return;
      }

      setResetError(getAuthErrorMessage(err));
    }
  }

  if (user) {
    // temporary, page should redirect to dashboard
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-gray-700 text-center max-w-full truncate">
          Signed in as {user.displayName || user.email || 'user'}
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full max-w-xs rounded-xl bg-[#178893] px-6 py-3 text-white font-semibold hover:bg-[#156c84] disabled:opacity-60 transition-colors"
        >
          Sign out
        </button>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {mode === 'reset' ? (
        <div className="w-full max-w-sm">
          {resetStep === 'sent' ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Check your inbox
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                An email with a link to reset your password was sent to the
                email address associated with your account
              </p>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-700">
                <span>Didn't get an email?</span>
                <button
                  type="button"
                  onClick={handleResendResetEmail}
                  disabled={resendCooldownSeconds > 0}
                  className="font-semibold text-gray-900 hover:underline disabled:opacity-60 disabled:hover:no-underline"
                >
                  {resendCooldownSeconds > 0
                    ? `Resend in ${formatCooldown(resendCooldownSeconds)}`
                    : 'Resend'}
                </button>
              </div>

              {resetError ? (
                <p className="mt-3 text-xs text-red-600">{resetError}</p>
              ) : null}
            </div>
          ) : (
            <>
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Reset your password
                </h2>
                <p className="text-sm text-gray-600">
                  Enter your email and we'll send you a link to reset your
                  password.
                </p>
              </div>

              <form onSubmit={handleResetPassword} noValidate className="mt-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">
                      Email
                    </label>
                    <input
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          email: undefined,
                        }));
                        setResetError(null);
                      }}
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      aria-invalid={
                        fieldErrors.email || resetError ? 'true' : 'false'
                      }
                      aria-describedby={
                        fieldErrors.email ? emailErrorId : undefined
                      }
                      className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-gray-900 outline-none focus:ring-2 disabled:bg-gray-50 ${
                        fieldErrors.email || resetError
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-teal-200'
                      }`}
                    />
                    <p
                      id={emailErrorId}
                      className="mt-2 text-xs text-red-600 min-h-4"
                    >
                      {fieldErrors.email ?? resetError ?? ''}
                    </p>
                  </div>

                  <div className="pt-1 flex justify-center">
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-[#178893] px-6 py-3 text-white font-semibold hover:bg-[#156c84] disabled:opacity-60 transition-colors"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleEmailPasswordSignIn}
          noValidate
          className="w-full max-w-sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  setCredentialError(null);
                }}
                id="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                aria-invalid={
                  fieldErrors.email || credentialError ? 'true' : 'false'
                }
                aria-describedby={fieldErrors.email ? emailErrorId : undefined}
                className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-gray-900 outline-none focus:ring-2 disabled:bg-gray-50 ${
                  fieldErrors.email || credentialError
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-teal-200'
                }`}
              />
              <p
                id={emailErrorId}
                className="mt-2 text-xs text-red-600 min-h-4"
              >
                {fieldErrors.email ?? ''}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  setCredentialError(null);
                }}
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={
                  fieldErrors.password || credentialError ? 'true' : 'false'
                }
                aria-describedby={
                  fieldErrors.password ? passwordErrorId : undefined
                }
                className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-gray-900 outline-none focus:ring-2 disabled:bg-gray-50 ${
                  fieldErrors.password || credentialError
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-teal-200'
                }`}
              />
              <p
                id={passwordErrorId}
                className="mt-2 text-xs text-red-600 min-h-4"
              >
                {fieldErrors.password ?? credentialError ?? ''}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setResetStep('form');
                  setError(null);
                  setFieldErrors({});
                  setCredentialError(null);
                  setResetError(null);
                }}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                Forgot Password?
              </button>
            </div>

            <div className="pt-1 flex justify-center">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#178893] px-6 py-3 text-white font-semibold hover:bg-[#156c84] disabled:opacity-60 transition-colors"
              >
                Log In
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="w-full flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-500">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <button
        type="button"
        onClick={handleGoogleAuth}
        className="w-full max-w-sm rounded-xl bg-[#178893] px-6 py-3 text-white font-semibold hover:bg-[#156c84] disabled:opacity-60 transition-colors"
      >
        <span className="inline-flex items-center justify-center gap-4">
          <FaGoogle aria-hidden="true" />
          <span>Continue with Google</span>
        </span>
      </button>

      {error ? (
        <p className="text-sm font-bold text-red-600 text-center">{error}</p>
      ) : null}
    </div>
  );
}
