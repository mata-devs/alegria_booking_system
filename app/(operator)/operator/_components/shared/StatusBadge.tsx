export function StatusBadge({ status }: { status: 'active' | 'disabled' }) {
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
        status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {status === 'active' ? 'Active' : 'Disabled'}
    </span>
  );
}
