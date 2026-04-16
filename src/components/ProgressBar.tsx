import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  themeColors: {
    background: string;
    text: string;
    secondaryBg: string;
    border: string;
    icon: string;
  };
}

export function ProgressBar({ progress, themeColors }: ProgressBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="fixed bottom-0 left-0 right-0 h-1 z-[85]"
      style={{ backgroundColor: `${themeColors.icon}20` }}
    >
      <motion.div
        className="h-full rounded-r-full"
        style={{ backgroundColor: '#4a9eff' }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      
      {/* Progress Tooltip */}
      <div 
        className="absolute -top-8 right-4 px-2 py-1 rounded text-xs font-medium opacity-0 hover:opacity-100 transition-opacity"
        style={{ 
          backgroundColor: themeColors.secondaryBg,
          color: themeColors.text,
        }}
      >
        {progress}%
      </div>
    </motion.div>
  );
}
