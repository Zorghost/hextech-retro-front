export default function EmptyState({
  title = "Nothing here",
  description,
  action,
  className = "",
}) {
  return (
    <section
      className={`w-full rounded-xl border border-accent-secondary bg-main p-6 ${className}`}
      role="status"
      aria-live="polite"
    >
      <h2 className="font-display text-xl md:text-2xl">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm md:text-base text-gray-200/80">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
