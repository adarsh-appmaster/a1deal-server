import { useNavigate, useParams } from 'react-router-dom';

const BUILDERS = {
  1: {
    name: 'Prestige Group',
    tagline: 'Building Trust Since 1986',
    logo: 'business',
    city: 'Bangalore',
    established: '1986',
    completedProjects: 247,
    ongoingProjects: 12,
    totalUnits: '84,000+',
    rating: 4.8,
    reviews: 1240,
    about: 'Prestige Group is one of India\'s most respected real estate developers with a 37-year legacy of delivering landmark residential, commercial, and hospitality projects across 12 cities.',
    certifications: ['ISO 9001:2015', 'RERA Certified', 'Green Building Council'],
    projects: [
      { id: 1, name: 'Skyline Residences', location: 'Bandra West, Mumbai', price: '₹2.4 Cr', status: 'Ready to Move', units: 240, type: 'Apartment' },
      { id: 4, name: 'Prestige Grand', location: 'Jubilee Hills, Hyderabad', price: '₹5.2 Cr', status: 'Ready to Move', units: 80, type: 'Penthouse' },
      { id: 7, name: 'Prestige Lakeside', location: 'Whitefield, Bangalore', price: '₹1.8 Cr', status: 'New Launch', units: 320, type: 'Apartment' },
    ],
    contact: { phone: '+91 80 2546 0101', email: 'sales@prestigegroup.com', website: 'www.prestigegroup.com' },
  },
};

const DEFAULT = BUILDERS[1];

export default function BuilderProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const builder = BUILDERS[id] || DEFAULT;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-6">
        <button onClick={() => navigate('/buyer')} className="hover:text-primary">Home</button>
        <span className="material-icons-outlined text-sm">chevron_right</span>
        <span className="text-on-surface">Builder Profile</span>
      </nav>

      {/* Header card */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-icons-outlined text-primary text-4xl">{builder.logo}</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-montserrat font-bold text-2xl text-on-surface">{builder.name}</h1>
                <p className="text-on-surface-variant text-sm mt-1">{builder.tagline}</p>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <span className="flex items-center gap-1 text-sm text-on-surface-variant">
                    <span className="material-icons-outlined text-base">location_on</span>{builder.city}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-on-surface-variant">
                    <span className="material-icons-outlined text-base">calendar_today</span>Est. {builder.established}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-amber-500">
                    <span className="material-icons-outlined text-base">star</span>
                    {builder.rating} <span className="text-on-surface-variant">({builder.reviews.toLocaleString()} reviews)</span>
                  </span>
                </div>
              </div>
              <button onClick={() => navigate('/buyer/search')} className="btn-primary text-sm py-2 px-5">
                View All Projects
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-outline-variant">
          {[
            { label: 'Completed Projects', value: builder.completedProjects, icon: 'check_circle' },
            { label: 'Ongoing Projects', value: builder.ongoingProjects, icon: 'construction' },
            { label: 'Total Units Delivered', value: builder.totalUnits, icon: 'home' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <span className="material-icons-outlined text-primary text-2xl block mb-1">{s.icon}</span>
              <p className="font-montserrat font-bold text-xl text-on-surface">{s.value}</p>
              <p className="text-xs text-on-surface-variant">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-montserrat font-bold text-xl text-on-surface">Active Projects</h2>
          {builder.projects.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/buyer/property/${p.id}`)}
              className="card p-4 cursor-pointer hover:shadow-level-3 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-outlined text-on-surface-variant text-2xl">apartment</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-on-surface">{p.name}</h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">{p.location}</p>
                    </div>
                    <span className={`portal-badge text-xs ${p.status === 'Ready to Move' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{p.status}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-on-surface-variant">
                    <span>{p.type}</span>
                    <span>·</span>
                    <span>{p.units} units</span>
                    <span>·</span>
                    <span className="font-semibold text-primary-container">{p.price}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Certifications */}
          <div className="card p-5">
            <h3 className="font-montserrat font-semibold text-on-surface mb-4">Certifications</h3>
            <div className="space-y-2">
              {builder.certifications.map(c => (
                <div key={c} className="flex items-center gap-2">
                  <span className="material-icons-outlined text-emerald-600 text-base">verified</span>
                  <span className="text-sm text-on-surface">{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="card p-5">
            <h3 className="font-montserrat font-semibold text-on-surface mb-3">About</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">{builder.about}</p>
          </div>

          {/* Contact */}
          <div className="card p-5">
            <h3 className="font-montserrat font-semibold text-on-surface mb-4">Contact</h3>
            <div className="space-y-3">
              {[
                { icon: 'phone', value: builder.contact.phone },
                { icon: 'email', value: builder.contact.email },
                { icon: 'language', value: builder.contact.website },
              ].map(c => (
                <div key={c.icon} className="flex items-center gap-3">
                  <span className="material-icons-outlined text-primary text-base">{c.icon}</span>
                  <span className="text-sm text-on-surface">{c.value}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary w-full mt-4 text-sm py-2.5">
              Get in Touch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
