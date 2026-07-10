// Lowest price across a unit-split property's individual units, falling back
// to the property's own price when unit-split isn't used.
export function getStartingPrice(property) {
  const units = property?.unitSplit?.enabled ? property.unitSplit.units : null;
  if (units?.length) {
    const prices = units.map(u => u.price).filter(n => typeof n === 'number' && n > 0);
    if (prices.length) return Math.min(...prices);
  }
  return property?.price;
}

// Indian-notation price formatting shared by property cards/listings — Cr/L
// above the relevant threshold, plain rupees below.
export function formatPrice(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}
