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
import {
  normalizeActivityTags,
  primaryActivityTag,
  formatActivityTagsDisplay,
  activityHasTag,
} from '@/app/lib/activity-tags';
import { normalizePackageImages } from '@/app/lib/package-images';
import { StatusBadge } from '@/app/(operator)/operator/_components/shared/StatusBadge';
import { AddActivityModal } from '@/app/(operator)/operator/_components/activities/AddActivityModal';
import { EditActivityModal } from '@/app/(operator)/operator/_components/activities/EditActivityModal';
import { ViewDetailsModal } from '@/app/(operator)/operator/_components/activities/ViewDetailsModal';
import { FiltersModal } from '@/app/(operator)/operator/_components/activities/FiltersModal';
import { DeleteActivityModal } from '@/app/(operator)/operator/_components/activities/DeleteActivityModal';
import { OperatorActivityCard } from '@/app/(operator)/operator/_components/activities/OperatorActivityCard';
import { EMPTY_FILTERS } from '@/app/(operator)/operator/_components/activities/constants';
import type { OperatorActivity, Filters, ActivityStatus } from '@/app/(operator)/operator/_components/activities/types';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    tdClassName?: string;
    thClassName?: string;
  }
}

export default function OperatorActivitiesPage() {
  const { authState } = useAuth();
  const operatorId = authState.status === 'authenticated' ? authState.user.uid : null;

  const [activities, setActivities] = useState<OperatorActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [detailActivity, setDetailActivity] = useState<OperatorActivity | null>(null);
  const [editActivity, setEditActivity] = useState<OperatorActivity | null>(null);
  const [deleteActivity, setDeleteActivity] = useState<OperatorActivity | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [undoSnackbar, setUndoSnackbar] = useState<{ name: string } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!operatorId) return;
    const q = query(collection(firebaseDb, 'activities'), where('operatorId', '==', operatorId));
    const unsub = onSnapshot(q, (snap) => {
      setActivities(
        snap.docs.map((d) => {
          const data = d.data();
          const tags = normalizeActivityTags(data.activityTags, data.activityTag);
          return {
            id: d.id,
            ...data,
            activityTags: tags,
            activityTag: primaryActivityTag(tags),
            activityImages: normalizePackageImages(data.activityImages),
            inclusions: Array.isArray(data.inclusions) ? data.inclusions : [],
            exclusions: Array.isArray(data.exclusions) ? data.exclusions : [],
          } as OperatorActivity;
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

  const handleToggleStatus = async (act: OperatorActivity) => {
    const next = act.status === 'active' ? 'disabled' : 'active';
    try {
      await updateDoc(doc(firebaseDb, 'activities', act.id), { status: next });
    } catch (err) {
      console.error('Failed to toggle activity status', err);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDelete = (act: OperatorActivity) => {
    setDeleteActivity(act);
  };

  const confirmDelete = (act: OperatorActivity) => {
    setDeleteActivity(null);
    setPendingDeleteId(act.id);
    setUndoSnackbar({ name: act.activityName });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(async () => {
      try {
        await deleteDoc(doc(firebaseDb, 'activities', act.id));
      } catch (err) {
        console.error('Failed to delete activity', err);
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

  const confirmDisable = async (act: OperatorActivity) => {
    try {
      await updateDoc(doc(firebaseDb, 'activities', act.id), { status: 'disabled' });
      setDeleteActivity(null);
    } catch (err) {
      console.error('Failed to disable activity', err);
      alert('Failed to disable. Please try again.');
    }
  };

  const filtered = useMemo(
    () =>
      activities.filter((a) => {
        if (a.id === pendingDeleteId) return false;
        if (search && !a.activityName.toLowerCase().includes(search.toLowerCase())) return false;
        if (filters.tag && !activityHasTag(a.activityTags, filters.tag)) return false;
        if (filters.status !== 'all' && a.status !== filters.status) return false;
        if (filters.location && a.activityLocation !== filters.location) return false;
        if (filters.priceMin && a.pricePerGuest < Number(filters.priceMin)) return false;
        if (filters.priceMax && a.pricePerGuest > Number(filters.priceMax)) return false;
        return true;
      }),
    [activities, search, filters, pendingDeleteId],
  );

  const activityColumns = useMemo<ColumnDef<OperatorActivity>[]>(
    () => [
      {
        accessorKey: 'activityName',
        header: 'Activity',
        meta: { tdClassName: 'px-4 py-3 font-medium text-gray-900' },
        cell: ({ row }) => (
          <button onClick={() => setDetailActivity(row.original)} className="text-left hover:text-green-600">
            {row.original.activityName}
          </button>
        ),
      },
      {
        id: 'activityTags',
        header: 'Tags',
        meta: { tdClassName: 'px-4 py-3 text-gray-600' },
        cell: ({ row }) => formatActivityTagsDisplay(row.original.activityTags),
      },
      { accessorKey: 'activityLocation', header: 'Location', meta: { tdClassName: 'px-4 py-3 text-gray-600' } },
      {
        accessorKey: 'pricePerGuest',
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
        cell: ({ getValue }) => <StatusBadge status={getValue() as ActivityStatus} />,
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
              onClick={() => setEditActivity(row.original)}
              title="Edit"
              aria-label="Edit activity"
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-green-600"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <ToggleSwitch
              checked={row.original.status === 'active'}
              onChange={() => handleToggleStatus(row.original)}
              ariaLabel={row.original.status === 'active' ? 'Disable activity' : 'Enable activity'}
            />
            <button
              onClick={() => handleDelete(row.original)}
              title="Delete"
              aria-label="Delete activity"
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

  const activityTable = useReactTable({
    data: filtered,
    columns: activityColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-gray-900">Activities</h1>
            {activities.length > 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-green-700 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Activity
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Activity"
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
          <div className="text-sm text-gray-400 py-16 text-center">Loading activities…</div>
        ) : filtered.length === 0 ? (
          activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-sm text-gray-400">No activities yet. Add your first one!</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Activity
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-400 py-16 text-center">No activities match your filters.</div>
          )
        ) : viewMode === 'card' ? (
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(160px,280px))]">
            {filtered.map((act) => (
              <OperatorActivityCard key={act.id} activity={act} onViewDetails={setDetailActivity} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                {activityTable.getHeaderGroups().map((headerGroup) => (
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
                {activityTable.getRowModel().rows.map((row) => (
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
        <AddActivityModal onClose={() => setShowAddModal(false)} operatorId={operatorId} />
      )}

      {detailActivity && (
        <ViewDetailsModal
          activity={detailActivity}
          onClose={() => setDetailActivity(null)}
          onEdit={(a) => setEditActivity(a)}
        />
      )}

      {editActivity && operatorId && (
        <EditActivityModal
          activity={editActivity}
          onClose={() => setEditActivity(null)}
          operatorId={operatorId}
        />
      )}

      {deleteActivity && (
        <DeleteActivityModal
          activity={deleteActivity}
          onClose={() => setDeleteActivity(null)}
          onDelete={() => confirmDelete(deleteActivity)}
          onDisable={() => confirmDisable(deleteActivity)}
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
