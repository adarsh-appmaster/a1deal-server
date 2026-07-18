import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import BrokerCardFields from '../../../components/common/BrokerCardFields';

export default function BrokerCardEditor() {
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [pincodes, setPincodes] = useState([]);
  const [hasSub, setHasSub] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  // Whitelist picker
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const set = (k, v) => setCard((c) => ({ ...c, [k]: v }));

  useEffect(() => {
    api.get('/broker-card/mine')
      .then((r) => { setCard(r.data.card); setPincodes(r.data.pincodes || []); setHasSub(!!r.data.hasActiveSubscription); })
      .catch(() => setNotice('Could not load your card.'))
      .finally(() => setLoading(false));
  }, []);

  const runSearch = useCallback(async () => {
    setSearching(true);
    try {
      const { data } = await api.get(`/broker-card/unit-search?q=${encodeURIComponent(search.trim())}`);
      setResults(data.results || []);
    } catch { /* empty */ }
    setSearching(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(runSearch, 300);
    return () => clearTimeout(t);
  }, [runSearch]);

  function toggleWhitelist(prop) {
    setCard((c) => {
      const list = c.whitelistedUnitProperties || [];
      const exists = list.some((x) => x._id === prop._id);
      return { ...c, whitelistedUnitProperties: exists ? list.filter((x) => x._id !== prop._id) : [...list, prop] };
    });
  }
  const isPicked = (id) => (card?.whitelistedUnitProperties || []).some((x) => x._id === id);

  async function save() {
    setSaving(true);
    setNotice('');
    try {
      const payload = {
        businessName: card.businessName, tagline: card.tagline, about: card.about,
        photo: card.photo, logo: card.logo, phone: card.phone, whatsapp: card.whatsapp, email: card.email,
        social: card.social || {},
        stats: card.stats || {}, reraNumber: card.reraNumber || '', officeAddress: card.officeAddress || '',
        slug: card.slug, published: card.published,
        whitelistedUnitProperties: (card.whitelistedUnitProperties || []).map((x) => x._id),
      };
      const { data } = await api.patch('/broker-card/mine', payload);
      setCard(data.card);
      setNotice('✓ Saved. Your card is live.');
    } catch (err) {
      setNotice(err.response?.data?.message || 'Could not save.');
    }
    setSaving(false);
  }

  if (loading) return <div className="p-10 text-center text-slate-400">Loading…</div>;
  if (!card) return <div className="p-10 text-center text-slate-400">{notice || 'No card.'}</div>;

  const publicUrl = `${window.location.origin}/b/${card.slug}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(publicUrl)}`;

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-slate-800">My Visiting Card</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your shareable public profile with properties in your area.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/broker/visiting-card')} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 flex items-center gap-1.5">
            <span className="material-icons-outlined text-base">badge</span>Visiting Card
          </button>
          <button onClick={() => navigate('/broker/blog')} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 flex items-center gap-1.5">
            <span className="material-icons-outlined text-base">article</span>Blog
          </button>
          <button onClick={() => navigate('/broker/letterhead')} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 flex items-center gap-1.5">
            <span className="material-icons-outlined text-base">description</span>Letterhead
          </button>
          <a href={publicUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary/5">Preview</a>
          <button onClick={save} disabled={saving} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>

      {!hasSub && (
        <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-center gap-3">
          <span className="material-icons-outlined text-amber-600">visibility_off</span>
          <span className="flex-1">
            <strong>Your card is not live.</strong> The public page activates with a paid plan — you can prepare everything now.
          </span>
          <button onClick={() => navigate('/plans')}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container transition">
            Subscribe
          </button>
        </div>
      )}
      {notice && <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">{notice}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-6">
          <BrokerCardFields card={card} setCard={setCard} hasSub={hasSub} />

          {/* Whitelist picker */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <div>
              <h3 className="font-montserrat font-semibold text-slate-800">Featured Unit Properties</h3>
              <p className="text-xs text-slate-400">Featured units in your pincodes show automatically. You can hand-pick more below — only properties within your assigned pincodes can be added.</p>
            </div>
            {(card.whitelistedUnitProperties || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {card.whitelistedUnitProperties.map((p) => (
                  <span key={p._id} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {p.title}
                    <button onClick={() => toggleWhitelist(p)}><span className="material-icons-outlined text-sm">close</span></button>
                  </span>
                ))}
              </div>
            )}
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search unit properties to add…"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
              {searching ? <p className="text-sm text-slate-400 py-3">Searching…</p> : results.length === 0 ? <p className="text-sm text-slate-400 py-3">No results.</p> : results.map((p) => (
                <button key={p._id} onClick={() => toggleWhitelist(p)} className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-slate-50 px-2 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                    {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400 truncate">{[p.propertyType, p.city, p.pincode].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className={`material-icons-outlined ${isPicked(p._id) ? 'text-emerald-500' : 'text-slate-300'}`}>{isPicked(p._id) ? 'check_circle' : 'add_circle_outline'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: share */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <h3 className="font-montserrat font-semibold text-slate-800">Share</h3>
            <div className="flex items-center justify-center"><img src={qrSrc} alt="QR" className="w-40 h-40" /></div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Card link</label>
              <div className="flex gap-2">
                <input readOnly value={publicUrl} className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50" />
                <button onClick={() => navigator.clipboard?.writeText(publicUrl)} className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold">Copy</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Custom handle</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">/b/</span>
                <input value={card.slug || ''} onChange={(e) => set('slug', e.target.value)} className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Save to update your link.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-montserrat font-semibold text-slate-800 mb-2">Your coverage</h3>
            {pincodes.length === 0 ? (
              <p className="text-xs text-slate-400">No approved pincodes yet — mortgage & auction sections will be empty until you have coverage.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {pincodes.map((p) => <span key={p} className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700">{p}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
