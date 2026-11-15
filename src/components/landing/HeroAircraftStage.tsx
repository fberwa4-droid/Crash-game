import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface StageSize {
  width: number;
  height: number;
}

interface Puff {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
}

interface Milestone {
  value: number;
  label: string;
  progress: number;
}

const MILESTONES: Milestone[] = [
  { value: 2.0, label: '2.00x', progress: Math.log(2) / Math.log(25) },
  { value: 5.0, label: '5.00x', progress: Math.log(5) / Math.log(25) },
  { value: 10.0, label: '10x', progress: Math.log(10) / Math.log(25) },
  { value: 25.0, label: '25x', progress: 0.96 },
];

const CLIMB_DURATION = 9000;
const FADE_DURATION = 420;
const HOLD_DURATION = 1200;
const CYCLE_DURATION = CLIMB_DURATION + FADE_DURATION + HOLD_DURATION;

function formatMultiplier(m: number): string {
  if (m < 10) return `${m.toFixed(2)}x`;
  return `${m.toFixed(1)}x`;
}

// Smooth cubic Bezier curve from lower-left to upper-right (shallow -> steep)
function evalCurvePoint(
  t: number,
  x0: number,
  y0: number,
  x3: number,
  y3: number,
) {
  const x1 = x0 + (x3 - x0) * 0.45;
  const y1 = y0 - (y0 - y3) * 0.08;
  const x2 = x0 + (x3 - x0) * 0.82;
  const y2 = y0 - (y0 - y3) * 0.42;

  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  const x =
    mt2 * mt * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t2 * t * x3;
  const y =
    mt2 * mt * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t2 * t * y3;

  const dx =
    3 * mt2 * (x1 - x0) + 6 * mt * t * (x2 - x1) + 3 * t2 * (x3 - x2);
  const dy =
    3 * mt2 * (y1 - y0) + 6 * mt * t * (y2 - y1) + 3 * t2 * (y3 - y2);

  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { x, y, angleDeg };
}

