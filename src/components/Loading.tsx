export const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-dark-border rounded-full" />
        <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-gray-400 text-sm">正在加载数据...</p>
    </div>
  );
};

export const SkeletonRow = () => {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-4">
        <div className="space-y-2">
          <div className="h-4 bg-dark-border rounded w-3/4" />
          <div className="h-3 bg-dark-border rounded w-1/2" />
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="h-4 bg-dark-border rounded w-16" />
      </td>
      <td className="px-4 py-4">
        <div className="h-6 bg-dark-border rounded w-20" />
      </td>
      <td className="px-4 py-4">
        <div className="h-6 bg-dark-border rounded w-16" />
      </td>
      <td className="px-4 py-4">
        <div className="h-8 bg-dark-border rounded w-8" />
      </td>
    </tr>
  );
};
