/**
 * Generate a unique ticket ID
 * Format: TK-YYYYNNNN
 */
function generateTicketId() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `TK-${year}${random}`;
}

/**
 * Format date for display (Thai locale)
 */
function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format currency (THB)
 */
function formatCurrency(amount) {
    if (!amount) return '฿0.00';
    return `฿${Number(amount).toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

/**
 * Sanitize string for SQL safety
 */
function sanitizeString(str) {
    if (!str) return '';
    return str.replace(/[<>\"\']/g, '');
}

/**
 * Calculate days difference
 */
function daysDiff(dateStr) {
    const target = new Date(dateStr);
    const today = new Date();
    const diff = target - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

module.exports = {
    generateTicketId,
    formatDate,
    formatCurrency,
    sanitizeString,
    daysDiff
};
