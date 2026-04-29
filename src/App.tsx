import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
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

// Resize a cover image blob URL to a small JPEG and return raw bytes.
// Covers are persisted as files in AppData via Rust rather than inlined into history.json
// to keep that config file small and fast to parse.
function coverBlobToBytes(blobUrl: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 200;
      const scale = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no canvas context')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (!blob) { reject(new Error('no blob')); return; }
        const buf = await blob.arrayBuffer();
        resolve(new Uint8Array(buf));
      }, 'image/jpeg', 0.8);
    };
    img.onerror = () => reject(new Error('cover load failed'));
    img.src = blobUrl;
  });
}

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
    locationsReady,
    displayed,
    loadBook,
    unloadBook,
    renderTo,
    display,
    next,
    prev,
    goToTocItem,
    applyTheme,
    applyFontSettings,
    applyReadingDecor,
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
    setDropCap,
    addBookmark,
    removeBookmark,
    isBookmarked,
    getBookmarksFor,
    removeBookmarksByBook,
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

  const readBookData = useCallback(async (id: string): Promise<ArrayBuffer> => {
    console.log('[readBookData] reading bytes for id:', id);
    const bytes = await invoke<number[]>('read_book_bytes', { id });
    console.log('[readBookData] got bytes, length:', bytes.length);
    return new Uint8Array(bytes).buffer;
  }, []);

  // Save current reading position. Only updates progress when locations are ready,
  // otherwise we'd overwrite saved progress with 0.
  const saveCurrentPosition = useCallback(() => {
    if (!currentBookId) return;
    const location = getCurrentLocation() as { start?: { cfi: string } } | null;
    const cfi = location?.start?.cfi;
    if (!cfi) return;
    if (locationsReady && book?.locations) {
      const percentage = book.locations.percentageFromCfi(cfi);
      if (Number.isFinite(percentage)) {
        updateHistoryProgress(currentBookId, Math.round(percentage * 100), cfi);
        return;
      }
    }
    // Save the cfi without touching the stored progress value
    updateHistoryProgress(currentBookId, undefined, cfi);
  }, [currentBookId, book, locationsReady, getCurrentLocation, updateHistoryProgress]);

  const leaveReader = useCallback(() => {
    saveCurrentPosition();
    hasRendered.current = false;
    initialCfi.current = undefined;
    unloadBook();
    setCurrentBookId(null);
  }, [saveCurrentPosition, unloadBook]);

  const goToHome = useCallback(() => {
    leaveReader();
    setCurrentView('home');
    setCurrentHomeTab('home');
  }, [leaveReader]);

  const goToBookshelf = useCallback(() => {
    leaveReader();
    setCurrentView('home');
    setCurrentHomeTab('bookshelf');
  }, [leaveReader]);

  // Load an EPUB file from a file path
  const loadEpubFile = useCallback(async (filePath: string) => {
    console.log('[loadEpubFile] starting, filePath:', filePath);
    try {
      hasRendered.current = false;
      // Use a collision-resistant id so rapid imports cannot overwrite each other.
      const randomPart = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);
      const bookId = `book-${Date.now()}-${randomPart}`;

      // Save book file via Rust backend
      console.log('[loadEpubFile] saving book file...');
      await invoke('save_book_file', { id: bookId, sourcePath: filePath });

      console.log('[loadEpubFile] creating blob url...');
      const bookData = await readBookData(bookId);
      console.log('[loadEpubFile] bookData ready, loading...');

      const loadedBook = await loadBook(bookData);
      if (loadedBook) {
        setCurrentBookId(bookId);

        // Read metadata directly from epubjs book object to avoid stale React state closure
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const epubMeta = (loadedBook as any).package?.metadata;
        const title = epubMeta?.title || filePath.split(/[\\/]/).pop()?.replace('.epub', '') || 'Untitled';
        const author: string | undefined = epubMeta?.creator;

        let hasCover = false;
        try {
          const blobUrl = await loadedBook.coverUrl();
          if (blobUrl) {
            const bytes = await coverBlobToBytes(blobUrl);
            await invoke('save_cover', { id: bookId, bytes: Array.from(bytes) });
            hasCover = true;
          }
        } catch { /* no cover */ }

        addToHistory({
          id: bookId,
          title,
          author,
          hasCover,
          lastReadAt: Date.now(),
          progress: 0,
        });

        setCurrentView('reader');
        toast.success('书籍加载成功', { description: title });
      }
    } catch (err) {
      console.error('[loadEpubFile] error:', err);
      toast.error('加载失败', {
        description: err instanceof Error ? err.message : '无法解析EPUB文件',
      });
    }
  }, [loadBook, addToHistory, readBookData]);

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

      const bookData = await readBookData(historyBook.id);
      await loadBook(bookData);
      setCurrentView('reader');

      addToHistory({
        ...historyBook,
        lastReadAt: Date.now(),
      });

      toast.success('继续阅读', { description: historyBook.title });
    } catch (err) {
      // Book file is gone from disk — auto-clean the orphaned history entry.
      removeFromHistory(historyBook.id);
      removeBookmarksByBook(historyBook.id);
      invoke('delete_cover', { id: historyBook.id }).catch(() => {});
      setCurrentBookId(null);
      toast.error('书籍文件已丢失', {
        description: err instanceof Error
          ? `已从阅读记录移除：${historyBook.title}`
          : '已自动从阅读记录移除',
      });
    }
  }, [loadBook, addToHistory, readBookData, removeFromHistory, removeBookmarksByBook]);

  // Handle removing book from history
  const handleRemoveBook = useCallback((id: string) => {
    removeFromHistory(id);
    removeBookmarksByBook(id);
    invoke('delete_book_file', { id }).catch((e) => console.error('删除书籍文件失败:', e));
    invoke('delete_cover', { id }).catch(() => {});
    toast.success('已删除阅读记录');
  }, [removeFromHistory, removeBookmarksByBook]);

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
      applyReadingDecor({
        dropCap: !!settings.dropCap,
        sealSoft: themeColors.sealSoft,
        seal: themeColors.seal,
      });

      if (initialCfi.current) {
        await display(initialCfi.current);
      } else {
        await display(0);
      }

      setTimeout(() => { generateLocations(); }, 100);
    }
  }, [renderTo, display, applyTheme, applyFontSettings, applyReadingDecor, settings, themeColors, generateLocations]);

  // 同步主题背景到 html/body，避免滚动回弹时露出 shadcn 的浅色底
  useEffect(() => {
    document.documentElement.style.backgroundColor = themeColors.background;
    document.body.style.backgroundColor = themeColors.background;
  }, [themeColors.background]);

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

  // Apply reading decor changes (dropCap toggle / theme seal color)
  useEffect(() => {
    if (isLoaded && hasRendered.current) {
      applyReadingDecor({
        dropCap: !!settings.dropCap,
        sealSoft: themeColors.sealSoft,
        seal: themeColors.seal,
      });
    }
  }, [settings.dropCap, themeColors.sealSoft, themeColors.seal, isLoaded]);

  // Auto-save position on page flips. Skip progress math until locations finished
  // generating, otherwise `percentageFromCfi` returns 0 and overwrites real progress.
  useEffect(() => {
    const cfi = currentLocation?.start?.cfi;
    if (!currentBookId || !cfi) return;
    if (locationsReady && book?.locations) {
      const percentage = book.locations.percentageFromCfi(cfi);
      if (Number.isFinite(percentage)) {
        updateHistoryProgress(currentBookId, Math.round(percentage * 100), cfi);
        return;
      }
    }
    updateHistoryProgress(currentBookId, undefined, cfi);
  }, [currentBookId, currentLocation, book, locationsReady, updateHistoryProgress]);

  // Bookmark toggle — scoped to current book
  const handleToggleBookmark = useCallback(() => {
    if (!currentLocation || !currentBookId) return;
    const cfi = currentLocation.start.cfi;
    const chapter = toc.find(item =>
      item.href === currentLocation.start.href ||
      currentLocation.start.href?.includes(item.href)
    );
    const title = chapter?.label || '未命名位置';

    if (isBookmarked(currentBookId, cfi)) {
      removeBookmark(currentBookId, cfi);
      toast.success('已移除书签');
    } else {
      addBookmark(currentBookId, cfi, title);
      toast.success('已添加书签', { description: title });
    }
  }, [currentLocation, currentBookId, toc, isBookmarked, addBookmark, removeBookmark]);

  const handleTocSelect = useCallback((href: string) => {
    goToTocItem(href);
  }, [goToTocItem]);

  const handleJumpToBookmark = useCallback((cfi: string) => {
    display(cfi);
  }, [display]);

  const handleRemoveBookmark = useCallback((cfi: string) => {
    if (!currentBookId) return;
    removeBookmark(currentBookId, cfi);
    toast.success('已移除书签');
  }, [currentBookId, removeBookmark]);

  const currentBookBookmarks = currentBookId ? getBookmarksFor(currentBookId) : [];

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
    <div
      className="min-h-screen"
      style={{
        backgroundColor: themeColors.background,
        ['--accent-color' as string]: themeColors.accent,
      }}
    >
      <TopNav
        title={currentView === 'reader' ? metadata.title : '静读 · 墨韵书房'}
        chapterTitle={currentChapterTitle}
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
          onPrev={prev}
          onNext={next}
          isBookmarked={!!(currentLocation && currentBookId && isBookmarked(currentBookId, currentLocation.start.cfi))}
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
        bookmarks={currentBookBookmarks}
        onJumpToBookmark={handleJumpToBookmark}
        onRemoveBookmark={handleRemoveBookmark}
      />

      <FontSettings
        isOpen={isFontSettingsOpen}
        onClose={() => setIsFontSettingsOpen(false)}
        fontSize={settings.fontSize}
        lineHeight={settings.lineHeight}
        fontFamily={settings.fontFamily}
        contentWidth={settings.contentWidth}
        dropCap={!!settings.dropCap}
        onFontSizeChange={setFontSize}
        onLineHeightChange={setLineHeight}
        onFontFamilyChange={setFontFamily}
        onContentWidthChange={setContentWidth}
        onDropCapChange={setDropCap}
        themeColors={themeColors}
      />

      <ThemeSettings
        isOpen={isThemeSettingsOpen}
        onClose={() => setIsThemeSettingsOpen(false)}
        currentTheme={settings.theme}
        onThemeChange={setTheme}
        themeColors={themeColors}
      />

      {/* Home ↔ Reader 横向卷轴过渡 */}
      <AnimatePresence mode="wait" initial={false}>
        {currentView === 'home' ? (
          <motion.div
            key="home-view"
            initial={{ x: -80, opacity: 0, filter: 'blur(6px)' }}
            animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ x: -80, opacity: 0, filter: 'blur(6px)' }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
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
          </motion.div>
        ) : (
          <motion.div
            key="reader-view"
            initial={{ x: 80, opacity: 0, filter: 'blur(6px)' }}
            animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ x: 80, opacity: 0, filter: 'blur(6px)' }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <Reader
              book={book}
              isLoaded={isLoaded}
              displayed={displayed}
              onRender={handleRender}
              onPrev={prev}
              onNext={next}
              themeColors={themeColors}
              onUploadFile={handleUploadFile}
              chapterTitle={currentChapterTitle}
              contentWidth={settings.contentWidth}
              navDisabled={isTocOpen || isFontSettingsOpen || isThemeSettingsOpen}
            />
            {isLoaded && <ProgressBar progress={progress} themeColors={themeColors} />}
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: themeColors.glass,
            color: themeColors.text,
            border: `1px solid ${themeColors.glassBorder}`,
            backdropFilter: 'blur(24px) saturate(140%)',
            borderRadius: '16px',
            boxShadow: `0 1px 0 ${themeColors.glassBorder} inset, 0 12px 30px -12px rgba(0,0,0,0.3)`,
          },
        }}
      />
    </div>
  );
}

export default App;