import { useEffect, useRef, useState } from 'react';
import type { Scene, SEdge, SNode, Tone } from './types';

/**
 * One renderer for every visual in the game. Topics only describe *what* is on stage
 * (Scene); Stage tweens node positions between scenes so moves, swaps and rotations animate.
 */

interface DrawNode extends SNode {
  o: number; // opacity
}
interface Drawn {
  w: number;
  h: number;
  nodes: DrawNode[];
  edges: (SEdge & { o: number })[];
}

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function asDrawn(s: Scene): Drawn {
  return { w: s.w, h: s.h, nodes: s.nodes.map((n) => ({ ...n, o: 1 })), edges: (s.edges ?? []).map((e) => ({ ...e, o: 1 })) };
}

function mix(from: Drawn, to: Scene, k: number): Drawn {
  const prev = new Map(from.nodes.map((n) => [n.id, n]));
  const nodes: DrawNode[] = to.nodes.map((n) => {
    const p = prev.get(n.id);
    if (!p) return { ...n, o: k };
    return {
      ...n,
      x: lerp(p.x, n.x, k),
      y: lerp(p.y, n.y, k),
      w: n.w === undefined ? undefined : lerp(p.w ?? n.w, n.w, k),
      h: n.h === undefined ? undefined : lerp(p.h ?? n.h, n.h, k),
      o: lerp(p.o, 1, k),
    };
  });
  const ids = new Set(to.nodes.map((n) => n.id));
  for (const p of from.nodes) if (!ids.has(p.id) && p.o > 0.02) nodes.push({ ...p, o: p.o * (1 - k) });
  const key = (e: SEdge) => `${e.from}>${e.to}`;
  const prevE = new Set(from.edges.map(key));
  const edges = (to.edges ?? []).map((e) => ({ ...e, o: prevE.has(key(e)) ? 1 : k }));
  const nextE = new Set((to.edges ?? []).map(key));
  for (const e of from.edges) if (!nextE.has(key(e)) && e.o > 0.02) edges.push({ ...e, o: e.o * (1 - k) });
  return { w: lerp(from.w, to.w, k), h: lerp(from.h, to.h, k), nodes, edges };
}

