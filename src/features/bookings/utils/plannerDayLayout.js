const DEFAULT_DURATION_MIN = 60;
const MIN_BLOCK_MIN = 15;
const HOUR_PAD = 1;

/** First hour row (inclusive). Matches web `START_HOUR`. */
export const PLANNER_DEFAULT_START_HOUR = 6;
/**
 * Exclusive end of timeline in hours (23 → window 6:00 … 23:00, hour labels 6 … 22 including 10 PM).
 */
export const PLANNER_DEFAULT_END_EXCLUSIVE = 23;

/**
 * Default pixels per hour row (matches web `PIXELS_PER_HOUR`).
 * @param {{ hourHeightPx?: number }} [opts]
 */
export function getPlannerDayMetrics(opts = {}) {
  const hourHeightPx = opts.hourHeightPx ?? 52;
  const startHour = PLANNER_DEFAULT_START_HOUR;
  const endExclusive = PLANNER_DEFAULT_END_EXCLUSIVE;
  const numHours = endExclusive - startHour;
  const timelineHeightPx = numHours * hourHeightPx;
  const windowStartMin = startHour * 60;
  const windowEndMin = endExclusive * 60;
  const windowSpanMin = windowEndMin - windowStartMin;
  const pxPerMinute = timelineHeightPx / windowSpanMin;
  return {
    START_HOUR: startHour,
    /** Last row label hour (e.g. 22 = 10 PM). */
    END_HOUR_INCLUSIVE: endExclusive - 1,
    PIXELS_PER_HOUR: hourHeightPx,
    numHours,
    timelineHeightPx,
    windowStartMin,
    windowEndMin,
    windowSpanMin,
    pxPerMinute,
  };
}

/**
 * @param {string | null | undefined} raw
 * @returns {number} minutes from midnight, or NaN
 */
export function timeStringToMinutesSinceMidnight(raw) {
  if (raw == null) {
    return NaN;
  }
  let t = String(raw).trim();
  t = t.replace(/\.\d+/, '').replace(/[zZ]$/, '');
  t = t.replace(/[+-]\d{2}:?\d{2}$/, '').trim();
  let part = t.length >= 8 && t.includes(':') ? t.slice(0, 8) : t;
  if (/^\d{1,2}:\d{2}$/.test(part)) {
    const [h, m] = part.split(':');
    part = `${h.padStart(2, '0')}:${m}:00`;
  }
  const m = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(part);
  if (!m) {
    return NaN;
  }
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = Number(m[3]);
  if (![hh, mm, ss].every((n) => Number.isFinite(n))) {
    return NaN;
  }
  return hh * 60 + mm + ss / 60;
}

/**
 * @param {BookingRow} row
 * @returns {number}
 */
export function plannerDurationMinutes(row) {
  const n = Number(row.duration_minutes);
  if (Number.isFinite(n) && n > 0) {
    return Math.max(MIN_BLOCK_MIN, n);
  }
  return DEFAULT_DURATION_MIN;
}

/**
 * @param {string | null | undefined} status
 */
export function isPlannerCancelledStatus(status) {
  const s = String(status ?? '').toLowerCase();
  return s === 'cancelled' || s === 'canceled';
}

/** @param {{ startMin: number; endMin: number }[]} items */
function clusterOverlapping(items) {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin);
  const clusters = [];
  while (sorted.length) {
    const cluster = [sorted.shift()];
    let spanEnd = cluster[0].endMin;
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].startMin < spanEnd) {
          const x = sorted.splice(i, 1)[0];
          cluster.push(x);
          spanEnd = Math.max(spanEnd, x.endMin);
          changed = true;
          break;
        }
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

/**
 * @param {{ startMin: number; endMin: number }[]} cluster
 */
function maxOverlapDepth(cluster) {
  const ev = [];
  for (const x of cluster) {
    ev.push([x.startMin, 1], [x.endMin, -1]);
  }
  ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let cur = 0;
  let max = 0;
  for (const [, d] of ev) {
    cur += d;
    max = Math.max(max, cur);
  }
  return Math.max(1, max);
}

