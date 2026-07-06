// Shared property-type list + field-visibility rules for mortgage/auction
// property forms (bank + admin). Mirrors the pattern already used for Unit
// Properties (see AdminUnitProperties.jsx's TYPE_FIELDS/showField) — fields
// like "bedrooms" only make sense for residential types, not plot/commercial/
// warehouse/office.
export const MORTGAGE_TYPES = [
  'flat', 'apartment', 'villa', 'independent_house', 'penthouse',
  'plot', 'commercial', 'office_shop', 'warehouse', 'farmhouse', 'other',
];

export const MORTGAGE_TYPE_LABELS = {
  flat: 'Flat',
  apartment: 'Apartment',
  villa: 'Villa',
  independent_house: 'Independent House',
  penthouse: 'Penthouse',
  plot: 'Plot',
  commercial: 'Commercial',
  office_shop: 'Office / Shop',
  warehouse: 'Warehouse',
  farmhouse: 'Farmhouse',
  other: 'Other',
};

const MORTGAGE_TYPE_FIELDS = {
  flat:              ['bedrooms'],
  apartment:         ['bedrooms'],
  villa:             ['bedrooms'],
  independent_house: ['bedrooms'],
  penthouse:         ['bedrooms'],
  farmhouse:         ['bedrooms'],
  plot:              [],
  commercial:        [],
  office_shop:       [],
  warehouse:         [],
  other:             ['bedrooms'],
};

export function showMortgageField(type, field) {
  return (MORTGAGE_TYPE_FIELDS[type] || []).includes(field);
}

export function mortgageTypeLabel(property) {
  if (!property?.type) return '';
  if (property.type === 'other') return property.customType || 'Other';
  return MORTGAGE_TYPE_LABELS[property.type] || property.type.replace(/_/g, ' ');
}
