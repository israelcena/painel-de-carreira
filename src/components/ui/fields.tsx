export const inputCls =
  "w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm font-semibold text-ink outline-none transition placeholder:text-muted focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/30 disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  required,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
      {message}
    </p>
  );
}
