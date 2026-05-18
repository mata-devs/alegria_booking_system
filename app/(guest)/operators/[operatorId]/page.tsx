'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { collection, doc, getDocs, getDoc, query, where } from 'firebase/firestore'
import Footer from '@/app/components/Footer'
import ActivityCard from '@/app/components/ActivityCard'
import PackageCard from '@/app/components/ui/PackageCard'
import { GuestReviewCard } from '@/app/components/GuestReviewCard'
import { firebaseDb } from '@/app/lib/firebase'
import { getAllApprovedReviewsForCatalog, type CatalogReview } from '@/app/lib/reviews-service'
import type { Activity } from '@/app/types'

interface OperatorInfo {
  uid: string
  companyName: string
  firstName: string
  lastName: string
  profileImage: string | null
  phoneNumber: string
  mobileNumber: string
  email: string | null
  memberSince: string | null
}

interface FirestorePackageRow {
  id: string
  packageName: string
  packageDescription: string
  pricePerPerson: number
  minimumNumberOfPeople: number
  packageLocation: string
  duration: string
  packageTag: string
  packageImages: string[]
  packageRating: number
  slug: string
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' | 'xl' }) {
  const cls = size === 'xl' ? 'w-6 h-6' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`${cls} ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
      <svg className="w-3 h-3 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <progress
        value={count}
        max={total || 1}
        className="flex-1 h-2 rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-gray-100 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-yellow-400 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-yellow-400"
      />
      <span className="text-xs text-gray-400 w-7 text-right">{pct}%</span>
    </div>
  )
}

export default function OperatorProfilePage() {
  const params = useParams()
  const operatorId = params.operatorId as string

  const [operator, setOperator] = useState<OperatorInfo | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [packages, setPackages] = useState<FirestorePackageRow[]>([])
  const [reviews, setReviews] = useState<CatalogReview[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [opSnap, actSnap, pkgSnap, allReviews] = await Promise.all([
          getDoc(doc(firebaseDb, 'users', operatorId)),
          getDocs(query(
            collection(firebaseDb, 'activities'),
            where('operatorId', '==', operatorId),
            where('status', '==', 'active'),
          )),
          getDocs(query(
            collection(firebaseDb, 'tourPackages'),
            where('operatorId', '==', operatorId),
            where('status', '==', 'active'),
          )),
          getAllApprovedReviewsForCatalog(),
        ])
        if (cancelled) return

        if (!opSnap.exists()) { setNotFound(true); return }

        const data = opSnap.data()
        const rawDate = data.applicationApproveDate ?? data.createdAt
        let memberSince: string | null = null
        try {
          if (rawDate) {
            const d = rawDate.toDate ? rawDate.toDate() : new Date(rawDate)
            memberSince = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          }
        } catch { /* ignore */ }

        setOperator({
          uid: opSnap.id,
          companyName:
            data.companyName ||
            `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() ||
            'Unknown Operator',
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          profileImage:
            typeof data.profileImage === 'string' && data.profileImage.startsWith('http')
              ? data.profileImage : null,
          phoneNumber: data.phoneNumber ?? '',
          mobileNumber: data.mobileNumber ?? '',
          email: data.email ?? null,
          memberSince,
        })

        const actList: Activity[] = actSnap.docs.map((d, idx) => {
          const a = d.data()
          return {
            id: idx,
            firestoreId: d.id,
            category: a.activityTag ?? '',
            title: a.activityName ?? '',
            location: a.activityLocation ?? '',
            rating: a.activityRating ?? 0,
            reviewCount: 0,
            price: a.pricePerGuest ?? 0,
            maxGuests: a.maximumNumberOfPeople ?? a.maxSlots ?? 30,
            image: a.activityImages?.[0] ?? '',
            municipalityId: a.activityLocation ?? '',
          }
        })
        actList.sort((a, b) => a.title.localeCompare(b.title))
        setActivities(actList)

        const pkgList: FirestorePackageRow[] = pkgSnap.docs.map((d) => {
          const p = d.data()
          return {
            id: d.id,
            packageName: p.packageName ?? '',
            packageDescription: p.packageDescription ?? '',
            pricePerPerson: p.pricePerPerson ?? 0,
            minimumNumberOfPeople: p.minimumNumberOfPeople ?? 1,
            packageLocation: p.packageLocation ?? '',
            duration: p.duration ?? '',
            packageTag: p.packageTag ?? '',
            packageImages: p.packageImages ?? [],
            packageRating: p.packageRating ?? 0,
            slug: p.slug ?? d.id,
          }
        })
        pkgList.sort((a, b) => a.packageName.localeCompare(b.packageName))
        setPackages(pkgList)

        const activityIds = new Set(actSnap.docs.map((d) => d.id))
        const pkgIds = new Set(pkgSnap.docs.map((d) => d.id))
        const operatorReviews = allReviews.filter((r) => {
          if (r.sourceType === 'activity') return activityIds.has(r.sourceId)
          if (r.sourceType === 'tourPackage') return pkgIds.has(r.sourceId)
          return false
        })
        setReviews(operatorReviews)
      } catch (e) {
        console.error('Failed to load operator profile:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [operatorId])

  const ratingStats = useMemo(() => {
    if (reviews.length === 0) return null
    const total = reviews.length
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    const avg = sum / total
    const breakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => Math.round(r.rating) === star).length,
    }))
    return { avg, total, breakdown }
  }, [reviews])

  const uniqueTags = useMemo(() => {
    const tags = new Set([
      ...activities.map((a) => a.category),
      ...packages.map((p) => p.packageTag),
    ].filter(Boolean))
    return [...tags]
  }, [activities, packages])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f0fdf4]">
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Loading operator profile…</div>
        <Footer />
      </div>
    )
  }

  if (notFound || !operator) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f0fdf4]">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="text-lg font-semibold text-gray-700">Operator not found</p>
          <Link href="/operators" className="text-sm text-green-600 hover:underline">← Back to operators</Link>
        </div>
        <Footer />
      </div>
    )
  }

  const heroSeed = encodeURIComponent(operator.companyName + '-hero')
  const avatarSeed = encodeURIComponent(operator.companyName)

  return (
    <div className="min-h-screen flex flex-col bg-[#f0fdf4]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative w-full h-[clamp(200px,30vw,320px)]">
          <Image
            src={`https://picsum.photos/seed/${heroSeed}/1400/500`}
            alt={operator.companyName}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        <div className="absolute top-0 left-0 px-8 md:px-16 pt-5">
          <nav className="text-white/80 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/operators" className="hover:text-white transition-colors">Tour Operators</Link>
            <span className="mx-2">›</span>
            <span className="text-white font-medium">{operator.companyName}</span>
          </nav>
        </div>
      </section>

      {/* Profile card */}
      <div className="relative z-10 -mt-16 px-4 sm:px-8 lg:px-16 mb-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl shadow-md">
            <Image
              src={operator.profileImage ?? `https://picsum.photos/seed/${avatarSeed}/120/120`}
              alt={operator.companyName}
              fill
              sizes="112px"
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{operator.companyName}</h1>
            {(operator.firstName || operator.lastName) && (
              <p className="text-sm text-gray-500 mt-0.5">{operator.firstName} {operator.lastName}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {ratingStats && (
                <div className="flex items-center gap-2">
                  <StarRating rating={ratingStats.avg} size="lg" />
                  <span className="text-sm font-bold text-gray-800">{ratingStats.avg.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({ratingStats.total} review{ratingStats.total !== 1 ? 's' : ''})</span>
                </div>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Cebu, Philippines
              </span>
            </div>
            {uniqueTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {uniqueTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 border border-green-100">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {(operator.phoneNumber || operator.mobileNumber || operator.email) && (
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4">
                {(operator.phoneNumber || operator.mobileNumber) && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {operator.phoneNumber || operator.mobileNumber}
                  </span>
                )}
                {operator.email && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {operator.email}
                  </span>
                )}
              </div>
            )}

            {operator.memberSince && (
              <p className="text-xs text-gray-400 mt-2">Member since {operator.memberSince}</p>
            )}

            <Link
              href="/activities"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
            >
              Book an Activity
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Stats column */}
          <div className="flex sm:flex-col gap-4 sm:gap-3 shrink-0 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
            <div className="text-center flex-1 sm:flex-none">
              <p className="text-2xl font-extrabold text-green-600">{activities.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Activities</p>
            </div>
            <div className="text-center flex-1 sm:flex-none">
              <p className="text-2xl font-extrabold text-green-600">{packages.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Packages</p>
            </div>
            <div className="text-center flex-1 sm:flex-none">
              <p className="text-2xl font-extrabold text-green-600">{reviews.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Reviews</p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16 space-y-12">

        {/* Rating Summary */}
        {ratingStats && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Overall Rating</h2>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              {/* Big score */}
              <div className="flex flex-col items-center shrink-0">
                <span className="text-7xl font-extrabold text-gray-900 leading-none">
                  {ratingStats.avg.toFixed(1)}
                </span>
                <StarRating rating={ratingStats.avg} size="xl" />
                <p className="text-sm text-gray-400 mt-2">
                  Based on {ratingStats.total} review{ratingStats.total !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Breakdown bars */}
              <div className="flex-1 w-full space-y-2.5">
                {ratingStats.breakdown.map(({ star, count }) => (
                  <RatingBar key={star} star={star} count={count} total={ratingStats.total} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Activities */}
        {activities.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Activities by {operator.companyName}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {activities.map((act) => (
                <ActivityCard key={act.firestoreId ?? act.id} activity={act} />
              ))}
            </div>
          </section>
        )}

        {/* Tour Packages */}
        {packages.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Tour Packages by {operator.companyName}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  image={pkg.packageImages[0] ?? ''}
                  title={pkg.packageName}
                  price={pkg.pricePerPerson}
                  pricePrefix="Starting from"
                  tag={pkg.packageTag}
                  duration={pkg.duration}
                  rating={pkg.packageRating}
                  minGuests={pkg.minimumNumberOfPeople}
                  cardKind="tourPackage"
                  href={`/tour-packages/${pkg.slug}`}
                />
              ))}
            </div>
          </section>
        )}

        {activities.length === 0 && packages.length === 0 && (
          <div className="py-20 text-center text-sm text-gray-400">
            No active listings from this operator yet.
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 ? (
          <section>
            <h2 className="text-xl font-bold text-green-600 mb-2 text-center">Guest Reviews</h2>
            <p className="text-sm text-gray-500 text-center mb-8">
              What travelers say about {operator.companyName}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((r) => (
                <GuestReviewCard key={r.id} review={r} itemTitle={r.itemTitle} />
              ))}
            </div>
          </section>
        ) : (activities.length > 0 || packages.length > 0) ? (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <h2 className="text-base font-semibold text-gray-700 mb-2">Guest Reviews</h2>
            <p className="text-sm text-gray-400">No reviews yet — be one of the first to explore and share your experience!</p>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}
