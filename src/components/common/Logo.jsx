import logoIcon from '../../assets/logo.png';
import logoFull from '../../assets/logo-full.png';

// Mobile: compact icon only
// Desktop (md+): full logo with A1Deal text + tagline
// Dark theme: wraps in white pill so logo stays readable on dark backgrounds

const iconHeights  = { sm: 'h-8',  md: 'h-11', lg: 'h-14', xl: 'h-16' };
const fullHeights  = { sm: 'h-12', md: 'h-16', lg: 'h-20', xl: 'h-24' };

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
    const pad = { sm: 'px-2 py-1', md: 'px-3 py-1.5', lg: 'px-4 py-2' }[size] || 'px-3 py-1.5';
    return (
      <>
        {/* Mobile: icon pill */}
        <div className={`md:hidden inline-flex items-center bg-white rounded-xl ${pad}`}>
          {icon}
        </div>
        {/* Desktop: full logo pill */}
        <div className={`hidden md:inline-flex items-center bg-white rounded-xl ${pad}`}>
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
