import Link from "next/link";

export default function Breadcrumbs({ items = [], className = "" }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (safeItems.length === 0) {
    return null;
  }

  return (
    <nav className={`w-full rounded-2xl border border-accent-secondary bg-main/60 px-4 py-3 ${className}`} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
        {safeItems.map((item, index) => {
          const isLast = index === safeItems.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span className="text-accent/70">/</span> : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="transition hover:text-accent">
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-100" aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}