export const HeroAircraftStage: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<StageSize>({ width: 960, height: 520 });
  const [isVisible, setIsVisible] = useState(true);

  // Refs for direct DOM updates in single requestAnimationFrame loop (zero React re-render per frame)
  const planeGroupRef = useRef<SVGGElement>(null);
  const propRef = useRef<SVGGElement>(null);
  const trailPathRef = useRef<SVGPathElement>(null);
  const fillPathRef = useRef<SVGPathElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const stageGroupRef = useRef<SVGGElement>(null);
  const streaksRef = useRef<SVGGElement>(null);
  const puffsLayerRef = useRef<SVGGElement>(null);
  const milestoneRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(280, Math.round(entry.contentRect.width));
        const h = Math.max(280, Math.round(entry.contentRect.height));
        setSize({ width: w, height: h });
      }
    });
    ro.observe(el);

    const io = new IntersectionObserver(
      (entries) => {
        setIsVisible(entries[0]?.isIntersecting ?? true);
      },
      { threshold: 0.05 },
    );
    io.observe(el);

    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const isMobile = size.width < 640;
  const padLeft = isMobile ? 42 : 66;
  const padRight = isMobile ? 28 : 48;
  const padTop = isMobile ? 42 : 46;
  const padBottom = isMobile ? 38 : 44;
  const x0 = padLeft;
  const y0 = size.height - padBottom;
  const x3 = size.width - padRight;
  const y3 = padTop;

  // Static reduced-motion geometry at ~4.20x
  const staticProgress = Math.log(4.2) / Math.log(25);
  const staticPlane = evalCurvePoint(staticProgress, x0, y0, x3, y3);
  const staticSamples = 36;
  const staticPoints = Array.from({ length: staticSamples + 1 }, (_, i) => {
    const u = (i / staticSamples) * staticProgress;
    return evalCurvePoint(u, x0, y0, x3, y3);
  });
  const staticTrailD = staticPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const staticFillD = `${staticTrailD} L ${staticPlane.x.toFixed(1)} ${y0.toFixed(1)} L ${x0.toFixed(1)} ${y0.toFixed(1)} Z`;

  useEffect(() => {
    if (reducedMotion || !isVisible) return;

    let rafId = 0;
    let startTime: number | null = null;
    let lastTime = 0;
    let pausedAt: number | null = null;
    let puffAcc = 0;
    let puffCounter = 0;
    const puffs: Puff[] = [];

    const onVisibilityChange = () => {
      if (document.hidden) {
        pausedAt = performance.now();
      } else if (pausedAt !== null && startTime !== null) {
        startTime += performance.now() - pausedAt;
        lastTime = performance.now();
        pausedAt = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const tick = (now: number) => {
      if (document.hidden) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      if (startTime === null) {
        startTime = now;
        lastTime = now;
      }
      const dt = Math.min(50, Math.max(0, now - lastTime));
      lastTime = now;

      const elapsed = (now - startTime) % CYCLE_DURATION;

      let u = 0;
      let stageOpacity = 1;
      let isEmptyHold = false;

      if (elapsed < CLIMB_DURATION) {
        u = elapsed / CLIMB_DURATION;
        stageOpacity = 1;
      } else if (elapsed < CLIMB_DURATION + FADE_DURATION) {
        u = 1;
        const fadeU = (elapsed - CLIMB_DURATION) / FADE_DURATION;
        stageOpacity = Math.max(0, 1 - fadeU);
      } else {
        u = 0;
        stageOpacity = 0;
        isEmptyHold = true;
      }

      const mult = Math.exp(Math.log(25) * u);

      // Update readout text & tint
      if (readoutRef.current) {
        readoutRef.current.style.opacity = String(stageOpacity);
        readoutRef.current.textContent = isEmptyHold ? '1.00x' : formatMultiplier(mult);
        const redMix = Math.min(1, Math.max(0, (mult - 1.2) / 14));
        readoutRef.current.style.color = `color-mix(in srgb, #E5322D ${Math.round(
          redMix * 100,
        )}%, var(--text))`;
      }

      if (stageGroupRef.current) {
        stageGroupRef.current.style.opacity = String(stageOpacity);
      }

      // Compute trail points up to progress u
      const samples = Math.max(2, Math.round(u * 56));
      const pts: Array<{ x: number; y: number; angleDeg: number }> = [];
      for (let i = 0; i <= samples; i++) {
        const t = (i / samples) * u;
        pts.push(evalCurvePoint(t, x0, y0, x3, y3));
      }
      const head = pts[pts.length - 1] ?? evalCurvePoint(0, x0, y0, x3, y3);

      // Bob + subtle pitch wobble
      const bobY = Math.sin(elapsed * 0.0055) * 3.2;
      const wobbleDeg = Math.sin(elapsed * 0.0042) * 2.1;

      if (trailPathRef.current && fillPathRef.current) {
        if (isEmptyHold || u <= 0.002) {
          trailPathRef.current.setAttribute('d', '');
          fillPathRef.current.setAttribute('d', '');
        } else {
          const d = pts
            .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
            .join(' ');
          trailPathRef.current.setAttribute('d', d);
          fillPathRef.current.setAttribute(
            'd',
            `${d} L ${head.x.toFixed(1)} ${y0.toFixed(1)} L ${x0.toFixed(1)} ${y0.toFixed(1)} Z`,
          );
        }
      }

      if (planeGroupRef.current) {
        const scale = isMobile ? 0.64 : 1;
        planeGroupRef.current.setAttribute(
          'transform',
          `translate(${head.x.toFixed(1)}, ${(head.y + bobY).toFixed(1)}) rotate(${(
            head.angleDeg + wobbleDeg
          ).toFixed(2)}) scale(${scale})`,
        );
      }

      // 1800 deg/sec spinning 2-blade propeller
      if (propRef.current) {
        const propAngle = ((now * 1.8) % 360).toFixed(1);
        propRef.current.setAttribute('transform', `translate(31, 0) rotate(${propAngle})`);
      }

      // Parallax streaks drift backward
      if (streaksRef.current) {
        const children = streaksRef.current.children;
        for (let i = 0; i < children.length; i++) {
          const el = children[i] as SVGLineElement;
          const speed = Number(el.dataset.speed ?? 1);
          const span = size.width + 240;
          const base = Number(el.dataset.base ?? 0);
          const offset = ((base - elapsed * 0.08 * speed) % span + span) % span - 120;
          el.setAttribute('transform', `translate(${offset.toFixed(1)}, 0)`);
        }
      }

      // Exhaust puffs
      if (!isEmptyHold && elapsed < CLIMB_DURATION) {
        puffAcc += dt;
        if (puffAcc > 140) {
          puffAcc = 0;
          const rad = ((head.angleDeg + wobbleDeg) * Math.PI) / 180;
          puffs.push({
            id: puffCounter++,
            x: head.x - Math.cos(rad) * (isMobile ? 16 : 24),
            y: head.y + bobY - Math.sin(rad) * (isMobile ? 16 : 24),
            vx: -Math.cos(rad) * 0.035 - 0.015,
            vy: -Math.sin(rad) * 0.035 + 0.008,
            r: isMobile ? 2.5 : 3.5,
            life: 1,
          });
          if (puffs.length > 14) puffs.shift();
        }
      }
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += 0.012 * dt;
        p.life -= dt / 850;
        if (p.life <= 0) puffs.splice(i, 1);
      }
      if (puffsLayerRef.current) {
        puffsLayerRef.current.innerHTML = puffs
          .map(
            (p) =>
              `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(
                1,
              )}" fill="currentColor" opacity="${(Math.max(0, p.life) * 0.22 * stageOpacity).toFixed(
                2,
              )}" />`,
          )
          .join('');
      }

      // Milestone pills pop beside trail then fade
      MILESTONES.forEach((m, idx) => {
        const pill = milestoneRefs.current[idx];
        if (!pill) return;
        if (isEmptyHold || u < m.progress) {
          pill.style.opacity = '0';
          pill.style.transform = 'translate(-50%, -60%) scale(0.85)';
          return;
        }
        const since = u - m.progress;
        const life = since < 0.05 ? since / 0.05 : Math.max(0, 1 - (since - 0.05) / 0.22);
        const pt = evalCurvePoint(m.progress, x0, y0, x3, y3);
        pill.style.left = `${pt.x.toFixed(1)}px`;
        pill.style.top = `${Math.max(24, pt.y - 26).toFixed(1)}px`;
        pill.style.opacity = String(life * stageOpacity);
        pill.style.transform = `translate(-50%, -50%) scale(${(0.92 + life * 0.08).toFixed(2)})`;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [reducedMotion, isVisible, isMobile, size.width, size.height, x0, y0, x3, y3]);

  const ticks = isMobile
    ? [
        { label: '1x', frac: 0 },
        { label: '5x', frac: Math.log(5) / Math.log(25) },
        { label: '25x', frac: 1 },
      ]
    : [
        { label: '1x', frac: 0 },
        { label: '2x', frac: Math.log(2) / Math.log(25) },
        { label: '5x', frac: Math.log(5) / Math.log(25) },
        { label: '10x', frac: Math.log(10) / Math.log(25) },
        { label: '25x', frac: 1 },
      ];

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="relative w-full overflow-hidden rounded-[16px] border border-[var(--hairline)] bg-[var(--bg-elevated)] min-h-[340px] h-[72vw] max-h-[440px] sm:h-auto sm:aspect-[16/9] sm:min-h-[420px] sm:max-h-[560px] select-none"
    >
      {/* Subtle architectural grid lines */}
      <svg
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        className="absolute inset-0 w-full h-full text-[var(--text)]"
      >
        <defs>
          <linearGradient id="commons-trail-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E5322D" stopOpacity="0.24" />
            <stop offset="75%" stopColor="#E5322D" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#E5322D" stopOpacity="0" />
          </linearGradient>
          <filter id="commons-red-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Horizontal & vertical faint grid */}
        {ticks.map((t) => {
          const y = y0 - (y0 - y3) * t.frac;
          return (
            <g key={t.label}>
              <line
                x1={padLeft}
                y1={y}
                x2={size.width - padRight + 10}
                y2={y}
                stroke="var(--grid-line)"
                strokeWidth="1"
              />
              <text
                x={padLeft - 10}
                y={y + 4}
                textAnchor="end"
                fill="var(--text-faint)"
                className="font-mono text-[11px] tabular-nums"
              >
                {t.label}
              </text>
            </g>
          );
        })}

        {[0.25, 0.5, 0.75, 1].map((col) => {
          const x = x0 + (x3 - x0) * col;
          return (
            <line
              key={col}
              x1={x}
              y1={padTop - 12}
              x2={x}
              y2={y0}
              stroke="var(--grid-line)"
              strokeWidth="1"
            />
          );
        })}

        {/* Baseline & Left Axis */}
        <line
          x1={padLeft}
          y1={y0}
          x2={size.width - padRight + 10}
          y2={y0}
          stroke="var(--hairline-strong)"
          strokeWidth="1"
        />
        <line
          x1={padLeft}
          y1={padTop - 12}
          x2={padLeft}
          y2={y0}
          stroke="var(--hairline)"
          strokeWidth="1"
        />

        {/* Parallax cloud/wind streaks (3 layers) */}
        <g ref={streaksRef} opacity="0.55">
          {[
            { y: 0.22, w: 68, base: 140, speed: 0.7, op: 0.08 },
            { y: 0.36, w: 96, base: 420, speed: 1.0, op: 0.11 },
            { y: 0.48, w: 54, base: 720, speed: 1.35, op: 0.07 },
            { y: 0.62, w: 112, base: 260, speed: 0.85, op: 0.1 },
            { y: 0.76, w: 78, base: 620, speed: 1.25, op: 0.08 },
            { y: 0.3, w: 46, base: 860, speed: 1.5, op: 0.09 },
          ].map((s, idx) => (
            <line
              key={idx}
              data-base={s.base}
              data-speed={s.speed}
              x1="0"
              y1={size.height * s.y}
              x2={s.w}
              y2={size.height * s.y}
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              opacity={s.op}
            />
          ))}
        </g>

        {/* Exhaust puffs */}
        <g ref={puffsLayerRef} />

        {/* Active Trail + Plane */}
        <g ref={stageGroupRef}>
          <path
            ref={fillPathRef}
            d={reducedMotion ? staticFillD : ''}
            fill="url(#commons-trail-fill)"
          />
          <path
            ref={trailPathRef}
            d={reducedMotion ? staticTrailD : ''}
            fill="none"
            stroke="#E5322D"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="dark:[filter:url(#commons-red-glow)]"
          />

          {/* Original vintage single-engine sport aircraft SVG (side profile) */}
          <g
            ref={planeGroupRef}
            transform={
              reducedMotion
                ? `translate(${staticPlane.x.toFixed(1)}, ${staticPlane.y.toFixed(
                    1,
                  )}) rotate(${staticPlane.angleDeg.toFixed(2)}) scale(${isMobile ? 0.64 : 1})`
                : `translate(${x0}, ${y0}) scale(${isMobile ? 0.64 : 1})`
            }
          >
            {/* Tiny landing gear */}
            <path
              d="M 6 8 L 9 16 M 10 16 L 14 16"
              stroke="var(--text-muted)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="11" cy="17" r="2.6" fill="#1A1A1A" stroke="rgba(255,255,255,0.4)" strokeWidth="0.9" />
            <circle cx="-21" cy="8.5" r="1.4" fill="#1A1A1A" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7" />

            {/* Tail fin and horizontal stabilizer */}
            <path
              d="M -25 -1 L -31 -13 L -22 -13 L -15 -2 Z"
              fill="#B9201C"
              stroke="rgba(255,255,255,0.42)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <path
              d="M -27 1 L -33 3 L -22 3 Z"
              fill="#9E1A17"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="0.8"
            />

            {/* Rounded fuselage + round engine cowl */}
            <path
              d="M -26 0 C -22 -5.5, -10 -7.5, 4 -8 L 19 -7.5 C 26 -7, 29 -4, 29 0 C 29 4.5, 25 7.5, 18 8 L 2 8.5 C -10 8, -21 4.5, -26 0 Z"
              fill="#E5322D"
              stroke="rgba(255,255,255,0.48)"
              strokeWidth="1.1"
            />
            {/* Lower fuselage two-tone belly shade */}
            <path
              d="M -22 1.5 C -12 5.5, 4 7, 22 5.8 C 25 4.8, 27.5 3, 28 1 L -22 1.5 Z"
              fill="#B5211D"
              opacity="0.75"
            />
            {/* Vintage racing stripe */}
            <path
              d="M -18 0 L 22 0"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            {/* Canopy highlight */}
            <path
              d="M -7 -7.5 C -3 -14.5, 8 -14.5, 13 -7.5 Z"
              fill="#1E242B"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1"
            />
            <path
              d="M -3 -11 C 1 -12.8, 6 -12.6, 9.5 -9.5"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1"
              strokeLinecap="round"
            />
            {/* Single curved lower/mid wing */}
            <path
              d="M -1 2 C 4 0.5, 11 1, 14 3.5 C 12 6, 4 6.5, -2 4.8 Z"
              fill="#FF4A44"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="0.95"
            />
            {/* Nose spinner */}
            <path d="M 28.5 -3 L 33 0 L 28.5 3 Z" fill="#EDEDED" />

            {/* Motion-blur propeller disc + spinning 2-blade prop */}
            <ellipse
              cx="31"
              cy="0"
              rx="2.6"
              ry="16"
              fill="rgba(255,255,255,0.14)"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="0.6"
            />
            <g ref={propRef} transform="translate(31, 0) rotate(25)">
              <path
                d="M -1.3 -16 L 1.3 -16 L 0.9 0 L -0.9 0 Z"
                fill="#EDEDED"
                opacity="0.92"
              />
              <path
                d="M -0.9 0 L 0.9 0 L 1.3 16 L -1.3 16 Z"
                fill="#EDEDED"
                opacity="0.92"
              />
            </g>
          </g>
        </g>
      </svg>

      {/* Multiplier Readout */}
      <div
        className={`absolute pointer-events-none flex flex-col ${
          isMobile
            ? 'top-5 left-1/2 -translate-x-1/2 items-center text-center'
            : 'top-7 left-20 sm:left-24 items-start text-left'
        }`}
      >
        <div
          ref={readoutRef}
          className="font-mono font-semibold tracking-[-0.04em] leading-none tabular-nums"
          style={{
            fontSize: 'clamp(48px, 8vw, 108px)',
            color: reducedMotion ? 'var(--text)' : 'var(--text)',
          }}
        >
          {reducedMotion ? '4.20x' : '1.00x'}
        </div>
        <span className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
          virtual multiplier
        </span>
      </div>

      {/* Milestone pills beside trail */}
      {!reducedMotion
        ? MILESTONES.map((m, idx) => (
            <div
              key={m.label}
              ref={(el) => {
                milestoneRefs.current[idx] = el;
              }}
              style={{ opacity: 0 }}
              className="pointer-events-none absolute px-2 py-0.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-elevated)]/90 font-mono text-[11px] text-[var(--text)] tabular-nums transition-opacity duration-150"
            >
              {m.label}
            </div>
          ))
        : null}
    </div>
  );
};
