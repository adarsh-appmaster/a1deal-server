import logoIcon from '../../assets/logo.svg';
import logoFull from '../../assets/logo-full.svg';

// Mobile: compact icon only
// Desktop (md+): full logo with A1Deal text + tagline
// Dark theme: wraps in white pill so logo stays readable on dark backgrounds

const iconHeights  = { sm: 'h-11', md: 'h-14', lg: 'h-[4.5rem]', xl: 'h-24' };
const fullHeights  = { sm: 'h-16', md: 'h-20', lg: 'h-28', xl: 'h-36' };

export default function Logo({ theme = 'light', size = 'md' }) {
  const iconH = iconHeights[size] || iconHeights.md;
  const fullH  = fullHeights[size]  || fullHeights.md;

  const icon = (
    <img src={logoIcon} alt="A1 Deal" className={`${iconH} w-auto object-contain`} />
  );
  const full = (
    <img src={logoFull} alt="A1 Deal" className={`${fullH} w-auto object-contain`} />
  );

  if (theme === 'dark') {
    const pad = { sm: 'px-3 py-2', md: 'px-4 py-2.5', lg: 'px-5 py-3' }[size] || 'px-4 py-2.5';
    return (
      <>
        {/* Mobile: icon pill */}
        <div className={`md:hidden inline-flex items-center bg-white rounded-2xl shadow-md ${pad}`}>
          {icon}
        </div>
        {/* Desktop: full logo pill */}
        <div className={`hidden md:inline-flex items-center bg-white rounded-2xl shadow-md ${pad}`}>
          {full}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile: compact icon */}
      <span className="md:hidden">{icon}</span>
      {/* Desktop: full logo */}
      <span className="hidden md:inline-block">{full}</span>
    </>
  );
}
