import React, { useState, useRef, useEffect } from 'react';
import { IoCalendarOutline, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { THAI_MONTHS_SHORT, toThaiYear } from '../../utils/thaiDate';

/**
 * ThaiDateInput – A custom date picker that displays and lets users pick dates
 * in Thai Buddhist Era (พ.ศ.) format.
 * 
 * Props:
 *   value    – date string in "YYYY-MM-DD" CE format (same as <input type="date">)
 *   onChange – callback receiving the new "YYYY-MM-DD" CE string
 *   required, className, placeholder, style – passed through
 */
export default function ThaiDateInput({ value, onChange, required, className, placeholder, style, ...rest }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Parse current value
  const today = new Date();
  let selectedDate = value ? new Date(value + 'T00:00:00') : null;
  if (selectedDate && isNaN(selectedDate.getTime())) selectedDate = null;

  const [viewYear, setViewYear] = useState(selectedDate ? selectedDate.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate ? selectedDate.getMonth() : today.getMonth());
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setYearPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayValue = selectedDate
    ? `${selectedDate.getDate()} ${THAI_MONTHS_SHORT[selectedDate.getMonth()]} ${toThaiYear(selectedDate.getFullYear())}`
    : '';

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun

  const handleSelect = (day) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
    setYearPickerOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === viewYear &&
           selectedDate.getMonth() === viewMonth &&
           selectedDate.getDate() === day;
  };

  const isToday = (day) => {
    return today.getFullYear() === viewYear &&
           today.getMonth() === viewMonth &&
           today.getDate() === day;
  };

  // Year range for picker
  const currentCEYear = today.getFullYear();
  const yearStart = currentCEYear - 10;
  const yearEnd = currentCEYear + 10;
  const yearOptions = [];
  for (let y = yearEnd; y >= yearStart; y--) yearOptions.push(y);

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', ...style }} {...rest}>
      {/* Display field */}
      <div
        onClick={() => setOpen(o => !o)}
        className={className || 'form-input'}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          userSelect: 'none',
          minHeight: '38px'
        }}
      >
        <span style={{ color: displayValue ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.9rem' }}>
          {displayValue || placeholder || 'เลือกวันที่ (พ.ศ.)'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {value && (
            <span
              onClick={handleClear}
              style={{
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                padding: '2px 4px',
                borderRadius: '4px',
                lineHeight: 1
              }}
              title="ล้างวันที่"
            >✕</span>
          )}
          <IoCalendarOutline size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>
      </div>

      {/* Hidden native input for form validation */}
      {required && (
        <input
          type="text"
          value={value || ''}
          required
          onChange={() => {}}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          tabIndex={-1}
        />
      )}

      {/* Dropdown Calendar */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 9999,
          marginTop: '4px',
          background: 'var(--bg-card, #1a1a2e)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          borderRadius: '12px',
          padding: '12px',
          minWidth: '280px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.15s ease'
        }}>
          {/* Header: month/year navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <button type="button" onClick={prevMonth} style={navBtnStyle}>
              <IoChevronBack size={16} />
            </button>
            <button
              type="button"
              onClick={() => setYearPickerOpen(y => !y)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary, #6c63ff)',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {THAI_MONTHS_SHORT[viewMonth]} {toThaiYear(viewYear)}
            </button>
            <button type="button" onClick={nextMonth} style={navBtnStyle}>
              <IoChevronForward size={16} />
            </button>
          </div>

          {/* Year quick picker */}
          {yearPickerOpen && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              marginBottom: '10px',
              padding: '4px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.06))'
            }}>
              {yearOptions.map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => { setViewYear(y); setYearPickerOpen(false); }}
                  style={{
                    background: y === viewYear ? 'var(--color-primary, #6c63ff)' : 'none',
                    color: y === viewYear ? '#fff' : 'var(--text-secondary, #aaa)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 2px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: y === viewYear ? 700 : 400,
                    transition: 'all 0.1s'
                  }}
                >
                  {toThaiYear(y)}
                </button>
              ))}
            </div>
          )}

          {/* Day-of-week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
              <div key={d} style={{
                textAlign: 'center',
                fontSize: '0.7rem',
                color: 'var(--text-muted, #666)',
                fontWeight: 600,
                padding: '4px 0'
              }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {/* Day buttons */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const sel = isSelected(day);
              const tod = isToday(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelect(day)}
                  style={{
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    border: tod && !sel ? '1px solid var(--color-primary, #6c63ff)' : 'none',
                    background: sel ? 'var(--color-primary, #6c63ff)' : 'transparent',
                    color: sel ? '#fff' : 'var(--text-primary, #eee)',
                    fontSize: '0.85rem',
                    fontWeight: sel || tod ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.1s'
                  }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setViewYear(today.getFullYear());
                setViewMonth(today.getMonth());
                handleSelect(today.getDate());
              }}
              style={{
                background: 'none',
                border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                color: 'var(--color-primary, #6c63ff)',
                padding: '4px 16px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              วันนี้
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const navBtnStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
  borderRadius: '8px',
  color: 'var(--text-secondary, #ccc)',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s'
};
