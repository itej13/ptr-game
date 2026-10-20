/**
 * C++ snippets live in /cpp/*.cpp — the single source of truth that is both compiled+tested
 * (scripts/verify-cpp.sh) and shown/graded in the game.
 *   // @title ...   // @desc ...   header lines = metadata (not shown)
 *   code //@label   marks a line so animation frames can highlight it (marker not shown)
 */
export interface Snippet {
  id: string;
  title: string;
  desc: string;
  code: string; // display code, markers stripped
  labels: Record<string, number>; // label -> 1-based line in `code`
}

const raw = import.meta.glob('/cpp/*.cpp', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export function parseSnippet(id: string, src: string): Snippet {
  let title = id;
  let desc = '';
  const lines: string[] = [];
  const labels: Record<string, number> = {};
  for (const rawLine of src.replace(/\r/g, '').split('\n')) {
    const meta = /^\s*\/\/\s*@(title|desc)\s+(.*)$/.exec(rawLine);
    if (meta) {
      if (meta[1] === 'title') title = meta[2].trim();
      else desc += (desc ? ' ' : '') + meta[2].trim();
      continue;
    }
    const mk = /\s*\/\/@([\w-]+(?:,[\w-]+)*)\s*$/.exec(rawLine);
    let line = rawLine;
    if (mk) {
      line = rawLine.slice(0, mk.index);
      for (const l of mk[1].split(',')) labels[l] = lines.length + 1;
    }
    lines.push(line);
  }
  while (lines.length && !lines[0].trim()) {
    lines.shift();
    for (const k in labels) labels[k]--;
  }
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  return { id, title, desc, code: lines.join('\n'), labels };
}

export const SNIPPETS: Record<string, Snippet> = Object.fromEntries(
  Object.entries(raw).map(([path, src]) => {
    const id = path.replace(/^.*\//, '').replace(/\.cpp$/, '');
    return [id, parseSnippet(id, src)];
  }),
);

export function snippet(id: string): Snippet {
  const s = SNIPPETS[id];
  if (!s) throw new Error(`Unknown C++ snippet "${id}"`);
  return s;
}
