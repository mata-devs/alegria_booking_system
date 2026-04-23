'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Star,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Flag,
} from 'lucide-react';

type ReviewStatus = 'Draft' | 'Published' | 'Flagged';

interface Review {
  id: string;
  reviewer: string;
  email: string;
  address: string;
  nationality: string;
  nationalityFlag: string;
  dateSubmitted: string;
  rating: number;
  status: ReviewStatus;
  text: string;
  tour: string;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: 'rvw1100011',
    reviewer: 'John Carlo Reyes',
    email: 'juand@email.com',
    address: 'Cebu City, Philippines',
    nationality: 'Filipino',
    nationalityFlag: '🇵🇭',
    dateSubmitted: 'February 11, 2026',
    rating: 4,
    status: 'Draft',
    tour: 'Kawasan Canyoneering',
    text: 'An absolute must-try experience! Everything was handled professionally—from transportation to safety equipment. The canyon itself was beautiful, with crystal-clear water and impressive waterfalls. I was nervous about the higher jumps at first, but the guides were patient and supportive, which really helped boost my confidence. By the end of the tour, I felt accomplished and proud for stepping out of my comfort zone. Truly one of the best adventures I\'ve had.',
  },
  {
    id: 'rvw1100012',
    reviewer: 'Maria Angelica Cruz',
    email: 'maria.cruz@email.com',
    address: 'Manila, Philippines',
    nationality: 'Filipino',
    nationalityFlag: '🇵🇭',
    dateSubmitted: 'February 3, 2026',
    rating: 3,
    status: 'Draft',
    tour: 'Oslob Whale Shark Watching',
    text: 'The tour was okay. Staff were friendly but the waiting time was longer than expected. Water activity itself was great though.',
  },
  {
    id: 'rvw1100013',
    reviewer: 'Mark Anthony Santos',
    email: 'msantos@email.com',
    address: 'Davao City, Philippines',
    nationality: 'Filipino',
    nationalityFlag: '🇵🇭',
    dateSubmitted: 'January 22, 2026',
    rating: 2,
    status: 'Draft',
    tour: 'Bohol Countryside Tour',
    text: 'Expected more from the itinerary. Some stops felt rushed and the van was cramped. Guide tried his best though.',
  },
  {
    id: 'rvw1100014',
    reviewer: 'Angela Mae Villanueva',
    email: 'amae@email.com',
    address: 'Iloilo, Philippines',
    nationality: 'Filipino',
    nationalityFlag: '🇵🇭',
    dateSubmitted: 'January 14, 2026',
    rating: 1,
    status: 'Published',
    tour: 'Palawan Island Hopping',
    text: 'Disappointed. Boat was late, lunch was subpar, and one of the advertised islands was skipped without explanation.',
  },
  {
    id: 'rvw1100015',
    reviewer: 'Joshua Daniel Garcia',
    email: 'jdgarcia@email.com',
    address: 'Baguio, Philippines',
    nationality: 'Filipino',
    nationalityFlag: '🇵🇭',
    dateSubmitted: 'January 5, 2026',
    rating: 3,
    status: 'Published',
    tour: 'Mt. Pulag Trek',
    text: 'Decent trek. Sunrise view was worth the climb. Logistics could use some polishing.',
  },
  {
    id: 'rvw1100016',
    reviewer: 'Camille Anne Mendoza',
    email: 'cam.mendoza@email.com',
    address: 'Tagaytay, Philippines',
    nationality: 'Filipino',
    nationalityFlag: '🇵🇭',
    dateSubmitted: 'February 19, 2026',
    rating: 2,
    status: 'Published',
    tour: 'Taal Volcano Tour',
    text: 'View was nice but the horseback ride felt unsafe. Needs better animal welfare standards.',
  },
  {
    id: 'rvw1100017',
    reviewer: 'Christian Paul Navarro',
    email: 'cpnavarro@email.com',
    address: 'Cagayan de Oro, Philippines',
    nationality: 'Filipino',
    nationalityFlag: '🇵🇭',
    dateSubmitted: 'February 27, 2026',
    rating: 5,
    status: 'Draft',
    tour: 'CDO White Water Rafting',
    text: 'Best adrenaline rush of my life. Guides were top-notch. Would book again in a heartbeat.',
  },
  {
    id: 'rvw1100018',
    reviewer: 'Bea Nicole Ramos',
    email: 'bnramos@email.com',
    address: 'Siargao, Philippines',
    nationality: 'Filipino',
    nationalityFlag: '🇵🇭',
    dateSubmitted: 'January 22, 2026',
    rating: 4,
    status: 'Published',
    tour: 'Siargao Surf Lessons',
    text: 'Great instructors, good waves for beginners. Got up on the board by day two!',
  },
];

