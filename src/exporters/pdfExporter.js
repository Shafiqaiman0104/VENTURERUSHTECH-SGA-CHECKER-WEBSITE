const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const COLORS = {
  navy: '#0A1633',
  brandBlue: '#2563EB',
  brandBlueLight: '#3B82F6',
  indigo: '#4F46E5',
  emerald: '#10B981',
  emeraldBg: '#ECFDF5',
  purple: '#7C3AED',
  purpleBg: '#F5F3FF',
  amber: '#F59E0B',
  amberBg: '#FFFBEB',
  orange: '#F97316',
  red: '#EF4444',
  redBg: '#FEF2F2',
  slate900: '#0F172A',
  slate700: '#334155',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',
};

const PRIORITY_COLORS = {
  CRITICAL: { solid: '#DC2626', bg: '#FEE2E2', text: '#991B1B' },
  HIGH: { solid: '#EA580C', bg: '#FFEDD5', text: '#9A3412' },
  MEDIUM: { solid: '#D97706', bg: '#FEF3C7', text: '#92400E' },
  LOW: { solid: '#64748B', bg: '#F1F5F9', text: '#334155' },
};

const LOGO_PATH = path.resolve(__dirname, '../../public/assets/vrLogoBlue.png');

function drawArcPath(doc, cx, cy, radius, startDeg, endDeg, steps = 40) {
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  for (let i = 0; i <= steps; i++) {
    const a = startRad + ((endRad - startRad) * i) / steps;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    if (i === 0) doc.moveTo(x, y);
    else doc.lineTo(x, y);
  }
}

function drawSpeedometerGauge(doc, cx, cy, radius, score) {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));

  // Background track (180 deg to 360 deg = top semicircle)
  doc.save();
  doc.lineWidth(14).lineCap('round').strokeColor('#E2E8F0');
  drawArcPath(doc, cx, cy, radius, 180, 360, 48);
  doc.stroke();

  // Colored progress arc broken into smooth segments
  const totalAngle = (clamped / 100) * 180;
  if (totalAngle > 0) {
    const segments = 30;
    for (let i = 0; i < segments; i++) {
      const t0 = i / segments;
      const t1 = (i + 1) / segments;
      const a0 = 180 + t0 * totalAngle;
      const a1 = 180 + t1 * totalAngle;
      const pctAtSeg = (t0 * clamped) / 100;
      let segColor = '#EF4444';
      if (pctAtSeg >= 0.7) segColor = '#10B981';
      else if (pctAtSeg >= 0.45) segColor = '#F59E0B';
      else if (pctAtSeg >= 0.25) segColor = '#F97316';

      doc.lineWidth(14).lineCap(i === 0 || i === segments - 1 ? 'round' : 'butt').strokeColor(segColor);
      drawArcPath(doc, cx, cy, radius, a0, a1, 4);
      doc.stroke();
    }
  }

  // Needle
  const needleAngle = ((180 + (clamped / 100) * 180) * Math.PI) / 180;
  const nx = cx + (radius - 16) * Math.cos(needleAngle);
  const ny = cy + (radius - 16) * Math.sin(needleAngle);
  doc.lineWidth(3).lineCap('round').strokeColor(COLORS.navy);
  doc.moveTo(cx, cy).lineTo(nx, ny).stroke();

  doc.circle(cx, cy, 6).fill(COLORS.navy);
  doc.circle(cx, cy, 2.5).fill(COLORS.white);

  // Score text
  doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(34)
    .text(String(clamped), cx - 50, cy - 48, { width: 100, align: 'center' });
  doc.fillColor(COLORS.slate500).font('Helvetica').fontSize(10)
    .text('Overall Score', cx - 60, cy + 12, { width: 120, align: 'center' });

  // 0 and 100 labels
  doc.fillColor(COLORS.slate400).font('Helvetica-Bold').fontSize(9);
  doc.text('0', cx - radius - 8, cy + 10, { width: 20, align: 'center' });
  doc.text('100', cx + radius - 14, cy + 10, { width: 28, align: 'center' });
  doc.restore();
}

