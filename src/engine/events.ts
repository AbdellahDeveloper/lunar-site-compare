import { HorizonMask, TimeInterval, Vector3D } from '../types';
import { LocalFrame } from './local';
import { bodyVectors } from './moon';
import { evaluateVisibilityAtInstant } from './visibility';

export type TargetBody = 'sun' | 'earth';

interface EventCrossing {
  timeMs: number;
  type: 'rise' | 'set';
}

/**
 * Evaluates the clearance margin (elevation + radius - horizon) for a given body.
 * Positive = visible, Negative = occulted/below horizon.
 */
function evaluateMargin(
  timeMs: number,
  body: TargetBody,
  frame: LocalFrame,
  mask: HorizonMask | null | undefined,
  elevKm: number
): number {
  const { sun, earth } = bodyVectors(timeMs);
  const evalResult = evaluateVisibilityAtInstant(sun, earth, frame, mask, elevKm);
  const target = body === 'sun' ? evalResult.sun : evalResult.earth;
  return target.elevationAboveHorizon + (body === 'sun' ? (0.267) : 0);
}

/**
 * Performs 12-iteration bisection refinement to locate the exact crossing
 * time within ~0.4s between t0 and t1.
 */
function refineCrossingBisection(
  t0: number,
  t1: number,
  body: TargetBody,
  frame: LocalFrame,
  mask: HorizonMask | null | undefined,
  elevKm: number,
  iterations: number = 12
): number {
  let low = t0;
  let high = t1;
  const margin0 = evaluateMargin(low, body, frame, mask, elevKm);

  for (let i = 0; i < iterations; i++) {
    const mid = (low + high) / 2;
    const marginMid = evaluateMargin(mid, body, frame, mask, elevKm);

    if ((margin0 >= 0 && marginMid >= 0) || (margin0 < 0 && marginMid < 0)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Finds all rise and set events for a body within [windowStartMs, windowEndMs]
 * by sampling every stepMs and bisecting crossing points.
 */
export function findBodyIntervals(
  windowStartMs: number,
  windowEndMs: number,
  body: TargetBody,
  frame: LocalFrame,
  mask: HorizonMask | null | undefined,
  elevKm: number,
  stepMs: number = 30 * 60 * 1000 // 30 minutes
): { intervals: TimeInterval[]; events: EventCrossing[] } {
  const events: EventCrossing[] = [];

  let prevTime = windowStartMs;
  let prevMargin = evaluateMargin(prevTime, body, frame, mask, elevKm);
  const startVisible = prevMargin >= 0;

  for (let t = windowStartMs + stepMs; t <= windowEndMs; t += stepMs) {
    const margin = evaluateMargin(t, body, frame, mask, elevKm);
    const flipped = (prevMargin >= 0 && margin < 0) || (prevMargin < 0 && margin >= 0);

    if (flipped) {
      const exactTimeMs = refineCrossingBisection(prevTime, t, body, frame, mask, elevKm);
      const isRise = prevMargin < 0 && margin >= 0;
      events.push({
        timeMs: exactTimeMs,
        type: isRise ? 'rise' : 'set',
      });
    }

    prevTime = t;
    prevMargin = margin;
  }

  // Check end boundary if loop didn't land exactly on windowEndMs
  if (prevTime < windowEndMs) {
    const marginEnd = evaluateMargin(windowEndMs, body, frame, mask, elevKm);
    if ((prevMargin >= 0 && marginEnd < 0) || (prevMargin < 0 && marginEnd >= 0)) {
      const exactTimeMs = refineCrossingBisection(prevTime, windowEndMs, body, frame, mask, elevKm);
      events.push({
        timeMs: exactTimeMs,
        type: prevMargin < 0 ? 'rise' : 'set',
      });
    }
  }

  // Build continuous visible intervals from events
  const intervals: TimeInterval[] = [];
  let isCurrentlyVisible = startVisible;
  let intervalStartMs = windowStartMs;
  let isStartOpen = true;

  for (const ev of events) {
    if (ev.type === 'set' && isCurrentlyVisible) {
      intervals.push({
        startMs: intervalStartMs,
        endMs: ev.timeMs,
        durationHours: (ev.timeMs - intervalStartMs) / (3600 * 1000),
        openStart: isStartOpen,
        openEnd: false,
      });
      isCurrentlyVisible = false;
      isStartOpen = false;
    } else if (ev.type === 'rise' && !isCurrentlyVisible) {
      intervalStartMs = ev.timeMs;
      isCurrentlyVisible = true;
      isStartOpen = false;
    }
  }

  // If visible at window end, close trailing interval
  if (isCurrentlyVisible) {
    intervals.push({
      startMs: intervalStartMs,
      endMs: windowEndMs,
      durationHours: (windowEndMs - intervalStartMs) / (3600 * 1000),
      openStart: isStartOpen,
      openEnd: true,
    });
  }

  return { intervals, events };
}

/**
 * Computes intersection intervals where both interval set A and set B are active.
 * Used for "Both-Up" (simultaneous solar power and direct Earth communication).
 */
export function intersectIntervals(
  intervalsA: TimeInterval[],
  intervalsB: TimeInterval[]
): TimeInterval[] {
  const result: TimeInterval[] = [];

  for (const a of intervalsA) {
    for (const b of intervalsB) {
      const start = Math.max(a.startMs, b.startMs);
      const end = Math.min(a.endMs, b.endMs);

      if (start < end) {
        result.push({
          startMs: start,
          endMs: end,
          durationHours: (end - start) / (3600 * 1000),
          openStart: a.openStart && b.openStart && start === Math.min(a.startMs, b.startMs),
          openEnd: a.openEnd && b.openEnd && end === Math.max(a.endMs, b.endMs),
        });
      }
    }
  }

  return result;
}

/**
 * Computes complement intervals (outages / dark periods) within [windowStart, windowEnd].
 */
export function complementIntervals(
  upIntervals: TimeInterval[],
  windowStartMs: number,
  windowEndMs: number
): TimeInterval[] {
  const outages: TimeInterval[] = [];
  if (upIntervals.length === 0) {
    outages.push({
      startMs: windowStartMs,
      endMs: windowEndMs,
      durationHours: (windowEndMs - windowStartMs) / (3600 * 1000),
      openStart: true,
      openEnd: true,
    });
    return outages;
  }

  let curr = windowStartMs;
  for (let i = 0; i < upIntervals.length; i++) {
    const inv = upIntervals[i];
    if (inv.startMs > curr) {
      outages.push({
        startMs: curr,
        endMs: inv.startMs,
        durationHours: (inv.startMs - curr) / (3600 * 1000),
        openStart: curr === windowStartMs,
        openEnd: false,
      });
    }
    curr = Math.max(curr, inv.endMs);
  }

  if (curr < windowEndMs) {
    outages.push({
      startMs: curr,
      endMs: windowEndMs,
      durationHours: (windowEndMs - curr) / (3600 * 1000),
      openStart: false,
      openEnd: true,
    });
  }

  return outages;
}

