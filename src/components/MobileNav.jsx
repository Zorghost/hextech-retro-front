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
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();
  const toggleButtonRef = useRef(null);
  const menuRef = useRef(null);

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

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableElements = [
      toggleButtonRef.current,
      ...Array.from(menuRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? []),
    ].filter(Boolean);

    focusableElements.find((element) => element !== toggleButtonRef.current)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const trappedElements = [
        toggleButtonRef.current,
        ...Array.from(menuRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? []),
      ].filter(Boolean);

      if (trappedElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = trappedElements[0];
      const lastElement = trappedElements[trappedElements.length - 1];
      const activeElement = document.activeElement;

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      toggleButtonRef.current?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={toggleButtonRef}
        type="button"
        className="lg:hidden"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls={menuId}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <nav
          id={menuId}
          ref={menuRef}
          className="fixed top-[57px] h-dvh left-0 right-0 z-50 bg-main p-4"
          aria-label="Mobile navigation"
        >
          <ul className="bg-muted flex flex-col mb-6">
            {mobileNavItems.map((item) => (
              <li key={item.name} className="border-accent">
                <Link
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                        className="text-xl font-medium hover:bg-accent rounded-md flex gap-4 items-center border-b border-accent py-4 px-6"
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
        </nav>
      )}
    </>
  );
}
