'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    menuButtonRef.current?.setAttribute('aria-expanded', menuOpen ? 'true' : 'false')
  }, [menuOpen])

  const handleNavClick = () => setMenuOpen(false)

  const linkClass = (path: string, exact = false) => {
    const isActive = exact ? pathname === path : pathname === path || pathname.startsWith(path + '/')
    return `text-base font-medium transition-colors ${isActive ? 'text-green-500' : 'text-gray-700 hover:text-green-500'}`
  }

  const mobileLinkClass = (path: string, exact = false) => {
    const isActive = exact ? pathname === path : pathname === path || pathname.startsWith(path + '/')
    return `block px-4 py-3 text-base font-medium rounded-xl transition-colors ${
      isActive ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-50'
    }`
  }

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="relative">
        <div className="flex h-20 w-full items-center justify-between px-6 sm:px-10 lg:px-16">
          <Link href="/" className="flex items-center" onClick={handleNavClick}>
            <span className="text-2xl text-green-500 [font-family:'Potta_One',cursive]">VisitCebu</span>
          </Link>

          <div className="hidden items-center gap-10 md:flex">
            <Link href="/" className={linkClass('/')}>Home</Link>
            <Link href="/activities" className={linkClass('/activities')}>Activities</Link>
            <Link href="/locations" className={linkClass('/locations')}>Locations</Link>
            <Link href="/tour-packages" className={linkClass('/tour-packages')}>Tour Packages</Link>
            <Link href="/operators" className={linkClass('/operators')}>Operators</Link>
          </div>

          <button
            ref={menuButtonRef}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg transition-colors hover:bg-gray-50 md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 top-20 z-40 cursor-default bg-black/20 md:hidden"
            />
            <div className="absolute inset-x-0 top-full z-50 space-y-1 border-t border-gray-100 bg-white px-4 py-3 shadow-lg md:hidden">
              <Link href="/" className={mobileLinkClass('/')} onClick={handleNavClick}>Home</Link>
              <Link href="/activities" className={mobileLinkClass('/activities')} onClick={handleNavClick}>Activities</Link>
              <Link href="/locations" className={mobileLinkClass('/locations')} onClick={handleNavClick}>Locations</Link>
              <Link href="/tour-packages" className={mobileLinkClass('/tour-packages')} onClick={handleNavClick}>Tour Packages</Link>
              <Link href="/operators" className={mobileLinkClass('/operators')} onClick={handleNavClick}>Operators</Link>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}
