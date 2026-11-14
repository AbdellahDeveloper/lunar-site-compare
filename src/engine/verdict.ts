import { ScenarioMetrics, Verdict, ViabilityTier } from '../types';

export function evaluateVerdict(metrics: ScenarioMetrics): Verdict {
  let sunStatus: 'healthy' | 'grazing' | 'dark' = 'grazing';
  let sunDetail = '';

  if (metrics.sunlightPercent < 15) {
    sunStatus = 'dark';
    sunDetail = `Critical low sunlight (${metrics.sunlightPercent.toFixed(1)}%). Longest dark period is ${metrics.longestDarkHours.toFixed(1)} hrs. Mission requires RHU/RTG or massive survival battery reserve.`;
  } else if (metrics.meanSunElevationWhenUp < 3.0) {
    sunStatus = 'grazing';
    sunDetail = `Grazing sun angle (mean ${metrics.meanSunElevationWhenUp.toFixed(1)}° when up). Horizontal solar panels will produce only ${(metrics.avgPowerHorizontal * 100).toFixed(0)}% flux. Vertical tracking panels produce ${(metrics.avgPowerTracking * 100).toFixed(0)}% flux.`;
  } else {
    sunStatus = 'healthy';
    sunDetail = `Solid solar illumination (${metrics.sunlightPercent.toFixed(1)}% daylight, ${metrics.sunlightHours.toFixed(1)} hrs total). Max sun elevation reaches ${metrics.peakSunElevation.toFixed(1)}°.`;
  }

  let earthStatus: 'continuous' | 'intermittent' | 'occulted' = 'intermittent';
  let earthDetail = '';

  if (metrics.earthVisPercent >= 95) {
    earthStatus = 'continuous';
    earthDetail = `Continuous direct-to-Earth link (${metrics.earthVisPercent.toFixed(1)}% window). Direct DTE communication active without relay satellite.`;
  } else if (metrics.earthVisPercent >= 25) {
    earthStatus = 'intermittent';
    earthDetail = `Intermittent DTE contact (${metrics.earthVisPercent.toFixed(1)}% window). Longest comm outage is ${metrics.longestEarthOutageHours.toFixed(1)} hrs. Store-and-forward or relay required during dropouts.`;
  } else {
    earthStatus = 'occulted';
    earthDetail = `Severe Earth blockage (${metrics.earthVisPercent.toFixed(1)}% visibility). Direct line-of-sight obstructed by lunar geometry or crater rim. Dedicated relay satellite (e.g. Lunar Pathfinder/Gateway) required.`;
  }

  // Determine overall viability tier
  let tier: ViabilityTier = 'viable';
  let title = 'Viable Landing Window';
  let operationalSummary = '';

  if (metrics.sunlightPercent >= 60 && metrics.earthVisPercent >= 85) {
    tier = 'optimal';
    title = 'Prime Operational Window';
    operationalSummary = `Favorable conditions: ${metrics.bothUpHours.toFixed(1)} hours of simultaneous power and direct communication. Low operational risk.`;
  } else if (metrics.sunlightPercent >= 40 && metrics.earthVisPercent >= 50) {
    tier = 'viable';
    title = 'Operationally Viable';
    operationalSummary = `Manageable constraints: ${metrics.sunlightHours.toFixed(1)} daylight hours with ${metrics.bothUpHours.toFixed(1)} hours of joint power + DTE. Normal battery cycling required.`;
  } else if (metrics.sunlightPercent >= 20 || metrics.earthVisPercent >= 35) {
    tier = 'constrained';
    title = 'High Constraints Window';
    operationalSummary = `Tight operational margins. Battery survival during ${metrics.longestDarkHours.toFixed(1)}h night and comm blackout buffering required.`;
  } else {
    tier = 'critical';
    title = 'High Risk / Non-Viable';
    operationalSummary = `Extreme risk: inadequate solar generation or extended Earth blackout. Alternative landing site or alternate launch epoch strongly recommended.`;
  }

  return {
    tier,
    title,
    summary: `${sunStatus === 'healthy' ? 'High Solar' : sunStatus === 'grazing' ? 'Grazing Solar' : 'Low Solar'} // ${earthStatus === 'continuous' ? 'Continuous DTE' : earthStatus === 'intermittent' ? 'Periodic DTE' : 'No Direct DTE'}`,
    sunStatus,
    sunDetail,
    earthStatus,
    earthDetail,
    operationalSummary,
  };
}

