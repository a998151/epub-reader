import { motion } from 'framer-motion';
import type { ThemeColors } from '@/types';

interface ProgressBarProps {
  progress: number;
  themeColors: ThemeColors;
}

export function ProgressBar({ progress, themeColors }: ProgressBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      // Slightly taller hover hit-zone so the tooltip is actually reachable,
      // while the visible bar stays a hairline via the inner track.
      className="group fixed bottom-0 left-0 right-0 h-3 z-[85] flex items-end"
    >
      {/* Visible track */}
      <div
        className="relative h-[2px] w-full"
        style={{ backgroundColor: themeColors.accentSoft }}
      >
        <motion.div
          className="h-full rounded-r-full"
          style={{
            background: `linear-gradient(90deg, ${themeColors.accent}, ${themeColors.accent}cc)`,
            boxShadow: `0 0 8px ${themeColors.accent}80`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div
        className="pointer-events-none absolute -top-8 right-5 px-2.5 py-1 rounded-full text-[11px] font-medium tabular-nums opacity-0 group-hover:opacity-100 transition-opacity glass-surface"
        style={{
          backgroundColor: themeColors.glass,
          color: themeColors.text,
          border: `1px solid ${themeColors.glassBorder}`,
        }}
      >
        {progress}%
      </div>
    </motion.div>
  );
}
