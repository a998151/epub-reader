import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, BookOpen, Leaf, Sprout, CloudMoon } from 'lucide-react';
import type { ReaderSettings } from '@/types';

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ReaderSettings['theme'];
  onThemeChange: (theme: ReaderSettings['theme']) => void;
  themeColors: {
    background: string;
    text: string;
    secondaryBg: string;
    border: string;
    icon: string;
  };
}

const themes = [
  {
    id: 'light' as const,
    label: '浅色',
    icon: Sun,
    preview: {
      bg: '#ffffff',
      text: '#333333',
    },
  },
  {
    id: 'dark' as const,
    label: '深色',
    icon: Moon,
    preview: {
      bg: '#1a1a1a',
      text: '#e8e8e8',
    },
  },
  {
    id: 'sepia' as const,
    label: '羊皮纸',
    icon: BookOpen,
    preview: {
      bg: '#f4ecd8',
      text: '#5b4636',
    },
  },
  {
    id: 'green' as const,
    label: '护眼绿',
    icon: Leaf,
    preview: {
      bg: '#c7edcc',
      text: '#2b4a2f',
    },
  },
  {
    id: 'darkGreen' as const,
    label: '墨绿',
    icon: Sprout,
    preview: {
      bg: '#1e2b1e',
      text: '#c5d6c5',
    },
  },
  {
    id: 'darkBlue' as const,
    label: '深夜蓝',
    icon: CloudMoon,
    preview: {
      bg: '#1a1f2e',
      text: '#c8cdd9',
    },
  },
];

export function ThemeSettings({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  themeColors,
}: ThemeSettingsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] bg-black/30"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed right-20 top-1/2 -translate-y-1/2 w-[240px] rounded-xl z-[120] overflow-hidden"
            style={{
              backgroundColor: themeColors.secondaryBg,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: themeColors.border }}
            >
              <div className="flex items-center gap-2">
                <Sun size={18} style={{ color: themeColors.icon }} />
                <span 
                  className="font-medium text-sm"
                  style={{ color: themeColors.text }}
                >
                  主题
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-all duration-200"
                style={{ color: themeColors.icon }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${themeColors.icon}20`;
                  e.currentTarget.style.color = themeColors.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = themeColors.icon;
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Theme Options */}
            <div className="p-4">
              <div className="space-y-2">
                {themes.map((theme) => {
                  const isActive = currentTheme === theme.id;

                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        onThemeChange(theme.id);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200"
                      style={{
                        backgroundColor: isActive ? `${themeColors.icon}20` : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = `${themeColors.icon}10`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {/* Preview */}
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm"
                        style={{
                          backgroundColor: theme.preview.bg,
                          border: `1px solid ${isActive ? '#4a9eff' : theme.id === 'light' ? '#e0e0e0' : '#3d3d3d'}`,
                        }}
                      >
                        <span
                          className="text-lg font-bold"
                          style={{ color: theme.preview.text }}
                        >
                          A
                        </span>
                      </div>

                      {/* Label */}
                      <div className="flex-1 text-left">
                        <span
                          className="text-sm font-medium block"
                          style={{ color: isActive ? themeColors.text : themeColors.icon }}
                        >
                          {theme.label}
                        </span>
                      </div>

                      {/* Checkmark */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#4a9eff' }}
                        >
                          <svg 
                            width="12" 
                            height="12" 
                            viewBox="0 0 12 12" 
                            fill="none"
                          >
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
