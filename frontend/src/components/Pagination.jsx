import React from 'react'

export default function Pagination({
  page,            // 1-based
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizes = [10, 25, 50, 100],
}) {
  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize))
  const safePage = Math.min(Math.max(1, page), pageCount)
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, total || 0)

  return (
    <div className="pagination">
      <div className="pagination__left">
        <label className="inline">
          Rows per page{' '}
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <span className="muted">
          {start}–{end} of {total || 0}
        </span>
      </div>

      <div className="pagination__right">
        <button
          onClick={() => onPageChange(1)}
          disabled={safePage <= 1}
          aria-label="First page"
          title="First page"
        >«</button>

        <button
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Previous page"
          title="Previous page"
        >‹</button>

        <span className="muted">Page {safePage} / {pageCount}</span>

        <button
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= pageCount}
          aria-label="Next page"
          title="Next page"
        >›</button>

        <button
          onClick={() => onPageChange(pageCount)}
          disabled={safePage >= pageCount}
          aria-label="Last page"
          title="Last page"
        >»</button>
      </div>
    </div>
  )
}