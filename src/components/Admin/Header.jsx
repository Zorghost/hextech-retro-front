import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/auth";

export default function Header() {
  return (
    <header className="px-4 flex h-14 shrink-0 items-center gap-4 justify-between">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/logo.svg"
          alt="TheNextGameStation"
          width={116.56}
          height={33.8}
          loading="eager"
        />
      </Link>

      <nav className="flex gap-4 md:gap-6">

        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button
            type="submit"
            className="text-sm border border-accent py-2 px-3 rounded-xl hover:bg-accent-secondary"
          >
            Sign Out
          </button>
        </form>

        <Link href="/" className="text-sm underline">
          Visit Main Site &#8599;
        </Link>
      </nav>
    </header>
  );
}
