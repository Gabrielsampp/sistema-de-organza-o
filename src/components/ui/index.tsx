import { Check, X } from "lucide-react";
import type React from "react";
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, forwardRef } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type BtnVariant = "primary" | "ghost" | "danger";
export function Button({
  variant = "ghost",
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const v = {
    primary: "bg-accent text-white font-medium hover:bg-accent-hover",
    ghost: "bg-transparent text-fg2 hover:bg-elevated hover:text-fg border border-line-strong",
    danger: "bg-transparent text-danger hover:bg-danger/10 border border-danger/40",
  }[variant];
  return (
    <button
      {...p}
      className={cx("inline-flex h-8 items-center gap-2 rounded-control px-3 text-[13px] transition-colors disabled:opacity-40 disabled:pointer-events-none", v, className)}
    />
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return (
    <input
      ref={ref}
      {...p}
      className={cx("h-8 w-full rounded-control border border-line-strong bg-base px-3 text-[13px] text-fg placeholder:text-faint focus:border-accent", className)}
    />
  );
});

export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...p}
      className={cx("min-h-20 w-full resize-y rounded-control border border-line-strong bg-base px-3 py-2 text-[13px] text-fg placeholder:text-faint focus:border-accent", className)}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx("rounded-card border border-line bg-surface p-5", className)}>{children}</section>;
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="mb-3 font-display text-[13px] font-semibold uppercase tracking-wide text-fg">{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] text-muted">{label}</span>
      {children}
    </label>
  );
}

export function ProgressBar({ pct, tone = "accent" }: { pct: number; tone?: "accent" | "success" | "danger" }) {
  const color = { accent: "bg-accent", success: "bg-success", danger: "bg-danger" }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-elevated" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("h-full rounded-full transition-[width] duration-300", color)} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "accent" | "success" | "danger" | "warning"; children: ReactNode }) {
  const t = {
    neutral: "text-fg2 bg-elevated",
    accent: "text-accent bg-accent/12",
    success: "text-success bg-success/12",
    danger: "text-danger bg-danger/12",
    warning: "text-warning bg-warning/12",
  }[tone];
  return <span className={cx("inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium", t)}>{children}</span>;
}

export function Checkbox({ checked, onChange, label, round = false, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; label: string; round?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "flex size-[18px] shrink-0 items-center justify-center border transition-colors disabled:cursor-default",
        round ? "rounded-full" : "rounded-[5px]",
        checked ? "border-accent bg-accent text-white" : "border-line-strong enabled:hover:border-accent",
      )}
    >
      {checked && <Check size={12} strokeWidth={3} />}
    </button>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="text-[14px] text-fg2">{title}</div>
      {hint && <div className="mt-1 text-[12px] text-muted">{hint}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line-strong bg-elevated px-1.5 py-0.5 font-sans text-[11px] text-muted">{children}</kbd>;
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onMouseDown={onClose}>
      <aside
        className="flex h-full w-[440px] flex-col border-l border-line bg-surface shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <header className="flex h-14 items-center justify-between border-b border-line px-5">
          <h2 className="text-[14px] font-medium">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="rounded p-1 text-muted hover:bg-elevated hover:text-fg">
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}

export function ProgressRing({ pct, size = 112 }: { pct: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-elevated)" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset .4s" }}
      />
    </svg>
  );
}

export const selectCls =
  "h-8 w-full rounded-control border border-line-strong bg-base px-2 text-[13px] text-fg focus:border-accent";

export function Select({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cx(selectCls, className)} />;
}

/** Controle segmentado (ex.: Saída / Entrada / Transferência). */
export function Segmented<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string; tone?: "accent" | "danger" }[];
}) {
  return (
    <div className="flex gap-1 rounded-control bg-base p-1" role="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        const tone = o.tone === "danger" ? "bg-danger/15 text-danger" : "bg-accent/15 text-accent";
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            className={cx("h-7 flex-1 rounded-[5px] text-[12px] transition-colors", on ? tone : "text-muted hover:text-fg")}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function StatCard({ label, value, tone = "neutral", sub }: { label: string; value: string; tone?: "neutral" | "success" | "danger"; sub?: string }) {
  const box = { neutral: "border-line bg-surface", success: "border-accent/25 bg-accent/[0.05]", danger: "border-danger/25 bg-danger/[0.05]" }[tone];
  const txt = { neutral: "text-fg", success: "text-success", danger: "text-danger" }[tone];
  return (
    <div className={cx("rounded-card border p-5", box)}>
      <div className={cx("tnum font-display text-[26px] font-bold", txt)}>{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted">{label}</div>
      {sub && <div className="mt-1 text-[11px] text-faint">{sub}</div>}
    </div>
  );
}
