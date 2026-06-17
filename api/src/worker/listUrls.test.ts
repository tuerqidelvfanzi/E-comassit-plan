import { describe, expect, it } from 'vitest';

function parseListUrls(html: string) {
  const re = /https?:\/\/(item\.taobao\.com|detail\.tmall\.com|detail\.1688\.com)[^"'\s]*/gi;
  const found = new Set<string>();
  let m;
  while ((m = re.exec(html)) !== null) {
    found.add(m[0].split('?')[0].split('#')[0]);
  }
  return [...found];
}

describe('list URL parser', () => {
  it('extracts taobao and tmall item links', () => {
    const html = `
      <a href="https://item.taobao.com/item.htm?id=123">a</a>
      <a href="https://detail.tmall.com/item.htm?id=456">b</a>
    `;
    const urls = parseListUrls(html);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain('item.taobao.com');
  });
});
