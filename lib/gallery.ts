/** Wrap prev/next around the photo strip without going negative in JS remainder. */
export function wrapGalleryIndex(next: number, length: number) {
  if (length <= 0) return 0;
  return ((next % length) + length) % length;
}

/**
 * Map a gallery track's scroll position to a photo index. Rounding at the
 * last slide can land on `length`, which would show "5 / 4" in the caption.
 */
export function galleryIndexFromScroll(
  scrollLeft: number,
  clientWidth: number,
  length: number,
) {
  if (clientWidth <= 0 || length <= 0) return 0;
  const raw = Math.round(scrollLeft / clientWidth);
  return Math.min(length - 1, Math.max(0, raw));
}
