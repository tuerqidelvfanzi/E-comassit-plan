/**
 * ThemeTransition - 主题切换动画包装组件
 * 实现: View Transitions API（渐进增强）
 * 降级: CSS transition
 */
import { useEffect, type ReactNode } from 'react';

interface Props {
  themeId: string;
  children: ReactNode;
}

export function ThemeTransition({ themeId, children }: Props) {
  useEffect(() => {
    // 检查 View Transitions API 支持
    if (typeof document === 'undefined') return;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (typeof doc.startViewTransition !== 'function') return;

    // 当 themeId 变化时触发 View Transition
    const onThemeChange = () => {
      doc.startViewTransition!(() => {
        doc.documentElement.setAttribute('data-theme', themeId);
      });
    };

    window.addEventListener('themechange', onThemeChange);
    return () => window.removeEventListener('themechange', onThemeChange);
  }, [themeId]);

  return <>{children}</>;
}

/**
 * 触发主题切换（带动画）
 */
export function switchThemeWithAnimation(themeId: string) {
  if (typeof document === 'undefined') return;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(() => {
      doc.documentElement.setAttribute('data-theme', themeId);
      window.dispatchEvent(new Event('themechange'));
    });
  } else {
    doc.documentElement.setAttribute('data-theme', themeId);
    window.dispatchEvent(new Event('themechange'));
  }
}
