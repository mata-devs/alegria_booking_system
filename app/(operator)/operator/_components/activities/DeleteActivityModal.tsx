'use client';

import { Trash2, X } from 'lucide-react';
import type { OperatorActivity } from './types';

export function DeleteActivityModal({
  activity,
  onClose,
  onDelete,
  onDisable,
}: {
  activity: OperatorActivity;
  onClose: () => void;
  onDelete: () => void;
  onDisable: () => void;
}) {
  const isAlreadyDisabled = activity.status === 'disabled';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-gray-900">Delete Activity</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-sm text-gray-700">
              <p className="font-medium text-gray-900 mb-1">&quot;{activity.activityName}&quot;</p>
              <p>
                Permanently deleting will remove this activity and cannot be undone. If you only want to hide it from
                customers, choose <span className="font-semibold">Disable</span> instead.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-gray-50 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDisable}
            disabled={isAlreadyDisabled}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              isAlreadyDisabled
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-amber-400 text-amber-700 hover:bg-amber-50'
            }`}
            title={isAlreadyDisabled ? 'Already disabled' : 'Disable this activity'}
          >
            {isAlreadyDisabled ? 'Already Disabled' : 'Disable'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
