import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, StickyNote, Trash2 } from 'lucide-react';
import { useOverlay } from '@/hooks/useOverlay';
import type { ThemeColors } from '@/types';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  themeColors: ThemeColors;
  excerpt: string;
  initialNote: string;
  onSave: (note: string) => void;
  onRemove?: () => void;
}

export function NoteEditor({
  isOpen,
  onClose,
  themeColors,
  excerpt,
  initialNote,
  onSave,
  onRemove,
}: NoteEditorProps) {
  useOverlay(isOpen, onClose);
  const [value, setValue] = useState(initialNote);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialNote);
      const t = window.setTimeout(() => taRef.current?.focus(), 240);
      return () => window.clearTimeout(t);
    }
  }, [isOpen, initialNote]);

  const save = () => {
    onSave(value.trim());
    onClose();
  };

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
              backgroundColor: 'rgba(20, 16, 12, 0.32)',
              backdropFilter: 'blur(2px)',
              zIndex: 'var(--z-overlay)' as unknown as number,
            }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] max-w-[92vw] glass-surface-strong overflow-hidden"
            style={{
              backgroundColor: themeColors.glass,
              border: `1px solid ${themeColors.glassBorder}`,
              borderRadius: '22px',
              boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 30px 60px -20px rgba(0,0,0,0.5)`,
              zIndex: 'var(--z-panel)' as unknown as number,
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
                  <StickyNote size={13} style={{ color: themeColors.accent }} strokeWidth={2.2} />
                </div>
                <span
                  className="text-[14px] tracking-tight"
                  style={{
                    color: themeColors.text,
                    fontFamily: '"Noto Serif SC", serif',
                    fontWeight: 600,
                  }}
                >
                  添加批注
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="关闭"
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{ color: themeColors.icon }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-4">
              <blockquote
                className="text-[13px] leading-relaxed mb-4 pl-3 italic"
                style={{
                  borderLeft: `3px solid ${themeColors.accent}`,
                  color: themeColors.icon,
                }}
              >
                {excerpt.length > 180 ? excerpt.slice(0, 180) + '…' : excerpt}
              </blockquote>
              <textarea
                ref={taRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="写下你的思考..."
                rows={4}
                className="w-full rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed resize-none outline-none"
                style={{
                  backgroundColor: themeColors.accentSoft,
                  color: themeColors.text,
                  border: `1px solid ${themeColors.glassBorder}`,
                  fontFamily: 'inherit',
                }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    save();
                  }
                }}
              />
              <div className="flex items-center justify-between mt-4">
                <div>
                  {onRemove && (
                    <button
                      onClick={() => { onRemove(); onClose(); }}
                      className="px-3 py-1.5 rounded-full text-[12.5px] flex items-center gap-1.5 transition-colors"
                      style={{ color: themeColors.icon }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#d97757'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = themeColors.icon; }}
                    >
                      <Trash2 size={12} />
                      删除高亮
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-full text-[12.5px]"
                    style={{ color: themeColors.icon }}
                  >
                    取消
                  </button>
                  <button
                    onClick={save}
                    className="px-4 py-1.5 rounded-full text-[12.5px]"
                    style={{
                      background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.accent}e6)`,
                      color: '#fff',
                      fontWeight: 500,
                      boxShadow: `0 4px 12px -4px ${themeColors.accent}`,
                    }}
                  >
                    保存 <span className="opacity-60 ml-1 text-[10.5px]">⌘/Ctrl+↵</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
