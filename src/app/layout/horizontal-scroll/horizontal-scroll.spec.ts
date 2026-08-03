import {
  clampOffset,
  findNestedVerticalScroller,
  isHorizontalTrack,
  resolveWheelDelta,
} from './horizontal-scroll';

describe('isHorizontalTrack', () => {
  it('accepts the overflow values that make a scroll rail', () => {
    expect(isHorizontalTrack('auto')).toBe(true);
    expect(isHorizontalTrack('scroll')).toBe(true);
  });

  it('rejects a box that merely has content sticking out of it', () => {
    expect(isHorizontalTrack('visible')).toBe(false);
    expect(isHorizontalTrack('clip')).toBe(false);
    expect(isHorizontalTrack('hidden')).toBe(false);
  });
});

describe('clampOffset', () => {
  it('keeps offsets inside the scrollable range', () => {
    expect(clampOffset(250, 2000, 1000)).toBe(250);
  });

  it('clamps past the end to the last reachable offset', () => {
    expect(clampOffset(5000, 2000, 1000)).toBe(1000);
  });

  it('clamps negatives to zero', () => {
    expect(clampOffset(-300, 2000, 1000)).toBe(0);
  });

  it('returns zero when there is nothing to scroll', () => {
    expect(clampOffset(120, 1000, 1000)).toBe(0);
  });
});

describe('resolveWheelDelta', () => {
  const base = { deltaX: 0, deltaY: 0, deltaMode: 0, pageSize: 1000 };

  it('passes vertical wheel through as horizontal pixels', () => {
    expect(resolveWheelDelta({ ...base, deltaY: 120 })).toBe(120);
    expect(resolveWheelDelta({ ...base, deltaY: -120 })).toBe(-120);
  });

  it('scales line-mode deltas into pixels', () => {
    expect(resolveWheelDelta({ ...base, deltaY: 3, deltaMode: 1 })).toBe(48);
  });

  it('scales page-mode deltas by the viewport', () => {
    expect(resolveWheelDelta({ ...base, deltaY: 1, deltaMode: 2 })).toBe(1000);
  });

  it('declines horizontal gestures so native scrolling handles them once', () => {
    expect(resolveWheelDelta({ ...base, deltaX: 90, deltaY: 10 })).toBeNull();
  });

  it('declines no-op events', () => {
    expect(resolveWheelDelta({ ...base, deltaY: 0 })).toBeNull();
  });

  it('treats an equal diagonal as vertical intent', () => {
    expect(resolveWheelDelta({ ...base, deltaX: 50, deltaY: 50 })).toBe(50);
  });
});

describe('findNestedVerticalScroller', () => {
  let boundary: HTMLElement;
  let inner: HTMLElement;
  let leaf: HTMLElement;

  function setMetrics(
    el: HTMLElement,
    metrics: { scrollHeight: number; clientHeight: number; scrollTop: number },
  ) {
    Object.defineProperties(el, {
      scrollHeight: { value: metrics.scrollHeight, configurable: true },
      clientHeight: { value: metrics.clientHeight, configurable: true },
      scrollTop: { value: metrics.scrollTop, configurable: true, writable: true },
    });
  }

  beforeEach(() => {
    boundary = document.createElement('div');
    inner = document.createElement('div');
    leaf = document.createElement('span');
    inner.appendChild(leaf);
    boundary.appendChild(inner);
    document.body.appendChild(boundary);
  });

  afterEach(() => boundary.remove());

  it('finds a scrollable ancestor with room to move down', () => {
    inner.style.overflowY = 'auto';
    setMetrics(inner, { scrollHeight: 500, clientHeight: 200, scrollTop: 0 });

    expect(findNestedVerticalScroller(leaf, boundary, 120)).toBe(inner);
  });

  it('ignores an ancestor already at the bottom when scrolling down', () => {
    inner.style.overflowY = 'auto';
    setMetrics(inner, { scrollHeight: 500, clientHeight: 200, scrollTop: 300 });

    expect(findNestedVerticalScroller(leaf, boundary, 120)).toBeNull();
  });

  it('still yields to that ancestor when scrolling back up', () => {
    inner.style.overflowY = 'auto';
    setMetrics(inner, { scrollHeight: 500, clientHeight: 200, scrollTop: 300 });

    expect(findNestedVerticalScroller(leaf, boundary, -120)).toBe(inner);
  });

  it('ignores ancestors that do not overflow', () => {
    inner.style.overflowY = 'auto';
    setMetrics(inner, { scrollHeight: 200, clientHeight: 200, scrollTop: 0 });

    expect(findNestedVerticalScroller(leaf, boundary, 120)).toBeNull();
  });

  it('ignores overflowing ancestors that are not scrollable', () => {
    inner.style.overflowY = 'hidden';
    setMetrics(inner, { scrollHeight: 500, clientHeight: 200, scrollTop: 0 });

    expect(findNestedVerticalScroller(leaf, boundary, 120)).toBeNull();
  });

  it('does not look past the boundary element', () => {
    boundary.style.overflowY = 'auto';
    setMetrics(boundary, { scrollHeight: 900, clientHeight: 200, scrollTop: 0 });

    expect(findNestedVerticalScroller(leaf, boundary, 120)).toBeNull();
  });
});
