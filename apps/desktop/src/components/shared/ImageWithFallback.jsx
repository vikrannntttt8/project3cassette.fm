import { useState, useEffect } from 'react';
import { getHighResImage } from '../../utils/imageUtils.js';

/**
 * ImageWithFallback
 * Gracefully loads image URLs and falls back to a clean dark icon
 * on error, broken link, or undefined/empty src.
 * Automatically upgrades thumbnails to high-resolution (=w1080-h1080-l90-rj, maxresdefault).
 * If maxresdefault is 404 (unavailable for certain videos), gracefully falls back to hqdefault before placeholder.
 */
export default function ImageWithFallback({
  src,
  alt = '',
  className = '',
  icon = 'music_note',
  iconClassName = 'text-white/30 text-[28px]',
  loading = 'lazy',
  ...props
}) {
  const normalizedSrc = getHighResImage(src);
  const [currentSrc, setCurrentSrc] = useState(normalizedSrc);
  const [hasError, setHasError] = useState(!normalizedSrc);

  useEffect(() => {
    const updated = getHighResImage(src);
    setCurrentSrc(updated);
    setHasError(!updated);
  }, [src]);

  const handleError = () => {
    // If maxresdefault failed on ytimg, fall back to hqdefault before giving up
    if (currentSrc && currentSrc.includes('maxresdefault.jpg')) {
      setCurrentSrc(currentSrc.replace('maxresdefault.jpg', 'hqdefault.jpg'));
    } else {
      setHasError(true);
    }
  };

  if (hasError || !currentSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-white/5 select-none ${className}`}
        aria-label={alt || 'Placeholder'}
      >
        <span className={`material-symbols-outlined ${iconClassName}`}>
          {icon}
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
      {...props}
    />
  );
}
