import React from 'react';

const STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
  succeeded: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
};

const StatusBadge = ({ label, className = '' }) => (
  <span
    className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[label] || 'bg-gray-100 text-gray-500 border-gray-200'} ${className}`}
  >
    {label}
  </span>
);

export default StatusBadge;
