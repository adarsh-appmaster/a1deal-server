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
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
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
    setError('');
    setUploadingVideo(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append('video', file);
      fd.append('folder', folder.replace('properties', 'videos'));

      const { data } = await api.post('/upload/video', fd, {
        headers: { 'Content-Type': undefined },  // let axios set boundary automatically
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      onVideo(data.url);
    } catch (err) {
      setError(err.response?.data?.message || 'Video upload failed.');
    } finally {
      setUploadingVideo(false);
      setProgress(0);
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
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length) uploadImages(files);
  }, [uploadImages]);

  const onDragOver = (e) => e.preventDefault();

  return (
    <div className="space-y-3">
      {/* Image section */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
          Property Images {images.length > 0 && `(${images.length}/${maxImages})`}
        </label>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onClick={() => !uploading && imgInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition
            ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500'}
            border-slate-600 bg-slate-800/50`}
        >
          {uploading ? (
            <div className="space-y-2">
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">Uploading… {progress}%</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-2">
              <span className="material-icons-outlined text-slate-500 text-3xl">add_photo_alternate</span>
              <p className="text-sm text-slate-400">Click or drag images here</p>
              <p className="text-xs text-slate-600">JPG, PNG, WEBP · up to 10 MB each · max {maxImages}</p>
            </div>
          )}
        </div>
        <input
          ref={imgInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={e => uploadImages(e.target.files)}
        />
      </div>

      {/* Image thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden bg-slate-700">
              <img src={url} alt={`img-${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600/90 flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition text-white text-xs"
              >
                <span className="material-icons-outlined text-sm">close</span>
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 text-xs bg-indigo-600/80 text-white px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Video section */}
      {showVideo && (
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
            Property Video (optional)
          </label>
          {video ? (
            <div className="relative rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
              <video src={video} controls className="w-full max-h-40 object-cover" />
              <button
                type="button"
                onClick={removeVideo}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600/90 flex items-center justify-center text-white"
              >
                <span className="material-icons-outlined text-sm">close</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => !uploadingVideo && vidInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition
                ${uploadingVideo ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500'}
                border-slate-600 bg-slate-800/50`}
            >
              {uploadingVideo ? (
                <div className="space-y-2">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">Uploading video… {progress}%</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 py-2">
                  <span className="material-icons-outlined text-slate-500 text-3xl">videocam</span>
                  <p className="text-sm text-slate-400">Click to upload video</p>
                  <p className="text-xs text-slate-600">MP4, MOV, WEBM · up to 100 MB</p>
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
        <p className="text-xs text-rose-400 flex items-center gap-1">
          <span className="material-icons-outlined text-sm">error_outline</span>
          {error}
        </p>
      )}
    </div>
  );
}
