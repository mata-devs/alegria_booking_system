'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { collection, getDocs, query, where as firestoreWhere } from 'firebase/firestore'
import { firebaseDb } from '@/app/lib/firebase'

interface Props {
  className?: string
  defaultWhere?: string
  onSearch?: (params: { where: string; when: string; travelers: string }) => void
}

export default function SearchBar({ className = '', defaultWhere = '', onSearch }: Props) {
  const [where, setWhere] = useState(defaultWhere)
  const [when, setWhen] = useState('')
  const [travelers, setTravelers] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locationData, setLocationData] = useState<{ name: string; count: number }[]>([])
  const desktopWhereRef = useRef<HTMLDivElement>(null)
  const mobileWrapperRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchLocations() {
      try {
        const snap = await getDocs(query(collection(firebaseDb, 'activities'), firestoreWhere('status', '==', 'active')))
        const counts: Record<string, number> = {}
        snap.docs.forEach((d) => {
          const loc = d.data().activityLocation as string
          if (loc) counts[loc] = (counts[loc] ?? 0) + 1
        })
        setLocationData(
          Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        )
      } catch {
        // silently fail — suggestions just won't populate
      }
    }
    fetchLocations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const suggestions = where.trim()
    ? locationData.filter((l) => l.name.toLowerCase().includes(where.toLowerCase()))
    : locationData

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ where, when, travelers })
    } else {
      router.push(`/activities?location=${where}&date=${when}&travelers=${travelers}`)
    }
  }

  const selectLocation = (name: string) => {
    setWhere(name)
    setShowSuggestions(false)
    if (onSearch) {
      onSearch({ where: name, when, travelers })
    } else {
      router.push(
        `/activities?location=${encodeURIComponent(name)}&date=${encodeURIComponent(when)}&travelers=${encodeURIComponent(travelers)}`
      )
    }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      const insideDesktop = desktopWhereRef.current?.contains(target)
      const insideMobile = mobileWrapperRef.current?.contains(target)
      if (!insideDesktop && !insideMobile) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const suggestionDropdown = (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 mt-2 overflow-y-auto" style={{ maxHeight: '232px' }}>
      {suggestions.length > 0 ? (
        suggestions.map((loc) => (
          <button
            key={loc.name}
            onMouseDown={(e) => { e.preventDefault(); selectLocation(loc.name) }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors text-left"
          >
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
              <Image src={`https://picsum.photos/seed/${encodeURIComponent(loc.name)}/80/80`} alt={loc.name} fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{loc.name}</p>
              <p className="text-xs text-gray-400">{loc.count} {loc.count === 1 ? 'activity' : 'activities'} · Cebu, Philippines</p>
            </div>
          </button>
        ))
      ) : (
        <div className="px-4 py-3 text-sm text-gray-400">No locations found</div>
      )}
    </div>
  )

  return (
    <div className={`${className}`}>
      {/* Desktop */}
      <div className="hidden sm:flex bg-white rounded-full shadow-2xl items-stretch overflow-visible relative">
        <div ref={desktopWhereRef} className="relative flex-1 min-w-0">
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="bg-green-50 rounded-full p-2 shrink-0">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0 w-full">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Where</span>
              <input
                type="text"
                id="where-desktop"
                name="where"
                autoComplete="off"
                aria-label="Where in Cebu?"
                placeholder="Where in Cebu?"
                value={where}
                onChange={(e) => { setWhere(e.target.value); setShowSuggestions(true); if (e.target.value === '' && onSearch) onSearch({ where: '', when, travelers }) }}
                onFocus={() => setShowSuggestions(true)}
                className="outline-none text-sm font-medium text-gray-800 placeholder-gray-400 w-full bg-transparent"
              />
            </div>
          </div>
          {showSuggestions && suggestionDropdown}
        </div>
        <div className="w-px my-4 bg-gray-200 shrink-0" />
        <div className="flex items-center gap-3 px-6 py-4 flex-1 min-w-0">
          <div className="bg-green-50 rounded-full p-2 shrink-0">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0 w-full">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">When</span>
            <input type="date" id="when-desktop" name="when" autoComplete="off" aria-label="Travel date" value={when} onChange={(e) => setWhen(e.target.value)}
              className="outline-none text-sm font-medium text-gray-800 w-full bg-transparent [color-scheme:light]"
              style={{ colorScheme: 'light' }} />
          </div>
        </div>
        <div className="w-px my-4 bg-gray-200 shrink-0" />
        <div className="flex items-center gap-3 px-6 py-4 flex-1 min-w-0">
          <div className="bg-green-50 rounded-full p-2 shrink-0">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0 w-full">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Travelers</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setTravelers(t => String(Math.max(1, Number(t || 1) - 1)))}
                className="w-6 h-6 rounded-full border border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 flex items-center justify-center shrink-0 transition-colors text-base leading-none">−</button>
              <span className="text-sm font-medium text-gray-800 min-w-[1.5rem] text-center">{travelers || '1'}</span>
              <button type="button" onClick={() => setTravelers(t => String(Number(t || 1) + 1))}
                className="w-6 h-6 rounded-full border border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 flex items-center justify-center shrink-0 transition-colors text-base leading-none">+</button>
              <span className="text-sm text-gray-400 ml-1">{Number(travelers || 1) === 1 ? 'guest' : 'guests'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center p-2.5 shrink-0">
          <button onClick={handleSearch}
            className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold px-8 py-3 my-1.5 mr-1.5 text-sm transition-all rounded-full flex items-center gap-2 shadow-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div ref={mobileWrapperRef} className="sm:hidden bg-white rounded-2xl shadow-2xl overflow-visible">
        <div className="relative">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="bg-green-50 rounded-full p-2 shrink-0">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0 w-full">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Where</span>
              <input
                type="text"
                id="where-mobile"
                name="where"
                autoComplete="off"
                aria-label="Where in Cebu?"
                placeholder="Where in Cebu?"
                value={where}
                onChange={(e) => { setWhere(e.target.value); setShowSuggestions(true); if (e.target.value === '' && onSearch) onSearch({ where: '', when, travelers }) }}
                onFocus={() => setShowSuggestions(true)}
                className="outline-none text-sm font-medium text-gray-800 placeholder-gray-400 w-full bg-transparent"
              />
            </div>
          </div>
          {showSuggestions && suggestionDropdown}
        </div>
        <div className="flex items-center gap-3 px-4 py-4 border-t border-gray-100">
          <div className="bg-green-50 rounded-full p-2 shrink-0">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">When</span>
            <input type="date" id="when-mobile" name="when" autoComplete="off" aria-label="Travel date" value={when} onChange={(e) => setWhen(e.target.value)}
              className="outline-none text-sm font-medium text-gray-800 bg-transparent mt-0.5 w-full [color-scheme:light]"
              style={{ colorScheme: 'light' }} />
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-4 border-t border-gray-100">
          <div className="bg-green-50 rounded-full p-2 shrink-0">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Travelers</span>
            <div className="flex items-center gap-3 mt-0.5">
              <button type="button" onClick={() => setTravelers(t => String(Math.max(1, Number(t || 1) - 1)))}
                className="w-6 h-6 rounded-full border border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 flex items-center justify-center shrink-0 transition-colors text-base leading-none">−</button>
              <span className="text-sm font-medium text-gray-800 min-w-[1.5rem] text-center">{travelers || '1'}</span>
              <button type="button" onClick={() => setTravelers(t => String(Number(t || 1) + 1))}
                className="w-6 h-6 rounded-full border border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 flex items-center justify-center shrink-0 transition-colors text-base leading-none">+</button>
              <span className="text-sm text-gray-400">{Number(travelers || 1) === 1 ? 'guest' : 'guests'}</span>
            </div>
          </div>
        </div>
        <div className="p-3 border-t border-gray-100">
          <button onClick={handleSearch}
            className="w-full bg-green-400 hover:bg-green-500 active:scale-95 text-white font-bold py-4 text-sm rounded-xl flex items-center justify-center gap-2 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </div>
      </div>
    </div>
  )
}
