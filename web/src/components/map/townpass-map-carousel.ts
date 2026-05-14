export function getCarouselSlideStride(container: HTMLDivElement) {
  const first = container.firstElementChild as HTMLElement | null;
  if (!first) {
    return Math.max(1, container.clientWidth);
  }
  const styles = window.getComputedStyle(container);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
  return first.offsetWidth + gap;
}

export function getCarouselIndexFromScroll(container: HTMLDivElement, slideCount: number) {
  const maxIdx = Math.max(0, slideCount - 1);
  const stride = getCarouselSlideStride(container);
  if (stride <= 0) {
    return 0;
  }
  const index = Math.round(container.scrollLeft / stride);
  return Math.min(maxIdx, Math.max(0, index));
}
