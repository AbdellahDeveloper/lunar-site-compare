import { EphemerisPoint, ScenarioEvaluation, ScenarioConfig, Site } from '../types';

export function generateEphemerisCsv(
  scenarioName: string,
  siteName: string,
  lat: number,
  lon: number,
  points: EphemerisPoint[]
): string {
  const headers = [
    'TimestampUTC',
    'UnixMs',
    'SunElevationDeg',
    'SunAzimuthDeg',
    'SunHorizonDeg',
    'SunClearanceDeg',
    'SunVisible',
    'EarthElevationDeg',
    'EarthAzimuthDeg',
    'EarthHorizonDeg',
    'EarthClearanceDeg',
    'EarthVisible',
    'BothUp',
    'HorizontalPowerFlux',
    'TrackingPowerFlux',
  ];

  const rows = points.map((p) => [
    p.dateIso,
    p.timeMs,
    p.sun.elevationDeg.toFixed(4),
    p.sun.azimuthDeg.toFixed(4),
    p.sun.horizonDeg.toFixed(4),
    p.sun.elevationAboveHorizon.toFixed(4),
    p.sun.isVisible ? '1' : '0',
    p.earth.elevationDeg.toFixed(4),
    p.earth.azimuthDeg.toFixed(4),
    p.earth.horizonDeg.toFixed(4),
    p.earth.elevationAboveHorizon.toFixed(4),
    p.earth.isVisible ? '1' : '0',
    p.isBothUp ? '1' : '0',
    p.horizontalPowerFlux.toFixed(4),
    p.trackingPowerFlux.toFixed(4),
  ]);

  const meta = [
    `# SELENE-COMPARE Mission Telemetry Export`,
    `# Scenario: ${scenarioName}`,
    `# Landing Site: ${siteName} (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`,
    `# Generated: ${new Date().toISOString()}`,
    '',
  ].join('\n');

  return meta + headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
}

export function generateIntervalsCsv(
  evaluation: ScenarioEvaluation,
  scenarioName: string,
  siteName: string
): string {
  const headers = ['Category', 'StartUTC', 'EndUTC', 'DurationHours', 'OpenStart', 'OpenEnd'];
  const rows: string[][] = [];

  for (const inv of evaluation.sunIntervals) {
    rows.push([
      'Sunlight',
      new Date(inv.startMs).toISOString(),
      new Date(inv.endMs).toISOString(),
      inv.durationHours.toFixed(2),
      inv.openStart ? 'TRUE' : 'FALSE',
      inv.openEnd ? 'TRUE' : 'FALSE',
    ]);
  }

  for (const inv of evaluation.earthIntervals) {
    rows.push([
      'EarthDTE',
      new Date(inv.startMs).toISOString(),
      new Date(inv.endMs).toISOString(),
      inv.durationHours.toFixed(2),
      inv.openStart ? 'TRUE' : 'FALSE',
      inv.openEnd ? 'TRUE' : 'FALSE',
    ]);
  }

  for (const inv of evaluation.bothUpIntervals) {
    rows.push([
      'BothUp_PowerAndComms',
      new Date(inv.startMs).toISOString(),
      new Date(inv.endMs).toISOString(),
      inv.durationHours.toFixed(2),
      inv.openStart ? 'TRUE' : 'FALSE',
      inv.openEnd ? 'TRUE' : 'FALSE',
    ]);
  }

  const meta = [
    `# SELENE-COMPARE Visibility & Contact Intervals`,
    `# Scenario: ${scenarioName}`,
    `# Landing Site: ${siteName}`,
    '',
  ].join('\n');

  return meta + headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
}

export function downloadTextFile(filename: string, content: string, mime: string = 'text/csv') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
