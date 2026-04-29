import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useMotionValueEvent } from 'framer-motion';
import type { ThemeColors } from '@/types';

interface ProgressBarProps {
  progress: number;
  themeColors: ThemeColors;
}

export function ProgressBar({ progress, themeColors }: ProgressBarProps) {
  // 弹性数字（hover tooltip 中显示）
  const [displayProgress, setDisplayProgress] = useState(progress);
  const mv = useMotionValue(progress);
  const sv = useSpring(mv, { stiffness: 110, damping: 20 });
  useEffect(() => { mv.set(progress); }, [progress, mv]);
  useMotionValueEvent(sv, 'change', (v) => setDisplayProgress(Math.round(v)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="group fixed bottom-0 left-0 right-0 h-3 z-[85] flex items-end"
    >
      {/* 极淡水墨底纹 */}
      <div
        className="relative h-[2px] w-full"
        style={{ backgroundColor: themeColors.inkSoft }}
      >
        {/* 水墨笔触渐变进度 */}
        <motion.div
          className="absolute left-0 top-0 h-full"
          style={{
            background: `linear-gradient(90deg,
              transparent 0%,
              ${themeColors.accent}55 8%,
              ${themeColors.accent}cc 30%,
              ${themeColors.accent} 70%,
              ${themeColors.seal} 100%)`,
            boxShadow: `0 0 8px ${themeColors.accent}55`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* 笔尖朱砂点 — 水墨末端的锋头 */}
        <motion.span
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
          style={{
            backgroundColor: themeColors.seal,
            boxShadow: `0 0 8px ${themeColors.seal}, 0 0 14px ${themeColors.seal}55`,
          }}
          initial={{ left: 0 }}
          animate={{ left: `calc(${progress}% - 4px)` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* hover tooltip — 弹性滚动 */}
      <div
        className="pointer-events-none absolute -top-9 right-5 px-3 py-1 rounded-full text-[11px] font-medium tabular-nums opacity-0 group-hover:opacity-100 transition-opacity glass-surface flex items-center gap-1.5"
        style={{
          backgroundColor: themeColors.glass,
          color: themeColors.text,
          border: `1px solid ${themeColors.glassBorder}`,
        }}
      >
        <span style={{ color: themeColors.icon, fontSize: 10 }}>已读</span>
        <span style={{ color: themeColors.accent, fontWeight: 600 }}>
          {displayProgress}%
        </span>
      </div>
    </motion.div>
  );
}
