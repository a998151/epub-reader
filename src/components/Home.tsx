import { motion } from 'framer-motion';
import { BookOpen, Clock, Trash2, Plus, Library } from 'lucide-react';
import { useBookCover } from '@/hooks/useBookCover';
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

// 柔和暖色渐变，替代原来的高饱和卡通色
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
    'linear-gradient(135deg, #e3c8a9 0%, #a57c5b 100%)',
    'linear-gradient(135deg, #cfb89f 0%, #82644c 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

// 智能生成封面占位字符：
// - 含 CJK 字符：取前 2 个 CJK 字
// - 纯英文：取每个单词大写首字母（最多 3 个）
// - fallback：取首 2 字
function getCoverInitials(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return '?';
  // eslint-disable-next-line no-misleading-character-class
  const cjkRegex = /[㐀-鿿\u{20000}-\u{2ffff}]/u;
  if (cjkRegex.test(trimmed)) {
    // 先去掉标点/空白，保留 CJK 取前 2 个字
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

// 有机 blob 装饰
function OrganicBlobs({ themeColors }: { themeColors: ThemeColors }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute -top-24 -right-20 w-[520px] h-[520px]"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${themeColors.blob1}, transparent 60%)`,
          filter: 'blur(40px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.15 }}
        className="absolute -bottom-40 -left-32 w-[620px] h-[620px]"
        style={{
          background: `radial-gradient(circle at 60% 40%, ${themeColors.blob2}, transparent 65%)`,
          filter: 'blur(50px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[480px] h-[480px]"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${themeColors.blob1}, transparent 70%)`,
          filter: 'blur(60px)',
          opacity: 0.5,
        }}
      />
    </div>
  );
}

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <div
        onClick={() => onSelect(book)}
        className="flex items-start gap-4 p-4 cursor-pointer transition-all duration-300 glass-surface"
        style={{
          backgroundColor: themeColors.glass,
          border: `1px solid ${themeColors.glassBorder}`,
          borderRadius: '24px',
          boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 12px 32px -20px rgba(0,0,0,0.2)`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 1px 0 ${themeColors.glassBorder} inset, 0 18px 40px -16px rgba(0,0,0,0.28)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `0 1px 0 ${themeColors.glassBorder} inset, 0 12px 32px -20px rgba(0,0,0,0.2)`;
        }}
      >
        {/* 封面 */}
        <div
          className="w-[72px] h-[102px] flex-shrink-0 flex items-center justify-center text-white text-xs font-medium text-center p-2 overflow-hidden"
          style={{
            background: coverUrl
              ? `url(${coverUrl}) center/cover no-repeat`
              : getBookGradient(book.title),
            borderRadius: '14px 10px 14px 10px',
            boxShadow: '0 6px 16px -6px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1) inset',
            fontFamily: '"Noto Serif SC", serif',
          }}
        >
          {!coverUrl && getCoverInitials(book.title)}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
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
          <p
            className="text-xs mb-2.5 line-clamp-1"
            style={{ color: themeColors.icon }}
          >
            {book.author || '未知作者'}
          </p>
          {showLastRead && (
            <div
              className="flex items-center gap-1 text-[11px] mb-2.5"
              style={{ color: themeColors.icon }}
            >
              <Clock size={11} />
              <span>{formatTime(book.lastReadAt)}</span>
            </div>
          )}
          {/* 进度 */}
          <div>
            <div
              className="h-[3px] rounded-full overflow-hidden"
              style={{ backgroundColor: themeColors.accentSoft }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${themeColors.accent}, ${themeColors.accent}cc)`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${book.progress}%` }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span
              className="text-[11px] mt-1.5 block"
              style={{ color: themeColors.icon }}
            >
              已读 {book.progress}%
            </span>
          </div>
        </div>

        {/* 删除 */}
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
            e.currentTarget.style.color = '#d97757';
            e.currentTarget.style.backgroundColor = 'rgba(217, 119, 87, 0.15)';
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

function EmptyState({
  icon: Icon,
  title,
  description,
  themeColors,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  themeColors: ThemeColors;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-24"
    >
      <div
        className="w-28 h-28 flex items-center justify-center mb-7 glass-surface"
        style={{
          backgroundColor: themeColors.glass,
          border: `1px solid ${themeColors.glassBorder}`,
          borderRadius: '42% 58% 54% 46% / 48% 44% 56% 52%',
          boxShadow: `0 20px 50px -24px ${themeColors.accent}40`,
        }}
      >
        <Icon size={44} style={{ color: themeColors.accent, opacity: 0.75 }} strokeWidth={1.5} />
      </div>
      <h3
        className="text-xl mb-2 tracking-tight"
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
  const recentBooks = [...readingHistory].sort((a, b) => b.lastReadAt - a.lastReadAt);
  const bookshelfBooks = [...readingHistory].sort((a, b) => {
    const aTime = parseInt(a.id.replace('book-', '')) || 0;
    const bTime = parseInt(b.id.replace('book-', '')) || 0;
    return bTime - aTime;
  });
  const books = currentTab === 'home' ? recentBooks : bookshelfBooks;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pt-[84px] pb-16 px-5 sm:px-8 lg:px-12 relative"
      style={{ backgroundColor: themeColors.background }}
    >
      <OrganicBlobs themeColors={themeColors} />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <h1
            className="text-[32px] lg:text-[38px] leading-tight tracking-tight"
            style={{
              color: themeColors.text,
              fontFamily: '"Noto Serif SC", serif',
              fontWeight: 600,
            }}
          >
            欢迎回来
          </h1>
          <p
            className="mt-2 text-[15px]"
            style={{ color: themeColors.icon }}
          >
            在文字里，与时间温柔相处。
          </p>
        </motion.div>

        {/* 控制栏 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          {/* Tabs — 玻璃胶囊 */}
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

        {/* 统计 */}
        <div className="flex items-center gap-5 mb-6">
          <div
            className="flex items-center gap-2 text-[13px]"
            style={{ color: themeColors.icon }}
          >
            {currentTab === 'home' ? <BookOpen size={14} /> : <Library size={14} />}
            <span>
              {currentTab === 'home'
                ? `共 ${recentBooks.length} 本书`
                : `书架共 ${bookshelfBooks.length} 本书`}
            </span>
          </div>
        </div>

        {/* 书籍网格 */}
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
            icon={BookOpen}
            title="还没有阅读记录"
            description="点击上方“上传 EPUB 书籍”开始一段新的阅读旅程"
            themeColors={themeColors}
          />
        ) : (
          <EmptyState
            icon={Library}
            title="书架是空的"
            description="上传你的第一本 EPUB，让书架温暖起来"
            themeColors={themeColors}
          />
        )}
      </div>
    </motion.div>
  );
}
