import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOverlay } from '@/hooks/useOverlay';
import type { ThemeColors } from '@/types';

export interface SearchResult {
  cfi: string;
  excerpt: string;
  href: string;
}

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  themeColors: ThemeColors;
  onSearch: (q: string) => Promise<SearchResult[]>;
  onJumpTo: (cfi: string) => void;
  /** 章节 href → 章节标题 */
  resolveChapterTitle?: (href: string) => string | undefined;
  history: string[];
  onAddHistory: (q: string) => void;
  onClearHistory: () => void;
}

// 高亮匹配关键字的段落片段
function highlightExcerpt(excerpt: string, query: string, themeColors: ThemeColors) {
  if (!query) return excerpt;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = excerpt.split(new RegExp(`(${safe})`, 'ig'));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        style={{
          backgroundColor: themeColors.accentSoft,
          color: themeColors.accent,
          padding: '0 2px',
          borderRadius: '3px',
          fontWeight: 500,
        }}
      >
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export function SearchPanel({
  isOpen,
  onClose,
  themeColors,
  onSearch,
  onJumpTo,
  resolveChapterTitle,
  history,
  onAddHistory,
  onClearHistory,
}: SearchPanelProps) {
  useOverlay(isOpen, onClose);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [committed, setCommitted] = useState('');

  useEffect(() => {
    if (isOpen) {
      // 自动聚焦输入框
      const t = window.setTimeout(() => inputRef.current?.focus(), 260);
      return () => window.clearTimeout(t);
    } else {
      // 关闭时清空 UI 状态
      setQuery('');
      setResults([]);
      setCommitted('');
      setIsLoading(false);
    }
  }, [isOpen]);

  // 防抖搜索（350ms）
  useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      setCommitted('');
      setIsLoading(false);
      return;
    }
    if (q.length < 2) {
      setResults([]);
      setCommitted('');
      return;
    }
    setIsLoading(true);
    const t = window.setTimeout(async () => {
      const res = await onSearch(q);
      setResults(res);
      setCommitted(q);
      setIsLoading(false);
    }, 350);
    return () => window.clearTimeout(t);
  }, [query, isOpen, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q && committed === q && results.length > 0) {
      onAddHistory(q);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0"
            style={{
              backgroundColor: 'rgba(20, 16, 12, 0.32)',
              backdropFilter: 'blur(2px)',
              zIndex: 'var(--z-overlay)' as unknown as number,
            }}
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-3 top-3 bottom-3 w-[380px] flex flex-col glass-surface-strong overflow-hidden"
            style={{
              backgroundColor: themeColors.glass,
              border: `1px solid ${themeColors.glassBorder}`,
              borderRadius: '24px',
              boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 24px 50px -20px rgba(0,0,0,0.4)`,
              zIndex: 'var(--z-panel)' as unknown as number,
            }}
          >
            {/* Header with search input */}
            <div
              className="flex flex-col gap-3 px-5 pt-4 pb-3"
              style={{ borderBottom: `1px solid ${themeColors.border}` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 flex items-center justify-center"
                    style={{
                      borderRadius: '42% 58% 54% 46% / 48% 44% 56% 52%',
                      backgroundColor: themeColors.accentSoft,
                    }}
                  >
                    <Search size={14} style={{ color: themeColors.accent }} strokeWidth={2.3} />
                  </div>
                  <span
                    className="text-[15px] tracking-tight"
                    style={{
                      color: themeColors.text,
                      fontFamily: '"Noto Serif SC", serif',
                      fontWeight: 600,
                    }}
                  >
                    搜索全文
                  </span>
                </div>
                <button
                  onClick={onClose}
                  aria-label="关闭"
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
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
                  <X size={17} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div
                  className="relative flex items-center rounded-full px-3.5 py-2"
                  style={{
                    backgroundColor: themeColors.accentSoft,
                    border: `1px solid ${themeColors.glassBorder}`,
                  }}
                >
                  <Search size={14} style={{ color: themeColors.icon, flexShrink: 0 }} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="输入关键字搜索正文..."
                    className="flex-1 bg-transparent outline-none text-[13.5px] ml-2.5 placeholder:opacity-60"
                    style={{ color: themeColors.text }}
                  />
                  {isLoading && (
                    <Loader2
                      size={14}
                      className="animate-spin flex-shrink-0"
                      style={{ color: themeColors.accent }}
                    />
                  )}
                  {!isLoading && query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="清空"
                      className="flex-shrink-0"
                      style={{ color: themeColors.icon }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </form>
            </div>

            <ScrollArea className="flex-1">
              {/* 结果计数 */}
              {committed && !isLoading && (
                <div
                  className="px-5 pt-3 pb-1 text-[11px] tabular-nums"
                  style={{ color: themeColors.icon }}
                >
                  {results.length > 0
                    ? `在正文中找到 ${results.length} 处结果`
                    : '未找到匹配的内容'}
                </div>
              )}

              {/* 搜索历史 */}
              {!committed && !query && history.length > 0 && (
                <div className="px-5 py-4">
                  <div
                    className="flex items-center justify-between text-[11px] uppercase tracking-wider mb-2"
                    style={{ color: themeColors.icon, opacity: 0.75 }}
                  >
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} /> 搜索历史
                    </span>
                    <button
                      type="button"
                      onClick={onClearHistory}
                      className="text-[11px] normal-case tracking-normal hover:opacity-100 opacity-70"
                      style={{ color: themeColors.accent }}
                    >
                      清空
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {history.map((h) => (
                      <button
                        key={h}
                        onClick={() => setQuery(h)}
                        className="px-2.5 py-1 rounded-full text-[12px] transition-colors"
                        style={{
                          backgroundColor: themeColors.accentSoft,
                          color: themeColors.text,
                          border: `1px solid ${themeColors.glassBorder}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = themeColors.accent;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = themeColors.text;
                        }}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 结果列表 */}
              <div className="pb-6">
                {results.map((r, i) => {
                  const chapter = resolveChapterTitle?.(r.href);
                  return (
                    <button
                      key={`${r.cfi}-${i}`}
                      onClick={() => {
                        onJumpTo(r.cfi);
                        onAddHistory(committed);
                        window.setTimeout(onClose, 120);
                      }}
                      className="w-full text-left px-5 py-3 transition-colors border-b group"
                      style={{
                        borderColor: themeColors.border,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = themeColors.accentSoft;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {chapter && (
                        <div
                          className="text-[11px] mb-1 truncate"
                          style={{ color: themeColors.accent, fontWeight: 500 }}
                        >
                          {chapter}
                        </div>
                      )}
                      <div
                        className="text-[13px] leading-relaxed line-clamp-3"
                        style={{ color: themeColors.text }}
                      >
                        {highlightExcerpt(r.excerpt, committed, themeColors)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
