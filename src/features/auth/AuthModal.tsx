import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { AuthGateReason, UserRole } from '../../data/types';
import { useAuth } from '../../hooks/useAuth';
import { useBrand } from '../../hooks/useBrand';
import { useStore } from '../../hooks/useStore';
import { useToast } from '../../hooks/useToast';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';

function getReasonHeadline(reason: AuthGateReason | undefined, brandName: string): string {
  switch (reason) {
    case 'like':
      return `Join ${brandName} to like this post`;
    case 'repost':
      return `Join ${brandName} to repost ideas`;
    case 'quote':
      return `Join ${brandName} to quote this post`;
    case 'reply':
      return `Join ${brandName} to reply to this thread`;
    case 'bookmark':
      return `Join ${brandName} to save bookmarks`;
    case 'follow':
      return `Join ${brandName} to follow thinkers`;
    case 'follow-topic':
      return `Join ${brandName} to follow topics`;
    case 'post':
      return `Join ${brandName} to publish a post`;
    case 'submit-research':
      return `Join ${brandName} to submit research`;
    case 'report':
      return `Join ${brandName} to report content`;
    default:
      return `Welcome to ${brandName}`;
  }
}

export const AuthModal: React.FC = () => {
  const { authModal, closeAuthModal } = useAuth();
  const { brandName } = useBrand();
  const { settings } = useStore();
  const { showToast } = useToast();

  const [tab, setTab] = useState<'join' | 'login'>(authModal.mode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Join fields
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [ackPublic, setAckPublic] = useState(false);

  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  useEffect(() => {
    if (authModal.open) {
      setTab(authModal.mode);
      setError(null);
      setShowPassword(false);
    }
  }, [authModal.open, authModal.mode]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await authService.register({
        displayName,
        handle,
        email,
        password: joinPassword,
        acknowledgePublic: ackPublic,
        inviteCode,
      });
      showToast({ message: `Welcome to ${brandName}, ${user.displayName}.` });
      closeAuthModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await authService.login({
        identifier,
        password: loginPassword,
      });
      showToast({ message: `Signed in as @${user.handle}.` });
      closeAuthModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      const user = await authService.loginAsDemo(role);
      showToast({ message: `Signed in as demo ${role} (@${user.handle}).` });
      closeAuthModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const title = getReasonHeadline(authModal.reason, brandName);

  return (
    <Modal
      open={authModal.open}
      onClose={closeAuthModal}
      title={title}
      description="Public square for ideas and reviewed research."
      maxWidth="sm"
    >
      <div className="mb-5 flex items-center justify-between">
        <Tabs
          value={tab}
          onChange={(next) => {
            setTab(next);
            setError(null);
          }}
          options={[
            { value: 'join', label: `Join ${brandName}` },
            { value: 'login', label: 'Log in' },
          ]}
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-[#E5322D]/50 bg-[#E5322D]/10 px-3.5 py-2.5 text-sm text-[var(--text)]"
        >
          {error}
        </div>
      ) : null}

      {tab === 'join' ? (
        <form onSubmit={handleJoin} className="space-y-3.5">
          <div>
            <label htmlFor="join-name" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Display name
            </label>
            <input
              id="join-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ada Lovelace"
              className="w-full h-10 px-3 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg)] text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]"
            />
          </div>

          <div>
            <label htmlFor="join-handle" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Handle
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[var(--text-faint)]">
                @
              </span>
              <input
                id="join-handle"
                type="text"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="ada_lovelace"
                className="w-full h-10 pl-7 pr-3 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg)] font-mono text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="join-email" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Email
            </label>
            <input
              id="join-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ada@example.org"
              className="w-full h-10 px-3 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg)] text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]"
            />
          </div>

          <div>
            <label htmlFor="join-password" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="join-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-10 pl-3 pr-10 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg)] text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {settings.registrationMode === 'invite-only' ? (
            <div>
              <label htmlFor="join-invite" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Invite code
              </label>
              <input
                id="join-invite"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="COMMONS-DEMO"
                className="w-full h-10 px-3 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg)] font-mono text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]"
              />
            </div>
          ) : null}

          <label className="flex items-start gap-2.5 pt-1 text-xs text-[var(--text-muted)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={ackPublic}
              onChange={(e) => setAckPublic(e.target.checked)}
              className="mt-0.5 accent-[#E5322D]"
            />
            <span>
              I understand that my identity, posts, and replies on {brandName} are public, and there are no direct messages.
            </span>
          </label>

          <Button type="submit" variant="primary" fullWidth loading={loading} className="mt-2">
            Create account
          </Button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label htmlFor="login-id" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Handle or email
            </label>
            <input
              id="login-id"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="@elena_vance or member@commons.example"
              className="w-full h-10 px-3 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg)] text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-10 pl-3 pr-10 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg)] text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" fullWidth loading={loading} className="mt-2">
            Log in
          </Button>
        </form>
      )}

      <div className="mt-6 pt-5 border-t border-[var(--hairline)]">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Demo-only quick access
          </span>
          <span className="font-mono text-[11px] text-[var(--text-faint)]">Local mock</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            variant="subtle"
            size="sm"
            disabled={loading}
            onClick={() => handleDemo('member')}
            className="justify-center"
          >
            Demo member
          </Button>
          <Button
            variant="subtle"
            size="sm"
            disabled={loading}
            onClick={() => handleDemo('moderator')}
            className="justify-center"
          >
            Demo moderator
          </Button>
          <Button
            variant="subtle"
            size="sm"
            disabled={loading}
            onClick={() => handleDemo('admin')}
            className="justify-center"
          >
            Demo admin
          </Button>
        </div>
        <p className="mt-2.5 text-[11px] text-[var(--text-faint)] leading-relaxed">
          Mock authentication for demonstration only. No real credentials are sent; accounts and posts persist locally in your browser.
        </p>
      </div>
    </Modal>
  );
};
