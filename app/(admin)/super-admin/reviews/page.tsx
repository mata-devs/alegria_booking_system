'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table';
import {
  Search,
  SlidersHorizontal,
  Star,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Flag,
  Loader2,
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { firebaseDb } from '@/app/lib/firebase';
import { useAuth } from '@/app/context/AuthContext';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    tdClassName?: string;
    thClassName?: string;
  }
}

type ReviewStatus = 'Pending' | 'Published' | 'Flagged';

interface FirestoreReview {
  id: string;
  bookingId: string;
  operatorUid: string;
  sourceType: 'activity' | 'tourPackage';
  activityId: string | null;
  tourPackageId: string | null;
  location: string;
  reviewerName: string;
  reviewerCountry: string;
  displayConsent: boolean;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  status: 'pending' | 'approved' | 'flagged';
  moderatedAt: Timestamp | null;
  moderatedByUid: string | null;
  createdAt: Timestamp;
}

interface Review {
  id: string;
  bookingId: string;
  operatorUid: string;
  sourceType: 'activity' | 'tourPackage';
  itemId: string;
  location: string;
  reviewerName: string;
  reviewerCountry: string;
  rating: number;
  status: ReviewStatus;
  text: string;
  dateSubmitted: string;
}

function toUiStatus(s: string): ReviewStatus {
  if (s === 'approved') return 'Published';
  if (s === 'flagged') return 'Flagged';
  return 'Pending';
}

function toFirestoreStatus(s: ReviewStatus): 'pending' | 'approved' | 'flagged' {
  if (s === 'Published') return 'approved';
  if (s === 'Flagged') return 'flagged';
  return 'pending';
}

function mapFirestoreReview(d: FirestoreReview): Review {
  return {
    id: d.id,
    bookingId: d.bookingId,
    operatorUid: d.operatorUid,
    sourceType: d.sourceType,
    itemId: d.activityId ?? d.tourPackageId ?? '',
    location: d.location,
    reviewerName: d.reviewerName,
    reviewerCountry: d.reviewerCountry,
    rating: d.rating,
    status: toUiStatus(d.status),
    text: d.text,
    dateSubmitted: d.createdAt?.toDate?.()?.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }) ?? '—',
  };
}

type SearchField = 'Reviewer' | 'Review ID' | 'Location';
type StatusFilter = 'All' | ReviewStatus;
type ItemTypeFilter = 'All' | 'activity' | 'tourPackage';

const STATUS_STYLES: Record<ReviewStatus, string> = {
  Pending: 'text-amber-600',
  Published: 'text-[#558B2F]',
  Flagged: 'text-red-600',
};

const STATUS_BADGE: Record<ReviewStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Published: 'bg-[#E8F5E9] text-[#558B2F] border-[#C5E1A5]',
  Flagged: 'bg-red-50 text-red-700 border-red-200',
};

