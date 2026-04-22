import { useState, useRef, useCallback, useEffect } from 'react';
import ePub from 'epubjs';
import type { Book, Rendition, Location, Contents } from 'epubjs';
import type { TocItem, BookMetadata } from '@/types';

export function useReader() {
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const fontSettingsRef = useRef<{ fontSize: number; lineHeight: number; fontFamily: string } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [metadata, setMetadata] = useState<BookMetadata>({ title: '' });
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [progress, setProgress] = useState(0);

  // Load EPUB file
  const loadBook = useCallback(async (url: string | ArrayBuffer) => {
    try {
      setIsLoaded(false);

      // Clean up previous book
      if (renditionRef.current) {
        renditionRef.current.destroy();
      }
      if (bookRef.current) {
        bookRef.current.destroy();
      }

      // Create new book
      const book = ePub(url as string);
      bookRef.current = book;

      // Load metadata
      const meta = await book.loaded.metadata;
      setMetadata({
        title: meta.title || 'Untitled',
        author: meta.creator,
        description: meta.description,
      });

      // Load navigation (TOC)
      const navigation = await book.loaded.navigation;
      const parseToc = (items: typeof navigation.toc, prefix: string): TocItem[] =>
        items.map((item, index) => ({
          id: `${prefix}-${index}`,
          label: item.label,
          href: item.href,
          subitems: item.subitems ? parseToc(item.subitems, `${prefix}-${index}`) : undefined,
        }));
      const tocItems = parseToc(navigation.toc, 'toc');
      setToc(tocItems);

      setIsLoaded(true);
      return book;
    } catch (err) {
      console.error('Error loading book:', err);
      throw err;
    }
  }, []);

  // Render book to container
  const renderTo = useCallback((element: HTMLElement, onWheel?: (deltaY: number) => void, settings?: object) => {
    if (!bookRef.current) return null;

    // Clear container before rendering
    element.innerHTML = '';

    const rendition = bookRef.current.renderTo(element, {
      width: '100%',
      height: '100%',
      spread: 'none',
      allowScriptedContent: true,
      ...settings,
    });

    renditionRef.current = rendition;

    // Inject custom @font-face definitions into every chapter iframe
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fontFaceCss = `
      @font-face { font-family: 'FZXiJinLJW'; src: url('${origin}/fonts/FZXiJinLJW.TTF') format('truetype'); font-display: swap; }
      @font-face { font-family: 'FZYanSJW'; src: url('${origin}/fonts/FZYanSJW.TTF') format('truetype'); font-display: swap; }
      @font-face { font-family: 'LXGWWenKaiScreen'; src: url('${origin}/fonts/LXGWWenKaiScreen.ttf') format('truetype'); font-display: swap; }
      @font-face { font-family: 'ZhuqueFangsong'; src: url('${origin}/fonts/%E6%9C%B1%E9%9B%80%E4%BB%BF%E5%AE%8B.ttf') format('truetype'); font-display: swap; }
    `;
    rendition.hooks.content.register((contents: Contents) => {
      const doc = contents.document;
      if (doc) {
        const existing = doc.getElementById('epub-custom-fonts');
        if (existing) existing.remove();
        const style = doc.createElement('style');
        style.id = 'epub-custom-fonts';
        style.textContent = fontFaceCss;
        doc.head?.appendChild(style);
      }

      // Apply font-family with !important so it overrides any font declarations
      // already defined inside the EPUB's own CSS.
      if (fontSettingsRef.current) {
        const { fontFamily } = fontSettingsRef.current;
        contents.css('font-family', fontFamily, true);
      }
    });

    // Listen for location changes - this fires when page changes
    rendition.on('relocated', (location: Location) => {
      console.log('Relocated:', location);
      setCurrentLocation(location);
      if (bookRef.current && location.start.cfi) {
        const percentage = bookRef.current.locations.percentageFromCfi(location.start.cfi);
        setProgress(Math.round(percentage * 100));
      }
    });

    // Add wheel event listener to iframe content
    if (onWheel) {
      let isThrottled = false;
      const throttleDelay = 300;

      rendition.hooks.content.register((contents: Contents) => {
        const win = contents.window;
        if (!win) return;

        const handleIframeWheel = (e: WheelEvent) => {
          if (isThrottled) return;

          if (e.deltaY > 30) {
            isThrottled = true;
            onWheel(e.deltaY);
            setTimeout(() => { isThrottled = false; }, throttleDelay);
          } else if (e.deltaY < -30) {
            isThrottled = true;
            onWheel(e.deltaY);
            setTimeout(() => { isThrottled = false; }, throttleDelay);
          }
        };

        win.addEventListener('wheel', handleIframeWheel, { passive: true });
      });
    }

    return rendition;
  }, []);

  // Get current location directly from rendition
  const getCurrentLocation = useCallback(() => {
    if (renditionRef.current) {
      return renditionRef.current.currentLocation();
    }
    return null;
  }, []);

  // Display a specific location
  const display = useCallback((target: string | number) => {
    if (renditionRef.current) {
      if (typeof target === 'number') {
        return renditionRef.current.display(target);
      } else {
        return renditionRef.current.display(target);
      }
    }
  }, []);

  // Navigate to next page
  const next = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  }, []);

  // Navigate to previous page
  const prev = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  }, []);

  // Navigate to TOC item
  const goToTocItem = useCallback((href: string) => {
    if (renditionRef.current) {
      // Try to display the href directly
      renditionRef.current.display(href).catch((err: Error) => {
        console.error('Error navigating to TOC item:', err);
      });
    }
  }, []);

  // Apply theme to rendition
  const applyTheme = useCallback((theme: {
    background: string;
    text: string;
  }) => {
    if (renditionRef.current) {
      renditionRef.current.themes.register('custom', {
        body: {
          background: theme.background,
          color: theme.text,
        },
      });
      renditionRef.current.themes.select('custom');
    }
  }, []);

  // Apply font settings
  const applyFontSettings = useCallback((settings: {
    fontSize: number;
    lineHeight: number;
    fontFamily: string;
  }) => {
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${settings.fontSize}px`);
      renditionRef.current.themes.override('line-height', `${settings.lineHeight}`, true);
      // 用 themes.override 覆写 font-family，即使 getContents() 为空也能生效
      // epubjs 会把这条规则注入到当前及后续每个 chapter iframe 的主题样式中
      renditionRef.current.themes.override('font-family', settings.fontFamily, true);

      // Store settings for future contents (applied via hooks.content.register)
      fontSettingsRef.current = settings;

      // 对当前已渲染的 contents 也直接注入，确保立即生效
      const contents = renditionRef.current.getContents() as unknown as Contents[];
      contents.forEach((content: Contents) => {
        content.css('font-family', settings.fontFamily, true);
      });
    }
  }, []);

  // Generate locations for progress (with smaller chunk for faster generation)
  const generateLocations = useCallback(async () => {
    if (bookRef.current) {
      // Use 512 instead of 1024 for faster generation
      await bookRef.current.locations.generate(512);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (renditionRef.current) {
        renditionRef.current.destroy();
      }
      if (bookRef.current) {
        bookRef.current.destroy();
      }
    };
  }, []);

  return {
    book: bookRef.current,
    rendition: renditionRef.current,
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
  };
}
