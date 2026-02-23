'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseDb, firebaseStorage } from '@/lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { Filter, Search, ChevronDown, FileImage } from 'lucide-react';
import type { OperatorProfile } from '@/lib/types';

type Tab = 'operators' | 'signup-requests';
type SearchField = 'name' | 'id';

const SEARCH_FIELD_LABELS: Record<SearchField, string> = {
  name: 'Operator Name',
  id: 'Operator ID',
};

export default function OperatorsManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('operators');
  const [operators, setOperators] = useState<OperatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('name');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOperators() {
      try {
        const q = query(
          collection(firebaseDb, 'users'),
          where('role', '==', 'operator'),
        );
        const snapshot = await getDocs(q);
        const rawResults = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            operatorId: data.operatorId ?? doc.id,
            email: data.email ?? null,
            role: data.role,
            firstName: data.firstName ?? '',
            lastName: data.lastName ?? '',
            status: data.status ?? 'active',
            createdAt: data.createdAt?.toDate?.() ?? null,
            phoneNumber: data.phoneNumber ?? '',
            mobileNumber: data.mobileNumber ?? '',
            profileImage: null as string | null,
            applicationApproveDate: data.approvedAt?.toDate?.() ?? null,
            files: Array.isArray(data.files) ? data.files : [],
          };
        });

        const results: OperatorProfile[] = await Promise.all(
          rawResults.map(async (op) => {
            try {
              const url = await getDownloadURL(
                ref(firebaseStorage, `profile-pictures/${op.operatorId}.jpg`),
              );
              return { ...op, profileImage: url };
            } catch {
              return op;
            }
          }),
        );

        setOperators(results);
        if (results.length > 0) {
          setSelectedId(results[0].uid);
        }
      } catch (error) {
        console.error('Failed to fetch operators:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOperators();
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return operators;
    const q = searchQuery.toLowerCase();
    return operators.filter((op) => {
      if (searchField === 'name') {
        return `${op.firstName} ${op.lastName}`.toLowerCase().includes(q);
      }
      return op.operatorId.toLowerCase().includes(q);
    });
  }, [operators, searchQuery, searchField]);

  const selectedOperator = operators.find((op) => op.uid === selectedId) ?? null;

  function formatDate(date: Date | null): string {
    if (!date) return 'mm - dd - yy';
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${mm} - ${dd} - ${yy}`;
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <button
          onClick={() => setActiveTab('operators')}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'operators'
              ? 'text-[#558B2F] border-b-2 border-[#558B2F]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Operators
        </button>
        <div className="w-px bg-gray-300 my-2" />
        <button
          onClick={() => setActiveTab('signup-requests')}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'signup-requests'
              ? 'text-[#558B2F] border-b-2 border-[#558B2F]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sign up requests
        </button>
      </div>

      {activeTab === 'operators' ? (
        <div className="mt-4 flex gap-4">
          {/* Left panel — Table */}
          <div className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white p-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
              <button className="inline-flex items-center gap-2 rounded-md bg-[#558B2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#4a7a28] transition-colors">
                <Filter size={16} />
                Filters
              </button>

              <span className="text-sm font-medium text-gray-700">Search by:</span>

              {/* Search-field dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#558B2F] px-4 py-1.5 text-sm font-medium text-[#558B2F] hover:bg-green-50 transition-colors"
                >
                  {SEARCH_FIELD_LABELS[searchField]}
                  <ChevronDown size={14} />
                </button>
                {dropdownOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    {(Object.keys(SEARCH_FIELD_LABELS) as SearchField[]).map((field) => (
                      <button
                        key={field}
                        onClick={() => {
                          setSearchField(field);
                          setDropdownOpen(false);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                          searchField === field ? 'text-[#558B2F] font-medium' : 'text-gray-700'
                        }`}
                      >
                        {SEARCH_FIELD_LABELS[field]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search input */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-md border border-gray-300 py-1.5 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
                />
              </div>
            </div>

            {/* Column headers */}
            <div className="mt-5 grid grid-cols-[1fr_1.4fr_1fr_0.7fr] gap-0 px-4">
              <span className="text-sm font-bold text-gray-900">Operator ID</span>
              <span className="text-sm font-bold text-gray-900">Operator Name</span>
              <span className="text-sm font-bold text-gray-900">Date Joined</span>
              <span className="text-sm font-bold text-gray-900">Status</span>
            </div>

            {/* Rows */}
            <div className="mt-3 flex flex-col gap-2">
              {loading ? (
                <div className="rounded-lg bg-gray-100 px-4 py-4 text-center text-sm text-gray-400">
                  Loading operators…
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-lg bg-gray-100 px-4 py-4 text-center text-sm text-gray-400">
                  No operators found.
                </div>
              ) : (
                filtered.map((op) => (
                  <button
                    key={op.uid}
                    type="button"
                    onClick={() => setSelectedId(op.uid)}
                    className={`grid grid-cols-[1fr_1.4fr_1fr_0.7fr] items-center gap-0 rounded-lg text-left transition-colors ${
                      selectedId === op.uid
                        ? 'bg-green-100 ring-1 ring-green-300'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <span className="border-r border-gray-300 px-4 py-3 text-sm text-gray-700">
                      {op.operatorId}
                    </span>
                    <span className="border-r border-gray-300 px-4 py-3 text-sm text-gray-700">
                      {op.firstName} {op.lastName}
                    </span>
                    <span className="border-r border-gray-300 px-4 py-3 text-sm text-gray-700">
                      {formatDate(op.createdAt)}
                    </span>
                    <span
                      className={`px-4 py-3 text-sm font-medium ${
                        op.status === 'active' ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {op.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right panel — Operator Detail */}
          {selectedOperator && (
            <div className="w-80 shrink-0 rounded-lg border border-gray-200 bg-white p-5">
              <p className="text-center text-xs text-gray-500">
                Operator ID: {selectedOperator.operatorId}
              </p>

              {/* Profile section */}
              <div className="mt-4 flex gap-4">
                {/* Avatar / image */}
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-gray-200">
                  {selectedOperator.profileImage ? (
                    <img
                      src={selectedOperator.profileImage}
                      alt={`${selectedOperator.firstName} ${selectedOperator.lastName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">
                      {selectedOperator.firstName.charAt(0)}
                      {selectedOperator.lastName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Contact info */}
                <div className="min-w-0 space-y-1.5">
                  <div>
                    <p className="text-[11px] text-gray-400">Name</p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {selectedOperator.firstName} {selectedOperator.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Email</p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {selectedOperator.email ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Phone number</p>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedOperator.phoneNumber || '—'}
                    </p>
                  </div>

                </div>
              </div>

              {/* Status */}
              <div className="mt-5">
                <p className="text-xs text-gray-400">Status</p>
                <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-1.5 text-sm">
                  <span
                    className={
                      selectedOperator.status === 'active'
                        ? 'text-green-600 font-medium'
                        : 'text-red-500 font-medium'
                    }
                  >
                    {selectedOperator.status === 'active' ? 'Active' : 'Suspended'}
                  </span>
                  <ChevronDown size={14} className="text-gray-400" />
                </div>
              </div>

              {/* Dates */}
              <div className="mt-4 flex gap-6">
                <div>
                  <p className="text-xs text-gray-400">Sign Up Date</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">
                    {formatDate(selectedOperator.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Application approve date</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">
                    {formatDate(selectedOperator.applicationApproveDate)}
                  </p>
                </div>
              </div>

              {/* Files */}
              <div className="mt-5">
                <p className="text-sm font-bold text-gray-900">Files</p>
                <div className="mt-2 rounded-lg border border-gray-200 divide-y divide-gray-200">
                  {selectedOperator.files.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">No files uploaded.</p>
                  ) : (
                    selectedOperator.files.map((file) => (
                      <a
                        key={file.name}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FileImage size={18} className="shrink-0 text-teal-600" />
                        {file.name}
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          Sign up requests coming soon.
        </div>
      )}
    </div>
  );
}
