import React, { useMemo } from 'react';

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems = 0,
  itemsPerPage = 10,
  className = '',
  showPageNumbers = true,
  maxPageButtons = 5
}) {
  if (totalPages <= 1) return null;

  const pages = useMemo(() => {
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxPageButtons / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxPageButtons - 1);

    if (end - start + 1 < maxPageButtons) {
      start = Math.max(1, end - maxPageButtons + 1);
    }

    const result = [];
    if (start > 1) {
      result.push(1);
      if (start > 2) result.push('...');
    }
    for (let i = start; i <= end; i++) result.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) result.push('...');
      result.push(totalPages);
    }
    return result;
  }, [currentPage, totalPages, maxPageButtons]);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex flex-col items-center gap-3 pt-4 ${className}`}>
      <div className="text-sm text-on-surface-variant">
        Showing {startItem}–{endItem} of {totalItems} items
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Previous page"
        >
          <span className="material-icons-outlined text-sm">chevron_left</span>
        </button>

        {showPageNumbers && pages.map((page, idx) => (
          <React.Fragment key={idx}>
            {page === '...' ? (
              <span className="px-3 py-2 text-on-surface-variant">...</span>
            ) : (
              <button
                onClick={() => onPageChange?.(page)}
                disabled={page === currentPage}
                className={`w-9 h-9 rounded-xl text-sm font-semibold transition
                  ${page === currentPage 
                    ? 'bg-primary text-white' 
                    : 'border border-outline-variant text-on-surface hover:bg-surface-container'}`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Next page"
        >
          <span className="material-icons-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

export function SimplePagination({ currentPage, totalPages, onPageChange, className = '' }) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      <button
        onClick={() => onPageChange?.(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm font-medium text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition"
      >
        <span className="material-icons-outlined text-sm">chevron_left</span>
      </button>
      
      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        let pageNum;
        if (totalPages <= 5) {
          pageNum = i + 1;
        } else if (currentPage <= 3) {
          pageNum = i + 1;
        } else if (currentPage >= totalPages - 2) {
          pageNum = totalPages - 4 + i;
        } else {
          pageNum = currentPage - 2 + i;
        }
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange?.(pageNum)}
            className={`w-8 h-8 rounded-lg text-sm font-semibold transition
              ${pageNum === currentPage ? 'bg-primary text-white' : 'text-on-surface hover:bg-surface-container'}`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange?.(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm font-medium text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition"
      >
        <span className="material-icons-outlined text-sm">chevron_right</span>
      </button>
    </div>
  );
}