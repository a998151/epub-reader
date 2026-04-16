import { motion } from 'framer-motion';
import { BookOpen, Clock, Trash2, Plus, Library } from 'lucide-react';
import type { ReadingHistory } from '@/types';

interface HomeProps {
  readingHistory: ReadingHistory[];
  onSelectBook: (book: ReadingHistory) => void;
  onRemoveBook: (id: string) => void;
  onUploadFile: () => void;
  onGoToHome: () => void;
  onGoToBookshelf: () => void;
  currentTab: 'home' | 'bookshelf';
  themeColors: {
    background: string;
    text: string;
    secondaryBg: string;
    border: string;
    icon: string;
  };
}

// 生成书籍封面的渐变色
function getBookGradient(title: string): string {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

// 格式化时间
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

// 书籍卡片组件
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
  themeColors: {
    background: string;
    text: string;
    secondaryBg: string;
    border: string;
    icon: string;
  };
  showLastRead?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative"
    >
      <div
        onClick={() => onSelect(book)}
        className="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg"
        style={{ 
          backgroundColor: themeColors.secondaryBg,
          border: `1px solid ${themeColors.border}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#4a9eff';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = themeColors.border;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Book Cover */}
        <div 
          className="w-20 h-28 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold text-center p-2 overflow-hidden"
          style={{ 
            background: book.cover 
              ? `url(${book.cover}) center/cover no-repeat` 
              : getBookGradient(book.title),
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {!book.cover && book.title.slice(0, 4)}
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <h3 
            className="font-semibold text-base mb-1 line-clamp-2"
            style={{ color: themeColors.text }}
          >
            {book.title}
          </h3>
          <p 
            className="text-sm mb-2 line-clamp-1"
            style={{ color: themeColors.icon }}
          >
            {book.author || '未知作者'}
          </p>
          {showLastRead && (
            <div 
              className="flex items-center gap-1 text-xs"
              style={{ color: themeColors.icon }}
            >
              <Clock size={12} />
              <span>{formatTime(book.lastReadAt)}</span>
            </div>
          )}
          {/* Progress Bar */}
          <div className="mt-3">
            <div 
              className="h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: `${themeColors.icon}30` }}
            >
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${book.progress}%`,
                  backgroundColor: '#4a9eff',
                }}
              />
            </div>
            <span 
              className="text-xs mt-1 block"
              style={{ color: themeColors.icon }}
            >
              已读 {book.progress}%
            </span>
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(book.id);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{ 
            color: themeColors.icon,
            backgroundColor: `${themeColors.icon}15`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.backgroundColor = '#ef444420';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = themeColors.icon;
            e.currentTarget.style.backgroundColor = `${themeColors.icon}15`;
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
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
  themeColors 
}: HomeProps) {
  // 继续阅读：按最后阅读时间排序
  const recentBooks = [...readingHistory].sort((a, b) => b.lastReadAt - a.lastReadAt);
  // 书架：按添加时间排序（这里用 id 中的时间戳）
  const bookshelfBooks = [...readingHistory].sort((a, b) => {
    const aTime = parseInt(a.id.replace('book-', '')) || 0;
    const bTime = parseInt(b.id.replace('book-', '')) || 0;
    return bTime - aTime;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pt-[80px] pb-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: themeColors.background }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with Tabs and Upload Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* Tabs */}
          <div 
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{ 
              backgroundColor: themeColors.secondaryBg,
              border: `1px solid ${themeColors.border}`,
            }}
          >
            <button
              onClick={onGoToHome}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2`}
              style={{ 
                backgroundColor: currentTab === 'home' ? '#4a9eff' : 'transparent',
                color: currentTab === 'home' ? '#ffffff' : themeColors.icon,
              }}
            >
              <BookOpen size={16} />
              继续阅读
            </button>
            <button
              onClick={onGoToBookshelf}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2`}
              style={{ 
                backgroundColor: currentTab === 'bookshelf' ? '#4a9eff' : 'transparent',
                color: currentTab === 'bookshelf' ? '#ffffff' : themeColors.icon,
              }}
            >
              <Library size={16} />
              我的书架
            </button>
          </div>

          {/* Upload Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUploadFile}
            className="px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-lg"
            style={{
              backgroundColor: '#4a9eff',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(74, 158, 255, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3a8eef';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(74, 158, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4a9eff';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(74, 158, 255, 0.4)';
            }}
          >
            <Plus size={20} />
            上传 EPUB 书籍
          </motion.button>
        </div>

        {/* Content */}
        {currentTab === 'home' ? (
          <>
            {/* Stats */}
            <div className="flex items-center gap-6 mb-6">
              <div 
                className="flex items-center gap-2 text-sm"
                style={{ color: themeColors.icon }}
              >
                <BookOpen size={16} />
                <span>共 {recentBooks.length} 本书</span>
              </div>
            </div>

            {/* Book Grid */}
            {recentBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recentBooks.map((book, index) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    index={index}
                    onSelect={onSelectBook}
                    onRemove={onRemoveBook}
                    themeColors={themeColors}
                    showLastRead={true}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div 
                  className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6"
                  style={{ 
                    backgroundColor: themeColors.secondaryBg,
                    border: `2px dashed ${themeColors.border}`,
                  }}
                >
                  <BookOpen size={48} style={{ color: themeColors.icon, opacity: 0.5 }} />
                </div>
                <h3 
                  className="text-xl font-semibold mb-2"
                  style={{ color: themeColors.text }}
                >
                  还没有阅读记录
                </h3>
                <p 
                  className="text-base mb-6"
                  style={{ color: themeColors.icon }}
                >
                  点击上方"上传 EPUB 书籍"按钮开始阅读吧
                </p>
              </motion.div>
            )}
          </>
        ) : (
          /* Bookshelf View */
          <>
            {/* Stats */}
            <div className="flex items-center gap-6 mb-6">
              <div 
                className="flex items-center gap-2 text-sm"
                style={{ color: themeColors.icon }}
              >
                <Library size={16} />
                <span>书架共 {bookshelfBooks.length} 本书</span>
              </div>
            </div>

            {/* Book Grid */}
            {bookshelfBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {bookshelfBooks.map((book, index) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    index={index}
                    onSelect={onSelectBook}
                    onRemove={onRemoveBook}
                    themeColors={themeColors}
                    showLastRead={false}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div 
                  className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6"
                  style={{ 
                    backgroundColor: themeColors.secondaryBg,
                    border: `2px dashed ${themeColors.border}`,
                  }}
                >
                  <Library size={48} style={{ color: themeColors.icon, opacity: 0.5 }} />
                </div>
                <h3 
                  className="text-xl font-semibold mb-2"
                  style={{ color: themeColors.text }}
                >
                  书架是空的
                </h3>
                <p 
                  className="text-base mb-6"
                  style={{ color: themeColors.icon }}
                >
                  点击上方"上传 EPUB 书籍"按钮添加书籍
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
