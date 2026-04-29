import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette } from 'lucide-react';
import { useOverlay } from '@/hooks/useOverlay';
import type { ReaderSettings, ThemeColors } from '@/types';

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ReaderSettings['theme'];
  onThemeChange: (theme: ReaderSettings['theme']) => void;
  themeColors: ThemeColors;
}

// 每个主题的可视化锚点：bg / text / accent / seal（朱砂） + 简短诗句
const themePresets = [
  {
    id: 'light' as const,
    name: '宣纸',
    desc: '米黄宣纸 · 朱砂',
    snippet: '云开见月明',
    bg: '#f5f1ea', text: '#2d2a26', accent: '#c1453b', seal: '#c1453b',
  },
  {
    id: 'sepia' as const,
    name: '古籍',
    desc: '做旧米黄 · 赭墨',
    snippet: '古道照颜色',
    bg: '#f4ecd8', text: '#5b4636', accent: '#8c5a3f', seal: '#b03a2e',
  },
  {
    id: 'green' as const,
    name: '青松',
    desc: '松烟青绿',
    snippet: '松风吹解带',
    bg: '#e8eedc', text: '#2f4a32', accent: '#6b8e5e', seal: '#c1453b',
  },
  {
    id: 'dark' as const,
    name: '墨夜',
    desc: '墨黑 · 月光金',
    snippet: '月落乌啼霜',
    bg: '#1a1814', text: '#e8e3d8', accent: '#d4a574', seal: '#d04a3f',
  },
  {
    id: 'darkGreen' as const,
    name: '竹影',
    desc: '竹林深处',
    snippet: '竹影扫秋月',
    bg: '#1c241c', text: '#d4dcd0', accent: '#8aab7d', seal: '#d04a3f',
  },
  {
    id: 'darkBlue' as const,
    name: '夜空',
    desc: '靛蓝 · 星紫',
    snippet: '星垂平野阔',
    bg: '#1a1f2a', text: '#d0d4de', accent: '#c2acdc', seal: '#d04a3f',
  },
];

export function ThemeSettings({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  themeColors,
}: ThemeSettingsProps) {
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
            className="fixed inset-0 z-[110]"
            style={{ backgroundColor: 'rgba(20, 16, 12, 0.32)', backdropFilter: 'blur(3px)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: 12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.96, x: 12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-24 top-1/2 w-[360px] z-[120] overflow-hidden glass-surface-strong"
            style={{
              y: '-50%',
              backgroundColor: themeColors.glass,
              border: `1px solid ${themeColors.glassBorder}`,
              borderRadius: '24px',
              boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 24px 60px -22px rgba(0,0,0,0.45)`,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3.5"
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
                  <Palette size={14} style={{ color: themeColors.accent }} strokeWidth={2.2} />
                </div>
                <span
                  className="text-[14px] tracking-tight"
                  style={{
                    color: themeColors.text,
                    fontFamily: '"Noto Serif SC", serif',
                    fontWeight: 600,
                  }}
                >
                  主题 · 六境
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="关闭"
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
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
                <X size={15} />
              </button>
            </div>

            {/* 迷你书页预览网格 */}
            <div className="p-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                {themePresets.map((t, i) => {
                  const active = currentTheme === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        onThemeChange(t.id);
                      }}
                      className="relative group flex flex-col p-3 transition-shadow duration-300 overflow-hidden"
                      style={{
                        backgroundColor: t.bg,
                        borderRadius: '14px',
                        border: active
                          ? `2px solid ${t.accent}`
                          : `1px solid ${themeColors.border}`,
                        boxShadow: active
                          ? `0 8px 22px -10px ${t.accent}, 0 0 0 1px ${t.accent}30 inset`
                          : '0 4px 12px -6px rgba(0,0,0,0.18)',
                        minHeight: 88,
                      }}
                    >
                      {/* 主题名 */}
                      <span
                        className="text-[13px] mb-1"
                        style={{
                          color: t.text,
                          fontFamily: '"Noto Serif SC", serif',
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                        }}
                      >
                        {t.name}
                      </span>
                      {/* 经典句 */}
                      <span
                        className="text-[11px] leading-relaxed"
                        style={{
                          color: t.text,
                          opacity: 0.75,
                          fontFamily: '"Noto Serif SC", serif',
                        }}
                      >
                        {t.snippet}
                      </span>
                      {/* 描述（mini） */}
                      <span
                        className="text-[10px] mt-auto pt-1"
                        style={{ color: t.text, opacity: 0.5 }}
                      >
                        {t.desc}
                      </span>
                      {/* 朱印小点 */}
                      <span
                        className="absolute bottom-2 right-2 w-3 h-3 flex items-center justify-center"
                        style={{
                          backgroundColor: t.seal,
                          borderRadius: '2px',
                          boxShadow: `0 0 0 1px ${t.seal}40`,
                          transform: 'rotate(-4deg)',
                        }}
                      >
                        <span
                          style={{
                            color: 'rgba(255,248,240,0.9)',
                            fontSize: 8,
                            fontWeight: 700,
                            fontFamily: '"Noto Serif SC", serif',
                            lineHeight: 1,
                          }}
                        >
                          阅
                        </span>
                      </span>
                      {/* active 角标 */}
                      {active && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: t.accent }}
                        >
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="white"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
