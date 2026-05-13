import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Upload, BookOpen, BookMarked } from 'lucide-react';
import type { Book } from 'epubjs';
import type { ThemeColors } from '@/types';
import { ReaderDecor } from '@/components/ReaderDecor';

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
  progress?: number;
  bookTitle?: string;
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
  progress,
  bookTitle,
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
        className="h-screen flex items-center justify-center px-4 relative overflow-hidden"
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
      className="h-screen overflow-hidden relative"
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

      {/* Chapter title bar — 带装饰的章节标题条 */}
      {chapterTitle && (
        <motion.div
          key={chapterTitle}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-[64px] left-0 right-0 z-[90] flex items-center justify-center gap-2.5 px-6 py-2 glass-surface"
          style={{
            backgroundColor: themeColors.glass,
            borderBottom: `1px solid ${themeColors.border}`,
          }}
        >
          {/* 左侧装饰 */}
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            <div className="h-px w-8 md:w-16" style={{ background: `linear-gradient(90deg, transparent, ${themeColors.seal}55)` }} />
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: themeColors.seal, opacity: 0.55 }} />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <BookMarked size={11} className="flex-shrink-0" style={{ color: themeColors.seal, opacity: 0.7 }} />
            <span
              className="text-[12px] tracking-widest truncate max-w-[280px] md:max-w-[480px]"
              style={{
                color: themeColors.icon,
                fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
                letterSpacing: '0.08em',
              }}
            >
              {chapterTitle}
            </span>
          </div>

          {/* 右侧装饰 */}
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: themeColors.seal, opacity: 0.55 }} />
            <div className="h-px w-8 md:w-16" style={{ background: `linear-gradient(90deg, ${themeColors.seal}55, transparent)` }} />
          </div>
        </motion.div>
      )}

      {/* Reader container
          - 底部需预留给：移动端底栏 (~68px) / 桌面端翻页按钮 (~72px)
          - 右侧需预留给：桌面端右侧工具栏胶囊 (~60px) */}
      <div
        className={`fixed inset-0 pb-[76px] md:pb-[84px] md:pr-[72px] ${chapterTitle ? 'pt-[104px]' : 'pt-[68px]'}`}
        style={{ backgroundColor: themeColors.background }}
      >
        {/* 书页纸张阴影框 — 给内容区域增加立体感 */}
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            boxShadow: `inset 60px 0 80px -60px ${themeColors.inkSoft}, inset -60px 0 80px -60px ${themeColors.inkSoft}`,
          }}
        />
        <div
          ref={containerRef}
          className="h-full mx-auto px-4 md:px-8 lg:px-16 relative"
          style={{ width: `${contentWidth}%` }}
        />
      </div>

      {/* 阅读区域装饰层 — 纸纹 / 版栏 / 花括号 / 光晕 */}
      <ReaderDecor
        themeColors={themeColors}
        chapterTitle={chapterTitle}
        bookTitle={bookTitle}
      />

      {/* Desktop 导航栏 — 含章节 + 进度信息的胶囊导航 */}
      {/* 外层 div 负责定位+居中：左边到右侧工具栏起点，用 justify-center 实现真正居中 */}
      <div className="hidden md:flex fixed bottom-8 left-0 right-[72px] justify-center z-[80]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
        <div
          className="flex items-center glass-surface"
          style={{
            backgroundColor: themeColors.glass,
            border: `1px solid ${themeColors.glassBorder}`,
            borderRadius: '999px',
            boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 10px 36px -14px rgba(0,0,0,0.28)`,
            overflow: 'hidden',
          }}
        >
          {/* 上一页 */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onPrev}
            aria-label="上一页"
            className="h-11 px-4 flex items-center gap-1.5 transition-colors duration-200"
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
            <ChevronLeft size={17} strokeWidth={2.2} />
            <span className="text-[12px] hidden lg:block font-medium">上一页</span>
          </motion.button>

          {/* 分隔线 */}
          <div className="w-px h-5 flex-shrink-0" style={{ backgroundColor: themeColors.border }} />

          {/* 中间信息区 */}
          <div className="px-4 h-11 flex items-center gap-2.5 min-w-0">
            {/* 章节名 */}
            {chapterTitle ? (
              <span
                className="text-[12px] max-w-[120px] lg:max-w-[220px] truncate"
                style={{
                  color: themeColors.text,
                  fontFamily: '"Noto Serif SC", serif',
                  opacity: 0.85,
                }}
              >
                {chapterTitle}
              </span>
            ) : (
              <BookOpen size={14} style={{ color: themeColors.icon }} />
            )}

            {/* 进度 */}
            {progress !== undefined && (
              <>
                <div className="w-px h-3 flex-shrink-0" style={{ backgroundColor: themeColors.border }} />
                {/* 小进度条 */}
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-16 h-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: themeColors.inkSoft }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${themeColors.accent}, ${themeColors.seal})` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span
                    className="text-[11px] tabular-nums font-semibold flex-shrink-0"
                    style={{ color: themeColors.accent }}
                  >
                    {progress}%
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 分隔线 */}
          <div className="w-px h-5 flex-shrink-0" style={{ backgroundColor: themeColors.border }} />

          {/* 下一页 */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onNext}
            aria-label="下一页"
            className="h-11 px-4 flex items-center gap-1.5 transition-colors duration-200"
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
            <span className="text-[12px] hidden lg:block font-medium">下一页</span>
            <ChevronRight size={17} strokeWidth={2.2} />
          </motion.button>
        </div>
        </motion.div>
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
