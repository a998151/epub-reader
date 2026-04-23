import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
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
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { ReadingHistory } from '@/types';
import './App.css';

type View = 'home' | 'reader';
type HomeTab = 'home' | 'bookshelf';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [currentHomeTab, setCurrentHomeTab] = useState<HomeTab>('home');
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);

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
      }
    }
  }, [currentBookId, book, getCurrentLocation, updateHistoryProgress]);

  const goToHome = useCallback(() => {
    saveCurrentPosition();
    setCurrentView('home');
    setCurrentHomeTab('home');
  }, [saveCurrentPosition]);

  const goToBookshelf = useCallback(() => {
    saveCurrentPosition();
    setCurrentView('home');
    setCurrentHomeTab('bookshelf');
  }, [saveCurrentPosition]);

  // Open native file dialog to select EPUB
  const handleUploadFile = useCallback(async () => {
    console.log('[handleUploadFile] starting...');
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'EPUB', extensions: ['epub'] }],
      });
      console.log('[handleUploadFile] selected:', selected);
      if (!selected) return;
      const filePath = selected as string;
      await loadEpubFile(filePath);
    } catch (err) {
      console.error('[handleUploadFile] error:', err);
      toast.error('打开文件失败', {
        description: err instanceof Error ? err.message : '无法选择文件',
      });
    }
  }, [loadEpubFile]);

  // Load an EPUB file from a file path
  const loadEpubFile = useCallback(async (filePath: string) => {
    console.log('[loadEpubFile] starting, filePath:', filePath);
    try {
      hasRendered.current = false;
      const bookId = `book-${Date.now()}`;

      // Save book file via Rust backend
      console.log('[loadEpubFile] saving book file...');
      await invoke('save_book_file', { id: bookId, sourcePath: filePath });

      // Convert stored path to asset URL for epubjs
      console.log('[loadEpubFile] getting book file path...');
      const storedPath = await invoke<string>('get_book_file_path', { id: bookId });
      console.log('[loadEpubFile] storedPath:', storedPath);
      const assetUrl = convertFileSrc(storedPath);
      console.log('[loadEpubFile] assetUrl:', assetUrl);

      const loadedBook = await loadBook(assetUrl);
      if (loadedBook) {
        setCurrentBookId(bookId);

        let coverUrl: string | undefined;
        try {
          const cover = await loadedBook.coverUrl();
          if (cover) coverUrl = cover;
        } catch { /* no cover */ }

        addToHistory({
          id: bookId,
          title: metadata.title || filePath.split(/[\\/]/).pop()?.replace('.epub', '') || 'Untitled',
          author: metadata.author,
          cover: coverUrl,
          lastReadAt: Date.now(),
          progress: 0,
        });

        setCurrentView('reader');
        toast.success('书籍加载成功', {
          description: metadata.title || filePath.split(/[\\/]/).pop(),
        });
      }
    } catch (err) {
      console.error('[loadEpubFile] error:', err);
      toast.error('加载失败', {
        description: err instanceof Error ? err.message : '无法解析EPUB文件',
      });
    }
  }, [loadBook, metadata, addToHistory]);

  // Handle drag-drop from Tauri or browser
  const handleFileFromDrop = useCallback(async (filePath: string) => {
    await loadEpubFile(filePath);
  }, [loadEpubFile]);

  // Listen for Tauri drag-drop events
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<string[]>('tauri://drag-drop', async (event) => {
      const files = event.payload;
      const epubFile = files.find(f => f.toLowerCase().endsWith('.epub'));
      if (epubFile) {
        await handleFileFromDrop(epubFile);
      }
    }).then(fn => { unlisten = fn; });
    return () => { unlisten?.(); };
  }, [handleFileFromDrop]);

  // Handle selecting book from history
  const handleSelectBookFromHistory = useCallback(async (historyBook: ReadingHistory) => {
    try {
      hasRendered.current = false;
      initialCfi.current = historyBook.cfi;
      setCurrentBookId(historyBook.id);

      const storedPath = await invoke<string>('get_book_file_path', { id: historyBook.id });
      const assetUrl = convertFileSrc(storedPath);
      await loadBook(assetUrl);
      setCurrentView('reader');

      addToHistory({
        ...historyBook,
        lastReadAt: Date.now(),
      });

      toast.success('继续阅读', { description: historyBook.title });
    } catch (err) {
      toast.error('无法加载书籍', {
        description: err instanceof Error ? err.message : '书籍数据已丢失',
      });
    }
  }, [loadBook, addToHistory]);

  // Handle removing book from history
  const handleRemoveBook = useCallback((id: string) => {
    removeFromHistory(id);
    invoke('delete_book_file', { id }).catch((e) => console.error('删除书籍文件失败:', e));
    toast.success('已删除阅读记录');
  }, [removeFromHistory]);

  // Handle render
  const handleRender = useCallback(async (element: HTMLElement) => {
    if (hasRendered.current) return;

    const handleWheel = (deltaY: number) => {
      if (deltaY > 0) next(); else prev();
    };

    const rendition = renderTo(element, handleWheel, {
      width: '100%',
      height: '100%',
    });

    if (rendition) {
      hasRendered.current = true;
      applyTheme(themeColors);
      applyFontSettings(settings);

      if (initialCfi.current) {
        await display(initialCfi.current);
      } else {
        await display(0);
      }

      setTimeout(() => { generateLocations(); }, 100);
    }
  }, [renderTo, display, applyTheme, applyFontSettings, settings, themeColors, generateLocations]);

  // Apply theme changes
  useEffect(() => {
    if (isLoaded && hasRendered.current) {
      applyTheme(themeColors);
    }
  }, [settings.theme]);

  // Apply font settings changes
  useEffect(() => {
    if (isLoaded && hasRendered.current) {
      applyFontSettings(settings);
    }
  }, [settings.fontSize, settings.lineHeight, settings.fontFamily]);

  // Auto-save position
  useEffect(() => {
    if (currentBookId && currentLocation && currentLocation.start && currentLocation.start.cfi) {
      const cfi = currentLocation.start.cfi;
      const percentage = book?.locations?.percentageFromCfi(cfi) || 0;
      const progressValue = Math.round(percentage * 100);
      updateHistoryProgress(currentBookId, progressValue, cfi);
    }
  }, [currentBookId, currentLocation, book, updateHistoryProgress]);

  // Bookmark toggle
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
      toast.success('已添加书签', { description: title });
    }
  }, [currentLocation, toc, isBookmarked, addBookmark, removeBookmark]);

  const handleTocSelect = useCallback((href: string) => {
    goToTocItem(href);
  }, [goToTocItem]);

  const currentHref = currentLocation?.start.href || null;

  const currentChapterTitle = (() => {
    if (!currentHref || toc.length === 0) return '';
    const findChapter = (items: typeof toc): string | undefined => {
      for (const item of items) {
        if (item.href === currentHref || currentHref.includes(item.href)) return item.label;
        if (item.subitems) { const found = findChapter(item.subitems); if (found) return found; }
      }
      return undefined;
    };
    return findChapter(toc) || '';
  })();

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeColors.background }}>
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
          onUploadFile={handleUploadFile}
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
            onUploadFile={handleUploadFile}
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