function drawRingMeter(doc, cx, cy, radius, score, color, label, sublabel) {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  doc.save();
  doc.lineWidth(6).strokeColor('#E2E8F0');
  doc.circle(cx, cy, radius).stroke();

  if (clamped > 0) {
    const startDeg = -90;
    const endDeg = -90 + (clamped / 100) * 359.5;
    doc.lineWidth(6).lineCap('round').strokeColor(color);
    drawArcPath(doc, cx, cy, radius, startDeg, endDeg, 40);
    doc.stroke();
  }

  doc.fillColor(color).font('Helvetica-Bold').fontSize(18)
    .text(String(clamped), cx - radius, cy - 10, { width: radius * 2, align: 'center' });

  doc.fillColor(color).font('Helvetica-Bold').fontSize(9.5)
    .text(label, cx - 45, cy + radius + 8, { width: 90, align: 'center' });

  if (sublabel) {
    doc.fillColor(COLORS.slate500).font('Helvetica').fontSize(7.5)
      .text(sublabel, cx - 45, cy + radius + 21, { width: 90, align: 'center' });
  }
  doc.restore();
}

function drawDonutChart(doc, cx, cy, radius, passed, failed, na) {
  const total = Math.max(1, passed + failed + na);
  const slices = [
    { value: passed, color: COLORS.emerald },
    { value: failed, color: COLORS.red },
    { value: na, color: '#CBD5E1' },
  ];

  doc.save();
  let startDeg = -90;
  for (const slice of slices) {
    if (slice.value <= 0) continue;
    const sweep = (slice.value / total) * 359.6;
    doc.lineWidth(18).lineCap('butt').strokeColor(slice.color);
    drawArcPath(doc, cx, cy, radius, startDeg, startDeg + sweep, Math.max(8, Math.round(sweep / 4)));
    doc.stroke();
    startDeg += sweep;
  }

  doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(20)
    .text(String(passed), cx - 40, cy - 14, { width: 80, align: 'center' });
  doc.fillColor(COLORS.slate500).font('Helvetica').fontSize(8.5)
    .text('Passed', cx - 40, cy + 8, { width: 80, align: 'center' });
  doc.restore();
}

function drawRadarChart(doc, cx, cy, radius, radar) {
  const axes = [
    { key: 'Technical', label: 'Technical', angle: -90 },
    { key: 'Content', label: 'Content', angle: 0 },
    { key: 'Schema', label: 'Schema', angle: 90 },
    { key: 'Security', label: 'Security', angle: 180 },
  ];

  doc.save();
  // Grid polygons
  for (const level of [0.25, 0.5, 0.75, 1]) {
    doc.lineWidth(level === 1 ? 1.2 : 0.7).strokeColor('#CBD5E1');
    axes.forEach((ax, idx) => {
      const rad = (ax.angle * Math.PI) / 180;
      const x = cx + radius * level * Math.cos(rad);
      const y = cy + radius * level * Math.sin(rad);
      if (idx === 0) doc.moveTo(x, y);
      else doc.lineTo(x, y);
    });
    doc.closePath().stroke();
  }

  // Crosshair lines
  doc.lineWidth(0.7).strokeColor('#CBD5E1');
  doc.moveTo(cx, cy - radius).lineTo(cx, cy + radius).stroke();
  doc.moveTo(cx - radius, cy).lineTo(cx + radius, cy).stroke();

  // Data polygon
  const pts = axes.map((ax) => {
    const pct = Math.max(5, Math.min(100, Number(radar[ax.key]) || 0)) / 100;
    const rad = (ax.angle * Math.PI) / 180;
    return {
      x: cx + radius * pct * Math.cos(rad),
      y: cy + radius * pct * Math.sin(rad),
      val: Number(radar[ax.key]) || 0,
      label: ax.label,
      angle: ax.angle,
    };
  });

  doc.fillColor('#2563EB').fillOpacity(0.18).strokeColor('#2563EB').lineWidth(2);
  pts.forEach((p, idx) => {
    if (idx === 0) doc.moveTo(p.x, p.y);
    else doc.lineTo(p.x, p.y);
  });
  doc.closePath().fillAndStroke();

  doc.fillOpacity(1);
  for (const p of pts) {
    doc.circle(p.x, p.y, 4).fill(COLORS.brandBlue);
  }

  // Labels
  doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(11);
  doc.text('Technical', cx - 50, cy - radius - 34, { width: 100, align: 'center' });
  doc.fillColor(COLORS.slate500).font('Helvetica').fontSize(10)
    .text(`${radar.Technical ?? 0}%`, cx - 50, cy - radius - 19, { width: 100, align: 'center' });

  doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(11)
    .text('Content', cx + radius + 14, cy - 13, { width: 80, align: 'left' });
  doc.fillColor(COLORS.slate500).font('Helvetica').fontSize(10)
    .text(`${radar.Content ?? 0}%`, cx + radius + 14, cy + 2, { width: 80, align: 'left' });

  doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(11)
    .text('Schema', cx - 50, cy + radius + 10, { width: 100, align: 'center' });
  doc.fillColor(COLORS.slate500).font('Helvetica').fontSize(10)
    .text(`${radar.Schema ?? 0}%`, cx - 50, cy + radius + 25, { width: 100, align: 'center' });

  doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(11)
    .text('Security', cx - radius - 94, cy - 13, { width: 80, align: 'right' });
  doc.fillColor(COLORS.slate500).font('Helvetica').fontSize(10)
    .text(`${radar.Security ?? 0}%`, cx - radius - 94, cy + 2, { width: 80, align: 'right' });

  doc.restore();
}

