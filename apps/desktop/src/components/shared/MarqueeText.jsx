import { useRef, useState, useEffect } from 'react';

/**
 * MarqueeText
 * High-performance text ticker for active song titles.
 * When text exceeds container width, it smoothly scrolls right-to-left
 * in a continuous loop without reversing backward.
 * When text fits within the container, it stays cleanly truncated with an ellipsis.
 */
export default function MarqueeText({
  text,
  className = '',
  style = {},
  title = '',
  as: Component = 'div',
  speed = 35, // pixels per second for comfortable reading speed
  ...props
}) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [duration, setDuration] = useState(10);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        const overflowing = textWidth > containerWidth + 2;
        setIsOverflowing(overflowing);
        if (overflowing) {
          const calculatedDuration = Math.max(6, Math.round(textWidth / speed));
          setDuration(calculatedDuration);
        }
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text, speed]);

  const displayTitle = title || (typeof text === 'string' ? text : '');

  return (
    <Component
      ref={containerRef}
      className={`overflow-hidden relative w-full ${className}`}
      style={{ maxWidth: '100%', ...style }}
      title={displayTitle}
      {...props}
    >
      {isOverflowing ? (
        <div
          className="animate-marquee-loop inline-flex items-center gap-8 whitespace-nowrap will-change-transform select-none"
          style={{ animationDuration: `${duration}s` }}
        >
          <span ref={textRef} className="flex-shrink-0">
            {text}
          </span>
          <span aria-hidden="true" className="flex-shrink-0 opacity-90">
            {text}
          </span>
        </div>
      ) : (
        <span
          ref={textRef}
          className="truncate block whitespace-nowrap overflow-hidden text-ellipsis w-full"
        >
          {text}
        </span>
      )}
    </Component>
  );
}
