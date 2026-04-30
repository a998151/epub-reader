import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useOverlay } from '@/hooks/useOverlay';
import type { ThemeColors } from '@/types';

interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
  themeColors: ThemeColors;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;

export function ImageLightbox({ src, alt, onClose, themeColors }: ImageLightboxProps) {
  const isOpen = !!src;
  useOverlay(isOpen, onClose);

  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const draggingRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setTx(0);
      setTy(0);
    }
  }, [isOpen, src]);

  // 滚轮缩放
  useEffect(() => {
    if (!isOpen) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => {
        const next = s * (e.deltaY > 0 ? 0.9 : 1.1);
        return Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
      });
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [isOpen]);

  const onMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = { startX: e.clientX, startY: e.clientY, origX: tx, origY: ty };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    const d = draggingRef.current;
    setTx(d.origX + (e.clientX - d.startX));
    setTy(d.origY + (e.clientY - d.startY));
  };
  const onMouseUp = () => { draggingRef.current = null; };

  const reset = () => { setScale(1); setTx(0); setTy(0); };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(8, 6, 4, 0.82)',
            backdropFilter: 'blur(6px)',
            zIndex: 'var(--z-panel)' as unknown as number,
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onClick={(e) => {
            // 背景点击关闭，但图片上的点击不关闭
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.img
            key={src ?? 'img'}
            src={src ?? ''}
            alt={alt ?? ''}
            draggable={false}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            style={{
              transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
              maxWidth: '92vw',
              maxHeight: '88vh',
              objectFit: 'contain',
              cursor: scale > 1 ? 'grab' : 'zoom-in',
              userSelect: 'none',
              boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)',
              borderRadius: 8,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setScale((s) => (s === 1 ? 2 : 1));
            }}
          />

          {/* 控制栏 */}
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 glass-surface"
            style={{
              backgroundColor: themeColors.glass,
              border: `1px solid ${themeColors.glassBorder}`,
              borderRadius: '999px',
              boxShadow: `0 10px 30px -10px rgba(0,0,0,0.5)`,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setScale((s) => Math.max(MIN_SCALE, s * 0.8))}
              aria-label="缩小"
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ color: themeColors.icon }}
            >
              <ZoomOut size={16} />
            </button>
            <span
              className="px-3 text-[12px] tabular-nums"
              style={{ color: themeColors.text, minWidth: 56, textAlign: 'center' }}
            >
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(MAX_SCALE, s * 1.25))}
              aria-label="放大"
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ color: themeColors.icon }}
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={reset}
              aria-label="还原"
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ color: themeColors.icon }}
            >
              <RotateCcw size={15} />
            </button>
            <div style={{ width: 1, height: 20, backgroundColor: themeColors.border, margin: '0 4px' }} />
            <button
              onClick={onClose}
              aria-label="关闭"
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ color: themeColors.icon }}
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
