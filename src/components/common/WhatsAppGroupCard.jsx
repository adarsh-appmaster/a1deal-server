import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

// Shows relevant WhatsApp groups for user's city
// type: 'mortgage' | 'unit' | 'both'
export default function WhatsAppGroupCard({ type = 'both', city: propCity }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Endpoint requires auth — skip entirely for guests to avoid a doomed 401 call.
    if (!user) { setLoading(false); return; }
    async function fetch() {
      try {
        const city = propCity || user?.city || '';
        const params = new URLSearchParams();
        if (city) params.set('city', city);
        if (type !== 'both') params.set('type', type);
        const { data } = await api.get(`/whatsapp-groups?${params}`);
        setGroups(data.groups || []);
      } catch { /* empty */ }
      setLoading(false);
    }
    fetch();
  }, [type, propCity, user]);

  if (loading || groups.length === 0) return null;

  const TYPE_INFO = {
    mortgage: { icon: 'gavel',     label: 'Mortgage Property', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    unit:     { icon: 'apartment', label: 'Unit Partnership',  color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200' },
  };

  return (
    <div className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[#25D366] text-xl">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </span>
        <p className="font-semibold text-slate-700 text-sm">Join our WhatsApp Community</p>
      </div>

      <div className="space-y-2">
        {groups.map(g => {
          const info = TYPE_INFO[g.type] || TYPE_INFO.unit;
          return (
            <a key={g._id} href={g.link} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-3 p-3 rounded-xl border ${info.bg} hover:opacity-90 transition`}>
              <span className={`material-icons-outlined text-xl ${info.color}`}>{info.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{g.groupName}</p>
                {g.description && <p className="text-xs text-slate-400 truncate">{g.description}</p>}
              </div>
              <div className="flex items-center gap-1 bg-[#25D366] text-white text-xs font-bold px-2.5 py-1.5 rounded-xl flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Join
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