export function Stage({
  scene,
  animate = true,
  onNodeClick,
  maxHeight = 420,
  label,
}: {
  scene: Scene;
  animate?: boolean;
  onNodeClick?: (id: string) => void;
  maxHeight?: number;
  label?: string;
}) {
  const [drawn, setDrawn] = useState<Drawn>(() => asDrawn(scene));
  const cur = useRef(drawn);
  cur.current = drawn;

  useEffect(() => {
    if (!animate || reduced()) {
      setDrawn(asDrawn(scene));
      return;
    }
    const from = cur.current;
    const t0 = performance.now();
    const D = 420;
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / D);
      setDrawn(k >= 1 ? asDrawn(scene) : mix(from, scene, ease(k)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [scene, animate]);

  const byId = new Map(drawn.nodes.map((n) => [n.id, n]));
  const tones: Tone[] = ['base', 'active', 'compare', 'done', 'muted', 'warn', 'path', 'accent', 'ghost'];

  return (
    <svg
      className="stage"
      viewBox={`0 0 ${Math.max(1, drawn.w)} ${Math.max(1, drawn.h)}`}
      style={{ maxHeight }}
      role="img"
      aria-label={label ?? 'Visualisation'}
    >
      <defs>
        {tones.map((t) => (
          <marker key={t} id={`arrow-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className={`arrowhead t-${t}`} />
          </marker>
        ))}
      </defs>
      <g>
        {drawn.edges.map((e, i) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          return <Edge key={`${e.from}>${e.to}#${i}`} e={e} a={a} b={b} />;
        })}
      </g>
      <g>
        {drawn.nodes.map((n) => (
          <Node key={n.id} n={n} onClick={onNodeClick} />
        ))}
      </g>
    </svg>
  );
}

function radiusToward(n: SNode, dx: number, dy: number): number {
  // distance from centre to the node boundary along direction (dx,dy)
  const len = Math.hypot(dx, dy) || 1;
  if (n.shape === 'circle' || n.shape === undefined) return (n.w ?? 40) / 2;
  if (n.shape === 'rect' || n.shape === 'tag') {
    const hw = (n.w ?? 40) / 2;
    const hh = (n.h ?? 32) / 2;
    const ux = Math.abs(dx / len);
    const uy = Math.abs(dy / len);
    return Math.min(ux > 1e-6 ? hw / ux : Infinity, uy > 1e-6 ? hh / uy : Infinity);
  }
  return 8;
}

function Edge({ e, a, b }: { e: SEdge & { o: number }; a: DrawNode; b: DrawNode }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const tone = e.tone ?? 'base';
  const bend = e.bend ?? 0;
  // control point for curved edges
  const mx = (a.x + b.x) / 2 - (dy / len) * bend;
  const my = (a.y + b.y) / 2 + (dx / len) * bend;
  const ra = radiusToward(a, (bend ? mx : b.x) - a.x, (bend ? my : b.y) - a.y);
  const rb = radiusToward(b, (bend ? mx : a.x) - b.x, (bend ? my : a.y) - b.y) + (e.directed ? 2 : 0);
  const dirA = bend ? norm(mx - a.x, my - a.y) : [dx / len, dy / len];
  const dirB = bend ? norm(mx - b.x, my - b.y) : [-dx / len, -dy / len];
  const x1 = a.x + dirA[0] * ra;
  const y1 = a.y + dirA[1] * ra;
  const x2 = b.x + dirB[0] * rb;
  const y2 = b.y + dirB[1] * rb;
  const d = bend ? `M${x1},${y1} Q${mx},${my} ${x2},${y2}` : `M${x1},${y1} L${x2},${y2}`;
  // label position: curve midpoint
  const lx = bend ? 0.25 * x1 + 0.5 * mx + 0.25 * x2 : (x1 + x2) / 2;
  const ly = bend ? 0.25 * y1 + 0.5 * my + 0.25 * y2 : (y1 + y2) / 2;
  const lbl = e.label === undefined ? '' : String(e.label);
  return (
    <g opacity={e.o} className={`edge t-${tone}`}>
      <path d={d} fill="none" strokeDasharray={e.dashed ? '5 5' : undefined} markerEnd={e.directed ? `url(#arrow-${tone})` : undefined} />
      {lbl && (
        <g transform={`translate(${lx},${ly})`}>
          <rect x={-(lbl.length * 4.2 + 6)} y={-10} width={lbl.length * 8.4 + 12} height={20} rx={6} className="edge-label-bg" />
          <text textAnchor="middle" dy="0.35em" className="edge-label">
            {lbl}
          </text>
        </g>
      )}
    </g>
  );
}

function norm(x: number, y: number): [number, number] {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

function Node({ n, onClick }: { n: DrawNode; onClick?: (id: string) => void }) {
  const tone = n.tone ?? 'base';
  const shape = n.shape ?? 'circle';
  const w = n.w ?? (shape === 'circle' ? 40 : 44);
  const h = n.h ?? (shape === 'circle' ? w : 36);
  const label = n.label === undefined ? '' : String(n.label);
  const fs = n.fontSize ?? (shape === 'tag' ? 12 : label.length > 4 ? 13 : 15);
  const sub = n.sub === undefined ? '' : String(n.sub);
  const subPos = n.subPos ?? 'below';
  const subXY =
    subPos === 'below' ? [0, h / 2 + 14] : subPos === 'above' ? [0, -h / 2 - 8] : subPos === 'left' ? [-w / 2 - 8, 0] : [w / 2 + 8, 0];
  const clickable = !!onClick && shape !== 'text';
  return (
    <g
      transform={`translate(${n.x},${n.y})`}
      opacity={n.o}
      className={`node s-${shape} t-${tone}${clickable ? ' clickable' : ''}`}
      onClick={clickable ? () => onClick!(n.id) : undefined}
      role={clickable ? 'button' : undefined}
      aria-label={clickable ? `${label}${sub ? ` (${sub})` : ''}` : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (ev) => (ev.key === 'Enter' || ev.key === ' ') && onClick!(n.id) : undefined}
    >
      {shape === 'circle' && <circle r={w / 2} />}
      {(shape === 'rect' || shape === 'tag') && <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={shape === 'tag' ? h / 2 : 7} />}
      {label && (
        <text
          className="node-label"
          textAnchor={shape === 'text' ? n.anchor ?? 'middle' : 'middle'}
          dy="0.35em"
          fontSize={fs}
        >
          {label}
        </text>
      )}
      {sub && (
        <text
          className="node-sub"
          x={subXY[0]}
          y={subXY[1]}
          dy={subPos === 'left' || subPos === 'right' ? '0.35em' : undefined}
          textAnchor={subPos === 'left' ? 'end' : subPos === 'right' ? 'start' : 'middle'}
        >
          {sub}
        </text>
      )}
    </g>
  );
}
