function Bone({ className = '' }) {
  return <div className={`skeleton-shimmer rounded ${className}`} />;
}

export function SkeletonDocCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Bone className="w-24 h-4" />
          <Bone className="w-16 h-5 rounded-full" />
        </div>
        <Bone className="w-20 h-5 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Bone className="w-32 h-4" />
        <Bone className="w-24 h-4" />
      </div>
      <div className="flex gap-3">
        <Bone className="w-20 h-3" />
        <Bone className="w-24 h-3" />
      </div>
      <div className="pt-2 border-t border-gray-100 flex gap-2">
        <Bone className="h-9 flex-1 rounded-xl" />
        <Bone className="h-9 flex-1 rounded-xl" />
        <Bone className="w-9 h-9 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonDocTableRow() {
  return (
    <tr>
      <td className="px-4 py-3"><Bone className="w-24 h-4" /></td>
      <td className="px-4 py-3"><Bone className="w-32 h-4" /></td>
      <td className="px-4 py-3"><Bone className="w-16 h-5 rounded-full" /></td>
      <td className="px-4 py-3 hidden md:table-cell"><Bone className="w-20 h-4" /></td>
      <td className="px-4 py-3 hidden lg:table-cell"><Bone className="w-20 h-4" /></td>
      <td className="px-4 py-3 text-right"><Bone className="w-24 h-4 ml-auto" /></td>
      <td className="px-4 py-3"><Bone className="w-16 h-5 rounded-full" /></td>
      <td className="px-4 py-3 text-right"><Bone className="w-20 h-4 ml-auto" /></td>
    </tr>
  );
}

export function SkeletonClientCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Bone className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Bone className="w-28 h-4" />
            <Bone className="w-20 h-3" />
          </div>
        </div>
        <Bone className="w-7 h-7 rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        <Bone className="w-32 h-3" />
        <Bone className="w-40 h-3" />
      </div>
      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
        <Bone className="w-12 h-3" />
        <Bone className="w-16 h-3" />
        <Bone className="w-16 h-3 ml-auto" />
      </div>
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <Bone className="w-10 h-10 rounded-lg" />
        <div className="flex gap-1">
          <Bone className="w-7 h-7 rounded" />
          <Bone className="w-7 h-7 rounded" />
        </div>
      </div>
      <Bone className="w-3/4 h-4" />
      <Bone className="w-1/2 h-3" />
      <div className="space-y-2 pt-1">
        <Bone className="w-20 h-5 rounded-full" />
        <div className="flex items-center justify-between">
          <Bone className="w-28 h-6" />
          <Bone className="w-14 h-3" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="card p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Bone className="w-24 h-3" />
        <Bone className="w-10 h-10 rounded-xl" />
      </div>
      <Bone className="w-32 h-8" />
      <Bone className="w-20 h-3" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
      {/* Chart + side */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 card p-4 sm:p-6 space-y-4">
          <Bone className="w-40 h-5" />
          <Bone className="w-full h-48 rounded-xl" />
        </div>
        <div className="card p-4 sm:p-6 space-y-4">
          <Bone className="w-32 h-5" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="w-3/4 h-3" />
                <Bone className="w-1/2 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Recent docs */}
      <div className="card p-4 sm:p-6 space-y-4">
        <Bone className="w-40 h-5" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
            <Bone className="w-24 h-4" />
            <Bone className="w-32 h-4" />
            <Bone className="w-20 h-4 ml-auto" />
            <Bone className="w-16 h-5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
