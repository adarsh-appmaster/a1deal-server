import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../../api/axios';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CONTENT_CLASSES = [
  'text-slate-700', 'leading-relaxed',
  '[&_p]:mb-4',
  '[&_h2]:font-montserrat', '[&_h2]:font-bold', '[&_h2]:text-xl', '[&_h2]:text-slate-800', '[&_h2]:mt-6', '[&_h2]:mb-2',
  '[&_h3]:font-montserrat', '[&_h3]:font-bold', '[&_h3]:text-lg', '[&_h3]:text-slate-800', '[&_h3]:mt-4', '[&_h3]:mb-2',
  '[&_ul]:list-disc', '[&_ul]:pl-5', '[&_ul]:mb-4',
  '[&_ol]:list-decimal', '[&_ol]:pl-5', '[&_ol]:mb-4',
  '[&_a]:text-primary', '[&_a]:underline',
  '[&_strong]:font-semibold',
  '[&_img]:rounded-xl', '[&_img]:my-4',
].join(' ');

export default function ArticleDetail() {
  const { slug }  = useParams();
  const navigate  = useNavigate();
  const [article, setArticle]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.get(`/articles/${slug}`)
      .then(r => setArticle(r.data.article))
      .catch(err => { if (err.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-4 animate-pulse">
        <div className="h-6 w-24 bg-slate-100 rounded" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="h-6 w-2/3 bg-slate-100 rounded" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <span className="material-icons-outlined text-6xl text-slate-200 mb-4">article</span>
        <h2 className="font-montserrat font-bold text-xl text-slate-700 mb-2">Article not found</h2>
        <p className="text-slate-500 mb-6">This article may have been removed or unpublished.</p>
        <button onClick={() => navigate('/buyer/articles')}
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition">
          Back to Articles
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary mb-6 transition-colors">
        <span className="material-icons-outlined text-sm">arrow_back</span>Back
      </button>

      {article.category && (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">{article.category}</span>
      )}
      <h1 className="font-montserrat font-bold text-2xl md:text-3xl text-slate-800 mt-3 mb-2">{article.title}</h1>
      {article.shortDescription && (
        <p className="text-slate-500 text-base mb-4">{article.shortDescription}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-slate-400 mb-6">
        <span className="flex items-center gap-1">
          <span className="material-icons-outlined text-xs">person</span>
          {article.author?.name || 'A1 Deal'}
        </span>
        <span>·</span>
        <span>{formatDate(article.publishedAt || article.createdAt)}</span>
      </div>

      {(article.bannerImage || article.featuredImage) && (
        <img src={article.bannerImage || article.featuredImage} alt={article.title}
          className="w-full h-64 md:h-96 object-cover rounded-2xl mb-6" />
      )}

      {article.featuredVideo && (
        <video src={article.featuredVideo} controls poster={article.videoThumbnail || undefined}
          className="w-full rounded-2xl mb-6 bg-black" />
      )}

      <div className={CONTENT_CLASSES} dangerouslySetInnerHTML={{ __html: article.content }} />

      {article.galleryImages?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8">
          {article.galleryImages.map((img, i) => (
            <img key={i} src={img} alt={`${article.title} photo ${i + 1}`} className="w-full h-32 object-cover rounded-xl" />
          ))}
        </div>
      )}

      {article.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100">
          {article.tags.map(t => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">#{t}</span>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link to="/buyer/articles" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
          <span className="material-icons-outlined text-sm">arrow_back</span>
          Back to all articles
        </Link>
      </div>
    </div>
  );
}
