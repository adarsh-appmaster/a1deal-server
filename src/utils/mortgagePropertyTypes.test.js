import { describe, it, expect } from 'vitest';
import { showMortgageField, mortgageTypeLabel, MORTGAGE_TYPES } from './mortgagePropertyTypes';

describe('showMortgageField', () => {
  it('shows bedrooms for residential types', () => {
    for (const t of ['flat', 'apartment', 'villa', 'independent_house', 'penthouse', 'farmhouse']) {
      expect(showMortgageField(t, 'bedrooms')).toBe(true);
    }
  });

  it('hides bedrooms for non-residential types', () => {
    for (const t of ['plot', 'commercial', 'office_shop', 'warehouse']) {
      expect(showMortgageField(t, 'bedrooms')).toBe(false);
    }
  });

  it('returns false for unknown types', () => {
    expect(showMortgageField('spaceship', 'bedrooms')).toBe(false);
  });
});

describe('mortgageTypeLabel', () => {
  it('uses the friendly label for known types', () => {
    expect(mortgageTypeLabel({ type: 'office_shop' })).toBe('Office / Shop');
    expect(mortgageTypeLabel({ type: 'independent_house' })).toBe('Independent House');
  });

  it('uses customType when type is "other"', () => {
    expect(mortgageTypeLabel({ type: 'other', customType: 'Duplex' })).toBe('Duplex');
  });

  it('falls back to "Other" when type is "other" without a custom label', () => {
    expect(mortgageTypeLabel({ type: 'other' })).toBe('Other');
  });

  it('returns empty string when no type', () => {
    expect(mortgageTypeLabel({})).toBe('');
    expect(mortgageTypeLabel(null)).toBe('');
  });
});

describe('MORTGAGE_TYPES', () => {
  it('includes "other" as the last option and has no duplicates', () => {
    expect(MORTGAGE_TYPES.at(-1)).toBe('other');
    expect(new Set(MORTGAGE_TYPES).size).toBe(MORTGAGE_TYPES.length);
  });
});
