import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBrand } from '../hooks/useBrand';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Button } from '../components/ui/Button';
import { FinalCtaAndFooter } from '../components/landing/FinalCtaAndFooter';
import { HeroAircraftStage } from '../components/landing/HeroAircraftStage';
import { HowItWorks } from '../components/landing/HowItWorks';
import { IdeasInMotion } from '../components/landing/IdeasInMotion';
import { LandingNav } from '../components/landing/LandingNav';
import { PrinciplesSection } from '../components/landing/PrinciplesSection';
import { TopicsMarquee } from '../components/landing/TopicsMarquee';
import { TwoWaysToRead } from '../components/landing/TwoWaysToRead';

export const LandingPage: React.FC = () => {
  const { brandName } = useBrand();
  const { currentUser, openAuthModal } = useAuth();
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${brandName} — Think out loud. Together.`;
  }, [brandName]);

  const stagger = (delayMs: number): React.CSSProperties =>
    reducedMotion ? {} : { animationDelay: `${delayMs}ms` };

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-full focus:bg-[#E5322D] focus:text-white focus:text-sm"
      >
        Skip to content
      </a>

      <LandingNav />

      <main id="main-content">
        {/* Hero section: text strictly ABOVE the aircraft animation */}
        <section className="pt-10 sm:pt-16 pb-14 sm:pb-20">
          <div className="mx-auto max-w-[880px] px-4 sm:px-6 text-center">
            <div
              style={stagger(0)}
              className={`inline-flex items-center gap-2 rounded-full border border-[var(--hairline-strong)] bg-[var(--surface)] px-3.5 py-1.5 font-mono text-xs text-[var(--text-muted)] ${
                reducedMotion ? '' : 'animate-fade-rise'
              }`}
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[#E5322D] animate-pulse-dot"
              />
              <span>Open to everyone, thinking in public</span>
            </div>

            <h1
              style={{
                ...stagger(70),
                fontSize: 'clamp(44px, 7.2vw, 88px)',
              }}
              className={`mt-6 font-semibold tracking-[-0.04em] leading-[0.98] text-[var(--text)] [text-wrap:balance] ${
                reducedMotion ? '' : 'animate-fade-rise'
              }`}
            >
              Think out loud.{' '}
              <span className="relative inline-block">
                <span>Together.</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 220 14"
                  preserveAspectRatio="none"
                  className="absolute left-0 -bottom-1.5 w-full h-[10px] sm:h-[13px] text-[#E5322D]"
                >
                  <path
                    d="M 2 10 Q 110 2 218 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p
              style={{
                ...stagger(140),
                fontSize: 'clamp(17px, 2vw, 21px)',
              }}
              className={`mt-6 mx-auto max-w-[660px] text-[var(--text-muted)] leading-[1.55] ${
                reducedMotion ? '' : 'animate-fade-rise'
              }`}
            >
              {brandName} is a public square for ideas, research and the questions in between. Post a thought, follow curious minds, and publish work that others can build on.
            </p>

            <div
              style={stagger(210)}
              className={`mt-8 flex flex-wrap items-center justify-center gap-3 ${
                reducedMotion ? '' : 'animate-fade-rise'
              }`}
            >
              {currentUser ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/home')}
                  className="group"
                >
                  Open {brandName}
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                    strokeWidth={1.75}
                  />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => openAuthModal('join')}
                  className="group"
                >
                  Join {brandName}
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                    strokeWidth={1.75}
                  />
                </Button>
              )}

              <Button variant="outline" size="lg" onClick={() => navigate('/home')}>
                Browse the feed
              </Button>
            </div>

            <p
              style={stagger(270)}
              className={`mt-4 font-mono text-xs text-[var(--text-faint)] ${
                reducedMotion ? '' : 'animate-fade-rise'
              }`}
            >
              Guests can read everything. Join to reply, like and post.
            </p>
          </div>

          {/* Signature aircraft stage below text */}
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 mt-10 sm:mt-14">
            <HeroAircraftStage />
          </div>
        </section>

        <IdeasInMotion />
        <TwoWaysToRead />
        <HowItWorks />
        <TopicsMarquee />
        <PrinciplesSection />
        <FinalCtaAndFooter />
      </main>
    </div>
  );
};
