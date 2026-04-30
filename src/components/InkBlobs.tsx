import { motion } from 'framer-motion';
import type { ThemeColors } from '@/types';

interface InkBlobsProps {
  themeColors: ThemeColors;
}

// 水墨晕染装饰背景
// 替代旧的 OrganicBlobs（纯径向渐变）— 用 SVG turbulence + displacement 模拟笔触不规则
// 性能：单 SVG 共享 filter，DOM 极简
export function InkBlobs({ themeColors }: InkBlobsProps) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      {/* 极淡纸纹底层 */}
      <div className="absolute inset-0 paper-texture opacity-60" />

      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        aria-hidden
      >
        <defs>
          <filter id="ink-distort" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="5" />
            <feDisplacementMap in="SourceGraphic" scale="48" />
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id="ink-distort-sharp" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="11" />
            <feDisplacementMap in="SourceGraphic" scale="32" />
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <radialGradient id="ink-grad-1" cx="50%" cy="50%">
            <stop offset="0%" stopColor={themeColors.blob1} stopOpacity="1" />
            <stop offset="60%" stopColor={themeColors.blob1} stopOpacity="0.5" />
            <stop offset="100%" stopColor={themeColors.blob1} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ink-grad-2" cx="50%" cy="50%">
            <stop offset="0%" stopColor={themeColors.blob2} stopOpacity="1" />
            <stop offset="55%" stopColor={themeColors.blob2} stopOpacity="0.5" />
            <stop offset="100%" stopColor={themeColors.blob2} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ink-grad-seal" cx="50%" cy="50%">
            <stop offset="0%" stopColor={themeColors.sealSoft} stopOpacity="1" />
            <stop offset="70%" stopColor={themeColors.sealSoft} stopOpacity="0.4" />
            <stop offset="100%" stopColor={themeColors.sealSoft} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 右上墨斑 - 主色 */}
        <motion.ellipse
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          cx="1340"
          cy="180"
          rx="380"
          ry="320"
          fill="url(#ink-grad-1)"
          filter="url(#ink-distort)"
        />
        {/* 左下墨斑 - 辅色 */}
        <motion.ellipse
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          cx="180"
          cy="780"
          rx="440"
          ry="380"
          fill="url(#ink-grad-2)"
          filter="url(#ink-distort)"
        />
        {/* 中部小墨斑 - 朱砂晕（统一文化锚点） */}
        <motion.ellipse
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 1.8, delay: 0.3 }}
          cx="780"
          cy="500"
          rx="220"
          ry="180"
          fill="url(#ink-grad-seal)"
          filter="url(#ink-distort-sharp)"
        />
      </svg>
    </div>
  );
}
