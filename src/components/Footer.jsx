export default function Footer() {
  return (
    <footer className="text-center text-accent pt-12 pb-6">
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm mb-3">
        <a href="/category" className="hover:underline underline-offset-4">Categories</a>
        <a href="/search?q=mario" className="hover:underline underline-offset-4">Search</a>
        <a href="/dashboard" className="hover:underline underline-offset-4">Admin</a>
      </div>

      <div>&copy; {new Date().getFullYear()} TheNextGamePlatform</div>
    </footer>
  )
}