import { describe, it, expect } from 'vitest';
import { getPincodeEntryForCity, expandPincodesForCity, RAJASTHAN_CITY_NAMES } from './rajasthanPincodes';

describe('getPincodeEntryForCity', () => {
  it('matches city names case-insensitively', () => {
    expect(getPincodeEntryForCity('jaipur')?.city).toBe('Jaipur');
    expect(getPincodeEntryForCity('JAIPUR')?.city).toBe('Jaipur');
    expect(getPincodeEntryForCity('  Jodhpur  ')?.city).toBe('Jodhpur');
  });

  it('returns null for unknown or empty cities', () => {
    expect(getPincodeEntryForCity('Mumbai')).toBeNull();
    expect(getPincodeEntryForCity('')).toBeNull();
    expect(getPincodeEntryForCity(undefined)).toBeNull();
  });
});

describe('expandPincodesForCity', () => {
  it('expands a single-pincode city to exactly that pincode', () => {
    expect(expandPincodesForCity('Neemrana')).toEqual(['301705']);
  });

  it('produces in-range, zero-padded, unique pincodes for a ranged city', () => {
    const pins = expandPincodesForCity('Jaipur');
    expect(pins.length).toBeGreaterThan(0);
    expect(new Set(pins).size).toBe(pins.length); // no duplicates
    for (const p of pins) {
      expect(p).toMatch(/^\d{6}$/); // always 6 digits
    }
    // First range is 302001-302039 — the start should be present.
    expect(pins).toContain('302001');
  });

  it('returns an empty array for unknown cities', () => {
    expect(expandPincodesForCity('Atlantis')).toEqual([]);
  });
});

describe('RAJASTHAN_CITY_NAMES', () => {
  it('contains lowercased known cities', () => {
    expect(RAJASTHAN_CITY_NAMES.has('jaipur')).toBe(true);
    expect(RAJASTHAN_CITY_NAMES.has('udaipur')).toBe(true);
    expect(RAJASTHAN_CITY_NAMES.has('mumbai')).toBe(false);
  });
});