/**
 * Greedy column assignment within a cluster.
 * @param {{ startMin: number; endMin: number; booking: BookingRow }[]} cluster
 * @param {number} columnCount
 */
function assignColumns(cluster, columnCount) {
  const sorted = [...cluster].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const colEnds = Array.from({ length: columnCount }, () => -Infinity);
  return sorted.map((item) => {
    let c = 0;
    while (c < columnCount && colEnds[c] > item.startMin) {
      c++;
    }
    if (c >= columnCount) {
      c = columnCount - 1;
    }
    colEnds[c] = item.endMin;
    return { ...item, column: c, columnCount };
  });
}

/**
 * @param {BookingRow[]} bookings
 * @param {{ hourHeightPx?: number }} [opts]
 * @returns {{
 *   startHour: number;
 *   endHour: number;
 *   numHours: number;
 *   timelineHeight: number;
 *   hourHeightPx: number;
 *   hourLabels: number[];
 *   windowStartMin: number;
 *   windowEndMin: number;
 *   windowSpanMin: number;
 *   pxPerMinute: number;
 *   blocks: { booking: BookingRow; top: number; height: number; leftPct: number; widthPct: number }[];
 * }}
 */
export function layoutPlannerDay(bookings, opts = {}) {
  const hourHeightPx = opts.hourHeightPx ?? 52;

  const items = (bookings ?? [])
    .map((booking) => {
      const startMin = timeStringToMinutesSinceMidnight(booking.start_time);
      const dur = plannerDurationMinutes(booking);
      const endMin = startMin + dur;
      return { booking, startMin, endMin };
    })
    .filter((x) => Number.isFinite(x.startMin) && Number.isFinite(x.endMin));

  let startHour = PLANNER_DEFAULT_START_HOUR;
  let endExclusive = PLANNER_DEFAULT_END_EXCLUSIVE;
  if (items.length) {
    const minStart = Math.min(...items.map((i) => i.startMin));
    const maxEnd = Math.max(...items.map((i) => i.endMin));
    const needStartHour = Math.floor(minStart / 60) - HOUR_PAD;
    const needEndExclusive = Math.ceil(maxEnd / 60) + HOUR_PAD;
    if (needStartHour < startHour) {
      startHour = Math.max(0, needStartHour);
    }
    if (needEndExclusive > endExclusive) {
      endExclusive = Math.min(24, needEndExclusive);
    }
    if (endExclusive <= startHour) {
      endExclusive = Math.min(24, startHour + 1);
    }
  }

  const numHours = endExclusive - startHour;
  const timelineHeight = numHours * hourHeightPx;
  const windowStartMin = startHour * 60;
  const windowEndMin = endExclusive * 60;
  const windowSpanMin = windowEndMin - windowStartMin;
  const pxPerMinute = timelineHeight / windowSpanMin;

  const hourLabels = [];
  for (let h = startHour; h < endExclusive; h++) {
    hourLabels.push(h);
  }

  const clusters = clusterOverlapping(items);
  const blocks = [];

  for (const cluster of clusters) {
    const depth = maxOverlapDepth(cluster);
    const withCols = assignColumns(cluster, depth);
    for (const item of withCols) {
      const top = (item.startMin - windowStartMin) * pxPerMinute;
      const rawH = (item.endMin - item.startMin) * pxPerMinute;
      const height = Math.max(rawH, 26);
      const gap = 1;
      const widthPct = (100 - gap * (item.columnCount - 1)) / item.columnCount;
      const leftPct = item.column * (widthPct + gap);
      blocks.push({
        booking: item.booking,
        top,
        height,
        leftPct,
        widthPct,
      });
    }
  }

  blocks.sort((a, b) => a.top - b.top || a.leftPct - b.leftPct);

  return {
    startHour,
    /** Exclusive end hour (same semantics as before: timeline ends at this clock hour). */
    endHour: endExclusive,
    numHours,
    timelineHeight,
    hourHeightPx,
    hourLabels,
    windowStartMin,
    windowEndMin,
    windowSpanMin,
    pxPerMinute,
    blocks,
  };
}
