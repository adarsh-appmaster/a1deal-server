import { useState } from 'react';

const ROLES = ['Admin', 'Developer', 'Broker', 'Team', 'Buyer', 'Bank', 'Investor'];

const PERMISSIONS = [
  { group: 'Properties', items: ['View Listings', 'Create Listing', 'Edit Listing', 'Delete Listing', 'Feature Listing'] },
  { group: 'Users', items: ['View Users', 'Invite Users', 'Edit Users', 'Suspend Users', 'Delete Users'] },
  { group: 'Leads', items: ['View Leads', 'Assign Leads', 'Export Leads', 'Delete Leads'] },
  { group: 'Finance', items: ['View Revenue', 'Process Payments', 'Issue Refunds', 'Download Reports'] },
  { group: 'System', items: ['System Settings', 'API Access', 'Audit Logs', 'Role Management'] },
];

const DEFAULT_MATRIX = {
  Admin: { all: true },
  Developer: {
    'View Listings': true, 'Create Listing': true, 'Edit Listing': true, 'Feature Listing': true,
    'View Leads': true, 'View Revenue': true, 'Download Reports': true,
  },
  Broker: {
    'View Listings': true, 'View Leads': true, 'Assign Leads': true,
  },
  Team: {
    'View Listings': true, 'View Leads': true, 'Assign Leads': true,
    'View Revenue': true,
  },
  Buyer: { 'View Listings': true },
  Bank: { 'View Listings': true, 'View Leads': true, 'View Revenue': true, 'Process Payments': true },
  Investor: { 'View Listings': true, 'View Revenue': true, 'Download Reports': true },
};

export default function RolePermissions() {
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);
  const [activeRole, setActiveRole] = useState('Developer');
  const [saved, setSaved] = useState(false);

  const has = (role, perm) => matrix[role]?.all || !!matrix[role]?.[perm];

  const toggle = (role, perm) => {
    setMatrix(m => ({
      ...m,
      [role]: {
        ...m[role],
        [perm]: !has(role, perm),
      },
    }));
    setSaved(false);
  };

  const handleSave = () => setSaved(true);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Role & Permissions</h1>
          <p className="text-on-surface-variant text-sm">Configure access rights per user role</p>
        </div>
        <button onClick={handleSave} className={`btn-primary text-sm ${saved ? '!bg-emerald-600' : ''}`}>
          {saved ? (
            <span className="flex items-center gap-1"><span className="material-icons-outlined text-base">check</span> Saved</span>
          ) : 'Save Changes'}
        </button>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 flex-wrap">
        {ROLES.map(r => (
          <button
            key={r}
            onClick={() => setActiveRole(r)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${activeRole === r ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
          >
            {r}
            {r === 'Admin' && <span className="ml-1 text-xs opacity-70">(full)</span>}
          </button>
        ))}
      </div>

      {/* Permission matrix */}
      <div className="space-y-4">
        {PERMISSIONS.map(group => (
          <div key={group.group} className="card p-5">
            <h2 className="font-montserrat font-semibold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-icons-outlined text-primary-container text-xl">
                {group.group === 'Properties' ? 'apartment' : group.group === 'Users' ? 'manage_accounts' : group.group === 'Leads' ? 'people' : group.group === 'Finance' ? 'payments' : 'settings'}
              </span>
              {group.group}
            </h2>
            <div className="space-y-2">
              {group.items.map(perm => {
                const enabled = has(activeRole, perm);
                const isAdmin = activeRole === 'Admin';
                return (
                  <div key={perm} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${enabled ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`material-icons-outlined text-base ${enabled ? 'text-primary-container' : 'text-on-surface-variant'}`}>
                        {enabled ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span className={`text-sm font-medium ${enabled ? 'text-on-surface' : 'text-on-surface-variant'}`}>{perm}</span>
                    </div>
                    <button
                      onClick={() => !isAdmin && toggle(activeRole, perm)}
                      disabled={isAdmin}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-primary' : 'bg-surface-container-high'} ${isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* All roles matrix (desktop overview) */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-outline-variant">
          <h2 className="font-montserrat font-semibold text-on-surface">Permissions Matrix Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Permission</th>
                {ROLES.map(r => (
                  <th key={r} className="px-3 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide text-center">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {PERMISSIONS.flatMap(g => g.items).map(perm => (
                <tr key={perm} className="hover:bg-surface-container-low">
                  <td className="px-4 py-2.5 text-on-surface-variant">{perm}</td>
                  {ROLES.map(role => (
                    <td key={role} className="px-3 py-2.5 text-center">
                      {has(role, perm)
                        ? <span className="material-icons-outlined text-emerald-600 text-base">check_circle</span>
                        : <span className="material-icons-outlined text-outline text-base">remove</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
