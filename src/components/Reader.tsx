import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Upload, BookOpen } from 'lucide-react';
import type { Book } from 'epubjs';
import type { ThemeColors } from '@/types';

interface ReaderProps {
  book: Book | null;
  isLoaded: boolean;
  displayed: boolean;
  onRender: (element: HTMLElement) => void;
  onPrev: () => void;
  onNext: () => void;
  themeColors: ThemeColors;
  onUploadFile: () => void;
  chapterTitle?: string;
  contentWidth?: number;
  navDisabled?: boolean;
}

export function Reader({
  book,
  isLoaded,
  displayed,
  onRender,
  onPrev,
  onNext,
  themeColors,
  onUploadFile,
  chapterTitle,
  contentWidth = 100,
  navDisabled = false,
}: ReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Briefly reveal the edge-click affordances on first display so new users
  // learn they exist. Fades out after 2.4s; regular hover still works afterwards.
  const [showEdgeHint, setShowEdgeHint] = useState(false);
  useEffect(() => {
    if (!displayed) return;
    setShowEdgeHint(true);
    const t = window.setTimeout(() => setShowEdgeHint(false), 2400);
    return () => window.clearTimeout(t);
  }, [displayed]);

  useEffect(() => {
    if (containerRef.current && isLoaded) {
      onRender(containerRef.current);
    }
  }, [isLoaded, onRender]);

  useEffect(() => {
    if (navDisabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't hijack arrow keys inside inputs, textareas or slider roles.
      const target = e.target as HTMLElement | null;
      if (target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.getAttribute('role') === 'slider'
      )) return;
      if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext, navDisabled]);

  useEffect(() => {
    if (navDisabled) return;
    let isThrottled = false;
    const throttleDelay = 300;

    const handleWheel = (e: WheelEvent) => {
      if (isThrottled) return;
      if (e.deltaY > 30) {
        isThrottled = true;
        onNext();
        setTimeout(() => { isThrottled = false; }, throttleDelay);
      } else if (e.deltaY < -30) {
        isThrottled = true;
        onPrev();
        setTimeout(() => { isThrottled = false; }, throttleDelay);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: true });
    }
    return () => { container?.removeEventListener('wheel', handleWheel); };
  }, [onPrev, onNext, isLoaded, navDisabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  if (!isLoaded || !book) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
        style={{ backgroundColor: themeColors.background }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* 有机 blob 装饰 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-40 -right-40 w-[560px] h-[560px]"
            style={{
              background: `radial-gradient(circle at 40% 40%, ${themeColors.blob1}, transparent 60%)`,
              filter: 'blur(40px)',
            }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-[560px] h-[560px]"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${themeColors.blob2}, transparent 65%)`,
              filter: 'blur(50px)',
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="text-center relative z-10 glass-surface-strong px-10 py-12 max-w-md"
          style={{
            backgroundColor: themeColors.glass,
            border: `1.5px ${isDragging ? 'dashed' : 'solid'} ${isDragging ? themeColors.accent : themeColors.glassBorder}`,
            borderRadius: '32px 26px 32px 26px',
            boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 30px 60px -24px rgba(0,0,0,0.3)`,
          }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-7"
          >
            <div
              className="w-24 h-24 mx-auto flex items-center justify-center"
              style={{
                backgroundColor: themeColors.accentSoft,
                borderRadius: '42% 58% 54% 46% / 48% 44% 56% 52%',
                boxShadow: `0 20px 40px -20px ${themeColors.accent}`,
              }}
            >
              <BookOpen size={44} style={{ color: themeColors.accent }} strokeWidth={1.5} />
            </div>
          </motion.div>

          <h2
            className="text-[26px] mb-3 tracking-tight"
            style={{
              color: themeColors.text,
              fontFamily: '"Noto Serif SC", serif',
              fontWeight: 600,
            }}
          >
            静读 · EPUB
          </h2>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: themeColors.icon }}>
            拖拽 EPUB 文件到此处，或点击按钮选择文件开始阅读
          </p>

          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            onClick={onUploadFile}
            className="px-6 py-3 rounded-full text-sm flex items-center gap-2 mx-auto"
            style={{
              background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.accent}e6)`,
              color: '#ffffff',
              fontWeight: 500,
              boxShadow: `0 8px 22px -8px ${themeColors.accent}, 0 1px 0 rgba(255,255,255,0.3) inset`,
            }}
          >
            <Upload size={17} strokeWidth={2.2} />
            选择文件
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen relative"
      style={{ backgroundColor: themeColors.background }}
    >
      {/* Loading overlay — driven by rendition 'displayed' event rather than a fixed timeout */}
      <AnimatePresence>
        {!displayed && (
          <motion.div
            key="reader-loading"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
            style={{ backgroundColor: themeColors.background }}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                className="w-9 h-9 rounded-full border-2 border-t-transparent"
                style={{ borderColor: themeColors.accent, borderTopColor: 'transparent' }}
              />
              <span className="text-sm" style={{ color: themeColors.icon }}>正在打开书页...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter title bar */}
      {chapterTitle && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-[64px] left-0 right-0 z-[90] px-5 py-2 text-center text-[13px] truncate glass-surface"
          style={{
            backgroundColor: themeColors.glass,
            color: themeColors.icon,
            borderBottom: `1px solid ${themeColors.border}`,
          }}
        >
          {chapterTitle}
        </motion.div>
      )}

      {/* Reader container
          - 底部需预留给：移动端底栏 (~68px) / 桌面端翻页按钮 (~72px)
          - 右侧需预留给：桌面端右侧工具栏胶囊 (~60px) */}
      <div
        className={`fixed inset-0 pb-[76px] md:pb-[84px] md:pr-[72px] ${chapterTitle ? 'pt-[104px]' : 'pt-[68px]'}`}
        style={{ backgroundColor: themeColors.background }}
      >
        <div
          ref={containerRef}
          className="h-full mx-auto px-4 md:px-8 lg:px-16"
          style={{ width: `${contentWidth}%` }}
        />
      </div>

      {/* 古籍版口纹饰 — 左右两侧极淡的双线 + 鱼尾，仅桌面端 */}
      <div
        className="hidden lg:flex fixed left-3 top-[140px] bottom-[120px] flex-col items-center justify-center gap-3 pointer-events-none z-[1]"
        style={{ opacity: 0.22, color: themeColors.ink }}
      >
        <div className="w-px flex-1" style={{ background: 'currentColor' }} />
        <span className="fish-tail-icon" />
        <div className="w-px flex-1" style={{ background: 'currentColor' }} />
      </div>
      <div
        className="hidden lg:flex fixed right-[88px] top-[140px] bottom-[120px] flex-col items-center justify-center gap-3 pointer-events-none z-[1]"
        style={{ opacity: 0.22, color: themeColors.ink }}
      >
        <div className="w-px flex-1" style={{ background: 'currentColor' }} />
        <span className="fish-tail-icon" />
        <div className="w-px flex-1" style={{ background: 'currentColor' }} />
      </div>

      {/* Desktop 导航按钮 — 玻璃圆形 */}
      <div className="hidden md:flex fixed bottom-7 left-1/2 -translate-x-1/2 items-center gap-3 z-[80]">
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={onPrev}
          aria-label="上一页"
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 glass-surface"
          style={{
            backgroundColor: themeColors.glass,
            border: `1px solid ${themeColors.glassBorder}`,
            color: themeColors.icon,
            boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 8px 24px -10px rgba(0,0,0,0.2)`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = themeColors.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = themeColors.icon;
          }}
        >
          <ChevronLeft size={22} strokeWidth={2.1} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={onNext}
          aria-label="下一页"
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 glass-surface"
          style={{
            backgroundColor: themeColors.glass,
            border: `1px solid ${themeColors.glassBorder}`,
            color: themeColors.icon,
            boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 8px 24px -10px rgba(0,0,0,0.2)`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = themeColors.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = themeColors.icon;
          }}
        >
          <ChevronRight size={22} strokeWidth={2.1} />
        </motion.button>
      </div>

      {/* 边缘点击区 */}
      <div
        className="group fixed left-0 top-[64px] bottom-0 w-14 md:w-20 cursor-pointer z-[70]"
        onClick={onPrev}
        aria-label="上一页"
      >
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center glass-surface transition-opacity duration-300 group-hover:opacity-100"
          style={{
            backgroundColor: themeColors.glass,
            border: `1px solid ${themeColors.glassBorder}`,
            opacity: showEdgeHint ? 0.85 : 0,
          }}
        >
          <ChevronLeft size={18} style={{ color: themeColors.icon }} />
        </div>
      </div>
      <div
        className="group fixed right-0 top-[64px] bottom-20 md:bottom-0 w-14 md:w-20 cursor-pointer z-[70]"
        onClick={onNext}
        aria-label="下一页"
      >
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center glass-surface transition-opacity duration-300 group-hover:opacity-100"
          style={{
            backgroundColor: themeColors.glass,
            border: `1px solid ${themeColors.glassBorder}`,
            opacity: showEdgeHint ? 0.85 : 0,
          }}
        >
          <ChevronRight size={18} style={{ color: themeColors.icon }} />
        </div>
      </div>
    </motion.div>
  );
}
