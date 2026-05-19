'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const RATES: Record<string, { rate: number; symbol: string; label: string }> = {
  USD: { rate: 0.0177, symbol: '$',   label: 'US Dollar' },
  EUR: { rate: 0.0162, symbol: '€',   label: 'Euro' },
  GBP: { rate: 0.0139, symbol: '£',   label: 'British Pound' },
  AUD: { rate: 0.0277, symbol: 'A$',  label: 'Australian Dollar' },
  SGD: { rate: 0.0238, symbol: 'S$',  label: 'Singapore Dollar' },
  JPY: { rate: 2.60,   symbol: '¥',   label: 'Japanese Yen' },
  KRW: { rate: 24.0,   symbol: '₩',   label: 'Korean Won' },
  CNY: { rate: 0.128,  symbol: 'CN¥', label: 'Chinese Yuan' },
}

function CurrencyConverter() {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('1000')
  const [currency, setCurrency] = useState('USD')
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    triggerRef.current?.setAttribute('aria-expanded', open ? 'true' : 'false')
  }, [open])

  const rate = RATES[currency]
  const parsed = parseFloat(amount || '0')
  const converted = !isNaN(parsed) && rate ? (parsed * rate.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-green-400 hover:bg-white/20 hover:text-green-400"
        aria-label="Currency converter"
        aria-haspopup="true"
      >
        <span className="text-green-500 text-base font-bold">₱</span>
        <span>PHP</span>
        <svg
          className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-68 min-w-[260px] rounded-2xl bg-white shadow-2xl border border-gray-100 p-5 z-50">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Currency Converter</p>

          <div className="mb-3">
            <label htmlFor="php-amount" className="text-xs font-medium text-gray-500 mb-1.5 block">Amount in PHP</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-green-400 transition-colors">
              <span className="text-green-500 font-bold shrink-0">₱</span>
              <input
                id="php-amount"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 outline-none text-sm font-semibold text-gray-900 bg-transparent"
                placeholder="1000"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="target-currency" className="text-xs font-medium text-gray-500 mb-1.5 block">Convert to</label>
            <select
              id="target-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 bg-white outline-none cursor-pointer focus:border-green-400 transition-colors"
            >
              {Object.entries(RATES).map(([code, info]) => (
                <option key={code} value={code}>{info.symbol} {code} — {info.label}</option>
              ))}
            </select>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 px-4 py-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Estimated value</p>
            <p className="text-3xl font-extrabold text-green-600 tracking-tight">
              {rate?.symbol}{converted}
            </p>
            <p className="text-xs font-medium text-gray-400 mt-0.5">{currency}</p>
          </div>

          <p className="text-[10px] text-gray-300 mt-3 text-center leading-relaxed">
            Rates are approximate. For reference only.
          </p>
        </div>
      )}
    </div>
  )
}

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
    return `text-base font-medium transition-colors ${isActive ? 'text-green-400' : 'text-white/80 hover:text-white'}`
  }

  const mobileLinkClass = (path: string, exact = false) => {
    const isActive = exact ? pathname === path : pathname === path || pathname.startsWith(path + '/')
    return `block px-4 py-3 text-base font-medium rounded-xl transition-colors ${
      isActive ? 'bg-green-500/20 text-green-400' : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`
  }

  return (
    <nav className="sticky top-0 z-50 bg-black">
      <div className="relative">
        <div className="flex h-20 w-full items-center justify-between px-6 sm:px-10 lg:px-16">
          <Link href="/" className="flex items-center" onClick={handleNavClick}>
            <span className="text-2xl text-green-400 [font-family:'Potta_One',cursive]">VisitCebu</span>
          </Link>

          <div className="hidden items-center gap-10 md:flex">
            <Link href="/" className={linkClass('/', true)}>Home</Link>
            <Link href="/locations" className={linkClass('/locations')}>Locations</Link>
            <Link href="/activities" className={linkClass('/activities')}>Activities</Link>
            <Link href="/tour-packages" className={linkClass('/tour-packages')}>Tour Packages</Link>
            <Link href="/accommodations" className={linkClass('/accommodations')}>Accommodations</Link>
          </div>

          <div className="hidden md:flex items-center">
            <CurrencyConverter />
          </div>

          <button
            type="button"
            ref={menuButtonRef}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg transition-colors hover:bg-white/10 md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 top-20 z-40 cursor-default bg-black/40 md:hidden"
            />
            <div className="absolute inset-x-0 top-full z-50 space-y-1 border-t border-white/10 bg-black px-4 py-3 shadow-xl md:hidden">
              <Link href="/" className={mobileLinkClass('/', true)} onClick={handleNavClick}>Home</Link>
              <Link href="/locations" className={mobileLinkClass('/locations')} onClick={handleNavClick}>Locations</Link>
              <Link href="/activities" className={mobileLinkClass('/activities')} onClick={handleNavClick}>Activities</Link>
              <Link href="/tour-packages" className={mobileLinkClass('/tour-packages')} onClick={handleNavClick}>Tour Packages</Link>
              <Link href="/accommodations" className={mobileLinkClass('/accommodations')} onClick={handleNavClick}>Accommodations</Link>
              <div className="px-4 pt-2 pb-1">
                <CurrencyConverter />
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}
