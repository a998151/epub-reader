import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Highlighter, Check } from 'lucide-react';
import type { AnnotationColor, ThemeColors } from '@/types';

interface SelectionPopoverProps {
  visible: boolean;
  anchor: { x: number; y: number; width: number; height: number } | null;
  themeColors: ThemeColors;
  existingColor?: AnnotationColor;
  onPickColor: (color: AnnotationColor) => void;
  onAddNote: () => void;
  onClose: () => void;
}

// 与 AnnotationColor 对应的色值
export const HIGHLIGHT_COLORS: Record<AnnotationColor, string> = {
  yellow: '#fde68a',
  green: '#bbf7d0',
  blue: '#bae6fd',
  pink: '#fbcfe8',
  underline: 'transparent', // 下划线使用 accent
};

const COLOR_ORDER: AnnotationColor[] = ['yellow', 'green', 'blue', 'pink', 'underline'];

export function SelectionPopover({
  visible,
  anchor,
  themeColors,
  existingColor,
  onPickColor,
  onAddNote,
}: SelectionPopoverProps) {
  if (!anchor) return null;

  // 将 popover 放到选区上方，若空间不够则放下方
  const POPOVER_W = 288;
  const POPOVER_H = 44;
  const GAP = 8;
  let x = anchor.x + anchor.width / 2 - POPOVER_W / 2;
  const above = anchor.y - GAP - POPOVER_H;
  const below = anchor.y + anchor.height + GAP;
  const fitsAbove = above > 16;
  const y = fitsAbove ? above : below;
  x = Math.max(12, Math.min(window.innerWidth - POPOVER_W - 12, x));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: fitsAbove ? 4 : -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="fixed flex items-center gap-1 p-1.5 glass-surface-strong"
          style={{
            left: x,
            top: y,
            width: POPOVER_W,
            borderRadius: 999,
            backgroundColor: themeColors.glass,
            border: `1px solid ${themeColors.glassBorder}`,
            boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 20px 40px -18px rgba(0,0,0,0.5)`,
            zIndex: 'var(--z-panel)' as unknown as number,
          }}
        >
          {COLOR_ORDER.map((c) => {
            const isActive = existingColor === c;
            const bg = c === 'underline' ? 'transparent' : HIGHLIGHT_COLORS[c];
            return (
              <button
                key={c}
                onClick={() => onPickColor(c)}
                aria-label={c === 'underline' ? '下划线' : `高亮 ${c}`}
                className="relative w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  backgroundColor: bg,
                  border:
                    c === 'underline'
                      ? `2px solid ${themeColors.accent}`
                      : `1px solid ${themeColors.glassBorder}`,
                }}
              >
                {c === 'underline' && (
                  <span
                    className="absolute bottom-1 left-1.5 right-1.5 h-[2px] rounded-full"
                    style={{ backgroundColor: themeColors.accent }}
                  />
                )}
                {isActive && (
                  <Check
                    size={11}
                    strokeWidth={3}
                    style={{
                      color: c === 'underline' ? themeColors.accent : '#000',
                      opacity: 0.7,
                    }}
                  />
                )}
              </button>
            );
          })}
          <div className="w-px h-5 mx-1" style={{ backgroundColor: themeColors.border }} />
          <button
            onClick={onAddNote}
            aria-label="添加批注"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: themeColors.accent, backgroundColor: themeColors.accentSoft }}
          >
            <StickyNote size={14} strokeWidth={2.2} />
          </button>
          <button
            className="h-8 px-2.5 rounded-full flex items-center gap-1 text-[11px] tracking-tight"
            style={{ color: themeColors.icon }}
            disabled
            title="更多操作"
          >
            <Highlighter size={12} strokeWidth={2} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
