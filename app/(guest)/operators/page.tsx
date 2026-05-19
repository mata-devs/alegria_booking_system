'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { collection, getDocs, query, where } from 'firebase/firestore'
import Footer from '@/app/components/Footer'
import { firebaseDb } from '@/app/lib/firebase'

interface GuestOperator {
  uid: string
  companyName: string
  firstName: string
  lastName: string
  profileImage: string | null
  avgRating: number
  ratedCount: number
  activityCount: number
  isVerified: boolean
}

function MiniStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-px">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<GuestOperator[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'name' | 'rating' | 'activities'>('name')
  const router = useRouter()

  useEffect(() => {
    async function load() {
      try {
        const [opSnap, actSnap] = await Promise.all([
          getDocs(query(collection(firebaseDb, 'users'), where('role', '==', 'operator'), where('status', '==', 'active'))),
          getDocs(query(collection(firebaseDb, 'activities'), where('status', '==', 'active'))),
        ])

        // Build per-operator rating map and activity count from activity docs
        const ratingMap = new Map<string, { sum: number; count: number }>()
        const activityCountMap = new Map<string, number>()
        for (const d of actSnap.docs) {
          const data = d.data()
          const opId = data.operatorId as string | undefined
          if (!opId) continue
          activityCountMap.set(opId, (activityCountMap.get(opId) ?? 0) + 1)
          const rating = data.activityRating as number | undefined
          if (!rating || rating <= 0) continue
          const entry = ratingMap.get(opId) ?? { sum: 0, count: 0 }
          entry.sum += rating
          entry.count += 1
          ratingMap.set(opId, entry)
        }

        const list: GuestOperator[] = opSnap.docs.map((d) => {
          const data = d.data()
          const rEntry = ratingMap.get(d.id)
          return {
            uid: d.id,
            companyName:
              data.companyName ||
              `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() ||
              'Unknown Operator',
            firstName: data.firstName ?? '',
            lastName: data.lastName ?? '',
            profileImage:
              typeof data.profileImage === 'string' && data.profileImage.startsWith('http')
                ? data.profileImage
                : null,
            avgRating: rEntry ? rEntry.sum / rEntry.count : 0,
            ratedCount: rEntry?.count ?? 0,
            activityCount: activityCountMap.get(d.id) ?? 0,
            isVerified: Boolean(data.applicationApproveDate),
          }
        })
        setOperators(list)
      } catch (e) {
        console.error('Failed to load operators:', e)
        setOperators([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const base = operators.filter((op) => op.companyName.toLowerCase().includes(search.toLowerCase()))
    if (sort === 'rating') return [...base].sort((a, b) => b.avgRating - a.avgRating || a.companyName.localeCompare(b.companyName))
    if (sort === 'activities') return [...base].sort((a, b) => b.activityCount - a.activityCount || a.companyName.localeCompare(b.companyName))
    return [...base].sort((a, b) => a.companyName.localeCompare(b.companyName))
  }, [operators, search, sort])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <section className="relative overflow-hidden">
        <div className="relative w-full h-[clamp(180px,25vw,280px)]">
          <Image
            src="https://picsum.photos/seed/cebu-operators-hero/1400/500"
            alt="Tour Operators"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
        <div className="absolute top-0 left-0 px-4 sm:px-8 md:px-16 pt-5">
          <nav className="text-white/80 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">&rsaquo;</span>
            <span className="text-white font-medium">Tour Operators</span>
          </nav>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-white font-extrabold text-4xl sm:text-5xl md:text-6xl drop-shadow-lg tracking-wide mb-3">
            Tour Operators
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-xl">
            Trusted local operators offering the best experiences across Cebu
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 pb-16">
        <div className="flex items-center bg-white rounded-full shadow-md border border-gray-100 px-6 py-4 mb-4 max-w-2xl mx-auto">
          <svg className="w-5 h-5 text-gray-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search operators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none text-sm text-gray-700 placeholder-gray-400 flex-1 bg-transparent"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-2xl mx-auto mb-8">
          <p className="text-sm text-gray-400">{filtered.length} operator{filtered.length !== 1 ? 's' : ''}</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'name' as const, label: 'A-Z' },
              { value: 'rating' as const, label: 'Top Rated' },
              { value: 'activities' as const, label: 'Most Active' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSort(opt.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  sort === opt.value
                    ? 'bg-green-500 text-white border-green-500'
                    : 'border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600 bg-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500 py-16 text-center">Loading operators…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-500 py-16 text-center">
            {operators.length === 0 ? 'No operators registered yet.' : 'No operators match your search.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((op) => (
              <div
                key={op.uid}
                onClick={() => router.push(`/operators/${op.uid}`)}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-green-100">
                  {op.profileImage ? (
                    <Image
                      src={op.profileImage}
                      alt={op.companyName}
                      fill
                      sizes="64px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xl font-bold text-green-600">
                      {op.companyName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-gray-900 text-sm leading-tight truncate group-hover:text-green-600 transition-colors">
                      {op.companyName}
                    </p>
                    {op.isVerified && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  {op.avgRating > 0 ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <MiniStars rating={op.avgRating} />
                      <span className="text-xs font-semibold text-gray-700">{op.avgRating.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({op.ratedCount})</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">No ratings yet</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {op.activityCount > 0 ? `${op.activityCount} ${op.activityCount === 1 ? 'activity' : 'activities'}` : 'No activities yet'}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

