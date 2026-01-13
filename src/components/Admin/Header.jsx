import Image from "next/image";
import { signOut } from "@/app/auth";
import Link from "next/link";

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
          <button type="submit">Sign Out</button>
        </form>

        <Link href="/">Vist Main Site &#8599;</Link>
      </nav>
    </header>
  );
}
