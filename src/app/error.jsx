"use client";

import RetryButton from "@/components/ui/RetryButton";

export default function Error({ error, reset }) {
  const message =
    typeof error?.message === "string" && error.message.trim().length
      ? error.message
      : "Something went wrong.";

  return (
    <section className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-xl border border-accent-secondary bg-main p-6">
        <h1 className="font-display text-2xl md:text-3xl mb-2">Error</h1>
        <p className="text-gray-200/80 mb-6">{message}</p>

        <div className="flex flex-wrap gap-3">
          <RetryButton onRetry={reset} />
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
          >
            Go home
          </a>
        </div>

        {error?.digest ? (
          <p className="mt-6 text-xs text-gray-200/60">Digest: {error.digest}</p>
        ) : null}
      </div>
    </section>
  );
}
