'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, Timestamp, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { firebaseDb, firebaseStorage, firebaseFunctions, firebaseAuth } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ref, getDownloadURL } from 'firebase/storage';
import { Filter, Search, ChevronDown, FileImage, Copy, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { OperatorProfile, OperatorSignUpRequest, SignUpRequestStatus } from '@/lib/types';

type Tab = 'operators' | 'signup-requests';
type SearchField = 'name' | 'id';
type RequestSearchField = 'name' | 'id';

const SEARCH_FIELD_LABELS: Record<SearchField, string> = {
  name: 'Operator Name',
  id: 'Operator ID',
};

const REQUEST_SEARCH_LABELS: Record<RequestSearchField, string> = {
  name: 'Name',
  id: 'Applicant ID',
};

const STATUS_DOT: Record<SignUpRequestStatus, string> = {
  pending: 'bg-amber-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
};

const STATUS_LABEL: Record<SignUpRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Accepted',
  rejected: 'Declined',
};

const ROWS_PER_PAGE = 10;

// TODO: update firestore security rules

export default function OperatorsManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('operators');
  const [operators, setOperators] = useState<OperatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('name');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [operatorPage, setOperatorPage] = useState(1);

  // Sign-up requests state
  const [requests, setRequests] = useState<OperatorSignUpRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestSearchQuery, setRequestSearchQuery] = useState('');
  const [requestSearchField, setRequestSearchField] = useState<RequestSearchField>('name');
  const [requestDropdownOpen, setRequestDropdownOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [requestUpdating, setRequestUpdating] = useState<'approved' | 'rejected' | null>(null);
  const [requestPage, setRequestPage] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);

  // Application link state
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function fetchOperators() {
    try {
      const q = query(
        collection(firebaseDb, 'users'),
        where('role', '==', 'operator'),
      );
      const snapshot = await getDocs(q);
      const rawResults = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          operatorId: data.operatorId ?? d.id,
          email: data.email ?? null,
          role: data.role,
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          status: data.status ?? 'active',
          createdAt: data.createdAt?.toDate?.() ?? null,
          phoneNumber: data.phoneNumber ?? '',
          mobileNumber: data.mobileNumber ?? '',
          profileImage: data.profileImage ?? null,
          applicationApproveDate: data.approvedAt?.toDate?.() ?? null,
          files: Array.isArray(data.files) ? data.files : [],
        };
      });

      const results: OperatorProfile[] = await Promise.all(
        rawResults.map(async (op) => {
          if (op.profileImage) return op;
          try {
            const url = await getDownloadURL(
              ref(firebaseStorage, `profile-pictures/${op.uid}.jpg`),
            );
            return { ...op, profileImage: url };
          } catch {
            return op;
          }
        }),
      );

      setOperators(results);
      if (results.length > 0 && !selectedId) {
        setSelectedId(results[0].uid);
      }
    } catch (error) {
      console.error('Failed to fetch operators:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOperators();
  }, []);

  // Listen for signup token changes in real-time
  useEffect(() => {
    const unsub = onSnapshot(
      doc(firebaseDb, 'app_config', 'operator_signup_link'),
      (snap) => {
        if (snap.exists()) {
          setSignupToken(snap.data().token ?? null);
        } else {
          setSignupToken(null);
        }
        setTokenLoading(false);
      },
      (error) => {
        console.error('Failed to listen for signup token:', error);
        setTokenLoading(false);
      },
    );
    return unsub;
  }, []);

  function getSignupUrl(token: string) {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/operator-signup?token=${token}`;
  }

  async function generateNewToken() {
    setGenerating(true);
    try {
      const token = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      await setDoc(doc(firebaseDb, 'app_config', 'operator_signup_link'), {
        token,
        createdAt: Timestamp.now(),
      });
      setSignupToken(token);
      setCopied(false);
    } catch (error) {
      console.error('Failed to generate token:', error);
    } finally {
      setGenerating(false);
    }
  }

  async function copyLink() {
    if (!signupToken) return;
    try {
      await navigator.clipboard.writeText(getSignupUrl(signupToken));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  // Real-time listener for pending request count (badge on tab)
  useEffect(() => {
    const q = query(
      collection(firebaseDb, 'operator_signup_requests'),
      where('status', '==', 'pending'),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for sign-up requests
  useEffect(() => {
    const q = query(
      collection(firebaseDb, 'operator_signup_requests'),
      orderBy('submittedAt', 'desc'),
    );
    setRequestsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results: OperatorSignUpRequest[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          applicantId: data.applicantId ?? d.id.slice(0, 6).toUpperCase(),
          name: data.name ?? '',
          email: data.email ?? '',
          phoneNumber: data.phoneNumber ?? '',
          mobileNumber: data.mobileNumber ?? '',
          address: data.address ?? '',
          photoUrl: data.photoUrl ?? null,
          documents: Array.isArray(data.documents) ? data.documents : [],
          status: data.status ?? 'pending',
          submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : null,
          reviewedAt: data.reviewedAt instanceof Timestamp ? data.reviewedAt.toDate() : null,
        };
      });
      setRequests(results);
      setRequestsLoading(false);
    }, (error) => {
      console.error('Failed to fetch sign-up requests:', error);
      setRequestsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredRequests = useMemo(() => {
    if (!requestSearchQuery.trim()) return requests;
    const q = requestSearchQuery.toLowerCase();
    return requests.filter((r) => {
      if (requestSearchField === 'name') return r.name.toLowerCase().includes(q);
      return r.applicantId.toLowerCase().includes(q);
    });
  }, [requests, requestSearchQuery, requestSearchField]);

  // Reset requests page when search changes
  useEffect(() => { setRequestPage(1); }, [requestSearchQuery, requestSearchField]);

  const requestTotalPages = Math.max(1, Math.ceil(filteredRequests.length / ROWS_PER_PAGE));
  const paginatedRequests = filteredRequests.slice(
    (requestPage - 1) * ROWS_PER_PAGE,
    requestPage * ROWS_PER_PAGE,
  );

  const selectedRequest = requests.find((r) => r.id === selectedRequestId) ?? null;

  async function updateRequestStatus(requestId: string, newStatus: 'approved' | 'rejected') {
    setRequestUpdating(newStatus);
    try {
      if (newStatus === 'approved') {
        const approve = httpsCallable<{ requestId: string }, { email: string }>(firebaseFunctions, 'approveOperatorSignup');
        const result = await approve({ requestId });
        // Send the password-reset email via Firebase Auth's built-in template
        await sendPasswordResetEmail(firebaseAuth, result.data.email);
      } else {
        const decline = httpsCallable(firebaseFunctions, 'declineOperatorSignup');
        await decline({ requestId });
      }
      // The real-time listener will update the requests list automatically,
      // but also refresh operators list since a new one was created
      if (newStatus === 'approved') {
        await fetchOperators();
      }
    } catch (error) {
      console.error('Failed to update request status:', error);
    } finally {
      setRequestUpdating(null);
    }
  }

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

  // Reset operators page when search changes
  useEffect(() => { setOperatorPage(1); }, [searchQuery, searchField]);

  const operatorTotalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginatedOperators = filtered.slice(
    (operatorPage - 1) * ROWS_PER_PAGE,
    operatorPage * ROWS_PER_PAGE,
  );

  const selectedOperator = operators.find((op) => op.uid === selectedId) ?? null;

  function formatDate(date: Date | null): string {
    if (!date) return 'mm - dd - yy';
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${mm} - ${dd} - ${yy}`;
  }

  async function updateOperatorStatus(uid: string, newStatus: 'active' | 'suspended') {
    setStatusUpdating(true);
    setStatusDropdownOpen(false);
    try {
      await updateDoc(doc(firebaseDb, 'users', uid), { status: newStatus });
      setOperators((prev) =>
        prev.map((op) => (op.uid === uid ? { ...op, status: newStatus } : op)),
      );
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setStatusUpdating(false);
    }
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
          className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'signup-requests'
              ? 'text-[#558B2F] border-b-2 border-[#558B2F]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sign up requests
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white min-w-5 h-5">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'operators' ? (
        <div className="mt-4 flex flex-col lg:flex-row gap-4">
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
            <div className="mt-5 hidden md:grid grid-cols-4 gap-0">
              <span className="px-4 text-sm font-bold text-gray-900">Operator ID</span>
              <span className="px-4 text-sm font-bold text-gray-900">Operator Name</span>
              <span className="px-4 text-sm font-bold text-gray-900">Date Joined</span>
              <span className="px-4 text-sm font-bold text-gray-900">Status</span>
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
                paginatedOperators.map((op) => (
                  <button
                    key={op.uid}
                    type="button"
                    onClick={() => { setSelectedId(op.uid); setStatusDropdownOpen(false); }}
                    className={`rounded-lg text-left transition-colors ${
                      selectedId === op.uid
                        ? 'bg-green-100 ring-1 ring-green-300'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {/* Desktop row */}
                    <div className="hidden md:grid grid-cols-4 items-center gap-0">
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
                    </div>
                    {/* Mobile card */}
                    <div className="md:hidden px-4 py-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">{op.firstName} {op.lastName}</span>
                        <span
                          className={`text-xs font-medium ${
                            op.status === 'active' ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {op.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>ID: {op.operatorId}</span>
                        <span>{formatDate(op.createdAt)}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Pagination */}
            {filtered.length > ROWS_PER_PAGE && (
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-500">
                  Showing {(operatorPage - 1) * ROWS_PER_PAGE + 1}–{Math.min(operatorPage * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setOperatorPage((p) => Math.max(1, p - 1))}
                    disabled={operatorPage === 1}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: operatorTotalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setOperatorPage(page)}
                      className={`h-7 min-w-7 rounded-md px-2 text-xs font-medium transition-colors ${
                        operatorPage === page
                          ? 'bg-[#558B2F] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setOperatorPage((p) => Math.min(operatorTotalPages, p + 1))}
                    disabled={operatorPage === operatorTotalPages}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right panel — Operator Detail */}
          {selectedOperator && (
            <div className="w-full lg:w-80 shrink-0 rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span />
                <p className="text-xs text-gray-500">
                  Operator ID: {selectedOperator.operatorId}
                </p>
                <button
                  onClick={() => setSelectedId(null)}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

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
                <div className="relative mt-1 inline-block">
                  <button
                    onClick={() => setStatusDropdownOpen((o) => !o)}
                    disabled={statusUpdating}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-1.5 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <span
                      className={
                        selectedOperator.status === 'active'
                          ? 'text-green-600 font-medium'
                          : 'text-red-500 font-medium'
                      }
                    >
                      {statusUpdating ? 'Updating…' : selectedOperator.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                  {statusDropdownOpen && (
                    <div className="absolute left-0 top-full z-20 mt-1 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={() => updateOperatorStatus(selectedOperator.uid, 'active')}
                        className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                          selectedOperator.status === 'active' ? 'text-green-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => updateOperatorStatus(selectedOperator.uid, 'suspended')}
                        className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                          selectedOperator.status === 'suspended' ? 'text-red-500 font-medium' : 'text-gray-700'
                        }`}
                      >
                        Suspended
                      </button>
                    </div>
                  )}
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
                        className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileImage size={18} className="shrink-0 text-teal-600" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <span className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-red-100 text-red-500">
                          <FileImage size={12} />
                        </span>
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-col lg:flex-row gap-4">
          {/* Left column */}
          <div className="flex flex-1 min-w-0 flex-col gap-4">
            {/* Table panel */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              {/* Toolbar — mirrors operators tab */}
              <div className="flex items-center gap-3 flex-wrap">
                <button className="inline-flex items-center gap-2 rounded-md bg-[#558B2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#4a7a28] transition-colors">
                  <Filter size={16} />
                  Filters
                </button>

                <span className="text-sm font-medium text-gray-700">Search by:</span>

                {/* Search-field dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setRequestDropdownOpen(!requestDropdownOpen)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#558B2F] px-4 py-1.5 text-sm font-medium text-[#558B2F] hover:bg-green-50 transition-colors"
                  >
                    {REQUEST_SEARCH_LABELS[requestSearchField]}
                    <ChevronDown size={14} />
                  </button>
                  {requestDropdownOpen && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                      {(Object.keys(REQUEST_SEARCH_LABELS) as RequestSearchField[]).map((field) => (
                        <button
                          key={field}
                          onClick={() => {
                            setRequestSearchField(field);
                            setRequestDropdownOpen(false);
                          }}
                          className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                            requestSearchField === field ? 'text-[#558B2F] font-medium' : 'text-gray-700'
                          }`}
                        >
                          {REQUEST_SEARCH_LABELS[field]}
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
                    value={requestSearchQuery}
                    onChange={(e) => setRequestSearchQuery(e.target.value)}
                    className="rounded-md border border-gray-300 py-1.5 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
                  />
                </div>
              </div>

              {/* Column headers */}
              <div className="mt-5 hidden md:grid grid-cols-4 gap-0">
                <span className="px-4 text-sm font-bold text-gray-900">Applicant ID</span>
                <span className="px-4 text-sm font-bold text-gray-900">Name</span>
                <span className="px-4 text-sm font-bold text-gray-900">Date</span>
                <span className="px-4 text-sm font-bold text-gray-900">Status</span>
              </div>

              {/* Rows */}
              <div className="mt-3 flex flex-col gap-2">
                {requestsLoading ? (
                  <div className="rounded-lg bg-gray-100 px-4 py-4 text-center text-sm text-gray-400">
                    Loading requests…
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="rounded-lg bg-gray-100 px-4 py-4 text-center text-sm text-gray-400">
                    No sign-up requests found.
                  </div>
                ) : (
                  paginatedRequests.map((req) => (
                    <button
                      key={req.id}
                      type="button"
                      onClick={() => setSelectedRequestId(req.id)}
                      className={`rounded-lg text-left transition-colors ${
                        selectedRequestId === req.id
                          ? 'bg-green-100 ring-1 ring-green-300'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {/* Desktop row */}
                      <div className="hidden md:grid grid-cols-4 items-center gap-0">
                        <span className="border-r border-gray-300 px-4 py-3 text-sm text-gray-700">
                          {req.applicantId}
                        </span>
                        <span className="border-r border-gray-300 px-4 py-3 text-sm text-gray-700 truncate">
                          {req.name}
                        </span>
                        <span className="border-r border-gray-300 px-4 py-3 text-sm text-gray-700">
                          {formatDate(req.submittedAt)}
                        </span>
                        <span className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700">
                          <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[req.status]}`} />
                          {STATUS_LABEL[req.status]}
                        </span>
                      </div>
                      {/* Mobile card */}
                      <div className="md:hidden px-4 py-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900 truncate">{req.name}</span>
                          <span className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0 ml-2">
                            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[req.status]}`} />
                            {STATUS_LABEL[req.status]}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>ID: {req.applicantId}</span>
                          <span>{formatDate(req.submittedAt)}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Pagination */}
              {filteredRequests.length > ROWS_PER_PAGE && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500">
                    Showing {(requestPage - 1) * ROWS_PER_PAGE + 1}–{Math.min(requestPage * ROWS_PER_PAGE, filteredRequests.length)} of {filteredRequests.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setRequestPage((p) => Math.max(1, p - 1))}
                      disabled={requestPage === 1}
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: requestTotalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setRequestPage(page)}
                        className={`h-7 min-w-7 rounded-md px-2 text-xs font-medium transition-colors ${
                          requestPage === page
                            ? 'bg-[#558B2F] text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setRequestPage((p) => Math.min(requestTotalPages, p + 1))}
                      disabled={requestPage === requestTotalPages}
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Application Link panel */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="text-center text-sm font-bold text-gray-900">Application link</h3>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 truncate rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-500">
                  {tokenLoading ? 'Loading…' : signupToken ? getSignupUrl(signupToken) : 'No link generated yet'}
                </div>
                <button
                  onClick={copyLink}
                  disabled={!signupToken || tokenLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#4A8B8C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d7374] transition-colors disabled:opacity-50"
                >
                  <Copy size={14} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <button
                onClick={generateNewToken}
                disabled={generating}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#558B2F] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#4a7a28] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
                {generating ? 'Generating…' : 'Generate new link'}
              </button>
              <p className="mt-1.5 text-xs text-gray-400">
                Generating new link makes the current link unusable.
              </p>
            </div>
          </div>

          {/* Right panel — Request Detail */}
          {selectedRequest && (
            <div className="w-full lg:w-[22rem] shrink-0 rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-3 flex justify-end">
                <button
                  onClick={() => setSelectedRequestId(null)}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              {/* Photo + Name field */}
              <div className="flex gap-4">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-md bg-lime-100">
                  {selectedRequest.photoUrl ? (
                    <img
                      src={selectedRequest.photoUrl}
                      alt={selectedRequest.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-500">
                      Photo
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <label className="text-xs font-semibold text-gray-700">Name</label>
                  <div className="mt-0.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 truncate">
                    {selectedRequest.name || '—'}
                  </div>

                  <label className="mt-3 block text-xs font-semibold text-gray-700">Telephone number</label>
                  <div className="mt-0.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900">
                    {selectedRequest.phoneNumber || '—'}
                  </div>
                </div>
              </div>

              {/* Remaining fields */}
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Mobile number</label>
                  <div className="mt-0.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900">
                    {selectedRequest.mobileNumber || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Email address</label>
                  <div className="mt-0.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 truncate">
                    {selectedRequest.email || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Address</label>
                  <div className="mt-0.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900">
                    {selectedRequest.address || '—'}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="mt-5">
                <h3 className="text-sm font-bold text-gray-900">Documents</h3>
                <div className="mt-2 rounded-lg border border-gray-200 divide-y divide-gray-200">
                  {selectedRequest.documents.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">No documents uploaded.</p>
                  ) : (
                    selectedRequest.documents.map((file) => (
                      <a
                        key={file.name}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileImage size={18} className="shrink-0 text-teal-600" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <span className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-red-100 text-red-500">
                          <FileImage size={12} />
                        </span>
                      </a>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="mt-6 flex gap-3">
                  <button
                    disabled={!!requestUpdating}
                    onClick={() => updateRequestStatus(selectedRequest.id, 'approved')}
                    className="flex-1 rounded-lg bg-[#558B2F] py-2.5 text-sm font-semibold text-white hover:bg-[#4a7a28] transition-colors disabled:opacity-50"
                  >
                    {requestUpdating === 'approved' ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    disabled={!!requestUpdating}
                    onClick={() => updateRequestStatus(selectedRequest.id, 'rejected')}
                    className="flex-1 rounded-lg border border-red-300 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {requestUpdating === 'rejected' ? 'Declining…' : 'Decline'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
