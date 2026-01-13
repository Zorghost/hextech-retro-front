"use client";
import { HomeIcon, CubeIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function SideBarNav({ categoryMenu }) {
  const activeSegment = usePathname();

  const mainMenuItems = [
    {
      name: "Home",
      icon: HomeIcon,
      slug: "/",
    },
    {
      name: "New",
      icon: CubeIcon,
      slug: "/new-games",
    },
  ];

  return (
    <>
      <div className="text-accent text-xs mb-2">MENU</div>
      <ul className="bg-muted flex flex-col gap-2 mb-6">
        {mainMenuItems.map((item, i) => (
          <li key={i}>
            <Link
              href={item.slug}
              className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                activeSegment === `${item.slug}`
                  ? "active bg-primary rounded-md"
                  : "incative hover:bg-primary rounded-md"
              }`}
            >
              <item.icon className="size-6 text-accent" />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="text-accent text-xs mb-2">CATEGORIES</div>
      <ul className="bg-muted flex flex-col gap-2 mb-6">
        {categoryMenu.map((item) => (
          <li key={item.id}>
            <Link
              href={`/category/${item.slug}`}
              className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                activeSegment === `/category/${item.slug}`
                  ? "active bg-primary rounded-md"
                  : "incative hover:bg-primary rounded-md"
              }`}
            >
              <div className={`categoryicon ${item.slug}`}></div>
              {item.title}{" "}
              <span className="text-accent">({item?.games?.length})</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
