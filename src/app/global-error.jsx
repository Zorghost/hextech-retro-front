"use client";

import RetryButton from "@/components/ui/RetryButton";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body className="antialiased bg-main">
        <section className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-xl border border-accent-secondary bg-main p-6">
            <h1 className="font-display text-3xl mb-2">Something broke</h1>
            <p className="text-gray-200/80 mb-6">
              {typeof error?.message === "string" && error.message.trim().length
                ? error.message
                : "An unexpected error occurred."}
            </p>

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
      </body>
    </html>
  );
}
