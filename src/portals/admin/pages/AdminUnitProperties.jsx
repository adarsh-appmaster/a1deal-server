import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { validateForm } from '../../../validation/validate';
import { unitPropertySchema } from '../../../validation/schemas';
import SharePropertyModal from '../../../components/common/SharePropertyModal';
import BulkShareModal from '../../../components/common/BulkShareModal';
import UnitSplitModal from '../../../components/common/UnitSplitModal';
import BookPropertyModal from '../../../components/common/BookPropertyModal';
import { Pagination } from '../../../components/common/Pagination';
import MediaUploader from '../../../components/common/MediaUploader';
import { useConfirm } from '../../../hooks/useConfirm';

const PROP_TYPES = [
  'all', 'tower', 'building', 'villa', 'commercial',
  'plot', 'rowhouse', 'duplex', 'penthouse', 'township', 'mixed_use',
  'land', 'farmland', 'warehouse', 'other',
];
const TYPE_ICONS = {
  tower:     'domain',
  building:  'business',
  villa:     'cottage',
  commercial:'store',
  plot:      'crop_square',
  rowhouse:  'holiday_village',
  duplex:    'layers',
  penthouse: 'roofing',
  township:  'location_city',
  mixed_use: 'corporate_fare',
  land:      'landscape',
  farmland:  'agriculture',
  warehouse: 'warehouse',
  other:     'category',
};
const LISTING_TYPES = [
  { v: 'new_launch',         l: 'New Launch' },
  { v: 'under_construction', l: 'Under Construction' },
  { v: 'ready_to_handover',  l: 'Ready to Handover' },
  { v: 'resale',             l: 'Resale' },
];
const STATUSES = [
  { v: 'all',               l: 'All' },
  { v: 'available',         l: 'Available' },
  { v: 'under_negotiation', l: 'Under Negotiation' },
  { v: 'sold',              l: 'Sold' },
];
const OWNER_TYPES = ['developer', 'individual', 'company', 'nri', 'government'];
const VISIBLE_OPTS = [
  { key: 'guest',     label: 'Public (Guests)', color: 'bg-green-100 text-green-700' },
  { key: 'buyer',     label: 'Buyers',          color: 'bg-violet-100 text-violet-700' },
  { key: 'broker',    label: 'Brokers',         color: 'bg-rose-100 text-rose-600' },
  { key: 'developer', label: 'Developers',      color: 'bg-sky-100 text-sky-700' },
  { key: 'investor',  label: 'Investors',       color: 'bg-emerald-100 text-emerald-700' },
];
const STATUS_COLORS = {
  available:         'bg-emerald-100 text-emerald-700',
  under_negotiation: 'bg-amber-100 text-amber-700',
  sold:              'bg-slate-100 text-slate-600',
};
const LEAD_STATUS_META = {
  new:          { label: 'New',          dot: 'bg-slate-400',   pill: 'bg-slate-100 text-slate-600' },
  contacted:    { label: 'Contacted',    dot: 'bg-blue-400',    pill: 'bg-blue-50 text-blue-700' },
  site_visit:   { label: 'Site Visit',   dot: 'bg-purple-400',  pill: 'bg-purple-50 text-purple-700' },
  negotiating:  { label: 'Negotiating',  dot: 'bg-amber-400',   pill: 'bg-amber-50 text-amber-700' },
  closed_won:   { label: 'Won',          dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700' },
  closed_lost:  { label: 'Lost',         dot: 'bg-rose-400',    pill: 'bg-rose-50 text-rose-700' },
};
const LIMIT = 10;

const EMPTY_FORM = {
  title: '', description: '', city: '', area: '', pincode: '', address: '',
  propertyType: 'tower',
  bedrooms: '', bathrooms: '', areaSqft: '', landAcres: '',
  totalUnits: '', totalFloors: '', reraNumber: '',
  price: '', listingType: 'new_launch',
  status: 'available', ownerType: 'developer',
  sellerName: '', sellerPhone: '', sellerEmail: '',
  visibleTo: ['buyer', 'broker', 'developer', 'investor'], isFeatured: false,
  amenities: [],
  commissionBrokerPct: '',
  commissionMasterBrokerPct: '',
};

const TYPE_AMENITIES = {
  tower:     ['Gym', 'Swimming Pool', 'Club House', 'Garden/Park', 'Power Backup', '24×7 Water', 'Lift/Elevator', 'Security', 'CCTV', 'Intercom', 'Play Area', 'Jogging Track', 'Amphitheatre', 'Indoor Sports', 'Spa & Sauna', 'Yoga Deck', 'Squash Court', 'Badminton Court', 'Basketball Court', 'Banquet Hall', 'Co-working Space', 'EV Charging', 'Visitor Parking', 'Rooftop Terrace', 'Rainwater Harvesting', 'Solar Panels', 'Waste Management'],
  building:  ['Power Backup', '24×7 Water', 'Lift/Elevator', 'Security', 'CCTV', 'Intercom', 'Parking', 'Garden/Park', 'Gym', 'Club House', 'Play Area', 'Visitor Parking', 'EV Charging', 'Rainwater Harvesting', 'Solar Panels'],
  villa:     ['Private Garden', 'Swimming Pool', 'Private Parking', 'Power Backup', '24×7 Water', 'Security', 'CCTV', 'Intercom', 'Gym', 'Club House', 'Gated Community', 'Landscaped Grounds', 'Servant Quarters', 'Smart Home', 'Solar Panels', 'EV Charging', 'Tennis Court', 'Outdoor Terrace'],
  commercial:['Power Backup', '24×7 Water', 'Lift/Elevator', 'Security', 'CCTV', 'Intercom', 'Parking', 'Cafeteria', 'Conference Room', 'Fire Safety', 'High-Speed Internet', 'AC Ducting', 'Visitor Parking', 'EV Charging', 'Food Court', 'ATM', 'Reception Lobby'],
  plot:      ['Electricity', 'Water Connection', 'Sewerage', 'Road Access', 'Boundary Wall', 'Security', 'Gated Community', 'Street Lights', 'Drainage', 'CCTV'],
  rowhouse:  ['Private Garden', 'Parking', 'Power Backup', '24×7 Water', 'Security', 'CCTV', 'Gated Community', 'Play Area', 'Club House', 'Visitor Parking', 'EV Charging', 'Intercom'],
  duplex:    ['Private Terrace', 'Parking', 'Power Backup', '24×7 Water', 'Security', 'CCTV', 'Intercom', 'Gated Community', 'Gym', 'Swimming Pool', 'Club House', 'Garden/Park', 'EV Charging'],
  penthouse: ['Private Terrace', 'Private Pool', 'Gym', 'Club House', 'Power Backup', '24×7 Water', 'Lift/Elevator', 'Security', 'CCTV', 'Intercom', 'Concierge', 'Smart Home', 'EV Charging', 'Jacuzzi', 'Home Theatre', 'Modular Kitchen', 'Dedicated Parking'],
  township:  ['Gym', 'Swimming Pool', 'Club House', 'Garden/Park', 'Power Backup', '24×7 Water', 'Lift/Elevator', 'Security', 'CCTV', 'Play Area', 'Jogging Track', 'School', 'Hospital', 'Supermarket', 'Restaurant', 'Amphitheatre', 'Badminton Court', 'Tennis Court', 'Basketball Court', 'Banquet Hall', 'EV Charging', 'Solar Panels', 'Rainwater Harvesting', 'Waste Management'],
  mixed_use: ['Power Backup', '24×7 Water', 'Lift/Elevator', 'Security', 'CCTV', 'Intercom', 'Parking', 'Gym', 'Club House', 'Cafeteria', 'Conference Room', 'Visitor Parking', 'EV Charging', 'Food Court', 'Retail Shops', 'High-Speed Internet'],
  land:      ['Electricity', 'Water Connection', 'Road Access', 'Boundary Wall', 'Security', 'Drainage', 'Gated'],
  farmland:  ['Water Connection', 'Electricity', 'Road Access', 'Bore Well', 'Irrigation', 'Boundary Wall', 'Storage Shed', 'Tube Well', 'Windmill'],
  warehouse: ['Power Backup', '24×7 Water', 'Security', 'CCTV', 'Parking', 'Loading Bay', 'Goods Lift', 'Fire Safety', 'Fire Sprinklers', 'AC / Cooling', 'High-Speed Internet', 'Generator Room', 'EV Charging', 'Weighbridge'],
  other:     ['Power Backup', '24×7 Water', 'Security', 'CCTV', 'Parking', 'Lift/Elevator', 'Intercom', 'EV Charging'],
};

const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30';

function fmt(n) {
  if (!n) return '—';
  const l = Number(n);
  return l >= 10000000 ? `₹${(l / 10000000).toFixed(2)} Cr` : `₹${(l / 100000).toFixed(1)} L`;
}
function timeAgo(d) {
  if (!d) return '';
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

const TYPE_FIELDS = {
  tower:     ['bedrooms', 'bathrooms', 'areaSqft', 'totalUnits', 'totalFloors', 'reraNumber'],
  building:  ['areaSqft', 'totalUnits', 'totalFloors', 'reraNumber'],
  villa:     ['bedrooms', 'bathrooms', 'areaSqft', 'totalFloors'],
  commercial:['areaSqft', 'totalUnits', 'totalFloors'],
  plot:      ['areaSqft', 'totalUnits'],
  rowhouse:  ['bedrooms', 'bathrooms', 'areaSqft', 'totalUnits', 'reraNumber'],
  duplex:    ['bedrooms', 'bathrooms', 'areaSqft', 'totalUnits', 'totalFloors', 'reraNumber'],
  penthouse: ['bedrooms', 'bathrooms', 'areaSqft', 'totalFloors'],
  township:  ['areaSqft', 'totalUnits', 'totalFloors', 'reraNumber'],
  mixed_use: ['areaSqft', 'totalUnits', 'totalFloors', 'reraNumber'],
  land:      ['areaSqft', 'landAcres'],
  farmland:  ['areaSqft', 'landAcres'],
  warehouse: ['areaSqft', 'totalUnits'],
  other:     ['areaSqft'],
};
function showField(type, field) {
  return (TYPE_FIELDS[type] || []).includes(field);
}

function SectionLabel({ icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="material-icons-outlined text-base text-slate-400">{icon}</span>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

const WA_ICON = (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current flex-shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function AdminUnitProperties() {
  const [properties, setProperties]   = useState([]);
  const [stats, setStats]             = useState({ total: 0, available: 0, underNegotiation: 0, sold: 0, featured: 0 });
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [pages, setPages]             = useState(1);
  const [total, setTotal]             = useState(0);

  const [search, setSearch]           = useState('');
  const [inputVal, setInputVal]       = useState('');
  const [typeFilter, setTypeFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showForm, setShowForm]       = useState(false);
  const [editId, setEditId]           = useState(null);
  const [form, setForm]               = useState({ ...EMPTY_FORM });
  const [formImages, setFormImages]   = useState([]);
  const [formVideo, setFormVideo]     = useState('');
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState('');
  const { confirm, dialog } = useConfirm();
  const [loadError, setLoadError]     = useState('');

  const [shareProperty, setShareProperty]   = useState(null);
  const [selectedIds, setSelectedIds]       = useState(new Set());
  const [showBulkShare, setShowBulkShare]   = useState(false);
  const [splitProperty, setSplitProperty]   = useState(null);
  const [unitPickProperty, setUnitPickProperty] = useState(null); // property showing the unit-picker step
  const [bookTarget, setBookTarget]         = useState(null);     // { property, unit? } ready to book

  // Lead quick-add
  const [leadModal, setLeadModal]     = useState(null);
  const [leadForm, setLeadForm]       = useState({ name: '', phone: '', email: '', source: 'manual', budget: '' });
  const [leadSaving, setLeadSaving]   = useState(false);
  const [leadMsg, setLeadMsg]         = useState('');
  const [leadCounts, setLeadCounts]   = useState({});

  // ── Per-property CRM Drawer ─────────────────────────────────────────────────
  const [crmProp, setCrmProp]       = useState(null);   // property being managed
  const [crmTab, setCrmTab]         = useState('leads');
  const [crmLeads, setCrmLeads]     = useState([]);
  const [crmLoading, setCrmLoading] = useState(false);
  const [activeLead, setActiveLead] = useState(null);   // selected lead in drawer
  const [noteText, setNoteText]     = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [updatingLead, setUpdatingLead] = useState(false);
  const [teamMembers, setTeamMembers]   = useState([]);
  const [masterBrokers, setMasterBrokers] = useState([]);
  const [brokers, setBrokers]             = useState([]);
  // quick-add lead form inside CRM drawer
  const [crmAddLead, setCrmAddLead] = useState(false);
  const [crmLeadForm, setCrmLeadForm] = useState({ name: '', phone: '', email: '', source: 'manual', budget: '', assignedTo: '' });
  const [crmLeadSaving, setCrmLeadSaving] = useState(false);

  function handleSplitUpdate(updated) {
    setProperties(prev => prev.map(p => p._id === updated._id ? { ...p, unitSplit: updated.unitSplit } : p));
    if (splitProperty?._id === updated._id) setSplitProperty(prev => ({ ...prev, unitSplit: updated.unitSplit }));
  }

  const fetchProps = useCallback(async (p = 1) => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (search)                params.set('search', search);
      if (typeFilter !== 'all')  params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const { data } = await api.get(`/unit-properties?${params}`);
      setProperties(data.properties || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch (err) {
      console.error('unit-properties fetch error:', err?.response?.status, err?.response?.data || err.message);
      setLoadError(err.response?.data?.message || `Failed to load properties (${err.response?.status || 'network error'}).`);
    }
    setLoading(false);
  }, [search, typeFilter, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/unit-properties/stats');
      setStats(data);
    } catch { /* empty */ }
  }, []);

  const fetchLeadCounts = useCallback(async (props) => {
    if (!props.length) return;
    try {
      const counts = {};
      await Promise.all(props.map(async (p) => {
        const { data } = await api.get(`/leads/by-property/${p._id}`);
        counts[p._id] = data.count || 0;
      }));
      setLeadCounts(prev => ({ ...prev, ...counts }));
    } catch { /* empty */ }
  }, []);

  const fetchCrmLeads = useCallback(async (propId) => {
    setCrmLoading(true);
    try {
      const { data } = await api.get(`/leads/by-property/${propId}`);
      setCrmLeads(data.leads || []);
    } catch { /* empty */ }
    setCrmLoading(false);
  }, []);

  // /users returns a raw array when no `page` param is given, or { users, total, ... } when paginated.
  const asUserArray = (data) => Array.isArray(data) ? data : (data.users || []);

  const fetchTeamMembers = useCallback(async () => {
    if (teamMembers.length || brokers.length || masterBrokers.length) return;
    try {
      const [teamRes, brokerRes] = await Promise.all([
        api.get('/users?role=team&status=active'),
        api.get('/users?role=broker&status=active'),
      ]);
      setTeamMembers(asUserArray(teamRes.data));
      const allBrokers = asUserArray(brokerRes.data);
      setMasterBrokers(allBrokers.filter(b => b.brokerTier === 'master'));
      setBrokers(allBrokers.filter(b => b.brokerTier !== 'master'));
    } catch { /* empty */ }
  }, [teamMembers.length, brokers.length, masterBrokers.length]);

  useEffect(() => { fetchProps(1); fetchStats(); }, [fetchProps, fetchStats]);
  useEffect(() => { if (properties.length) fetchLeadCounts(properties); }, [properties, fetchLeadCounts]);

  function openCrm(prop) {
    setCrmProp(prop);
    setCrmTab('leads');
    setActiveLead(null);
    setNoteText('');
    setFollowUpDate('');
    setCrmAddLead(false);
    fetchCrmLeads(prop._id);
    fetchTeamMembers();
  }
  function closeCrm() { setCrmProp(null); setCrmLeads([]); setActiveLead(null); }

  async function updateLeadField(leadId, patch) {
    setUpdatingLead(true);
    try {
      const { data } = await api.patch(`/leads/${leadId}`, patch);
      setCrmLeads(l => l.map(x => x._id === leadId ? data.lead || { ...x, ...patch } : x));
      setActiveLead(l => l?._id === leadId ? (data.lead || { ...l, ...patch }) : l);
    } catch { /* empty */ }
    setUpdatingLead(false);
  }

  async function addNote(leadId) {
    if (!noteText.trim()) return;
    setUpdatingLead(true);
    try {
      const { data } = await api.patch(`/leads/${leadId}`, { note: noteText.trim() });
      setCrmLeads(l => l.map(x => x._id === leadId ? data.lead || x : x));
      setActiveLead(data.lead || activeLead);
      setNoteText('');
    } catch { /* empty */ }
    setUpdatingLead(false);
  }

  async function handleCrmLeadSubmit(e) {
    e.preventDefault(); setCrmLeadSaving(true);
    try {
      const { data } = await api.post('/leads', {
        ...crmLeadForm,
        budget: crmLeadForm.budget !== '' ? Number(crmLeadForm.budget) : undefined,
        assignedTo: crmLeadForm.assignedTo || undefined,
        propertyId:    crmProp._id,
        propertyModel: 'UnitProperty',
        propertyTitle: crmProp.title,
        propertyType:  'unit',
      });
      setCrmLeads(l => [data.lead || {}, ...l]);
      setLeadCounts(prev => ({ ...prev, [crmProp._id]: (prev[crmProp._id] || 0) + 1 }));
      setCrmLeadForm({ name: '', phone: '', email: '', source: 'manual', budget: '', assignedTo: '' });
      setCrmAddLead(false);
    } catch { /* empty */ }
    setCrmLeadSaving(false);
  }

  function handleSearch(e) { e.preventDefault(); setSearch(inputVal.trim()); }

  function openAdd() {
    setForm({ ...EMPTY_FORM }); setFormImages([]); setFormVideo('');
    setEditId(null); setMsg(''); setShowForm(true);
  }
  function openEdit(p) {
    setForm({
      title: p.title || '', description: p.description || '',
      city: p.city || '', area: p.area || '', pincode: p.pincode || '', address: p.address || '',
      propertyType: p.propertyType || 'tower',
      bedrooms: p.bedrooms ?? '', bathrooms: p.bathrooms ?? '',
      areaSqft: p.areaSqft ?? '', landAcres: p.landAcres ?? '',
      totalUnits: p.totalUnits ?? '', totalFloors: p.totalFloors ?? '',
      reraNumber: p.reraNumber || '',
      price: p.price || '', listingType: p.listingType || 'new_launch',
      status: p.status || 'available', ownerType: p.ownerType || 'developer',
      sellerName: p.sellerName || '', sellerPhone: p.sellerPhone || '', sellerEmail: p.sellerEmail || '',
      visibleTo: p.visibleTo || ['buyer', 'broker', 'developer', 'investor'],
      isFeatured: p.isFeatured || false,
      amenities: p.amenities || [],
      commissionBrokerPct:       p.commission?.brokerPct       ?? '',
      commissionMasterBrokerPct: p.commission?.masterBrokerPct ?? '',
    });
    setFormImages(p.images || []);
    setFormVideo(p.video || '');
    setEditId(p._id); setMsg(''); setShowForm(true);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }
  function toggleVisible(key) {
    setForm(f => ({
      ...f,
      visibleTo: f.visibleTo.includes(key) ? f.visibleTo.filter(k => k !== key) : [...f.visibleTo, key],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { errors } = validateForm(unitPropertySchema, form);
    if (errors) { setMsg(Object.values(errors)[0]); return; }
    setSaving(true); setMsg('');
    try {
      const payload = {
        ...form,
        bedrooms:    form.bedrooms    !== '' ? Number(form.bedrooms)    : undefined,
        bathrooms:   form.bathrooms   !== '' ? Number(form.bathrooms)   : undefined,
        areaSqft:    form.areaSqft    !== '' ? Number(form.areaSqft)    : undefined,
        landAcres:   form.landAcres   !== '' ? Number(form.landAcres)   : undefined,
        totalUnits:  form.totalUnits  !== '' ? Number(form.totalUnits)  : undefined,
        totalFloors: form.totalFloors !== '' ? Number(form.totalFloors) : undefined,
        price: Number(form.price),
        images: formImages, video: formVideo,
        commission: {
          brokerPct:       form.commissionBrokerPct       !== '' ? Number(form.commissionBrokerPct)       : null,
          masterBrokerPct: form.commissionMasterBrokerPct !== '' ? Number(form.commissionMasterBrokerPct) : null,
        },
      };
      if (editId) {
        await api.patch(`/unit-properties/${editId}`, payload);
        setMsg('Property updated.');
      } else {
        await api.post('/unit-properties', payload);
        setMsg('Property added.');
      }
      setShowForm(false);
      fetchProps(editId ? page : 1);
      fetchStats();
    } catch (err) { setMsg(err.response?.data?.message || 'Failed to save.'); }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!(await confirm('Deactivate this property?', { danger: true, confirmLabel: 'Deactivate' }))) return;
    try { await api.delete(`/unit-properties/${id}`); fetchProps(page); fetchStats(); } catch { /* empty */ }
  }

  async function toggleGuestVisibility(prop) {
    const has = prop.visibleTo?.includes('guest');
    const visibleTo = has
      ? prop.visibleTo.filter(v => v !== 'guest')
      : ['guest', ...(prop.visibleTo || [])];
    try {
      await api.patch(`/unit-properties/${prop._id}`, { visibleTo });
      setProperties(prev => prev.map(p => p._id === prop._id ? { ...p, visibleTo } : p));
    } catch { /* empty */ }
  }

  async function handleLeadSubmit(e) {
    e.preventDefault(); setLeadSaving(true); setLeadMsg('');
    try {
      await api.post('/leads', {
        ...leadForm,
        budget: leadForm.budget !== '' ? Number(leadForm.budget) : undefined,
        propertyId:    leadModal._id,
        propertyModel: 'UnitProperty',
        propertyTitle: leadModal.title,
        propertyType:  'unit',
      });
      setLeadMsg('Lead added!');
      setLeadCounts(prev => ({ ...prev, [leadModal._id]: (prev[leadModal._id] || 0) + 1 }));
      setTimeout(() => { setLeadModal(null); setLeadForm({ name: '', phone: '', email: '', source: 'manual', budget: '' }); setLeadMsg(''); }, 1200);
    } catch (err) { setLeadMsg(err.response?.data?.message || 'Failed.'); }
    setLeadSaving(false);
  }

  // Follow-ups: leads with future followUpDate, sorted ascending
  const upcomingFollowUps = [...crmLeads]
    .filter(l => l.followUpDate && new Date(l.followUpDate) >= new Date())
    .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
  const overdueFollowUps = [...crmLeads]
    .filter(l => l.followUpDate && new Date(l.followUpDate) < new Date())
    .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

  return (
    <div className="space-y-6">
      {dialog}
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-montserrat font-bold text-xl text-slate-800">Unit Properties</h1>
          <p className="text-sm text-slate-500 mt-0.5">Towers · Land · Buildings · Commercial developments</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <button onClick={() => setShowBulkShare(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white text-sm font-semibold rounded-xl hover:bg-[#1ebe5d] transition">
              <span className="material-icons-outlined text-base">send</span>
              Bulk Share ({selectedIds.size})
            </button>
          )}
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-tertiary text-white text-sm font-semibold rounded-xl hover:bg-[#2e3044] transition">
            <span className="material-icons-outlined text-base">add</span> Add Property
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total',            value: stats.total,            color: 'text-slate-700' },
          { label: 'Available',        value: stats.available,        color: 'text-emerald-600' },
          { label: 'Under Negotiation',value: stats.underNegotiation, color: 'text-amber-600' },
          { label: 'Sold',             value: stats.sold,             color: 'text-slate-500' },
          { label: 'Featured',         value: stats.featured,         color: 'text-tertiary' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
            <p className={`font-montserrat font-bold text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-icons-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm">search</span>
            <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
              placeholder="Search by title, city, area, owner…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-tertiary/30 bg-white" />
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-tertiary text-white text-sm font-semibold hover:bg-[#2e3044] transition">
            Search
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setInputVal(''); }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
              <span className="material-icons-outlined text-sm">close</span>
            </button>
          )}
        </form>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 font-semibold mr-1">Type:</span>
          {PROP_TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition capitalize
                ${typeFilter === t ? 'bg-tertiary text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
              {t !== 'all' && <span className="material-icons-outlined text-xs">{TYPE_ICONS[t]}</span>}
              {t === 'all' ? 'All Types' : t.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 font-semibold">Status:</span>
          {STATUSES.map(t => (
            <button key={t.v} onClick={() => setStatusFilter(t.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                ${statusFilter === t.v ? 'bg-tertiary text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* Load error banner */}
      {loadError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
          <span className="material-icons-outlined text-base flex-shrink-0">error_outline</span>
          <span className="flex-1">{loadError}</span>
          <button onClick={() => fetchProps(page)} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Results meta */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{total} propert{total !== 1 ? 'ies' : 'y'}{search ? ` for "${search}"` : ''}</span>
        <div className="flex items-center gap-3">
          {properties.length > 0 && (
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input type="checkbox"
                checked={properties.length > 0 && properties.every(p => selectedIds.has(p._id))}
                onChange={e => {
                  if (e.target.checked) setSelectedIds(prev => new Set([...prev, ...properties.map(p => p._id)]));
                  else setSelectedIds(prev => { const s = new Set(prev); properties.forEach(p => s.delete(p._id)); return s; });
                }}
                className="accent-tertiary" />
              <span>Select page</span>
            </label>
          )}
          {selectedIds.size > 0 && (
            <button onClick={() => setSelectedIds(new Set())} className="text-rose-500 hover:underline">
              Clear ({selectedIds.size})
            </button>
          )}
          <span>Page {page} of {pages}</span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-icons-outlined text-3xl animate-spin text-tertiary">progress_activity</span>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <span className="material-icons-outlined text-5xl text-slate-200">domain</span>
          <p className="text-slate-400 mt-3">No properties found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map(p => (
            <div key={p._id}
              className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-shadow
                ${selectedIds.has(p._id) ? 'border-tertiary ring-2 ring-tertiary/20' : 'border-slate-100'}`}>

              {/* Cover image */}
              {p.images?.[0] ? (
                <div className="relative h-36 bg-slate-100">
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                  <input type="checkbox" checked={selectedIds.has(p._id)}
                    onChange={e => setSelectedIds(prev => { const s = new Set(prev); e.target.checked ? s.add(p._id) : s.delete(p._id); return s; })}
                    className="absolute top-2 left-2 w-4 h-4 accent-tertiary cursor-pointer" />
                  <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                    {p.images.length} photo{p.images.length !== 1 ? 's' : ''}
                  </span>
                </div>
              ) : (
                <div className="h-16 bg-gradient-to-br from-slate-100 to-slate-50 relative flex items-center justify-center">
                  <span className="material-icons-outlined text-slate-300 text-3xl">{TYPE_ICONS[p.propertyType] || 'domain'}</span>
                  <input type="checkbox" checked={selectedIds.has(p._id)}
                    onChange={e => setSelectedIds(prev => { const s = new Set(prev); e.target.checked ? s.add(p._id) : s.delete(p._id); return s; })}
                    className="absolute top-2 left-2 w-4 h-4 accent-tertiary cursor-pointer" />
                </div>
              )}

              <div className="px-4 pt-3 pb-2">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex gap-1.5 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-600'}`}>
                      {(p.status || '').replace('_', ' ')}
                    </span>
                    {p.isFeatured && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Featured</span>
                    )}
                    {p.unitSplit?.enabled && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                        {p.unitSplit.units?.length || 0} units
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-0.5 text-xs text-slate-400 capitalize flex-shrink-0">
                    <span className="material-icons-outlined text-xs">{TYPE_ICONS[p.propertyType] || 'domain'}</span>
                    {p.propertyType}
                  </span>
                </div>
                <p className="font-montserrat font-bold text-slate-800 leading-tight line-clamp-1">{p.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <span className="material-icons-outlined text-xs">location_on</span>
                  {[p.area, p.city, p.pincode].filter(Boolean).join(', ')}
                </p>
              </div>

              <div className="px-4 py-2 border-y border-slate-50 grid grid-cols-2 gap-2">
                <div><p className="text-xs text-slate-400">Price</p><p className="font-bold text-slate-800 text-sm">{fmt(p.price)}</p></div>
                <div><p className="text-xs text-slate-400">Size</p>
                  <p className="font-semibold text-slate-700 text-sm">
                    {p.areaSqft ? `${p.areaSqft.toLocaleString()} sqft` : p.landAcres ? `${p.landAcres} acres` : '—'}
                  </p>
                </div>
                {p.totalUnits > 0 && <div><p className="text-xs text-slate-400">Units</p><p className="text-xs text-slate-600">{p.totalUnits}</p></div>}
                {p.totalFloors > 0 && <div><p className="text-xs text-slate-400">Floors</p><p className="text-xs text-slate-600">{p.totalFloors}</p></div>}
                <div><p className="text-xs text-slate-400">Listing</p><p className="text-xs text-slate-600 capitalize">{(p.listingType || '').replace(/_/g, ' ')}</p></div>
                <div><p className="text-xs text-slate-400">Owner</p><p className="text-xs text-slate-600 capitalize">{p.ownerType || '—'}</p></div>
              </div>

              <div className="px-4 py-2 space-y-0.5">
                {p.sellerName && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="material-icons-outlined text-xs">person</span>
                    <span className="font-medium">{p.sellerName}</span>
                    {p.sellerPhone ? ` · ${p.sellerPhone}` : ''}
                  </p>
                )}
                {p.addedBy?.name && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="material-icons-outlined text-xs">manage_accounts</span>
                    Managed by: <span className="font-medium text-slate-500">{p.addedBy.name}</span>
                  </p>
                )}
              </div>

              <div className="px-4 py-1.5 flex flex-wrap items-center gap-1">
                {/* Guest / public visibility quick-toggle */}
                <button
                  onClick={() => toggleGuestVisibility(p)}
                  title={p.visibleTo?.includes('guest') ? 'Remove from public homepage' : 'Show on public homepage'}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition mr-1 ${
                    p.visibleTo?.includes('guest')
                      ? 'bg-green-100 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                  }`}>
                  <span className="material-icons-outlined text-[10px]">{p.visibleTo?.includes('guest') ? 'public' : 'public_off'}</span>
                  {p.visibleTo?.includes('guest') ? 'Public' : 'Private'}
                </button>
                {(p.visibleTo || []).filter(r => r !== 'guest').map(role => {
                  const opt = VISIBLE_OPTS.find(o => o.key === role);
                  return (
                    <span key={role} className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${opt?.color || 'bg-slate-100 text-slate-600'}`}>
                      {role}
                    </span>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 pt-2 flex gap-2">
                <button onClick={() => setShareProperty(p)}
                  className="px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1ebe5d] transition flex items-center gap-1">
                  {WA_ICON}
                </button>
                {/* CRM drawer button */}
                <button onClick={() => openCrm(p)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-tertiary/10 text-tertiary text-xs font-bold hover:bg-tertiary/20 transition">
                  <span className="material-icons-outlined text-sm">person_search</span>
                  CRM
                  {leadCounts[p._id] > 0 && (
                    <span className="bg-tertiary text-white rounded-full px-1.5 text-[10px] ml-0.5">{leadCounts[p._id]}</span>
                  )}
                </button>
                <button onClick={() => setSplitProperty(p)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-semibold transition
                    ${p.unitSplit?.enabled
                      ? 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <span className="material-icons-outlined text-sm">call_split</span>
                  Split
                </button>
                <button onClick={() => openEdit(p)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition">
                  <span className="material-icons-outlined text-sm">edit</span> Edit
                </button>
                <button onClick={() => handleDelete(p._id)}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-500 text-xs font-semibold hover:bg-rose-50 transition">
                  <span className="material-icons-outlined text-sm">delete_outline</span>
                </button>
              </div>

              {p.status !== 'sold' && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => {
                      const openUnits = (p.unitSplit?.units || []).filter(u => u.status !== 'booked' && u.status !== 'sold');
                      if (p.unitSplit?.enabled && openUnits.length > 0) setUnitPickProperty(p);
                      else setBookTarget({ property: p, unit: null });
                    }}
                    className="w-full py-2 rounded-xl text-sm font-bold border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition flex items-center justify-center gap-1.5">
                    <span className="material-icons-outlined text-base">sell</span>
                    Manage Booking
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination currentPage={page} totalPages={pages} totalItems={total} itemsPerPage={LIMIT} onPageChange={p => fetchProps(p)} />

      {shareProperty && <SharePropertyModal property={shareProperty} type="unit" onClose={() => setShareProperty(null)} />}
      {showBulkShare && selectedIds.size > 0 && (
        <BulkShareModal properties={properties.filter(p => selectedIds.has(p._id))} type="unit" onClose={() => setShowBulkShare(false)} />
      )}
      {splitProperty && (
        <UnitSplitModal
          property={splitProperty}
          onClose={() => setSplitProperty(null)}
          onUpdate={handleSplitUpdate}
        />
      )}

      {/* Unit picker — shown before booking when the property has multiple sellable units */}
      {unitPickProperty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setUnitPickProperty(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="font-montserrat font-bold text-base text-slate-800">Select Unit to Book</h2>
              <button onClick={() => setUnitPickProperty(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
                <span className="material-icons-outlined text-lg">close</span>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-1.5">
              {(unitPickProperty.unitSplit?.units || [])
                .filter(u => u.status !== 'booked' && u.status !== 'sold')
                .map(u => (
                  <button key={u._id} type="button"
                    onClick={() => { setBookTarget({ property: unitPickProperty, unit: u }); setUnitPickProperty(null); }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-left transition">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700">Unit {u.unitNumber}</p>
                      <p className="text-xs text-slate-400">{u.unitType}{u.floor != null ? ` · Floor ${u.floor}` : ''}</p>
                    </div>
                    <span className="text-xs font-bold text-primary flex-shrink-0">{fmt(u.price)}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {bookTarget && (
        <BookPropertyModal
          propertyId={bookTarget.property._id}
          propertyModel="UnitProperty"
          unitId={bookTarget.unit?._id || null}
          unitNumber={bookTarget.unit?.unitNumber || ''}
          priceHint={bookTarget.unit?.price ?? bookTarget.property.price}
          onClose={() => setBookTarget(null)}
          onBooked={() => { setBookTarget(null); fetchProps(page); }}
        />
      )}

      {/* Quick Lead Modal (from card + icon) */}
      {leadModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setLeadModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div>
              <h3 className="font-montserrat font-bold text-slate-800">Add Lead</h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{leadModal.title}</p>
            </div>
            {leadMsg && (
              <div className={`p-2 rounded-xl text-xs font-semibold text-center ${leadMsg.includes('!') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{leadMsg}</div>
            )}
            <form onSubmit={handleLeadSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Name *</label>
                <input required value={leadForm.name} onChange={e => setLeadForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Rajesh Sharma" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Phone *</label>
                <input required value={leadForm.phone} onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="9876543210" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Email</label>
                <input type="email" value={leadForm.email} onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="rajesh@example.com" className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Source</label>
                  <select value={leadForm.source} onChange={e => setLeadForm(f => ({ ...f, source: e.target.value }))} className={inp}>
                    {['manual', 'whatsapp', 'email', 'website', 'referral', 'walk_in'].map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Budget (₹)</label>
                  <input type="number" value={leadForm.budget} onChange={e => setLeadForm(f => ({ ...f, budget: e.target.value }))}
                    placeholder="5000000" className={inp} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={leadSaving}
                  className="flex-1 py-2.5 rounded-xl bg-tertiary text-white font-bold text-sm hover:bg-[#2e3044] transition disabled:opacity-60">
                  {leadSaving ? 'Saving…' : 'Save Lead'}
                </button>
                <button type="button" onClick={() => setLeadModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Per-property CRM Drawer ─────────────────────────────────────── */}
      {crmProp && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/40" onClick={closeCrm} />
          {/* Drawer */}
          <div className="w-full max-w-4xl bg-white flex flex-col shadow-2xl">

            {/* Drawer header */}
            <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0 bg-gradient-to-r from-tertiary to-[#2e3044] text-white">
              {crmProp.images?.[0] ? (
                <img src={crmProp.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border-2 border-white/20" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-outlined text-xl">{TYPE_ICONS[crmProp.propertyType] || 'domain'}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-montserrat font-bold text-base leading-tight line-clamp-1">{crmProp.title}</h2>
                <p className="text-xs text-white/70 mt-0.5">{[crmProp.area, crmProp.city].filter(Boolean).join(', ')} · {fmt(crmProp.price)}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold capitalize">
                    {(crmProp.status || '').replace('_', ' ')}
                  </span>
                  <span className="text-xs text-white/60">{leadCounts[crmProp._id] || 0} leads</span>
                </div>
              </div>
              <button onClick={closeCrm} aria-label="Close" className="text-white/60 hover:text-white mt-0.5 flex-shrink-0">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 flex-shrink-0">
              {[
                { v: 'leads',    icon: 'group',        l: `Leads (${crmLeads.length})` },
                { v: 'followups',icon: 'event_note',   l: `Follow-ups (${upcomingFollowUps.length + overdueFollowUps.length})` },
                { v: 'overview', icon: 'info_outline',  l: 'Property Info' },
              ].map(t => (
                <button key={t.v} onClick={() => setCrmTab(t.v)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition
                    ${crmTab === t.v ? 'text-tertiary border-tertiary' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                  <span className="material-icons-outlined text-sm">{t.icon}</span>
                  {t.l}
                </button>
              ))}
              <div className="flex-1" />
              {crmTab === 'leads' && (
                <button onClick={() => setCrmAddLead(v => !v)}
                  className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-tertiary hover:bg-slate-50 transition">
                  <span className="material-icons-outlined text-sm">person_add</span>
                  Add Lead
                </button>
              )}
            </div>

            <div className="flex-1 overflow-hidden flex">

              {/* ── Leads Tab ──────────────────────────────────────────── */}
              {crmTab === 'leads' && (
                <>
                  {/* Lead list */}
                  <div className={`flex flex-col border-r border-slate-100 overflow-y-auto ${activeLead ? 'w-72 flex-shrink-0' : 'flex-1'}`}>

                    {/* Add lead form */}
                    {crmAddLead && (
                      <form onSubmit={handleCrmLeadSubmit} className="p-4 border-b border-slate-100 bg-slate-50 space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">New Lead</p>
                        <input required value={crmLeadForm.name} onChange={e => setCrmLeadForm(f => ({...f, name: e.target.value}))}
                          placeholder="Name *" className={inp} />
                        <input required value={crmLeadForm.phone} onChange={e => setCrmLeadForm(f => ({...f, phone: e.target.value}))}
                          placeholder="Phone *" className={inp} />
                        <input type="email" value={crmLeadForm.email} onChange={e => setCrmLeadForm(f => ({...f, email: e.target.value}))}
                          placeholder="Email" className={inp} />
                        <div className="grid grid-cols-2 gap-2">
                          <select value={crmLeadForm.source} onChange={e => setCrmLeadForm(f => ({...f, source: e.target.value}))} className={inp}>
                            {['manual','whatsapp','email','website','referral','walk_in'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                          </select>
                          <input type="number" value={crmLeadForm.budget} onChange={e => setCrmLeadForm(f => ({...f, budget: e.target.value}))}
                            placeholder="Budget ₹" className={inp} />
                        </div>
                        <select value={crmLeadForm.assignedTo} onChange={e => setCrmLeadForm(f => ({...f, assignedTo: e.target.value}))} className={inp}>
                          <option value="">Unassigned</option>
                          {teamMembers.length > 0 && (
                            <optgroup label="Team">
                              {teamMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                            </optgroup>
                          )}
                          {masterBrokers.length > 0 && (
                            <optgroup label="Master Brokers">
                              {masterBrokers.map(m => <option key={m._id} value={m._id}>{m.name}{m.city ? ` · ${m.city}` : ''}</option>)}
                            </optgroup>
                          )}
                          {brokers.length > 0 && (
                            <optgroup label="Brokers">
                              {brokers.map(m => <option key={m._id} value={m._id}>{m.name}{m.city ? ` · ${m.city}` : ''}</option>)}
                            </optgroup>
                          )}
                        </select>
                        <div className="flex gap-2">
                          <button type="submit" disabled={crmLeadSaving}
                            className="flex-1 py-2 rounded-xl bg-tertiary text-white text-xs font-bold disabled:opacity-60">
                            {crmLeadSaving ? 'Saving…' : 'Save'}
                          </button>
                          <button type="button" onClick={() => setCrmAddLead(false)}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs">Cancel</button>
                        </div>
                      </form>
                    )}

                    {crmLoading ? (
                      <div className="flex items-center justify-center flex-1 py-12">
                        <span className="material-icons-outlined animate-spin text-tertiary text-3xl">progress_activity</span>
                      </div>
                    ) : crmLeads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center flex-1 py-12 text-center px-4">
                        <span className="material-icons-outlined text-4xl text-slate-200 mb-2">group</span>
                        <p className="text-slate-400 text-sm">No leads yet for this property.</p>
                        <button onClick={() => setCrmAddLead(true)} className="mt-3 text-xs text-tertiary font-semibold hover:underline flex items-center gap-1">
                          <span className="material-icons-outlined text-sm">add</span> Add first lead
                        </button>
                      </div>
                    ) : (
                      crmLeads.map(lead => {
                        const meta = LEAD_STATUS_META[lead.status] || LEAD_STATUS_META.new;
                        const isActive = activeLead?._id === lead._id;
                        return (
                          <button key={lead._id} onClick={() => { setActiveLead(lead); setNoteText(''); setFollowUpDate(lead.followUpDate ? lead.followUpDate.slice(0, 10) : ''); }}
                            className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition
                              ${isActive ? 'bg-tertiary/5 border-l-2 border-l-tertiary' : ''}`}>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                              <span className="font-semibold text-slate-800 text-sm truncate">{lead.name}</span>
                            </div>
                            <p className="text-xs text-slate-400 ml-4">{lead.phone}
                              {lead.budget ? ` · ${fmt(lead.budget)}` : ''}
                            </p>
                            <div className="ml-4 mt-1 flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.pill}`}>{meta.label}</span>
                              {lead.followUpDate && (
                                <span className={`text-[10px] flex items-center gap-0.5 ${new Date(lead.followUpDate) < new Date() ? 'text-rose-500' : 'text-slate-400'}`}>
                                  <span className="material-icons-outlined text-[10px]">event</span>
                                  {new Date(lead.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </span>
                              )}
                              {lead.assignedTo?.name && (
                                <span className="text-[10px] text-slate-400 truncate">→ {lead.assignedTo.name}</span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Lead detail panel */}
                  {activeLead && (
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                      {/* Contact */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center font-bold text-tertiary text-lg flex-shrink-0">
                          {activeLead.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="font-montserrat font-bold text-slate-800">{activeLead.name}</p>
                          <a href={`tel:${activeLead.phone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            <span className="material-icons-outlined text-sm">call</span>{activeLead.phone}
                          </a>
                          {activeLead.email && (
                            <a href={`mailto:${activeLead.email}`} className="text-xs text-slate-400 hover:underline block">{activeLead.email}</a>
                          )}
                          {activeLead.budget && <p className="text-xs text-slate-400 mt-0.5">Budget: {fmt(activeLead.budget)}</p>}
                        </div>
                        <a href={`https://wa.me/${activeLead.phone?.replace(/\D/g,'')}?text=Hi ${activeLead.name}, regarding ${crmProp.title}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-xl hover:bg-[#1ebe5d]">
                          {WA_ICON} WhatsApp
                        </a>
                      </div>

                      {/* Status update */}
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(LEAD_STATUS_META).map(([v, m]) => (
                            <button key={v} disabled={updatingLead} onClick={() => updateLeadField(activeLead._id, { status: v })}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition disabled:opacity-50
                                ${activeLead.status === v ? `${m.pill} border-current` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${m.dot}`} />
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Assign + Follow-up */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assign To</p>
                          <select value={activeLead.assignedTo?._id || ''} disabled={updatingLead}
                            onChange={e => updateLeadField(activeLead._id, { assignedTo: e.target.value || null })}
                            className={inp}>
                            <option value="">Unassigned</option>
                            {teamMembers.length > 0 && (
                              <optgroup label="Team">
                                {teamMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                              </optgroup>
                            )}
                            {masterBrokers.length > 0 && (
                              <optgroup label="Master Brokers">
                                {masterBrokers.map(m => <option key={m._id} value={m._id}>{m.name}{m.city ? ` · ${m.city}` : ''}</option>)}
                              </optgroup>
                            )}
                            {brokers.length > 0 && (
                              <optgroup label="Brokers">
                                {brokers.map(m => <option key={m._id} value={m._id}>{m.name}{m.city ? ` · ${m.city}` : ''}</option>)}
                              </optgroup>
                            )}
                          </select>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Follow-up Date</p>
                          <div className="flex gap-2">
                            <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                              className={`${inp} flex-1`} />
                            <button disabled={updatingLead || !followUpDate}
                              onClick={() => updateLeadField(activeLead._id, { followUpDate: followUpDate || null })}
                              className="px-3 py-2 rounded-xl bg-tertiary text-white text-xs font-bold hover:bg-[#2e3044] disabled:opacity-50">
                              Set
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Notes timeline */}
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
                        {activeLead.notes?.length > 0 ? (
                          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                            {[...activeLead.notes].reverse().map((n, i) => (
                              <div key={i} className="flex gap-2.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-tertiary/40 mt-1.5 flex-shrink-0" />
                                <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                                  <p className="text-sm text-slate-700 leading-snug">{n.text}</p>
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    {n.addedBy?.name ? `${n.addedBy.name} · ` : ''}{timeAgo(n.addedAt)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 mb-3">No notes yet.</p>
                        )}
                        <div className="flex gap-2">
                          <input value={noteText} onChange={e => setNoteText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addNote(activeLead._id))}
                            placeholder="Add note… (Enter to save)" className={`${inp} flex-1`} />
                          <button onClick={() => addNote(activeLead._id)} disabled={updatingLead || !noteText.trim()}
                            className="px-3 py-2 rounded-xl bg-tertiary text-white text-xs font-bold hover:bg-[#2e3044] disabled:opacity-50">
                            <span className="material-icons-outlined text-sm">send</span>
                          </button>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="text-xs text-slate-400 space-y-0.5 pt-2 border-t border-slate-100">
                        <p>Source: <span className="text-slate-600 capitalize">{(activeLead.source || 'manual').replace('_', ' ')}</span></p>
                        <p>Added: {activeLead.createdAt ? new Date(activeLead.createdAt).toLocaleDateString('en-IN') : '—'}</p>
                      </div>
                    </div>
                  )}

                  {/* Empty state for detail panel */}
                  {!activeLead && crmLeads.length > 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <span className="material-icons-outlined text-4xl text-slate-200 mb-2">arrow_back</span>
                      <p className="text-slate-400 text-sm">Select a lead to view details</p>
                    </div>
                  )}
                </>
              )}

              {/* ── Follow-ups Tab ──────────────────────────────────────── */}
              {crmTab === 'followups' && (
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {overdueFollowUps.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <span className="material-icons-outlined text-sm">warning</span>
                        Overdue ({overdueFollowUps.length})
                      </p>
                      <div className="space-y-2">
                        {overdueFollowUps.map(lead => (
                          <FollowUpCard key={lead._id} lead={lead} onSelect={() => { setActiveLead(lead); setFollowUpDate(lead.followUpDate?.slice(0,10)||''); setCrmTab('leads'); }} overdue />
                        ))}
                      </div>
                    </div>
                  )}
                  {upcomingFollowUps.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <span className="material-icons-outlined text-sm">event_upcoming</span>
                        Upcoming ({upcomingFollowUps.length})
                      </p>
                      <div className="space-y-2">
                        {upcomingFollowUps.map(lead => (
                          <FollowUpCard key={lead._id} lead={lead} onSelect={() => { setActiveLead(lead); setFollowUpDate(lead.followUpDate?.slice(0,10)||''); setCrmTab('leads'); }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {overdueFollowUps.length === 0 && upcomingFollowUps.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <span className="material-icons-outlined text-4xl text-slate-200 mb-2">event_available</span>
                      <p className="text-slate-400">No follow-ups scheduled for this property.</p>
                      <p className="text-xs text-slate-300 mt-1">Set follow-up dates in the Leads tab.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Overview Tab ─────────────────────────────────────────── */}
              {crmTab === 'overview' && (
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {crmProp.images?.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {crmProp.images.slice(0, 6).map((img, i) => (
                        <img key={i} src={img} alt="" className="w-full h-24 object-cover rounded-xl" />
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Info label="Type" value={crmProp.propertyType} capitalize />
                    <Info label="Status" value={(crmProp.status||'').replace('_',' ')} capitalize />
                    <Info label="Price" value={fmt(crmProp.price)} />
                    <Info label="Listing" value={(crmProp.listingType||'').replace(/_/g,' ')} capitalize />
                    {crmProp.areaSqft && <Info label="Area" value={`${crmProp.areaSqft.toLocaleString()} sqft`} />}
                    {crmProp.landAcres && <Info label="Land" value={`${crmProp.landAcres} acres`} />}
                    {crmProp.totalUnits && <Info label="Total Units" value={crmProp.totalUnits} />}
                    {crmProp.totalFloors && <Info label="Total Floors" value={crmProp.totalFloors} />}
                    {crmProp.reraNumber && <Info label="RERA No." value={crmProp.reraNumber} />}
                    <Info label="Owner Type" value={crmProp.ownerType} capitalize />
                  </div>
                  {(crmProp.sellerName || crmProp.sellerPhone) && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Owner / Developer</p>
                      {crmProp.sellerName && <p className="text-sm font-semibold text-slate-700">{crmProp.sellerName}</p>}
                      {crmProp.sellerPhone && <a href={`tel:${crmProp.sellerPhone}`} className="text-sm text-blue-600 hover:underline">{crmProp.sellerPhone}</a>}
                      {crmProp.sellerEmail && <p className="text-xs text-slate-400">{crmProp.sellerEmail}</p>}
                    </div>
                  )}
                  {crmProp.description && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Description</p>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{crmProp.description}</p>
                    </div>
                  )}
                  <button onClick={() => openEdit(crmProp)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-tertiary text-tertiary text-sm font-semibold hover:bg-tertiary/5 transition">
                    <span className="material-icons-outlined text-base">edit</span> Edit Property
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>

            {/* Sticky header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white rounded-t-3xl sm:rounded-t-2xl">
              <div className="w-9 h-9 rounded-xl bg-tertiary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-outlined text-tertiary text-lg">
                  {editId ? 'edit' : 'add_home_work'}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="font-montserrat font-bold text-slate-800">
                  {editId ? 'Edit Property' : 'Add Unit Property'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editId ? 'Update listing details' : 'Fill in the property details to create a new listing'}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition">
                <span className="material-icons-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-7">

                {msg && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold ${msg.includes('pdat') || msg.includes('dded') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                    <span className="material-icons-outlined text-base">{msg.includes('pdat') || msg.includes('dded') ? 'check_circle' : 'error_outline'}</span>
                    {msg}
                  </div>
                )}

                {/* ── Section 1: Property Type ── */}
                <div>
                  <SectionLabel icon="category" label="Property Type" />
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {PROP_TYPES.filter(t => t !== 'all').map(t => (
                      <button key={t} type="button"
                        onClick={() => setForm(f => ({ ...f, propertyType: t }))}
                        className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 text-center transition
                          ${form.propertyType === t
                            ? 'border-tertiary bg-tertiary/5 text-tertiary'
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white'}`}>
                        <span className={`material-icons-outlined text-xl ${form.propertyType === t ? 'text-tertiary' : 'text-slate-400'}`}>
                          {TYPE_ICONS[t] || 'category'}
                        </span>
                        <span className="text-[10px] font-bold capitalize leading-tight">{t.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Section 2: Basic Info ── */}
                <div className="space-y-3">
                  <SectionLabel icon="info_outline" label="Basic Info" />
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Title *</label>
                    <input name="title" required value={form.title} onChange={handleChange}
                      placeholder={form.propertyType === 'tower' ? 'e.g. Skyline Tower Phase 2 – Baner' : form.propertyType === 'villa' ? 'e.g. Green Valley Villas – Whitefield' : 'Property title…'}
                      className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</label>
                    <textarea name="description" rows={2} value={form.description} onChange={handleChange}
                      placeholder="Project highlights, amenities, location advantages…"
                      className={`${inp} resize-none`} />
                  </div>
                </div>

                {/* ── Section 3: Location ── */}
                <div className="space-y-3">
                  <SectionLabel icon="location_on" label="Location" />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">City *</label>
                      <input name="city" required value={form.city} onChange={handleChange} placeholder="Jaipur" className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Area</label>
                      <input name="area" value={form.area} onChange={handleChange} placeholder="Vaishali Nagar" className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Pincode</label>
                      <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="302021" className={inp} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Full Address</label>
                    <input name="address" value={form.address} onChange={handleChange} placeholder="Plot No. 12, Near XYZ Chowk" className={inp} />
                  </div>
                </div>

                {/* ── Section 4: Property Details ── */}
                <div className="space-y-3">
                  <SectionLabel icon="apartment" label="Property Details" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {showField(form.propertyType, 'areaSqft') && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Area (sqft)</label>
                        <input name="areaSqft" type="number" min="0" value={form.areaSqft} onChange={handleChange} placeholder="250000" className={inp} />
                      </div>
                    )}
                    {showField(form.propertyType, 'landAcres') && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Land (acres)</label>
                        <input name="landAcres" type="number" min="0" step="0.01" value={form.landAcres} onChange={handleChange} placeholder="5.5" className={inp} />
                      </div>
                    )}
                    {showField(form.propertyType, 'totalUnits') && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Units</label>
                        <input name="totalUnits" type="number" min="0" value={form.totalUnits} onChange={handleChange} placeholder="240" className={inp} />
                      </div>
                    )}
                    {showField(form.propertyType, 'totalFloors') && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Floors</label>
                        <input name="totalFloors" type="number" min="0" value={form.totalFloors} onChange={handleChange} placeholder="32" className={inp} />
                      </div>
                    )}
                    {showField(form.propertyType, 'bedrooms') && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bedrooms</label>
                        <input name="bedrooms" type="number" min="0" value={form.bedrooms} onChange={handleChange} placeholder="3" className={inp} />
                      </div>
                    )}
                    {showField(form.propertyType, 'bathrooms') && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bathrooms</label>
                        <input name="bathrooms" type="number" min="0" value={form.bathrooms} onChange={handleChange} placeholder="2" className={inp} />
                      </div>
                    )}
                    {showField(form.propertyType, 'reraNumber') && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">RERA No.</label>
                        <input name="reraNumber" value={form.reraNumber} onChange={handleChange} placeholder="P52100045678" className={inp} />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Section 5: Amenities ── */}
                {(() => {
                  const list = TYPE_AMENITIES[form.propertyType] || TYPE_AMENITIES.other;
                  const selected = form.amenities || [];
                  const toggle = a => setForm(f => ({
                    ...f,
                    amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
                  }));
                  const allSelected = list.every(a => selected.includes(a));
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <SectionLabel icon="star_outline" label={`Amenities · ${form.propertyType.replace('_', ' ')}`} />
                        <div className="flex items-center gap-2">
                          {selected.length > 0 && (
                            <span className="text-xs font-bold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full">
                              {selected.length} selected
                            </span>
                          )}
                          <button type="button"
                            onClick={() => setForm(f => ({ ...f, amenities: allSelected ? [] : [...list] }))}
                            className="text-xs font-semibold text-slate-400 hover:text-tertiary transition">
                            {allSelected ? 'Clear all' : 'Select all'}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {list.map(a => (
                          <button key={a} type="button" onClick={() => toggle(a)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                              ${selected.includes(a)
                                ? 'bg-tertiary text-white border-tertiary'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-tertiary/40 hover:text-tertiary'}`}>
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Section 6: Pricing & Status ── */}
                <div className="space-y-3">
                  <SectionLabel icon="payments" label="Pricing & Status" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Price (₹) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">₹</span>
                        <input name="price" type="number" required min="0" value={form.price} onChange={handleChange}
                          placeholder="95000000" className={`${inp} pl-7`} />
                      </div>
                      {form.price > 0 && (
                        <p className="text-xs text-tertiary font-semibold mt-1">{fmt(form.price)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Listing Type</label>
                      <select name="listingType" value={form.listingType} onChange={handleChange} className={inp}>
                        {LISTING_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Status</label>
                      <select name="status" value={form.status} onChange={handleChange} className={inp}>
                        <option value="available">Available</option>
                        <option value="under_negotiation">Under Negotiation</option>
                        <option value="sold">Sold</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ── Commission ── */}
                <div className="space-y-3">
                  <SectionLabel icon="percent" label="Commission (this property)" />
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Set % that goes to broker and master broker when a unit is sold. Leave blank to use global commission rates.
                      If the buyer's pincode is covered only by a master broker, both percentages go to the master broker.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Broker %</label>
                        <div className="relative">
                          <input name="commissionBrokerPct" type="number" min="0" max="100" step="0.1"
                            value={form.commissionBrokerPct} onChange={handleChange}
                            placeholder="e.g. 1.5" className={`${inp} pr-7`} />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Master Broker %</label>
                        <div className="relative">
                          <input name="commissionMasterBrokerPct" type="number" min="0" max="100" step="0.1"
                            value={form.commissionMasterBrokerPct} onChange={handleChange}
                            placeholder="e.g. 1" className={`${inp} pr-7`} />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                        </div>
                      </div>
                    </div>
                    {(form.commissionBrokerPct !== '' || form.commissionMasterBrokerPct !== '') && (
                      <div className="flex items-center gap-2 text-xs text-tertiary font-semibold bg-tertiary/5 rounded-xl px-3 py-2">
                        <span className="material-icons-outlined text-sm">info_outline</span>
                        Total {(Number(form.commissionBrokerPct || 0) + Number(form.commissionMasterBrokerPct || 0)).toFixed(1)}%
                        &nbsp;· Broker {form.commissionBrokerPct || 0}%
                        &nbsp;· Master Broker {form.commissionMasterBrokerPct || 0}%
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Section 6: Owner Details ── */}
                <div className="space-y-3">
                  <SectionLabel icon="person_outline" label="Owner / Developer" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Owner Type</label>
                      <select name="ownerType" value={form.ownerType} onChange={handleChange} className={inp}>
                        {OWNER_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Name</label>
                      <input name="sellerName" value={form.sellerName} onChange={handleChange} placeholder="Prestige Group" className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Phone</label>
                      <input name="sellerPhone" value={form.sellerPhone} onChange={handleChange} placeholder="9876543210" className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Email</label>
                      <input name="sellerEmail" type="email" value={form.sellerEmail} onChange={handleChange} placeholder="contact@example.in" className={inp} />
                    </div>
                  </div>
                </div>

                {/* ── Section 7: Visibility ── */}
                <div className="space-y-3">
                  <SectionLabel icon="visibility" label="Visibility" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {VISIBLE_OPTS.map(o => (
                      <label key={o.key}
                        className={`flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-xl border-2 transition
                          ${form.visibleTo.includes(o.key)
                            ? 'border-tertiary bg-tertiary/5'
                            : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                        <input type="checkbox" checked={form.visibleTo.includes(o.key)} onChange={() => toggleVisible(o.key)} className="accent-tertiary" />
                        <span className={`text-xs font-semibold ${o.color} px-1.5 py-0.5 rounded-full`}>{o.label}</span>
                      </label>
                    ))}
                    <label className={`flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-xl border-2 transition
                      ${form.isFeatured ? 'border-amber-400 bg-amber-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                      <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="accent-amber-500" />
                      <span className="text-xs font-semibold text-amber-600">⭐ Featured</span>
                    </label>
                  </div>
                </div>

                {/* ── Section 8: Media ── */}
                <div className="space-y-3">
                  <SectionLabel icon="photo_library" label="Photos & Video" />
                  <MediaUploader images={formImages} onImages={setFormImages} video={formVideo} onVideo={setFormVideo} folder="a1deal/properties" showVideo />
                </div>

                {/* ── Section 9: Unit Split (edit only) ── */}
                {editId && (() => {
                  const prop = properties.find(p => p._id === editId);
                  const split = prop?.unitSplit;
                  return (
                    <div className="space-y-2">
                      <SectionLabel icon="call_split" label="Unit Distribution" />
                      <div className={`flex items-center justify-between gap-3 p-4 rounded-2xl border-2 transition
                        ${split?.enabled ? 'border-violet-200 bg-violet-50' : 'border-dashed border-slate-200 bg-slate-50'}`}>
                        <div>
                          {split?.enabled ? (
                            <>
                              <p className="text-sm font-bold text-violet-700 flex items-center gap-1.5">
                                <span className="material-icons-outlined text-base">call_split</span>
                                {split.units?.length || 0} units configured
                                <span className="text-xs font-semibold text-violet-500 capitalize">
                                  · {(split.splitMode || 'bhk_wise').replace('_', '-')}
                                </span>
                              </p>
                              <div className="flex gap-3 mt-1.5 text-xs">
                                <span className="text-emerald-600 font-semibold">{split.units?.filter(u => u.status === 'available').length || 0} available</span>
                                {split.units?.filter(u => u.status === 'under_negotiation').length > 0 && (
                                  <span className="text-amber-600 font-semibold">{split.units.filter(u => u.status === 'under_negotiation').length} negotiating</span>
                                )}
                                {split.units?.filter(u => u.status === 'sold').length > 0 && (
                                  <span className="text-slate-400 font-semibold">{split.units.filter(u => u.status === 'sold').length} sold</span>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-slate-600">No units configured yet</p>
                              <p className="text-xs text-slate-400 mt-0.5">Split into BHK-wise groups or floor-wise layout</p>
                            </>
                          )}
                        </div>
                        <button type="button" onClick={() => prop && setSplitProperty(prop)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0
                            ${split?.enabled
                              ? 'bg-violet-100 text-violet-700 hover:bg-violet-200 border border-violet-200'
                              : 'bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-700 border border-slate-200 hover:border-violet-300'}`}>
                          <span className="material-icons-outlined text-sm">call_split</span>
                          {split?.enabled ? 'Manage Units' : 'Configure Split'}
                        </button>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Sticky footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-[2] py-3 rounded-xl bg-tertiary text-white font-bold text-sm hover:bg-[#2e3044] transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving
                    ? <><span className="material-icons-outlined text-base animate-spin">progress_activity</span>Saving…</>
                    : <><span className="material-icons-outlined text-base">{editId ? 'save' : 'add_home_work'}</span>{editId ? 'Update Property' : 'Add Property'}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value, capitalize }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-sm font-semibold text-slate-700 ${capitalize ? 'capitalize' : ''}`}>{value || '—'}</p>
    </div>
  );
}

function FollowUpCard({ lead, onSelect, overdue }) {
  const meta = LEAD_STATUS_META[lead.status] || LEAD_STATUS_META.new;
  const date = lead.followUpDate ? new Date(lead.followUpDate) : null;
  return (
    <button onClick={onSelect}
      className={`w-full text-left p-3 rounded-xl border transition hover:shadow-sm
        ${overdue ? 'border-rose-200 bg-rose-50 hover:border-rose-300' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-slate-800 text-sm">{lead.name}</p>
        {date && (
          <span className={`text-xs font-bold flex items-center gap-1 ${overdue ? 'text-rose-600' : 'text-emerald-600'}`}>
            <span className="material-icons-outlined text-sm">{overdue ? 'alarm' : 'event'}</span>
            {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.pill}`}>{meta.label}</span>
        <span className="text-xs text-slate-400">{lead.phone}</span>
        {lead.assignedTo?.name && <span className="text-xs text-slate-400">→ {lead.assignedTo.name}</span>}
      </div>
    </button>
  );
}
