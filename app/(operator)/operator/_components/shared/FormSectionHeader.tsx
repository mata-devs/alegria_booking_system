export function FormSectionHeader({
  step,
  title,
  hint,
}: {
  step: number;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-6 py-3 bg-gray-50 border-b border-gray-100 sticky top-0 z-[1]">
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold shrink-0">
        {step}
      </span>
      <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">{title}</span>
      {hint && <span className="text-[10px] text-gray-400 ml-0.5">{hint}</span>}
    </div>
  );
}
