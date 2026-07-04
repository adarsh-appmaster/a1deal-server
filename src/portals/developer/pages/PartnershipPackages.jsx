const PACKAGES = [
  {
    name: 'Starter', price: '₹2.5L / yr', color: 'from-slate-600 to-slate-800',
    features: ['List up to 5 projects','500 leads/month','Basic analytics','Email support','RERA filing assistance'],
    cta: 'Get Started',
  },
  {
    name: 'Professional', price: '₹6.5L / yr', color: 'from-[#4900e5] to-[#6236ff]', popular: true,
    features: ['Unlimited projects','5,000 leads/month','Advanced analytics','Priority support','Dedicated account manager','Co-marketing opportunities','Legal documentation'],
    cta: 'Most Popular',
  },
  {
    name: 'Enterprise', price: 'Custom', color: 'from-[#1a1d2b] to-[#2d3250]',
    features: ['Unlimited everything','Custom integrations','White-label options','24/7 dedicated support','On-site training','Board-level reporting','Preferred partner badge'],
    cta: 'Contact Sales',
  },
];

export default function PartnershipPackages() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-montserrat font-bold text-2xl text-on-surface mb-2">Partnership Packages</h1>
        <p className="text-on-surface-variant">Choose a plan that fits your portfolio size</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {PACKAGES.map(pkg => (
          <div key={pkg.name} className={`card overflow-hidden ${pkg.popular ? 'ring-2 ring-primary-container' : ''}`}>
            {pkg.popular && (
              <div className="bg-primary-container text-white text-xs font-bold text-center py-1.5">MOST POPULAR</div>
            )}
            <div className={`bg-gradient-to-br ${pkg.color} p-6 text-white`}>
              <h2 className="font-montserrat font-bold text-xl mb-1">{pkg.name}</h2>
              <p className="text-3xl font-bold">{pkg.price}</p>
            </div>
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                {pkg.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-on-surface">
                    <span className="material-icons-outlined text-emerald-600 text-base mt-0.5">check_circle</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button className={pkg.popular ? 'btn-primary w-full' : 'btn-ghost w-full'}>
                {pkg.cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 max-w-2xl mx-auto text-center">
        <h3 className="font-montserrat font-semibold text-on-surface mb-2">Need a Custom Solution?</h3>
        <p className="text-sm text-on-surface-variant mb-4">Our enterprise team will design a plan tailored to your portfolio and business goals.</p>
        <button className="btn-primary">Talk to Our Team</button>
      </div>
    </div>
  );
}
