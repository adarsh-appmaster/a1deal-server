import { useState, useEffect } from 'react';

// Auto-rotating media slider — cycles through images (and an optional video,
// appended as the last slide) on a timer, with dot navigation and prev/next
// arrows. Falls back to a placeholder icon when there's no media at all.
// Auto-advance pauses while the video slide is active so playback isn't cut off.
export default function ImageSlider({
  images = [],
  video = null,
  alt = '',
  className = 'h-72',
  interval = 4000,
  placeholderIcon = 'apartment',
  overlay = null,
  imgClassName = '',
}) {
  const slides = [
    ...images.map(src => ({ type: 'image', src })),
    ...(video ? [{ type: 'video', src: video }] : []),
  ];
  const count = slides.length;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (count < 2 || slides[index]?.type === 'video') return;
    const timer = setInterval(() => setIndex(i => (i + 1) % count), interval);
    return () => clearInterval(timer);
  }, [count, interval, index, slides]);

  useEffect(() => { setIndex(0); }, [images, video]);

  if (!count) {
    return (
      <div className={`relative w-full ${className} flex items-center justify-center bg-surface-container-high`}>
        <span className="material-icons-outlined text-8xl text-on-surface-variant/20">{placeholderIcon}</span>
        {overlay}
      </div>
    );
  }

  return (
    <div className={`group relative w-full ${className} overflow-hidden bg-surface-container-high`}>
      {slides.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          {s.type === 'video' ? (
            <video src={s.src} controls className={`w-full h-full object-cover bg-black ${imgClassName}`} />
          ) : (
            <img src={s.src} alt={alt} className={`w-full h-full object-cover ${imgClassName}`} />
          )}
        </div>
      ))}
      {overlay}

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={e => { e.stopPropagation(); setIndex(i => (i - 1 + count) % count); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white opacity-70 hover:opacity-100 hover:bg-black/60 transition flex items-center justify-center"
          >
            <span className="material-icons-outlined text-lg">chevron_left</span>
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={e => { e.stopPropagation(); setIndex(i => (i + 1) % count); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white opacity-70 hover:opacity-100 hover:bg-black/60 transition flex items-center justify-center"
          >
            <span className="material-icons-outlined text-lg">chevron_right</span>
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((s, i) => (
              <button
                key={i}
                type="button"
                aria-label={s.type === 'video' ? 'Show video' : `Show image ${i + 1}`}
                onClick={e => { e.stopPropagation(); setIndex(i); }}
                className={`flex items-center justify-center rounded-full transition-all ${
                  s.type === 'video'
                    ? `h-4 w-4 bg-black/40 ${i === index ? 'ring-2 ring-white' : ''}`
                    : `h-1.5 ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`
                }`}
              >
                {s.type === 'video' && <span className="material-icons-outlined text-white" style={{ fontSize: '10px' }}>play_arrow</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
