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
          invoke<RustReaderSettings>('load_settings'),
          invoke<RustBookmark[]>('load_bookmarks'),
          invoke<RustReadingHistory[]>('load_history'),
        ]);
        setSettings({ ...DEFAULT_SETTINGS, ...mapRustSettings(savedSettings) });
        setBookmarks(savedBookmarks.map(mapRustBookmark));
        setReadingHistory(savedHistory.map(mapRustHistory));
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
    invoke('save_settings', { settings: mapSettingsToRust(updated) }).catch(console.error);
  }, []);

  const persistBookmarks = useCallback((updated: Bookmark[]) => {
    invoke('save_bookmarks', { bookmarks: updated.map(mapBookmarkToRust) }).catch(console.error);
  }, []);

  const persistHistory = useCallback((updated: ReadingHistory[]) => {
    invoke('save_history', { history: updated.map(mapHistoryToRust) }).catch(console.error);
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

  // Bookmark management
  const addBookmark = useCallback((cfi: string, title: string) => {
    setBookmarks((prev) => {
      const newBookmark: Bookmark = { cfi, title, createdAt: Date.now() };
      const updated = [...prev, newBookmark];
      persistBookmarks(updated);
      return updated;
    });
  }, [persistBookmarks]);

  const removeBookmark = useCallback((cfi: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.cfi !== cfi);
      persistBookmarks(updated);
      return updated;
    });
  }, [persistBookmarks]);

  const isBookmarked = useCallback((cfi: string) => {
    return bookmarks.some((b) => b.cfi === cfi);
  }, [bookmarks]);

  // Reading history management
  const addToHistory = useCallback((book: ReadingHistory) => {
    setReadingHistory((prev) => {
      const filtered = prev.filter((b) => b.id !== book.id);
      const updated = [book, ...filtered].slice(0, 20);
      persistHistory(updated);
      return updated;
    });
  }, [persistHistory]);

  const updateHistoryProgress = useCallback((id: string, progress: number, cfi?: string) => {
    setReadingHistory((prev) => {
      const updated = prev.map((book) =>
        book.id === id
          ? { ...book, progress, lastReadAt: Date.now(), ...(cfi && { cfi }) }
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

  // Get theme colors
  const getThemeColors = useCallback(() => {
    switch (settings.theme) {
      case 'dark':
        return { background: '#1a1a1a', text: '#e8e8e8', secondaryBg: '#2d2d2d', border: '#3d3d3d', icon: '#b0b0b0' };
      case 'sepia':
        return { background: '#f4ecd8', text: '#5b4636', secondaryBg: '#e9dfc6', border: '#d4c9b0', icon: '#8b7355' };
      case 'green':
        return { background: '#c7edcc', text: '#2b4a2f', secondaryBg: '#b8e0be', border: '#a3d2ab', icon: '#5a8a62' };
      case 'darkGreen':
        return { background: '#1e2b1e', text: '#c5d6c5', secondaryBg: '#2a3d2a', border: '#3a4f3a', icon: '#8fa88f' };
      case 'darkBlue':
        return { background: '#1a1f2e', text: '#c8cdd9', secondaryBg: '#252b3d', border: '#353d52', icon: '#8b94a8' };
      case 'light':
      default:
        return { background: '#f8f9fa', text: '#333333', secondaryBg: '#ffffff', border: '#e8e8e8', icon: '#666666' };
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
    addToHistory,
    updateHistoryProgress,
    removeFromHistory,
    getSortedHistory,
    getThemeColors,
  };
}

// Bridge types between TS and Rust (snake_case <-> camelCase)
interface RustReaderSettings {
  font_size: number;
  line_height: number;
  font_family: string;
  content_width: number;
  theme: string;
}

interface RustBookmark {
  cfi: string;
  title: string;
  created_at: number;
}

interface RustReadingHistory {
  id: string;
  title: string;
  author: string | null;
  cover: string | null;
  last_read_at: number;
  progress: number;
  cfi: string | null;
}

function mapSettingsToRust(s: ReaderSettings): RustReaderSettings {
  return { font_size: s.fontSize, line_height: s.lineHeight, font_family: s.fontFamily, content_width: s.contentWidth, theme: s.theme };
}

function mapRustSettings(s: RustReaderSettings): ReaderSettings {
  return { fontSize: s.font_size, lineHeight: s.line_height, fontFamily: s.font_family, contentWidth: s.content_width, theme: s.theme as ReaderSettings['theme'] };
}

function mapBookmarkToRust(b: Bookmark): RustBookmark {
  return { cfi: b.cfi, title: b.title, created_at: b.createdAt };
}

function mapRustBookmark(b: RustBookmark): Bookmark {
  return { cfi: b.cfi, title: b.title, createdAt: b.created_at };
}

function mapHistoryToRust(h: ReadingHistory): RustReadingHistory {
  return { id: h.id, title: h.title, author: h.author ?? null, cover: h.cover ?? null, last_read_at: h.lastReadAt, progress: h.progress, cfi: h.cfi ?? null };
}

function mapRustHistory(h: RustReadingHistory): ReadingHistory {
  return { id: h.id, title: h.title, author: h.author ?? undefined, cover: h.cover ?? undefined, lastReadAt: h.last_read_at, progress: h.progress, cfi: h.cfi ?? undefined };
}