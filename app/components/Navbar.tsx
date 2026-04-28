'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  const handleNavClick = () => setMenuOpen(false)

  const linkClass = (path: string, exact = false) => {
    const isActive = exact ? pathname === path : pathname === path
    return `text-base font-medium transition-colors ${isActive ? 'text-green-500' : 'text-gray-700 hover:text-green-500'}`
  }

  const mobileLinkClass = (path: string, exact = false) => {
    const isActive = exact ? pathname === path : pathname === path
    return `block px-4 py-3 text-base font-medium rounded-xl transition-colors ${
      isActive ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-50'
    }`
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="w-full px-6 sm:px-10 lg:px-16 flex items-center justify-between h-20">
        <Link href="/" className="flex items-center" onClick={handleNavClick}>
          <span className="text-green-500 text-2xl" style={{ fontFamily: "'Potta One', cursive" }}>Visit Cebu</span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <Link href="/" className={linkClass('/')}>Home</Link>
          <Link href="/activities" className={linkClass('/activities')}>Activities</Link>
          <Link href="/locations" className={linkClass('/locations')}>Locations</Link>
          <Link href="/tour-packages" className={linkClass('/tour-packages')}>Tour Packages</Link>
        </div>

        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          <Link href="/" className={mobileLinkClass('/')} onClick={handleNavClick}>Home</Link>
          <Link href="/activities" className={mobileLinkClass('/activities')} onClick={handleNavClick}>Activities</Link>
          <Link href="/locations" className={mobileLinkClass('/locations')} onClick={handleNavClick}>Locations</Link>
          <Link href="/tour-packages" className={mobileLinkClass('/tour-packages')} onClick={handleNavClick}>Tour Packages</Link>
        </div>
      )}
    </nav>
  )
}
