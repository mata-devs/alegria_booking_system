'use client';

import { useEffect, useRef, useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import {
  onAuthStateChanged,
  type ActionCodeSettings,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { firebaseAuth, googleAuthProvider } from '@/lib/firebase';
import { emailPasswordSignInSchema, resetPasswordSchema } from '@/lib/schema';
import { LoginPanel } from './auth/LoginPanel';
import { ResetPasswordPanel } from './auth/ResetPasswordPanel';
import { SignedInPanel } from './auth/SignedInPanel';
import type { FieldErrors } from './auth/types';

type FirebaseAuthErrorLike = {
  code?: unknown;
};

function getFirebaseAuthErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  if (!('code' in error)) return null;
  const value = (error as FirebaseAuthErrorLike).code;
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

  function getPasswordResetActionCodeSettings(): ActionCodeSettings {
    return {
      url: `${window.location.origin}/reset-password`,
    };
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
    } catch {
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
      await sendPasswordResetEmail(
        firebaseAuth,
        parsed.data.email,
        getPasswordResetActionCodeSettings(),
      );
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
      await sendPasswordResetEmail(
        firebaseAuth,
        parsed.data.email,
        getPasswordResetActionCodeSettings(),
      );
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
      <SignedInPanel user={user} error={error} onSignOut={handleSignOut} />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {mode === 'reset' ? (
        <ResetPasswordPanel
          resetStep={resetStep}
          resendCooldownSeconds={resendCooldownSeconds}
          resetError={resetError}
          fieldErrors={fieldErrors}
          email={email}
          emailErrorId={emailErrorId}
          onEmailChange={(value) => {
            setEmail(value);
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
            setResetError(null);
          }}
          onSubmit={handleResetPassword}
          onResend={handleResendResetEmail}
          formatCooldown={formatCooldown}
        />
      ) : (
        <LoginPanel
          email={email}
          password={password}
          fieldErrors={fieldErrors}
          credentialError={credentialError}
          emailErrorId={emailErrorId}
          passwordErrorId={passwordErrorId}
          onEmailChange={(value) => {
            setEmail(value);
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
            setCredentialError(null);
          }}
          onPasswordChange={(value) => {
            setPassword(value);
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
            setCredentialError(null);
          }}
          onSubmit={handleEmailPasswordSignIn}
          onForgotPassword={() => {
            setMode('reset');
            setResetStep('form');
            setError(null);
            setFieldErrors({});
            setCredentialError(null);
            setResetError(null);
          }}
        />
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
