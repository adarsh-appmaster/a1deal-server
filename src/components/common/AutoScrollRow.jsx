import { useRef, useEffect } from 'react';

// Horizontal property row that auto-advances on a timer, pauses on hover,
// and exposes prev/next arrows so users can slide through cards manually.
export default function AutoScrollRow({ items, renderItem, cardWidth = 'w-72', gap = 'gap-5', interval = 3000 }) {
  const trackRef = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const el = trackRef.current;
      if (!el || pausedRef.current) return;
      const step = (el.firstElementChild?.offsetWidth || 280) + 20;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, interval);
    return () => clearInterval(timer);
  }, [items, interval]);

  if (!items || items.length === 0) return null;

  function slide(dir) {
    const el = trackRef.current;
    if (!el) return;
    const step = (el.firstElementChild?.offsetWidth || 280) + 20;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => slide(-1)}
        className="absolute left-1 md:left-0 top-1/2 -translate-y-1/2 md:-translate-x-3 z-10 w-9 h-9 rounded-full bg-white/95 shadow-level-2 border border-outline-variant text-on-surface-variant hover:text-primary flex items-center justify-center"
      >
        <span className="material-icons-outlined text-lg">chevron_left</span>
      </button>

      <div
        ref={trackRef}
        className={`flex ${gap} overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar px-1`}
      >
        {items.map((item, i) => (
          <div key={i} className={`flex-shrink-0 snap-start ${cardWidth}`}>
            {renderItem(item, i)}
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => slide(1)}
        className="absolute right-1 md:right-0 top-1/2 -translate-y-1/2 md:translate-x-3 z-10 w-9 h-9 rounded-full bg-white/95 shadow-level-2 border border-outline-variant text-on-surface-variant hover:text-primary flex items-center justify-center"
      >
        <span className="material-icons-outlined text-lg">chevron_right</span>
      </button>
    </div>
  );
}
