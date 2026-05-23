import Link from "next/link";

function buildPaginationItems(currentPage, totalPages) {
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items = new Set([1, totalPages, safeCurrentPage]);

  for (let offset = 1; offset <= 2; offset += 1) {
    if (safeCurrentPage - offset > 1) {
      items.add(safeCurrentPage - offset);
    }

    if (safeCurrentPage + offset < totalPages) {
      items.add(safeCurrentPage + offset);
    }
  }

  return Array.from(items).sort((left, right) => left - right);
}

export default function Pagination({
  currentPage,
  totalPages,
  getHref,
  previousLabel = "Previous",
  nextLabel = "Next",
  className = "",
  ariaLabel = "Pagination",
  showPageSummary = false,
}) {
  if (!Number.isFinite(totalPages) || totalPages <= 1) {
    return null;
  }

  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  const pageItems = buildPaginationItems(safeCurrentPage, totalPages);

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {showPageSummary ? (
        <div className="text-sm text-slate-300">
          Page {safeCurrentPage} of {totalPages}
        </div>
      ) : null}

      <nav className="inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-accent-secondary bg-main/60 p-2" aria-label={ariaLabel}>
        {safeCurrentPage > 1 ? (
          <Link
            href={getHref(safeCurrentPage - 1)}
            className="rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-accent-secondary hover:bg-primary hover:text-white"
          >
            {previousLabel}
          </Link>
        ) : (
          <span className="rounded-xl border border-accent-secondary px-3 py-2 text-sm font-medium text-slate-500 opacity-50">
            {previousLabel}
          </span>
        )}

        {pageItems.map((pageNumber, index) => {
          const previousPageNumber = pageItems[index - 1];
          const needsEllipsis = Boolean(previousPageNumber && pageNumber - previousPageNumber > 1);

          return (
            <div key={pageNumber} className="contents">
              {needsEllipsis ? (
                <span className="px-2 text-sm font-medium text-slate-400" aria-hidden="true">
                  ...
                </span>
              ) : null}
              <Link
                href={getHref(pageNumber)}
                aria-current={safeCurrentPage === pageNumber ? "page" : undefined}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  safeCurrentPage === pageNumber
                    ? "border-accent bg-accent-secondary text-slate-50"
                    : "border-transparent text-slate-300 hover:border-accent-secondary hover:bg-primary hover:text-white"
                }`}
              >
                {pageNumber}
              </Link>
            </div>
          );
        })}

        {safeCurrentPage < totalPages ? (
          <Link
            href={getHref(safeCurrentPage + 1)}
            className="rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-accent-secondary hover:bg-primary hover:text-white"
          >
            {nextLabel}
          </Link>
        ) : (
          <span className="rounded-xl border border-accent-secondary px-3 py-2 text-sm font-medium text-slate-500 opacity-50">
            {nextLabel}
          </span>
        )}
      </nav>
    </div>
  );
}