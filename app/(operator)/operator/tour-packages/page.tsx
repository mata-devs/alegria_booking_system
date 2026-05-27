'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table';
import { Plus, Search, SlidersHorizontal, Pencil, Trash2, LayoutGrid, Table as TableIcon } from 'lucide-react';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { firebaseDb } from '@/app/lib/firebase';
import { useAuth } from '@/app/context/AuthContext';
import { normalizePackageLocations, formatLocationSummary } from '@/app/lib/package-locations';
import { normalizePackageImages } from '@/app/lib/package-images';
import { normalizeActivityTags, activityHasTag, formatActivityTagsDisplay } from '@/app/lib/activity-tags';
import { StatusBadge } from '@/app/(operator)/operator/_components/shared/StatusBadge';
import { AddPackageModal } from '@/app/(operator)/operator/_components/tour-packages/AddPackageModal';
import { EditPackageModal } from '@/app/(operator)/operator/_components/tour-packages/EditPackageModal';
import { ViewDetailsModal } from '@/app/(operator)/operator/_components/tour-packages/ViewDetailsModal';
import { FiltersModal } from '@/app/(operator)/operator/_components/tour-packages/FiltersModal';
import { DeletePackageModal } from '@/app/(operator)/operator/_components/tour-packages/DeletePackageModal';
import { OperatorPackageCard } from '@/app/(operator)/operator/_components/tour-packages/OperatorPackageCard';
import { EMPTY_FILTERS } from '@/app/(operator)/operator/_components/tour-packages/constants';
import type { OperatorPackage, Filters, PackageStatus } from '@/app/(operator)/operator/_components/tour-packages/types';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    tdClassName?: string;
    thClassName?: string;
  }
}

