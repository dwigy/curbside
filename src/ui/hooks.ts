import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hold-to-repeat. Tap fires once (onTap). Holding past `delay` calls onRepeat
 * on an accelerating interval until it returns false or the pointer lifts.
 */
export function useHold(onTap: () => void, onRepeat: () => boolean, disabled: boolean) {
  const timer = useRef<number | null>(null);
  const held = useRef(false);
  const [holding, setHolding] = useState(false);

  const stop = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(() => {
    if (disabled) return;
    held.current = false;
    let interval = 260;
    const tick = () => {
      held.current = true;
      setHolding(true);
      if (!onRepeat()) return stop();
      interval = Math.max(70, interval * 0.85);
      timer.current = window.setTimeout(tick, interval);
    };
    timer.current = window.setTimeout(tick, 450);
  }, [disabled, onRepeat, stop]);

  return {
    holding,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        start();
      },
      onPointerUp: stop,
      onPointerLeave: stop,
      onPointerCancel: stop,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      onClick: () => {
        if (held.current) {
          held.current = false;
          return;
        }
        stop();
        if (!disabled) onTap();
      },
    },
  };
}
