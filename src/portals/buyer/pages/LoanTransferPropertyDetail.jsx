import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import EnquiryModal from '../../../components/common/EnquiryModal';

const STATUS_COLOR = {
  available:    'bg-emerald-100 text-emerald-800',
  under_process:'bg-amber-100 text-amber-800',
  transferred:  'bg-slate-100 text-slate-500',
};
const STATUS_LABEL = {
  available:    'Available',
  under_process:'Under Process',
  transferred:  'Transferred',
};

function formatPrice(n) {
  if (!n && n !== 0) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function LockedField({ placeholder, onUnlock }) {
  return (
    <button type="button" onClick={onUnlock}
      className="relative inline-flex items-center gap-1 group">
      <span className="blur-sm select-none text-slate-700 text-sm font-medium pointer-events-none">
        {placeholder || '••••••••'}
      </span>
      <span className="absolute inset-0 flex items-center justify-center gap-1 text-xs font-semibold text-[#4900e5] opacity-0 group-hover:opacity-100 transition bg-white/60 rounded px-1">
        <span className="material-icons-outlined text-sm">lock_open</span>
        Login
      </span>
      <span className="material-icons-outlined text-sm text-slate-400 group-hover:text-[#4900e5] transition">lock</span>
    </button>
  );
}

function LoginPrompt({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-full bg-[#4900e5]/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-icons-outlined text-[#4900e5] text-2xl">lock</span>
        </div>
        <h3 className="font-montserrat font-bold text-lg text-slate-800 mb-2">Sign in to unlock full details</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Create a free account to view the outstanding loan amount, pincode, and connect with our team.
        </p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/signup')}
            className="flex-1 py-2.5 rounded-xl bg-[#4900e5] text-white font-semibold text-sm hover:bg-[#6236ff] transition">
            Sign Up Free
          </button>
          <button onClick={() => navigate('/login')}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition">
            Sign In
          </button>
        </div>
        <button onClick={onClose} className="mt-3 text-xs text-slate-400 hover:text-slate-600">Continue browsing</button>
      </div>
    </div>
  );
}

export default function LoanTransferPropertyDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isGuest   = !user;

  const [property, setProperty]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showLogin, setShowLogin]     = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/loan-transfer/public/${id}`)
      .then(r => setProperty(r.data.property))
      .catch(err => { if (err.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-4 animate-pulse">
        <div className="h-6 w-28 bg-slate-100 rounded" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-48 bg-slate-100 rounded-2xl" />
          <div className="h-48 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <span className="material-icons-outlined text-6xl text-slate-200 mb-4">swap_horiz</span>
        <h2 className="font-montserrat font-bold text-xl text-slate-700 mb-2">Property not found</h2>
        <p className="text-slate-500 mb-6">This listing may have been removed or is no longer available.</p>
        <button onClick={() => navigate('/buyer/loan-transfer')}
          className="px-5 py-2.5 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition">
          Back to Loan Transfer
        </button>
      </div>
    );
  }

  const location = [property.area, property.city].filter(Boolean).join(', ');

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#4900e5] mb-6 transition-colors">
          <span className="material-icons-outlined text-sm">arrow_back</span>Back
        </button>

        {isGuest && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
            <span className="material-icons-outlined text-emerald-600 text-base">info</span>
            <span className="text-emerald-800 flex-1">Some details are hidden. <strong>Sign in to see the full loan breakdown.</strong></span>
            <button onClick={() => setShowLogin(true)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#4900e5] text-white text-xs font-semibold hover:bg-[#6236ff] transition">
              Sign In
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero */}
            {property.images?.[0] && (
              <div className="rounded-2xl overflow-hidden border border-slate-100 h-56">
                <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Header card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLOR[property.status] || 'bg-slate-100 text-slate-500'}`}>
                      {STATUS_LABEL[property.status] || property.status}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#4900e5]/10 text-[#4900e5] capitalize">
                      {property.propertyType?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h1 className="font-montserrat font-bold text-2xl text-slate-800">{property.title}</h1>
                  <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                    <span className="material-icons-outlined text-sm">location_on</span>
                    {location || '—'}
                    {property.pincode && (
                      isGuest
                        ? <span className="ml-1"><LockedField placeholder="— ——" onUnlock={() => setShowLogin(true)} /></span>
                        : <span className="ml-1">– {property.pincode}</span>
                    )}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400 mb-0.5">Asking Price</p>
                  <p className="font-montserrat font-bold text-2xl text-[#4900e5]">{formatPrice(property.askingPrice)}</p>
                </div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl mb-5">
                {[
                  property.bedrooms  > 0 && { icon: 'bed',         label: 'Bedrooms',  val: `${property.bedrooms} BHK` },
                  property.areaSqft  > 0 && { icon: 'square_foot', label: 'Area',      val: `${property.areaSqft.toLocaleString()} sqft` },
                  property.loanBank       && { icon: 'account_balance', label: 'Bank',  val: property.loanBank },
                  property.interestRate   && { icon: 'percent',     label: 'Rate',      val: `${property.interestRate}% p.a.` },
                ].filter(Boolean).map(d => (
                  <div key={d.label} className="text-center">
                    <span className="material-icons-outlined text-[#4900e5] text-xl">{d.icon}</span>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5">{d.val}</p>
                    <p className="text-xs text-slate-400">{d.label}</p>
                  </div>
                ))}
              </div>

              {property.description && (
                <>
                  <h2 className="font-montserrat font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wide">About This Property</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">{property.description}</p>
                </>
              )}
            </div>

            {/* Loan breakdown */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h2 className="font-montserrat font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="material-icons-outlined text-[#4900e5]">account_balance</span>
                Loan Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Asking Price',      val: formatPrice(property.askingPrice),           visible: true },
                  { label: 'Outstanding Loan',  val: formatPrice(property.outstandingLoanAmount), visible: !isGuest, locked: isGuest },
                  { label: 'Monthly EMI',       val: property.monthlyEmi ? `₹${property.monthlyEmi.toLocaleString('en-IN')}` : '—', visible: true },
                  { label: 'Interest Rate',     val: property.interestRate ? `${property.interestRate}% p.a.` : '—', visible: true },
                  { label: 'Tenure Remaining',  val: property.tenureRemainingMonths ? `${property.tenureRemainingMonths} months` : '—', visible: true },
                  { label: 'Loan Bank',         val: property.loanBank || '—', visible: true },
                ].map(r => (
                  <div key={r.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">{r.label}</p>
                    {r.locked
                      ? <LockedField placeholder="₹•• L" onUnlock={() => setShowLogin(true)} />
                      : <p className="font-semibold text-slate-800 text-sm">{r.val}</p>
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Required docs */}
            {property.requiredDocs?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h2 className="font-montserrat font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="material-icons-outlined text-amber-500">description</span>
                  Documents Required
                </h2>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2">
                  {property.requiredDocs.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="material-icons-outlined text-amber-500 text-sm">task_alt</span>
                      {doc}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">Our team will guide you through document submission after your enquiry.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* CTA */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
              <div className="text-center mb-2">
                <p className="font-montserrat font-bold text-lg text-slate-800">{formatPrice(property.askingPrice)}</p>
                <p className="text-xs text-slate-400">Asking Price</p>
              </div>
              <button
                onClick={() => setShowEnquiry(true)}
                disabled={property.status === 'transferred'}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2
                  ${property.status === 'transferred'
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-[#4900e5] text-white hover:bg-[#6236ff]'}`}>
                <span className="material-icons-outlined text-sm">contact_support</span>
                {property.status === 'transferred' ? 'Already Transferred' : 'Express Interest / Enquire'}
              </button>
              <button
                onClick={() => isGuest ? setShowLogin(true) : navigate(`/buyer/visit/${property._id}`, {
                  state: { propertyTitle: property.title, city: property.city, area: property.area, propertyModel: 'LoanTransferProperty' },
                })}
                className="w-full py-2.5 px-4 rounded-xl border border-[#4900e5] text-[#4900e5] font-semibold text-sm hover:bg-[#4900e5]/5 transition flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-sm">event</span>
                Schedule Site Visit
              </button>
              {isGuest && (
                <button onClick={() => setShowLogin(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#4900e5] text-[#4900e5] font-semibold text-sm hover:bg-[#4900e5]/5 transition">
                  Sign In for Full Details
                </button>
              )}
              <p className="text-xs text-slate-400 text-center">Our team handles the entire loan transfer process for you.</p>
            </div>

            {/* Property summary */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-montserrat font-semibold text-slate-800 mb-3 text-sm">Summary</h3>
              {[
                property.propertyType     && { label: 'Type',     value: property.propertyType?.replace(/_/g, ' '), locked: false },
                property.status           && { label: 'Status',   value: STATUS_LABEL[property.status] || property.status, locked: false },
                property.loanBank         && { label: 'Bank',     value: property.loanBank, locked: false },
                property.interestRate     && { label: 'Rate',     value: `${property.interestRate}%`, locked: false },
                property.pincode          && { label: 'Pincode',  value: property.pincode, locked: isGuest },
              ].filter(Boolean).map(r => (
                <div key={r.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-400">{r.label}</span>
                  {r.locked
                    ? <LockedField placeholder="••••••" onUnlock={() => setShowLogin(true)} />
                    : <span className="text-xs font-semibold text-slate-800 capitalize">{r.value}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}

      {showEnquiry && (
        <EnquiryModal
          onClose={() => setShowEnquiry(false)}
          property={{ _id: property._id, _model: 'LoanTransferProperty', title: property.title, city: property.city, area: property.area }}
        />
      )}
    </>
  );
}
