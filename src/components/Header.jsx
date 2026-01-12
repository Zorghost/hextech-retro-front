import Image from "next/image"
import Search from "@/components/Search"
import MobileNav from "@/components/MobileNav"
import { Cog8ToothIcon } from "@heroicons/react/24/outline"
import ThemeToggle from "@/components/ThemeToggle"

export default function Header() {
  return ( 
    <header className="px-4 flex h-14 shrink-0 items-center gap-4 border-b border-accent-secondary bg-main/70 backdrop-blur supports-[backdrop-filter]:bg-main/50 sticky top-0 z-40">
      <a href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="TheNextGameStation" width={116.56} height={33.8} loading="eager"/>
      </a>

      <Search/>

      <nav className="flex gap-4 md:gap-6">
        <ThemeToggle />

        <a href="/dashboard" className="btn-secondary h-9 w-9 px-0" aria-label="Admin dashboard" title="Admin dashboard">
          <Cog8ToothIcon className="w-5 h-5"/>
        </a>

        <MobileNav />
      </nav>


    </header>
  )
}