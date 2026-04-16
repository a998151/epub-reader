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
  cfi: string;
  title: string;
  createdAt: number;
}

export interface ReadingHistory {
  id: string;
  title: string;
  author?: string;
  cover?: string;
  lastReadAt: number;
  progress: number;
  cfi?: string; // 保存阅读位置
  fileData?: ArrayBuffer;
}
