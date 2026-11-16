import { describe, expect, it } from 'vitest';
import { galleryIndexFromScroll, wrapGalleryIndex } from '@/lib/gallery';

describe('wrapGalleryIndex', () => {
  it('wraps previous from the first photo to the last', () => {
    expect(wrapGalleryIndex(-1, 4)).toBe(3);
  });

  it('wraps next from the last photo to the first', () => {
    expect(wrapGalleryIndex(4, 4)).toBe(0);
  });

  it('keeps an in-range index', () => {
    expect(wrapGalleryIndex(2, 4)).toBe(2);
  });

  it('returns 0 when the strip is empty', () => {
    expect(wrapGalleryIndex(1, 0)).toBe(0);
  });
});

describe('galleryIndexFromScroll', () => {
  it('rounds to the nearest slide', () => {
    expect(galleryIndexFromScroll(0, 400, 4)).toBe(0);
    expect(galleryIndexFromScroll(400, 400, 4)).toBe(1);
    expect(galleryIndexFromScroll(250, 400, 4)).toBe(1);
  });

  it('does not report a slide past the last photo', () => {
    expect(galleryIndexFromScroll(1600, 400, 4)).toBe(3);
    expect(galleryIndexFromScroll(1599, 400, 4)).toBe(3);
  });

  it('does not go negative if scrollLeft undershoots', () => {
    expect(galleryIndexFromScroll(-1, 400, 4)).toBe(0);
  });

  it('returns 0 when the track has no width yet', () => {
    expect(galleryIndexFromScroll(0, 0, 4)).toBe(0);
  });
});
