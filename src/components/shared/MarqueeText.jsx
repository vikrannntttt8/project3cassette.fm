import { useRef, useState, useEffect } from 'react';

/**
 * MarqueeText
 * High-performance text container that detects text overflow and smoothly scrolls
 * back and forth so long titles (e.g. "Kesariya (From Brahmastra)...") are fully readable.
 */
export default function MarqueeText({
  text,
  className = '',
  style = {},
  title = '',
  as: Component = 'span',
  ...props
}) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        const overflowing = textWidth > containerWidth + 2;
        setIsOverflowing(overflowing);
        if (overflowing) {
          containerRef.current.style.setProperty(
            '--marquee-container-w',
            `${containerWidth}px`
          );
        }
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  return (
    <Component
      ref={containerRef}
      className={`overflow-hidden block relative ${className}`}
      style={{ maxWidth: '100%', ...style }}
      title={title || (typeof text === 'string' ? text : '')}
      {...props}
    >
      <span
        ref={textRef}
        className={isOverflowing ? 'animate-marquee whitespace-nowrap' : 'truncate block'}
      >
        {text}
      </span>
    </Component>
  );
}
