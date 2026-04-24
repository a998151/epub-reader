import { useState, useRef, useCallback, useEffect } from 'react';
// epubjs is loaded on demand to keep it out of the Home/landing bundle
// (it's ~500 KB gzipped and not needed until the user opens a book).
import type { Book, Rendition, Location, Contents } from 'epubjs';
import type { TocItem, BookMetadata } from '@/types';

// Safely destroy an epubjs object even if it has already been torn down
// (guards against React StrictMode double-mount invocations).
function safeDestroy(target: { destroy?: () => void } | null | undefined) {
  if (!target) return;
  try { target.destroy?.(); } catch { /* already destroyed */ }
}

export function useReader() {
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const fontSettingsRef = useRef<{ fontSize: number; lineHeight: number; fontFamily: string } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [metadata, setMetadata] = useState<BookMetadata>({ title: '' });
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [progress, setProgress] = useState(0);
  const [locationsReady, setLocationsReady] = useState(false);
  const [displayed, setDisplayed] = useState(false);

  // Load EPUB from a URL string or ArrayBuffer (ArrayBuffer avoids fetch in WebView2)
  const loadBook = useCallback(async (input: string | ArrayBuffer) => {
    setIsLoaded(false);
    setLocationsReady(false);
    setDisplayed(false);
    setProgress(0);

    // Clean up previous book
    safeDestroy(renditionRef.current);
    renditionRef.current = null;
    safeDestroy(bookRef.current);
    bookRef.current = null;

    try {
      // Dynamic import keeps epubjs out of the initial bundle.
      const { default: ePub } = await import('epubjs');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const book = ePub(input as any);
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
    // Use relative paths so fonts load correctly in both Tauri WebView and browser
    const fontBaseUrl = './fonts';
    const fontFaceCss = `
      @font-face { font-family: 'FZXiJinLJW'; src: url('${fontBaseUrl}/FZXiJinLJW.TTF') format('truetype'); font-display: swap; }
      @font-face { font-family: 'FZYanSJW'; src: url('${fontBaseUrl}/FZYanSJW.TTF') format('truetype'); font-display: swap; }
      @font-face { font-family: 'LXGWWenKaiScreen'; src: url('${fontBaseUrl}/LXGWWenKaiScreen.ttf') format('truetype'); font-display: swap; }
      @font-face { font-family: 'ZhuqueFangsong'; src: url('${fontBaseUrl}/%E6%9C%B1%E9%9B%80%E4%BB%BF%E5%AE%8B.ttf') format('truetype'); font-display: swap; }
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

      // Apply font-family via CSS rule that covers all child elements,
      // not just <body>, because EPUB CSS often sets font-family on <p>/<span> etc.
      if (fontSettingsRef.current) {
        const { fontFamily } = fontSettingsRef.current;
        const existingFontStyle = doc.getElementById('epub-font-override');
        if (existingFontStyle) existingFontStyle.remove();
        const fontStyle = doc.createElement('style');
        fontStyle.id = 'epub-font-override';
        fontStyle.textContent = `body, body * { font-family: ${fontFamily}; }`;
        doc.head?.appendChild(fontStyle);
      }
    });

    // Listen for location changes - this fires when page changes
    rendition.on('relocated', (location: Location) => {
      setCurrentLocation(location);
      const bk = bookRef.current;
      // Only compute progress after locations finished generating — prevents overwriting
      // saved progress with 0 during the brief window before `generateLocations` resolves.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const locationsLen = (bk?.locations as any)?.length?.() ?? 0;
      if (bk && location.start.cfi && locationsLen > 0) {
        const percentage = bk.locations.percentageFromCfi(location.start.cfi);
        if (Number.isFinite(percentage)) setProgress(Math.round(percentage * 100));
      }
    });

    // Display / render lifecycle — drive the loading overlay reliably
    rendition.on('displayed', () => setDisplayed(true));
    rendition.on('rendered', () => setDisplayed(true));

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
      // Store settings for future contents (applied via hooks.content.register)
      fontSettingsRef.current = settings;

      // Inject a CSS rule covering all child elements, not just <body>,
      // because EPUB CSS often sets font-family on <p>/<span> etc.
      const contents = renditionRef.current.getContents() as unknown as Contents[];
      contents.forEach((content: Contents) => {
        const doc = content.document;
        if (doc) {
          const existing = doc.getElementById('epub-font-override');
          if (existing) existing.remove();
          const style = doc.createElement('style');
          style.id = 'epub-font-override';
          style.textContent = `body, body * { font-family: ${settings.fontFamily}; }`;
          doc.head?.appendChild(style);
        }
      });
    }
  }, []);

  // Generate locations for progress (with smaller chunk for faster generation)
  const generateLocations = useCallback(async () => {
    if (bookRef.current) {
      try {
        await bookRef.current.locations.generate(512);
        setLocationsReady(true);
        // Back-fill progress for the current location once locations are ready
        if (renditionRef.current) {
          const loc = renditionRef.current.currentLocation() as unknown as Location | null;
          if (loc?.start?.cfi) {
            const pct = bookRef.current.locations.percentageFromCfi(loc.start.cfi);
            if (Number.isFinite(pct)) setProgress(Math.round(pct * 100));
          }
        }
      } catch (err) {
        console.error('generateLocations failed:', err);
      }
    }
  }, []);

  // Explicitly release the current book (e.g. on returning to Home)
  const unloadBook = useCallback(() => {
    safeDestroy(renditionRef.current);
    renditionRef.current = null;
    safeDestroy(bookRef.current);
    bookRef.current = null;
    fontSettingsRef.current = null;
    setIsLoaded(false);
    setLocationsReady(false);
    setDisplayed(false);
    setToc([]);
    setMetadata({ title: '' });
    setCurrentLocation(null);
    setProgress(0);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      safeDestroy(renditionRef.current);
      renditionRef.current = null;
      safeDestroy(bookRef.current);
      bookRef.current = null;
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
    generateLocations,
    getCurrentLocation,
  };
}
