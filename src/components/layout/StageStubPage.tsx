import React, { useEffect } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Construction, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBrand } from '../../hooks/useBrand';
import { LandingNav } from '../landing/LandingNav';
import { Button } from '../ui/Button';

interface StageStubPageProps {
  stage: number;
  title: string;
  description: string;
  requiresModOrAdmin?: boolean;
}

export const StageStubPage: React.FC<StageStubPageProps> = ({
  stage,
  title,
  description,
  requiresModOrAdmin = false,
}) => {
  const { brandName } = useBrand();
  const { currentUser, openAuthModal } = useAuth();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.title = `${title} — ${brandName}`;
    window.scrollTo(0, 0);
  }, [title, brandName]);

  const unauthorized =
    requiresModOrAdmin &&
    (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'admin'));

  const topicParam = searchParams.get('topic');
  const queryParam = searchParams.get('q');

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <LandingNav />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="w-full max-w-lg rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-6 sm:p-8">
          {unauthorized ? (
            <>
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg)] text-[#E5322D] mb-4">
                <ShieldAlert className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
                You don&apos;t have access
              </h1>
              <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
                Administration tools require a moderator or administrator account. Sign in with a demo moderator or admin role to preview permissions when Stage {stage} arrives.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Button variant="primary" size="sm" onClick={() => openAuthModal('login')}>
                  Log in
                </Button>
                <Link to="/">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Back to landing
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 font-mono text-xs text-[#E5322D] mb-3">
                <Construction className="h-4 w-4" strokeWidth={1.5} />
                <span>This section arrives in Stage {stage}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
                {title}
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                {description}
              </p>

              {(topicParam || queryParam || Object.keys(params).length > 0) ? (
                <div className="mt-5 rounded-xl border border-[var(--hairline)] bg-[var(--bg)] px-3.5 py-2.5 font-mono text-xs text-[var(--text-muted)]">
                  Route: <span className="text-[var(--text)]">{location.pathname}</span>
                  {topicParam ? <span> · topic={topicParam}</span> : null}
                  {queryParam ? <span> · q={queryParam}</span> : null}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link to="/">
                  <Button variant="primary" size="sm">
                    <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Return to landing
                  </Button>
                </Link>
                {!currentUser ? (
                  <Button variant="outline" size="sm" onClick={() => openAuthModal('join')}>
                    Join {brandName}
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
