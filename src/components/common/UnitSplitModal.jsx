import { useState } from 'react';
import api from '../../api/axios';
import BulkShareModal from './BulkShareModal';
import BookPropertyModal from './BookPropertyModal';

// ── Subcategories per property type ─────────────────────────────────────────
const SUBCATEGORIES = {
  tower:      ['Studio', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK', 'Penthouse Unit', 'Duplex Unit', 'Sky Suite'],
  building:   ['Studio', '1 BHK', '2 BHK', '3 BHK', 'Service Apartment', 'Office Unit', 'Retail Unit'],
  villa:      ['2 BHK Villa', '3 BHK Villa', '4 BHK Villa', '5 BHK Villa', 'Pool Villa', 'Garden Villa', 'Luxury Villa', 'Independent House'],
  commercial: ['Office Space', 'Retail Shop', 'Showroom', 'Restaurant Unit', 'Co-working Unit', 'Medical Clinic', 'Food Court Stall', 'Kiosk'],
  plot:       ['Residential Plot', 'Commercial Plot', 'Corner Plot', 'NA Plot', 'Premium Plot', 'Regular Plot'],
  rowhouse:   ['2 BHK Row House', '3 BHK Row House', '4 BHK Row House', 'Corner Unit', 'Duplex Row House', 'End Unit'],
  duplex:     ['2 BHK Duplex', '3 BHK Duplex', '4 BHK Duplex', 'Penthouse Duplex', 'Luxury Duplex'],
  penthouse:  ['3 BHK Penthouse', '4 BHK Penthouse', '5 BHK Penthouse', 'Sky Villa', 'Terrace Unit'],
  township:   ['Studio', '1 BHK', '2 BHK', '3 BHK', 'Villa Unit', 'Row House Unit', 'Plot', 'Commercial Unit'],
  mixed_use:  ['Studio', '1 BHK', '2 BHK', '3 BHK', 'Office Space', 'Retail Shop', 'Service Apartment'],
  land:       ['Land Parcel', 'Corner Parcel', 'Industrial Parcel', 'Agricultural Parcel'],
  farmland:   ['Farm Plot', 'Farm House Unit', 'Agri Land Parcel', 'Orchard Unit'],
  warehouse:  ['Small Unit (< 2000 sqft)', 'Medium Unit (2–5k sqft)', 'Large Unit (> 5000 sqft)', 'Cold Storage Unit', 'Logistics Bay'],
  other:      ['Type A', 'Type B', 'Type C', 'Standard Unit', 'Premium Unit'],
};
function getSubs(pt) { return SUBCATEGORIES[pt] || SUBCATEGORIES.other; }

// Floor-wise is the better default for multi-storey types
const FLOOR_WISE_TYPES = new Set(['tower', 'building', 'penthouse', 'commercial', 'mixed_use', 'warehouse']);
function getSuggestedMode(pt) { return FLOOR_WISE_TYPES.has(pt) ? 'floor_wise' : 'bhk_wise'; }

const FACING_OPTS = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];
const AMENITY_LIST = [
  'Gym', 'Swimming Pool', 'Club House', 'Garden', 'Power Backup',
  '24x7 Water', 'Lift/Elevator', 'Security', 'CCTV', 'Intercom',
  'Play Area', 'Jogging Track', 'Balcony', 'Terrace', 'Store Room',
];

const inp  = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#484a5a]/30 bg-white';
const sinp = 'w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#484a5a]/20 bg-white';

function fmt(n) {
  if (!n && n !== 0) return '—';
  const l = Number(n);
  if (l >= 10000000) return `₹${(l / 10000000).toFixed(2)} Cr`;
  if (l >= 100000)   return `₹${(l / 100000).toFixed(1)} L`;
  return `₹${l.toLocaleString('en-IN')}`;
}

function fmtCompact(n) {
  if (!n) return '';
  const l = Number(n);
  if (l >= 10000000) return `${(l / 10000000).toFixed(1)}Cr`;
  if (l >= 100000)   return `${(l / 100000).toFixed(0)}L`;
  return `${l.toLocaleString('en-IN')}`;
}

