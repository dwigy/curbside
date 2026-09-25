import { useEffect, useRef, useState } from 'react';

/** A number that flashes up/down when it changes. */
export function Tick({ value, children }: { value: number; children: React.ReactNode }) {
  const prev = useRef(value);
  const [dir, setDir] = useState<'up' | 'down' | ''>('');
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (Math.abs(value - prev.current) > 0.004) {
      setDir(value > prev.current ? 'up' : 'down');
      setKey((k) => k + 1);
      const id = setTimeout(() => setDir(''), 700);
      prev.current = value;
      return () => clearTimeout(id);
    }
    prev.current = value;
  }, [value]);
  return (
    <span key={key} className={`tick ${dir}`}>
      {children}
    </span>
  );
}
