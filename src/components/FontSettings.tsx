import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Type, Sparkles } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useOverlay } from '@/hooks/useOverlay';
import type { ThemeColors } from '@/types';

interface FontSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  contentWidth: number;
  dropCap: boolean;
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (height: number) => void;
  onFontFamilyChange: (family: string) => void;
  onContentWidthChange: (width: number) => void;
  onDropCapChange: (enabled: boolean) => void;
  themeColors: ThemeColors;
}

// 每个字体配一句经典句作为视觉锚点
const fontOptions = [
  { label: '思源宋体', value: '"Noto Serif SC", "Source Han Serif SC", serif',  preview: '上善若水' },
  { label: '思源黑体', value: '"Noto Sans SC", "Source Han Sans SC", sans-serif', preview: '道法自然' },
  { label: '霞鹜文楷', value: '"LXGWWenKaiScreen", "KaiTi", serif',               preview: '清风明月' },
  { label: '朱雀仿宋', value: '"ZhuqueFangsong", "FangSong", "STFangsong", serif', preview: '行云流水' },
  { label: '方正细金陵', value: '"FZXiJinLJW", "Noto Serif SC", serif',           preview: '云淡风轻' },
  { label: '方正颜宋', value: '"FZYanSJW", "Noto Serif SC", serif',               preview: '风骨峥嵘' },
  { label: '楷体', value: '"KaiTi", "STKaiti", serif',                              preview: '翰墨丹青' },
  { label: '仿宋', value: '"FangSong", "STFangsong", serif',                        preview: '古意盎然' },
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
  dropCap,
  onFontSizeChange,
  onLineHeightChange,
  onFontFamilyChange,
  onContentWidthChange,
  onDropCapChange,
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
            style={{ backgroundColor: 'rgba(20, 16, 12, 0.32)', backdropFilter: 'blur(3px)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: 12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.96, x: 12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-24 top-1/2 w-[360px] max-h-[82vh] z-[120] overflow-hidden glass-surface-strong flex flex-col"
            style={{
              y: '-50%',
              backgroundColor: themeColors.glass,
              border: `1px solid ${themeColors.glassBorder}`,
              borderRadius: '24px',
              boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 24px 60px -22px rgba(0,0,0,0.45)`,
              ['--accent-color' as string]: themeColors.accent,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
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
                  <Type size={14} style={{ color: themeColors.accent }} strokeWidth={2.2} />
                </div>
                <span
                  className="text-[14px] tracking-tight"
                  style={{
                    color: themeColors.text,
                    fontFamily: '"Noto Serif SC", serif',
                    fontWeight: 600,
                  }}
                >
                  字体 · 排印
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

            <div className="p-5 space-y-5 overflow-y-auto">
              {/* Font Size */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] tracking-wider" style={{ color: themeColors.icon }}>字号</span>
                  <span
                    className="text-[13px] font-medium tabular-nums"
                    style={{ color: themeColors.text }}
                  >
                    {fontSize}<span className="text-[10px] ml-0.5 opacity-60">px</span>
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
                  <span className="text-[12px] tracking-wider" style={{ color: themeColors.icon }}>行间距</span>
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
                  <span className="text-[12px] tracking-wider" style={{ color: themeColors.icon }}>版心宽度</span>
                  <span
                    className="text-[13px] font-medium tabular-nums"
                    style={{ color: themeColors.text }}
                  >
                    {contentWidth}<span className="text-[10px] ml-0.5 opacity-60">%</span>
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

              {/* 首字下沉开关 */}
              <div
                className="flex items-center justify-between p-3 rounded-2xl"
                style={{
                  backgroundColor: themeColors.secondaryBg,
                  border: `1px solid ${themeColors.border}`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles size={14} style={{ color: themeColors.seal }} strokeWidth={2.2} />
                  <div className="flex flex-col">
                    <span
                      className="text-[13px] tracking-tight"
                      style={{ color: themeColors.text, fontWeight: 500 }}
                    >
                      首字下沉
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: themeColors.icon }}
                    >
                      章节首字大字、朱砂红
                    </span>
                  </div>
                </div>
                <Switch
                  checked={dropCap}
                  onCheckedChange={onDropCapChange}
                  style={{
                    backgroundColor: dropCap ? themeColors.seal : undefined,
                  }}
                />
              </div>

              {/* 鱼尾纹分隔 */}
              <div className="fish-tail" style={{ color: themeColors.ink, opacity: 0.7 }}>
                <span className="fish-tail-icon" />
              </div>

              {/* Font Family — 书法风格预览卡 */}
              <div className="space-y-2.5">
                <span
                  className="text-[12px] tracking-wider block"
                  style={{ color: themeColors.icon }}
                >
                  字体
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {fontOptions.map((font, i) => {
                    const active = fontFamily === font.value;
                    return (
                      <motion.button
                        key={font.value}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onFontFamilyChange(font.value)}
                        className="flex flex-col items-center justify-center px-2 py-3 rounded-xl transition-all duration-200"
                        style={{
                          backgroundColor: active ? themeColors.accentSoft : themeColors.secondaryBg,
                          border: `1.5px solid ${active ? themeColors.accent : themeColors.border}`,
                          color: themeColors.text,
                          minHeight: 64,
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = themeColors.accentSoft;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = themeColors.secondaryBg;
                          }
                        }}
                      >
                        {/* 经典句预览（书法风格） */}
                        <span
                          className="text-[18px] tracking-[0.05em] leading-tight"
                          style={{
                            fontFamily: font.value,
                            color: active ? themeColors.accent : themeColors.text,
                            fontWeight: active ? 600 : 500,
                          }}
                        >
                          {font.preview}
                        </span>
                        {/* 字体名小标 */}
                        <span
                          className="text-[10px] mt-1.5 tracking-wider"
                          style={{
                            color: themeColors.icon,
                            opacity: active ? 1 : 0.7,
                          }}
                        >
                          {font.label}
                        </span>
                      </motion.button>
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
