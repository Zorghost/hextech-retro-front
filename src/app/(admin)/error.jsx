"use client";

import RetryButton from "@/components/ui/RetryButton";

export default function Error({ error, reset }) {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="w-full rounded-xl border border-accent-secondary bg-main p-6">
        <h1 className="font-display text-2xl md:text-3xl mb-2">Admin error</h1>
        <p className="text-gray-200/80 mb-6">
          {typeof error?.message === "string" && error.message.trim().length
            ? error.message
            : "Please try again."}
        </p>

        <div className="flex flex-wrap gap-3">
          <RetryButton onRetry={reset} />
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
