'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import { MapPin, Search, X } from 'lucide-react'

interface LocationPickerProps {
  value: string
  onChange: (address: string, lat: number, lng: number) => void
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
}

const DEFAULT_LAT = 10.3157
const DEFAULT_LNG = 123.8854

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const markerRef = useRef<import('leaflet').Marker | null>(null)

  const [search, setSearch] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipSearchRef = useRef(false)

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    let cancelled = false
    let leafletMap: import('leaflet').Map | null = null
    let leafletMarker: import('leaflet').Marker | null = null

    import('leaflet').then((mod) => {
      if (cancelled || !container.isConnected) return

      const L = mod.default

      const icon = L.icon({
        iconUrl: '/leaflet/marker-icon.png',
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        shadowUrl: '/leaflet/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })

      leafletMap = L.map(container, { zoomControl: true }).setView([DEFAULT_LAT, DEFAULT_LNG], 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(leafletMap)

      leafletMarker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { draggable: true, icon }).addTo(leafletMap)

      leafletMarker.on('dragend', async () => {
        if (!leafletMarker) return
        const { lat, lng } = leafletMarker.getLatLng()
        const addr = await reverseGeocode(lat, lng)
        onChange(addr, lat, lng)
      })

      leafletMap.on('click', async (e) => {
        if (!leafletMarker) return
        const { lat, lng } = e.latlng
        leafletMarker.setLatLng([lat, lng])
        const addr = await reverseGeocode(lat, lng)
        onChange(addr, lat, lng)
      })

      mapRef.current = leafletMap
      markerRef.current = leafletMarker
    })

    return () => {
      cancelled = true
      leafletMap?.remove()
      leafletMap = null
      leafletMarker = null
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (skipSearchRef.current) { skipSearchRef.current = false; return }
    if (!search.trim()) { setResults([]); setShowResults(false); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=7&countrycodes=ph&viewbox=123.3,11.3,124.2,9.3&bounded=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data: NominatimResult[] = await res.json()
        setResults(data)
        setShowResults(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }, [search])

  function selectResult(result: NominatimResult) {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lng], 15)
      markerRef.current.setLatLng([lat, lng])
    }
    onChange(result.display_name, lat, lng)
    skipSearchRef.current = true
    setSearch(result.display_name)
    setShowResults(false)
    setResults([])
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            inputMode="search"
            placeholder="Search location in Cebu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            aria-label="Search for an address"
            className="w-full rounded-xl border border-gray-300 pl-10 pr-10 py-3 text-base text-gray-900 focus:border-[#558B2F] focus:outline-none focus:ring-2 focus:ring-[#558B2F]/30 transition"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => { setSearch(''); setResults([]); setShowResults(false) }}
              className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 active:text-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {showResults && (results.length > 0 || searching) && (
          <ul className="absolute z-[9999] mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl text-sm overflow-hidden divide-y divide-gray-50">
            {searching && (
              <li className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-gray-300 border-t-[#558B2F] animate-spin" />
                Searching…
              </li>
            )}
            {results.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => selectResult(r)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-green-50 active:bg-green-100 transition-colors"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#558B2F]" />
                  <span className="text-gray-700 leading-snug">{r.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div ref={mapContainerRef} className="h-[240px] w-full sm:h-[280px]" />
        <div className="absolute bottom-3 left-3 z-[500] rounded-lg bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[11px] text-gray-500 shadow pointer-events-none flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-[#558B2F]" />
          Tap map or drag pin to set location
        </div>
      </div>

      {/* Selected address */}
      {value && (
        <div className="flex items-start gap-2.5 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#558B2F]" />
          <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
        </div>
      )}
    </div>
  )
}
