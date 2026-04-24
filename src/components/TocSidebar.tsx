import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Bookmark as BookmarkIcon, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOverlay } from '@/hooks/useOverlay';
import type { TocItem, ThemeColors, Bookmark } from '@/types';

type Tab = 'toc' | 'bookmarks';

interface TocSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  toc: TocItem[];
  currentHref: string | null;
  onSelectItem: (href: string) => void;
  themeColors: ThemeColors;
  bookmarks: Bookmark[];
  onJumpToBookmark: (cfi: string) => void;
  onRemoveBookmark: (cfi: string) => void;
}

function TocItemComponent({
  item,
  level = 0,
  currentHref,
  onSelect,
  themeColors,
  activeRef,
}: {
  item: TocItem;
  level?: number;
  currentHref: string | null;
  onSelect: (href: string) => void;
  themeColors: ThemeColors;
  activeRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const isActive = currentHref && (item.href === currentHref || currentHref.includes(item.href));
  const paddingLeft = level * 14 + 20;

  return (
    <div>
      <button
        ref={isActive ? activeRef : undefined}
        onClick={() => onSelect(item.href)}
        className="w-full text-left py-2.5 pr-5 text-[13.5px] transition-colors duration-200 relative group"
        style={{
          paddingLeft: `${paddingLeft}px`,
          color: isActive ? themeColors.accent : themeColors.text,
          backgroundColor: isActive ? themeColors.accentSoft : 'transparent',
          fontWeight: isActive ? 500 : 400,
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
        <span className="line-clamp-2 leading-snug">{item.label}</span>
        {isActive && (
          <motion.div
            layoutId="tocActiveIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
            style={{ backgroundColor: themeColors.accent }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        )}
      </button>
      {item.subitems && item.subitems.length > 0 && (
        <div>
          {item.subitems.map((subItem) => (
            <TocItemComponent
              key={subItem.id}
              item={subItem}
              level={level + 1}
              currentHref={currentHref}
              onSelect={onSelect}
              themeColors={themeColors}
              activeRef={activeRef}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BookmarkRow({
  bm,
  themeColors,
  onJump,
  onRemove,
}: {
  bm: Bookmark;
  themeColors: ThemeColors;
  onJump: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="group relative flex items-start gap-3 py-2.5 pl-5 pr-10 cursor-pointer transition-colors"
      onClick={onJump}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = themeColors.accentSoft;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <BookmarkIcon
        size={13}
        style={{ color: themeColors.accent, marginTop: 3, flexShrink: 0 }}
        strokeWidth={2}
      />
      <div className="min-w-0 flex-1">
        <div
          className="text-[13.5px] leading-snug line-clamp-2"
          style={{ color: themeColors.text }}
        >
          {bm.title || '未命名位置'}
        </div>
        <div className="text-[11px] mt-0.5 tabular-nums" style={{ color: themeColors.icon }}>
          {new Date(bm.createdAt).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label="删除书签"
        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          color: themeColors.icon,
          backgroundColor: themeColors.accentSoft,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#d97757';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = themeColors.icon;
        }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

export function TocSidebar({
  isOpen,
  onClose,
  toc,
  currentHref,
  onSelectItem,
  themeColors,
  bookmarks,
  onJumpToBookmark,
  onRemoveBookmark,
}: TocSidebarProps) {
  const activeItemRef = useRef<HTMLButtonElement | null>(null);
  const [tab, setTab] = useState<Tab>('toc');

  useOverlay(isOpen, onClose);

  // 每次打开默认回到目录 Tab
  useEffect(() => {
    if (isOpen) setTab('toc');
  }, [isOpen]);

  // 打开目录时滚动到当前章节
  useEffect(() => {
    if (!isOpen || tab !== 'toc') return;
    const timer = setTimeout(() => {
      activeItemRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }, 380);
    return () => clearTimeout(timer);
  }, [isOpen, currentHref, toc, tab]);

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
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-3 top-3 bottom-3 w-[320px] flex flex-col glass-surface-strong overflow-hidden"
            style={{
              backgroundColor: themeColors.glass,
              border: `1px solid ${themeColors.glassBorder}`,
              borderRadius: '24px',
              boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 24px 50px -20px rgba(0,0,0,0.4)`,
              zIndex: 'var(--z-panel)' as unknown as number,
            }}
          >
            {/* Header */}
            <div
              className="h-[60px] flex items-center justify-between px-5"
              style={{ borderBottom: `1px solid ${themeColors.border}` }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 flex items-center justify-center"
                  style={{
                    borderRadius: '42% 58% 54% 46% / 48% 44% 56% 52%',
                    backgroundColor: themeColors.accentSoft,
                  }}
                >
                  {tab === 'toc' ? (
                    <BookOpen size={15} style={{ color: themeColors.accent }} strokeWidth={2.2} />
                  ) : (
                    <BookmarkIcon size={15} style={{ color: themeColors.accent }} strokeWidth={2.2} />
                  )}
                </div>
                <span
                  className="text-[15px] tracking-tight"
                  style={{
                    color: themeColors.text,
                    fontFamily: '"Noto Serif SC", serif',
                    fontWeight: 600,
                  }}
                >
                  {tab === 'toc' ? '目录' : '书签'}
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

            {/* Tabs */}
            <div
              className="px-4 pt-3 pb-2 flex items-center gap-1"
              style={{ borderBottom: `1px solid ${themeColors.border}` }}
            >
              {([
                { id: 'toc' as const, label: '目录', Icon: BookOpen, count: toc.length },
                { id: 'bookmarks' as const, label: '书签', Icon: BookmarkIcon, count: bookmarks.length },
              ]).map(({ id, label, Icon, count }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className="relative flex-1 px-3 py-1.5 rounded-full text-[12.5px] flex items-center justify-center gap-1.5 transition-colors"
                    style={{
                      color: active ? '#fff' : themeColors.icon,
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {active && (
                      <motion.span
                        layoutId="tocSidebarTab"
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.accent}d9)`,
                        }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      <Icon size={12} strokeWidth={2.2} />
                      {label}
                      {count > 0 && (
                        <span
                          className="tabular-nums text-[10.5px] opacity-80"
                        >
                          {count}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 pt-2">
              {tab === 'toc' ? (
                toc.length > 0 ? (
                  <div className="pb-8">
                    {toc.map((item) => (
                      <TocItemComponent
                        key={item.id}
                        item={item}
                        currentHref={currentHref}
                        onSelect={(href) => {
                          onSelectItem(href);
                          window.setTimeout(onClose, 120);
                        }}
                        themeColors={themeColors}
                        activeRef={activeItemRef}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center py-16 text-sm"
                    style={{ color: themeColors.icon }}
                  >
                    <BookOpen size={42} className="mb-3 opacity-30" />
                    <p>暂无目录</p>
                  </div>
                )
              ) : bookmarks.length > 0 ? (
                <div className="pb-8">
                  {bookmarks.map((bm) => (
                    <BookmarkRow
                      key={bm.cfi}
                      bm={bm}
                      themeColors={themeColors}
                      onJump={() => {
                        onJumpToBookmark(bm.cfi);
                        window.setTimeout(onClose, 120);
                      }}
                      onRemove={() => onRemoveBookmark(bm.cfi)}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-16 text-sm text-center px-8"
                  style={{ color: themeColors.icon }}
                >
                  <BookmarkIcon size={42} className="mb-3 opacity-30" />
                  <p className="mb-1">还没有书签</p>
                  <p className="text-[12px] leading-relaxed opacity-70">
                    阅读时点击右侧工具栏的书签图标即可加入此页
                  </p>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
