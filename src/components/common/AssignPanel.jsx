/**
 * Reusable assignment panel used in both AdminPropertyEnquiries and AdminSiteVisits.
 *
 * Props:
 *   me              — logged-in admin user { _id, name }
 *   assignTo        — currently selected assignee ID
 *   onAssignTo      — setter fn
 *   pincodeMatches  — { broker, masterBroker } from backend (pincode-exact matches)
 *   teamMembers     — array of team member objects
 *   onAssign        — async fn called when "Assign" button is clicked
 *   saving          — bool
 *   note            — assignment note string (optional, enquiry only)
 *   onNote          — note setter fn (optional)
 *   label           — section label string (default "Assign To")
 */
import { useState } from 'react';

const AVATAR_COLORS = [
  'bg-violet-500','bg-rose-500','bg-sky-500','bg-emerald-500',
  'bg-amber-500','bg-cyan-500','bg-fuchsia-500','bg-indigo-500',
];
function colorFor(id = '') {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
}

function PersonCard({ person, roleLabel, badge, selected, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(person._id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition
        ${selected
          ? 'border-[#484a5a] bg-[#484a5a]/5 ring-1 ring-[#484a5a]/20'
          : 'border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-white'}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${colorFor(person._id)}`}>
        {initials(person.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{person.name}</p>
        <p className="text-xs text-slate-400 truncate">{person.phone || person.email || person.city || ''}</p>
      </div>
      {badge && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>
          {badge.label}
        </span>
      )}
      {roleLabel && (
        <span className="text-[10px] font-semibold text-slate-400 flex-shrink-0">{roleLabel}</span>
      )}
      {selected && (
        <span className="material-icons-outlined text-[#484a5a] text-base flex-shrink-0">check_circle</span>
      )}
    </button>
  );
}

export default function AssignPanel({
  me, assignTo, onAssignTo,
  pincodeMatches = null,
  teamMembers = [],
  onAssign, saving,
  note, onNote,
  label = 'Assign To',
}) {
  const [search, setSearch] = useState('');

  const hasPincode = pincodeMatches && (pincodeMatches.broker || pincodeMatches.masterBroker);

  const filteredTeam = teamMembers.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.phone?.includes(q) || t.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>

      {/* 1 — Myself */}
      <div>
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Myself</p>
        <PersonCard
          person={{ _id: 'self', name: me?.name || 'Admin', phone: 'Admin account' }}
          badge={{ label: 'You', cls: 'bg-slate-100 text-slate-500' }}
          selected={assignTo === 'self'}
          onSelect={onAssignTo}
        />
      </div>

      {/* 2 — Pincode-matched broker / master broker */}
      {hasPincode && (
        <div>
          <p className="text-[10px] font-bold text-[#484a5a]/60 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span className="material-icons-outlined text-xs">my_location</span>
            Pincode-matched
          </p>
          <div className="space-y-1.5">
            {pincodeMatches.broker && (
              <PersonCard
                person={pincodeMatches.broker}
                roleLabel="Broker"
                badge={{ label: 'Auto-matched', cls: 'bg-blue-100 text-blue-700' }}
                selected={assignTo === pincodeMatches.broker._id}
                onSelect={onAssignTo}
              />
            )}
            {pincodeMatches.masterBroker && (
              <PersonCard
                person={pincodeMatches.masterBroker}
                roleLabel="Master Broker"
                badge={{ label: 'Auto-matched', cls: 'bg-violet-100 text-violet-700' }}
                selected={assignTo === pincodeMatches.masterBroker._id}
                onSelect={onAssignTo}
              />
            )}
          </div>
        </div>
      )}

      {/* 3 — Team members */}
      <div>
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Team Members</p>
        {teamMembers.length === 0 ? (
          <p className="text-xs text-slate-400 italic px-1">No active team members found.</p>
        ) : (
          <>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-[#484a5a]/20" />
            <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5">
              {filteredTeam.length === 0
                ? <p className="text-xs text-slate-400 italic px-1">No results.</p>
                : filteredTeam.map(t => (
                    <PersonCard
                      key={t._id}
                      person={t}
                      badge={t.status === 'active'
                        ? { label: 'Active', cls: 'bg-emerald-100 text-emerald-700' }
                        : { label: t.status, cls: 'bg-slate-100 text-slate-500' }}
                      selected={assignTo === t._id}
                      onSelect={onAssignTo}
                    />
                  ))
              }
            </div>
          </>
        )}
      </div>

      {/* Assignment note (enquiry only) */}
      {onNote !== undefined && (
        <input value={note || ''} onChange={e => onNote(e.target.value)}
          placeholder="Assignment note (optional)…"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#484a5a]/30" />
      )}

      <button onClick={onAssign} disabled={!assignTo || saving}
        className="w-full py-2.5 rounded-xl bg-[#484a5a] text-white font-bold text-sm hover:bg-[#2e3044] transition disabled:opacity-60 flex items-center justify-center gap-2">
        {saving
          ? <><span className="material-icons-outlined text-base animate-spin">progress_activity</span>Saving…</>
          : <><span className="material-icons-outlined text-base">person_add</span>Assign Lead</>
        }
      </button>
    </div>
  );
}
