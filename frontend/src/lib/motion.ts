// Shared, module-level motion props: stable references, so list items don't receive
// fresh animation objects on every render.
export const FADE_UP = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
} as const;

const staggerCache = new Map<string, { delay: number }>();

/** Cached `transition` for item i: delay = i * step, capped at max. */
export function stagger(i: number, step = 0.03, max = 0.3): { delay: number } {
  const delay = Math.min(i * step, max);
  const key = `${delay}`;
  let t = staggerCache.get(key);
  if (!t) {
    t = { delay };
    staggerCache.set(key, t);
  }
  return t;
}
