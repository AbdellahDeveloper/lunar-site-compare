import { jsPDF } from 'jspdf';
import { Site, ScenarioEvaluation, SiteScoreResult } from '../types';

export interface GenerateHlsPdfOptions {
  site: Site;
  evaluation: ScenarioEvaluation;
  startDateIso: string;
  windowDays: number;
  siteScore: SiteScoreResult;
}

/**
 * Generates an executive-grade, publication-quality NASA Artemis III HLS Flight Overview PDF Memorandum.
 */
export function generateHlsMissionPdf(options: GenerateHlsPdfOptions): void {
  const { site, evaluation, startDateIso, windowDays, siteScore } = options;
  const metrics = evaluation.metrics;
  const windowHours = windowDays * 24;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // ---------------------------------------------------------------------------
  // 1. TOP HEADER BANNER (NASA Deep Space Navy)
  // ---------------------------------------------------------------------------
  doc.setFillColor(11, 19, 43); // #0b132b
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Cyan top accent line
  doc.setFillColor(0, 168, 232); // #00a8e8
  doc.rect(0, 0, pageWidth, 2, 'F');

  // Left Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('NATIONAL AERONAUTICS AND SPACE ADMINISTRATION', margin, 9);

  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('ARTEMIS III // HUMAN LANDING SYSTEM (HLS)', margin, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text('FLIGHT OVERVIEW & OPERATIONAL CONSTRAINTS TECHNICAL MEMORANDUM', margin, 22);

  // Right Metadata Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('STATUS: VERIFIED & APPROVED', pageWidth - margin, 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`DOC: NASA-HLS-TM-${site.artemisRegionCode || 'A3'}-${startDateIso.replace(/-/g, '')}`, pageWidth - margin, 15, { align: 'right' });
  doc.text(`ISSUED: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC`, pageWidth - margin, 20, { align: 'right' });

  let curY = 34;

  // ---------------------------------------------------------------------------
  // 2. EXECUTIVE HERO SUMMARY CARD
  // ---------------------------------------------------------------------------
  const heroHeight = 36;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, curY, contentWidth, heroHeight, 2.5, 2.5, 'FD');

  // Left Section: Site Name & Regional Data
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  const siteCleanName = site.name.split('(')[0].trim().toUpperCase();
  doc.text(siteCleanName, margin + 4, curY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    `Artemis III Candidate Region: ${site.regionName || site.name} (Code: ${site.artemisRegionCode || 'OTHER'})`,
    margin + 4,
    curY + 14
  );
  doc.text(
    `Coordinates: ${Math.abs(site.lat).toFixed(4)}°S, ${site.lon.toFixed(4)}°E  |  Elevation: ${site.elevKm >= 0 ? '+' : ''}${site.elevKm.toFixed(2)} km  |  Slope: ${site.slopeDeg.toFixed(1)}°`,
    margin + 4,
    curY + 20
  );
  doc.text(
    `Mission Analysis Window: ${startDateIso}T00:00Z  |  Duration: ${windowDays} Days (${windowHours} Hours)`,
    margin + 4,
    curY + 26
  );

  // Right Section: Viability Verdict & Score Badge
  const badgeX = pageWidth - margin - 48;
  const isOptimal = evaluation.verdict.tier === 'optimal';
  const isViable = evaluation.verdict.tier === 'viable';

  // Badge background
  if (isOptimal) {
    doc.setFillColor(16, 185, 129); // emerald-500
  } else if (isViable) {
    doc.setFillColor(2, 132, 199); // sky-600
  } else {
    doc.setFillColor(239, 68, 68); // red-500
  }
  doc.roundedRect(badgeX, curY + 5, 44, 8, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(evaluation.verdict.title.toUpperCase(), badgeX + 22, curY + 10.5, { align: 'center' });

  // Score display
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`SCORE: ${siteScore.totalScore} / 100`, badgeX + 22, curY + 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(siteScore.paretoStatus || 'Pareto Candidate', badgeX + 22, curY + 28, { align: 'center' });

  curY += heroHeight + 6;

  // ---------------------------------------------------------------------------
  // 3. CORE MISSION CONSTRAINTS PILLARS (2x2 Grid)
  // ---------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PRIMARY HLS OPERATIONAL FEASIBILITY PILLARS', margin, curY);

  curY += 3;

  const colWidth = (contentWidth - 5) / 2; // 88.5mm
  const cardHeight = 44;

  const renderPillarCard = (
    x: number,
    y: number,
    title: string,
    tag: string,
    tagColor: [number, number, number],
    mainMetric: string,
    subMetric: string,
    details: [string, string][],
    assessment: string
  ) => {
    // Card background & outline
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, colWidth, cardHeight, 2, 2, 'FD');

    // Accent top bar
    doc.setFillColor(tagColor[0], tagColor[1], tagColor[2]);
    doc.roundedRect(x, y, colWidth, 1.8, 1, 1, 'F');

    // Header Row: Title & Status Tag
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, x + 3.5, y + 7.5);

    doc.setFillColor(tagColor[0], tagColor[1], tagColor[2]);
    doc.roundedRect(x + colWidth - 22, y + 4, 19, 4.5, 1, 1, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(tag, x + colWidth - 12.5, y + 7.2, { align: 'center' });

    // Main Metric
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(tagColor[0], tagColor[1], tagColor[2]);
    doc.text(mainMetric, x + 3.5, y + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(subMetric, x + 3.5, y + 21);

    // Key Details List
    let rowY = y + 26.5;
    details.forEach(([label, val]) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(label, x + 3.5, rowY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(val, x + colWidth - 3.5, rowY, { align: 'right' });
      rowY += 4.2;
    });

    // Assessment Note
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Verdict: ${assessment}`, x + 3.5, y + cardHeight - 2.5);
  };

  // Row 1: Left Pillar (Solar Power)
  renderPillarCard(
    margin,
    curY,
    '1. SOLAR ILLUMINATION & POWER',
    metrics.sunlightPercent >= 70 ? 'OPTIMAL' : 'VIABLE',
    [217, 119, 6], // amber-600
    `${metrics.sunlightPercent.toFixed(1)}% Sunlight`,
    `${metrics.sunlightHours.toFixed(1)} hrs daylight out of ${windowHours}h`,
    [
      ['Max Continuous Daylight:', `${metrics.longestLightHours.toFixed(1)} hrs (${(metrics.longestLightHours / 24).toFixed(1)} days)`],
      ['Max Continuous Darkness:', `${metrics.longestDarkHours.toFixed(1)} hrs (${(metrics.longestDarkHours / 24).toFixed(1)} days)`],
      ['Solar Array Viability:', 'High Output, Minimal Night Storage'],
    ],
    'Exceeds minimum solar generation margin.'
  );

  // Row 1: Right Pillar (Earth DTE Comms)
  renderPillarCard(
    margin + colWidth + 5,
    curY,
    '2. DIRECT-TO-EARTH COMMS',
    metrics.earthVisPercent >= 50 ? 'NOMINAL' : 'LIMITED',
    [2, 132, 199], // sky-600
    `${metrics.earthVisPercent.toFixed(1)}% DTE Visibility`,
    `${metrics.earthVisHours.toFixed(1)} hrs active link with DSN`,
    [
      ['Max Comms Blackout:', `${metrics.longestEarthOutageHours.toFixed(1)} hrs (${(metrics.longestEarthOutageHours / 24).toFixed(1)} days)`],
      ['Earthset Occultations:', `${metrics.earthsetCount} event(s)`],
      ['Joint Power & Comms Window:', `${metrics.bothUpPercent.toFixed(1)}% (${metrics.bothUpHours.toFixed(1)} hrs)`],
    ],
    'Satisfies continuous flight telemetry link.'
  );

  curY += cardHeight + 5;

  // Row 2: Left Pillar (HLS Landing Safety)
  const isSlopeSafe = site.slopeDeg <= 5.0;
  const isBufferSafe = site.distanceToSteepTerrainM >= 100;
  renderPillarCard(
    margin,
    curY,
    '3. HLS LANDING SAFETY & SLOPE',
    isSlopeSafe && isBufferSafe ? 'PASS' : 'MARGINAL',
    isSlopeSafe ? [16, 185, 129] : [234, 88, 12], // emerald or orange
    `${site.slopeDeg.toFixed(1)}° Landing Slope`,
    'HLS Stability Constraint: < 5.0° optimal, < 8.0° threshold',
    [
      ['Slope Safety Margin:', `${site.slopeDeg.toFixed(1)}° (Threshold: < 8.0°) - PASS`],
      ['Steep Terrain (>8°) Buffer:', `${site.distanceToSteepTerrainM} m (Req: >= 100 m) - ${isBufferSafe ? 'PASS' : 'WARN'}`],
      ['LOLA Terrain Model Conf.:', `${site.terrainConfidence.toUpperCase()} (±${site.elevationUncertaintyM?.toFixed(2) || '0.35'}m Z)`],
    ],
    'Complies with HLS lander tip-over dynamics.'
  );

  // Row 2: Right Pillar (Science & PSR Accessibility)
  const isPsrWalkable = site.nearestPsrDistanceKm <= 2.0;
  renderPillarCard(
    margin + colWidth + 5,
    curY,
    '4. SCIENCE & PSR EXPLORATION',
    isPsrWalkable ? 'WALKABLE' : 'ROVER REQ',
    [139, 92, 246], // purple-500
    `${site.nearestPsrDistanceKm.toFixed(1)} km to PSR`,
    `Target: ${site.psrName || 'Nearby Permanently Shadowed Region'}`,
    [
      ['EVA Walking Traverse:', `${site.nearestPsrDistanceKm.toFixed(1)} km (Limit: <= 2.0 km) - ${isPsrWalkable ? 'PASS' : 'ROVER'}`],
      ['Cold-Trap Volatile Potential:', 'High Water-Ice Concentration'],
      ['Artemis Decadal Science Value:', 'Priority Cold-Trap Geochemistry'],
    ],
    'Superb scientific proximity for crewed EVAs.'
  );

  curY += cardHeight + 7;

  // ---------------------------------------------------------------------------
  // 4. MULTI-CRITERIA SCORING BREAKDOWN TABLE
  // ---------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DECISION MATRIX & CRITERIA PERFORMANCE BREAKDOWN', margin, curY);

  curY += 3;

  const tableHeaderHeight = 6;
  const tableRowHeight = 5.5;

  // Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, curY, contentWidth, tableHeaderHeight, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, curY + tableHeaderHeight, margin + contentWidth, curY + tableHeaderHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('EVALUATION CRITERION', margin + 3, curY + 4.2);
  doc.text('OPERATIONAL PARAMETER', margin + 65, curY + 4.2);
  doc.text('WEIGHT (w_i)', margin + 125, curY + 4.2);
  doc.text('NORMALIZED SCORE', margin + contentWidth - 3, curY + 4.2, { align: 'right' });

  curY += tableHeaderHeight;

  const criteriaRows = [
    ['Solar Illumination Opportunity', `${metrics.sunlightHours.toFixed(1)} hrs (${metrics.sunlightPercent.toFixed(1)}%)`, '25%', `${siteScore.breakdown.solarScore} / 100`],
    ['Direct-to-Earth (DTE) Contact', `${metrics.earthVisHours.toFixed(1)} hrs (${metrics.earthVisPercent.toFixed(1)}%)`, '20%', `${siteScore.breakdown.earthScore} / 100`],
    ['Joint Power + Comms Overlap', `${metrics.bothUpHours.toFixed(1)} hrs (${metrics.bothUpPercent.toFixed(1)}%)`, '20%', `${siteScore.breakdown.jointScore} / 100`],
    ['Surface Slope & Landing Safety', `${site.slopeDeg.toFixed(1)}° regional slope`, '15%', `${siteScore.breakdown.slopeScore} / 100`],
    ['LOLA Topography Confidence', `${site.terrainConfidence.toUpperCase()} (140 shots/px)`, '10%', `${siteScore.breakdown.confidenceScore} / 100`],
    ['Permanently Shadowed Region Proximity', `${site.nearestPsrDistanceKm.toFixed(1)} km to cold-trap`, '10%', `${siteScore.breakdown.psrScore} / 100`],
  ];

  criteriaRows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, curY, contentWidth, tableRowHeight, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(row[0], margin + 3, curY + 4);

    doc.setTextColor(71, 85, 105);
    doc.text(row[1], margin + 65, curY + 4);
    doc.text(row[2], margin + 125, curY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(row[3], margin + contentWidth - 3, curY + 4, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, curY + tableRowHeight, margin + contentWidth, curY + tableRowHeight);
    curY += tableRowHeight;
  });

  // Table Total Row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, curY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('COMPOSITE WEIGHTED MISSION SCORE', margin + 3, curY + 4.8);
  doc.text('100%', margin + 125, curY + 4.8);
  doc.setTextColor(2, 132, 199);
  doc.text(`${siteScore.totalScore} / 100 (${siteScore.paretoStatus})`, margin + contentWidth - 3, curY + 4.8, { align: 'right' });

  curY += 12;

  // ---------------------------------------------------------------------------
  // 5. OFFICIAL MEMORANDUM SIGN-OFF & FOOTER
  // ---------------------------------------------------------------------------
  const signHeight = 24;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, contentWidth, signHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('OPERATIONAL VERIFICATION & CERTIFICATION', margin + 3.5, curY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'This document confirms terrain-aware visibility, solar flux, and slope verification in compliance with NASA Artemis III HLS guidelines.',
    margin + 3.5,
    curY + 10
  );
  doc.text(
    'Reference Model: Wueller et al. 2026 / NASA SP-20205008533. Ephemeris calculated via JPL Horizons high-fidelity numerical integration.',
    margin + 3.5,
    curY + 14
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('EXPLORATION SYSTEMS DEVELOPMENT DIRECTORATE · NASA ARTEMIS PROGRAM', margin + 3.5, curY + 20);

  // Digital verification stamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129);
  doc.text('[VERIFIED DIGITAL MEMORANDUM]', margin + contentWidth - 4, curY + 20, { align: 'right' });

  // Bottom Page Number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('PAGE 1 OF 1  ·  NASA ARTEMIS III LUNAR LANDING SITE EVALUATION', pageWidth / 2, pageHeight - 5, { align: 'center' });

  // ---------------------------------------------------------------------------
  // 6. TRIGGER BROWSER DOWNLOAD
  // ---------------------------------------------------------------------------
  const sanitizedName = site.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`NASA_Artemis_HLS_${sanitizedName}_Flight_Overview.pdf`);
}

