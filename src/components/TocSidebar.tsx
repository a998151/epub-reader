import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TocItem } from '@/types';

interface TocSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  toc: TocItem[];
  currentHref: string | null;
  onSelectItem: (href: string) => void;
  themeColors: {
    background: string;
    text: string;
    secondaryBg: string;
    border: string;
    icon: string;
  };
}

function TocItemComponent({
  item,
  level = 0,
  currentHref,
  onSelect,
  themeColors,
}: {
  item: TocItem;
  level?: number;
  currentHref: string | null;
  onSelect: (href: string) => void;
  themeColors: {
    background: string;
    text: string;
    secondaryBg: string;
    border: string;
    icon: string;
  };
}) {
  const isActive = currentHref && (item.href === currentHref || currentHref.includes(item.href));
  const paddingLeft = level * 16 + 16;

  return (
    <div>
      <button
        onClick={() => onSelect(item.href)}
        className="w-full text-left py-2.5 pr-4 text-sm transition-all duration-200 rounded-r-lg relative group"
        style={{
          paddingLeft: `${paddingLeft}px`,
          color: isActive ? themeColors.text : themeColors.icon,
          backgroundColor: isActive ? `${themeColors.icon}15` : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = `${themeColors.icon}10`;
            e.currentTarget.style.color = themeColors.text;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = themeColors.icon;
          }
        }}
      >
        <span className="line-clamp-2">{item.label}</span>
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
            style={{ backgroundColor: '#4a9eff' }}
            transition={{ duration: 0.2 }}
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
            />
          ))}
        </div>
      )}
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
}: TocSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[110] bg-black/50"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-0 top-0 bottom-0 w-[320px] z-[120] flex flex-col"
            style={{
              backgroundColor: themeColors.secondaryBg,
              boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div
              className="h-[60px] flex items-center justify-between px-4 border-b"
              style={{ borderColor: themeColors.border }}
            >
              <div className="flex items-center gap-3">
                <BookOpen size={20} style={{ color: themeColors.icon }} />
                <span 
                  className="font-medium"
                  style={{ color: themeColors.text }}
                >
                  目录
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-all duration-200"
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
                <X size={20} />
              </button>
            </div>

            {/* TOC List */}
            <ScrollArea className="flex-1 pt-4">
              {toc.length > 0 ? (
                <div className="pb-8">
                  {toc.map((item) => (
                    <TocItemComponent
                      key={item.id}
                      item={item}
                      currentHref={currentHref}
                      onSelect={(href) => {
                        onSelectItem(href);
                        onClose();
                      }}
                      themeColors={themeColors}
                    />
                  ))}
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center justify-center py-16 text-sm"
                  style={{ color: themeColors.icon }}
                >
                  <BookOpen size={48} className="mb-4 opacity-30" />
                  <p>暂无目录</p>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
