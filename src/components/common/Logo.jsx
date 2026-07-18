import logoIcon from '../../assets/logo.svg';
import logoFull from '../../assets/logo-full.svg';

// variant="compact" (default): icon-only on mobile, full logo on desktop (md+)
// variant="full": full "A1 Deal" artwork on every breakpoint (smaller on mobile)
// Dark theme: wraps in a white pill so the logo stays readable on dark backgrounds

const iconHeights       = { sm: 'h-12', md: 'h-14', lg: 'h-15', xl: 'h-16' };
const fullHeights       = { sm: 'h-16', md: 'h-20', lg: 'h-24', xl: 'h-28' };
// Full artwork sized to fit a mobile header row.
const fullMobileHeights = { sm: 'h-10', md: 'h-12', lg: 'h-13', xl: 'h-14' };

export default function Logo({ variant = 'compact', theme = 'light', size = 'md' }) {
  const iconH       = iconHeights[size] || iconHeights.md;
  const fullH       = fullHeights[size] || fullHeights.md;
  const fullMobileH = fullMobileHeights[size] || fullMobileHeights.md;

  const icon = (
    <img src={logoIcon} alt="A1 Deal" className={`${iconH} w-auto object-contain`} />
  );
  const fullDesktop = (
    <img src={logoFull} alt="A1 Deal" className={`${fullH} w-auto object-contain`} />
  );
  const fullMobile = (
    <img src={logoFull} alt="A1 Deal" className={`${fullMobileH} w-auto object-contain`} />
  );

  if (theme === 'dark') {
    const pad = { sm: 'px-3 py-2', md: 'px-4 py-2.5', lg: 'px-5 py-3' }[size] || 'px-4 py-2.5';
    return (
      <>
        <div className={`md:hidden inline-flex items-center bg-white rounded-2xl shadow-md ${pad}`}>
          {variant === 'full' ? fullMobile : icon}
        </div>
        <div className={`hidden md:inline-flex items-center bg-white rounded-2xl shadow-md ${pad}`}>
          {fullDesktop}
        </div>
      </>
    );
  }

  return (
    <>
      <span className="md:hidden inline-flex items-center">{variant === 'full' ? fullMobile : icon}</span>
      <span className="hidden md:inline-block">{fullDesktop}</span>
    </>
  );
}
