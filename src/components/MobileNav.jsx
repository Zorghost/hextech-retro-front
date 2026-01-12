"use client";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CubeIcon,
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
      name: "About",
      path: "/about",
      icon: CubeIcon,
      slug: "about",
    },
    {
      name: "Contact",
      path: "/contact",
      icon: CubeIcon,
      slug: "contact",
    },
  ];
  return (
    <>
      {!isOpen ? (
        <button
          className="lg:hidden"
          onClick={() => setIsOpen(true)}
          aria-expanded="false"
          aria-controls="mobile-menu"
        >
          <Bars3Icon className="h-6 w-6" aria-label="Open Menu" />
        </button>
      ) : (
        <button
          className="lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-expanded="true"
          aria-controls="mobile-menu"
        >
          <XMarkIcon className="h-6 w-6" aria-label="Close Menu" />
        </button>
      )}

      {isOpen && (
        <div id="mobile-menu" className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute top-[57px] left-0 right-0 bg-main p-4 border-t border-accent-secondary">
            <ul className="flex flex-col mb-6" role="menu">
            {mobileNavItems.map((item) => (
              <li key={item.name} className="border-accent" role="none">
                <a
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium hover:bg-accent-secondary rounded-md flex gap-4 items-center border-b border-accent-secondary py-4 px-4"
                  role="menuitem"
                >
                  <item.icon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                  {item.name}
                </a>
              </li>
            ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
