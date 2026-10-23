import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

type Variant = "primary" | "accent" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  accent: "bg-orange text-white hover:bg-orange-dark",
  ghost: "bg-white text-primary ring-1 ring-line hover:bg-primary-soft",
  danger: "bg-white text-danger ring-1 ring-danger/30 hover:bg-danger/5",
};

export const buttonClass = (variant: Variant = "primary", extra?: string) =>
  cx(
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
    VARIANTS[variant],
    extra,
  );

export const Button = ({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) => (
  <button className={buttonClass(variant, className)} {...props} />
);

export const Card = ({
  title,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={cx(
      "rounded-lg bg-white p-5 shadow-sm ring-1 ring-line",
      className,
    )}
  >
    {(title || action) && (
      <header className="mb-4 flex items-center justify-between gap-3">
        {title && <h2 className="text-base font-bold text-primary">{title}</h2>}
        {action}
      </header>
    )}
    {children}
  </section>
);

export const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-primary">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Stat = ({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  tone?: "primary" | "orange" | "green" | "danger";
}) => {
  const tones = {
    primary: "text-primary",
    orange: "text-orange",
    green: "text-green",
    danger: "text-danger",
  };
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-line">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </p>
      <p className={cx("mt-2 text-2xl font-bold", tones[tone])}>{value}</p>
    </div>
  );
};

export const Badge = ({
  children,
  tone = "primary",
}: {
  children: ReactNode;
  tone?: "primary" | "orange" | "green" | "danger" | "muted" | "gold";
}) => {
  const tones = {
    primary: "bg-primary-soft text-primary",
    orange: "bg-orange/10 text-orange-dark",
    green: "bg-green/10 text-green",
    danger: "bg-danger/10 text-danger",
    muted: "bg-line text-muted",
    gold: "bg-gold/20 text-ink",
  };
  return (
    <span
      className={cx(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
};

export const Field = ({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="font-medium text-ink">{label}</span>
    {children}
    {hint && <span className="text-xs text-muted">{hint}</span>}
  </label>
);

const control =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export const Input = ({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cx(control, className)} {...props} />
);

export const Select = ({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cx(control, className)} {...props} />
);

export const Empty = ({ children }: { children: ReactNode }) => (
  <p className="rounded-md bg-bg px-4 py-6 text-center text-sm text-muted">
    {children}
  </p>
);

export const FormMessage = ({
  state,
}: {
  state: { error?: string; ok?: string } | null;
}) =>
  state?.error ? (
    <p
      className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger"
      role="alert"
    >
      {state.error}
    </p>
  ) : state?.ok ? (
    <p
      className="rounded-md bg-green/10 px-3 py-2 text-sm text-green"
      role="status"
    >
      {state.ok}
    </p>
  ) : null;

export { cx };
