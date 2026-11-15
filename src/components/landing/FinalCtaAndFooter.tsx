import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBrand } from '../../hooks/useBrand';
import { useTheme } from '../../hooks/useTheme';
import { BrandMark } from '../ui/BrandMark';
import { Button } from '../ui/Button';

export const FinalCtaAndFooter: React.FC = () => {
  const { brandName } = useBrand();
  const { currentUser, openAuthModal } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <>
      <section className="relative py-20 sm:py-28 border-t border-[var(--hairline)] overflow-hidden">
        {/* Faint static echo of the aircraft trail */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 320"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-25 dark:opacity-30"
        >
          <defs>
            <linearGradient id="cta-echo-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E5322D" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#E5322D" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 0 300 C 480 285, 860 200, 1200 28 L 1200 320 L 0 320 Z"
            fill="url(#cta-echo-fill)"
          />
          <path
            d="M 0 300 C 480 285, 860 200, 1200 28"
            fill="none"
            stroke="#E5322D"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
        </svg>

        <div className="relative mx-auto max-w-[880px] px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-[var(--text)] leading-[1.1] [text-wrap:balance]">
            The next good idea is probably in a conversation you haven&apos;t had yet.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {currentUser ? (
              <Button variant="primary" size="lg" onClick={() => navigate('/home')}>
                Open {brandName}
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
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
        </div>
      </section>

      <footer className="border-t border-[var(--hairline)] bg-[var(--bg)] py-12 sm:py-16 safe-bottom">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-[var(--hairline)]">
            <div className="md:col-span-5">
              <BrandMark />
              <p className="mt-3 text-sm text-[var(--text-muted)] max-w-xs leading-relaxed">
                A public square for ideas, research, and thinking together across disciplines.
              </p>
            </div>

            <div className="md:col-span-7 grid grid-cols-3 gap-6 text-sm">
              <div>
                <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--text-faint)] mb-3">
                  Product
                </h3>
                <ul className="space-y-2 text-[var(--text-muted)]">
                  <li>
                    <Link to="/explore" className="hover:text-[var(--text)] transition-colors">
                      Explore
                    </Link>
                  </li>
                  <li>
                    <Link to="/library" className="hover:text-[var(--text)] transition-colors">
                      Library
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollToSection('how-it-works')}
                      className="hover:text-[var(--text)] transition-colors cursor-pointer"
                    >
                      How it works
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--text-faint)] mb-3">
                  Community
                </h3>
                <ul className="space-y-2 text-[var(--text-muted)]">
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollToSection('principles')}
                      className="hover:text-[var(--text)] transition-colors cursor-pointer"
                    >
                      Principles
                    </button>
                  </li>
                  <li>
                    <Link to="/guidelines" className="hover:text-[var(--text)] transition-colors">
                      Guidelines
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--text-faint)] mb-3">
                  Legal
                </h3>
                <ul className="space-y-2 text-[var(--text-muted)]">
                  <li>
                    <Link to="/terms" className="hover:text-[var(--text)] transition-colors">
                      Terms
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="hover:text-[var(--text)] transition-colors">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="hover:text-[var(--text)] transition-colors">
                      About
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
            <span className="font-mono">© {new Date().getFullYear()} {brandName}</span>
            <Button variant="subtle" size="sm" onClick={toggleTheme}>
              {resolvedTheme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Light mode
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Dark mode
                </>
              )}
            </Button>
          </div>
        </div>
      </footer>
    </>
  );
};
