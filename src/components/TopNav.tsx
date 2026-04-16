import { BookOpen, List, User, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopNavProps {
  title: string;
  onToggleToc: () => void;
  onGoToHome: () => void;
  onGoToBookshelf: () => void;
  currentView: 'home' | 'reader';
  themeColors: {
    background: string;
    text: string;
    secondaryBg: string;
    border: string;
    icon: string;
  };
}

export function TopNav({ title, onToggleToc, onGoToHome, currentView, themeColors }: TopNavProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 h-[60px] z-[100] px-6 lg:px-10 flex items-center justify-between"
      style={{
        backgroundColor: themeColors.background,
        borderBottom: `1px solid ${themeColors.border}`,
      }}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        <BookOpen 
          size={24} 
          style={{ color: themeColors.icon }}
          className="transition-colors hover:opacity-80"
        />
        <span 
          className="text-base font-medium max-w-[200px] lg:max-w-[400px] truncate"
          style={{ color: themeColors.text }}
        >
          {title || 'EPUB Reader'}
        </span>
        {currentView === 'reader' && (
          <button
            onClick={onToggleToc}
            className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
            style={{ 
              color: themeColors.icon,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${themeColors.icon}20`;
              e.currentTarget.style.color = themeColors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = themeColors.icon;
            }}
          >
            <List size={20} />
          </button>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <nav className="hidden sm:flex items-center gap-1">
          <button
            onClick={onGoToHome}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 relative group flex items-center gap-2`}
            style={{ color: currentView === 'home' ? '#4a9eff' : themeColors.icon }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#4a9eff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = currentView === 'home' ? '#4a9eff' : themeColors.icon;
            }}
          >
            <Home size={16} />
            首页
            {currentView === 'home' && (
              <span 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 rounded-full"
                style={{ backgroundColor: '#4a9eff' }}
              />
            )}
          </button>
          {/* <button
            onClick={onGoToBookshelf}
            className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 relative group flex items-center gap-2"
            style={{ color: themeColors.icon }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#4a9eff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = themeColors.icon;
            }}
          >
            <Library size={16} />
            我的书架
          </button> */}
        </nav>
        <span 
          className="hidden sm:inline mx-2"
          style={{ color: themeColors.border }}
        >
          |
        </span>
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
          style={{ 
            backgroundColor: themeColors.secondaryBg,
            color: themeColors.icon,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = themeColors.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = themeColors.icon;
          }}
        >
          <User size={18} />
        </button>
      </div>
    </motion.header>
  );
}