// ── Shared field selects ─────────────────────────────────────────────────────
function FacingSelect({ value, onChange, className = sinp }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={className}>
      <option value="">Any facing</option>
      {FACING_OPTS.map(f => <option key={f} value={f}>{f}</option>)}
    </select>
  );
}
function ParkingSelect({ value, onChange, className = sinp }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={className}>
      <option value="none">No parking</option>
      <option value="covered">Covered</option>
      <option value="open">Open</option>
      <option value="two_wheeler">Two-Wheeler</option>
    </select>
  );
}
function FurnishSelect({ value, onChange, className = sinp }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={className}>
      <option value="unfurnished">Unfurnished</option>
      <option value="semi_furnished">Semi-Furnished</option>
      <option value="fully_furnished">Fully Furnished</option>
    </select>
  );
}

// ── Default group templates ──────────────────────────────────────────────────
function newBhkGroup(subs) {
  return { id: Date.now() + Math.random(), unitType: subs[0] || '2 BHK', count: 5, areaSqft: '', price: '', facing: '', parking: 'none', furnishing: 'unfurnished' };
}
function newUnitGroup(subs) {
  return { id: Date.now() + Math.random(), unitType: subs[0] || '2 BHK', count: 2, areaSqft: '', price: '', facing: '', parking: 'none' };
}
function newFloorConfig(subs, floorStart, floorEnd) {
  return { id: Date.now() + Math.random(), floorStart, floorEnd, unitGroups: [newUnitGroup(subs)] };
}

