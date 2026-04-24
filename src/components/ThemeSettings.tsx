import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, BookOpen, Leaf, Sprout, CloudMoon, Palette } from 'lucide-react';
import { useOverlay } from '@/hooks/useOverlay';
import type { ReaderSettings, ThemeColors } from '@/types';

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ReaderSettings['theme'];
  onThemeChange: (theme: ReaderSettings['theme']) => void;
  themeColors: ThemeColors;
}

const themes = [
  {
    id: 'light' as const,
    label: '暖米白',
    icon: Sun,
    preview: { bg: '#f5f1ea', text: '#2d2a26', accent: '#c97b63' },
  },
  {
    id: 'dark' as const,
    label: '深栗夜',
    icon: Moon,
    preview: { bg: '#1a1814', text: '#e8e3d8', accent: '#d9a67e' },
  },
  {
    id: 'sepia' as const,
    label: '羊皮纸',
    icon: BookOpen,
    preview: { bg: '#f4ecd8', text: '#5b4636', accent: '#8c5a3f' },
  },
  {
    id: 'green' as const,
    label: '浅护眼',
    icon: Leaf,
    preview: { bg: '#e8eedc', text: '#2f4a32', accent: '#7a9e6e' },
  },
  {
    id: 'darkGreen' as const,
    label: '深墨绿',
    icon: Sprout,
    preview: { bg: '#1c241c', text: '#d4dcd0', accent: '#a8c293' },
  },
  {
    id: 'darkBlue' as const,
    label: '深夜蓝',
    icon: CloudMoon,
    preview: { bg: '#1a1f2a', text: '#d0d4de', accent: '#b5a0d0' },
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
            style={{ backgroundColor: 'rgba(20, 16, 12, 0.28)', backdropFilter: 'blur(2px)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: 12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.96, x: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-24 top-1/2 w-[260px] z-[120] overflow-hidden glass-surface-strong"
            style={{
              y: '-50%',
              backgroundColor: themeColors.glass,
              border: `1px solid ${themeColors.glassBorder}`,
              borderRadius: '22px',
              boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 20px 50px -20px rgba(0,0,0,0.4)`,
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: `1px solid ${themeColors.border}` }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-6 h-6 flex items-center justify-center"
                  style={{
                    borderRadius: '42% 58% 54% 46% / 48% 44% 56% 52%',
                    backgroundColor: themeColors.accentSoft,
                  }}
                >
                  <Palette size={13} style={{ color: themeColors.accent }} strokeWidth={2.2} />
                </div>
                <span
                  className="text-[14px] tracking-tight"
                  style={{
                    color: themeColors.text,
                    fontFamily: '"Noto Serif SC", serif',
                    fontWeight: 600,
                  }}
                >
                  主题
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

            <div className="p-3">
              <div className="space-y-1">
                {themes.map((theme) => {
                  const isActive = currentTheme === theme.id;

                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        onThemeChange(theme.id);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-200"
                      style={{
                        backgroundColor: isActive ? themeColors.accentSoft : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = themeColors.accentSoft;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div
                        className="w-11 h-11 flex items-center justify-center relative overflow-hidden"
                        style={{
                          backgroundColor: theme.preview.bg,
                          borderRadius: '14px 10px 14px 10px',
                          border: `1.5px solid ${isActive ? theme.preview.accent : 'transparent'}`,
                          boxShadow: '0 2px 8px -4px rgba(0,0,0,0.2)',
                        }}
                      >
                        <span
                          className="text-base"
                          style={{
                            color: theme.preview.text,
                            fontFamily: '"Noto Serif SC", serif',
                            fontWeight: 600,
                          }}
                        >
                          文
                        </span>
                        <span
                          className="absolute bottom-1 right-1 w-2 h-2 rounded-full"
                          style={{ backgroundColor: theme.preview.accent }}
                        />
                      </div>

                      <div className="flex-1 text-left">
                        <span
                          className="text-[13.5px]"
                          style={{
                            color: isActive ? themeColors.accent : themeColors.text,
                            fontWeight: isActive ? 500 : 400,
                          }}
                        >
                          {theme.label}
                        </span>
                      </div>

                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: themeColors.accent }}
                        >
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </button>
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
