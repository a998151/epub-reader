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
  dropCap?: boolean;       // 章节首字下沉（默认关）
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

export type AnnotationColor = 'yellow' | 'green' | 'blue' | 'pink' | 'underline';

/** 用户可选的标注样式 */
export type AnnotationStyle = 'mark' | 'wavy' | 'line';

export interface Annotation {
  id: string;
  bookId: string;
  cfi: string;
  text: string;
  style: AnnotationStyle;
  chapterTitle?: string;
  createdAt: number;
}

/** 选区信息（视口坐标） */
export interface SelectionInfo {
  cfiRange: string;
  text: string;
  rect: { x: number; y: number; width: number; height: number };
}

export interface ReadingSession {
  bookId: string;
  startAt: number;
  durationMs: number;
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
  seal: string;        // 朱砂印章主色（东方语境锚点）
  sealSoft: string;    // 朱砂印章半透明（用于墨晕扩散）
  ink: string;         // 墨色（鱼尾纹/版口纹/分割线装饰）
  inkSoft: string;     // 墨色半透明（极淡纸纹/底纹）
}

// 主题命名映射（UI 展示用，code 仍用 ReaderSettings['theme'] 的英文 ID）
export const THEME_NAMES: Record<ReaderSettings['theme'], string> = {
  light: '宣纸',
  sepia: '古籍',
  green: '青松',
  dark: '墨夜',
  darkGreen: '竹影',
  darkBlue: '夜空',
};
