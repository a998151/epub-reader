import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ReaderSettings, Bookmark, ReadingHistory } from '@/types';

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.9,
  fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
  contentWidth: 65,
  theme: 'light',
};

export function useSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load settings from Rust backend on mount, with localStorage fallback for migration
  useEffect(() => {
    async function loadData() {
      try {
        const [savedSettings, savedBookmarks, savedHistory] = await Promise.all([
          invoke<ReaderSettings>('load_settings'),
          invoke<Bookmark[]>('load_bookmarks'),
          invoke<Array<ReadingHistory & {
            author: string | null;
            cover: string | null;
            hasCover: boolean | null;
            cfi: string | null;
          }>>('load_history'),
        ]);
        setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
        setBookmarks(savedBookmarks);
        setReadingHistory(savedHistory.map(h => ({
          ...h,
          author: h.author ?? undefined,
          cover: h.cover ?? undefined,
          hasCover: h.hasCover ?? undefined,
          cfi: h.cfi ?? undefined,
        })));
      } catch {
        // Rust backend not available yet (dev mode without Tauri) or first launch
        // Try migrating from localStorage
        const savedSettings = localStorage.getItem('epub-reader-settings');
        if (savedSettings) {
          try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) }); } catch {}
        }
        const savedBookmarks = localStorage.getItem('epub-reader-bookmarks');
        if (savedBookmarks) {
          try { setBookmarks(JSON.parse(savedBookmarks)); } catch {}
        }
        const savedHistory = localStorage.getItem('epub-reader-history');
        if (savedHistory) {
          try { setReadingHistory(JSON.parse(savedHistory)); } catch {}
        }
      }
      setLoaded(true);
    }
    loadData();
  }, []);

  // Persist settings to Rust backend
  const persistSettings = useCallback((updated: ReaderSettings) => {
    invoke('save_settings', { settings: updated }).catch(console.error);
  }, []);

  const persistBookmarks = useCallback((updated: Bookmark[]) => {
    invoke('save_bookmarks', { bookmarks: updated }).catch(console.error);
  }, []);

  const persistHistory = useCallback((updated: ReadingHistory[]) => {
    const serializable = updated.map(h => ({
      ...h,
      author: h.author ?? null,
      cover: h.cover ?? null,
      hasCover: h.hasCover ?? null,
      cfi: h.cfi ?? null,
    }));
    invoke('save_history', { history: serializable }).catch(console.error);
  }, []);

  // Save settings
  const saveSettings = useCallback((newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      persistSettings(updated);
      return updated;
    });
  }, [persistSettings]);

  const setFontSize = useCallback((size: number) => {
    saveSettings({ fontSize: Math.max(12, Math.min(32, size)) });
  }, [saveSettings]);

  const setLineHeight = useCallback((height: number) => {
    saveSettings({ lineHeight: Math.max(1.2, Math.min(2.5, height)) });
  }, [saveSettings]);

  const setFontFamily = useCallback((family: string) => {
    saveSettings({ fontFamily: family });
  }, [saveSettings]);

  const setContentWidth = useCallback((width: number) => {
    saveSettings({ contentWidth: Math.max(50, Math.min(100, width)) });
  }, [saveSettings]);

  const setTheme = useCallback((theme: ReaderSettings['theme']) => {
    saveSettings({ theme });
  }, [saveSettings]);

  // Bookmark management — scoped by bookId to prevent cross-book pollution
  const addBookmark = useCallback((bookId: string, cfi: string, title: string) => {
    setBookmarks((prev) => {
      const newBookmark: Bookmark = { bookId, cfi, title, createdAt: Date.now() };
      const updated = [...prev, newBookmark];
      persistBookmarks(updated);
      return updated;
    });
  }, [persistBookmarks]);

  const removeBookmark = useCallback((bookId: string, cfi: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => !(b.bookId === bookId && b.cfi === cfi));
      persistBookmarks(updated);
      return updated;
    });
  }, [persistBookmarks]);

  const isBookmarked = useCallback((bookId: string, cfi: string) => {
    return bookmarks.some((b) => b.bookId === bookId && b.cfi === cfi);
  }, [bookmarks]);

  const getBookmarksFor = useCallback((bookId: string) => {
    return bookmarks
      .filter((b) => b.bookId === bookId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [bookmarks]);

  const removeBookmarksByBook = useCallback((bookId: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.bookId !== bookId);
      persistBookmarks(updated);
      return updated;
    });
  }, [persistBookmarks]);

  // Reading history management
  const addToHistory = useCallback((book: ReadingHistory) => {
    setReadingHistory((prev) => {
      const filtered = prev.filter((b) => b.id !== book.id);
      const updated = [book, ...filtered].slice(0, 20);
      persistHistory(updated);
      return updated;
    });
  }, [persistHistory]);

  // progress may be undefined — in that case only cfi/lastReadAt are updated.
  const updateHistoryProgress = useCallback((id: string, progress: number | undefined, cfi?: string) => {
    setReadingHistory((prev) => {
      const updated = prev.map((book) =>
        book.id === id
          ? {
              ...book,
              ...(progress !== undefined && { progress }),
              lastReadAt: Date.now(),
              ...(cfi && { cfi }),
            }
          : book
      );
      persistHistory(updated);
      return updated;
    });
  }, [persistHistory]);

  const removeFromHistory = useCallback((id: string) => {
    setReadingHistory((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      persistHistory(updated);
      return updated;
    });
  }, [persistHistory]);

  const getSortedHistory = useCallback(() => {
    return [...readingHistory].sort((a, b) => b.lastReadAt - a.lastReadAt);
  }, [readingHistory]);

  // Get theme colors — 暖中性基底 + 柔和点缀色 + 玻璃表面
  const getThemeColors = useCallback(() => {
    switch (settings.theme) {
      case 'dark':
        return {
          background: '#1a1814',
          text: '#e8e3d8',
          secondaryBg: '#26221e',
          border: 'rgba(232, 227, 216, 0.09)',
          icon: '#a89f8f',
          glass: 'rgba(38, 34, 30, 0.55)',
          glassBorder: 'rgba(255, 255, 255, 0.06)',
          accent: '#d9a67e',
          accentSoft: 'rgba(217, 166, 126, 0.14)',
          blob1: 'rgba(217, 166, 126, 0.12)',
          blob2: 'rgba(152, 116, 95, 0.10)',
        };
      case 'sepia':
        return {
          background: '#f4ecd8',
          text: '#5b4636',
          secondaryBg: '#ede3ca',
          border: 'rgba(91, 70, 54, 0.14)',
          icon: '#7a5c41', // 加深以满足 body text 4.5:1
          glass: 'rgba(253, 248, 232, 0.55)',
          glassBorder: 'rgba(255, 255, 255, 0.5)',
          accent: '#8c5a3f', // 加深以保证强调色对比度 4.5:1 以上
          accentSoft: 'rgba(140, 90, 63, 0.14)',
          blob1: 'rgba(140, 90, 63, 0.10)',
          blob2: 'rgba(196, 164, 115, 0.14)',
        };
      case 'green':
        return {
          background: '#e8eedc',
          text: '#2f4a32',
          secondaryBg: '#dde5cd',
          border: 'rgba(47, 74, 50, 0.12)',
          icon: '#60825f',
          glass: 'rgba(240, 246, 224, 0.55)',
          glassBorder: 'rgba(255, 255, 255, 0.4)',
          accent: '#7a9e6e',
          accentSoft: 'rgba(122, 158, 110, 0.16)',
          blob1: 'rgba(122, 158, 110, 0.12)',
          blob2: 'rgba(180, 200, 145, 0.14)',
        };
      case 'darkGreen':
        return {
          background: '#1c241c',
          text: '#d4dcd0',
          secondaryBg: '#2a342a',
          border: 'rgba(212, 220, 208, 0.09)',
          icon: '#97a897',
          glass: 'rgba(42, 52, 42, 0.55)',
          glassBorder: 'rgba(255, 255, 255, 0.06)',
          accent: '#a8c293',
          accentSoft: 'rgba(168, 194, 147, 0.14)',
          blob1: 'rgba(168, 194, 147, 0.12)',
          blob2: 'rgba(120, 150, 108, 0.10)',
        };
      case 'darkBlue':
        return {
          background: '#1a1f2a',
          text: '#d0d4de',
          secondaryBg: '#262c3a',
          border: 'rgba(208, 212, 222, 0.09)',
          icon: '#929ab0',
          glass: 'rgba(38, 44, 58, 0.55)',
          glassBorder: 'rgba(255, 255, 255, 0.06)',
          accent: '#b5a0d0',
          accentSoft: 'rgba(181, 160, 208, 0.14)',
          blob1: 'rgba(181, 160, 208, 0.12)',
          blob2: 'rgba(110, 138, 188, 0.10)',
        };
      case 'light':
      default:
        return {
          background: '#f5f1ea',
          text: '#2d2a26',
          secondaryBg: '#fbf7f0',
          border: 'rgba(45, 42, 38, 0.08)',
          icon: '#6b6359',
          glass: 'rgba(255, 253, 248, 0.55)',
          glassBorder: 'rgba(255, 255, 255, 0.7)',
          accent: '#c97b63',
          accentSoft: 'rgba(201, 123, 99, 0.12)',
          blob1: 'rgba(201, 123, 99, 0.14)',
          blob2: 'rgba(230, 197, 157, 0.18)',
        };
    }
  }, [settings.theme]);

  return {
    settings,
    bookmarks,
    readingHistory,
    loaded,
    setFontSize,
    setLineHeight,
    setFontFamily,
    setContentWidth,
    setTheme,
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
  };
}

