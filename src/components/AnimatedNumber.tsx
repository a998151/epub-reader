import { useEffect, useState } from 'react';
import { useMotionValue, useSpring, useMotionValueEvent } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  style?: React.CSSProperties;
  // 弹性参数（spring）
  stiffness?: number;
  damping?: number;
  // 后缀（如"%"）
  suffix?: string;
}

// 弹性整数滚动 — 用 framer-motion spring 在数值变化时给出回弹动效
export function AnimatedNumber({
  value,
  className,
  style,
  stiffness = 110,
  damping = 20,
  suffix = '',
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const mv = useMotionValue(value);
  const sv = useSpring(mv, { stiffness, damping });
  useEffect(() => { mv.set(value); }, [value, mv]);
  useMotionValueEvent(sv, 'change', (v) => setDisplay(Math.round(v)));
  return (
    <span className={className} style={style}>
      {display}{suffix}
    </span>
  );
}
