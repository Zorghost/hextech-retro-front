"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

function CommentsLoading() {
  return (
    <div className="rounded-xl border border-accent-secondary bg-main p-4">
      <Skeleton className="h-6 w-40 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

const Disqus = dynamic(() => import("@/components/Disqus"), {
  ssr: false,
  loading: () => <CommentsLoading />,
});

export default function LazyDisqus({ url, identifier, title }) {
  const [enabled, setEnabled] = useState(false);

  if (!enabled) {
    return (
      <div className="rounded-xl border border-accent-secondary bg-main p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg">Comments</h2>
            <p className="text-sm text-gray-400">Load comments on demand.</p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(true)}
            className="text-sm bg-accent-gradient py-3 px-6 rounded-xl border border-yellow-400 uppercase"
          >
            Load Comments
          </button>
        </div>
      </div>
    );
  }

  return <Disqus url={url} identifier={identifier} title={title} />;
}