function StarRow({ rating, size = 'h-5 w-5' }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { authState } = useAuth();
  const moderatorUid = authState.status === 'authenticated' ? authState.user.uid : null;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchField, setSearchField] = useState<SearchField>('Reviewer');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [itemTypeFilter, setItemTypeFilter] = useState<ItemTypeFilter>('All');
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(firebaseDb, 'reviews'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const mapped = snap.docs.map((d) => mapFirestoreReview({ id: d.id, ...d.data() } as FirestoreReview));
      setReviews(mapped);
      setLoading(false);
    }, (err) => {
      console.error('reviews onSnapshot:', err);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (ratingFilter !== 0 && r.rating !== ratingFilter) return false;
      if (itemTypeFilter !== 'All' && r.sourceType !== itemTypeFilter) return false;
      if (!searchTerm.trim()) return true;
      const t = searchTerm.toLowerCase();
      if (searchField === 'Reviewer') return r.reviewerName.toLowerCase().includes(t);
      if (searchField === 'Review ID') return r.id.toLowerCase().includes(t);
      return r.location.toLowerCase().includes(t);
    });
  }, [reviews, statusFilter, ratingFilter, itemTypeFilter, searchField, searchTerm]);

  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  const reviewColumns = useMemo<ColumnDef<Review>[]>(() => [
    {
      accessorKey: 'id',
      header: 'Review ID',
      meta: { thClassName: 'px-6 py-3', tdClassName: 'px-6 py-3 font-medium text-gray-700' },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.id}
          {row.original.status === 'Pending' && (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#7BCA0D] text-white text-[10px] font-bold" title="Needs review">!</span>
          )}
        </div>
      ),
    },
    { accessorKey: 'reviewerName', header: 'Reviewer', meta: { tdClassName: 'px-4 py-3 text-gray-700' } },
    { accessorKey: 'dateSubmitted', header: 'Date submitted', meta: { tdClassName: 'px-4 py-3 text-gray-600' } },
    { accessorKey: 'rating', header: 'Rating', meta: { tdClassName: 'px-4 py-3 text-gray-700' } },
    {
      accessorKey: 'status',
      header: 'Status',
      meta: { tdClassName: 'px-4 py-3' },
      cell: ({ getValue }) => {
        const s = getValue() as ReviewStatus;
        return <span className={`font-semibold ${STATUS_STYLES[s]}`}>{s}</span>;
      },
    },
  ], []);

  const reviewTable = useReactTable({
    data: filtered,
    columns: reviewColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const updateStatus = async (id: string, status: ReviewStatus) => {
    await updateDoc(doc(firebaseDb, 'reviews', id), {
      status: toFirestoreStatus(status),
      moderatedAt: serverTimestamp(),
      moderatedByUid: moderatorUid,
    });
  };

  const counts = useMemo(() => ({
    total: reviews.length,
    pending: reviews.filter((r) => r.status === 'Pending').length,
    published: reviews.filter((r) => r.status === 'Published').length,
    flagged: reviews.filter((r) => r.status === 'Flagged').length,
  }), [reviews]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Review Moderation</h1>
        <p className="text-sm text-gray-500">Approve, flag, or publish guest reviews.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total" value={counts.total} tint="bg-gray-100 text-gray-700" />
        <MetricCard label="Pending" value={counts.pending} tint="bg-amber-50 text-amber-700" icon={<AlertCircle className="h-4 w-4" />} />
        <MetricCard label="Published" value={counts.published} tint="bg-[#E8F5E9] text-[#558B2F]" icon={<CheckCircle2 className="h-4 w-4" />} />
        <MetricCard label="Flagged" value={counts.flagged} tint="bg-red-50 text-red-700" icon={<Flag className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 flex-1 min-h-0">
        <div className="xl:col-span-3 rounded-xl bg-white shadow-sm border border-gray-100 flex flex-col min-h-0">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-center text-base font-bold text-gray-800">Reviews</h2>
          </div>

          <div className="px-6 py-3 flex flex-wrap items-center gap-3 border-b border-gray-100">
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="flex items-center gap-2 rounded-md bg-[#7BCA0D] hover:bg-[#558B2F] text-white px-3 py-2 text-sm font-semibold transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Search by:</span>
              <div className="relative">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value as SearchField)}
                  className="appearance-none rounded-md border border-[#7BCA0D] bg-white pl-3 pr-8 py-1.5 text-sm font-medium text-[#558B2F] focus:outline-none focus:ring-2 focus:ring-[#7BCA0D]"
                >
                  <option>Reviewer</option>
                  <option>Review ID</option>
                  <option>Location</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#558B2F]" />
              </div>
            </div>

            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search"
                className="w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BCA0D]"
              />
            </div>
          </div>

          {filtersOpen && (
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status:</span>
                {(['All', 'Pending', 'Published', 'Flagged'] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      statusFilter === s
                        ? 'bg-[#558B2F] text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-[#7BCA0D]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Type:</span>
                {(['All', 'activity', 'tourPackage'] as ItemTypeFilter[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setItemTypeFilter(t)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      itemTypeFilter === t
                        ? 'bg-[#558B2F] text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-[#7BCA0D]'
                    }`}
                  >
                    {t === 'All' ? 'All' : t === 'activity' ? 'Activity' : 'Tour Package'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Rating:</span>
                {[0, 5, 4, 3, 2, 1].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRatingFilter(r)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      ratingFilter === r
                        ? 'bg-[#558B2F] text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-[#7BCA0D]'
                    }`}
                  >
                    {r === 0 ? 'Any' : `${r}★`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <Loader2 className="mr-2 animate-spin" size={18} /> Loading…
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  {reviewTable.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="text-left text-xs font-bold text-gray-700 border-b border-gray-200">
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className={header.column.columnDef.meta?.thClassName ?? 'px-4 py-3'}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {reviewTable.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                        No reviews match your filters.
                      </td>
                    </tr>
                  ) : reviewTable.getRowModel().rows.map(row => {
                    const isActive = row.original.id === selected?.id;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedId(row.original.id)}
                        className={`cursor-pointer border-b border-gray-100 transition-colors ${isActive ? 'bg-[#F1F8E9]' : 'hover:bg-gray-50'}`}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className={cell.column.columnDef.meta?.tdClassName ?? 'px-4 py-3'}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 rounded-xl bg-white shadow-sm border border-gray-100 flex flex-col min-h-0">
          {selected ? (
            <>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500">
                  Review ID: <span className="font-semibold text-gray-700">{selected.id}</span>
                </span>
                <div className="relative">
                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus(selected.id, e.target.value as ReviewStatus)}
                    className={`appearance-none rounded-md border pl-3 pr-8 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#7BCA0D] ${STATUS_BADGE[selected.status]}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Published">Published</option>
                    <option value="Flagged">Flagged</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4" />
                </div>
              </div>

              <div className="px-6 py-5 overflow-auto flex-1 space-y-6">
                <section>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Reviewer</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoField label="Name" value={selected.reviewerName} />
                    <InfoField label="Nationality" value={selected.reviewerCountry} />
                    <InfoField label="Booking ID" value={selected.bookingId} />
                    <InfoField label="Type" value={selected.sourceType === 'activity' ? 'Activity' : 'Tour Package'} />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Location</h3>
                  <p className="text-sm text-gray-600">{selected.location || selected.itemId}</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Rating</h3>
                  <StarRow rating={selected.rating} />
                </section>

                <section>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Review</h3>
                  <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 leading-relaxed bg-gray-50/40">
                    {selected.text}
                  </div>
                </section>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => updateStatus(selected.id, 'Flagged')}
                  className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
                >
                  <Flag className="h-4 w-4" />
                  Flag
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'Pending')}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Return to Pending
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'Published')}
                  className="inline-flex items-center gap-2 rounded-md bg-[#558B2F] hover:bg-[#446B24] px-4 py-2 text-sm font-semibold text-white transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Publish
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-400 text-sm">
              Select a review to moderate
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tint,
  icon,
}: {
  label: string;
  value: number;
  tint: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
        {icon ?? <Star className="h-4 w-4" />}
      </span>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
