import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import ImageCropModal from './ImageCropModal';

// Recommended output size / aspect / mime per branding image slot.
const IMAGE_SPEC = {
  photo: { aspect: 1, outputWidth: 500, outputHeight: 500, mimeType: 'image/jpeg', circular: true,  hintSize: '500 × 500px (square)', previewContext: 'avatar' },
  logo:  { aspect: 1, outputWidth: 500, outputHeight: 500, mimeType: 'image/png',  circular: false, hintSize: '500 × 500px, transparent PNG works best', previewContext: 'plain' },
};

// Shared card-form sections (Branding / Contact / Social / Trust) used by the
// broker's own editor and the admin Edit-User modal. In adminMode the custom-logo
// paid gate is lifted and the "paid plan" upsell hints are hidden.
function Field({ label, ...props }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{label}</label>
      <input {...props} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </div>
  );
}

export default function BrokerCardFields({ card, setCard, hasSub = false, adminMode = false }) {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [cropTarget, setCropTarget] = useState(null); // { field, file }

  const set = (k, v) => setCard((c) => ({ ...c, [k]: v }));

  async function uploadImage(field, file) {
    if (!file) return;
    setUploading(field);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('images', file);
      const { data } = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = data.urls?.[0]?.url;
      if (url) set(field, url);
      else setUploadError('Upload succeeded but no image URL was returned. Please try again.');
    } catch (err) {
      setUploadError(err?.response?.data?.message || 'Failed to upload image. Please try again.');
    }
    setUploading('');
  }

  function onCropped(blob) {
    const { field } = cropTarget;
    const spec = IMAGE_SPEC[field];
    const ext = spec.mimeType === 'image/png' ? 'png' : 'jpg';
    const file = new File([blob], `${field}.${ext}`, { type: spec.mimeType });
    setCropTarget(null);
    uploadImage(field, file);
  }

  return (
    <div className="space-y-6">
      {/* Branding */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h3 className="font-montserrat font-semibold text-slate-800">Branding</h3>
        {uploadError && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{uploadError}</p>
        )}
        <div className="flex gap-4 flex-wrap">
          {['photo', 'logo'].map((f) => {
            const locked = !adminMode && f === 'logo' && !hasSub;
            const fLabel = f === 'logo' ? 'Logo' : 'Photo';
            return (
              <div key={f} className="text-center">
                <label className={`relative block w-20 h-20 rounded-xl border-2 overflow-hidden bg-slate-50 flex items-center justify-center mb-1 group
                    ${locked ? 'border-slate-200 cursor-not-allowed' : 'border-dashed border-primary/30 hover:border-primary cursor-pointer transition-colors'}`}
                  onClick={locked ? (e) => { e.preventDefault(); navigate('/plans'); } : undefined}>
                  {card[f] ? (
                    <>
                      <img src={card[f]} alt={f} className="w-full h-full object-cover" />
                      {!locked && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <span className="material-icons-outlined text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            {uploading === f ? 'hourglass_top' : 'edit'}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5 text-slate-300 group-hover:text-primary transition-colors">
                      <span className="material-icons-outlined text-2xl">{locked ? 'lock' : uploading === f ? 'hourglass_top' : 'add_photo_alternate'}</span>
                    </div>
                  )}
                  {!locked && (
                    <input type="file" accept="image/*" className="sr-only"
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) setCropTarget({ field: f, file }); e.target.value = ''; }} />
                  )}
                </label>
                {locked ? (
                  <span className="text-xs text-amber-600 font-semibold flex items-center gap-0.5 justify-center">
                    <span className="material-icons-outlined text-xs">lock</span> {fLabel} — paid
                  </span>
                ) : (
                  <span className="text-xs text-primary font-semibold">{uploading === f ? 'Uploading…' : `Upload ${fLabel}`}</span>
                )}
                {!locked && <p className="text-[10px] text-slate-400 mt-0.5 max-w-[9rem] mx-auto leading-tight">{IMAGE_SPEC[f].hintSize}</p>}
              </div>
            );
          })}
        </div>
        {!adminMode && !hasSub && (
          <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Custom logo (shown to buyers in your pincodes) unlocks with a paid plan.{' '}
            <button type="button" onClick={() => navigate('/plans')} className="font-bold underline">View plans</button>
          </p>
        )}
        <Field label="Business Name" value={card.businessName || ''} onChange={(e) => set('businessName', e.target.value)} placeholder="e.g. Rajesh Realty" />
        <Field label="Tagline / Slogan" value={card.tagline || ''} onChange={(e) => set('tagline', e.target.value)} placeholder="Your trusted property partner" />
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">About / Description</label>
          <textarea value={card.about || ''} onChange={(e) => set('about', e.target.value)} rows={3} placeholder="A short intro about you and your services…"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h3 className="font-montserrat font-semibold text-slate-800">Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Phone" value={card.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="+91…" />
          <Field label="WhatsApp" value={card.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+91…" />
          <Field label="Email" value={card.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="you@email.com" />
        </div>
      </div>

      {/* Social & Web Links */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h3 className="font-montserrat font-semibold text-slate-800">Social & Web Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { k: 'website', label: 'Website', ph: 'https://…' },
            { k: 'instagram', label: 'Instagram', ph: 'https://instagram.com/…' },
            { k: 'facebook', label: 'Facebook', ph: 'https://facebook.com/…' },
            { k: 'youtube', label: 'YouTube', ph: 'https://youtube.com/…' },
            { k: 'linkedin', label: 'LinkedIn', ph: 'https://linkedin.com/in/…' },
            { k: 'twitter', label: 'X (Twitter)', ph: 'https://x.com/…' },
          ].map((s) => (
            <Field key={s.k} label={s.label} value={card.social?.[s.k] || ''}
              onChange={(e) => setCard((c) => ({ ...c, social: { ...(c.social || {}), [s.k]: e.target.value } }))}
              placeholder={s.ph} />
          ))}
        </div>
      </div>

      {/* Trust & Credibility */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div>
          <h3 className="font-montserrat font-semibold text-slate-800">Trust & Credibility</h3>
          <p className="text-xs text-slate-400">Shown as trust signals on the public card. Leave blank to hide.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Experience (years)" type="number" min="0" value={card.stats?.experienceYears ?? ''}
            onChange={(e) => setCard((c) => ({ ...c, stats: { ...(c.stats || {}), experienceYears: e.target.value } }))} placeholder="e.g. 10" />
          <Field label="Deals Closed" type="number" min="0" value={card.stats?.dealsClosed ?? ''}
            onChange={(e) => setCard((c) => ({ ...c, stats: { ...(c.stats || {}), dealsClosed: e.target.value } }))} placeholder="e.g. 250" />
          <Field label="Happy Clients" type="number" min="0" value={card.stats?.happyClients ?? ''}
            onChange={(e) => setCard((c) => ({ ...c, stats: { ...(c.stats || {}), happyClients: e.target.value } }))} placeholder="e.g. 500" />
        </div>
        <Field label="RERA / Registration Number" value={card.reraNumber || ''} onChange={(e) => set('reraNumber', e.target.value)} placeholder="e.g. RERA-RJ-2024-1234" />
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Office Address <span className="normal-case font-normal text-slate-300">(for the letterhead)</span></label>
          <textarea value={card.officeAddress || ''} onChange={(e) => set('officeAddress', e.target.value)} rows={2} placeholder="Shop / office address for printed documents…"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {cropTarget && (
        <ImageCropModal
          file={cropTarget.file}
          aspect={IMAGE_SPEC[cropTarget.field].aspect}
          outputWidth={IMAGE_SPEC[cropTarget.field].outputWidth}
          outputHeight={IMAGE_SPEC[cropTarget.field].outputHeight}
          mimeType={IMAGE_SPEC[cropTarget.field].mimeType}
          circular={IMAGE_SPEC[cropTarget.field].circular}
          previewContext={IMAGE_SPEC[cropTarget.field].previewContext}
          title={`Adjust ${cropTarget.field === 'logo' ? 'Logo' : 'Photo'}`}
          hint={`Recommended: ${IMAGE_SPEC[cropTarget.field].hintSize}`}
          onCancel={() => setCropTarget(null)}
          onCropped={onCropped}
        />
      )}
    </div>
  );
}
