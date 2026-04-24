import { useEffect, useRef } from 'react';

/**
 * 浮层通用行为：
 * - ESC 关闭
 * - 打开前记录焦点来源，关闭后把焦点还回去
 *
 * 使用方式：
 *   useOverlay(isOpen, onClose);
 */
export function useOverlay(isOpen: boolean, onClose: () => void) {
  const openerRef = useRef<HTMLElement | null>(null);

  // 记录 opener（打开瞬间的 activeElement）
  useEffect(() => {
    if (isOpen) {
      openerRef.current = (document.activeElement as HTMLElement) ?? null;
    }
  }, [isOpen]);

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // 关闭时把焦点还回给 opener
  useEffect(() => {
    if (isOpen) return;
    const opener = openerRef.current;
    if (opener && typeof opener.focus === 'function' && document.body.contains(opener)) {
      // 微延迟，等浮层 DOM 真的被卸载后再回焦点，避免 aria-hidden 冲突
      const t = window.setTimeout(() => opener.focus({ preventScroll: true }), 40);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);
}
