import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { validateForm } from '../../../validation/validate';
import { articleSchema } from '../../../validation/schemas';
import MediaUploader from '../../../components/common/MediaUploader';
import { Pagination } from '../../../components/common/Pagination';
import { useConfirm } from '../../../hooks/useConfirm';

const DEFAULT_CATEGORIES = [
  'Property Investment', 'Home Loans', 'Mortgage', 'Commercial Property',
  'Residential Property', 'Legal Guide', 'Tax Saving', 'Interior Design',
  'Market News', 'Government Schemes', 'Builder Projects', 'City Guide',
];

const STATUSES = [
  { v: 'all', l: 'All' },
  { v: 'draft', l: 'Draft' },
  { v: 'published', l: 'Published' },
];

const STATUS_COLORS = {
  draft: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
};

const LIMIT = 12;

const EMPTY_FORM = {
  title: '', slug: '', shortDescription: '', content: '', excerpt: '',
  featuredImage: '', bannerImage: '', galleryImages: [], featuredVideo: '', videoThumbnail: '',
  category: '', subcategory: '', tags: [], status: 'draft',
};

const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30';
const lbl = 'block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1';

function timeAgo(d) {
  if (!d) return '';
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminArticles() {
  const [articles, setArticles] = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch]     = useState('');
  const [inputVal, setInputVal] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter]     = useState('all');

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const { confirm, dialog } = useConfirm();

  const fetchArticles = useCallback(async (p = 1) => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT, status: statusFilter });
      if (search) params.set('q', search);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const { data } = await api.get(`/articles?${params}`);
      setArticles(data.articles || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch (err) {
      setLoadError(err.response?.data?.message || `Failed to load articles (${err.response?.status || 'network error'}).`);
    }
    setLoading(false);
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => { fetchArticles(1); }, [fetchArticles]);
  useEffect(() => {
    api.get('/articles/categories').then(({ data }) => {
      if (data.categories?.length) setCategories(data.categories);
    }).catch(() => { /* fall back to defaults */ });
  }, []);

  function handleSearch(e) { e.preventDefault(); setSearch(inputVal.trim()); }

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setTagInput('');
    setEditId(null); setMsg(''); setShowForm(true);
  }

  function openEdit(a) {
    setForm({
      title: a.title || '', slug: a.slug || '', shortDescription: a.shortDescription || '',
      content: a.content || '', excerpt: a.excerpt || '',
      featuredImage: a.featuredImage || '', bannerImage: a.bannerImage || '',
      galleryImages: a.galleryImages || [], featuredVideo: a.featuredVideo || '',
      videoThumbnail: a.videoThumbnail || '',
      category: a.category || '', subcategory: a.subcategory || '',
      tags: a.tags || [], status: a.status || 'draft',
    });
    setTagInput('');
    setEditId(a._id); setMsg(''); setShowForm(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  }
  function removeTag(t) {
    setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));
  }
  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { errors } = validateForm(articleSchema, form);
    if (errors) { setMsg(Object.values(errors)[0]); return; }
    setSaving(true); setMsg('');
    try {
      if (editId) {
        await api.patch(`/articles/${editId}`, form);
        setMsg('Article updated.');
      } else {
        await api.post('/articles', form);
        setMsg('Article added.');
      }
      setShowForm(false);
      fetchArticles(editId ? page : 1);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to save.');
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!(await confirm('Delete this article?', { danger: true, confirmLabel: 'Delete' }))) return;
    try { await api.delete(`/articles/${id}`); fetchArticles(page); } catch { /* empty */ }
  }

  return (
    <div className="space-y-6">
      {dialog}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-montserrat font-bold text-xl text-slate-800">Articles</h1>
          <p className="text-sm text-slate-500 mt-0.5">Guides, market news &amp; blog content</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-tertiary text-white text-sm font-semibold rounded-xl hover:bg-[#2e3044] transition">
          <span className="material-icons-outlined text-base">add</span> Add Article
        </button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-icons-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm">search</span>
            <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
              placeholder="Search by title, description, tags…"
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
          <span className="text-xs text-slate-400 font-semibold mr-1">Category:</span>
          <button onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
              ${categoryFilter === 'all' ? 'bg-tertiary text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
            All
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                ${categoryFilter === c ? 'bg-tertiary text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 font-semibold">Status:</span>
          {STATUSES.map(s => (
            <button key={s.v} onClick={() => setStatusFilter(s.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                ${statusFilter === s.v ? 'bg-tertiary text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {/* Load error banner */}
      {loadError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
          <span className="material-icons-outlined text-base flex-shrink-0">error_outline</span>
          <span className="flex-1">{loadError}</span>
          <button onClick={() => fetchArticles(page)} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Results meta */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{total} article{total !== 1 ? 's' : ''}{search ? ` for "${search}"` : ''}</span>
        <span>Page {page} of {pages}</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-icons-outlined text-3xl animate-spin text-tertiary">progress_activity</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <span className="material-icons-outlined text-5xl text-slate-200">article</span>
          <p className="text-slate-400 mt-3">No articles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {articles.map(a => (
            <div key={a._id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              {a.featuredImage ? (
                <div className="h-36 bg-slate-100">
                  <img src={a.featuredImage} alt={a.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-16 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                  <span className="material-icons-outlined text-slate-300 text-3xl">article</span>
                </div>
              )}

              <div className="px-4 pt-3 pb-2 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[a.status] || 'bg-slate-100 text-slate-600'}`}>
                    {a.status}
                  </span>
                  {a.category && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{a.category}</span>
                  )}
                </div>
                <p className="font-montserrat font-bold text-slate-800 leading-tight line-clamp-2">{a.title}</p>
                {a.shortDescription && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.shortDescription}</p>
                )}
                {a.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.tags.slice(0, 4).map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-semibold">#{t}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-4 py-2 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="material-icons-outlined text-xs">person</span>
                  {a.author?.name || 'Admin'}
                </span>
                <span>{timeAgo(a.updatedAt)}</span>
              </div>

              <div className="px-4 pb-4 pt-2 flex gap-2">
                <button onClick={() => openEdit(a)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition">
                  <span className="material-icons-outlined text-sm">edit</span> Edit
                </button>
                <button onClick={() => handleDelete(a._id)}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-500 text-xs font-semibold hover:bg-rose-50 transition">
                  <span className="material-icons-outlined text-sm">delete_outline</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination currentPage={page} totalPages={pages} totalItems={total} itemsPerPage={LIMIT} onPageChange={p => fetchArticles(p)} />

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-montserrat font-bold text-lg text-slate-800">{editId ? 'Edit Article' : 'Add Article'}</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
                <span className="material-icons-outlined text-lg">close</span>
              </button>
            </div>

            {msg && (
              <div className={`p-2.5 rounded-xl text-xs font-semibold text-center ${msg.includes('added') || msg.includes('updated') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {msg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic Info */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Basic Info</p>
                <div>
                  <label className={lbl}>Title *</label>
                  <input required name="title" value={form.title} onChange={handleChange} placeholder="5 Tax Benefits Every Homebuyer Should Know" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Slug <span className="normal-case font-normal text-slate-400">(auto-generated if left blank)</span></label>
                  <input name="slug" value={form.slug} onChange={handleChange} placeholder="5-tax-benefits-every-homebuyer" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Short Description</label>
                  <input name="shortDescription" value={form.shortDescription} onChange={handleChange} placeholder="One-line summary shown in listings" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Excerpt</label>
                  <textarea name="excerpt" value={form.excerpt} onChange={handleChange} rows={2} placeholder="Short teaser paragraph" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Content * <span className="normal-case font-normal text-slate-400">(HTML or Markdown)</span></label>
                  <textarea required name="content" value={form.content} onChange={handleChange} rows={10}
                    placeholder="<p>Full article content…</p>" className={`${inp} font-mono text-xs`} />
                </div>
              </div>

              {/* Media */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Media</p>
                <MediaUploader
                  label="Featured Image"
                  images={form.featuredImage ? [form.featuredImage] : []}
                  onImages={urls => setForm(f => ({ ...f, featuredImage: urls[urls.length - 1] || '' }))}
                  maxImages={1}
                  folder="a1deal/articles"
                />
                <MediaUploader
                  label="Banner Image"
                  images={form.bannerImage ? [form.bannerImage] : []}
                  onImages={urls => setForm(f => ({ ...f, bannerImage: urls[urls.length - 1] || '' }))}
                  maxImages={1}
                  folder="a1deal/articles"
                />
                <MediaUploader
                  label="Gallery Images"
                  images={form.galleryImages}
                  onImages={urls => setForm(f => ({ ...f, galleryImages: urls }))}
                  maxImages={8}
                  folder="a1deal/articles/gallery"
                />
                <MediaUploader
                  label="Video Thumbnail"
                  images={form.videoThumbnail ? [form.videoThumbnail] : []}
                  onImages={urls => setForm(f => ({ ...f, videoThumbnail: urls[urls.length - 1] || '' }))}
                  video={form.featuredVideo}
                  onVideo={url => setForm(f => ({ ...f, featuredVideo: url }))}
                  showVideo
                  maxImages={1}
                  folder="a1deal/articles"
                />
              </div>

              {/* Category */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Category *</label>
                    <input required list="article-categories" name="category" value={form.category} onChange={handleChange}
                      placeholder="e.g. Property Investment" className={inp} />
                    <datalist id="article-categories">
                      {categories.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className={lbl}>Subcategory</label>
                    <input name="subcategory" value={form.subcategory} onChange={handleChange} placeholder="e.g. Luxury Homes" className={inp} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Tags</label>
                  <div className="flex gap-2">
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                      placeholder="Type a tag and press Enter" className={inp} />
                    <button type="button" onClick={addTag}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                      Add
                    </button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.tags.map(t => (
                        <span key={t} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-tertiary/10 text-tertiary font-semibold">
                          #{t}
                          <button type="button" onClick={() => removeTag(t)} className="hover:text-rose-600">
                            <span className="material-icons-outlined text-xs">close</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className={lbl}>Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className={inp}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-tertiary text-white font-bold text-sm hover:bg-[#2e3044] transition disabled:opacity-60">
                  {saving ? 'Saving…' : editId ? 'Update Article' : 'Add Article'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
