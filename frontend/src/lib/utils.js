import { clsx } from 'clsx';

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatAddress(address) {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function shortenHash(hash) {
  if (!hash) return '';
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatArea(sqft) {
  if (sqft == null) return 'N/A';
  if (sqft >= 43560) {
    return `${(sqft / 43560).toFixed(2)} acres`;
  }
  return `${sqft.toLocaleString('en-IN')} sq ft`;
}

export function formatCurrency(amount) {
  if (amount == null) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStatusColor(status) {
  const map = {
    active: 'accent',
    mortgaged: 'yellow',
    disputed: 'red',
    pending: 'orange',
    transferred: 'blue',
    verified: 'accent',
    rejected: 'red',
    approved: 'accent',
  };
  return map[status?.toLowerCase()] || 'gray';
}

export function getRoleLabel(role) {
  const map = {
    citizen: 'Citizen',
    officer: 'Government Officer',
    bank: 'Bank/Financial Institution',
    admin: 'System Administrator',
  };
  return map[role] || role;
}
