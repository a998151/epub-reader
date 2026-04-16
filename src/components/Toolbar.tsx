import { 
  List, 
  Type, 
  Palette, 
  Bookmark, 
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ToolbarProps {
  onToggleToc: () => void;
  onOpenFontSettings: () => void;
  onOpenThemeSettings: () => void;
  onToggleBookmark: () => void;
  onOpenSettings: () => void;
  onPrev: () => void;
  onNext: () => void;
  isBookmarked: boolean;
  themeColors: {
    background: string;
    text: string;
    secondaryBg: string;
    border: string;
    icon: string;
  };
}

const toolbarItems = [
  { id: 'toc', icon: List, label: '目录', action: 'onToggleToc' },
  { id: 'font', icon: Type, label: '字体', action: 'onOpenFontSettings' },
  { id: 'theme', icon: Palette, label: '主题', action: 'onOpenThemeSettings' },
  { id: 'bookmark', icon: Bookmark, label: '书签', action: 'onToggleBookmark', toggleable: true },
  { id: 'settings', icon: Settings, label: '设置', action: 'onOpenSettings' },
];

export function Toolbar({
  onToggleToc,
  onOpenFontSettings,
  onOpenThemeSettings,
  onToggleBookmark,
  onOpenSettings,
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
    onOpenSettings,
  };

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="fixed right-4 lg:right-6 top-1/2 -translate-y-1/2 z-[90] hidden md:flex flex-col gap-2 p-2 rounded-xl"
        style={{
          backgroundColor: themeColors.secondaryBg,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {toolbarItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.id === 'bookmark' && isBookmarked;
          
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
                  onClick={actions[item.action]}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    color: isActive ? '#4a9eff' : themeColors.icon,
                    backgroundColor: isActive ? `${themeColors.icon}20` : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${themeColors.icon}20`;
                    e.currentTarget.style.color = isActive ? '#4a9eff' : themeColors.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isActive ? `${themeColors.icon}20` : 'transparent';
                    e.currentTarget.style.color = isActive ? '#4a9eff' : themeColors.icon;
                  }}
                >
                  <Icon size={20} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className="text-xs"
                style={{
                  backgroundColor: themeColors.secondaryBg,
                  color: themeColors.text,
                  border: `1px solid ${themeColors.border}`,
                }}
              >
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </motion.div>

      {/* Mobile Bottom Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-[90] md:hidden flex items-center justify-between px-4 py-3"
        style={{
          backgroundColor: themeColors.secondaryBg,
          borderTop: `1px solid ${themeColors.border}`,
        }}
      >
        <button
          onClick={onPrev}
          className="p-2 rounded-lg transition-all duration-200"
          style={{ color: themeColors.icon }}
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleToc}
            className="p-2 rounded-lg transition-all duration-200"
            style={{ color: themeColors.icon }}
          >
            <List size={20} />
          </button>
          <button
            onClick={onOpenFontSettings}
            className="p-2 rounded-lg transition-all duration-200"
            style={{ color: themeColors.icon }}
          >
            <Type size={20} />
          </button>
          <button
            onClick={onToggleBookmark}
            className="p-2 rounded-lg transition-all duration-200"
            style={{ color: isBookmarked ? '#4a9eff' : themeColors.icon }}
          >
            <Bookmark size={20} />
          </button>
          <button
            onClick={onOpenThemeSettings}
            className="p-2 rounded-lg transition-all duration-200"
            style={{ color: themeColors.icon }}
          >
            <Palette size={20} />
          </button>
        </div>

        <button
          onClick={onNext}
          className="p-2 rounded-lg transition-all duration-200"
          style={{ color: themeColors.icon }}
        >
          <ChevronRight size={24} />
        </button>
      </motion.div>
    </TooltipProvider>
  );
}
