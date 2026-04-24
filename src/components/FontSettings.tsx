import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Type } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useOverlay } from '@/hooks/useOverlay';
import type { ThemeColors } from '@/types';

interface FontSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  contentWidth: number;
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (height: number) => void;
  onFontFamilyChange: (family: string) => void;
  onContentWidthChange: (width: number) => void;
  themeColors: ThemeColors;
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

function StepperButton({
  icon: Icon,
  onClick,
  themeColors,
  ariaLabel,
}: {
  icon: typeof Minus;
  onClick: () => void;
  themeColors: ThemeColors;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
      style={{
        color: themeColors.icon,
        backgroundColor: themeColors.accentSoft,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = themeColors.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = themeColors.icon;
      }}
    >
      <Icon size={13} strokeWidth={2.3} />
    </button>
  );
}

export function FontSettings({
  isOpen,
  onClose,
  fontSize,
  lineHeight,
  fontFamily,
  contentWidth,
  onFontSizeChange,
  onLineHeightChange,
  onFontFamilyChange,
  onContentWidthChange,
  themeColors,
}: FontSettingsProps) {
  useOverlay(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110]"
            style={{ backgroundColor: 'rgba(20, 16, 12, 0.28)', backdropFilter: 'blur(2px)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: 12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.96, x: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-24 top-1/2 w-[296px] z-[120] overflow-hidden glass-surface-strong"
            style={{
              y: '-50%',
              backgroundColor: themeColors.glass,
              border: `1px solid ${themeColors.glassBorder}`,
              borderRadius: '22px',
              boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 20px 50px -20px rgba(0,0,0,0.4)`,
              ['--accent-color' as string]: themeColors.accent,
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
                  <Type size={13} style={{ color: themeColors.accent }} strokeWidth={2.2} />
                </div>
                <span
                  className="text-[14px] tracking-tight"
                  style={{
                    color: themeColors.text,
                    fontFamily: '"Noto Serif SC", serif',
                    fontWeight: 600,
                  }}
                >
                  字体设置
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="关闭"
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
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
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Font Size */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px]" style={{ color: themeColors.icon }}>字号</span>
                  <span
                    className="text-[13px] font-medium tabular-nums"
                    style={{ color: themeColors.text }}
                  >
                    {fontSize}px
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StepperButton
                    icon={Minus}
                    onClick={() => onFontSizeChange(fontSize - 1)}
                    themeColors={themeColors}
                    ariaLabel="减小字号"
                  />
                  <Slider
                    value={[fontSize]}
                    onValueChange={([value]) => onFontSizeChange(value)}
                    min={12}
                    max={32}
                    step={1}
                    className="flex-1"
                  />
                  <StepperButton
                    icon={Plus}
                    onClick={() => onFontSizeChange(fontSize + 1)}
                    themeColors={themeColors}
                    ariaLabel="增大字号"
                  />
                </div>
              </div>

              {/* Line Height */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px]" style={{ color: themeColors.icon }}>行间距</span>
                  <span
                    className="text-[13px] font-medium tabular-nums"
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

              {/* Content Width */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px]" style={{ color: themeColors.icon }}>内容宽度</span>
                  <span
                    className="text-[13px] font-medium tabular-nums"
                    style={{ color: themeColors.text }}
                  >
                    {contentWidth}%
                  </span>
                </div>
                <Slider
                  value={[contentWidth]}
                  onValueChange={([value]) => onContentWidthChange(value)}
                  min={50}
                  max={100}
                  step={5}
                />
              </div>

              {/* Font Family */}
              <div className="space-y-2.5">
                <span
                  className="text-[13px] block"
                  style={{ color: themeColors.icon }}
                >
                  字体
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {fontOptions.map((font) => {
                    const active = fontFamily === font.value;
                    return (
                      <button
                        key={font.value}
                        onClick={() => onFontFamilyChange(font.value)}
                        className="px-3 py-2 rounded-xl text-[13px] transition-all duration-200"
                        style={{
                          color: active ? themeColors.accent : themeColors.text,
                          backgroundColor: active ? themeColors.accentSoft : 'transparent',
                          border: `1px solid ${active ? themeColors.accent + '40' : themeColors.border}`,
                          fontFamily: font.value,
                          fontWeight: active ? 500 : 400,
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = themeColors.accentSoft;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {font.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
