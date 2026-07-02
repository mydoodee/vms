import React, { useState } from 'react';
import GlassCard from './GlassCard';

export default function DataTable({
  columns,
  data = [],
  searchPlaceholder = 'ค้นหา...',
  searchField,
  actions,
  loading = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState(null);

  // Filter data based on search
  const filteredData = data.filter((item) => {
    if (!searchTerm || !searchField) return true;
    const value = item[searchField];
    if (value === null || value === undefined) return false;
    return String(value).toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Sort data
  const sortedData = [...filteredData];
  if (sortConfig !== null) {
    sortedData.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (aVal < bVal) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return (
    <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
      {searchField && (
        <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <input
            type="text"
            className="form-input"
            style={{ maxWidth: '300px', padding: '8px 12px' }}
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && requestSort(col.key)}
                  style={{ cursor: col.sortable !== false ? 'pointer' : 'default', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {col.label}
                    {col.sortable !== false && sortConfig?.key === col.key && (
                      <span>{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th style={{ textAlign: 'right' }}>จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="skeleton" style={{ height: '30px', margin: '10px 0' }} />
                  <div className="skeleton" style={{ height: '30px', margin: '10px 0' }} />
                  <div className="skeleton" style={{ height: '30px', margin: '10px 0' }} />
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr key={row.id || index}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