export default function OperatorTourPackagesPage() {
  const { authState } = useAuth();
  const operatorId = authState.status === 'authenticated' ? authState.user.uid : null;

  const [packages, setPackages] = useState<OperatorPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [detailPackage, setDetailPackage] = useState<OperatorPackage | null>(null);
  const [editPackage, setEditPackage] = useState<OperatorPackage | null>(null);
  const [deletePackage, setDeletePackage] = useState<OperatorPackage | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [undoSnackbar, setUndoSnackbar] = useState<{ name: string } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!operatorId) return;
    const q = query(collection(firebaseDb, 'tourPackages'), where('operatorId', '==', operatorId));
    const unsub = onSnapshot(q, (snap) => {
      setPackages(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            packageLocations: normalizePackageLocations(data),
            packageImages: normalizePackageImages(data.packageImages),
            inclusions: Array.isArray(data.inclusions) ? data.inclusions : [],
            exclusions: Array.isArray(data.exclusions) ? data.exclusions : [],
            pricingMode: data.pricingMode === 'adultChild' ? 'adultChild' : 'standard',
            pricingTiers: Array.isArray(data.pricingTiers) ? data.pricingTiers : [],
            packageTags: normalizeActivityTags(data.packageTags, data.packageTag),
          } as OperatorPackage;
        }),
      );
      setLoading(false);
    });
    return unsub;
  }, [operatorId]);

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.location !== '' ||
    filters.priceMin !== '' ||
    filters.priceMax !== '' ||
    filters.tag !== '';

  const handleToggleStatus = async (pkg: OperatorPackage) => {
    const next = pkg.status === 'active' ? 'disabled' : 'active';
    try {
      await updateDoc(doc(firebaseDb, 'tourPackages', pkg.id), { status: next });
    } catch (err) {
      console.error('Failed to toggle package status', err);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDelete = (pkg: OperatorPackage) => {
    setDeletePackage(pkg);
  };

  const confirmDelete = (pkg: OperatorPackage) => {
    setDeletePackage(null);
    setPendingDeleteId(pkg.id);
    setUndoSnackbar({ name: pkg.packageName });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(async () => {
      try {
        await deleteDoc(doc(firebaseDb, 'tourPackages', pkg.id));
      } catch (err) {
        console.error('Failed to delete package', err);
        alert('Failed to delete. Please try again.');
      } finally {
        setPendingDeleteId(null);
        setUndoSnackbar(null);
      }
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setPendingDeleteId(null);
    setUndoSnackbar(null);
  };

  useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);

  const confirmDisable = async (pkg: OperatorPackage) => {
    try {
      await updateDoc(doc(firebaseDb, 'tourPackages', pkg.id), { status: 'disabled' });
      setDeletePackage(null);
    } catch (err) {
      console.error('Failed to disable package', err);
      alert('Failed to disable. Please try again.');
    }
  };

  const filtered = useMemo(
    () =>
      packages.filter((p) => {
        if (p.id === pendingDeleteId) return false;
        if (search && !p.packageName.toLowerCase().includes(search.toLowerCase())) return false;
        if (filters.tag && !activityHasTag(p.packageTags, filters.tag)) return false;
        if (filters.status !== 'all' && p.status !== filters.status) return false;
        if (filters.location && !p.packageLocations.includes(filters.location)) return false;
        if (filters.priceMin && p.pricePerPerson < Number(filters.priceMin)) return false;
        if (filters.priceMax && p.pricePerPerson > Number(filters.priceMax)) return false;
        return true;
      }),
    [packages, search, filters, pendingDeleteId],
  );

  const packageColumns = useMemo<ColumnDef<OperatorPackage>[]>(
    () => [
      {
        accessorKey: 'packageName',
        header: 'Package',
        meta: { tdClassName: 'px-4 py-3 font-medium text-gray-900' },
        cell: ({ row }) => (
          <button onClick={() => setDetailPackage(row.original)} className="text-left hover:text-green-600">
            {row.original.packageName}
          </button>
        ),
      },
      {
        id: 'packageTags',
        header: 'Tags',
        meta: { tdClassName: 'px-4 py-3 text-gray-600' },
        cell: ({ row }) => formatActivityTagsDisplay(row.original.packageTags),
      },
      {
        id: 'packageLocations',
        header: 'Location',
        meta: { tdClassName: 'px-4 py-3 text-gray-600' },
        cell: ({ row }) => formatLocationSummary(row.original.packageLocations),
      },
      {
        accessorKey: 'pricePerPerson',
        header: 'Price',
        meta: {
          thClassName: 'text-right px-4 py-3 font-semibold',
          tdClassName: 'px-4 py-3 text-right text-gray-900',
        },
        cell: ({ getValue }) => <>₱{(getValue() as number).toLocaleString()}</>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: { tdClassName: 'px-4 py-3 w-28' },
        cell: ({ getValue }) => <StatusBadge status={getValue() as PackageStatus} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        meta: {
          thClassName: 'text-right px-4 py-3 font-semibold w-40',
          tdClassName: 'px-4 py-3 w-40 whitespace-nowrap',
        },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setEditPackage(row.original)}
              title="Edit"
              aria-label="Edit package"
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-green-600"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <ToggleSwitch
              checked={row.original.status === 'active'}
              onChange={() => handleToggleStatus(row.original)}
              ariaLabel={row.original.status === 'active' ? 'Disable package' : 'Enable package'}
            />
            <button
              onClick={() => handleDelete(row.original)}
              title="Delete"
              aria-label="Delete package"
              className="p-1.5 rounded hover:bg-red-50 text-gray-600 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  const packageTable = useReactTable({
    data: filtered,
    columns: packageColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-gray-900">Tour Packages</h1>
            {packages.length > 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-green-700 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Package
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Tour Package"
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                aria-pressed={viewMode === 'card'}
                title="Card view"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'card' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Card
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-pressed={viewMode === 'table'}
                title="Table view"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                  viewMode === 'table' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                Table
              </button>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                hasActiveFilters
                  ? 'bg-green-500 text-white border-green-500 hover:bg-green-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-white text-green-600 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400 py-16 text-center">Loading packages…</div>
        ) : filtered.length === 0 ? (
          packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-sm text-gray-400">No packages yet. Add your first one!</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Package
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-400 py-16 text-center">No packages match your filters.</div>
          )
        ) : viewMode === 'card' ? (
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(160px,280px))]">
            {filtered.map((pkg) => (
              <OperatorPackageCard key={pkg.id} pkg={pkg} onViewDetails={setDetailPackage} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                {packageTable.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={header.column.columnDef.meta?.thClassName ?? 'text-left px-4 py-3 font-semibold'}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {packageTable.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cell.column.columnDef.meta?.tdClassName ?? 'px-4 py-3'}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FiltersModal
        open={showFilters}
        filters={filters}
        onApply={setFilters}
        onClose={() => setShowFilters(false)}
      />

      {showAddModal && operatorId && (
        <AddPackageModal onClose={() => setShowAddModal(false)} operatorId={operatorId} />
      )}

      {detailPackage && (
        <ViewDetailsModal
          pkg={detailPackage}
          onClose={() => setDetailPackage(null)}
          onEdit={(p) => setEditPackage(p)}
        />
      )}

      {editPackage && operatorId && (
        <EditPackageModal
          pkg={editPackage}
          onClose={() => setEditPackage(null)}
          onDelete={() => {
            setEditPackage(null);
            handleDelete(editPackage);
          }}
          operatorId={operatorId}
        />
      )}

      {deletePackage && (
        <DeletePackageModal
          pkg={deletePackage}
          onClose={() => setDeletePackage(null)}
          onDelete={() => confirmDelete(deletePackage)}
          onDisable={() => confirmDisable(deletePackage)}
        />
      )}

      {undoSnackbar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-full shadow-lg text-sm whitespace-nowrap">
          <span>&quot;{undoSnackbar.name}&quot; deleted.</span>
          <button
            onClick={handleUndoDelete}
            className="font-semibold text-green-400 hover:text-green-300 underline focus:outline-none"
          >
            Undo
          </button>
        </div>
      )}
    </>
  );
}
