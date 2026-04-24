import { BookOpen, List, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ThemeColors } from '@/types';

interface TopNavProps {
  title: string;
  onToggleToc: () => void;
  onGoToHome: () => void;
  onGoToBookshelf: () => void;
  currentView: 'home' | 'reader';
  themeColors: ThemeColors;
}

export function TopNav({ title, onToggleToc, onGoToHome, currentView, themeColors }: TopNavProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 h-[64px] z-[100] px-6 lg:px-10 flex items-center justify-between glass-surface"
      style={{
        backgroundColor: themeColors.glass,
        borderBottom: `1px solid ${themeColors.glassBorder}`,
        boxShadow: `0 1px 0 ${themeColors.border}, 0 8px 24px -20px rgba(0,0,0,0.25)`,
      }}
    >
      {/* Left — 品牌区 */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ rotate: -4, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          onClick={onGoToHome}
          aria-label="回到首页"
          title="回到首页"
          className="w-9 h-9 flex items-center justify-center"
          style={{
            borderRadius: '42% 58% 54% 46% / 48% 44% 56% 52%',
            background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.accentSoft})`,
            boxShadow: `0 4px 12px -2px ${themeColors.accentSoft}`,
          }}
        >
          <BookOpen size={18} style={{ color: '#fff', opacity: 0.95 }} strokeWidth={2.2} />
        </motion.button>

        <span
          className="text-[15px] font-medium max-w-[200px] lg:max-w-[420px] truncate tracking-tight"
          style={{
            color: themeColors.text,
            fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
          }}
        >
          {title || '静读 · EPUB Reader'}
        </span>

        {currentView === 'reader' && (
          <button
            onClick={onToggleToc}
            aria-label="目录"
            className="ml-1 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
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
            <List size={18} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Right — 仅在阅读页显示回首页按钮；首页自身的 Tab 已承担导航 */}
      <div className="flex items-center gap-1">
        {currentView === 'reader' && (
          <button
            onClick={onGoToHome}
            className="px-3.5 py-2 text-sm rounded-full transition-all duration-200 flex items-center gap-2"
            style={{
              color: themeColors.icon,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.accentSoft;
              e.currentTarget.style.color = themeColors.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = themeColors.icon;
            }}
          >
            <Home size={15} strokeWidth={2} />
            首页
          </button>
        )}
      </div>
    </motion.header>
  );
}
