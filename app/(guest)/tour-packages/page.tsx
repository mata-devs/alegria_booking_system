'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/app/components/Footer'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { firebaseDb } from '@/app/lib/firebase'

const ACTIVITY_TAGS = ['Diving', 'Culture', 'Canyoneering', 'Beach', 'Museum', 'History'] as const;

interface FirestorePackage {
  id: string
  packageName: string
  packageDescription: string
  pricePerPerson: number
  packageLocation: string
  duration: string
  packageTag: string
  packageImages: string[]
  packageRating: number
  slug: string
}

const INITIAL_COUNT = 9

function PackageCard({ pkg }: { pkg: FirestorePackage }) {
  return (
    <Link href={`/tour-packages/${pkg.slug}`} className="block">
      <div className="relative rounded-2xl overflow-hidden cursor-pointer group h-72">
        <Image
          src={pkg.packageImages[0]}
          alt={pkg.packageName}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 via-green-900/40 to-green-900/90" />
        <div className="absolute top-4 left-4">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500 text-white">
            {pkg.duration}
          </span>
        </div>
        <div className="absolute inset-0 p-5 flex flex-col justify-end">
          <h3 className="text-white font-bold text-xl leading-tight mb-1 drop-shadow">{pkg.packageName}</h3>
          <p className="text-white/80 text-xs mb-3 line-clamp-2">{pkg.packageDescription}</p>
          <span className="text-white text-xs font-bold px-3 py-1.5 rounded-full self-start bg-green-500">
            Starting from ₱{pkg.pricePerPerson.toLocaleString()}.00
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function TourPackagesPage() {
  const [packages, setPackages] = useState<FirestorePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)

  useEffect(() => {
    const q = query(
      collection(firebaseDb, 'tourPackages'),
      where('status', '==', 'active'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setPackages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestorePackage)))
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = activeFilter
    ? packages.filter((p) => p.packageTag === activeFilter)
    : packages

  const visible = filtered.slice(0, visibleCount)

  return (
    <div className="min-h-screen flex flex-col bg-[#f0fdf4]">
      <section className="relative overflow-hidden">
        <div className="w-full" style={{ height: 'clamp(240px, 45vw, 420px)', position: 'relative' }}>
          <Image
            src="https://picsum.photos/seed/cebu-packages/1400/500"
            alt="Tour Packages"
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
        <div className="absolute top-0 left-0 px-4 sm:px-8 md:px-16 pt-5">
          <nav className="text-white/80 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-white font-medium">Tour Packages</span>
          </nav>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-white font-extrabold text-4xl sm:text-5xl md:text-6xl drop-shadow-lg tracking-wide mb-3">
            Tour Packages
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-xl">
            Curated adventures across the most beautiful spots in Cebu
          </p>
        </div>
      </section>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveFilter(null)}
            className={`flex items-center gap-1.5 border px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === null ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {ACTIVITY_TAGS.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === cat
                  ? 'bg-green-500 text-white border border-green-500'
                  : 'border border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="text-sm text-gray-400 py-20 text-center">Loading packages…</div>
        ) : visible.length === 0 ? (
          <div className="text-sm text-gray-400 py-20 text-center">
            {packages.length === 0 ? 'No tour packages available yet.' : 'No packages match this category.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {visible.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mb-10">
          {visibleCount < filtered.length && (
            <button
              onClick={() => setVisibleCount((c) => c + 6)}
              className="border border-gray-300 text-gray-700 px-10 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Show more
            </button>
          )}
          {visibleCount > INITIAL_COUNT && (
            <button
              onClick={() => setVisibleCount(INITIAL_COUNT)}
              className="border border-gray-300 text-gray-700 px-10 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
