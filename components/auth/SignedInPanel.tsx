import type { User } from 'firebase/auth';

type SignedInPanelProps = {
  user: User;
  error: string | null;
  onSignOut: () => void;
};

export function SignedInPanel({ user, error, onSignOut }: SignedInPanelProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-gray-700 text-center max-w-full truncate">
        Signed in as {user.displayName || user.email || 'user'}
      </p>
      <button
        type="button"
        onClick={onSignOut}
        className="w-full max-w-xs rounded-xl bg-[#178893] px-6 py-3 text-white font-semibold hover:bg-[#156c84] disabled:opacity-60 transition-colors"
      >
        Sign out
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
