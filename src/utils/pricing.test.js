import { describe, it, expect } from 'vitest';
import { getStartingPrice } from './pricing';

describe('getStartingPrice', () => {
  it('returns the lowest unit price when unit-split is enabled', () => {
    const property = {
      price: 9000000,
      unitSplit: { enabled: true, units: [{ price: 5000000 }, { price: 3500000 }, { price: 7000000 }] },
    };
    expect(getStartingPrice(property)).toBe(3500000);
  });

  it('falls back to top-level price when unit-split is disabled', () => {
    const property = { price: 4200000, unitSplit: { enabled: false, units: [{ price: 1 }] } };
    expect(getStartingPrice(property)).toBe(4200000);
  });

  it('falls back to top-level price when unit-split has no valid prices', () => {
    const property = { price: 4200000, unitSplit: { enabled: true, units: [{ price: 0 }, {}] } };
    expect(getStartingPrice(property)).toBe(4200000);
  });

  it('ignores zero and negative unit prices', () => {
    const property = { price: 8000000, unitSplit: { enabled: true, units: [{ price: -1 }, { price: 0 }, { price: 6000000 }] } };
    expect(getStartingPrice(property)).toBe(6000000);
  });

  it('handles missing property gracefully', () => {
    expect(getStartingPrice(undefined)).toBeUndefined();
    expect(getStartingPrice({})).toBeUndefined();
  });
});
