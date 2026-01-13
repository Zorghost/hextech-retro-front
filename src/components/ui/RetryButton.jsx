"use client";

import { useTransition } from "react";

export default function RetryButton({ onRetry, children = "Try again", className = "" }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => onRetry?.())}
      disabled={isPending}
      className={`inline-flex items-center justify-center rounded-[24px] bg-accent px-5 py-3 text-base font-medium text-center disabled:opacity-70 ${className}`}
    >
      {isPending ? "Retrying…" : children}
    </button>
  );
}
