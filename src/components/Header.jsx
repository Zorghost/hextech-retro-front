import Image from "next/image"
import Link from "next/link"
import Search from "@/components/Search"
import MobileNav from "@/components/MobileNav"
import { Cog8ToothIcon } from "@heroicons/react/24/outline"
import { getSearchDiscoveryData } from "@/lib/gameQueries"

export default async function Header() {
  const searchDiscovery = await getSearchDiscoveryData({
    suggestionLimit: 8,
    platformLimit: 6,
    featuredLimit: 4,
  });

  return ( 
    <header className="flex shrink-0 flex-wrap items-center gap-3 px-4 py-3 md:h-14 md:flex-nowrap md:gap-4 md:py-0">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="TheNextGameStation" width={116.56} height={33.8} loading="eager"/>
      </Link>

      <div className="order-3 w-full md:order-none md:w-auto md:flex-1">
        <Search {...searchDiscovery} />
      </div>

      <nav className="ml-auto flex items-center gap-3 md:gap-6">
        <Link href="/dashboard" aria-label="Open dashboard" className="hidden md:inline-flex">
          <Cog8ToothIcon className="w-6 h-6"/>
        </Link>

        <MobileNav />
      </nav>


    </header>
  )
}