import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { useOverlay } from '@/hooks/useOverlay';
import type { ThemeColors } from '@/types';

interface ShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  themeColors: ThemeColors;
}

const groups: Array<{
  title: string;
  items: Array<{ keys: string[]; label: string }>;
}> = [
  {
    title: '翻页',
    items: [
      { keys: ['←'], label: '上一页' },
      { keys: ['→'], label: '下一页' },
      { keys: ['滚轮'], label: '翻页' },
      { keys: ['点击屏幕两侧'], label: '翻页' },
    ],
  },
  {
    title: '面板',
    items: [
      { keys: ['T'], label: '打开目录 / 书签' },
      { keys: ['S'], label: '搜索全文' },
      { keys: ['B'], label: '添加 / 移除书签' },
      { keys: ['Esc'], label: '关闭任意浮层' },
    ],
  },
  {
    title: '阅读',
    items: [
      { keys: ['F'], label: '切换沉浸阅读' },
      { keys: ['Esc'], label: '退出沉浸阅读' },
      { keys: ['双击内容区'], label: '退出沉浸阅读' },
    ],
  },
  {
    title: '其他',
    items: [
      { keys: ['?'], label: '打开 / 关闭本面板' },
      { keys: ['H'], label: '回到首页' },
    ],
  },
];

function Kbd({ label, themeColors }: { label: string; themeColors: ThemeColors }) {
  const isSingle = label.length === 1;
  return (
    <kbd
      className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[12px] font-medium tabular-nums"
      style={{
        minWidth: isSingle ? 26 : undefined,
        height: 24,
        backgroundColor: themeColors.accentSoft,
        color: themeColors.accent,
        border: `1px solid ${themeColors.accent}30`,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        boxShadow: `0 1px 0 ${themeColors.accent}20 inset`,
      }}
    >
      {label}
    </kbd>
  );
}

export function ShortcutsPanel({ isOpen, onClose, themeColors }: ShortcutsPanelProps) {
  useOverlay(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0"
            style={{
              backgroundColor: 'rgba(20, 16, 12, 0.36)',
              backdropFilter: 'blur(2px)',
              zIndex: 'var(--z-overlay)' as unknown as number,
            }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[92vw] max-h-[84vh] overflow-hidden glass-surface-strong"
            style={{
              backgroundColor: themeColors.glass,
              border: `1px solid ${themeColors.glassBorder}`,
              borderRadius: '24px',
              boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 30px 60px -20px rgba(0,0,0,0.45)`,
              zIndex: 'var(--z-panel)' as unknown as number,
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: `1px solid ${themeColors.border}` }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 flex items-center justify-center"
                  style={{
                    borderRadius: '42% 58% 54% 46% / 48% 44% 56% 52%',
                    backgroundColor: themeColors.accentSoft,
                  }}
                >
                  <Keyboard size={14} style={{ color: themeColors.accent }} strokeWidth={2.2} />
                </div>
                <span
                  className="text-[16px] tracking-tight"
                  style={{
                    color: themeColors.text,
                    fontFamily: '"Noto Serif SC", serif',
                    fontWeight: 600,
                  }}
                >
                  键盘快捷键
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="关闭"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ color: themeColors.icon }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = themeColors.accentSoft;
                  e.currentTarget.style.color = themeColors.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = themeColors.icon;
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 overflow-y-auto max-h-[70vh]">
              {groups.map((group) => (
                <div key={group.title}>
                  <h3
                    className="text-[11px] uppercase tracking-wider mb-3"
                    style={{ color: themeColors.icon, opacity: 0.75 }}
                  >
                    {group.title}
                  </h3>
                  <div className="space-y-2.5">
                    {group.items.map((it) => (
                      <div key={it.label} className="flex items-center justify-between gap-4">
                        <span className="text-[13.5px]" style={{ color: themeColors.text }}>
                          {it.label}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {it.keys.map((k, i) => (
                            <Kbd key={i} label={k} themeColors={themeColors} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
