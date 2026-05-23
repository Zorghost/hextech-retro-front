export default function EmptyState({
  title = "Nothing here",
  description,
  action,
  className = "",
}) {
  return (
    <section
      className={`w-full rounded-2xl border border-accent-secondary bg-main/60 p-6 ${className}`}
      role="status"
      aria-live="polite"
    >
      <h2 className="font-display text-xl text-slate-100 md:text-2xl">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-slate-300 md:text-base">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
