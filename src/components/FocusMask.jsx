import { useEffect, useRef } from 'react';

const BAND = 72;

export default function FocusMask({ containerRef }) {
  const topRef = useRef(null);
  const botRef = useRef(null);

  useEffect(() => {
    function update() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = window.innerHeight / 2;
      const bandTop  = center - BAND / 2;
      const bandBot  = center + BAND / 2;
      if (topRef.current) topRef.current.style.height = `${Math.max(0, bandTop - rect.top + el.scrollTop)}px`;
      if (botRef.current)  botRef.current.style.top   = `${bandBot - rect.top + el.scrollTop}px`;
    }
    const el = containerRef.current;
    update();
    el?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => { el?.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [containerRef]);

  return (
    <>
      <div className="focus-mask-top"  ref={topRef} />
      <div className="focus-mask-bottom" ref={botRef} />
    </>
  );
}
