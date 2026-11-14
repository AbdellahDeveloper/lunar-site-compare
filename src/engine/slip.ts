import { HorizonMask, ScenarioConfig, SlipCase } from '../types';
import { evaluateScenario } from './series';

export const SLIP_OFFSETS = [
  { days: -29.53, label: '-1 Lunar Month (-29.5d)' },
  { days: -7.0, label: '-1 Week Slip (-7.0d)' },
  { days: 0, label: 'Nominal Schedule (0d)' },
  { days: +7.0, label: '+1 Week Slip (+7.0d)' },
  { days: +29.53, label: '+1 Lunar Month (+29.5d)' },
];

/**
 * Computes schedule slip delta analysis for a scenario at offsets:
 * -29.5d, -7d, nominal (0d), +7d, +29.5d.
 */
export function computeSlipAnalysis(
  scenario: ScenarioConfig,
  siteLat: number,
  siteLon: number,
  siteElevKm: number,
  mask: HorizonMask | null,
  windowStartMs: number,
  windowEndMs: number
): SlipCase[] {
  const windowDurationMs = windowEndMs - windowStartMs;

  // First compute nominal
  const nominalResult = evaluateScenario(
    scenario,
    siteLat,
    siteLon,
    siteElevKm,
    mask,
    windowStartMs,
    windowEndMs,
    windowStartMs,
    60 * 60 * 1000 // 1 hour step is very fast for slip sweeps
  );

  const nominalSunHours = nominalResult.metrics.sunlightHours;
  const nominalEarthHours = nominalResult.metrics.earthVisHours;
  const nominalBothUpHours = nominalResult.metrics.bothUpHours;

  const results: SlipCase[] = [];

  for (const item of SLIP_OFFSETS) {
    const offsetMs = item.days * 24 * 3600 * 1000;
    const slipStartMs = windowStartMs + offsetMs;
    const slipEndMs = slipStartMs + windowDurationMs;

    const slipResult =
      item.days === 0
        ? nominalResult
        : evaluateScenario(
            scenario,
            siteLat,
            siteLon,
            siteElevKm,
            mask,
            slipStartMs,
            slipEndMs,
            slipStartMs,
            60 * 60 * 1000
          );

    const sunHours = slipResult.metrics.sunlightHours;
    const earthHours = slipResult.metrics.earthVisHours;
    const bothUpHours = slipResult.metrics.bothUpHours;

    results.push({
      offsetDays: item.days,
      label: item.label,
      startDateIso: new Date(slipStartMs).toISOString().split('T')[0],
      metrics: slipResult.metrics,
      deltaSunHours: sunHours - nominalSunHours,
      deltaEarthHours: earthHours - nominalEarthHours,
      deltaBothUpHours: bothUpHours - nominalBothUpHours,
      deltaSunPercent: slipResult.metrics.sunlightPercent - nominalResult.metrics.sunlightPercent,
      verdict: slipResult.verdict,
    });
  }

  return results;
}

