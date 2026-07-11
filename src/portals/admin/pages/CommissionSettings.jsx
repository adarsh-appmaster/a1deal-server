import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { validateForm } from '../../../validation/validate';
import { commissionRateSchema } from '../../../validation/schemas';
import { useConfirm } from '../../../hooks/useConfirm';
import { toast } from '../../../components/common/Toast';

const TYPE_LABELS = {
  mortgage: { label: 'Mortgage Properties', icon: 'gavel' },
  unit:     { label: 'Unit Properties',     icon: 'apartment' },
};
const TYPES = ['mortgage', 'unit'];

const inp = 'w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30';

function GlobalRateCard({ propertyType, rate, onSaved }) {
  const [form, setForm] = useState({
    brokerPercent: rate?.brokerPercent ?? 1,
    masterBrokerPercent: rate?.masterBrokerPercent ?? 1,
    directMasterBrokerPercent: rate?.directMasterBrokerPercent ?? 2,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setForm({
      brokerPercent: rate?.brokerPercent ?? 1,
      masterBrokerPercent: rate?.masterBrokerPercent ?? 1,
      directMasterBrokerPercent: rate?.directMasterBrokerPercent ?? 2,
    });
  }, [rate]);

  async function save() {
    if (!rate?._id) return;
    setSaving(true); setMsg('');
    try {
      await api.patch(`/commission-rates/${rate._id}`, form);
      setMsg('Saved.');
      onSaved?.();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to save.');
    }
    setSaving(false);
  }

  const meta = TYPE_LABELS[propertyType];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-icons-outlined text-primary">{meta.icon}</span>
        <h3 className="font-montserrat font-bold text-slate-800">{meta.label}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Broker Commission</p>
            <p className="text-xs text-slate-400">Standard broker's cut (broker-chain mode)</p>
          </div>
          <div className="flex items-center gap-1">
            <input type="number" min={0} max={100} step={0.1} className={inp} value={form.brokerPercent}
              onChange={e => setForm(f => ({ ...f, brokerPercent: parseFloat(e.target.value) || 0 }))} />
            <span className="text-sm text-slate-400">%</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Master Broker Commission</p>
            <p className="text-xs text-slate-400">Master broker's cut (broker-chain mode)</p>
          </div>
          <div className="flex items-center gap-1">
            <input type="number" min={0} max={100} step={0.1} className={inp} value={form.masterBrokerPercent}
              onChange={e => setForm(f => ({ ...f, masterBrokerPercent: parseFloat(e.target.value) || 0 }))} />
            <span className="text-sm text-slate-400">%</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-700">Direct-Sell Master Broker %</p>
            <p className="text-xs text-slate-400">When "Sell Direct" skips the broker entirely</p>
          </div>
          <div className="flex items-center gap-1">
            <input type="number" min={0} max={100} step={0.1} className={inp} value={form.directMasterBrokerPercent}
              onChange={e => setForm(f => ({ ...f, directMasterBrokerPercent: parseFloat(e.target.value) || 0 }))} />
            <span className="text-sm text-slate-400">%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition disabled:opacity-60">
          {saving ? 'Saving…' : 'Save'}
        </button>
        {msg && <span className={`text-xs font-semibold ${msg === 'Saved.' ? 'text-emerald-600' : 'text-rose-600'}`}>{msg}</span>}
      </div>
    </div>
  );
}

function OverridesPanel({ propertyType, overrides, onChanged }) {
  const [form, setForm] = useState({ city: '', pincode: '', brokerPercent: 1, masterBrokerPercent: 1, directMasterBrokerPercent: 2 });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');
  const { confirm, dialog } = useConfirm();

  async function addOverride() {
    if (!form.city.trim() && !form.pincode.trim()) {
      setMsg('City or pincode is required.'); return;
    }
    const { errors } = validateForm(commissionRateSchema, {
      propertyType,
      city: form.city, pincode: form.pincode,
      brokerPercent: form.brokerPercent,
      masterBrokerPercent: form.masterBrokerPercent,
      directMasterBrokerPercent: form.directMasterBrokerPercent,
    });
    if (errors) { setMsg(Object.values(errors)[0]); return; }
    setAdding(true); setMsg('');
    try {
      await api.post('/commission-rates', {
        propertyType,
        scope: form.pincode.trim() ? 'pincode' : 'city',
        city: form.city.trim() || undefined,
        pincode: form.pincode.trim() || undefined,
        brokerPercent: form.brokerPercent,
        masterBrokerPercent: form.masterBrokerPercent,
        directMasterBrokerPercent: form.directMasterBrokerPercent,
      });
      setForm({ city: '', pincode: '', brokerPercent: 1, masterBrokerPercent: 1, directMasterBrokerPercent: 2 });
      onChanged?.();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to add rule.');
    }
    setAdding(false);
  }

  async function removeOverride(id) {
    if (!(await confirm('Deactivate this override rule?', { danger: true, confirmLabel: 'Deactivate' }))) return;
    try { await api.delete(`/commission-rates/${id}`); onChanged?.(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to deactivate override.'); }
  }

  const smallInp = 'px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs w-20 text-right focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
      {dialog}
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">City / Pincode Overrides ({overrides.length})</p>

      {overrides.length > 0 && (
        <div className="space-y-2">
          {overrides.map(o => (
            <div key={o._id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-3 py-2 text-xs">
              <span className="font-semibold text-slate-700 flex-1">
                {o.pincode ? `Pincode ${o.pincode}` : `City ${o.city}`}
              </span>
              <span className="text-slate-500">B {o.brokerPercent}%</span>
              <span className="text-slate-500">MB {o.masterBrokerPercent}%</span>
              <span className="text-slate-500">Direct {o.directMasterBrokerPercent}%</span>
              <button onClick={() => removeOverride(o._id)} className="text-rose-400 hover:text-rose-600">
                <span className="material-icons-outlined text-sm">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-slate-200">
        <input className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs w-28" placeholder="City"
          value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
        <input className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs w-24" placeholder="Pincode"
          value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
        <input type="number" className={smallInp} placeholder="Broker%" value={form.brokerPercent}
          onChange={e => setForm(f => ({ ...f, brokerPercent: parseFloat(e.target.value) || 0 }))} />
        <input type="number" className={smallInp} placeholder="MB%" value={form.masterBrokerPercent}
          onChange={e => setForm(f => ({ ...f, masterBrokerPercent: parseFloat(e.target.value) || 0 }))} />
        <input type="number" className={smallInp} placeholder="Direct%" value={form.directMasterBrokerPercent}
          onChange={e => setForm(f => ({ ...f, directMasterBrokerPercent: parseFloat(e.target.value) || 0 }))} />
        <button onClick={addOverride} disabled={adding}
          className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition disabled:opacity-60">
          + Add Rule
        </button>
      </div>
      {msg && <p className="text-xs text-rose-600">{msg}</p>}
    </div>
  );
}

export default function CommissionSettings() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/commission-rates');
      setRates(data.rates || []);
    } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-xl text-slate-800">Commission Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Set broker / master broker commission % for Mortgage and Unit properties.
          Add city or pincode overrides for special rates.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {TYPES.map(type => {
            const globalRate = rates.find(r => r.propertyType === type && r.scope === 'global');
            const overrides  = rates.filter(r => r.propertyType === type && r.scope !== 'global');
            return (
              <div key={type} className="space-y-4">
                <GlobalRateCard propertyType={type} rate={globalRate} onSaved={load} />
                <OverridesPanel propertyType={type} overrides={overrides} onChanged={load} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
