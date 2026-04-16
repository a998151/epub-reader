import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Type } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface FontSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (height: number) => void;
  onFontFamilyChange: (family: string) => void;
  themeColors: {
    background: string;
    text: string;
    secondaryBg: string;
    border: string;
    icon: string;
  };
}

const fontOptions = [
  { label: '思源宋体', value: '"Noto Serif SC", "Source Han Serif SC", serif' },
  { label: '思源黑体', value: '"Noto Sans SC", "Source Han Sans SC", sans-serif' },
  { label: '霞鹜文楷', value: '"LXGWWenKaiScreen", "KaiTi", serif' },
  { label: '朱雀仿宋', value: '"ZhuqueFangsong", "FangSong", "STFangsong", serif' },
  { label: '方正细金陵', value: '"FZXiJinLJW", "Noto Serif SC", serif' },
  { label: '方正颜宋', value: '"FZYanSJW", "Noto Serif SC", serif' },
  { label: '楷体', value: '"KaiTi", "STKaiti", serif' },
  { label: '仿宋', value: '"FangSong", "STFangsong", serif' },
];

export function FontSettings({
  isOpen,
  onClose,
  fontSize,
  lineHeight,
  fontFamily,
  onFontSizeChange,
  onLineHeightChange,
  onFontFamilyChange,
  themeColors,
}: FontSettingsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] bg-black/30"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed right-20 top-1/2 -translate-y-1/2 w-[280px] rounded-xl z-[120] overflow-hidden"
            style={{
              backgroundColor: themeColors.secondaryBg,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: themeColors.border }}
            >
              <div className="flex items-center gap-2">
                <Type size={18} style={{ color: themeColors.icon }} />
                <span 
                  className="font-medium text-sm"
                  style={{ color: themeColors.text }}
                >
                  字体设置
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-all duration-200"
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
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Font Size */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span 
                    className="text-sm"
                    style={{ color: themeColors.icon }}
                  >
                    字号
                  </span>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    {fontSize}px
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onFontSizeChange(fontSize - 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                    style={{ 
                      color: themeColors.icon,
                      backgroundColor: `${themeColors.icon}15`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = themeColors.text;
                      e.currentTarget.style.backgroundColor = `${themeColors.icon}25`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = themeColors.icon;
                      e.currentTarget.style.backgroundColor = `${themeColors.icon}15`;
                    }}
                  >
                    <Minus size={14} />
                  </button>
                  <Slider
                    value={[fontSize]}
                    onValueChange={([value]) => onFontSizeChange(value)}
                    min={12}
                    max={32}
                    step={1}
                    className="flex-1"
                  />
                  <button
                    onClick={() => onFontSizeChange(fontSize + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                    style={{ 
                      color: themeColors.icon,
                      backgroundColor: `${themeColors.icon}15`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = themeColors.text;
                      e.currentTarget.style.backgroundColor = `${themeColors.icon}25`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = themeColors.icon;
                      e.currentTarget.style.backgroundColor = `${themeColors.icon}15`;
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Line Height */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span 
                    className="text-sm"
                    style={{ color: themeColors.icon }}
                  >
                    行间距
                  </span>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    {lineHeight.toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={[lineHeight]}
                  onValueChange={([value]) => onLineHeightChange(value)}
                  min={1.2}
                  max={2.5}
                  step={0.1}
                />
              </div>

              {/* Font Family */}
              <div className="space-y-3">
                <span 
                  className="text-sm block"
                  style={{ color: themeColors.icon }}
                >
                  字体
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {fontOptions.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => onFontFamilyChange(font.value)}
                      className="px-3 py-2 rounded-lg text-sm transition-all duration-200"
                      style={{
                        color: fontFamily === font.value ? themeColors.text : themeColors.icon,
                        backgroundColor: fontFamily === font.value ? `${themeColors.icon}25` : `${themeColors.icon}10`,
                        fontFamily: font.value,
                      }}
                      onMouseEnter={(e) => {
                        if (fontFamily !== font.value) {
                          e.currentTarget.style.backgroundColor = `${themeColors.icon}20`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (fontFamily !== font.value) {
                          e.currentTarget.style.backgroundColor = `${themeColors.icon}10`;
                        }
                      }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
