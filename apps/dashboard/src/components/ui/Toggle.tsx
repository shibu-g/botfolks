export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  tone = 'accent',
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  /** Track color when checked: the default accent gradient, or solid green for "on/live" style toggles. */
  tone?: 'accent' | 'ok';
}) {
  const trackOn = tone === 'ok' ? 'bg-ok shadow-[0_0_0_4px_rgba(var(--ok-rgb)/0.16)]' : 'bg-[image:var(--accent-grad)] shadow-[0_0_0_4px_rgba(var(--accent-rgb)/0.16)]';
  return (
    <label className={`flex items-center justify-between gap-4 py-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <span className="flex flex-col gap-0.5">
        <span className="text-[14.5px] font-medium text-text">{label}</span>
        {description && <span className="text-[13px] text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border-0 p-0 transition-[background-color,box-shadow] duration-300 ease-out outline-none
          focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg
          ${checked ? trackOn : 'bg-white/10'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]
            ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </label>
  );
}
