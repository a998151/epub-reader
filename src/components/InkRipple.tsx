import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ripple {
  id: number;
  x: number;
  y: number;
  intensity: number; // 0..1，强度（hover 弱，click 强）
}

// 暴露 trigger 函数 + 涟漪数组的 hook
// 使用方式：将 ripples 传给 <InkRippleLayer/>，在事件回调中调用 trigger
// eslint-disable-next-line react-refresh/only-export-components
export function useInkRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const idRef = useRef(0);

  const trigger = useCallback((e: React.MouseEvent, intensity = 1) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++idRef.current;
    setRipples((prev) => [...prev, { id, x, y, intensity }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 700);
  }, []);

  return { ripples, trigger };
}

interface InkRippleLayerProps {
  ripples: Ripple[];
  color: string;
  size?: number; // 涟漪起始直径
}

// 墨晕涟漪层 — 放在按钮内部 absolute inset-0，圆角继承父级
export function InkRippleLayer({ ripples, color, size = 22 }: InkRippleLayerProps) {
  return (
    <span
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ borderRadius: 'inherit' }}
    >
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0.42 * r.intensity, scale: 0 }}
            animate={{ opacity: 0, scale: 5 + r.intensity * 1.5 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute rounded-full"
            style={{
              left: r.x,
              top: r.y,
              width: size,
              height: size,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${color} 0%, ${color}aa 35%, transparent 72%)`,
              filter: 'blur(2px)',
            }}
          />
        ))}
      </AnimatePresence>
    </span>
  );
}
