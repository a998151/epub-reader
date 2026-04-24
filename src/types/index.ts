export interface TocItem {
  id: string;
  label: string;
  href: string;
  subitems?: TocItem[];
}

export interface BookMetadata {
  title: string;
  author?: string;
  description?: string;
  cover?: string;
}

export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  contentWidth: number;
  theme: 'dark' | 'light' | 'sepia' | 'green' | 'darkGreen' | 'darkBlue';
}

export interface Bookmark {
  bookId: string;
  cfi: string;
  title: string;
  createdAt: number;
}

export interface ReadingHistory {
  id: string;
  title: string;
  author?: string;
  // Legacy: data URL inlined in history.json. Still read for backward compatibility,
  // but new books store their cover to disk and set `hasCover` instead.
  cover?: string;
  hasCover?: boolean;
  lastReadAt: number;
  progress: number;
  cfi?: string;
}

export interface ThemeColors {
  background: string;
  text: string;
  secondaryBg: string;
  border: string;
  icon: string;
  glass: string;       // 玻璃面板半透明背景
  glassBorder: string; // 玻璃面板内高光边
  accent: string;      // 点缀色（替代硬编码 #4a9eff）
  accentSoft: string;  // 点缀色的柔和辉光/悬停底
  blob1: string;       // 有机 blob 装饰色 1
  blob2: string;       // 有机 blob 装饰色 2
}
