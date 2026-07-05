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
