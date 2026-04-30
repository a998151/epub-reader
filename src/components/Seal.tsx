import { motion } from 'framer-motion';
import type { ThemeColors } from '@/types';

interface SealProps {
  char?: string;            // 印章中央字符，默认"阅"
  size?: number;             // 像素，方印边长
  rotate?: number;           // 微小倾斜，制造手钤错觉
  themeColors: ThemeColors;
  animate?: boolean;         // 入场动画 (seal-stamp)
  className?: string;
  style?: React.CSSProperties;
  withGlow?: boolean;        // 朱砂晕开光环
}

// 朱砂方印 — 抽象方印图形 + 阅字
// 视觉策略：
// 1. 不规则边角（用 SVG path 模拟手工凿刻的方印边）
// 2. 阳文白字（朱底白字，符合中国传统印章）
// 3. 微噪点叠加（模拟印泥不均匀）
export function Seal({
  char = '阅',
  size = 56,
  rotate = -4,
  themeColors,
  animate = true,
  className = '',
  style,
  withGlow = false,
}: SealProps) {
  const sealColor = themeColors.seal;
  // 不规则方印 path — 角点和边线都加微小偏移，避免几何完美
  const irregularSquare = `
    M 4 6
    L 50 3
    L 96 5
    L 97 50
    L 95 95
    L 50 97
    L 5 96
    L 3 50
    Z
  `;

  return (
    <motion.div
      className={`relative ${className} ${animate ? 'seal-stamp-in' : ''}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      {/* 朱砂晕开（可选光环） */}
      {withGlow && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: -size * 0.25,
            background: `radial-gradient(circle, ${themeColors.sealSoft} 0%, transparent 60%)`,
            filter: 'blur(8px)',
          }}
        />
      )}

      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          {/* 印泥不均匀的纹理 */}
          <filter id={`seal-noise-${size}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0" />
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>
          {/* 印章边缘微微出血 */}
          <filter id={`seal-edge-${size}`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
        </defs>

        {/* 朱砂方印底 */}
        <path
          d={irregularSquare}
          fill={sealColor}
          filter={`url(#seal-edge-${size})`}
        />

        {/* 印泥纹理叠层 */}
        <path
          d={irregularSquare}
          fill="white"
          filter={`url(#seal-noise-${size})`}
          opacity="0.35"
        />

        {/* 内框（阳文印的边框微凹陷） */}
        <path
          d={`M 12 14 L 88 12 L 90 88 L 14 90 Z`}
          fill="none"
          stroke="rgba(255,255,255,0.32)"
          strokeWidth="1.5"
        />

        {/* 中央阅字 */}
        <text
          x="50"
          y="64"
          textAnchor="middle"
          fontSize="50"
          fontWeight="700"
          fill="rgba(255, 248, 240, 0.96)"
          fontFamily="'Noto Serif SC', 'Source Han Serif SC', serif"
          style={{ letterSpacing: '-0.02em' }}
        >
          {char}
        </text>

        {/* 印泥边缘瑕疵（左上和右下小缺口） */}
        <circle cx="6" cy="8" r="1.6" fill={themeColors.background} opacity="0.7" />
        <circle cx="94" cy="92" r="2.1" fill={themeColors.background} opacity="0.6" />
      </svg>
    </motion.div>
  );
}
