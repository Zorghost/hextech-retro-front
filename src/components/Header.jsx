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
    <header className="px-4 flex h-14 shrink-0 items-center gap-4">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="TheNextGameStation" width={116.56} height={33.8} loading="eager"/>
      </Link>

      <Search {...searchDiscovery} />

      <nav className="flex gap-4 md:gap-6">
        <Link href="/dashboard" aria-label="Open dashboard">
          <Cog8ToothIcon className="w-6 h-6"/>
        </Link>

        <MobileNav />
      </nav>


    </header>
  )
}