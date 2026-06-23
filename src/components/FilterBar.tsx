import { ArrowUpDown } from 'lucide-react';
import { FilterOptions, sortLabels } from '../types/fund';
import { cn } from '../lib/utils';

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  totalCount: number;
  filteredCount: number;
}

const sortOptions: Array<{ value: FilterOptions['sortBy']; label: string }> = [
  { value: 'return', label: sortLabels.return },
  { value: 'name', label: sortLabels.name },
  { value: 'code', label: sortLabels.code },
];

export const FilterBar = ({ filters, onFilterChange, totalCount, filteredCount }: FilterBarProps) => {
  return (
    <div className="bg-dark-card/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-dark-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-sm text-gray-400">
          显示 <span className="text-white font-medium">{filteredCount}</span> / <span className="text-white font-medium">{totalCount}</span> 只基金
        </div>
        
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [FilterOptions['sortBy'], FilterOptions['sortOrder']];
              onFilterChange({ ...filters, sortBy, sortOrder });
            }}
            className={cn(
              'bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-sm text-gray-300',
              'focus:outline-none focus:border-primary-500 transition-colors min-h-[40px]',
              'cursor-pointer'
            )}
          >
            {sortOptions.map(option => (
              <optgroup key={option.value} label={option.label}>
                <option value={`${option.value}-desc`}>{option.label} 从高到低</option>
                <option value={`${option.value}-asc`}>{option.label} 从低到高</option>
              </optgroup>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
