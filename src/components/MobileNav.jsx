"use client";
import Link from "next/link";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  Cog8ToothIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const mobileNavItems = [
    {
      name: "Home",
      path: "/",
      icon: HomeIcon,
      slug: null,
    },
    {
      name: "New",
      path: "/new-games",
      icon: CubeIcon,
      slug: "new-games",
    },
    {
      name: "Categories",
      path: "/category",
      icon: CubeIcon,
      slug: "category",
    },
    {
      name: "Search",
      path: "/search",
      icon: MagnifyingGlassIcon,
      slug: "search",
    },
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: Cog8ToothIcon,
      slug: "dashboard",
    },
  ];
  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          className="lg:hidden"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded="false"
          aria-controls="mobile-menu"
        >
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          className="lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-label="Close navigation menu"
          aria-expanded="true"
          aria-controls="mobile-menu"
        >
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <div
          id="mobile-menu"
          className="fixed top-[57px] h-dvh left-0 right-0 z-50 bg-main p-4"
        >
          <ul className="bg-muted flex flex-col mb-6" role="menu">
            {mobileNavItems.map((item) => (
              <li key={item.name} className="border-accent" role="none">
                <Link
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className="text-xl font-medium hover:bg-accent rounderd-md flex gap-4 items-center border-b border-accent py-4 px-6"
                  role="menuitem"
                >
                  <item.icon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
