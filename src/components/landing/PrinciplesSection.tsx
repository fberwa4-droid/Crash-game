import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const PRINCIPLES = [
  {
    number: '01',
    title: 'Public identities',
    body: 'Every post and review carries a real, consistent handle. Ideas stand behind a persistent record rather than throwaway anonymity.',
  },
  {
    number: '02',
    title: 'Conversation in the open',
    body: 'There are no direct messages anywhere on the platform. Disagreements, corrections, and collaborations happen where others can learn from them.',
  },
  {
    number: '03',
    title: 'Reviewed research',
    body: 'Any member can submit papers, datasets, preprints, or working notes to the Library. Every submission is reviewed before it appears publicly.',
  },
  {
    number: '04',
    title: 'Short posts, long work',
    body: 'Posts stay concise at 500 characters to spark dialogue; full arguments and citations live in the Library and link cleanly back into the feed.',
  },
];

export const PrinciplesSection: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion || revealed) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion, revealed]);

  return (
    <section
      id="principles"
      ref={ref}
      aria-labelledby="principles-heading"
      className="py-16 sm:py-24 border-t border-[var(--hairline)] scroll-mt-20"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <h2
          id="principles-heading"
          className="text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--text)] mb-12"
        >
          Principles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {PRINCIPLES.map((item, idx) => (
            <div
              key={item.number}
              style={{
                transitionDelay: reducedMotion ? '0ms' : `${idx * 70}ms`,
              }}
              className={`border-t border-[var(--hairline)] pt-6 transition-all duration-500 ${
                revealed
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-3'
              }`}
            >
              <div className="font-mono text-xs text-[#E5322D] mb-2 tabular-nums">
                {item.number}
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text)]">
                {item.title}
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed max-w-md">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
