import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LogOut, Menu as MenuIcon, Moon, Sun, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBrand } from '../../hooks/useBrand';
import { useTheme } from '../../hooks/useTheme';
import { Avatar } from '../ui/Avatar';
import { BrandMark } from '../ui/BrandMark';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Menu } from '../ui/Menu';
import { Sheet } from '../ui/Sheet';

export const LandingNav: React.FC = () => {
  const { brandName } = useBrand();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { currentUser, openAuthModal, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(1, Math.max(0, y / docHeight)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleInPageNav = (sectionId: string) => {
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-colors duration-200 safe-top ${
          scrolled
            ? 'backdrop-blur-md bg-[var(--nav-backdrop)] border-b border-[var(--hairline)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Left: Wordmark */}
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="focus-visible:rounded-md"
          >
            <BrandMark />
          </Link>

          {/* Center: Desktop nav links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--text-muted)]"
          >
            <Link
              to="/explore"
              className="hover:text-[var(--text)] transition-colors whitespace-nowrap shrink-0"
            >
              Explore
            </Link>
            <Link
              to="/library"
              className="hover:text-[var(--text)] transition-colors whitespace-nowrap shrink-0"
            >
              Library
            </Link>
            <button
              type="button"
              onClick={() => handleInPageNav('how-it-works')}
              className="hover:text-[var(--text)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              How it works
            </button>
            <button
              type="button"
              onClick={() => handleInPageNav('principles')}
              className="hover:text-[var(--text)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Principles
            </button>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <IconButton
              label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              size="sm"
              onClick={toggleTheme}
              className="hidden md:inline-flex"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.5} />
              )}
            </IconButton>

            {currentUser ? (
              <>
                <div className="hidden md:flex items-center gap-2">
                  <Menu
                    items={[
                      {
                        id: 'profile',
                        label: `Profile (@${currentUser.handle})`,
                        icon: <UserIcon className="h-4 w-4" strokeWidth={1.5} />,
                        onSelect: () => navigate(`/u/${currentUser.handle}`),
                      },
                      {
                        id: 'logout',
                        label: 'Log out',
                        icon: <LogOut className="h-4 w-4" strokeWidth={1.5} />,
                        danger: true,
                        onSelect: () => void logout(),
                      },
                    ]}
                    trigger={(triggerProps) => (
                      <button
                        type="button"
                        aria-label="Account menu"
                        {...triggerProps}
                        className="inline-flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 border border-[var(--hairline)] hover:border-[var(--hairline-strong)] transition-colors cursor-pointer"
                      >
                        <Avatar
                          name={currentUser.displayName}
                          seed={currentUser.avatarSeed}
                          size="xs"
                        />
                        <span className="font-mono text-xs text-[var(--text)] max-w-[110px] truncate">
                          @{currentUser.handle}
                        </span>
                      </button>
                    )}
                  />
                  <Button variant="primary" size="sm" onClick={() => navigate('/home')}>
                    Open {brandName}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Button>
                </div>

                <div className="flex md:hidden items-center gap-2">
                  <Button variant="primary" size="sm" onClick={() => navigate('/home')}>
                    Open
                  </Button>
                  <IconButton
                    label="Open navigation menu"
                    onClick={() => setMobileOpen(true)}
                  >
                    <MenuIcon className="h-5 w-5" strokeWidth={1.5} />
                  </IconButton>
                </div>
              </>
            ) : (
              <>
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAuthModal('login')}
                  >
                    Log in
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openAuthModal('join')}
                  >
                    Join {brandName}
                  </Button>
                </div>

                <div className="flex md:hidden items-center gap-1.5">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openAuthModal('join')}
                  >
                    Join
                  </Button>
                  <IconButton
                    label="Open navigation menu"
                    onClick={() => setMobileOpen(true)}
                  >
                    <MenuIcon className="h-5 w-5" strokeWidth={1.5} />
                  </IconButton>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Thin red scroll progress line */}
        {scrolled ? (
          <div
            aria-hidden="true"
            className="h-[1.5px] w-full bg-transparent overflow-hidden"
          >
            <div
              className="h-full bg-[#E5322D] origin-left transition-transform duration-75"
              style={{ transform: `scaleX(${scrollProgress})` }}
            />
          </div>
        ) : null}
      </header>

      <Sheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title={brandName}
      >
        <div className="flex flex-col h-full justify-between gap-8">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
            <Link
              to="/home"
              onClick={() => setMobileOpen(false)}
              className="py-3 px-2 text-2xl font-medium tracking-tight text-[var(--text)] hover:text-[#E5322D] transition-colors border-b border-[var(--hairline)]"
            >
              Home feed
            </Link>
            <Link
              to="/explore"
              onClick={() => setMobileOpen(false)}
              className="py-3 px-2 text-2xl font-medium tracking-tight text-[var(--text)] hover:text-[#E5322D] transition-colors border-b border-[var(--hairline)]"
            >
              Explore
            </Link>
            <Link
              to="/library"
              onClick={() => setMobileOpen(false)}
              className="py-3 px-2 text-2xl font-medium tracking-tight text-[var(--text)] hover:text-[#E5322D] transition-colors border-b border-[var(--hairline)]"
            >
              Library
            </Link>
            <button
              type="button"
              onClick={() => handleInPageNav('how-it-works')}
              className="py-3 px-2 text-left text-2xl font-medium tracking-tight text-[var(--text)] hover:text-[#E5322D] transition-colors border-b border-[var(--hairline)] cursor-pointer"
            >
              How it works
            </button>
            <button
              type="button"
              onClick={() => handleInPageNav('principles')}
              className="py-3 px-2 text-left text-2xl font-medium tracking-tight text-[var(--text)] hover:text-[#E5322D] transition-colors border-b border-[var(--hairline)] cursor-pointer"
            >
              Principles
            </button>
          </nav>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 px-2 border-y border-[var(--hairline)]">
              <span className="text-sm text-[var(--text-muted)]">Appearance</span>
              <Button variant="subtle" size="sm" onClick={toggleTheme}>
                {resolvedTheme === 'dark' ? (
                  <>
                    <Sun className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Light
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Dark
                  </>
                )}
              </Button>
            </div>

            {currentUser ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 px-2 py-2">
                  <Avatar name={currentUser.displayName} seed={currentUser.avatarSeed} size="md" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text)] truncate">
                      {currentUser.displayName}
                    </div>
                    <div className="font-mono text-xs text-[var(--text-muted)] truncate">
                      @{currentUser.handle} · {currentUser.role}
                    </div>
                  </div>
                </div>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    setMobileOpen(false);
                    navigate('/home');
                  }}
                >
                  Open {brandName}
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setMobileOpen(false);
                    void logout();
                  }}
                >
                  Log out
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthModal('join');
                  }}
                >
                  Join {brandName}
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthModal('login');
                  }}
                >
                  Log in
                </Button>
              </div>
            )}
          </div>
        </div>
      </Sheet>
    </>
  );
};
