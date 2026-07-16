import React from 'react';

export default function StatusBadge({ type, value, label }) {
  // mapping types to design system classes
  // types: 'status' (ticket status), 'vehicle' (vehicle status), 'severity' (ticket severity), 'role' (user roles)
  
  let badgeClass = 'badge';
  
  if (type === 'status' && value) {
    badgeClass += ` badge-${value.toLowerCase()}`;
  } else if (type === 'vehicle' && value) {
    badgeClass += ` badge-${value.toLowerCase()}`;
  } else if (type === 'severity' && value) {
    badgeClass += ` badge-${value.toLowerCase()}`;
  } else if (type === 'role' && value) {
    badgeClass += ` badge-${value.toLowerCase()}`;
  }

  return (
    <span className={badgeClass}>
      {label || value}
    </span>
  );
}
