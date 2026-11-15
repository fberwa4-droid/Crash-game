import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useStore } from '../../hooks/useStore';
import { Chip } from '../ui/Chip';

export const TopicsMarquee: React.FC = () => {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const topics = useStore().topics.filter((t) => !t.archived && !t.mergedInto);

  const half = Math.ceil(topics.length / 2);
  const rowOne = topics.slice(0, half);
  const rowTwo = topics.slice(half);

  const goToTopic = (slug: string) => {
    navigate(`/explore?topic=${encodeURIComponent(slug)}`);
  };

  return (
    <section
      aria-labelledby="topics-band-heading"
      className="py-16 sm:py-24 border-t border-[var(--hairline)] overflow-hidden"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 mb-8">
        <h2
          id="topics-band-heading"
          className="text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--text)]"
        >
          Across disciplines
        </h2>
        <p className="mt-2 text-base text-[var(--text-muted)]">
          Browse any topic as a guest, or join to follow fields over time.
        </p>
      </div>

      {reducedMotion ? (
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 flex flex-wrap gap-2.5">
          {topics.map((topic) => (
            <Chip key={topic.slug} onClick={() => goToTopic(topic.slug)}>
              {topic.name}
            </Chip>
          ))}
        </div>
      ) : (
        <div className="marquee-group marquee-mask space-y-3">
          {/* Row 1: left */}
          <div className="flex w-max marquee-track-left">
            {[...rowOne, ...rowOne].map((topic, idx) => (
              <div key={`r1-${topic.slug}-${idx}`} className="px-1.5">
                <Chip onClick={() => goToTopic(topic.slug)}>{topic.name}</Chip>
              </div>
            ))}
          </div>

          {/* Row 2: right */}
          <div className="flex w-max marquee-track-right">
            {[...rowTwo, ...rowTwo].map((topic, idx) => (
              <div key={`r2-${topic.slug}-${idx}`} className="px-1.5">
                <Chip onClick={() => goToTopic(topic.slug)}>{topic.name}</Chip>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
