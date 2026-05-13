import { useCallback, useEffect, useState } from 'react';
import { List, Home as HomeIcon, ChevronRight, Minus, Square, X, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { ThemeColors } from '@/types';

interface TopNavProps {
  title: string;
  chapterTitle?: string;
  onToggleToc: () => void;
  onGoToHome: () => void;
  onGoToBookshelf: () => void;
  currentView: 'home' | 'reader';
  themeColors: ThemeColors;
}

export function TopNav({
  title,
  chapterTitle,
  onToggleToc,
  onGoToHome,
  currentView,
  themeColors,
}: TopNavProps) {
  const inReader = currentView === 'reader';
  const [isMaximized, setIsMaximized] = useState(false);

  // 监听最大化状态变化
  useEffect(() => {
    const win = getCurrentWindow();
    win.isMaximized().then(setIsMaximized);
    const unlisten = win.onResized(() => {
      win.isMaximized().then(setIsMaximized);
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  const handleMinimize  = useCallback(() => getCurrentWindow().minimize(), []);
  const handleMaximize  = useCallback(() => getCurrentWindow().toggleMaximize(), []);
  const handleClose     = useCallback(() => getCurrentWindow().close(), []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 h-[64px] z-[100] px-5 lg:px-9 flex items-center justify-between glass-surface select-none"
      style={{
        backgroundColor: themeColors.glass,
        borderBottom: `1px solid ${themeColors.glassBorder}`,
        boxShadow: `0 1px 0 ${themeColors.border}, 0 8px 24px -20px rgba(0,0,0,0.25)`,
      }}
    >
      {/* Left — 印章 logo + 品牌 + 章节面包屑 */}
      <div className="relative z-[1] flex items-center gap-3 min-w-0">
        <motion.button
          whileHover={{ rotate: -6, scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18 }}
          onClick={onGoToHome}
          aria-label="回到首页"
          title="回到首页"
          className="flex-shrink-0"
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <img
            src="/images/logo.png"
            alt="静读"
            style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }}
            draggable={false}
          />
        </motion.button>

        <div className="flex items-center gap-2 min-w-0">
          {/* 品牌名 / 书名 */}
          <span
            className="text-[14px] tracking-tight max-w-[140px] sm:max-w-[260px] lg:max-w-[400px] truncate"
            style={{
              color: themeColors.text,
              fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
              fontWeight: 600,
            }}
          >
            {inReader ? title : '静读 · 墨韵书房'}
          </span>

          {/* 章节面包屑（仅 reader 模式） */}
          {inReader && chapterTitle && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              key={chapterTitle}
              transition={{ duration: 0.3 }}
              className="hidden md:flex items-center gap-1.5 text-[12px] truncate max-w-[280px]"
              style={{ color: themeColors.icon }}
            >
              <ChevronRight size={12} strokeWidth={2} className="flex-shrink-0" />
              <span className="truncate">{chapterTitle}</span>
            </motion.span>
          )}

          {/* TOC 入口（仅 reader 模式） */}
          {inReader && (
            <button
              onClick={onToggleToc}
              aria-label="目录"
              title="目录"
              className="ml-1 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0"
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
              <List size={17} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* 拖动层 — 铺满整个 header，z-0 在最下层，按钮/文字在 z-1 之上自然不受影响 */}
      <div data-tauri-drag-region className="absolute inset-0 z-[0]" />

      {/* Right — 首页按钮 + 窗口控制 */}
      <div className="relative z-[1] flex items-center gap-1">
        {inReader && (
          <button
            onClick={onGoToHome}
            className="px-3.5 py-2 text-sm rounded-full transition-all duration-200 flex items-center gap-2 mr-2"
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
            <HomeIcon size={15} strokeWidth={2} />
            首页
          </button>
        )}

        {/* 分隔线 */}
        <div className="w-px h-4 mx-1" style={{ backgroundColor: themeColors.border }} />

        {/* 最小化 */}
        <button
          onClick={handleMinimize}
          aria-label="最小化"
          className="w-8 h-8 rounded-md flex items-center justify-center transition-all duration-150"
          style={{ color: themeColors.icon }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = themeColors.secondaryBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Minus size={14} strokeWidth={2} />
        </button>

        {/* 最大化 / 还原 */}
        <button
          onClick={handleMaximize}
          aria-label={isMaximized ? '还原' : '最大化'}
          className="w-8 h-8 rounded-md flex items-center justify-center transition-all duration-150"
          style={{ color: themeColors.icon }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = themeColors.secondaryBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {isMaximized
            ? <Square size={12} strokeWidth={2} />
            : <Maximize2 size={13} strokeWidth={2} />}
        </button>

        {/* 关闭 */}
        <button
          onClick={handleClose}
          aria-label="关闭"
          className="w-8 h-8 rounded-md flex items-center justify-center transition-all duration-150"
          style={{ color: themeColors.icon }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e81123';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = themeColors.icon;
          }}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </motion.header>
  );
}
