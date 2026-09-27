const smoothstep = (edge0, edge1, value) => {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export function beamAlphaAt(shape, x, y) {
  const distance = shape === 'square'
    ? Math.max(Math.abs(x) / 0.84, Math.abs(y))
    : Math.hypot(x, y);
  const featherStart = shape === 'square' ? 0.82 : 0.68;
  return Math.round((1 - smoothstep(featherStart, 1, distance)) * 165);
}