// ── BHK-wise configure form ──────────────────────────────────────────────────
function BhkWiseConfig({ subs, groups, setGroups }) {
  const totalUnits = groups.reduce((s, g) => s + (Number(g.count) || 0), 0);

  const update = (id, field, val) => setGroups(gs => gs.map(g => g.id === id ? { ...g, [field]: val } : g));
  const remove = (id) => setGroups(gs => gs.filter(g => g.id !== id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Unit Type Groups</p>
        <span className="text-xs font-bold text-[#484a5a]">{totalUnits} units total</span>
      </div>

      {groups.map((g, gi) => (
        <div key={g.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
          {/* Row 1: type + count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Unit Type *</label>
              <select value={g.unitType} onChange={e => update(g.id, 'unitType', e.target.value)} className={inp}>
                {subs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Count *</label>
              <input type="number" min="1" max="500" value={g.count}
                onChange={e => update(g.id, 'count', e.target.value)}
                className={inp} placeholder="10" />
            </div>
          </div>

          {/* Row 2: area + price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Area (sqft)</label>
              <input type="number" min="1" value={g.areaSqft}
                onChange={e => update(g.id, 'areaSqft', e.target.value)}
                className={inp} placeholder="850" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                Price (₹) {g.price && <span className="text-[#484a5a] font-semibold">{fmtCompact(g.price)}</span>}
              </label>
              <input type="number" min="0" value={g.price}
                onChange={e => update(g.id, 'price', e.target.value)}
                className={inp} placeholder="4500000" />
            </div>
          </div>

          {/* Row 3: facing + parking + furnishing */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Facing</label>
              <FacingSelect value={g.facing} onChange={v => update(g.id, 'facing', v)} className={inp} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Parking</label>
              <ParkingSelect value={g.parking} onChange={v => update(g.id, 'parking', v)} className={inp} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Furnishing</label>
              <FurnishSelect value={g.furnishing} onChange={v => update(g.id, 'furnishing', v)} className={inp} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              {g.count || 0} × {g.unitType}
              {g.areaSqft ? ` · ${g.areaSqft} sqft` : ''}
              {g.price    ? ` · ${fmt(g.price)}`     : ''}
            </span>
            {groups.length > 1 && (
              <button type="button" onClick={() => remove(g.id)}
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-semibold">
                <span className="material-icons-outlined text-sm">delete_outline</span> Remove
              </button>
            )}
          </div>
        </div>
      ))}

      <button type="button" onClick={() => setGroups(gs => [...gs, newBhkGroup(subs)])}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-[#484a5a] hover:text-[#484a5a] transition flex items-center justify-center gap-2">
        <span className="material-icons-outlined text-base">add</span>Add Unit Type
      </button>
    </div>
  );
}

// ── Floor-wise configure form ─────────────────────────────────────────────────
function FloorWiseConfig({ subs, totalFloors, setTotalFloors, floorConfigs, setFloorConfigs }) {
  const totalUnits = floorConfigs.reduce((sum, fc) => {
    const floorCount    = Math.max(0, (Number(fc.floorEnd) || 0) - (Number(fc.floorStart) || 0) + 1);
    const unitsPerFloor = fc.unitGroups.reduce((s, ug) => s + (Number(ug.count) || 0), 0);
    return sum + floorCount * unitsPerFloor;
  }, 0);

  const updateFc = (id, field, val) =>
    setFloorConfigs(fcs => fcs.map(fc => fc.id === id ? { ...fc, [field]: val } : fc));
  const removeFc = (id) =>
    setFloorConfigs(fcs => fcs.filter(fc => fc.id !== id));

  const addUg = (fcId) =>
    setFloorConfigs(fcs => fcs.map(fc => fc.id === fcId
      ? { ...fc, unitGroups: [...fc.unitGroups, newUnitGroup(subs)] }
      : fc));
  const removeUg = (fcId, ugId) =>
    setFloorConfigs(fcs => fcs.map(fc => fc.id === fcId
      ? { ...fc, unitGroups: fc.unitGroups.filter(ug => ug.id !== ugId) }
      : fc));
  const updateUg = (fcId, ugId, field, val) =>
    setFloorConfigs(fcs => fcs.map(fc => fc.id === fcId
      ? { ...fc, unitGroups: fc.unitGroups.map(ug => ug.id === ugId ? { ...ug, [field]: val } : ug) }
      : fc));

  return (
    <div className="space-y-4">
      {/* Total floors + summary */}
      <div className="flex items-end gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Total Floors</label>
          <input type="number" min="1" max="200" value={totalFloors}
            onChange={e => setTotalFloors(e.target.value)}
            className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#484a5a]/30 bg-white" />
        </div>
        <div className="flex-1 text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Estimated total</p>
          <p className="text-lg font-bold text-[#484a5a]">{totalUnits} units</p>
        </div>
      </div>

      {/* Floor config cards */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Floor Configurations</p>

        {floorConfigs.map(fc => {
          const floorCount    = Math.max(0, (Number(fc.floorEnd) || 0) - (Number(fc.floorStart) || 0) + 1);
          const unitsPerFloor = fc.unitGroups.reduce((s, ug) => s + (Number(ug.count) || 0), 0);

          return (
            <div key={fc.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
              {/* Floor range header */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="material-icons-outlined text-[#484a5a] text-base">layers</span>
                <span className="text-xs font-semibold text-slate-600">Floors</span>
                <input type="number" min="1" max={totalFloors || 200} value={fc.floorStart}
                  onChange={e => updateFc(fc.id, 'floorStart', e.target.value)}
                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-center focus:outline-none bg-white" />
                <span className="text-xs text-slate-400">to</span>
                <input type="number" min={fc.floorStart || 1} max={totalFloors || 200} value={fc.floorEnd}
                  onChange={e => updateFc(fc.id, 'floorEnd', e.target.value)}
                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-center focus:outline-none bg-white" />
                <span className="ml-auto text-xs text-slate-400 font-semibold">
                  {floorCount} floor{floorCount !== 1 ? 's' : ''} × {unitsPerFloor} unit{unitsPerFloor !== 1 ? 's' : ''} = {floorCount * unitsPerFloor} total
                </span>
                {floorConfigs.length > 1 && (
                  <button type="button" onClick={() => removeFc(fc.id)}
                    className="text-slate-300 hover:text-rose-500 transition">
                    <span className="material-icons-outlined text-base">close</span>
                  </button>
                )}
              </div>

              {/* Unit groups inside this floor range */}
              <div className="space-y-2 pl-3 border-l-2 border-[#484a5a]/20">
                {fc.unitGroups.map(ug => (
                  <div key={ug.id} className="bg-white rounded-xl p-3 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Type</label>
                        <select value={ug.unitType} onChange={e => updateUg(fc.id, ug.id, 'unitType', e.target.value)} className={sinp}>
                          {subs.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Per floor</label>
                        <input type="number" min="1" value={ug.count}
                          onChange={e => updateUg(fc.id, ug.id, 'count', e.target.value)}
                          className={sinp} placeholder="2" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Area (sqft)</label>
                        <input type="number" min="1" value={ug.areaSqft}
                          onChange={e => updateUg(fc.id, ug.id, 'areaSqft', e.target.value)}
                          className={sinp} placeholder="850" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">
                          Price {ug.price ? <span className="text-[#484a5a]">{fmtCompact(ug.price)}</span> : '(₹)'}
                        </label>
                        <input type="number" min="0" value={ug.price}
                          onChange={e => updateUg(fc.id, ug.id, 'price', e.target.value)}
                          className={sinp} placeholder="4500000" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-end">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Facing</label>
                        <FacingSelect value={ug.facing} onChange={v => updateUg(fc.id, ug.id, 'facing', v)} />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Parking</label>
                        <ParkingSelect value={ug.parking} onChange={v => updateUg(fc.id, ug.id, 'parking', v)} />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Furnishing</label>
                          <FurnishSelect value={ug.furnishing || 'unfurnished'} onChange={v => updateUg(fc.id, ug.id, 'furnishing', v)} />
                        </div>
                        {fc.unitGroups.length > 1 && (
                          <button type="button" onClick={() => removeUg(fc.id, ug.id)}
                            className="mb-0.5 text-rose-400 hover:text-rose-600 flex-shrink-0">
                            <span className="material-icons-outlined text-base">delete_outline</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={() => addUg(fc.id)}
                  className="text-xs text-[#484a5a] font-semibold hover:underline flex items-center gap-1 py-1">
                  <span className="material-icons-outlined text-sm">add</span>
                  Add unit type to these floors
                </button>
              </div>
            </div>
          );
        })}

        <button type="button"
          onClick={() => setFloorConfigs(fcs => [...fcs, newFloorConfig(subs, Number(totalFloors) || 1, Number(totalFloors) || 1)])}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-[#484a5a] hover:text-[#484a5a] transition flex items-center justify-center gap-2">
          <span className="material-icons-outlined text-base">add</span>Add Floor Range
        </button>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function UnitSplitModal({ property, onClose, onUpdate }) {
  const subs         = getSubs(property.propertyType);
  const suggested    = getSuggestedMode(property.propertyType);
  const initHasSplit = !!property.unitSplit?.enabled;

  const [hasSplit, setHasSplit] = useState(initHasSplit);
  const [tab, setTab]           = useState(initHasSplit ? 'units' : 'configure');
  const [units, setUnits]       = useState(property.unitSplit?.units || []);
  const [showBulkShare, setShowBulkShare] = useState(false);

  // Configure state
  const [splitMode, setSplitMode]     = useState(property.unitSplit?.splitMode || suggested);
  const [bhkGroups, setBhkGroups]     = useState([newBhkGroup(subs)]);
  const [totalFloors, setTotalFloors] = useState(10);
  const [floorConfigs, setFloorConfigs] = useState([newFloorConfig(subs, 1, 10)]);

  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg]       = useState('');

  // Preview counts
  const bhkTotal = bhkGroups.reduce((s, g) => s + (Number(g.count) || 0), 0);
  const floorTotal = floorConfigs.reduce((sum, fc) => {
    const floorCount    = Math.max(0, (Number(fc.floorEnd) || 0) - (Number(fc.floorStart) || 0) + 1);
    const unitsPerFloor = fc.unitGroups.reduce((s, ug) => s + (Number(ug.count) || 0), 0);
    return sum + floorCount * unitsPerFloor;
  }, 0);
  const previewTotal = splitMode === 'floor_wise' ? floorTotal : bhkTotal;

  async function handleCreateSplit(e) {
    e.preventDefault();
    setConfigSaving(true); setConfigMsg('');
    try {
      const payload = splitMode === 'bhk_wise'
        ? { splitMode: 'bhk_wise', groups: bhkGroups }
        : { splitMode: 'floor_wise', floorConfigs };

      const { data } = await api.post(`/unit-properties/${property._id}/split`, payload);
      setUnits(data.property.unitSplit?.units || []);
      setHasSplit(true);
      onUpdate?.(data.property);
      setTab('units');
    } catch (err) {
      setConfigMsg(err.response?.data?.message || 'Failed to create split.');
    }
    setConfigSaving(false);
  }

  async function handleDeleteSplit() {
    if (!window.confirm('Remove unit split? All unit data will be lost.')) return;
    try {
      await api.delete(`/unit-properties/${property._id}/split`);
      setHasSplit(false);
      setUnits([]);
      setTab('configure');
      onUpdate?.({ ...property, unitSplit: { enabled: false, units: [] } });
      onClose();
    } catch { /* empty */ }
  }

  function handleUnitUpdate(idx, patch) {
    setUnits(u => u.map((x, i) => i === idx ? { ...x, ...patch } : x));
  }

  const available   = units.filter(u => u.status === 'available').length;
  const negotiating = units.filter(u => u.status === 'under_negotiation').length;
  const sold        = units.filter(u => u.status === 'sold').length;

  const byType = units.reduce((acc, u) => {
    const t = u.unitType || 'Unknown';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <span className="material-icons-outlined text-[#484a5a] text-2xl">call_split</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-montserrat font-bold text-slate-800">Unit Split</h2>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold capitalize">
                  {(property.propertyType || 'property').replace('_', ' ')}
                </span>
                {hasSplit && (
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">
                    {units.length} units
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {property.title} · {fmt(property.price)}
                {property.areaSqft ? ` · ${property.areaSqft.toLocaleString()} sqft` : ''}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 flex-shrink-0">
              <span className="material-icons-outlined">close</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b border-slate-100 flex-shrink-0">
            <button onClick={() => setTab('configure')}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition
                ${tab === 'configure' ? 'text-[#484a5a] border-[#484a5a]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
              <span className="material-icons-outlined text-sm">tune</span>Configure
            </button>
            {hasSplit && (
              <button onClick={() => setTab('units')}
                className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition
                  ${tab === 'units' ? 'text-[#484a5a] border-[#484a5a]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                <span className="material-icons-outlined text-sm">grid_view</span>Units ({units.length})
              </button>
            )}
            <div className="flex-1" />
            <button onClick={() => setShowBulkShare(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5d] transition mx-3 my-1.5 flex-shrink-0">
              <span className="material-icons-outlined text-sm">send</span>Bulk Share
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Configure Tab ── */}
            {tab === 'configure' && (
              <form onSubmit={handleCreateSplit} className="p-6 space-y-6">
                {configMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-semibold">{configMsg}</div>
                )}

                {/* ── Mode Picker ── */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Distribution Mode</p>
                  {suggested !== splitMode && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <span className="material-icons-outlined text-sm">lightbulb</span>
                      Suggested: <strong>{suggested === 'floor_wise' ? 'Floor-wise' : 'BHK-wise'}</strong> for {property.propertyType}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {/* BHK-wise */}
                    <button type="button" onClick={() => setSplitMode('bhk_wise')}
                      className={`relative p-4 rounded-2xl border-2 text-left transition
                        ${splitMode === 'bhk_wise'
                          ? 'border-[#484a5a] bg-[#484a5a]/5'
                          : 'border-slate-200 hover:border-slate-300'}`}>
                      {splitMode === 'bhk_wise' && (
                        <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#484a5a] flex items-center justify-center">
                          <span className="material-icons-outlined text-white text-[10px]">check</span>
                        </span>
                      )}
                      {suggested === 'bhk_wise' && (
                        <span className="absolute top-2.5 right-2.5 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                          {splitMode === 'bhk_wise' ? '✓ ' : ''}Suggested
                        </span>
                      )}
                      <span className="material-icons-outlined text-[#484a5a] text-2xl mb-2 block">category</span>
                      <p className="font-montserrat font-bold text-slate-800 text-sm mb-1">BHK-wise</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Group units by type — e.g. 20 × 2BHK, 10 × 3BHK. Best for villas, plots, row houses.
                      </p>
                    </button>

                    {/* Floor-wise */}
                    <button type="button" onClick={() => setSplitMode('floor_wise')}
                      className={`relative p-4 rounded-2xl border-2 text-left transition
                        ${splitMode === 'floor_wise'
                          ? 'border-[#484a5a] bg-[#484a5a]/5'
                          : 'border-slate-200 hover:border-slate-300'}`}>
                      {splitMode === 'floor_wise' && (
                        <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#484a5a] flex items-center justify-center">
                          <span className="material-icons-outlined text-white text-[10px]">check</span>
                        </span>
                      )}
                      {suggested === 'floor_wise' && (
                        <span className="absolute top-2.5 right-2.5 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                          {splitMode === 'floor_wise' ? '✓ ' : ''}Suggested
                        </span>
                      )}
                      <span className="material-icons-outlined text-[#484a5a] text-2xl mb-2 block">layers</span>
                      <p className="font-montserrat font-bold text-slate-800 text-sm mb-1">Floor-wise</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Configure each floor separately — unit 101, 102... 201, 202... Best for towers, buildings.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* ── Mode-specific form ── */}
                {splitMode === 'bhk_wise'
                  ? <BhkWiseConfig subs={subs} groups={bhkGroups} setGroups={setBhkGroups} />
                  : <FloorWiseConfig subs={subs} totalFloors={totalFloors} setTotalFloors={setTotalFloors}
                      floorConfigs={floorConfigs} setFloorConfigs={setFloorConfigs} />
                }

                {hasSplit && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
                    <span className="material-icons-outlined text-sm flex-shrink-0">warning</span>
                    Re-creating will reset all existing unit data (status, notes, prices).
                  </div>
                )}

                <button type="submit" disabled={configSaving || previewTotal === 0}
                  className="w-full py-3 rounded-xl bg-[#484a5a] text-white font-bold text-sm hover:bg-[#2e3044] transition disabled:opacity-60">
                  {configSaving
                    ? 'Generating units…'
                    : previewTotal > 0
                      ? `Generate ${previewTotal} Unit${previewTotal !== 1 ? 's' : ''}`
                      : 'Configure units above'}
                </button>
              </form>
            )}

            {/* ── Units Tab ── */}
            {tab === 'units' && hasSplit && (
              <div className="p-4 space-y-4">
                {/* Status stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Available',   value: available,   cls: 'bg-emerald-50 text-emerald-700' },
                    { label: 'Negotiating', value: negotiating, cls: 'bg-amber-50 text-amber-700' },
                    { label: 'Sold',        value: sold,        cls: 'bg-slate-100 text-slate-500' },
                  ].map(s => (
                    <div key={s.label} className={`${s.cls} rounded-xl p-3 text-center`}>
                      <p className="font-bold text-xl leading-none">{s.value}</p>
                      <p className="text-xs mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Type breakdown */}
                {Object.keys(byType).length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(byType).map(([t, n]) => (
                      <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 font-semibold">
                        {t} <span className="opacity-60">×{n}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Floor groups if floor-wise */}
                {property.unitSplit?.splitMode === 'floor_wise' ? (
                  (() => {
                    const byFloor = units.reduce((acc, u) => {
                      const f = u.floor ?? '—';
                      if (!acc[f]) acc[f] = [];
                      acc[f].push(u);
                      return acc;
                    }, {});
                    return Object.entries(byFloor)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([floor, floorUnits]) => (
                        <div key={floor} className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">
                            {floor !== '—' ? `Floor ${floor}` : 'Units'}
                          </p>
                          {floorUnits.map((unit, i) => {
                            const globalIdx = units.findIndex(u => u === unit || u._id === unit._id);
                            return (
                              <UnitRow key={unit._id || i} unit={unit} idx={globalIdx}
                                propertyId={property._id} subs={subs}
                                onUpdate={patch => handleUnitUpdate(globalIdx, patch)} />
                            );
                          })}
                        </div>
                      ));
                  })()
                ) : (
                  <div className="space-y-2">
                    {units.map((unit, idx) => (
                      <UnitRow key={unit._id || idx} unit={unit} idx={idx}
                        propertyId={property._id} subs={subs}
                        onUpdate={patch => handleUnitUpdate(idx, patch)} />
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100">
                  <button onClick={handleDeleteSplit}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-500 text-sm font-semibold hover:bg-rose-50 transition">
                    <span className="material-icons-outlined text-sm">delete_outline</span>Remove Unit Split
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBulkShare && (
        <BulkShareModal
          properties={[{ ...property, unitSplit: { enabled: hasSplit, units } }]}
          type="unit"
          onClose={() => setShowBulkShare(false)}
        />
      )}
    </>
  );
}

// ── UnitRow — individual unit editor ─────────────────────────────────────────
function UnitRow({ unit, idx, propertyId, subs, onUpdate }) {
  const [status,     setStatus]     = useState(unit.status     || 'available');
  const [unitType,   setUnitType]   = useState(unit.unitType   || subs[0] || '');
  const [notes,      setNotes]      = useState(unit.notes      || '');
  const [facing,     setFacing]     = useState(unit.facing     || '');
  const [parking,    setParking]    = useState(unit.parking    || 'none');
  const [furnishing, setFurnishing] = useState(unit.furnishing || 'unfurnished');
  const [amenities,  setAmenities]  = useState(unit.amenities  || []);
  const [expanded,   setExpanded]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [showBook,   setShowBook]   = useState(false);

  const STATUS_COLOR = {
    available:         'text-emerald-700',
    under_negotiation: 'text-amber-700',
    sold:              'text-slate-500',
  };

  function toggleAmenity(a) {
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch(`/unit-properties/${propertyId}/split/${idx}`, {
        status, unitType,
        notes:      notes.trim() || undefined,
        facing:     facing       || undefined,
        parking, furnishing, amenities,
      });
      onUpdate({ status, unitType, notes: notes.trim(), facing, parking, furnishing, amenities });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* empty */ }
    setSaving(false);
  }

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3 hover:border-slate-200 transition">
      <div className="flex items-center gap-3">
        {/* Unit badge */}
        <div className="w-10 h-10 rounded-xl bg-[#484a5a]/10 flex items-center justify-center flex-shrink-0">
          <span className="font-bold text-[#484a5a] text-[10px] leading-tight text-center px-0.5">
            {unit.unitNumber}
          </span>
        </div>

        {/* Fields */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs min-w-0">
          <div className="flex flex-col justify-center">
            <span className="text-slate-400 leading-none mb-0.5">Price</span>
            <span className="font-semibold text-slate-700">{fmt(unit.price)}</span>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-slate-400 leading-none mb-0.5">Area</span>
            <span className="font-semibold text-slate-700">
              {unit.areaSqft > 0 ? `${unit.areaSqft.toLocaleString()} sqft` : '—'}
            </span>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-slate-400 leading-none mb-0.5">Subcategory</span>
            <select value={unitType} onChange={e => setUnitType(e.target.value)}
              className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 font-semibold focus:outline-none bg-white text-[#484a5a]">
              {subs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-slate-400 leading-none mb-0.5">Status</span>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className={`w-full text-xs px-2 py-1 rounded-lg border border-slate-200 font-semibold focus:outline-none bg-white ${STATUS_COLOR[status] || ''}`}>
              <option value="available">Available</option>
              <option value="under_negotiation">Negotiating</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>

        {/* Save + expand */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button onClick={handleSave} disabled={saving}
            className={`w-14 py-1.5 rounded-xl text-xs font-bold transition
              ${saved ? 'bg-emerald-500 text-white' : 'bg-[#484a5a] text-white hover:bg-[#2e3044]'} disabled:opacity-50`}>
            {saving ? '…' : saved ? '✓ OK' : 'Save'}
          </button>
          <button type="button" onClick={() => setExpanded(v => !v)}
            className="w-14 py-1 rounded-xl text-xs font-semibold border border-slate-200 text-slate-500 hover:bg-slate-50 transition text-center">
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Manage Booking — kept outside the edit-fields row so it's a clear, full-width, easy-to-hit action */}
      {status !== 'booked' && status !== 'sold' && (
        <button type="button" onClick={() => setShowBook(true)}
          className="mt-2 w-full py-2 rounded-xl text-sm font-bold border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition flex items-center justify-center gap-1.5">
          <span className="material-icons-outlined text-base">sell</span>
          Manage Booking
        </button>
      )}

      {showBook && (
        <BookPropertyModal
          propertyId={propertyId}
          propertyModel="UnitProperty"
          unitId={unit._id}
          unitNumber={unit.unitNumber}
          priceHint={unit.price}
          onClose={() => setShowBook(false)}
          onBooked={() => {
            setStatus('booked');
            onUpdate({ status: 'booked', unitType, notes: notes.trim(), facing, parking, furnishing, amenities });
          }}
        />
      )}

      {/* Notes */}
      <div className="mt-2 pl-[52px]">
        <input value={notes} onChange={e => setNotes(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="Notes (optional)…"
          className="w-full px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#484a5a]/20 focus:bg-white"
        />
      </div>

      {/* Expandable Facilities */}
      {expanded && (
        <div className="mt-3 pl-[52px] space-y-3 border-t border-slate-50 pt-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Facilities</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Facing</label>
              <FacingSelect value={facing} onChange={setFacing} />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Parking</label>
              <ParkingSelect value={parking} onChange={setParking} />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Furnishing</label>
              <FurnishSelect value={furnishing} onChange={setFurnishing} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1.5">Amenities</label>
            <div className="flex flex-wrap gap-1.5">
              {AMENITY_LIST.map(a => (
                <button type="button" key={a} onClick={() => toggleAmenity(a)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition
                    ${amenities.includes(a)
                      ? 'bg-[#484a5a] text-white border-[#484a5a]'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-[#484a5a] hover:text-[#484a5a]'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
