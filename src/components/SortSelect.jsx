"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function SortSelect({ options }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = searchParams.get("sort") || "newest";

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-accent">Sort</span>
      <select
        className="select h-9 w-[180px]"
        value={current}
        onChange={(e) => {
          const next = new URLSearchParams(searchParams.toString());
          next.set("sort", e.target.value);
          next.delete("page");
          router.push(`${pathname}?${next.toString()}`);
        }}
      >
        {(options || [
          { value: "newest", label: "Newest" },
          { value: "az", label: "A → Z" },
          { value: "za", label: "Z → A" },
        ]).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
