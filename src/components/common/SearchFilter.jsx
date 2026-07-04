import { useMemo } from 'react';

export function SearchFilter({ 
  searchTerm, 
  onSearchChange, 
  placeholder = 'Search...', 
  filters = [], 
  filterValue, 
  onFilterChange,
  className = ''
}) {
  const showFilters = useMemo(() => filters.length > 0 || searchTerm !== undefined, [filters.length, searchTerm]);
  if (!showFilters) return null;

  return (
    <div className={`flex flex-wrap gap-3 mb-4 ${className}`}>
      {searchTerm !== undefined && (
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={e => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}
      {filters.map((filter, idx) => (
        <select
          key={idx}
          value={filterValue?.[filter.key] || ''}
          onChange={e => onFilterChange?.(filter.key, e.target.value)}
          className="border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary min-w-[160px]"
        >
          <option value="">{filter.allLabel || 'All'}</option>
          {filter.options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
    </div>
  );
}

export function SearchBar({ searchTerm, onSearchChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative flex-1 min-w-[200px] max-w-md ${className}`}>
      <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={e => onSearchChange?.(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

export function FilterDropdown({ value, onChange, options, placeholder = 'All', className = '' }) {
  return (
    <select
      value={value}
      onChange={e => onChange?.(e.target.value)}
      className={`border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary min-w-[140px] ${className}`}
    >
      <option value="">{placeholder}</option>
      {options?.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}