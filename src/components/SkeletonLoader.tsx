import React from 'react';

interface SkeletonLoaderProps {
  darkMode?: boolean;
  type?: 'card' | 'table' | 'dashboard' | 'form' | 'audit-table';
  rows?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  darkMode = false, 
  type = 'card',
  rows = 4 
}) => {
  const baseCardClass = `p-6 rounded-2xl border ${
    darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-100 shadow-sm'
  }`;

  const shimmerClass = `relative overflow-hidden ${
    darkMode ? 'bg-slate-800/60' : 'bg-gray-200/70'
  } rounded animate-pulse`;

  if (type === 'dashboard') {
    return (
      <div className="space-y-8 animate-fade-in p-2">
        {/* Top metrics grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={baseCardClass}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${shimmerClass}`} />
                <div className={`w-16 h-5 rounded-full ${shimmerClass}`} />
              </div>
              <div className={`w-28 h-8 mb-2 ${shimmerClass}`} />
              <div className={`w-36 h-4 ${shimmerClass}`} />
            </div>
          ))}
        </div>

        {/* Chart / main container skeleton */}
        <div className={baseCardClass}>
          <div className="flex items-center justify-between mb-6">
            <div className={`w-48 h-6 ${shimmerClass}`} />
            <div className={`w-28 h-8 rounded-lg ${shimmerClass}`} />
          </div>
          <div className={`w-full h-72 rounded-xl ${shimmerClass}`} />
        </div>

        {/* Table skeleton */}
        <div className={baseCardClass}>
          <div className={`w-40 h-6 mb-6 ${shimmerClass}`} />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-800">
                <div className={`w-1/4 h-5 ${shimmerClass}`} />
                <div className={`w-1/5 h-5 ${shimmerClass}`} />
                <div className={`w-1/6 h-5 ${shimmerClass}`} />
                <div className={`w-1/8 h-5 rounded-full ${shimmerClass}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'audit-table') {
    return (
      <div className={`${baseCardClass} space-y-4 overflow-hidden`}>
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-32 h-8 rounded-lg ${shimmerClass}`} />
            <div className={`w-48 h-8 rounded-lg ${shimmerClass}`} />
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-24 h-8 rounded-lg ${shimmerClass}`} />
            <div className={`w-28 h-8 rounded-lg ${shimmerClass}`} />
          </div>
        </div>

        {/* Table header skeleton mimicking CKM3 columns */}
        <div className={`w-full h-11 rounded-lg ${shimmerClass} flex items-center px-4 gap-6`}>
          <div className={`w-8 h-4 ${shimmerClass}`} />
          <div className={`w-48 h-4 ${shimmerClass}`} />
          <div className={`w-24 h-4 ${shimmerClass}`} />
          <div className={`w-64 h-4 ${shimmerClass}`} />
          <div className={`w-28 h-4 ${shimmerClass}`} />
          <div className={`w-32 h-4 ${shimmerClass}`} />
          <div className={`w-24 h-4 ${shimmerClass}`} />
          <div className={`w-24 h-4 ${shimmerClass}`} />
        </div>

        {/* Rows skeleton */}
        <div className="space-y-3 pt-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 py-3.5 px-4 border-b border-gray-100 dark:border-slate-800/60">
              <div className={`w-5 h-5 rounded ${shimmerClass}`} />
              <div className={`w-48 h-5 ${shimmerClass}`} />
              <div className={`w-24 h-5 ${shimmerClass}`} />
              <div className={`w-64 h-5 ${shimmerClass}`} />
              <div className={`w-28 h-5 ${shimmerClass}`} />
              <div className={`w-32 h-5 ${shimmerClass}`} />
              <div className={`w-24 h-5 rounded-full ${shimmerClass}`} />
              <div className={`w-24 h-5 rounded-full ${shimmerClass}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`${baseCardClass} space-y-4`}>
        <div className="flex items-center justify-between">
          <div className={`w-48 h-6 ${shimmerClass}`} />
          <div className={`w-32 h-10 rounded-xl ${shimmerClass}`} />
        </div>
        <div className="space-y-3 pt-2">
          <div className={`w-full h-10 rounded-lg ${shimmerClass}`} />
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-slate-800">
              <div className={`w-12 h-5 ${shimmerClass}`} />
              <div className={`flex-1 h-5 ${shimmerClass}`} />
              <div className={`w-32 h-5 ${shimmerClass}`} />
              <div className={`w-24 h-5 ${shimmerClass}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={baseCardClass}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-2xl ${shimmerClass}`} />
        <div className="space-y-2 flex-1">
          <div className={`w-1/3 h-5 ${shimmerClass}`} />
          <div className={`w-1/2 h-4 ${shimmerClass}`} />
        </div>
      </div>
      <div className="space-y-3 pt-4">
        <div className={`w-full h-10 rounded-xl ${shimmerClass}`} />
        <div className={`w-3/4 h-10 rounded-xl ${shimmerClass}`} />
      </div>
    </div>
  );
};
