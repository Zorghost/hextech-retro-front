"use client";

import { HomeIcon, CubeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SideBarNav({ categoryMenu = [] }) {
  const pathname = usePathname();

  const mainMenuItems = [
    {
      name: "Home",
      icon: HomeIcon,
      href: "/",
    },
    {
      name: "New",
      icon: CubeIcon,
      href: "/new-games",
    },
  ];

  const isMainItemActive = (href) => pathname === href;
  const isCategoryItemActive = (slug) => pathname === `/category/${slug}`;

  return (
    <nav className="space-y-5" aria-label="Sidebar navigation">
      <section>
        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-accent">Menu</div>
        <ul className="space-y-2 rounded-2xl border border-accent-secondary bg-main/60 p-3">
          {mainMenuItems.map((item) => {
            const active = isMainItemActive(item.href);

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-main ${
                    active
                      ? "border-accent bg-accent-secondary text-slate-50"
                      : "border-transparent text-slate-300 hover:border-accent-secondary hover:bg-primary hover:text-white"
                  }`}
                >
                  <item.icon className="size-5 shrink-0 text-accent" aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-accent">Categories</div>
        <ul className="space-y-2 rounded-2xl border border-accent-secondary bg-main/60 p-3">
          {categoryMenu.map((item) => {
            const active = isCategoryItemActive(item.slug);

            return (
              <li key={item.id}>
                <Link
                  href={`/category/${item.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-main ${
                    active
                      ? "border-accent bg-accent-secondary text-slate-50"
                      : "border-transparent text-slate-300 hover:border-accent-secondary hover:bg-primary hover:text-white"
                  }`}
                >
                  <div className={`categoryicon ${item.slug}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  <span className="text-accent">({item?._count?.games ?? 0})</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </nav>
  );
}