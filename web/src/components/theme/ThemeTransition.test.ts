/**
 * ThemeTransition 单元测试
 */
import { describe, it, expect, vi } from 'vitest';
import { switchThemeWithAnimation } from './ThemeTransition';

describe('switchThemeWithAnimation', () => {
  it('无 startViewTransition 时直接切换', () => {
    // 模拟没有 View Transitions API
    const original = (document as any).startViewTransition;
    delete (document as any).startViewTransition;

    const dispatchSpy = vi.fn();
    window.dispatchEvent = dispatchSpy;

    switchThemeWithAnimation('test-theme');

    expect(document.documentElement.getAttribute('data-theme')).toBe('test-theme');
    expect(dispatchSpy).toHaveBeenCalled();

    // 恢复
    if (original) (document as any).startViewTransition = original;
  });

  it('有 startViewTransition 时调用 API', () => {
    const original = (document as any).startViewTransition;
    let calledWith: any = null;
    (document as any).startViewTransition = (cb: () => void) => {
      calledWith = cb;
      cb();
      return { finished: Promise.resolve() };
    };

    switchThemeWithAnimation('animated-theme');

    expect(calledWith).toBeDefined();
    expect(document.documentElement.getAttribute('data-theme')).toBe('animated-theme');

    if (original) (document as any).startViewTransition = original;
  });
});
