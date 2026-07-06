// City -> pincode range(s) mapping for Rajasthan, used to suggest pincodes
// when a bank lists an auction property in a Rajasthan city.
export const RAJASTHAN_PINCODES = [
  { city: 'Jaipur', pincodes: ['302001-302039', '303001-303908'] },
  { city: 'Jodhpur', pincodes: ['342001-342999'] },
  { city: 'Udaipur', pincodes: ['313001-313999'] },
  { city: 'Ajmer', pincodes: ['305001-305999'] },
  { city: 'Kota', pincodes: ['324001-324999'] },
  { city: 'Alwar', pincodes: ['301001-301999'] },
  { city: 'Bharatpur', pincodes: ['321001-321999'] },
  { city: 'Bikaner', pincodes: ['334001-334999'] },
  { city: 'Bhilwara', pincodes: ['311001-311999'] },
  { city: 'Chittorgarh', pincodes: ['312001-312999'] },
  { city: 'Churu', pincodes: ['331001-331999'] },
  { city: 'Dausa', pincodes: ['303301-303999'] },
  { city: 'Dholpur', pincodes: ['328001-328999'] },
  { city: 'Dungarpur', pincodes: ['314001-314999'] },
  { city: 'Hanumangarh', pincodes: ['335501-335999'] },
  { city: 'Sri Ganganagar', pincodes: ['335001-335099'] },
  { city: 'Jaisalmer', pincodes: ['345001-345999'] },
  { city: 'Jalore', pincodes: ['343001-343999'] },
  { city: 'Jhalawar', pincodes: ['326001-326999'] },
  { city: 'Jhunjhunu', pincodes: ['333001-333999'] },
  { city: 'Karauli', pincodes: ['322201-322999'] },
  { city: 'Nagaur', pincodes: ['341001-341999'] },
  { city: 'Pali', pincodes: ['306001-306999'] },
  { city: 'Pratapgarh', pincodes: ['312601-312999'] },
  { city: 'Rajsamand', pincodes: ['313324-313999'] },
  { city: 'Sawai Madhopur', pincodes: ['322001-322999'] },
  { city: 'Sikar', pincodes: ['332001-332999'] },
  { city: 'Sirohi', pincodes: ['307001-307999'] },
  { city: 'Tonk', pincodes: ['304001-304999'] },
  { city: 'Barmer', pincodes: ['344001-344999'] },
  { city: 'Baran', pincodes: ['325201-325999'] },
  { city: 'Banswara', pincodes: ['327001-327999'] },
  { city: 'Bundi', pincodes: ['323001-323999'] },
  { city: 'Neemrana', pincodes: ['301705'] },
  { city: 'Behror', pincodes: ['301701'] },
  { city: 'Kishangarh', pincodes: ['305801'] },
  { city: 'Pushkar', pincodes: ['305022'] },
  { city: 'Abu Road', pincodes: ['307026'] },
  { city: 'Mount Abu', pincodes: ['307501'] },
  { city: 'Fatehpur', pincodes: ['332301'] },
  { city: 'Ladnun', pincodes: ['341306'] },
  { city: 'Makrana', pincodes: ['341505'] },
  { city: 'Didwana', pincodes: ['341303'] },
  { city: 'Kuchaman City', pincodes: ['341508'] },
  { city: 'Phalodi', pincodes: ['342301'] },
  { city: 'Balotra', pincodes: ['344022'] },
];

export const RAJASTHAN_CITY_NAMES = new Set(RAJASTHAN_PINCODES.map(e => e.city.toLowerCase()));

export function getPincodeEntryForCity(city) {
  if (!city) return null;
  const norm = city.trim().toLowerCase();
  return RAJASTHAN_PINCODES.find(e => e.city.toLowerCase() === norm) || null;
}

// Expand a city's pincode range(s) into a real, pickable list of pincodes.
// Small ranges are returned in full; large ranges are evenly sampled so the
// list stays a manageable size for a dropdown.
export function expandPincodesForCity(city, capPerRange = 25) {
  const entry = getPincodeEntryForCity(city);
  if (!entry) return [];
  const out = [];
  for (const range of entry.pincodes) {
    const [startStr, endStr] = range.split('-');
    const width = startStr.length;
    const start = Number(startStr);
    const end = endStr ? Number(endStr) : start;
    const span = end - start + 1;
    if (span <= capPerRange) {
      for (let n = start; n <= end; n++) out.push(String(n).padStart(width, '0'));
    } else {
      const step = Math.ceil(span / capPerRange);
      for (let n = start; n <= end; n += step) out.push(String(n).padStart(width, '0'));
      if (out[out.length - 1] !== String(end).padStart(width, '0')) out.push(String(end).padStart(width, '0'));
    }
  }
  return [...new Set(out)];
}

// A handful of concrete, pickable pincodes for a city — the start and end of
// each range it covers (deduped), capped to keep the suggestion list short.
export function suggestPincodesForCity(city, limit = 6) {
  const entry = getPincodeEntryForCity(city);
  if (!entry) return [];
  const out = [];
  for (const range of entry.pincodes) {
    const [start, end] = range.split('-');
    out.push(start);
    if (end && end !== start) out.push(end);
  }
  return [...new Set(out)].slice(0, limit);
}
