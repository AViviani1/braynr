import { useEffect, useRef } from 'react';

export default function FocusMask({ containerRef }) {
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const bandHeight = 72; // approx 2 lines at default line-height

  useEffect(() => {
    function updateMask() {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const center = viewportH / 2;
      const bandTop = center - bandHeight / 2;
      const bandBottom = center + bandHeight / 2;

      if (topRef.current) topRef.current.style.height = `${Math.max(0, bandTop - rect.top + container.scrollTop)}px`;
      if (bottomRef.current) bottomRef.current.style.top = `${bandBottom - rect.top + container.scrollTop}px`;
    }

    const container = containerRef.current;
    updateMask();
    container?.addEventListener('scroll', updateMask);
    window.addEventListener('scroll', updateMask);
    window.addEventListener('resize', updateMask);
    return () => {
      container?.removeEventListener('scroll', updateMask);
      window.removeEventListener('scroll', updateMask);
      window.removeEventListener('resize', updateMask);
    };
  }, [containerRef]);

  return (
    <>
      <div className="focus-mask focus-mask--top" ref={topRef} />
      <div className="focus-mask focus-mask--bottom" ref={bottomRef} />
    </>
  );
}
