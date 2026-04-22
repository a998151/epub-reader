import { useState, useCallback, useEffect, useRef } from 'react';
import { TopNav } from '@/components/TopNav';
import { Toolbar } from '@/components/Toolbar';
import { TocSidebar } from '@/components/TocSidebar';
import { FontSettings } from '@/components/FontSettings';
import { ThemeSettings } from '@/components/ThemeSettings';
import { Reader } from '@/components/Reader';
import { ProgressBar } from '@/components/ProgressBar';
import { Home } from '@/components/Home';
import { useReader } from '@/hooks/useReader';
import { useSettings } from '@/hooks/useSettings';
import { saveBookData, getBookData, deleteBookData } from '@/utils/indexedDB';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { ReadingHistory } from '@/types';
import './App.css';

type View = 'home' | 'reader';
type HomeTab = 'home' | 'bookshelf';

function App() {
  // View state
  const [currentView, setCurrentView] = useState<View>('home');
  const [currentHomeTab, setCurrentHomeTab] = useState<HomeTab>('home');
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  
  // File input ref for upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reader state
  const {
    book,
    isLoaded,
    toc,
    metadata,
    currentLocation,
    progress,
    loadBook,
    renderTo,
    display,
    next,
    prev,
    goToTocItem,
    applyTheme,
    applyFontSettings,
    generateLocations,
    getCurrentLocation,
  } = useReader();

  // Settings state
  const {
    settings,
    setFontSize,
    setLineHeight,
    setFontFamily,
    setContentWidth,
    setTheme,
    addBookmark,
    removeBookmark,
    isBookmarked,
    addToHistory,
    updateHistoryProgress,
    removeFromHistory,
    getSortedHistory,
    getThemeColors,
  } = useSettings();

  // UI state
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isFontSettingsOpen, setIsFontSettingsOpen] = useState(false);
  const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState(false);

  const themeColors = getThemeColors();
  const hasRendered = useRef(false);
  const initialCfi = useRef<string | undefined>(undefined);

  // Save current reading position
  const saveCurrentPosition = useCallback(() => {
    if (currentBookId) {
      const location = getCurrentLocation() as { start?: { cfi: string } } | null;
      if (location && location.start && location.start.cfi) {
        const cfi = location.start.cfi;
        const percentage = book?.locations?.percentageFromCfi(cfi) || 0;
        const progressValue = Math.round(percentage * 100);
        updateHistoryProgress(currentBookId, progressValue, cfi);
        console.log('Saved position:', { cfi, progress: progressValue });
      }
    }
  }, [currentBookId, book, getCurrentLocation, updateHistoryProgress]);

  // Navigate to home
  const goToHome = useCallback(() => {
    // Save current position before leaving
    saveCurrentPosition();
    setCurrentView('home');
    setCurrentHomeTab('home');
  }, [saveCurrentPosition]);

  // Navigate to bookshelf
  const goToBookshelf = useCallback(() => {
    // Save current position before leaving
    saveCurrentPosition();
    setCurrentView('home');
    setCurrentHomeTab('bookshelf');
  }, [saveCurrentPosition]);

  // Trigger file upload
  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    try {
      hasRendered.current = false;
      const arrayBuffer = await file.arrayBuffer();
      const loadedBook = await loadBook(arrayBuffer);
      
      if (loadedBook) {
        // Add to reading history
        const bookId = `book-${Date.now()}`;
        setCurrentBookId(bookId);
        
        // Try to get cover
        let coverUrl: string | undefined;
        try {
          const cover = await loadedBook.coverUrl();
          if (cover) coverUrl = cover;
        } catch {
          // No cover available
        }
        
        addToHistory({
          id: bookId,
          title: metadata.title || file.name.replace('.epub', ''),
          author: metadata.author,
          cover: coverUrl,
          lastReadAt: Date.now(),
          progress: 0,
        });

        // 文件数据存入 IndexedDB
        saveBookData(bookId, arrayBuffer).catch((e) => {
          console.error('IndexedDB 保存失败:', e);
          toast.error('书籍数据保存失败', { description: '请检查浏览器存储空间' });
        });
        
        setCurrentView('reader');
        toast.success('书籍加载成功', {
          description: `已加载: ${file.name}`,
        });
      }
    } catch (err) {
      toast.error('加载失败', {
        description: err instanceof Error ? err.message : '无法解析EPUB文件',
      });
    }
  }, [loadBook, metadata, addToHistory]);

  // Handle selecting book from history
  const handleSelectBookFromHistory = useCallback(async (historyBook: ReadingHistory) => {
    try {
      hasRendered.current = false;
      initialCfi.current = historyBook.cfi; // 保存阅读位置
      setCurrentBookId(historyBook.id);

      const fileData = await getBookData(historyBook.id);
      if (fileData) {
        await loadBook(fileData);
        setCurrentView('reader');

        // Update last read time
        addToHistory({
          ...historyBook,
          lastReadAt: Date.now(),
        });

        toast.success('继续阅读', {
          description: historyBook.title,
        });
      } else {
        toast.error('无法加载书籍', {
          description: '书籍数据已丢失',
        });
      }
    } catch (err) {
      toast.error('加载失败', {
        description: err instanceof Error ? err.message : '无法解析EPUB文件',
      });
    }
  }, [loadBook, addToHistory]);

  // Handle removing book from history
  const handleRemoveBook = useCallback((id: string) => {
    removeFromHistory(id);
    deleteBookData(id).catch((e) => console.error('IndexedDB 删除失败:', e));
    toast.success('已删除阅读记录');
  }, [removeFromHistory]);

  // Handle render - only called once when book is loaded
  const handleRender = useCallback(async (element: HTMLElement) => {
    // Prevent multiple renders
    if (hasRendered.current) return;
    
    // Wheel handler for page flip
    const handleWheel = (deltaY: number) => {
      if (deltaY > 0) {
        next();
      } else {
        prev();
      }
    };
    
    const rendition = renderTo(element, handleWheel, {
      width: '100%',
      height: '100%',
    });

    if (rendition) {
      hasRendered.current = true;
      
      // Apply initial settings
      applyTheme(themeColors);
      applyFontSettings(settings);
      
      // Display at saved position or first page FIRST (for quick loading)
      if (initialCfi.current) {
        console.log('Restoring to position:', initialCfi.current);
        await display(initialCfi.current);
      } else {
        await display(0);
      }
      
      // Generate locations in background (for progress calculation)
      // Use smaller chunk size for faster generation
      setTimeout(() => {
        generateLocations();
      }, 100);
    }
  }, [renderTo, display, applyTheme, applyFontSettings, settings, themeColors, generateLocations]);

  // Apply settings when they change (but not on initial render)
  useEffect(() => {
    if (isLoaded && hasRendered.current) {
      applyTheme(themeColors);
      applyFontSettings(settings);
    }
  }, [settings.fontSize, settings.lineHeight, settings.fontFamily, settings.theme]);

  // Auto-save reading position when location changes
  useEffect(() => {
    if (currentBookId && currentLocation && currentLocation.start && currentLocation.start.cfi) {
      const cfi = currentLocation.start.cfi;
      const percentage = book?.locations?.percentageFromCfi(cfi) || 0;
      const progressValue = Math.round(percentage * 100);
      updateHistoryProgress(currentBookId, progressValue, cfi);
      console.log('Auto-saved position:', { cfi, progress: progressValue });
    }
  }, [currentBookId, currentLocation, book, updateHistoryProgress]);

  // Handle bookmark toggle
  const handleToggleBookmark = useCallback(() => {
    if (!currentLocation) return;
    
    const cfi = currentLocation.start.cfi;
    const chapter = toc.find(item => 
      item.href === currentLocation.start.href || 
      currentLocation.start.href?.includes(item.href)
    );
    const title = chapter?.label || '未命名位置';

    if (isBookmarked(cfi)) {
      removeBookmark(cfi);
      toast.success('已移除书签');
    } else {
      addBookmark(cfi, title);
      toast.success('已添加书签', {
        description: title,
      });
    }
  }, [currentLocation, toc, isBookmarked, addBookmark, removeBookmark]);

  // Handle TOC item selection
  const handleTocSelect = useCallback((href: string) => {
    goToTocItem(href);
  }, [goToTocItem]);

  // Get current href for TOC highlighting
  const currentHref = currentLocation?.start.href || null;

  // Get current chapter title
  const currentChapterTitle = (() => {
    if (!currentHref || toc.length === 0) return '';
    const findChapter = (items: typeof toc): string | undefined => {
      for (const item of items) {
        if (item.href === currentHref || currentHref.includes(item.href)) {
          return item.label;
        }
        if (item.subitems) {
          const found = findChapter(item.subitems);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findChapter(toc) || '';
  })();

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: themeColors.background }}
    >
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          // Reset input so same file can be selected again
          e.target.value = '';
        }}
        className="hidden"
      />

      <TopNav
        title={currentView === 'reader' ? metadata.title : 'EPUB Reader'}
        onToggleToc={() => setIsTocOpen(true)}
        onGoToHome={goToHome}
        onGoToBookshelf={goToBookshelf}
        currentView={currentView}
        themeColors={themeColors}
      />

      {currentView === 'reader' && isLoaded && (
        <Toolbar
          onToggleToc={() => setIsTocOpen(true)}
          onOpenFontSettings={() => setIsFontSettingsOpen(true)}
          onOpenThemeSettings={() => setIsThemeSettingsOpen(true)}
          onToggleBookmark={handleToggleBookmark}
          onOpenSettings={() => {}}
          onPrev={prev}
          onNext={next}
          isBookmarked={currentLocation ? isBookmarked(currentLocation.start.cfi) : false}
          themeColors={themeColors}
        />
      )}

      <TocSidebar
        isOpen={isTocOpen}
        onClose={() => setIsTocOpen(false)}
        toc={toc}
        currentHref={currentHref}
        onSelectItem={handleTocSelect}
        themeColors={themeColors}
      />

      <FontSettings
        isOpen={isFontSettingsOpen}
        onClose={() => setIsFontSettingsOpen(false)}
        fontSize={settings.fontSize}
        lineHeight={settings.lineHeight}
        fontFamily={settings.fontFamily}
        contentWidth={settings.contentWidth}
        onFontSizeChange={setFontSize}
        onLineHeightChange={setLineHeight}
        onFontFamilyChange={setFontFamily}
        onContentWidthChange={setContentWidth}
        themeColors={themeColors}
      />

      <ThemeSettings
        isOpen={isThemeSettingsOpen}
        onClose={() => setIsThemeSettingsOpen(false)}
        currentTheme={settings.theme}
        onThemeChange={setTheme}
        themeColors={themeColors}
      />

      {currentView === 'home' ? (
        <Home
          readingHistory={getSortedHistory()}
          onSelectBook={handleSelectBookFromHistory}
          onRemoveBook={handleRemoveBook}
          onUploadFile={triggerUpload}
          onGoToHome={goToHome}
          onGoToBookshelf={goToBookshelf}
          currentTab={currentHomeTab}
          themeColors={themeColors}
        />
      ) : (
        <>
          <Reader
            book={book}
            isLoaded={isLoaded}
            onRender={handleRender}
            onPrev={prev}
            onNext={next}
            themeColors={themeColors}
            onFileSelect={handleFileSelect}
            chapterTitle={currentChapterTitle}
            contentWidth={settings.contentWidth}
          />
          {isLoaded && <ProgressBar progress={progress} themeColors={themeColors} />}
        </>
      )}

      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: themeColors.secondaryBg,
            color: themeColors.text,
            border: `1px solid ${themeColors.border}`,
          },
        }}
      />
    </div>
  );
}

export default App;
