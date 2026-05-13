import type { Annotation, Bookmark, ReadingHistory } from '@/types';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function styleLabel(style: Annotation['style']): string {
  switch (style) {
    case 'mark': return '马克笔';
    case 'wavy': return '波浪线';
    case 'line': return '直线';
    default: return '标注';
  }
}

export function buildMarkdown(
  book: Pick<ReadingHistory, 'id' | 'title' | 'author'>,
  annotations: Annotation[],
  bookmarks: Bookmark[],
): string {
  const lines: string[] = [];
  lines.push(`# ${book.title}`);
  if (book.author) lines.push(`\n> 作者：${book.author}`);
  lines.push('');
  lines.push(`> 导出时间：${formatDate(Date.now())}`);
  lines.push(`> 共 ${annotations.length} 条批注，${bookmarks.length} 条书签`);
  lines.push('');

  // 按章节分组
  const groups = new Map<string, Annotation[]>();
  for (const a of annotations) {
    const key = a.chapterTitle || '（未分类）';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }

  if (annotations.length > 0) {
    lines.push('## 高亮与批注');
    lines.push('');
    for (const [chapter, items] of groups) {
      lines.push(`### ${chapter}`);
      lines.push('');
      // 时间升序
      items.sort((a, b) => a.createdAt - b.createdAt);
      for (const a of items) {
        const badge = `【${styleLabel(a.style)}】`;
        const text = a.text.trim().replace(/\n+/g, ' ');
        lines.push(`- ${badge} ${text}`);
        lines.push(`  <sub>${formatDate(a.createdAt)}</sub>`);
        lines.push('');
      }
    }
  }

  if (bookmarks.length > 0) {
    lines.push('## 书签');
    lines.push('');
    bookmarks
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((b) => {
        lines.push(`- **${b.title}**  <sub>${formatDate(b.createdAt)}</sub>`);
      });
    lines.push('');
  }

  if (annotations.length === 0 && bookmarks.length === 0) {
    lines.push('*本书暂无高亮、批注或书签。*');
  }

  return lines.join('\n');
}
