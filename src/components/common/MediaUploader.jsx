import { useState, useRef, useCallback } from 'react';
import api from '../../api/axios';

/**
 * MediaUploader — handles image + optional video uploads via Cloudinary.
 *
 * Props:
 *   images   : string[]         — current image URLs (controlled)
 *   onImages : (urls) => void   — called when images list changes
 *   video    : string           — current video URL (controlled)
 *   onVideo  : (url) => void    — called when video changes
 *   folder   : string           — cloudinary folder (default: 'a1deal/properties')
 *   maxImages: number           — max images allowed (default: 10)
 *   showVideo: boolean          — show video upload section (default: false)
 */
export default function MediaUploader({
  images = [],
  onImages,
  video = '',
  onVideo,
  folder = 'a1deal/properties',
  maxImages = 10,
  showVideo = false,
  label = 'Property Images',
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [videoDragActive, setVideoDragActive] = useState(false);
  const imgInputRef = useRef(null);
  const vidInputRef = useRef(null);

  const uploadImages = useCallback(async (files) => {
    if (!files.length) return;
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setError(`Max ${maxImages} images allowed.`);
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    setError('');
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      toUpload.forEach(f => fd.append('images', f));
      fd.append('folder', folder);
      fd.append('crop', 'fill');
      fd.append('width', '1200');
      fd.append('height', '800');

      const { data } = await api.post('/upload/images', fd, {
        headers: { 'Content-Type': undefined },  // let axios set boundary automatically
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      onImages([...images, ...data.urls.map(u => u.url)]);
    } catch (err) {
      setError(err.response?.data?.message || 'Image upload failed.');
    } finally {
      setUploading(false);
      setProgress(0);
      if (imgInputRef.current) imgInputRef.current.value = '';
    }
  }, [images, onImages, folder, maxImages]);

  const uploadVideo = useCallback(async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Video must be under 10 MB.');
      if (vidInputRef.current) vidInputRef.current.value = '';
      return;
    }
    setError('');
    setUploadingVideo(true);
    setVideoProgress(0);
    try {
      const fd = new FormData();
      fd.append('video', file);
      fd.append('folder', folder.replace('properties', 'videos'));

      const { data } = await api.post('/upload/video', fd, {
        headers: { 'Content-Type': undefined },  // let axios set boundary automatically
        onUploadProgress: (e) => {
          setVideoProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      onVideo(data.url);
    } catch (err) {
      setError(err.response?.data?.message || 'Video upload failed.');
    } finally {
      setUploadingVideo(false);
      setVideoProgress(0);
      if (vidInputRef.current) vidInputRef.current.value = '';
    }
  }, [onVideo, folder]);

  const removeImage = (idx) => {
    const updated = images.filter((_, i) => i !== idx);
    onImages(updated);
  };

  const removeVideo = () => onVideo('');

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length) uploadImages(files);
  }, [uploadImages]);

  const onVideoDrop = useCallback((e) => {
    e.preventDefault();
    setVideoDragActive(false);
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('video/'));
    if (file) uploadVideo(file);
  }, [uploadVideo]);

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Image section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {label}
          </label>
          {images.length > 0 && (
            <span className="text-xs text-slate-400 font-medium">{images.length}/{maxImages}</span>
          )}
        </div>

        {/* Image thumbnails + add tile */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
            {images.map((url, idx) => (
              <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img src={url} alt={`Property photo ${idx + 1}`} className="w-full h-full object-cover" />
                {idx === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-md">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  aria-label="Remove photo"
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 flex items-center justify-center
                             text-white transition opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <span className="material-icons-outlined text-sm">close</span>
                </button>
              </div>
            ))}
            {canAddMore && !uploading && (
              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5
                           flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primary transition"
              >
                <span className="material-icons-outlined text-2xl">add</span>
                <span className="text-xs font-semibold">Add more</span>
              </button>
            )}
          </div>
        )}

        {/* Drop zone — only shown before the first upload; afterwards "Add more" tile above handles it */}
        {(images.length === 0 || uploading) && (
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onClick={() => !uploading && imgInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition
              ${uploading ? 'cursor-not-allowed bg-slate-50 border-slate-200' :
                dragActive ? 'cursor-pointer border-primary bg-primary/5' : 'cursor-pointer border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-primary/5'}`}
          >
            {uploading ? (
              <div className="space-y-2 max-w-xs mx-auto">
                <p className="text-sm font-semibold text-slate-600">Uploading photos…</p>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-slate-400">{progress}%</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <span className="material-icons-outlined text-primary/60 text-4xl">add_photo_alternate</span>
                <p className="text-sm font-semibold text-slate-600">
                  <span className="text-primary">Click to upload</span> or drag photos here
                </p>
                <p className="text-xs text-slate-400">JPG, PNG, WEBP · up to 10 MB each · max {maxImages}</p>
              </div>
            )}
          </div>
        )}
        <input
          ref={imgInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={e => uploadImages(e.target.files)}
        />
      </div>

      {/* Video section */}
      {showVideo && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Property Video <span className="text-slate-400 normal-case font-normal">(optional)</span>
          </label>
          {video ? (
            <div className="relative rounded-xl overflow-hidden bg-black border border-slate-200">
              <video src={video} controls className="w-full max-h-56 object-contain bg-black" />
              <button
                type="button"
                onClick={removeVideo}
                aria-label="Remove video"
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-rose-600 flex items-center justify-center text-white transition"
              >
                <span className="material-icons-outlined text-base">close</span>
              </button>
            </div>
          ) : (
            <div
              onDrop={onVideoDrop}
              onDragOver={e => { e.preventDefault(); setVideoDragActive(true); }}
              onDragLeave={() => setVideoDragActive(false)}
              onClick={() => !uploadingVideo && vidInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition
                ${uploadingVideo ? 'cursor-not-allowed bg-slate-50 border-slate-200' :
                  videoDragActive ? 'cursor-pointer border-primary bg-primary/5' : 'cursor-pointer border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-primary/5'}`}
            >
              {uploadingVideo ? (
                <div className="space-y-2 max-w-xs mx-auto">
                  <p className="text-sm font-semibold text-slate-600">Uploading video…</p>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${videoProgress}%` }} />
                  </div>
                  <p className="text-xs text-slate-400">{videoProgress}%</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="material-icons-outlined text-primary/60 text-4xl">videocam</span>
                  <p className="text-sm font-semibold text-slate-600">
                    <span className="text-primary">Click to upload</span> or drag a video here
                  </p>
                  <p className="text-xs text-slate-400">MP4, MOV, WEBM · up to 10 MB</p>
                </div>
              )}
            </div>
          )}
          <input
            ref={vidInputRef}
            type="file"
            accept="video/mp4,video/mov,video/avi,video/webm,video/mkv"
            className="hidden"
            onChange={e => uploadVideo(e.target.files[0])}
          />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
          <span className="material-icons-outlined text-sm">error_outline</span>
          {error}
        </div>
      )}
    </div>
  );
}