type SearchField = 'Reviewer' | 'Review ID' | 'Tour';
type StatusFilter = 'All' | ReviewStatus;

const STATUS_STYLES: Record<ReviewStatus, string> = {
  Draft: 'text-amber-600',
  Published: 'text-[#558B2F]',
  Flagged: 'text-red-600',
};

const STATUS_BADGE: Record<ReviewStatus, string> = {
  Draft: 'bg-amber-50 text-amber-700 border-amber-200',
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
  const [selectedId, setSelectedId] = useState<string>(MOCK_REVIEWS[0].id);
  const [searchField, setSearchField] = useState<SearchField>('Reviewer');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [ratingFilter, setRatingFilter] = useState<number | 0>(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (ratingFilter !== 0 && r.rating !== ratingFilter) return false;
      if (!searchTerm.trim()) return true;
      const t = searchTerm.toLowerCase();
      if (searchField === 'Reviewer') return r.reviewer.toLowerCase().includes(t);
      if (searchField === 'Review ID') return r.id.toLowerCase().includes(t);
      return r.tour.toLowerCase().includes(t);
    });
  }, [reviews, statusFilter, ratingFilter, searchField, searchTerm]);

  const selected = reviews.find((r) => r.id === selectedId) ?? filtered[0] ?? reviews[0];

  const updateStatus = (id: string, status: ReviewStatus) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const counts = useMemo(() => {
    return {
      total: reviews.length,
      draft: reviews.filter((r) => r.status === 'Draft').length,
      published: reviews.filter((r) => r.status === 'Published').length,
      flagged: reviews.filter((r) => r.status === 'Flagged').length,
    };
  }, [reviews]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header strip */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Review Moderation</h1>
        <p className="text-sm text-gray-500">Approve, flag, or publish guest reviews.</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total" value={counts.total} tint="bg-gray-100 text-gray-700" />
        <MetricCard label="Draft" value={counts.draft} tint="bg-amber-50 text-amber-700" icon={<AlertCircle className="h-4 w-4" />} />
        <MetricCard label="Published" value={counts.published} tint="bg-[#E8F5E9] text-[#558B2F]" icon={<CheckCircle2 className="h-4 w-4" />} />
        <MetricCard label="Flagged" value={counts.flagged} tint="bg-red-50 text-red-700" icon={<Flag className="h-4 w-4" />} />
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 flex-1 min-h-0">
        {/* List panel */}
        <div className="xl:col-span-3 rounded-xl bg-white shadow-sm border border-gray-100 flex flex-col min-h-0">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-center text-base font-bold text-gray-800">Reviews</h2>
          </div>

          {/* Toolbar */}
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
                  <option>Tour</option>
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

          {/* Filter drawer */}
          {filtersOpen && (
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status:</span>
                {(['All', 'Draft', 'Published', 'Flagged'] as StatusFilter[]).map((s) => (
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

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left text-xs font-bold text-gray-700 border-b border-gray-200">
                  <th className="px-6 py-3">Review ID</th>
                  <th className="px-4 py-3">Reviewer</th>
                  <th className="px-4 py-3">Date submitted</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const active = r.id === selectedId;
                  const isDraft = r.status === 'Draft';
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`cursor-pointer border-b border-gray-100 transition-colors ${
                        active ? 'bg-[#F1F8E9]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-3 font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          {r.id}
                          {isDraft && (
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#7BCA0D] text-white text-[10px] font-bold" title="Needs review">
                              !
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.reviewer}</td>
                      <td className="px-4 py-3 text-gray-600">{r.dateSubmitted}</td>
                      <td className="px-4 py-3 text-gray-700">{r.rating}</td>
                      <td className={`px-4 py-3 font-semibold ${STATUS_STYLES[r.status]}`}>{r.status}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                      No reviews match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <div className="xl:col-span-2 rounded-xl bg-white shadow-sm border border-gray-100 flex flex-col min-h-0">
          {selected && (
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
                    <option value="Draft">Draft</option>
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
                    <InfoField label="Name" value={selected.reviewer} />
                    <InfoField label="Address" value={selected.address} />
                    <InfoField label="Email" value={selected.email} />
                    <InfoField
                      label="Nationality"
                      value={
                        <span className="inline-flex items-center gap-2">
                          <span>{selected.nationalityFlag}</span>
                          {selected.nationality}
                        </span>
                      }
                    />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Tour</h3>
                  <p className="text-sm text-gray-600">{selected.tour}</p>
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
                  onClick={() => updateStatus(selected.id, 'Draft')}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Return to Draft
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
