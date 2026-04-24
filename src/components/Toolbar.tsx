import {
  List,
  Type,
  Palette,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ThemeColors } from '@/types';

interface ToolbarProps {
  onToggleToc: () => void;
  onOpenFontSettings: () => void;
  onOpenThemeSettings: () => void;
  onToggleBookmark: () => void;
  onPrev: () => void;
  onNext: () => void;
  isBookmarked: boolean;
  themeColors: ThemeColors;
}

const toolbarItems = [
  { id: 'toc', icon: List, label: '目录', action: 'onToggleToc' as const },
  { id: 'font', icon: Type, label: '字体', action: 'onOpenFontSettings' as const },
  { id: 'theme', icon: Palette, label: '主题', action: 'onOpenThemeSettings' as const },
  { id: 'bookmark', icon: Bookmark, label: '书签', action: 'onToggleBookmark' as const },
];

export function Toolbar({
  onToggleToc,
  onOpenFontSettings,
  onOpenThemeSettings,
  onToggleBookmark,
  onPrev,
  onNext,
  isBookmarked,
  themeColors,
}: ToolbarProps) {
  const actions: Record<string, () => void> = {
    onToggleToc,
    onOpenFontSettings,
    onOpenThemeSettings,
    onToggleBookmark,
  };

  return (
    <TooltipProvider delayDuration={160}>
      {/* Desktop 右侧玻璃胶囊 */}
      <motion.div
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-5 lg:right-7 top-1/2 -translate-y-1/2 z-[90] hidden md:flex flex-col gap-1.5 p-1.5 glass-surface"
        style={{
          backgroundColor: themeColors.glass,
          border: `1px solid ${themeColors.glassBorder}`,
          borderRadius: '999px',
          boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 10px 30px -10px rgba(0,0,0,0.22)`,
        }}
      >
        {toolbarItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.id === 'bookmark' && isBookmarked;

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.22 + index * 0.05 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={actions[item.action]}
                  aria-label={item.label}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
                  style={{
                    color: isActive ? themeColors.accent : themeColors.icon,
                    backgroundColor: isActive ? themeColors.accentSoft : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = themeColors.accentSoft;
                      e.currentTarget.style.color = themeColors.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = themeColors.icon;
                    }
                  }}
                >
                  <Icon size={18} strokeWidth={2} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                sideOffset={10}
                className="text-xs glass-surface"
                style={{
                  backgroundColor: themeColors.glass,
                  color: themeColors.text,
                  border: `1px solid ${themeColors.glassBorder}`,
                  borderRadius: '10px',
                }}
              >
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </motion.div>

      {/* Mobile 底部玻璃工具条 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="fixed bottom-3 left-3 right-3 z-[90] md:hidden flex items-center justify-between px-3 py-2 glass-surface"
        style={{
          backgroundColor: themeColors.glass,
          border: `1px solid ${themeColors.glassBorder}`,
          borderRadius: '999px',
          boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 10px 30px -10px rgba(0,0,0,0.25)`,
        }}
      >
        <button
          onClick={onPrev}
          aria-label="上一页"
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ color: themeColors.icon }}
        >
          <ChevronLeft size={22} />
        </button>

        <div className="flex items-center gap-1">
          {toolbarItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === 'bookmark' && isBookmarked;
            return (
              <button
                key={item.id}
                onClick={actions[item.action]}
                aria-label={item.label}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{
                  color: active ? themeColors.accent : themeColors.icon,
                  backgroundColor: active ? themeColors.accentSoft : 'transparent',
                }}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>

        <button
          onClick={onNext}
          aria-label="下一页"
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ color: themeColors.icon }}
        >
          <ChevronRight size={22} />
        </button>
      </motion.div>
    </TooltipProvider>
  );
}
