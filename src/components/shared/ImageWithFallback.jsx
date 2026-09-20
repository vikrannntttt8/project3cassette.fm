import { useState, useEffect } from 'react';
import { getHighResImage } from '../../utils/imageUtils.js';

/**
 * ImageWithFallback
 * Gracefully loads image URLs and falls back to a clean dark icon
 * on error, broken link, or undefined/empty src.
 * Automatically upgrades thumbnails to high-resolution (=s800, hq720).
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
  const [hasError, setHasError] = useState(!normalizedSrc);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(!normalizedSrc);
  }, [normalizedSrc]);

  if (hasError || !normalizedSrc) {
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
      src={normalizedSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
