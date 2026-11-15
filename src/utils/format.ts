export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatCompactCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

const AVATAR_PALETTES: Array<{ bg: string; fg: string; border: string }> = [
  { bg: '#1B1B1E', fg: '#EDEDED', border: 'rgba(255,255,255,0.16)' },
  { bg: '#23191A', fg: '#F5D0CE', border: 'rgba(229,50,45,0.3)' },
  { bg: '#172026', fg: '#D4E4EE', border: 'rgba(255,255,255,0.16)' },
  { bg: '#1A211D', fg: '#D5E7DD', border: 'rgba(255,255,255,0.16)' },
  { bg: '#221E18', fg: '#EDE2CF', border: 'rgba(255,255,255,0.16)' },
  { bg: '#1D1A24', fg: '#DFDAEE', border: 'rgba(255,255,255,0.16)' },
  { bg: '#181E21', fg: '#D4E1E6', border: 'rgba(255,255,255,0.16)' },
  { bg: '#241B1E', fg: '#EDD7DE', border: 'rgba(255,255,255,0.16)' },
];

export function getAvatarPalette(seed: number) {
  return AVATAR_PALETTES[Math.abs(seed) % AVATAR_PALETTES.length];
}
