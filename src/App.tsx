import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastViewport } from './components/ui/Toast';
import { StageStubPage } from './components/layout/StageStubPage';
import { AuthModal } from './features/auth/AuthModal';
import { AuthProvider } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';
import { LandingPage } from './pages/LandingPage';
import { AboutPage, GuidelinesPage, PrivacyPage, TermsPage } from './pages/StaticPages';
import { ambientSimulator } from './services/simulator';

const AppRuntime: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize theme sync and start ambient simulator
  useTheme();

  useEffect(() => {
    ambientSimulator.start();
    return () => ambientSimulator.stop();
  }, []);

  return <>{children}</>;
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRuntime>
          <BrowserRouter>
            <Routes>
              {/* Stage 1: Landing + Static pages */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/guidelines" element={<GuidelinesPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />

              {/* Stage 2 stubs */}
              <Route
                path="/home"
                element={
                  <StageStubPage
                    stage={2}
                    title="Home feed"
                    description="The full three-column social shell, For you & Following feeds, inline composer, and keyboard shortcuts arrive in Stage 2."
                  />
                }
              />
              <Route
                path="/post/:id"
                element={
                  <StageStubPage
                    stage={2}
                    title="Post detail & thread"
                    description="Focused post view, engagement summary, and threaded replies arrive in Stage 2."
                  />
                }
              />

              {/* Stage 3 stubs */}
              <Route
                path="/explore"
                element={
                  <StageStubPage
                    stage={3}
                    title="Explore & topics"
                    description="Live search across people, topics, posts, and Library documents—plus topic feeds—arrives in Stage 3."
                  />
                }
              />
              <Route
                path="/u/:handle"
                element={
                  <StageStubPage
                    stage={3}
                    title="Member profile"
                    description="Public contributor profiles, follower graphs, bio editing, and pinned posts arrive in Stage 3."
                  />
                }
              />
              <Route
                path="/u/:handle/followers"
                element={
                  <StageStubPage
                    stage={3}
                    title="Followers"
                    description="Follower lists and social graph controls arrive in Stage 3."
                  />
                }
              />
              <Route
                path="/u/:handle/following"
                element={
                  <StageStubPage
                    stage={3}
                    title="Following"
                    description="Following lists and social graph controls arrive in Stage 3."
                  />
                }
              />

              {/* Stage 4 stubs */}
              <Route
                path="/notifications"
                element={
                  <StageStubPage
                    stage={4}
                    title="Notifications"
                    description="Grouped activity notifications, mentions, and Library decisions arrive in Stage 4."
                  />
                }
              />
              <Route
                path="/bookmarks"
                element={
                  <StageStubPage
                    stage={4}
                    title="Bookmarks"
                    description="Saved posts and Library documents arrive in Stage 4."
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <StageStubPage
                    stage={4}
                    title="Settings"
                    description="Profile, notification preferences, muted accounts/topics, and demo reset controls arrive in Stage 4."
                  />
                }
              />

              {/* Stage 5 stubs */}
              <Route
                path="/library"
                element={
                  <StageStubPage
                    stage={5}
                    title="Research Library"
                    description="The searchable index of reviewed papers, preprints, essays, datasets, and notes arrives in Stage 5."
                  />
                }
              />
              <Route
                path="/library/new"
                element={
                  <StageStubPage
                    stage={5}
                    title="Submit research"
                    description="The 4-step manuscript submission workflow arrives in Stage 5."
                  />
                }
              />
              <Route
                path="/library/:id"
                element={
                  <StageStubPage
                    stage={5}
                    title="Library document"
                    description="Full reading view, BibTeX/APA citations, Markdown download, and live feed discussion arrive in Stage 5."
                  />
                }
              />

              {/* Stage 6 stubs */}
              <Route
                path="/admin/*"
                element={
                  <StageStubPage
                    stage={6}
                    title="Administration"
                    description="Moderation queues, Library review, topic management, and audit logs arrive in Stage 6."
                    requiresModOrAdmin
                  />
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <AuthModal />
            <ToastViewport />
          </BrowserRouter>
        </AppRuntime>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
