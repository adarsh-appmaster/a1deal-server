// Resolves the "owner" (who's handling a lead) with priority:
//   explicit handler (assignedTo) → Broker (P1) → Master (P2) → Admin pool.
// Works on enquiry OR site-visit docs that populate assignedTo / assignedBroker /
// assignedMasterBroker. Returns a badge descriptor for consistent rendering.
export function resolveOwner(doc = {}) {
  const { assignedTo, assignedBroker, assignedMasterBroker } = doc;

  if (assignedTo && typeof assignedTo === 'object') {
    if (assignedTo.role === 'broker') {
      return assignedTo.brokerTier === 'master'
        ? owner('master', assignedTo.name)
        : owner('broker', assignedTo.name);
    }
    if (assignedTo.role === 'team')  return owner('team', assignedTo.name);
    if (assignedTo.role === 'admin') return owner('admin', assignedTo.name);
  }
  if (assignedBroker && typeof assignedBroker === 'object') return owner('broker', assignedBroker.name);
  if (assignedMasterBroker && typeof assignedMasterBroker === 'object') return owner('master', assignedMasterBroker.name);
  return owner('unassigned');
}

const STYLES = {
  broker:     { label: 'Broker',     cls: 'bg-blue-100 text-blue-700' },
  master:     { label: 'Master',     cls: 'bg-violet-100 text-violet-700' },
  team:       { label: 'Team',       cls: 'bg-cyan-100 text-cyan-700' },
  admin:      { label: 'Admin',      cls: 'bg-slate-200 text-slate-600' },
  unassigned: { label: 'Unassigned', cls: 'bg-amber-100 text-amber-700' },
};

function owner(role, name = '') {
  const s = STYLES[role] || STYLES.unassigned;
  return { role, name, label: s.label, cls: s.cls };
}
