/**
 * ReaderDecor — 阅读区域装饰层
 *
 * 还原古籍雕版书的版面美学：
 *  · 宣纸纤维纹理（SVG fractalNoise）
 *  · 四角花括号（双线折角）
 *  · 左右版栏（双线 + 菱形 + 鱼尾 + 竖排文字）
 *  · 角落环境光晕
 */

import type { ThemeColors } from '@/types';

interface ReaderDecorProps {
  themeColors: ThemeColors;
  chapterTitle?: string;
  bookTitle?: string;
}

// ── 四角花括号 SVG ───────────────────────────────────────────────
type Corner = 'tl' | 'tr' | 'bl' | 'br';

const OUTER_PATHS: Record<Corner, string> = {
  tl: 'M 20 2 L 2 2 L 2 20',
  tr: 'M 2 2 L 20 2 L 20 20',
  bl: 'M 20 20 L 2 20 L 2 2',
  br: 'M 2 20 L 20 20 L 20 2',
};
const INNER_PATHS: Record<Corner, string> = {
  tl: 'M 18 6 L 6 6 L 6 18',
  tr: 'M 4 6 L 16 6 L 16 18',
  bl: 'M 18 16 L 6 16 L 6 4',
  br: 'M 4 16 L 16 16 L 16 4',
};

function CornerBracket({
  corner,
  topOffset,
  ink,
}: {
  corner: Corner;
  topOffset: number;
  ink: string;
}) {
  const isTop = corner === 'tl' || corner === 'tr';
  const isLeft = corner === 'tl' || corner === 'bl';
  return (
    <svg
      className="hidden lg:block fixed pointer-events-none z-[3]"
      style={{
        width: 22,
        height: 22,
        ...(isTop ? { top: topOffset + 4 } : { bottom: 110 }),
        ...(isLeft ? { left: 28 } : { right: 92 }),
        opacity: 0.38,
      }}
      viewBox="0 0 22 22"
    >
      <path d={OUTER_PATHS[corner]} fill="none" stroke={ink} strokeWidth="0.9" strokeLinecap="square" />
      <path d={INNER_PATHS[corner]} fill="none" stroke={ink} strokeWidth="0.5" opacity="0.55" strokeLinecap="square" />
    </svg>
  );
}

