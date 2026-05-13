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
import { useInkRipple, InkRippleLayer } from '@/components/InkRipple';
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

// 单个工具按钮 + 墨晕涟漪
function ToolButton({
  icon: Icon,
  label,
  isActive,
  themeColors,
  onClick,
  index,
  side = 'left',
}: {
  icon: typeof List;
  label: string;
  isActive: boolean;
  themeColors: ThemeColors;
  onClick: () => void;
  index: number;
  side?: 'left' | 'top';
}) {
  const { ripples, trigger } = useInkRipple();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.22 + index * 0.05 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={(e) => {
            trigger(e, 1);
            onClick();
          }}
          onMouseEnter={(e) => trigger(e, 0.45)}
          aria-label={label}
          className="relative w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 overflow-hidden"
          style={{
            color: isActive ? themeColors.accent : themeColors.icon,
            backgroundColor: isActive ? themeColors.accentSoft : 'transparent',
          }}
        >
          <InkRippleLayer ripples={ripples} color={themeColors.seal} />
          <Icon size={18} strokeWidth={2} className="relative z-10" />
        </motion.button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={10}
        className="text-xs glass-surface"
        style={{
          backgroundColor: themeColors.glass,
          color: themeColors.text,
          border: `1px solid ${themeColors.glassBorder}`,
          borderRadius: '10px',
        }}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// 翻页按钮（移动端底栏用）
function NavButton({
  direction,
  themeColors,
  onClick,
}: {
  direction: 'prev' | 'next';
  themeColors: ThemeColors;
  onClick: () => void;
}) {
  const { ripples, trigger } = useInkRipple();
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={(e) => {
        trigger(e, 1);
        onClick();
      }}
      aria-label={direction === 'prev' ? '上一页' : '下一页'}
      className="relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
      style={{ color: themeColors.icon }}
    >
      <InkRippleLayer ripples={ripples} color={themeColors.seal} />
      <Icon size={22} className="relative z-10" />
    </button>
  );
}

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
      {/* 外层 div：top-[64px] bottom-0 负责在内容区内垂直居中，右侧固定 */}
      <div className="fixed right-5 lg:right-7 top-[64px] bottom-0 z-[90] hidden md:flex items-center">
      <motion.div
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-1.5 p-1.5 glass-surface"
        style={{
          backgroundColor: themeColors.glass,
          border: `1px solid ${themeColors.glassBorder}`,
          borderRadius: '999px',
          boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 10px 30px -10px rgba(0,0,0,0.22)`,
        }}
      >
        {toolbarItems.map((item, index) => {
          const isActive = item.id === 'bookmark' && isBookmarked;
          return (
            <ToolButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              themeColors={themeColors}
              onClick={actions[item.action]}
              index={index}
              side="left"
            />
          );
        })}
      </motion.div>
      </div>

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
        <NavButton direction="prev" themeColors={themeColors} onClick={onPrev} />

        <div className="flex items-center gap-1">
          {toolbarItems.map((item, index) => {
            const active = item.id === 'bookmark' && isBookmarked;
            return (
              <ToolButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={active}
                themeColors={themeColors}
                onClick={actions[item.action]}
                index={index}
                side="top"
              />
            );
          })}
        </div>

        <NavButton direction="next" themeColors={themeColors} onClick={onNext} />
      </motion.div>
    </TooltipProvider>
  );
}