function drawRunningHeader(doc, sectionTitle, domain) {
  const pageW = doc.page.width;
  doc.save();
  doc.rect(0, 0, pageW, 30).fill(COLORS.navy);
  doc.rect(0, 28, pageW, 2).fill(COLORS.brandBlue);
  doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8.5)
    .text(sectionTitle, 40, 10, { width: 280 });
  doc.fillColor('#CBD5E1').font('Helvetica').fontSize(8.5)
    .text(domain, pageW - 260, 10, { width: 220, align: 'right' });
  doc.restore();
}

function drawSectionHeading(doc, title, y) {
  doc.save();
  doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(13).text(title, 40, y);
  const w = Math.min(200, doc.widthOfString(title) + 12);
  doc.rect(40, y + 17, w, 2).fill(COLORS.brandBlue);
  doc.restore();
  return y + 28;
}

function generatePdfBuffer(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
      info: {
        Title: `VentureRush Tech SEO AEO GEO Audit Report - ${report.meta?.domain || ''}`,
        Author: 'VentureRush Tech SEO GEO AEO Checker',
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const contentW = pageW - 80;
    const domain = report.meta?.domain || 'website';
    const scores = report.scores || {};
    const summary = report.summary || {};
    const checks = Array.isArray(report.checks) ? report.checks : [];
    const hasLogo = fs.existsSync(LOGO_PATH);

    // =========================================================================
    // PAGE 1: COVER / EXECUTIVE SCORE SUMMARY
    // =========================================================================
    doc.rect(0, 0, pageW, 132).fill(COLORS.navy);
    doc.rect(0, 128, pageW, 4).fill(COLORS.brandBlue);

    // Logo card on top-left
    if (hasLogo) {
      doc.roundedRect(40, 26, 56, 56, 10).fill(COLORS.white);
      try {
        doc.image(LOGO_PATH, 46, 32, { fit: [44, 44], align: 'center', valign: 'center' });
      } catch {
        // ignore if image fails
      }
    }

    // Header Title
    const titleX = hasLogo ? 110 : 40;
    doc.fillColor('#93C5FD').font('Helvetica-Bold').fontSize(9)
      .text('VENTURERUSH TECH · WEBSITE INTELLIGENCE', titleX, 26);
    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(20)
      .text('SEO · AEO · GEO Audit Report', titleX, 41);
    doc.fillColor('#E2E8F0').font('Helvetica-Bold').fontSize(11)
      .text(domain, titleX, 68);
    doc.fillColor('#94A3B8').font('Helvetica').fontSize(9)
      .text(
        `Scanned on ${report.meta?.scanDateFormatted || report.meta?.scanDate || ''}  •  ${report.meta?.totalCheckDefinitions || checks.length} Checks Executed`,
        titleX,
        85
      );
    doc.fillColor('#94A3B8').font('Helvetica').fontSize(8)
      .text(`URL: ${report.meta?.url || domain}`, titleX, 100, { width: 340, ellipsis: true });

    // Grade Badge top-right
    doc.roundedRect(pageW - 116, 26, 76, 76, 12).fill('#1E3A8A');
    doc.roundedRect(pageW - 116, 26, 76, 76, 12).lineWidth(1).strokeColor('#3B82F6').stroke();
    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(30)
      .text(scores.grade || 'B', pageW - 116, 38, { width: 76, align: 'center' });
    doc.fillColor('#BFDBFE').font('Helvetica-Bold').fontSize(8)
      .text('GRADE', pageW - 116, 77, { width: 76, align: 'center' });

    // Overall Speedometer Gauge
    drawSpeedometerGauge(doc, pageW / 2, 268, 92, scores.overall ?? 0);

    // 3 Pillar Ring Meters (SEO, AEO, GEO)
    const ringY = 344;
    drawRingMeter(
      doc,
      142,
      ringY,
      30,
      scores.seo ?? 0,
      COLORS.emerald,
      'SEO',
      `${summary.seo?.passed ?? 0}/${summary.seo?.total ?? 0} passed`
    );
    drawRingMeter(
      doc,
      pageW / 2,
      ringY,
      30,
      scores.aeo ?? 0,
      COLORS.purple,
      'AEO',
      `${summary.aeo?.passed ?? 0}/${summary.aeo?.total ?? 0} passed`
    );
    drawRingMeter(
      doc,
      pageW - 142,
      ringY,
      30,
      scores.geo ?? 0,
      COLORS.amber,
      'GEO',
      `${summary.geo?.passed ?? 0}/${summary.geo?.total ?? 0} passed`
    );

    // Divider line
    doc.moveTo(40, 412).lineTo(pageW - 40, 412).lineWidth(0.75).strokeColor(COLORS.slate200).stroke();

    // Left: Your Scores bar chart
    doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(11).text('Your Scores', 40, 428);
    const scoreRows = [
      { label: 'SEO', val: scores.seo ?? 0, color: COLORS.emerald },
      { label: 'AEO', val: scores.aeo ?? 0, color: COLORS.purple },
      { label: 'GEO', val: scores.geo ?? 0, color: COLORS.amber },
    ];
    scoreRows.forEach((row, idx) => {
      const y = 456 + idx * 36;
      doc.fillColor(COLORS.slate700).font('Helvetica-Bold').fontSize(11).text(row.label, 40, y + 4, { width: 38 });
      doc.roundedRect(84, y, 190, 20, 4).fill(COLORS.slate200);
      const fillW = Math.max(8, Math.round((Math.min(100, row.val) / 100) * 190));
      doc.roundedRect(84, y, fillW, 20, 4).fill(row.color);
      doc.fillColor(row.color).font('Helvetica-Bold').fontSize(12).text(String(row.val), 282, y + 3, { width: 32 });
    });

    // Right: Check Distribution Donut
    doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(11).text('Check Distribution', 345, 428);
    drawDonutChart(doc, 435, 508, 48, summary.passed ?? 0, summary.failed ?? 0, summary.na ?? 0);

    // Legend below donut
    const legY = 572;
    doc.rect(348, legY, 8, 8).fill(COLORS.emerald);
    doc.fillColor(COLORS.slate700).font('Helvetica').fontSize(8)
      .text(`Passed: ${summary.passed ?? 0}`, 360, legY, { width: 65 });
    doc.rect(424, legY, 8, 8).fill(COLORS.red);
    doc.fillColor(COLORS.slate700).text(`Failed: ${summary.failed ?? 0}`, 436, legY, { width: 55 });
    doc.rect(492, legY, 8, 8).fill('#CBD5E1');
    doc.fillColor(COLORS.slate700).text(`N/A: ${summary.na ?? 0}`, 504, legY, { width: 50 });

    // Bottom 5 KPI Summary Cards
    const kpis = [
      { label: 'Total Checks', val: String(summary.totalExecuted ?? checks.length), bg: '#EFF6FF', color: COLORS.brandBlue },
      { label: 'Passed', val: String(summary.passed ?? 0), bg: COLORS.emeraldBg, color: COLORS.emerald },
      { label: 'Failed', val: String(summary.failed ?? 0), bg: COLORS.redBg, color: COLORS.red },
      { label: 'Quick Wins', val: String(summary.quickWinsCount ?? 0), bg: COLORS.amberBg, color: '#D97706' },
      { label: 'Pass Rate', val: `${summary.passRate ?? 0}%`, bg: '#EEF2FF', color: COLORS.indigo },
    ];
    const cardGap = 10;
    const cardW = (contentW - cardGap * 4) / 5;
    const kpiY = 626;
    kpis.forEach((k, idx) => {
      const x = 40 + idx * (cardW + cardGap);
      doc.roundedRect(x, kpiY, cardW, 64, 8).fill(k.bg);
      doc.fillColor(k.color).font('Helvetica-Bold').fontSize(20)
        .text(k.val, x, kpiY + 14, { width: cardW, align: 'center' });
      doc.fillColor(COLORS.slate500).font('Helvetica').fontSize(8)
        .text(k.label, x, kpiY + 42, { width: cardW, align: 'center' });
    });

    // =========================================================================
    // PAGE 2: PRIORITY DISTRIBUTION, QUICK WINS & CATEGORY BREAKDOWN
    // =========================================================================
    doc.addPage();
    drawRunningHeader(doc, 'Issues & Quick Wins', domain);
    let y = drawSectionHeading(doc, 'Priority Distribution', 48);

    const pCounts = summary.priorities || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    const pCards = [
      { label: 'Critical', val: pCounts.CRITICAL, accent: '#DC2626', bg: '#FEF2F2' },
      { label: 'High', val: pCounts.HIGH, accent: '#EA580C', bg: '#FFF7ED' },
      { label: 'Medium', val: pCounts.MEDIUM, accent: '#D97706', bg: '#FFFBEB' },
      { label: 'Low', val: pCounts.LOW, accent: '#64748B', bg: '#F8FAFC' },
    ];
    const pW = (contentW - 30) / 4;
    pCards.forEach((pc, idx) => {
      const x = 40 + idx * (pW + 10);
      doc.roundedRect(x, y, pW, 56, 6).fill(pc.bg);
      doc.roundedRect(x, y, 5, 56, 2).fill(pc.accent);
      doc.fillColor(pc.accent).font('Helvetica-Bold').fontSize(20)
        .text(String(pc.val), x + 8, y + 10, { width: pW - 12, align: 'center' });
      doc.fillColor(COLORS.slate500).font('Helvetica').fontSize(8.5)
        .text(pc.label, x + 8, y + 36, { width: pW - 12, align: 'center' });
    });

    y += 74;
    y = drawSectionHeading(doc, 'Top Quick Wins', y);

    const quickWins = (report.quickWins || []).slice(0, 4);
    if (quickWins.length === 0) {
      doc.roundedRect(40, y, contentW, 40, 6).fill(COLORS.emeraldBg);
      doc.fillColor('#065F46').font('Helvetica-Bold').fontSize(10)
        .text('No Critical or High-priority failures found! Great baseline health.', 54, y + 14);
      y += 54;
    } else {
      for (const qw of quickWins) {
        const pc = PRIORITY_COLORS[qw.priority] || PRIORITY_COLORS.HIGH;
        doc.font('Helvetica').fontSize(8);
        const impactH = doc.heightOfString(`Impact: ${qw.impact}`, { width: contentW - 32 });
        const fixH = doc.heightOfString(`Fix: ${qw.howToFix}`, { width: contentW - 32 });
        const boxH = Math.max(60, 26 + impactH + fixH + 14);

        if (y + boxH > pageH - 60) {
          doc.addPage();
          drawRunningHeader(doc, 'Issues & Quick Wins (cont.)', domain);
          y = 48;
        }

        doc.roundedRect(40, y, contentW, boxH, 6).fill('#F8FAFC');
        doc.roundedRect(40, y, 4, boxH, 2).fill(pc.solid);
        doc.roundedRect(52, y + 8, 52, 14, 3).fill(pc.solid);
        doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(7)
          .text(qw.priority, 52, y + 11, { width: 52, align: 'center' });

        doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(9)
          .text(qw.description, 112, y + 9, { width: contentW - 80, ellipsis: true, lineBreak: false });

        doc.fillColor(COLORS.slate700).font('Helvetica').fontSize(8)
          .text(`Impact: ${qw.impact}`, 52, y + 27, { width: contentW - 32 });
        doc.fillColor('#047857').font('Helvetica').fontSize(8)
          .text(`Fix: ${qw.howToFix}`, 52, y + 31 + impactH, { width: contentW - 32 });

        y += boxH + 8;
      }
    }

    // Category Breakdown
    const catList = report.categoryBreakdown || [];
    const neededCatH = 42 + catList.length * 22;
    if (y + neededCatH > pageH - 50) {
      doc.addPage();
      drawRunningHeader(doc, 'Category Breakdown', domain);
      y = 48;
    } else {
      y += 10;
    }

    y = drawSectionHeading(doc, 'Category Breakdown', y);
    for (const cat of catList) {
      const barX = 128;
      const barW = 345;
      const ratio = cat.total > 0 ? cat.passed / cat.total : 0;
      const passW = Math.round(barW * ratio);

      doc.fillColor(COLORS.slate700).font('Helvetica-Bold').fontSize(9)
        .text(cat.category, 40, y + 2, { width: 80, align: 'right' });

      doc.roundedRect(barX, y, barW, 13, 3).fill(COLORS.red);
      if (passW > 0) {
        doc.roundedRect(barX, y, passW, 13, 3).fill(COLORS.emerald);
      }

      doc.fillColor(COLORS.slate500).font('Helvetica-Bold').fontSize(8.5)
        .text(`${cat.passed}/${cat.total}`, barX + barW + 10, y + 2, { width: 60 });

      y += 21;
    }

    // =========================================================================
    // FAILED CHECKS TABLE
    // =========================================================================
    const failedChecks = checks
      .filter((c) => c.status === 'FAIL')
      .sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (order[a.priority] ?? 9) - (order[b.priority] ?? 9);
      });

    const cols = [
      { key: 'priority', label: 'Priority', x: 40, w: 54 },
      { key: 'subCategory', label: 'Category', x: 94, w: 56 },
      { key: 'description', label: 'Issue', x: 150, w: 132 },
      { key: 'impact', label: 'Business Impact', x: 282, w: 132 },
      { key: 'howToFix', label: 'How to Fix', x: 414, w: 141 },
    ];

    function drawFailedTableHeader(topY) {
      doc.rect(40, topY, contentW, 20).fill(COLORS.navy);
      doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(7.5);
      for (const col of cols) {
        doc.text(col.label, col.x + 5, topY + 6, { width: col.w - 10 });
      }
      return topY + 20;
    }

    if (failedChecks.length > 0) {
      doc.addPage();
      drawRunningHeader(doc, 'Failed Checks', domain);
      y = drawSectionHeading(doc, `Failed Checks — Issues to Fix (${failedChecks.length})`, 48);
      y = drawFailedTableHeader(y);

      for (let i = 0; i < failedChecks.length; i++) {
        const fc = failedChecks[i];
        doc.font('Helvetica').fontSize(7.5);
        const hIssue = doc.heightOfString(fc.description || '-', { width: cols[2].w - 10 });
        const hImpact = doc.heightOfString(fc.impact || '-', { width: cols[3].w - 10 });
        const hFix = doc.heightOfString(fc.howToFix || '-', { width: cols[4].w - 10 });
        const rowH = Math.max(24, Math.max(hIssue, hImpact, hFix) + 12);

        if (y + rowH > pageH - 46) {
          doc.addPage();
          drawRunningHeader(doc, 'Failed Checks (cont.)', domain);
          y = drawFailedTableHeader(44);
        }

        const pc = PRIORITY_COLORS[fc.priority] || PRIORITY_COLORS.LOW;
        const rowBg = i % 2 === 0 ? COLORS.white : COLORS.slate50;

        doc.rect(40, y, contentW, rowH).fill(rowBg);
        doc.rect(cols[0].x, y, cols[0].w, rowH).fill(pc.solid);
        doc.moveTo(40, y + rowH).lineTo(40 + contentW, y + rowH).lineWidth(0.5).strokeColor(COLORS.slate200).stroke();

        doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(7)
          .text(fc.priority, cols[0].x + 2, y + 7, { width: cols[0].w - 4, align: 'center' });
        doc.fillColor(COLORS.slate700).font('Helvetica-Bold').fontSize(7.5)
          .text(fc.subCategory || fc.pillar, cols[1].x + 5, y + 6, { width: cols[1].w - 10 });
        doc.fillColor(COLORS.slate900).font('Helvetica').fontSize(7.5)
          .text(fc.description || '-', cols[2].x + 5, y + 6, { width: cols[2].w - 10 });
        doc.fillColor(COLORS.slate700).font('Helvetica').fontSize(7.5)
          .text(fc.impact || '-', cols[3].x + 5, y + 6, { width: cols[3].w - 10 });
        doc.fillColor(COLORS.slate700).font('Helvetica').fontSize(7.5)
          .text(fc.howToFix || '-', cols[4].x + 5, y + 6, { width: cols[4].w - 10 });

        y += rowH;
      }
    }

    // =========================================================================
    // PASSED CHECKS GROUPED BY PILLAR
    // =========================================================================
    const passedChecks = checks.filter((c) => c.status === 'PASS');
    doc.addPage();
    drawRunningHeader(doc, 'Passed Checks', domain);
    y = drawSectionHeading(doc, `Passed Checks — What's Working Well (${passedChecks.length})`, 48);

    const pillars = [
      { key: 'SEO', color: COLORS.emerald },
      { key: 'AEO', color: COLORS.purple },
      { key: 'GEO', color: COLORS.amber },
    ];

    for (const p of pillars) {
      const list = passedChecks.filter((c) => c.pillar === p.key);
      if (list.length === 0) continue;

      if (y + 44 > pageH - 46) {
        doc.addPage();
        drawRunningHeader(doc, 'Passed Checks (cont.)', domain);
        y = 44;
      }

      doc.rect(40, y, contentW, 20).fill(p.color);
      doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(9)
        .text(`${p.key} (${list.length} passed)`, 48, y + 5);
      y += 20;

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        doc.font('Helvetica').fontSize(7.8);
        const textH = doc.heightOfString(item.description || item.id, { width: contentW - 30 });
        const rowH = Math.max(17, textH + 7);

        if (y + rowH > pageH - 46) {
          doc.addPage();
          drawRunningHeader(doc, 'Passed Checks (cont.)', domain);
          y = 44;
          doc.rect(40, y, contentW, 18).fill(p.color);
          doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8.5)
            .text(`${p.key} (cont.)`, 48, y + 4);
          y += 18;
        }

        doc.rect(40, y, contentW, rowH).fill(i % 2 === 0 ? COLORS.white : COLORS.slate50);
        doc.moveTo(40, y + rowH).lineTo(40 + contentW, y + rowH).lineWidth(0.4).strokeColor(COLORS.slate200).stroke();

        doc.fillColor(COLORS.emerald).font('Helvetica-Bold').fontSize(8)
          .text('PASS', 46, y + 4, { width: 26 });
        doc.fillColor(COLORS.slate700).font('Helvetica').fontSize(7.8)
          .text(item.description || item.id, 76, y + 4, { width: contentW - 42 });
        y += rowH;
      }
      y += 12;
    }

    // =========================================================================
    // FINAL PAGE: PERFORMANCE RADAR & RECOMMENDED NEXT STEPS
    // =========================================================================
    doc.addPage();
    drawRunningHeader(doc, 'Summary & Next Steps', domain);
    y = drawSectionHeading(doc, 'Performance Radar', 48);

    drawRadarChart(doc, pageW / 2, y + 148, 108, report.radar || {
      Technical: 0,
      Content: 0,
      Schema: 0,
      Security: 0,
    });

    y += 326;
    y = drawSectionHeading(doc, 'Recommended Next Steps', y);

    const stepBoxY = y;
    doc.roundedRect(40, stepBoxY, contentW, 118, 10).fill('#F8FAFC');
    doc.roundedRect(40, stepBoxY, contentW, 118, 10).lineWidth(1).strokeColor(COLORS.brandBlue).stroke();

    const critAndHigh = (pCounts.CRITICAL || 0) + (pCounts.HIGH || 0);
    const nextSteps = [
      {
        num: '1',
        color: COLORS.amber,
        title: 'Fix Quick Wins First',
        body: critAndHigh > 0
          ? `Start with the ${critAndHigh} Critical & High priority issue(s) in this report, then re-scan immediately to verify your score lift.`
          : 'Your baseline is strong. Focus on Medium-priority AEO and GEO authority fixes to maximize AI citations.',
      },
      {
        num: '2',
        color: COLORS.purple,
        title: 'Track Your Progress',
        body: 'Export the CSV snapshot alongside this PDF so your engineering and marketing teams can track fixes sprint over sprint.',
      },
      {
        num: '3',
        color: COLORS.brandBlue,
        title: 'Verify Your Fixes',
        body: 'After deploying HTML, schema, or HTTP header changes, run a fresh live scan to confirm every updated check passes.',
      },
    ];

    const colW = (contentW - 40) / 3;
    nextSteps.forEach((st, idx) => {
      const sx = 54 + idx * (colW + 12);
      doc.roundedRect(sx, stepBoxY + 14, colW - 6, 90, 8).fill(COLORS.white);
      doc.circle(sx + 16, stepBoxY + 30, 9).fill(st.color);
      doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(9)
        .text(st.num, sx + 7, stepBoxY + 26, { width: 18, align: 'center' });
      doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(9)
        .text(st.title, sx + 30, stepBoxY + 25, { width: colW - 40 });
      doc.fillColor(COLORS.slate500).font('Helvetica').fontSize(8)
        .text(st.body, sx + 10, stepBoxY + 46, { width: colW - 26 });
    });

    // Branded closing footer block
    const footerBlockY = stepBoxY + 150;
    doc.moveTo(150, footerBlockY).lineTo(pageW - 150, footerBlockY).lineWidth(1).strokeColor(COLORS.brandBlue).stroke();
    doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(12)
      .text('Generated by VentureRush Tech SEO GEO AEO Checker', 40, footerBlockY + 14, { width: contentW, align: 'center' });
    doc.fillColor(COLORS.slate500).font('Helvetica').fontSize(8.5)
      .text(
        `SEO, GEO & AEO Website Audit Scanner  |  ${report.meta?.totalCheckDefinitions || checks.length} Live Checks`,
        40,
        footerBlockY + 32,
        { width: contentW, align: 'center' }
      );

    // =========================================================================
    // STAMP PAGE NUMBERS ON ALL PAGES
    // =========================================================================
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      const prevBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.save();
      doc.moveTo(40, pageH - 34).lineTo(pageW - 40, pageH - 34).lineWidth(0.5).strokeColor(COLORS.slate200).stroke();
      doc.fillColor(COLORS.slate400).font('Helvetica').fontSize(8)
        .text('VentureRush Tech · SEO GEO AEO Checker', 40, pageH - 24, { width: 260, lineBreak: false });
      doc.fillColor(COLORS.slate400).font('Helvetica').fontSize(8)
        .text(`Page ${i + 1} of ${range.count}`, pageW - 160, pageH - 24, { width: 120, align: 'right', lineBreak: false });
      doc.restore();
      doc.page.margins.bottom = prevBottomMargin;
    }

    doc.end();
  });
}

module.exports = { generatePdfBuffer };
