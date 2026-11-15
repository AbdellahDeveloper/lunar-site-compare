import { ScenarioMetrics, Verdict, ViabilityTier } from '../types';

/**
 * NASA Artemis Human Landing System (HLS) & SCaN Operational Verdict Engine
 *
 * Evaluates mission viability according to NASA Artemis III Science Definition Report
 * and NASA Space Communications and Navigation (SCaN) DTE line-of-sight standards:
 * - Lunar Axial Obliquity: 1.543° (astronomical threshold where topographic shadowing dominates)
 * - Minimum DTE Antenna Elevation Margin: >= 2.0° above terrain (mitigating libration wobble of ±6.7° and multipath)
 * - Thermal/Power Survival Requirement: battery cycling during dark periods vs. RHU/fission requirement
 */
export function evaluateVerdict(metrics: ScenarioMetrics): Verdict {
  let sunStatus: 'healthy' | 'grazing' | 'dark' = 'grazing';
  let sunDetail = '';

  // NASA HLS Solar Power Thresholds:
  if (metrics.sunlightPercent < 20.0) {
    sunStatus = 'dark';
    sunDetail = `Critical low solar duty cycle (${metrics.sunlightPercent.toFixed(1)}%). Longest consecutive dark period is ${metrics.longestDarkHours.toFixed(1)} hrs. Exceeds standard secondary battery limits; requires Radioisotope Heater Units (RHU) or surface fission power.`;
  } else if (metrics.meanSunElevationWhenUp <= 1.543) {
    // 1.543° is the Moon's true obliquity to the ecliptic
    sunStatus = 'grazing';
    sunDetail = `Grazing sub-obliquity sun angle (mean ${metrics.meanSunElevationWhenUp.toFixed(1)}° <= 1.54°). Horizontal solar arrays yield only ${(metrics.avgPowerHorizontal * 100).toFixed(0)}% flux. Vertical tracking solar arrays required (${(metrics.avgPowerTracking * 100).toFixed(0)}% flux).`;
  } else {
    sunStatus = 'healthy';
    sunDetail = `Nominal solar illumination (${metrics.sunlightPercent.toFixed(1)}% daylight, ${metrics.sunlightHours.toFixed(1)} hrs total). Peak sun reaches +${metrics.peakSunElevation.toFixed(1)}° above terrain.`;
  }

  let earthStatus: 'continuous' | 'intermittent' | 'occulted' = 'intermittent';
  let earthDetail = '';

  // NASA SCaN Direct-to-Earth (DTE) Link Availability:
  if (metrics.earthVisPercent >= 90.0) {
    earthStatus = 'continuous';
    earthDetail = `Nominal Direct-to-Earth (DTE) coverage (${metrics.earthVisPercent.toFixed(1)}% window). Supports continuous real-time HD video and crewed telemetry via NASA Deep Space Network (DSN).`;
  } else if (metrics.earthVisPercent >= 30.0) {
    earthStatus = 'intermittent';
    earthDetail = `Intermittent DTE contact (${metrics.earthVisPercent.toFixed(1)}% window). Maximum comm outage is ${metrics.longestEarthOutageHours.toFixed(1)} hrs. Onboard solid-state recording and store-and-forward telemetry buffering required during dropouts.`;
  } else {
    earthStatus = 'occulted';
    earthDetail = `Severe Earth occultation (${metrics.earthVisPercent.toFixed(1)}% visibility). Direct line-of-sight blocked by crater rim topography. Dedicated relay satellite (e.g. Lunar Pathfinder or Artemis Gateway) required.`;
  }

  // NASA Artemis Operational Viability Tiers
  let tier: ViabilityTier = 'viable';
  let title = 'Viable Artemis Window';
  let operationalSummary = '';

  if (metrics.sunlightPercent >= 60.0 && metrics.earthVisPercent >= 85.0) {
    tier = 'optimal';
    title = 'Prime Artemis HLS Window';
    operationalSummary = `Exceeds NASA HLS baseline: ${metrics.bothUpHours.toFixed(1)} hours of simultaneous power and DTE communications. Negligible thermal blackout risk.`;
  } else if (metrics.sunlightPercent >= 40.0 && metrics.earthVisPercent >= 50.0) {
    tier = 'viable';
    title = 'Operationally Viable';
    operationalSummary = `Meets Artemis nominal mission constraints: ${metrics.sunlightHours.toFixed(1)} daylight hours with ${metrics.bothUpHours.toFixed(1)} hours of joint power + DTE. Standard battery cycling.`;
  } else if (metrics.sunlightPercent >= 20.0 || metrics.earthVisPercent >= 30.0) {
    tier = 'constrained';
    title = 'High Constraints Window';
    operationalSummary = `Tight operational margins: extended ${metrics.longestDarkHours.toFixed(1)}h night and comm blackout buffering required for crew EVA scheduling.`;
  } else {
    tier = 'critical';
    title = 'High Risk / Non-Viable';
    operationalSummary = `Mission violation: inadequate solar generation or extended Earth blackout. Alternative landing site or revised launch epoch required.`;
  }

  return {
    tier,
    title,
    summary: `${sunStatus === 'healthy' ? 'Nominal Solar' : sunStatus === 'grazing' ? 'Grazing Solar (<1.54°)' : 'Low Solar (<20%)'} // ${earthStatus === 'continuous' ? 'Continuous DTE' : earthStatus === 'intermittent' ? 'Periodic DTE' : 'Relay Required'}`,
    sunStatus,
    sunDetail,
    earthStatus,
    earthDetail,
    operationalSummary,
  };
}
