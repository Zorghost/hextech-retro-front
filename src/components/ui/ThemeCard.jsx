export default function ThemeCard({
  icon: Icon,
  title,
  children,
  surfaceClassName = "bg-main/90",
  className = "",
  titleClassName = "",
  bodyClassName = "",
}) {
  return (
    <section className={`rounded-2xl border border-accent-secondary p-5 ${surfaceClassName} ${className}`}>
      {(Icon || title) ? (
        <div className="mb-3 flex items-center gap-3">
          {Icon ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-secondary bg-accent-secondary/70 text-slate-100">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          ) : null}
          {title ? <h2 className={`font-display text-lg ${titleClassName}`}>{title}</h2> : null}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}