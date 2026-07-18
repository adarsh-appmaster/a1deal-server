import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';

const EMPTY = { title: '', category: '', excerpt: '', content: '', featuredImage: '', status: 'draft' };
const inp = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

// Turn plain-text (paragraphs separated by blank lines) into simple HTML. If the
// author already typed HTML tags, leave it — the server sanitizes either way.
function toHtml(text) {
  const t = (text || '').trim();
  if (!t) return '';
  if (/<[a-z][\s\S]*>/i.test(t)) return t;
  return t.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

export default function BrokerBlog() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);   // post being edited, or 'new', or null
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/articles/mine');
      setPosts(data.articles || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/articles/categories').then(r => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  function openNew() { setForm({ ...EMPTY, category: categories[0] || '' }); setEditing('new'); setMsg(''); }
  function openEdit(p) {
    setForm({ title: p.title || '', category: p.category || '', excerpt: p.excerpt || '', content: p.content || '', featuredImage: p.featuredImage || '', status: p.status || 'draft' });
    setEditing(p); setMsg('');
  }

  async function uploadImage(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('images', file);
      const { data } = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = data.urls?.[0]?.url;
      if (url) set('featuredImage', url);
    } catch { setMsg('Image upload failed.'); }
    setUploading(false);
  }

  async function save(e) {
    e.preventDefault();
    if (!form.title.trim() || form.title.trim().length < 3) { setMsg('Title must be at least 3 characters.'); return; }
    if (!form.content.trim()) { setMsg('Please write some content.'); return; }
    if (!form.category) { setMsg('Please pick a category.'); return; }
    setSaving(true); setMsg('');
    const payload = {
      title: form.title.trim(), category: form.category,
      excerpt: form.excerpt.trim() || undefined,
      featuredImage: form.featuredImage || undefined,
      content: toHtml(form.content), status: form.status,
    };
    try {
      if (editing === 'new') await api.post('/articles', payload);
      else await api.patch(`/articles/${editing._id}`, payload);
      setEditing(null);
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not save.');
    }
    setSaving(false);
  }

  async function remove(p) {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try { await api.delete(`/articles/${p._id}`); await load(); }
    catch (err) { setMsg(err.response?.data?.message || 'Could not delete.'); }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-slate-800">My Blog</h1>
          <p className="text-sm text-slate-500 mt-0.5">Write posts that appear on your visiting card website.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/broker/card')} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">← Card</button>
          <button onClick={openNew} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container flex items-center gap-1.5">
            <span className="material-icons-outlined text-base">add</span>New Post
          </button>
        </div>
      </div>

      {msg && <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">{msg}</div>}

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading…</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <span className="material-icons-outlined text-5xl text-slate-200 block mb-3">article</span>
          <p className="text-slate-500 text-sm font-medium">No posts yet.</p>
          <button onClick={openNew} className="mt-3 text-primary font-semibold text-sm hover:underline">Write your first post →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(p => (
            <div key={p._id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                {p.featuredImage && <img src={p.featuredImage} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800 truncate">{p.title}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {p.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{p.category}{p.publishedAt ? ` · ${new Date(p.publishedAt).toLocaleDateString('en-IN')}` : ''}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(p)} title="Edit" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary">
                  <span className="material-icons-outlined text-base">edit</span>
                </button>
                <button onClick={() => remove(p)} title="Delete" className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500">
                  <span className="material-icons-outlined text-base">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-montserrat font-bold text-lg text-slate-800">{editing === 'new' ? 'New Post' : 'Edit Post'}</h2>
              <button onClick={() => setEditing(null)}><span className="material-icons-outlined text-slate-400">close</span></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              {msg && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm font-semibold">{msg}</div>}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Title</label>
                <input className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. 5 things to check before buying a resale flat" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Category</label>
                  <select className={inp} value={form.category} onChange={e => set('category', e.target.value)}>
                    <option value="">Select…</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Status</label>
                  <select className={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="draft">Draft (only you)</option>
                    <option value="published">Published (live on your card)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Featured Image</label>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-16 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {form.featuredImage ? <img src={form.featuredImage} alt="" className="w-full h-full object-cover" /> : <span className="material-icons-outlined text-slate-300">image</span>}
                  </div>
                  <label className="text-xs text-primary font-semibold cursor-pointer">
                    {uploading ? 'Uploading…' : form.featuredImage ? 'Change image' : 'Upload image'}
                    <input type="file" accept="image/*" hidden onChange={e => uploadImage(e.target.files?.[0])} />
                  </label>
                  {form.featuredImage && <button type="button" onClick={() => set('featuredImage', '')} className="text-xs text-slate-400 hover:text-rose-500">Remove</button>}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Excerpt <span className="normal-case font-normal text-slate-300">(short summary)</span></label>
                <textarea className={`${inp} resize-none`} rows={2} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} placeholder="One or two lines shown in the card grid…" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Content</label>
                <textarea className={`${inp} resize-y font-mono text-xs`} rows={10} value={form.content} onChange={e => set('content', e.target.value)}
                  placeholder="Write your post. Separate paragraphs with a blank line. Basic HTML is allowed." />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-container disabled:opacity-60">
                  {saving ? 'Saving…' : editing === 'new' ? 'Create Post' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
