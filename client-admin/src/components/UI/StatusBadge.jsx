import React from 'react';

export default function StatusBadge({ type, value, label }) {
  // mapping types to design system classes
  // types: 'status' (ticket status), 'vehicle' (vehicle status), 'severity' (ticket severity), 'role' (user roles)
  
  let badgeClass = 'badge';
  
  if (type === 'status') {
    badgeClass += ` badge-${value.toLowerCase()}`;
  } else if (type === 'vehicle') {
    badgeClass += ` badge-${value.toLowerCase()}`;
  } else if (type === 'severity') {
    badgeClass += ` badge-${value.toLowerCase()}`;
  } else if (type === 'role') {
    badgeClass += ` badge-${value.toLowerCase()}`;
  }

  return (
    <span className={badgeClass}>
      {label || value}
    </span>
  );
}
