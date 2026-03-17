import type { FieldErrors } from './types';

type ResetPasswordPanelProps = {
  resetStep: 'form' | 'sent';
  resendCooldownSeconds: number;
  resetError: string | null;
  fieldErrors: FieldErrors;
  email: string;
  emailErrorId: string;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  formatCooldown: (seconds: number) => string;
};

export function ResetPasswordPanel({
  resetStep,
  resendCooldownSeconds,
  resetError,
  fieldErrors,
  email,
  emailErrorId,
  onEmailChange,
  onSubmit,
  onResend,
  formatCooldown,
}: ResetPasswordPanelProps) {
  return (
    <div className="w-full max-w-sm">
      {resetStep === 'sent' ? (
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Check your inbox
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            An email with a link to reset your password was sent to the email
            address associated with your account
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-700">
            <span>Didn&apos;t get an email?</span>
            <button
              type="button"
              onClick={onResend}
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
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
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
  );
}
