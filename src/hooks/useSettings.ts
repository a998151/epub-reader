import { useState, useEffect, useCallback } from 'react';
import type { ReaderSettings, Bookmark, ReadingHistory } from '@/types';

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.9,
  fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
  contentWidth: 65,
  theme: 'light', // 默认浅色主题
};

function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error(`localStorage 写入失败 (${key}):`, e);
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('epub-reader-settings');
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }

    const savedBookmarks = localStorage.getItem('epub-reader-bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error('Failed to parse bookmarks:', e);
      }
    }

    const savedHistory = localStorage.getItem('epub-reader-history');
    if (savedHistory) {
      try {
        setReadingHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse reading history:', e);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      safeSetItem('epub-reader-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Update individual settings
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

  // Bookmark management
  const addBookmark = useCallback((cfi: string, title: string) => {
    setBookmarks((prev) => {
      const newBookmark: Bookmark = { cfi, title, createdAt: Date.now() };
      const updated = [...prev, newBookmark];
      safeSetItem('epub-reader-bookmarks', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeBookmark = useCallback((cfi: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.cfi !== cfi);
      safeSetItem('epub-reader-bookmarks', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isBookmarked = useCallback((cfi: string) => {
    return bookmarks.some((b) => b.cfi === cfi);
  }, [bookmarks]);

  // Reading history management
  const addToHistory = useCallback((book: ReadingHistory) => {
    setReadingHistory((prev) => {
      // Remove if already exists
      const filtered = prev.filter((b) => b.id !== book.id);
      // Add to beginning (most recent)
      const updated = [book, ...filtered];
      // Keep only last 20 books
      const limited = updated.slice(0, 20);
      safeSetItem('epub-reader-history', JSON.stringify(limited));
      return limited;
    });
  }, []);

  const updateHistoryProgress = useCallback((id: string, progress: number, cfi?: string) => {
    setReadingHistory((prev) => {
      const updated = prev.map((book) =>
        book.id === id
          ? { ...book, progress, lastReadAt: Date.now(), ...(cfi && { cfi }) }
          : book
      );
      safeSetItem('epub-reader-history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setReadingHistory((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      safeSetItem('epub-reader-history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Get sorted reading history (by lastReadAt, descending)
  const getSortedHistory = useCallback(() => {
    return [...readingHistory].sort((a, b) => b.lastReadAt - a.lastReadAt);
  }, [readingHistory]);

  // Get theme colors
  const getThemeColors = useCallback(() => {
    switch (settings.theme) {
      case 'dark':
        return {
          background: '#1a1a1a',
          text: '#e8e8e8',
          secondaryBg: '#2d2d2d',
          border: '#3d3d3d',
          icon: '#b0b0b0',
        };
      case 'sepia':
        return {
          background: '#f4ecd8',
          text: '#5b4636',
          secondaryBg: '#e9dfc6',
          border: '#d4c9b0',
          icon: '#8b7355',
        };
      case 'green':
        return {
          background: '#c7edcc',
          text: '#2b4a2f',
          secondaryBg: '#b8e0be',
          border: '#a3d2ab',
          icon: '#5a8a62',
        };
      case 'darkGreen':
        return {
          background: '#1e2b1e',
          text: '#c5d6c5',
          secondaryBg: '#2a3d2a',
          border: '#3a4f3a',
          icon: '#8fa88f',
        };
      case 'darkBlue':
        return {
          background: '#1a1f2e',
          text: '#c8cdd9',
          secondaryBg: '#252b3d',
          border: '#353d52',
          icon: '#8b94a8',
        };
      case 'light':
      default:
        return {
          background: '#f8f9fa',
          text: '#333333',
          secondaryBg: '#ffffff',
          border: '#e8e8e8',
          icon: '#666666',
        };
    }
  }, [settings.theme]);

  return {
    settings,
    bookmarks,
    readingHistory,
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
  };
}
