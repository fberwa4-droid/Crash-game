import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBrand } from '../hooks/useBrand';
import { LandingNav } from '../components/landing/LandingNav';
import { FinalCtaAndFooter } from '../components/landing/FinalCtaAndFooter';

interface StaticPageLayoutProps {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}

const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({ title, eyebrow, children }) => {
  const { brandName } = useBrand();

  useEffect(() => {
    document.title = `${title} — ${brandName}`;
    window.scrollTo(0, 0);
  }, [title, brandName]);

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <LandingNav />
      <main className="flex-1">
        <article className="mx-auto max-w-[740px] px-4 sm:px-6 py-12 sm:py-20">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Back to {brandName}
          </Link>
          <div className="font-mono text-xs uppercase tracking-wider text-[#E5322D] mb-2">
            {eyebrow}
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[var(--text)]">
            {title}
          </h1>
          <div className="mt-8 space-y-6 text-base text-[var(--text-muted)] leading-[1.7]">
            {children}
          </div>
        </article>
      </main>
      <FinalCtaAndFooter />
    </div>
  );
};

export const AboutPage: React.FC = () => {
  const { brandName } = useBrand();
  return (
    <StaticPageLayout title={`About ${brandName}`} eyebrow="Platform">
      <p>
        {brandName} is an open public square for multidisciplinary thinking. Scientists, philosophers, engineers, historians, and independent researchers use it to test ideas in 500-character posts and publish longer essays, preprints, datasets, and reading notes in a reviewed Library.
      </p>
      <p>
        Every identity on {brandName} is persistent and public, and there are no direct messages. By keeping conversation in the open, disagreements become shared learning resources rather than private backchannels.
      </p>
      <p>
        Guests can read every public post, thread, topic, and published Library document without signing up. Registering lets you reply, quote, follow thinkers, bookmark work, and submit manuscripts for moderator review.
      </p>
    </StaticPageLayout>
  );
};

export const GuidelinesPage: React.FC = () => {
  const { brandName } = useBrand();
  return (
    <StaticPageLayout title="Community Guidelines" eyebrow="Community">
      <h2 className="text-xl font-semibold text-[var(--text)] pt-2">1. Argue with claims, not caricatures</h2>
      <p>
        Critique assumptions, methods, and evidence directly. Harassment, personal attacks, and bad-faith pile-ons are subject to moderation and suspension.
      </p>
      <h2 className="text-xl font-semibold text-[var(--text)] pt-2">2. State your uncertainty</h2>
      <p>
        Distinguish clearly between preliminary hunches, replicated evidence, and personal opinion. Cite sources or link a Library entry when making empirical claims.
      </p>
      <h2 className="text-xl font-semibold text-[var(--text)] pt-2">3. Respect public review</h2>
      <p>
        All Library submissions on {brandName} undergo moderator review for scope, attribution, and clarity before appearing publicly.
      </p>
    </StaticPageLayout>
  );
};

export const TermsPage: React.FC = () => {
  const { brandName } = useBrand();
  return (
    <StaticPageLayout title="Terms of Use" eyebrow="Legal">
      <p>
        {brandName} is operated as a public intellectual forum. By creating an account, you agree that your display name, handle, posts, replies, and published Library contributions are publicly visible to guests and members.
      </p>
      <p>
        You retain ownership of the ideas and manuscripts you publish, while granting {brandName} permission to display, index, and quote them within the platform. Moderators and administrators may remove content or suspend accounts that violate community guidelines.
      </p>
    </StaticPageLayout>
  );
};

export const PrivacyPage: React.FC = () => {
  const { brandName } = useBrand();
  return (
    <StaticPageLayout title="Privacy Notice" eyebrow="Legal">
      <p>
        This frontend demonstration of {brandName} stores all account profiles, posts, bookmarks, Library submissions, and preferences locally in your browser&apos;s storage under the <code className="font-mono text-xs">commons:v1:</code> namespace.
      </p>
      <p>
        No personal data or credentials are transmitted to external servers. You can inspect, reset, or clear all local demonstration data at any time from Settings.
      </p>
    </StaticPageLayout>
  );
};
