import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * 返回一本书可用的封面 URL：
 * - 若 history 记录里带有 legacy inline data URL，直接使用
 * - 否则若 hasCover === true，异步从 Rust 读取 jpg 字节并转成 blob URL
 * - 读取失败返回 undefined（UI 回退到占位字符）
 *
 * 返回 blob URL 会随组件卸载自动 revoke。
 */
export function useBookCover(
  bookId: string,
  inlineCover: string | undefined,
  hasCover: boolean | undefined,
): string | undefined {
  const [url, setUrl] = useState<string | undefined>(inlineCover);

  useEffect(() => {
    if (inlineCover) {
      setUrl(inlineCover);
      return;
    }
    if (!hasCover) {
      setUrl(undefined);
      return;
    }

    let cancelled = false;
    let blobUrl: string | undefined;

    invoke<number[] | null>('read_cover', { id: bookId })
      .then((bytes) => {
        if (cancelled || !bytes || bytes.length === 0) return;
        const blob = new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' });
        blobUrl = URL.createObjectURL(blob);
        setUrl(blobUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(undefined);
      });

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [bookId, inlineCover, hasCover]);

  return url;
}
