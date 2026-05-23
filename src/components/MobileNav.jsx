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
  const [headerOffset, setHeaderOffset] = useState(57);
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
    const measureHeaderOffset = () => {
      const headerElement = toggleButtonRef.current?.closest("header");
      const nextOffset = headerElement?.getBoundingClientRect().height ?? 57;
      setHeaderOffset(Math.max(48, Math.round(nextOffset)));
    };

    measureHeaderOffset();

    const headerElement = toggleButtonRef.current?.closest("header");
    const resizeObserver = typeof ResizeObserver !== "undefined" && headerElement
      ? new ResizeObserver(measureHeaderOffset)
      : null;

    if (resizeObserver && headerElement) {
      resizeObserver.observe(headerElement);
    } else {
      window.addEventListener("resize", measureHeaderOffset);
    }

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureHeaderOffset);
    };
  }, []);

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
        className="rounded-md lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-main"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close site navigation" : "Open site navigation"}
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
          className="fixed left-0 right-0 z-50 border-t border-accent-secondary bg-main/95 p-4 backdrop-blur-xl"
          style={{ top: `${headerOffset}px`, height: `calc(100dvh - ${headerOffset}px)` }}
          aria-label="Mobile site navigation"
        >
          <ul className="mb-6 space-y-2 rounded-2xl border border-accent-secondary bg-primary/70 p-2 shadow-2xl">
            {mobileNavItems.map((item) => (
              <li key={item.name} className="border-accent">
                <Link
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  aria-current={pathname === item.path ? "page" : undefined}
                  className={`flex items-center gap-4 rounded-xl border border-transparent px-4 py-4 text-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-main ${
                    pathname === item.path
                      ? "border-accent bg-accent-secondary text-slate-50"
                      : "text-slate-200 hover:border-accent-secondary hover:bg-main hover:text-white"
                  }`}
                >
                  <item.icon
                    className="h-6 w-6 text-accent"
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
