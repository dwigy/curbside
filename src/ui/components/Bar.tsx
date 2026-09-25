export function barColor(v: number): string {
  if (v < 25) return 'var(--bad)';
  if (v < 50) return 'var(--warn)';
  return 'var(--good)';
}

export function Bar({ value, large, label }: { value: number; large?: boolean; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`bar${large ? ' lg' : ''}`} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)}>
      <i style={{ width: `${v}%`, background: barColor(v) }} />
    </div>
  );
}
