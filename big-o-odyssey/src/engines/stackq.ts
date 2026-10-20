import type { Frame, Scene, SNode, Tone } from '../core/types';

/** Stack (array), circular queue and array priority queue — mirroring the World 3 C++ snippets. */

export type Op = { op: 'push' | 'enq' | 'ins'; x: number } | { op: 'pop' | 'peek' | 'deq' | 'del' };

export function parseOps(s: string, kinds: { add: 'push' | 'enq' | 'ins'; rem: 'pop' | 'deq' | 'del'; peek?: boolean }): Op[] {
  const parts = s
    .split(/[,;\n]+/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (!parts.length) throw new Error('Enter some operations, e.g. "' + kinds.add + ' 5, ' + kinds.rem + '".');
  if (parts.length > 16) throw new Error('At most 16 operations.');
  return parts.map((p) => {
    const m = /^(\w+)\s*\(?\s*(-?\d+)?\s*\)?$/.exec(p);
    if (!m) throw new Error(`Can't read "${p}".`);
    const [, name, arg] = m;
    if (name === kinds.add || (kinds.add === 'enq' && name === 'enqueue') || (kinds.add === 'ins' && name === 'insert')) {
      if (arg === undefined) throw new Error(`"${name}" needs a number.`);
      const x = +arg;
      if (Math.abs(x) > 999) throw new Error('Keep numbers within ±999.');
      return { op: kinds.add, x };
    }
    if (name === kinds.rem || (kinds.rem === 'deq' && name === 'dequeue') || (kinds.rem === 'del' && (name === 'deletemax' || name === 'delete'))) return { op: kinds.rem };
    if (kinds.peek && name === 'peek') return { op: 'peek' };
    throw new Error(`Unknown operation "${name}".`);
  });
}

/* ---------------- stack ---------------- */

export function runStack(ops: Op[], MAX: number): { outputs: number[]; messages: number; top: number; contents: number[] } {
  const st: number[] = [];
  const outputs: number[] = [];
  let messages = 0;
  for (const o of ops) {
    if (o.op === 'push') {
      if (st.length === MAX) messages++;
      else st.push(o.x);
    } else if (o.op === 'pop') {
      if (!st.length) {
        messages++;
        outputs.push(-1);
      } else outputs.push(st.pop()!);
    } else if (o.op === 'peek') {
      if (!st.length) {
        messages++;
        outputs.push(-1);
      } else outputs.push(st[st.length - 1]);
    }
  }
  return { outputs, messages, top: st.length - 1, contents: st };
}

export function stackFrames(ops: Op[], MAX = 6): Frame[] {
  const st: { id: string; v: number }[] = [];
  let uid = 0;
  const F: Frame[] = [];
  const sc = (hi: Tone | null, extra: SNode[] = []): Scene => {
    const nodes: SNode[] = [];
    const x = 120;
    const y0 = 60 + MAX * 46;
    for (let i = 0; i < MAX; i++) {
      nodes.push({ id: `ix${i}`, x: x - 52, y: y0 - i * 46, shape: 'text', label: i, tone: 'muted', fontSize: 11 });
      if (!st[i]) nodes.push({ id: `slot${i}`, x, y: y0 - i * 46, w: 70, h: 40, shape: 'rect', tone: 'ghost' });
    }
    st.forEach((e, i) => nodes.push({ id: e.id, x, y: y0 - i * 46, w: 70, h: 40, shape: 'rect', label: e.v, tone: i === st.length - 1 && hi ? hi : 'base' }));
    const t = st.length - 1;
    nodes.push({ id: 'top', x: x + 82, y: y0 - Math.max(-1, t) * 46, w: 70, h: 22, shape: 'tag', label: `top=${t}`, tone: 'accent' });
    return { w: 360, h: y0 + 40, nodes: [...nodes, ...extra] };
  };
  F.push({ scene: sc(null), say: `Empty stack: top = −1, capacity MAX = ${MAX} (indices 0..${MAX - 1}).`, vars: { top: -1 } });
  for (const o of ops) {
    if (o.op === 'push') {
      if (st.length === MAX) {
        F.push({ scene: sc('warn'), line: 'full', say: `push(${o.x}): top == MAX − 1 → "Stack overflow". Nothing changes.`, vars: { top: st.length - 1 }, sfx: 'wrong' });
        continue;
      }
      st.push({ id: `s${uid++}`, v: o.x });
      F.push({ scene: sc('active'), line: 'push', say: `push(${o.x}): stk[++top] = ${o.x} — top becomes ${st.length - 1} first, then the value is stored there.`, vars: { top: st.length - 1 }, sfx: 'push' });
    } else if (o.op === 'pop') {
      if (!st.length) {
        F.push({ scene: sc(null), line: 'empty', say: `pop(): top == −1 → "Stack underflow", returns −1.`, vars: { top: -1 }, sfx: 'wrong' });
        continue;
      }
      const e = st[st.length - 1];
      F.push({ scene: sc('compare'), line: 'pop', say: `pop(): return stk[top--] = ${e.v}. Value read first, then top drops.`, vars: { top: st.length - 1, returns: e.v } });
      st.pop();
      F.push({ scene: sc(null, [{ id: e.id, x: 280, y: 80, w: 70, h: 40, shape: 'rect', label: e.v, tone: 'done', sub: 'popped' }]), line: 'pop', say: `${e.v} popped. top = ${st.length - 1}. (The value is still in the array cell — it's just no longer part of the stack.)`, vars: { top: st.length - 1 }, sfx: 'pop' });
    } else if (o.op === 'peek') {
      if (!st.length) {
        F.push({ scene: sc(null), say: `peek(): empty stack, returns −1.`, vars: { top: -1 }, sfx: 'wrong' });
        continue;
      }
      F.push({ scene: sc('compare'), line: 'peek', say: `peek(): returns stk[top] = ${st[st.length - 1].v} without changing top.`, vars: { top: st.length - 1, returns: st[st.length - 1].v } });
    }
  }
  return F;
}

/* ---------------- circular queue (H–S convention) ---------------- */

export function runCircular(ops: Op[], MAX: number): { outputs: number[]; full: number; empty: number; front: number; rear: number; contents: number[] } {
  const q = Array(MAX).fill(0);
  let front = 0;
  let rear = 0;
  let full = 0;
  let empty = 0;
  const outputs: number[] = [];
  for (const o of ops) {
    if (o.op === 'enq') {
      if ((rear + 1) % MAX === front) full++;
      else {
        rear = (rear + 1) % MAX;
        q[rear] = o.x;
      }
    } else if (o.op === 'deq') {
      if (front === rear) {
        empty++;
        outputs.push(-1);
      } else {
        front = (front + 1) % MAX;
        outputs.push(q[front]);
      }
    }
  }
  const contents: number[] = [];
  for (let i = (front + 1) % MAX; front !== rear; i = (i + 1) % MAX) {
    contents.push(q[i]);
    if (i === rear) break;
  }
  return { outputs, full, empty, front, rear, contents };
}

export function circularFrames(ops: Op[], MAX = 8, predict = false): Frame[] {
  const cells: ({ id: string; v: number } | null)[] = Array(MAX).fill(null);
  let front = 0;
  let rear = 0;
  let uid = 0;
  const F: Frame[] = [];
  const cx = 200;
  const cy = 190;
  const R = 120;
  const pos = (i: number, r = R): [number, number] => [cx + r * Math.sin((2 * Math.PI * i) / MAX), cy - r * Math.cos((2 * Math.PI * i) / MAX)];
  const sc = (hi: number | null, hiTone: Tone = 'active', gone?: { id: string; v: number }): Scene => {
    const nodes: SNode[] = [];
    for (let i = 0; i < MAX; i++) {
      const [x, y] = pos(i);
      const [ix, iy] = pos(i, R - 52);
      nodes.push({ id: `ix${i}`, x: ix, y: iy, shape: 'text', label: i, tone: 'muted', fontSize: 11 });
      const c = cells[i];
      const live = front !== rear && ((front < rear && i > front && i <= rear) || (front > rear && (i > front || i <= rear)));
      if (c) nodes.push({ id: c.id, x, y, w: 52, h: 38, shape: 'rect', label: c.v, tone: i === hi ? hiTone : live ? 'base' : 'muted' });
      else nodes.push({ id: `slot${i}`, x, y, w: 52, h: 38, shape: 'rect', tone: i === hi ? 'warn' : 'ghost' });
    }
    const [fx, fy] = pos(front, R + 50);
    const [rx, ry] = pos(rear, R + (front === rear ? 78 : 50));
    nodes.push({ id: 'front', x: fx, y: fy, w: 58, h: 20, shape: 'tag', label: 'front', tone: 'accent' });
    nodes.push({ id: 'rear', x: rx, y: ry, w: 52, h: 20, shape: 'tag', label: 'rear', tone: 'compare' });
    if (gone) nodes.push({ id: gone.id, x: 440, y: 60, w: 52, h: 38, shape: 'rect', label: gone.v, tone: 'done', sub: 'dequeued' });
    return { w: 500, h: 400, nodes };
  };
  const count = () => (rear - front + MAX) % MAX;
  F.push({ scene: sc(null), say: `Empty circular queue, MAX = ${MAX}: front = rear = 0. Usable capacity is MAX − 1 = ${MAX - 1}.`, vars: { front, rear, count: 0 } });
  for (const o of ops) {
    if (o.op === 'enq') {
      const isFull = (rear + 1) % MAX === front;
      const ask = predict ? { prompt: `enqueue(${o.x}) with front = ${front}, rear = ${rear}: what happens?`, options: isFull ? ['"Queue full" — rejected', `Stored at index ${(rear + 1) % MAX}`] : [`Stored at index ${(rear + 1) % MAX}`, '"Queue full" — rejected', `Stored at index ${rear}`], answer: 0, hint: 'Full test: (rear + 1) % MAX == front.' } : undefined;
      if (isFull) {
        F.push({ scene: sc((rear + 1) % MAX), line: 'full', say: `enqueue(${o.x}): (rear+1) % MAX = ${(rear + 1) % MAX} == front → "Queue full". The empty slot at front can't be used, or full and empty would look identical.`, vars: { front, rear, count: count() }, sfx: 'wrong', ask });
        continue;
      }
      rear = (rear + 1) % MAX;
      cells[rear] = { id: `q${uid++}`, v: o.x };
      F.push({ scene: sc(rear), line: 'store', say: `enqueue(${o.x}): rear = (rear + 1) % MAX = ${rear}; q[${rear}] = ${o.x}.`, vars: { front, rear, count: count() }, sfx: 'push', ask });
    } else if (o.op === 'deq') {
      if (front === rear) {
        F.push({ scene: sc(null), line: 'empty', say: `dequeue(): front == rear → "Queue empty", returns −1.`, vars: { front, rear }, sfx: 'wrong' });
        continue;
      }
      front = (front + 1) % MAX;
      const e = cells[front]!;
      cells[front] = null;
      F.push({ scene: sc(null, 'done', e), line: 'take', say: `dequeue(): front = (front + 1) % MAX = ${front}; return q[${front}] = ${e.v}.`, vars: { front, rear, count: count(), returns: e.v }, sfx: 'pop' });
    }
  }
  return F;
}

/* ---------------- priority queue (unsorted array) ---------------- */

export function runPQ(ops: Op[], MAX: number): { outputs: number[]; messages: number; contents: number[] } {
  const a: number[] = [];
  const outputs: number[] = [];
  let messages = 0;
  for (const o of ops) {
    if (o.op === 'ins') {
      if (a.length === MAX) messages++;
      else a.push(o.x);
    } else if (o.op === 'del') {
      if (!a.length) {
        messages++;
        outputs.push(-1);
        continue;
      }
      let m = 0;
      for (let i = 1; i < a.length; i++) if (a[i] > a[m]) m = i;
      outputs.push(a[m]);
      a[m] = a[a.length - 1];
      a.pop();
    }
  }
  return { outputs, messages, contents: a };
}

export function pqFrames(ops: Op[], predict = false): Frame[] {
  const a: { id: string; v: number }[] = [];
  let uid = 0;
  const F: Frame[] = [];
  const CAP = 10;
  const sc = (tone: (i: number) => Tone | undefined, ptr: Record<string, number | undefined> = {}, gone?: { id: string; v: number }): Scene => {
    const nodes: SNode[] = [];
    for (let i = 0; i < CAP; i++) {
      const x = 50 + i * 56;
      nodes.push({ id: `ix${i}`, x, y: 40, shape: 'text', label: i, tone: 'muted', fontSize: 11 });
      if (a[i]) nodes.push({ id: a[i].id, x, y: 80, w: 52, h: 42, shape: 'rect', label: a[i].v, tone: tone(i) ?? 'base' });
      else nodes.push({ id: `slot${i}`, x, y: 80, w: 52, h: 42, shape: 'rect', tone: 'ghost' });
    }
    let lv: Record<number, number> = {};
    for (const [k, i] of Object.entries(ptr)) {
      if (i === undefined) continue;
      const l = (lv[i] = (lv[i] ?? 0) + 1) - 1;
      nodes.push({ id: `p-${k}`, x: 50 + i * 56, y: 128 + l * 22, w: 40, h: 19, shape: 'tag', label: k, tone: 'accent' });
    }
    lv = {};
    if (gone) nodes.push({ id: gone.id, x: 300, y: 190, w: 52, h: 42, shape: 'rect', label: gone.v, tone: 'done', sub: 'deleteMax' });
    return { w: 60 + CAP * 56, h: 240, nodes };
  };
  F.push({ scene: sc(() => undefined, { n: 0 }), say: 'Empty priority queue: n = 0. Larger value = higher priority.', vars: { n: 0 } });
  for (const o of ops) {
    if (o.op === 'ins') {
      if (a.length === CAP) {
        F.push({ scene: sc(() => 'warn'), line: 'full', say: 'Overflow.', sfx: 'wrong' });
        continue;
      }
      a.push({ id: `p${uid++}`, v: o.x });
      F.push({ scene: sc((i) => (i === a.length - 1 ? 'active' : undefined), { n: a.length }), line: 'append', say: `insert(${o.x}): pq[n++] = ${o.x}. O(1) — no ordering is maintained.`, vars: { n: a.length }, sfx: 'push' });
    } else if (o.op === 'del') {
      if (!a.length) {
        F.push({ scene: sc(() => undefined, { n: 0 }), line: 'empty', say: 'deleteMax(): n == 0 → "Underflow", −1.', sfx: 'wrong' });
        continue;
      }
      let m = 0;
      F.push({ scene: sc((i) => (i === 0 ? 'compare' : undefined), { m: 0 }), line: 'init', say: 'deleteMax(): assume pq[0] is the largest (m = 0).', vars: { m: 0, n: a.length } });
      for (let i = 1; i < a.length; i++) {
        const better = a[i].v > a[m].v;
        F.push({ scene: sc((k) => (k === m ? 'compare' : k === i ? 'path' : undefined), { m, i }), line: 'cmp', say: `pq[${i}] = ${a[i].v} ${better ? '>' : '≤'} pq[m] = ${a[m].v}${better ? ` → m = ${i}` : ''}.`, vars: { m: better ? i : m, i }, sfx: 'compare' });
        if (better) m = i;
      }
      const e = a[m];
      const lastIdx = a.length - 1;
      F.push({
        scene: sc((k) => (k === m ? 'active' : k === lastIdx ? 'path' : undefined), { m, last: lastIdx }),
        line: 'take',
        say: `Max is pq[${m}] = ${e.v}. Move the last element (pq[${lastIdx}] = ${a[lastIdx].v}) into the hole and decrement n.`,
        vars: { m, n: a.length },
        ask: predict ? { prompt: 'Which value does deleteMax() return?', options: [...new Set([e.v, ...a.map((x) => x.v)])].slice(0, 4).map(String), answer: 0 } : undefined,
      });
      a[m] = a[lastIdx];
      a.pop();
      F.push({ scene: sc(() => undefined, { n: a.length }, e), line: 'fill', say: `Returned ${e.v}. n = ${a.length}. Cost: n − 1 comparisons — O(n) per deleteMax.`, vars: { n: a.length, returns: e.v }, sfx: 'pop' });
    }
  }
  return F;
}
