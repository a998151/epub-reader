import { useEffect, useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Upload, BookOpen } from 'lucide-react';
import type { Book } from 'epubjs';

interface ReaderProps {
  book: Book | null;
  isLoaded: boolean;
  onRender: (element: HTMLElement) => void;
  onPrev: () => void;
  onNext: () => void;
  themeColors: {
    background: string;
    text: string;
    secondaryBg: string;
    border: string;
    icon: string;
  };
  onUploadFile: () => void;
  chapterTitle?: string;
  contentWidth?: number;
}

export function Reader({
  book,
  isLoaded,
  onRender,
  onPrev,
  onNext,
  themeColors,
  onUploadFile,
  chapterTitle,
  contentWidth = 100,
}: ReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (containerRef.current && isLoaded) {
      onRender(containerRef.current);
    }
  }, [isLoaded, onRender]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext]);

  // Wheel navigation
  useEffect(() => {
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
  }, [onPrev, onNext, isLoaded]);

  // Drag-and-drop handlers (for browser-compatible fallback)
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
    // In Tauri, drag-drop is handled via tauri://drag-drop event in App.tsx
    // This browser handler is a fallback
  }, []);

  if (!isLoaded || !book) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: themeColors.background }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`text-center ${isDragging ? 'scale-105' : ''} transition-transform duration-200`}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8"
          >
            <div
              className="w-24 h-24 rounded-2xl mx-auto flex items-center justify-center mb-6"
              style={{
                backgroundColor: themeColors.secondaryBg,
                border: `2px dashed ${isDragging ? '#4a9eff' : themeColors.border}`,
              }}
            >
              <BookOpen size={48} style={{ color: themeColors.icon }} />
            </div>
          </motion.div>

          <h2 className="text-2xl font-bold mb-4" style={{ color: themeColors.text }}>
            EPUB 阅读器
          </h2>
          <p className="text-base mb-8 max-w-md mx-auto" style={{ color: themeColors.icon }}>
            拖拽 EPUB 文件到此处，或点击按钮选择文件开始阅读
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUploadFile}
            className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto transition-all duration-200"
            style={{ backgroundColor: '#4a9eff', color: '#ffffff' }}
          >
            <Upload size={20} />
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
      {/* Loading Indicator */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
        style={{ backgroundColor: themeColors.background }}
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-2 border-t-transparent"
            style={{ borderColor: '#4a9eff', borderTopColor: 'transparent' }}
          />
          <span style={{ color: themeColors.icon }}>正在加载...</span>
        </div>
      </motion.div>

      {/* Chapter Title */}
      {chapterTitle && (
        <div
          className="fixed top-[60px] left-0 right-0 z-[90] px-4 py-2 text-center text-sm truncate"
          style={{
            backgroundColor: themeColors.background,
            color: themeColors.icon,
            borderBottom: `1px solid ${themeColors.border}`,
          }}
        >
          {chapterTitle}
        </div>
      )}

      {/* Reader Container */}
      <div
        className={`fixed inset-0 pb-16 md:pb-8 ${chapterTitle ? 'pt-[100px]' : 'pt-[60px]'}`}
        style={{ backgroundColor: themeColors.background }}
      >
        <div
          ref={containerRef}
          className="h-full mx-auto px-4 md:px-8 lg:px-16"
          style={{ width: `${contentWidth}%` }}
        />
      </div>

      {/* Navigation Buttons (Desktop) */}
      <div className="hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 items-center gap-4 z-[80]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPrev}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
          style={{ backgroundColor: themeColors.secondaryBg, color: themeColors.icon }}
          onMouseEnter={(e) => { e.currentTarget.style.color = themeColors.text; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = themeColors.icon; }}
        >
          <ChevronLeft size={24} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
          style={{ backgroundColor: themeColors.secondaryBg, color: themeColors.icon }}
          onMouseEnter={(e) => { e.currentTarget.style.color = themeColors.text; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = themeColors.icon; }}
        >
          <ChevronRight size={24} />
        </motion.button>
      </div>

      {/* Click Areas for Navigation */}
      <div
        className="fixed left-0 top-[60px] bottom-0 w-16 md:w-24 cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-200 z-[70]"
        onClick={onPrev}
      >
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${themeColors.secondaryBg}80` }}
        >
          <ChevronLeft size={20} style={{ color: themeColors.icon }} />
        </div>
      </div>
      <div
        className="fixed right-0 top-[60px] bottom-20 md:bottom-0 w-16 md:w-24 cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-200 z-[70]"
        onClick={onNext}
      >
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${themeColors.secondaryBg}80` }}
        >
          <ChevronRight size={20} style={{ color: themeColors.icon }} />
        </div>
      </div>
    </motion.div>
  );
}