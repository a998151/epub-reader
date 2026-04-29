import { useMemo } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { BookOpen, Clock, Trash2, Plus, Library, Flame } from 'lucide-react';
import { useBookCover } from '@/hooks/useBookCover';
import { InkBlobs } from '@/components/InkBlobs';
import { Seal } from '@/components/Seal';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import type { ReadingHistory, ThemeColors } from '@/types';

interface HomeProps {
  readingHistory: ReadingHistory[];
  onSelectBook: (book: ReadingHistory) => void;
  onRemoveBook: (id: string) => void;
  onUploadFile: () => void;
  onGoToHome: () => void;
  onGoToBookshelf: () => void;
  currentTab: 'home' | 'bookshelf';
  themeColors: ThemeColors;
}

// 经典句池 — Hero 大字标语随每次访问轮换
const CLASSIC_PHRASES = [
  { main: '开卷有益', sub: '——欧阳修《归田录》' },
  { main: '今日宜读', sub: '——黄历有云' },
  { main: '上善若水', sub: '——《道德经》' },
  { main: '道法自然', sub: '——《道德经》' },
  { main: '腹有诗书', sub: '——苏轼' },
  { main: '风声雨声', sub: '——顾宪成' },
  { main: '汲古润今', sub: '——古训' },
  { main: '韦编三绝', sub: '——《史记》' },
];

function getDailyPhrase(): { main: string; sub: string } {
  // 用日期作为种子，让一天内固定显示同一句（仪式感）
  const seed = new Date();
  const day = seed.getFullYear() * 1000 + seed.getMonth() * 50 + seed.getDate();
  return CLASSIC_PHRASES[day % CLASSIC_PHRASES.length];
}

function getBookGradient(title: string): string {
  const gradients = [
    'linear-gradient(135deg, #e8c5a0 0%, #c97b63 100%)',
    'linear-gradient(135deg, #d4b5a0 0%, #a56a4d 100%)',
    'linear-gradient(135deg, #e0cab0 0%, #8b7355 100%)',
    'linear-gradient(135deg, #c7b9a5 0%, #6b6359 100%)',
    'linear-gradient(135deg, #d9b99b 0%, #9c6f4e 100%)',
    'linear-gradient(135deg, #e6d0b8 0%, #b08968 100%)',
    'linear-gradient(135deg, #c9b8a8 0%, #7a5e4a 100%)',
    'linear-gradient(135deg, #d8bfa8 0%, #8c6a52 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getCoverInitials(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return '?';
  const cjkRegex = /[㐀-鿿\u{20000}-\u{2ffff}]/u;
  if (cjkRegex.test(trimmed)) {
    const cjk = trimmed.match(/[㐀-鿿\u{20000}-\u{2ffff}]/gu) ?? [];
    if (cjk.length >= 2) return cjk.slice(0, 2).join('');
    if (cjk.length === 1) return cjk[0];
  }
  const initials = trimmed
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-zÀ-ɏ]/g, ''))
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase())
    .filter(Boolean)
    .join('');
  if (initials) return initials;
  return trimmed.slice(0, 2).toUpperCase();
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

// 鱼尾纹分隔（双线 + 中央倒三角）
function FishTailDivider({ themeColors }: { themeColors: ThemeColors }) {
  return (
    <div
      className="fish-tail my-5"
      style={{ color: themeColors.ink }}
    >
      <span className="fish-tail-icon" />
    </div>
  );
}

