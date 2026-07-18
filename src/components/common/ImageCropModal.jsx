import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';

// Lightweight drag-to-pan + zoom-to-crop modal. No external cropper library —
// just canvas math: the viewport (vw x vh) always shows a "cover"-fitted
// window into the source image; dragging pans, the slider zooms. Confirm
// renders the visible window onto an output canvas at the target pixel size.
// The crop viewport is sized to the screen ONCE on open (not on every resize
// event) — mobile browsers fire `resize` constantly as the address bar
// collapses/expands while scrolling, and re-running the load effect on every
// one of those was silently resetting the user's pan/zoom mid-adjustment.
export default function ImageCropModal({ file, aspect = 1, outputWidth, outputHeight, mimeType = 'image/jpeg', title = 'Adjust image', hint, circular = false, previewContext = 'plain', onCancel, onCropped }) {
  const [img, setImg] = useState(null);
  const [scale, setScale] = useState(1);
  const [coverScale, setCoverScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const previewCanvasRef = useRef(null);

  // Measured once, before the image loads — fits the crop box to the current
  // screen without reacting to later resize events.
  const [boxWidth] = useState(() => {
    if (typeof window === 'undefined') return 280;
    const available = Math.min(window.innerWidth - 72, 420);
    return Math.max(200, Math.min(320, available));
  });

  const vw = boxWidth;
  const vh = Math.round(vw / aspect);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const cs = Math.max(vw / image.naturalWidth, vh / image.naturalHeight);
      setImg(image);
      setCoverScale(cs);
      setScale(cs);
      setPos({ x: 0, y: 0 });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const clamp = useCallback((p, s) => {
    if (!img) return p;
    const maxX = Math.max(0, (img.naturalWidth * s - vw) / 2);
    const maxY = Math.max(0, (img.naturalHeight * s - vh) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, p.x)), y: Math.min(maxY, Math.max(-maxY, p.y)) };
  }, [img, vw, vh]);

  const sourceRect = useCallback(() => {
    if (!img) return null;
    return {
      sx: img.naturalWidth / 2 - vw / (2 * scale) - pos.x / scale,
      sy: img.naturalHeight / 2 - vh / (2 * scale) - pos.y / scale,
      sw: vw / scale,
      sh: vh / scale,
    };
  }, [img, vw, vh, scale, pos]);

  // Redraw the live preview (actual pixel output) every time the crop window
  // changes, at high quality so it doesn't look muddy when downscaled.
  useEffect(() => {
    const rect = sourceRect();
    const canvas = previewCanvasRef.current;
    if (!rect || !canvas || !img) return;
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, outputWidth, outputHeight);
    ctx.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, outputWidth, outputHeight);
  }, [img, sourceRect, outputWidth, outputHeight]);

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPos: pos };
  }
  function onPointerMove(e) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(clamp({ x: dragRef.current.startPos.x + dx, y: dragRef.current.startPos.y + dy }, scale));
  }
  function onPointerUp() { dragRef.current = null; }

  function onZoom(e) {
    const s = Number(e.target.value);
    setScale(s);
    setPos((p) => clamp(p, s));
  }

  function confirm() {
    const rect = sourceRect();
    if (!img || !rect) return;
    setProcessing(true);
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, outputWidth, outputHeight);
    canvas.toBlob((blob) => {
      setProcessing(false);
      if (blob) onCropped(blob);
    }, mimeType, 0.92);
  }

  // Preview is sized generously so it's unmistakably clear, and fit to
  // whatever mockup context it's shown inside.
  const previewW = previewContext === 'avatar' ? Math.min(72, vw * 0.32)
    : previewContext === 'header' ? vw - 48
    : circular ? Math.min(140, vw) : vw;
  const previewH = Math.round(previewW / aspect);

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={onCancel}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5 my-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-montserrat font-bold text-slate-800">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        {hint && <p className="text-xs text-slate-400 mb-3">{hint}</p>}

        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Adjust</p>
        <div
          className={`mx-auto overflow-hidden bg-slate-900 select-none touch-none ${circular ? 'rounded-full' : 'rounded-xl'}`}
          style={{ width: vw, height: vh, cursor: img ? 'grab' : 'default' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {img && (
            <img
              src={img.src}
              alt="crop preview"
              draggable={false}
              style={{
                width: img.naturalWidth * scale,
                height: img.naturalHeight * scale,
                position: 'relative',
                left: `calc(50% - ${(img.naturalWidth * scale) / 2}px + ${pos.x}px)`,
                top: `calc(50% - ${(img.naturalHeight * scale) / 2}px + ${pos.y}px)`,
                maxWidth: 'none',
              }}
            />
          )}
        </div>

        {img && (
          <div className="flex items-center gap-2 mt-3">
            <span className="material-icons-outlined text-slate-400 text-base">zoom_out</span>
            <input type="range" min={coverScale} max={coverScale * 3} step={(coverScale * 2) / 100}
              value={scale} onChange={onZoom} className="flex-1 accent-primary" />
            <span className="material-icons-outlined text-slate-400 text-base">zoom_in</span>
          </div>
        )}

        <p className="text-[11px] text-slate-400 text-center mt-2">Drag to reposition · use the slider to zoom</p>

        {/* Live preview — exact pixel output, shown in the same context it'll
            appear on the public broker card so it's obvious what buyers will see. */}
        {img && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2 text-center">Preview — exactly what will be uploaded</p>

            {previewContext === 'header' && (
              <div className="mx-auto rounded-xl overflow-hidden shadow-sm" style={{ width: vw }}>
                <div className="bg-gradient-to-br from-primary via-primary-container to-secondary flex items-center justify-center py-4 px-3">
                  <div className="overflow-hidden rounded-lg bg-white/10" style={{ width: previewW, height: previewH }}>
                    <canvas ref={previewCanvasRef} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }} />
                  </div>
                </div>
                <p className="text-[10px] text-center text-white bg-slate-800 py-1">As it appears on your public card header</p>
              </div>
            )}

            {previewContext === 'avatar' && (
              <div className="mx-auto rounded-xl overflow-hidden shadow-sm" style={{ width: vw }}>
                <div className="bg-gradient-to-br from-primary via-primary-container to-secondary flex items-center gap-3 py-4 px-4">
                  <div className="overflow-hidden rounded-full border-2 border-white/40 flex-shrink-0" style={{ width: previewW, height: previewH }}>
                    <canvas ref={previewCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="h-2.5 w-24 rounded bg-white/70 mb-1.5" />
                    <div className="h-2 w-16 rounded bg-white/40" />
                  </div>
                </div>
                <p className="text-[10px] text-center text-white bg-slate-800 py-1">As it appears on your public card profile</p>
              </div>
            )}

            {previewContext === 'plain' && (
              <div className={`mx-auto overflow-hidden border-2 border-primary/20 bg-white shadow-sm ${circular ? 'rounded-full' : 'rounded-xl'}`}
                style={{ width: previewW, height: previewH }}>
                <canvas ref={previewCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={confirm} disabled={!img || processing}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-container transition disabled:opacity-60">
            {processing ? 'Processing…' : 'Use Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