// ── 版栏（左/右）─────────────────────────────────────────────────
function ColumnDecor({
  side,
  topDecor,
  ink,
  label,
}: {
  side: 'left' | 'right';
  topDecor: number;
  ink: string;
  label?: string;
}) {
  const isLeft = side === 'left';
  const fixedPos = isLeft ? { left: '10px' } : { right: '86px' };

  // 双线的内外顺序（左列：外在左，内在右；右列：外在右，内在左）
  const lines = isLeft
    ? [
        { left: 0, width: '1px', opacity: 1 },
        { left: '4px', width: '0.5px', opacity: 0.42 },
      ]
    : [
        { left: '1px', width: '0.5px', opacity: 0.42 },
        { left: '5px', width: '1px', opacity: 1 },
      ];

  return (
    <>
      {/* 版栏主体 */}
      <div
        className="hidden lg:flex fixed flex-col items-center pointer-events-none z-[1]"
        style={{
          ...fixedPos,
          top: `${topDecor}px`,
          bottom: '108px',
          color: ink,
          opacity: 0.3,
          width: '8px',
        }}
      >
        {/* 顶帽横线 */}
        <div style={{ width: 14, height: 1, background: 'currentColor', marginBottom: 2, flexShrink: 0 }} />

        {/* 上段双线 */}
        <div className="flex-1 relative" style={{ minHeight: 28, width: '100%' }}>
          {lines.map((l, i) => (
            <div
              key={i}
              className="absolute inset-y-0"
              style={{ left: l.left, width: l.width, background: 'currentColor', opacity: l.opacity }}
            />
          ))}
        </div>

        {/* 上菱形 */}
        <div
          style={{
            width: 5, height: 5, flexShrink: 0,
            border: '0.8px solid currentColor',
            transform: 'rotate(45deg)',
            margin: '4px 0',
          }}
        />

        {/* 鱼尾中央纹饰 */}
        <span className="fish-tail-icon flex-shrink-0" style={{ margin: '3px 0' }} />

        {/* 下菱形 */}
        <div
          style={{
            width: 5, height: 5, flexShrink: 0,
            border: '0.8px solid currentColor',
            transform: 'rotate(45deg)',
            margin: '4px 0',
          }}
        />

        {/* 下段双线 */}
        <div className="flex-1 relative" style={{ minHeight: 28, width: '100%' }}>
          {lines.map((l, i) => (
            <div
              key={i}
              className="absolute inset-y-0"
              style={{ left: l.left, width: l.width, background: 'currentColor', opacity: l.opacity }}
            />
          ))}
        </div>

        {/* 底帽横线 */}
        <div style={{ width: 14, height: 1, background: 'currentColor', marginTop: 2, flexShrink: 0 }} />
      </div>

      {/* 竖排文字（书名 / 章节名） */}
      {label && (
        <div
          className="hidden xl:block fixed pointer-events-none z-[1] vertical-rl"
          style={{
            ...(isLeft ? { left: '13px' } : { right: '89px' }),
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 9,
            letterSpacing: '0.26em',
            color: ink,
            opacity: 0.18,
            fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
            maxHeight: 160,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      )}
    </>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────
export function ReaderDecor({ themeColors, chapterTitle, bookTitle }: ReaderDecorProps) {
  const topOffset = chapterTitle ? 108 : 72;
  const topDecor = topOffset + 36;
  const { ink, blob1, blob2 } = themeColors;

  return (
    <>
      {/* 宣纸纤维纹理叠层 */}
      <div
        className="fixed inset-0 paper-texture pointer-events-none z-[0]"
        style={{ opacity: 0.72 }}
      />

      {/* 环境光晕 — 左上 */}
      <div
        className="fixed pointer-events-none z-[0]"
        style={{
          top: 0,
          left: 0,
          width: '42vw',
          height: '42vh',
          background: `radial-gradient(ellipse at 0% 0%, ${blob1}, transparent 68%)`,
          opacity: 0.07,
        }}
      />
      {/* 环境光晕 — 右下 */}
      <div
        className="fixed pointer-events-none z-[0]"
        style={{
          bottom: '80px',
          right: '72px',
          width: '42vw',
          height: '42vh',
          background: `radial-gradient(ellipse at 100% 100%, ${blob2}, transparent 68%)`,
          opacity: 0.07,
        }}
      />

      {/* 左上角装饰图 — 竹叶+灯笼，距顶部 10% */}
      <img
        src="/images/body-4.png"
        aria-hidden="true"
        className="fixed pointer-events-none z-[2]"
        style={{
          top: '10%',
          left: 0,
          transform: 'scale(0.5)',
          transformOrigin: 'top left',
          mixBlendMode: 'multiply',
          opacity: 0.7,
          userSelect: 'none',
        } as React.CSSProperties}
      />

      {/* 右上角装饰图 — 樱花枝+流苏 */}
      <img
        src="/images/body-1.png"
        aria-hidden="true"
        className="fixed pointer-events-none z-[2]"
        style={{
          top: topOffset - 12,
          right: -18,
          width: 161,
          mixBlendMode: 'multiply',
          opacity: 0.92,
          userSelect: 'none',
          draggable: false,
        } as React.CSSProperties}
      />

      {/* 底部水墨山水横幅 — 100% 宽拉伸 */}
      <img
        src="/images/body-3.png"
        aria-hidden="true"
        className="fixed pointer-events-none z-[2]"
        style={{
          bottom: 0,
          left: 0,
          width: '100%',
          height: 'auto',
          mixBlendMode: 'multiply',
          opacity: 0.40,
          userSelect: 'none',
        } as React.CSSProperties}
      />


      {/* 四角花括号 */}
      {(['tl', 'tr', 'bl', 'br'] as Corner[]).map((c) => (
        <CornerBracket key={c} corner={c} topOffset={topOffset} ink={ink} />
      ))}

      {/* 左版栏 — 显示书名 */}
      <ColumnDecor
        side="left"
        topDecor={topDecor}
        ink={ink}
        label={bookTitle}
      />

      {/* 右版栏 — 显示章节名 */}
      <ColumnDecor
        side="right"
        topDecor={topDecor}
        ink={ink}
        label={chapterTitle}
      />
    </>
  );
}
