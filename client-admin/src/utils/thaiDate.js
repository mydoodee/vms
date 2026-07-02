/**
 * Thai Buddhist Era (พ.ศ.) Date Utilities
 * Converts between CE (ค.ศ.) and BE (พ.ศ.) date formats
 */

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

/**
 * Format a date string or Date object to Thai Buddhist Era format
 * @param {string|Date} dateInput - Date string (YYYY-MM-DD) or Date object
 * @param {object} options - Formatting options
 * @param {boolean} options.short - Use short month names (default: true)
 * @param {boolean} options.showDay - Show day number (default: true)
 * @returns {string} Formatted Thai date string e.g. "1 ก.ค. 2569"
 */
export function formatThaiDate(dateInput, options = {}) {
  if (!dateInput) return '-';
  
  const { short = true, showDay = true } = options;
  
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '-';

  const day = date.getDate();
  const month = short ? THAI_MONTHS_SHORT[date.getMonth()] : THAI_MONTHS[date.getMonth()];
  const thaiYear = date.getFullYear() + 543;

  if (showDay) {
    return `${day} ${month} ${thaiYear}`;
  }
  return `${month} ${thaiYear}`;
}

/**
 * Format a date string to Thai short format for compact displays
 * @param {string|Date} dateInput 
 * @returns {string} e.g. "1/7/2569"
 */
export function formatThaiDateShort(dateInput) {
  if (!dateInput) return '-';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '-';

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const thaiYear = date.getFullYear() + 543;
  return `${day}/${month}/${thaiYear}`;
}

/**
 * Convert a CE year to Thai Buddhist Era year
 * @param {number} ceYear 
 * @returns {number}
 */
export function toThaiYear(ceYear) {
  return ceYear + 543;
}

/**
 * Convert a Thai Buddhist Era year to CE year
 * @param {number} beYear 
 * @returns {number}
 */
export function toCEYear(beYear) {
  return beYear - 543;
}

export { THAI_MONTHS, THAI_MONTHS_SHORT };
