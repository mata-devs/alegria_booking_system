'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { collection, getDocs, query, where } from 'firebase/firestore'
import Footer from '@/app/components/Footer'
import { DotSealBadge } from '@/app/components/ui/DotSealBadge'
import { firebaseDb } from '@/app/lib/firebase'

interface GuestOperator {
  uid: string
  companyName: string
  firstName: string
  lastName: string
  profileImage: string | null
  location: string
  avgRating: number
  ratedCount: number
  activityCount: number
  packageCount: number
  isVerified: boolean
  hasDOTQualitySeal: boolean
}

type SortOption = 'Recommended' | 'Highest rated' | 'Most active' | 'A–Z'

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.floor(rating)
        const half = !filled && n - 0.5 <= rating
        return (
          <svg key={n} width="11" height="11" viewBox="0 0 20 20" className="text-[#f1a500]">
            <defs>
              {half && (
                <linearGradient id={`half-op-${n}`}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              )}
            </defs>
            <path
              fill={half ? `url(#half-op-${n})` : filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={filled || half ? 0 : 1}
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        )
      })}
    </span>
  )
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide bg-[#d9efe6] text-[#003a2d]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#008768]" />
        Verified
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide bg-gray-100 text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Unverified
    </span>
  )
}

function OperatorCard({ op }: { op: GuestOperator }) {
  const router = useRouter()
  const offerCount = op.activityCount + op.packageCount

  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col"
      onClick={() => router.push(`/operators/${op.uid}`)}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {op.profileImage ? (
          <Image
            src={op.profileImage}
            alt={op.companyName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-green-50">
            <span className="text-5xl font-extrabold text-green-200">
              {op.companyName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <VerifiedBadge verified={op.isVerified} />
        </div>
        {op.hasDOTQualitySeal && (
          <div className="absolute top-3 right-3">
            <DotSealBadge granted size="sm" showLabel={false} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div>
          <h3 className="font-extrabold text-gray-900 text-[15px] leading-tight">{op.companyName}</h3>
          {op.location && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {op.location}
            </p>
          )}
        </div>

        {/* Rating */}
        {op.avgRating > 0 ? (
          <div className="flex items-center gap-1.5">
            <StarRating rating={op.avgRating} />
            <span className="text-xs font-bold text-gray-700">{op.avgRating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({op.ratedCount.toLocaleString()})</span>
          </div>
        ) : (
          <p className="text-xs text-gray-400">No ratings yet</p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono tracking-wide">
          <span>{offerCount > 0 ? `${offerCount} offer${offerCount !== 1 ? 's' : ''}` : 'No offers yet'}</span>
          {op.activityCount > 0 && op.packageCount > 0 && (
            <>
              <span className="w-px h-3 bg-gray-200" />
              <span>{op.activityCount} act · {op.packageCount} pkg</span>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<GuestOperator[]>([])
  const [loading, setLoading] = useState(true)
  const [filterVerified, setFilterVerified] = useState(false)
  const [filterDOT, setFilterDOT] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('Recommended')
  const [visibleCount, setVisibleCount] = useState(8)

  useEffect(() => {
    async function load() {
      try {
        const [opSnap, actSnap, pkgSnap] = await Promise.all([
          getDocs(query(collection(firebaseDb, 'users'), where('role', '==', 'operator'), where('status', '==', 'active'))),
          getDocs(query(collection(firebaseDb, 'activities'), where('status', '==', 'active'))),
          getDocs(query(collection(firebaseDb, 'tourPackages'), where('status', '==', 'active'))),
        ])

        const ratingMap = new Map<string, { sum: number; count: number }>()
        const activityCountMap = new Map<string, number>()
        const packageCountMap = new Map<string, number>()

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

        for (const d of pkgSnap.docs) {
          const data = d.data()
          const opId = data.operatorId as string | undefined
          if (!opId) continue
          packageCountMap.set(opId, (packageCountMap.get(opId) ?? 0) + 1)
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
            location: data.businessLocation ?? data.location ?? '',
            avgRating: rEntry ? rEntry.sum / rEntry.count : 0,
            ratedCount: rEntry?.count ?? 0,
            activityCount: activityCountMap.get(d.id) ?? 0,
            packageCount: packageCountMap.get(d.id) ?? 0,
            isVerified: Boolean(data.applicationApproveDate),
            hasDOTQualitySeal: data.hasDOTQualitySeal === true,
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
    let list = operators.filter((op) => {
      if (filterVerified && !op.isVerified) return false
      if (filterDOT && !op.hasDOTQualitySeal) return false
      return true
    })
    if (sortBy === 'Highest rated') list = [...list].sort((a, b) => b.avgRating - a.avgRating || a.companyName.localeCompare(b.companyName))
    else if (sortBy === 'Most active') list = [...list].sort((a, b) => (b.activityCount + b.packageCount) - (a.activityCount + a.packageCount) || a.companyName.localeCompare(b.companyName))
    else if (sortBy === 'A–Z') list = [...list].sort((a, b) => a.companyName.localeCompare(b.companyName))
    return list
  }, [operators, filterVerified, filterDOT, sortBy])

  const visible = filtered.slice(0, visibleCount)

  const activeFiltersCount = (filterVerified ? 1 : 0) + (filterDOT ? 1 : 0)

  const avgRating = operators.length > 0 && operators.some((o) => o.avgRating > 0)
    ? (operators.filter((o) => o.avgRating > 0).reduce((s, o) => s + o.avgRating, 0) / operators.filter((o) => o.avgRating > 0).length).toFixed(1)
    : null

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f4ef]">

      {/* Hero band */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
          <nav className="flex items-center gap-2 text-[11px] font-mono tracking-[.14em] uppercase text-gray-400 mb-3">
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
            <span className="text-gray-300">/</span>
            <span className="text-[#008768]">Local Partners</span>
          </nav>

          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div>
              <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-tight tracking-[-0.025em] text-gray-900 m-0">
                Local Partners in{' '}
                <em className="not-italic font-normal text-[#008768]">Cebu</em>.
              </h1>
              <p className="mt-2 text-sm text-gray-500 max-w-[540px]">
                Vetted local operators and tour providers offering authentic, safe experiences across the island.
              </p>
            </div>
            <div className="hidden lg:flex gap-6 shrink-0">
              {[
                [`${loading ? '—' : operators.length}`, 'local partners'],
                ...(avgRating ? [[`${avgRating}★`, 'avg rating']] : []),
              ].map(([n, l]) => (
                <div key={l} className="text-right">
                  <div className="text-2xl font-extrabold tracking-[-0.02em] leading-none text-gray-900">{n}</div>
                  <div className="mt-1 text-[10px] font-mono tracking-[.12em] uppercase text-gray-400">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-3">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">

            <span className="text-[10px] font-mono tracking-[.14em] uppercase text-gray-400 shrink-0">Filter</span>

            <button
              type="button"
              onClick={() => setFilterVerified((v) => !v)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                filterVerified
                  ? 'border-[#008768] bg-[#d9efe6] text-[#003a2d]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              Verified only
            </button>

            <button
              type="button"
              onClick={() => setFilterDOT((v) => !v)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                filterDOT
                  ? 'border-[#008768] bg-[#d9efe6] text-[#003a2d]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              DOT Quality Seal
            </button>

            {activeFiltersCount > 0 && (
              <>
                <div className="w-px h-5 bg-gray-200 shrink-0 mx-1" />
                <button
                  type="button"
                  onClick={() => { setFilterVerified(false); setFilterDOT(false) }}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-300 bg-white text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Clear all ({activeFiltersCount})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 pb-20 lg:pb-16 flex-1">

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-2xl font-extrabold text-gray-900 tracking-[-0.02em]">
              {loading ? '—' : filtered.length} partner{filtered.length !== 1 ? 's' : ''}
            </span>
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-sm text-gray-400">matching your filters</span>
            )}
          </div>
          <select
            aria-label="Sort partners"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs sm:text-[13px] px-3 sm:px-3.5 py-2 sm:py-2.5 border border-gray-200 rounded-full bg-white font-medium text-gray-700 outline-none cursor-pointer"
          >
            {(['Recommended', 'Highest rated', 'Most active', 'A–Z'] as SortOption[]).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">Loading partners…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-400">
            {operators.length === 0 ? 'No partners listed yet.' : 'No partners match your filters.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {visible.map((op) => (
              <OperatorCard key={op.uid} op={op} />
            ))}
          </div>
        )}

        {/* Load more */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-400">
              Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} partners
            </span>
            <div className="flex gap-3">
              {visibleCount < filtered.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + 8)}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Load more
                </button>
              )}
              {visibleCount > 8 && (
                <button
                  type="button"
                  onClick={() => setVisibleCount(8)}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
