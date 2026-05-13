import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useMotionValueEvent } from 'framer-motion';
import type { ThemeColors } from '@/types';

interface ProgressBarProps {
  progress: number;
  themeColors: ThemeColors;
}

export function ProgressBar({ progress, themeColors }: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(progress);
  const mv = useMotionValue(progress);
  const sv = useSpring(mv, { stiffness: 110, damping: 20 });
  useEffect(() => { mv.set(progress); }, [progress, mv]);
  useMotionValueEvent(sv, 'change', (v) => setDisplayProgress(Math.round(v)));

  // 粗略估算剩余时间（按平均 400 字/分钟，300 字/页估算）
  const remaining = progress > 0 && progress < 100
    ? Math.max(1, Math.round((100 - progress) * 0.15))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="group fixed bottom-0 left-0 right-0 z-[85]"
    >
      {/* Hover 时展开的信息条 */}
      <motion.div
        initial={false}
        className="w-full flex items-center justify-between px-5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(0deg, ${themeColors.glass}cc, transparent)`,
        }}
      >
        <span className="text-[11px] tabular-nums" style={{ color: themeColors.icon }}>
          {displayProgress === 0 ? '尚未开始' : `已读 ${displayProgress}%`}
        </span>
        {remaining && (
          <span className="text-[11px]" style={{ color: themeColors.icon }}>
            约 <span style={{ color: themeColors.accent, fontWeight: 600 }}>{remaining}</span> 分钟读完
          </span>
        )}
      </motion.div>

      {/* 进度条轨道 */}
      <div
        className="relative h-[3px] w-full"
        style={{ backgroundColor: themeColors.inkSoft }}
      >
        {/* 已读进度 — 水墨渐变 */}
        <motion.div
          className="absolute left-0 top-0 h-full"
          style={{
            background: `linear-gradient(90deg,
              ${themeColors.accent}44 0%,
              ${themeColors.accent}bb 25%,
              ${themeColors.accent} 65%,
              ${themeColors.seal} 100%)`,
            boxShadow: `0 0 10px ${themeColors.accent}44`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* 未读区域微光 — 仅在 hover 时显示 */}
        <div
          className="absolute top-0 h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            left: `${progress}%`,
            right: 0,
            background: `linear-gradient(90deg, ${themeColors.inkSoft}, transparent)`,
          }}
        />

        {/* 笔尖朱砂点 */}
        <motion.span
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none"
          style={{
            backgroundColor: themeColors.seal,
            boxShadow: `0 0 8px ${themeColors.seal}cc, 0 0 18px ${themeColors.seal}55`,
          }}
          initial={{ left: 0 }}
          animate={{ left: `calc(${progress}% - 5px)` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* 呼吸光晕 */}
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: themeColors.seal }}
            animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.span>
      </div>
    </motion.div>
  );
}
