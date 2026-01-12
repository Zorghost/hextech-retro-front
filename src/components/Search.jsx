'use client'
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recent, setRecent] = useState([]);
  const router = useRouter();
  const rootRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("recentSearches");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setRecent(parsed.slice(0, 8));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const suggestions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return recent;
    return recent.filter((t) => String(t).toLowerCase().includes(q));
  }, [recent, searchTerm]);

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  }

  const handleSearch = (event) => {
    event.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;

    try {
      const next = [q, ...recent.filter((t) => t !== q)].slice(0, 8);
      setRecent(next);
      localStorage.setItem("recentSearches", JSON.stringify(next));
    } catch {
      // ignore
    }

    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return ( 
    <div ref={rootRef} className="relative flex-1 max-w-md mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent"/>
        <input
          type="search"
          value={searchTerm}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for games... e.g. Super Mario"
          className="input h-9 pl-9"
        />
      </form>

      {isOpen && suggestions.length > 0 && (
        <div className="card absolute left-0 right-0 mt-2 overflow-hidden">
          <div className="px-3 py-2 text-xs text-accent uppercase">Recent</div>
          <ul>
            {suggestions.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent-secondary"
                  onClick={() => {
                    setSearchTerm(t);
                    setIsOpen(false);
                    router.push(`/search?q=${encodeURIComponent(t)}`);
                  }}
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}