// 雕版书架卡片 — 双线版框 + 磁吸 3D hover + 已读印章
function BookCard({
  book,
  index,
  onSelect,
  onRemove,
  themeColors,
  showLastRead = true,
}: {
  book: ReadingHistory;
  index: number;
  onSelect: (book: ReadingHistory) => void;
  onRemove: (id: string) => void;
  themeColors: ThemeColors;
  showLastRead?: boolean;
}) {
  const coverUrl = useBookCover(book.id, book.cover, book.hasCover);
  const isFinished = book.progress >= 98;

  // 磁吸 3D hover：跟随鼠标位置微微倾斜
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-1, 1], [3, -3]), { stiffness: 280, damping: 24 });
  const rotY = useSpring(useTransform(mx, [-1, 1], [-3, 3]), { stiffness: 280, damping: 24 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    my.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouse}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 1000, transformStyle: 'preserve-3d' }}
      className="group relative"
    >
      <div
        onClick={() => onSelect(book)}
        className="relative flex items-start gap-4 p-4 cursor-pointer transition-shadow duration-300 glass-surface block-print-frame"
        style={{
          backgroundColor: themeColors.glass,
          border: `1px solid ${themeColors.glassBorder}`,
          borderRadius: '20px',
          boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 12px 32px -20px rgba(0,0,0,0.2)`,
          color: themeColors.ink, // .block-print-frame::before 用 currentColor 描边
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 1px 0 ${themeColors.glassBorder} inset, 0 22px 48px -16px rgba(0,0,0,0.32)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `0 1px 0 ${themeColors.glassBorder} inset, 0 12px 32px -20px rgba(0,0,0,0.2)`;
        }}
      >
        {/* 封面 */}
        <div
          className="w-[78px] h-[112px] flex-shrink-0 flex items-center justify-center text-white text-xs font-medium text-center p-2 overflow-hidden relative"
          style={{
            background: coverUrl
              ? `url(${coverUrl}) center/cover no-repeat`
              : getBookGradient(book.title),
            borderRadius: '4px 12px 4px 12px',
            boxShadow:
              '0 6px 16px -6px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.1) inset, -2px 0 0 rgba(0,0,0,0.06) inset',
            fontFamily: '"Noto Serif SC", serif',
          }}
        >
          {!coverUrl && getCoverInitials(book.title)}
          {/* 书脊侧面阴影线 */}
          <div className="absolute left-1.5 top-0 bottom-0 w-px" style={{ backgroundColor: 'rgba(0,0,0,0.12)' }} />
        </div>

        {/* 信息区 */}
        <div className="flex-1 min-w-0" style={{ color: themeColors.text }}>
          <h3
            className="text-[15px] leading-snug mb-1 line-clamp-2 tracking-tight"
            style={{
              color: themeColors.text,
              fontFamily: '"Noto Serif SC", serif',
              fontWeight: 600,
            }}
          >
            {book.title}
          </h3>
          <p className="text-xs mb-2.5 line-clamp-1" style={{ color: themeColors.icon }}>
            {book.author || '佚名'}
          </p>
          {showLastRead && (
            <div className="flex items-center gap-1 text-[11px] mb-2.5" style={{ color: themeColors.icon }}>
              <Clock size={11} />
              <span>{formatTime(book.lastReadAt)}</span>
            </div>
          )}
          {/* 水墨笔触进度条 */}
          <div>
            <div
              className="h-[3px] rounded-full overflow-hidden relative"
              style={{ backgroundColor: themeColors.inkSoft }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${themeColors.accent}66, ${themeColors.accent}, ${themeColors.accent}cc)`,
                  boxShadow: `0 0 6px -1px ${themeColors.accent}`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${book.progress}%` }}
                transition={{ duration: 0.7, delay: 0.15 + Math.min(index * 0.03, 0.25), ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px]" style={{ color: themeColors.icon }}>
                已读{' '}
                <AnimatedNumber
                  value={book.progress}
                  suffix="%"
                  style={{ color: themeColors.accent, fontWeight: 600 }}
                />
              </span>
              {isFinished && (
                <span
                  className="text-[10px] tracking-widest px-1.5 py-0.5 rounded-sm"
                  style={{
                    color: themeColors.seal,
                    border: `1px solid ${themeColors.seal}`,
                    fontFamily: '"Noto Serif SC", serif',
                  }}
                >
                  已读
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 删除按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(book.id);
          }}
          aria-label="删除书籍"
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{
            color: themeColors.icon,
            backgroundColor: themeColors.accentSoft,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = themeColors.seal;
            e.currentTarget.style.backgroundColor = themeColors.sealSoft;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = themeColors.icon;
            e.currentTarget.style.backgroundColor = themeColors.accentSoft;
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// 翰墨待书 — 空状态水墨小品（极简笔触 + 印章）
function EmptyState({
  title,
  description,
  themeColors,
}: {
  title: string;
  description: string;
  themeColors: ThemeColors;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-20"
    >
      {/* 极简水墨竹枝 */}
      <svg
        width="160"
        height="180"
        viewBox="0 0 160 180"
        className="mb-5"
        style={{ color: themeColors.ink }}
      >
        <defs>
          <filter id="brush-stroke">
            <feTurbulence baseFrequency="0.7" numOctaves="2" />
            <feDisplacementMap in="SourceGraphic" scale="2" />
          </filter>
        </defs>
        {/* 主干 */}
        <path
          d="M 80 170 Q 78 110 86 60 Q 92 30 108 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.7"
          filter="url(#brush-stroke)"
        />
        {/* 竹节 */}
        <line x1="74" y1="140" x2="84" y2="138" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <line x1="76" y1="100" x2="86" y2="96" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <line x1="80" y1="60" x2="92" y2="56" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        {/* 叶子 */}
        <path d="M 86 60 Q 110 50 130 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <path d="M 92 30 Q 110 10 130 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
        <path d="M 78 110 Q 50 100 30 90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      </svg>
      {/* 朱砂落款印 */}
      <div className="mb-5">
        <Seal char="阅" size={36} themeColors={themeColors} animate withGlow />
      </div>
      <h3
        className="text-xl mb-2 tracking-wide"
        style={{
          color: themeColors.text,
          fontFamily: '"Noto Serif SC", serif',
          fontWeight: 600,
        }}
      >
        {title}
      </h3>
      <p
        className="text-sm max-w-xs text-center leading-relaxed"
        style={{ color: themeColors.icon }}
      >
        {description}
      </p>
    </motion.div>
  );
}

// Hero 区数据卡片（每日宜读 / 累计 / 连读）
function StatPill({
  icon,
  label,
  value,
  themeColors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  themeColors: ThemeColors;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-surface"
      style={{
        backgroundColor: themeColors.glass,
        border: `1px solid ${themeColors.glassBorder}`,
      }}
    >
      <span style={{ color: themeColors.accent }}>{icon}</span>
      <span className="text-[11px]" style={{ color: themeColors.icon }}>{label}</span>
      <span
        className="text-[12px] tabular-nums tracking-tight"
        style={{ color: themeColors.text, fontWeight: 600 }}
      >
        {value}
      </span>
    </div>
  );
}

export function Home({
  readingHistory,
  onSelectBook,
  onRemoveBook,
  onUploadFile,
  onGoToHome,
  onGoToBookshelf,
  currentTab,
  themeColors,
}: HomeProps) {
  const phrase = useMemo(() => getDailyPhrase(), []);

  const recentBooks = [...readingHistory].sort((a, b) => b.lastReadAt - a.lastReadAt);
  const bookshelfBooks = [...readingHistory].sort((a, b) => {
    const aTime = parseInt(a.id.replace('book-', '')) || 0;
    const bTime = parseInt(b.id.replace('book-', '')) || 0;
    return bTime - aTime;
  });
  const books = currentTab === 'home' ? recentBooks : bookshelfBooks;

  // 简易统计
  const finishedCount = readingHistory.filter((b) => b.progress >= 98).length;
  const todayLabel = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pt-[84px] pb-16 px-5 sm:px-8 lg:px-12 relative"
      style={{
        backgroundColor: themeColors.background,
        // 让 .block-print-grid 中的 var(--ink-soft) 拿到正确值
        ['--ink-soft' as string]: themeColors.inkSoft,
      }}
    >
      <InkBlobs themeColors={themeColors} />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* ============ HERO 区 ============ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:items-end"
        >
          {/* 左：经典句大字 + 副标 + 鱼尾纹 + 状态条 */}
          <div>
            <div
              className="text-[12px] tracking-[0.3em] mb-3 uppercase"
              style={{ color: themeColors.icon, fontFamily: '"Noto Serif SC", serif' }}
            >
              墨韵书房 · 静读
            </div>
            <h1
              className="text-[56px] sm:text-[64px] lg:text-[88px] leading-[1] tracking-tight"
              style={{
                color: themeColors.text,
                fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              {phrase.main.split('').map((c, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.6, delay: 0.18 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block"
                >
                  {c}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-2 text-[14px] tracking-wider"
              style={{ color: themeColors.icon, fontFamily: '"Noto Serif SC", serif' }}
            >
              {phrase.sub}
            </motion.p>
            <FishTailDivider themeColors={themeColors} />
            <div className="flex flex-wrap items-center gap-2.5">
              <StatPill
                icon={<BookOpen size={12} />}
                label="书架"
                value={`${readingHistory.length} 卷`}
                themeColors={themeColors}
              />
              <StatPill
                icon={<Flame size={12} />}
                label="读毕"
                value={`${finishedCount} 卷`}
                themeColors={themeColors}
              />
              <StatPill
                icon={<Clock size={12} />}
                label="今日"
                value={todayLabel}
                themeColors={themeColors}
              />
            </div>
          </div>

          {/* 右：朱砂方印 + 落款 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex flex-col items-center gap-2 mr-2"
          >
            <Seal char="阅" size={92} themeColors={themeColors} animate withGlow />
            <span
              className="text-[10px] tracking-[0.4em] mt-2"
              style={{ color: themeColors.icon, fontFamily: '"Noto Serif SC", serif' }}
            >
              丙申 · 静读
            </span>
          </motion.div>
        </motion.section>

        {/* ============ 控制栏 ============ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* Tab 玻璃胶囊 */}
          <div
            className="inline-flex items-center gap-1 p-1 glass-surface self-start"
            style={{
              backgroundColor: themeColors.glass,
              border: `1px solid ${themeColors.glassBorder}`,
              borderRadius: '999px',
              boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 4px 16px -8px rgba(0,0,0,0.12)`,
            }}
          >
            {([
              { id: 'home' as const, label: '继续阅读', Icon: BookOpen, onClick: onGoToHome },
              { id: 'bookshelf' as const, label: '我的书架', Icon: Library, onClick: onGoToBookshelf },
            ]).map(({ id, label, Icon, onClick }) => {
              const active = currentTab === id;
              return (
                <button
                  key={id}
                  onClick={onClick}
                  className="relative px-4 py-2 rounded-full text-sm transition-all duration-300 flex items-center gap-2"
                  style={{
                    color: active ? '#fff' : themeColors.icon,
                    fontWeight: active ? 500 : 400,
                    zIndex: 1,
                  }}
                >
                  {active && (
                    <motion.span
                      layoutId="homeTabActive"
                      className="absolute inset-0 rounded-full -z-10"
                      style={{
                        background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.accent}d9)`,
                        boxShadow: `0 4px 14px -4px ${themeColors.accent}`,
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon size={15} strokeWidth={2} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* 上传按钮 */}
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            onClick={onUploadFile}
            className="px-5 py-2.5 rounded-full text-sm flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.accent}e6)`,
              color: '#ffffff',
              fontWeight: 500,
              boxShadow: `0 6px 18px -6px ${themeColors.accent}, 0 1px 0 rgba(255,255,255,0.3) inset`,
            }}
          >
            <Plus size={17} strokeWidth={2.3} />
            上传 EPUB 书籍
          </motion.button>
        </div>

        {/* ============ 书架网格 ============ */}
        {books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {books.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                index={index}
                onSelect={onSelectBook}
                onRemove={onRemoveBook}
                themeColors={themeColors}
                showLastRead={currentTab === 'home'}
              />
            ))}
          </div>
        ) : currentTab === 'home' ? (
          <EmptyState
            title="案上无卷"
            description="点击上方「上传 EPUB 书籍」开启一段新的阅读"
            themeColors={themeColors}
          />
        ) : (
          <EmptyState
            title="书架空空如也"
            description="上传你的第一本 EPUB，让书架温暖起来"
            themeColors={themeColors}
          />
        )}
      </div>
    </motion.div>
  );
}
