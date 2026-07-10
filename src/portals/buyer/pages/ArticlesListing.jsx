import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import { Pagination } from '../../../components/common/Pagination';

const LIMIT = 9;

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ArticlesListing() {
  const [articles, setArticles] = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);

  const [search, setSearch]     = useState('');
  const [inputVal, setInputVal] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories]         = useState([]);

  const fetchArticles = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (search) params.set('q', search);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const { data } = await api.get(`/articles?${params}`);
      setArticles(data.articles || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch { /* empty */ }
    setLoading(false);
  }, [search, categoryFilter]);

  useEffect(() => { fetchArticles(1); }, [fetchArticles]);
  useEffect(() => {
    api.get('/articles/categories').then(({ data }) => setCategories(data.categories || [])).catch(() => { /* empty */ });
  }, []);

  function handleSearch(e) { e.preventDefault(); setSearch(inputVal.trim()); }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-montserrat font-bold text-2xl text-slate-800">Articles &amp; Guides</h1>
        <p className="text-slate-500 text-sm mt-1">Real estate tips, market news and buying guides</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4 max-w-lg">
        <div className="relative flex-1">
          <span className="material-icons-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm">search</span>
          <input value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder="Search articles…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <button type="submit" className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition">
          Search
        </button>
      </form>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
              ${categoryFilter === 'all' ? 'bg-primary text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
            All
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                ${categoryFilter === c ? 'bg-primary text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-icons-outlined text-3xl animate-spin text-primary">progress_activity</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <span className="material-icons-outlined text-5xl text-slate-200">article</span>
          <p className="text-slate-400 mt-3">No articles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map(a => (
            <Link key={a._id} to={`/buyer/articles/${a.slug}`}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              {a.featuredImage ? (
                <div className="h-40 bg-slate-100">
                  <img src={a.featuredImage} alt={a.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                  <span className="material-icons-outlined text-slate-300 text-3xl">article</span>
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                {a.category && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary self-start mb-2">{a.category}</span>
                )}
                <h3 className="font-montserrat font-bold text-slate-800 leading-tight line-clamp-2 mb-1">{a.title}</h3>
                {(a.shortDescription || a.excerpt) && (
                  <p className="text-sm text-slate-500 line-clamp-2 flex-1">{a.shortDescription || a.excerpt}</p>
                )}
                <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-50">
                  <span>{a.author?.name || 'A1 Deal'}</span>
                  <span>{formatDate(a.publishedAt || a.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Pagination currentPage={page} totalPages={pages} totalItems={total} itemsPerPage={LIMIT} onPageChange={p => fetchArticles(p)} />
      </div>
    </div>
  );
}
