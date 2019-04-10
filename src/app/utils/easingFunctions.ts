export function easeInCubic(t: number): number {
  return t * t * t;
}

export function easeInOutCubic(t: number): number {
  return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}