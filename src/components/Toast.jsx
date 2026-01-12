"use client";

import { useEffect, useState } from "react";

export default function Toast({ message, tone = "info", autoHideMs = 4000 }) {
  const [open, setOpen] = useState(Boolean(message));

  useEffect(() => {
    setOpen(Boolean(message));
    if (!message) return;

    const t = setTimeout(() => setOpen(false), autoHideMs);
    return () => clearTimeout(t);
  }, [message, autoHideMs]);

  if (!message || !open) return null;

  const toneClass =
    tone === "success"
      ? "border-success/40 bg-success/10"
      : tone === "error"
        ? "border-error/40 bg-error/10"
        : "border-accent-secondary bg-accent-secondary/40";

  return (
    <div className={`card p-3 border ${toneClass}`} role="status" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm">{message}</div>
        <button type="button" className="text-xs text-accent hover:underline" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
    </div>
  );
}
