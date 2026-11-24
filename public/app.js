(() => {
  const state = {
    report: null,
    pillar: 'ALL',
    status: 'ALL',
    priority: 'ALL',
    search: '',
  };

  const els = {
    menuBtn: document.getElementById('menuBtn'),
    mobileDrawer: document.getElementById('mobileDrawer'),
    year: document.getElementById('year'),
    scanForm: document.getElementById('scanForm'),
    urlInput: document.getElementById('urlInput'),
    scanBtn: document.getElementById('scanBtn'),
    errorBanner: document.getElementById('errorBanner'),
    errorMessage: document.getElementById('errorMessage'),
    pillarsOverview: document.getElementById('pillarsOverview'),
    loadingSection: document.getElementById('loadingSection'),
    loadingUrl: document.getElementById('loadingUrl'),
    loaderBar: document.getElementById('loaderBar'),
    loaderStage: document.getElementById('loaderStage'),
    resultsSection: document.getElementById('resultsSection'),
    navPillarsLink: document.getElementById('navPillarsLink'),
    navResultsLink: document.getElementById('navResultsLink'),
    navChecksLink: document.getElementById('navChecksLink'),
    mobPillarsLink: document.getElementById('mobPillarsLink'),
    mobResultsLink: document.getElementById('mobResultsLink'),
    mobChecksLink: document.getElementById('mobChecksLink'),
    resHeadingDomain: document.getElementById('resHeadingDomain'),
    resDomain: document.getElementById('resDomain'),
    resGradePill: document.getElementById('resGradePill'),
    resMetaChips: document.getElementById('resMetaChips'),
    overallGradeBox: document.getElementById('overallGradeBox'),
    overallPassRateChip: document.getElementById('overallPassRateChip'),
    overallGaugeWrap: document.getElementById('overallGaugeWrap'),
    seoGaugeWrap: document.getElementById('seoGaugeWrap'),
    aeoGaugeWrap: document.getElementById('aeoGaugeWrap'),
    geoGaugeWrap: document.getElementById('geoGaugeWrap'),
    seoRatio: document.getElementById('seoRatio'),
    aeoRatio: document.getElementById('aeoRatio'),
    geoRatio: document.getElementById('geoRatio'),
    kpiStrip: document.getElementById('kpiStrip'),
    priorityGrid: document.getElementById('priorityGrid'),
    categoryBars: document.getElementById('categoryBars'),
    donutChartWrap: document.getElementById('donutChartWrap'),
    radarChartWrap: document.getElementById('radarChartWrap'),
    quickWinsList: document.getElementById('quickWinsList'),
    pillarTabs: document.getElementById('pillarTabs'),
    statusPills: document.getElementById('statusPills'),
    priorityFilter: document.getElementById('priorityFilter'),
    checkSearch: document.getElementById('checkSearch'),
    checksList: document.getElementById('checksList'),
    visibleCheckCount: document.getElementById('visibleCheckCount'),
    cntAll: document.getElementById('cntAll'),
    cntSeo: document.getElementById('cntSeo'),
    cntAeo: document.getElementById('cntAeo'),
    cntGeo: document.getElementById('cntGeo'),
    btnExportPdf: document.getElementById('btnExportPdf'),
    btnExportCsv: document.getElementById('btnExportCsv'),
    btnImproveNow: document.getElementById('btnImproveNow'),
    btnImproveBottom: document.getElementById('btnImproveBottom'),
    btnScanAnother: document.getElementById('btnScanAnother'),
  };

  let loaderTimer = null;

  // Dynamic Year
  if (els.year) {
    els.year.textContent = new Date().getFullYear();
  }

  // Mobile Drawer Toggle (Exact Reference Behavior)
  if (els.menuBtn && els.mobileDrawer) {
    els.menuBtn.addEventListener('click', () => {
      const open = els.mobileDrawer.classList.toggle('open');
      els.menuBtn.setAttribute('aria-expanded', String(open));
    });
    els.mobileDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        els.mobileDrawer.classList.remove('open');
        els.menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Smooth Cubic Counter Animation (Matching Reference Website)
  function animateCounter(el, targetVal, suffix = '') {
    const target = Number(targetVal) || 0;
    const duration = 950;
    const start = performance.now();
    if (el._raf) cancelAnimationFrame(el._raf);

    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (p < 1) {
        el._raf = requestAnimationFrame(step);
      }
    }
    el._raf = requestAnimationFrame(step);
  }

  // Smooth Stable Scroll Observer (threshold 0 ensures tall cards never stay hidden)
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: '0px 0px -12px 0px' }
  );

  function observeReveals(root = document) {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    root.querySelectorAll('.anim-reveal').forEach((el) => {
      if (!el.classList.contains('in-view')) {
        const rect = el.getBoundingClientRect();
        if (rect.height > vh * 0.85 || (rect.top < vh && rect.bottom > 0)) {
          el.classList.add('in-view');
        } else {
          revealObserver.observe(el);
        }
      }
    });
  }

  observeReveals();

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatWithGoogleBrand(str) {
    const safe = escapeHtml(str);
    return safe.replace(/(?<![./-])\b(google)\b(?!\.(?:com|org|dev|io))/gi, (word) => {
      const chars = word.split('');
      const classes = ['gb-b', 'gb-r', 'gb-y', 'gb-b', 'gb-g', 'gb-r'];
      const colored = chars.map((ch, idx) => `<span class="${classes[idx]}">${ch}</span>`).join('');
      return `<span class="google-brand">${colored}</span>`;
    });
  }

  function showError(msg) {
    els.errorMessage.textContent = msg;
    els.errorBanner.classList.remove('hidden');
  }

  function hideError() {
    els.errorBanner.classList.add('hidden');
  }

  function startLoadingAnimation(targetUrl) {
    const stages = [
      { pct: 20, text: 'Connecting to target server & capturing HTTP security headers...' },
      { pct: 46, text: 'Inspecting robots.txt, sitemap.xml, llms.txt & AI discovery endpoints...' },
      { pct: 72, text: 'Sampling internal links & parsing DOM, headings, and JSON-LD schema...' },
      { pct: 90, text: 'Evaluating all 224 SEO, AEO & GEO signals...' },
    ];
    let idx = 0;
    els.loadingUrl.textContent = targetUrl;
    els.loaderBar.style.width = `${stages[0].pct}%`;
    els.loaderStage.textContent = stages[0].text;

    clearInterval(loaderTimer);
    loaderTimer = setInterval(() => {
      idx = Math.min(stages.length - 1, idx + 1);
      els.loaderBar.style.width = `${stages[idx].pct}%`;
      els.loaderStage.textContent = stages[idx].text;
    }, 850);
  }

  function stopLoadingAnimation() {
    clearInterval(loaderTimer);
    els.loaderBar.style.width = '100%';
  }

  // --- SVG Meter Renderers (Dark Navy Crystal Glass Optimized) ---
  function renderSpeedometerSvg(score) {
    const clamped = Math.max(0, Math.min(100, Number(score) || 0));
    const r = 82;
    const cx = 110;
    const cy = 104;
    const semiCircumference = Math.PI * r;
    const targetOffset = semiCircumference * (1 - clamped / 100);
    const targetNeedleDeg = -90 + (clamped / 100) * 180;

    return `
      <svg viewBox="0 0 220 132" width="100%" role="img" aria-label="Overall Score ${clamped} out of 100">
        <defs>
          <linearGradient id="overallGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#F87171" />
            <stop offset="48%" stop-color="#FBBF24" />
            <stop offset="100%" stop-color="#34D399" />
          </linearGradient>
        </defs>
        <path
          d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}"
          fill="none"
          stroke="rgba(255, 255, 255, 0.14)"
          stroke-width="14"
          stroke-linecap="round"
        />
        <path
          class="svg-meter-arc"
          data-target-offset="${targetOffset.toFixed(2)}"
          d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}"
          fill="none"
          stroke="url(#overallGrad)"
          stroke-width="14"
          stroke-linecap="round"
          stroke-dasharray="${semiCircumference.toFixed(2)}"
          stroke-dashoffset="${semiCircumference.toFixed(2)}"
          style="transition: stroke-dashoffset 1.15s cubic-bezier(0.16, 1, 0.3, 1);"
        />
        <g class="svg-meter-needle" data-target-deg="${targetNeedleDeg.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})" style="transition: transform 1.15s cubic-bezier(0.16, 1, 0.3, 1);">
          <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 64}" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" />
        </g>
        <circle cx="${cx}" cy="${cy}" r="7.5" fill="#8AC0FF" />
        <circle cx="${cx}" cy="${cy}" r="3.2" fill="#0A1633" />
        <text class="svg-meter-num" data-target="${clamped}" x="${cx}" y="${cy - 22}" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="35" font-weight="800" fill="#FFFFFF">0</text>
        <text x="${cx}" y="${cy + 22}" text-anchor="middle" font-size="11" font-weight="600" fill="rgba(218,232,255,0.8)">Overall Score</text>
        <text x="${cx - r}" y="${cy + 22}" text-anchor="middle" font-size="11" font-weight="700" fill="rgba(218,232,255,0.55)">0</text>
        <text x="${cx + r}" y="${cy + 22}" text-anchor="middle" font-size="11" font-weight="700" fill="rgba(218,232,255,0.55)">100</text>
      </svg>
    `;
  }

  function renderRingGaugeSvg(score, color, label) {
    const clamped = Math.max(0, Math.min(100, Number(score) || 0));
    const r = 52;
    const cx = 66;
    const cy = 66;
    const circ = 2 * Math.PI * r;
    const targetOffset = circ * (1 - clamped / 100);

    return `
      <svg viewBox="0 0 132 132" width="100%" height="100%" role="img" aria-label="${label} Score ${clamped} out of 100">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255, 255, 255, 0.14)" stroke-width="11" />
        <circle
          class="svg-meter-arc"
          data-target-offset="${targetOffset.toFixed(2)}"
          cx="${cx}" cy="${cy}" r="${r}"
          fill="none"
          stroke="${color}"
          stroke-width="11"
          stroke-linecap="round"
          stroke-dasharray="${circ.toFixed(2)}"
          stroke-dashoffset="${circ.toFixed(2)}"
          transform="rotate(-90 ${cx} ${cy})"
          style="transition: stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1);"
        />
        <text class="svg-meter-num" data-target="${clamped}" x="${cx}" y="${cy + 6}" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="34" font-weight="800" fill="#FFFFFF">0</text>
        <text x="${cx}" y="${cy + 25}" text-anchor="middle" font-size="12.5" font-weight="700" fill="rgba(218,232,255,0.68)">/ 100</text>
      </svg>
    `;
  }

  function animateMetersInStage() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        els.resultsSection.querySelectorAll('.svg-meter-arc').forEach((el) => {
          el.setAttribute('stroke-dashoffset', el.dataset.targetOffset);
        });
        els.resultsSection.querySelectorAll('.svg-meter-needle').forEach((el) => {
          el.setAttribute('transform', `rotate(${el.dataset.targetDeg} 110 104)`);
        });
        els.resultsSection.querySelectorAll('.svg-meter-num').forEach((el) => {
          animateCounter(el, el.dataset.target);
        });
        els.kpiStrip.querySelectorAll('.kpi-val').forEach((el) => {
          animateCounter(el, el.dataset.target, el.dataset.suffix || '');
        });
      });
    });
  }

  function renderDonutChart(passed, failed, na) {
    const total = Math.max(1, passed + failed + na);
    const r = 54;
    const cx = 75;
    const cy = 75;
    const circ = 2 * Math.PI * r;

    const passLen = (passed / total) * circ;
    const failLen = (failed / total) * circ;
    const naLen = (na / total) * circ;

    return `
      <svg viewBox="0 0 150 150" width="154" height="154" role="img" aria-label="Check distribution">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="20" />
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#10B981" stroke-width="20"
          stroke-dasharray="${passLen.toFixed(2)} ${circ.toFixed(2)}"
          stroke-dashoffset="0" transform="rotate(-90 ${cx} ${cy})" />
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#EF4444" stroke-width="20"
          stroke-dasharray="${failLen.toFixed(2)} ${circ.toFixed(2)}"
          stroke-dashoffset="${(-passLen).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" />
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#CBD5E1" stroke-width="20"
          stroke-dasharray="${naLen.toFixed(2)} ${circ.toFixed(2)}"
          stroke-dashoffset="${(-(passLen + failLen)).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" />
        <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="24" font-weight="800" fill="#0A1633">${passed}</text>
        <text x="${cx}" y="${cy + 20}" text-anchor="middle" font-size="10.5" font-weight="600" fill="#7183A6">Passed</text>
      </svg>
      <div class="donut-legend">
        <span class="legend-item"><span class="legend-swatch" style="background:#10B981"></span>Passed: ${passed}</span>
        <span class="legend-item"><span class="legend-swatch" style="background:#EF4444"></span>Failed: ${failed}</span>
        <span class="legend-item"><span class="legend-swatch" style="background:#CBD5E1"></span>N/A: ${na}</span>
      </div>
    `;
  }

  function renderRadarChart(radar) {
    const cx = 132;
    const cy = 98;
    const r = 62;
    const t = Math.max(8, Number(radar.Technical) || 0) / 100;
    const c = Math.max(8, Number(radar.Content) || 0) / 100;
    const s = Math.max(8, Number(radar.Schema) || 0) / 100;
    const sec = Math.max(8, Number(radar.Security) || 0) / 100;

    const pTop = `${cx},${(cy - r * t).toFixed(1)}`;
    const pRight = `${(cx + r * c).toFixed(1)},${cy}`;
    const pBottom = `${cx},${(cy + r * s).toFixed(1)}`;
    const pLeft = `${(cx - r * sec).toFixed(1)},${cy}`;

    const ring = (f) =>
      `${cx},${cy - r * f} ${cx + r * f},${cy} ${cx},${cy + r * f} ${cx - r * f},${cy}`;

    return `
      <svg viewBox="0 0 264 200" width="250" height="190" role="img" aria-label="Performance radar">
        ${[0.25, 0.5, 0.75, 1]
          .map((f) => `<polygon points="${ring(f)}" fill="none" stroke="#CBD5E1" stroke-width="${f === 1 ? 1.2 : 0.7}" />`)
          .join('')}
        <line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}" stroke="#CBD5E1" stroke-width="0.8" />
        <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="#CBD5E1" stroke-width="0.8" />
        <polygon points="${pTop} ${pRight} ${pBottom} ${pLeft}" fill="rgba(59, 115, 232, 0.2)" stroke="#3B73E8" stroke-width="2.2" />
        <circle cx="${cx}" cy="${(cy - r * t).toFixed(1)}" r="4.2" fill="#3B73E8" />
        <circle cx="${(cx + r * c).toFixed(1)}" cy="${cy}" r="4.2" fill="#3B73E8" />
        <circle cx="${cx}" cy="${(cy + r * s).toFixed(1)}" r="4.2" fill="#3B73E8" />
        <circle cx="${(cx - r * sec).toFixed(1)}" cy="${cy}" r="4.2" fill="#3B73E8" />
        <text x="${cx}" y="14" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="700" fill="#0A1633">Technical</text>
        <text x="${cx}" y="27" text-anchor="middle" font-size="10" fill="#7183A6">${radar.Technical ?? 0}%</text>
        <text x="${cx + r + 10}" y="${cy - 2}" text-anchor="start" font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="700" fill="#0A1633">Content</text>
        <text x="${cx + r + 10}" y="${cy + 12}" text-anchor="start" font-size="10" fill="#7183A6">${radar.Content ?? 0}%</text>
        <text x="${cx}" y="${cy + r + 16}" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="700" fill="#0A1633">Schema</text>
        <text x="${cx}" y="${cy + r + 29}" text-anchor="middle" font-size="10" fill="#7183A6">${radar.Schema ?? 0}%</text>
        <text x="${cx - r - 10}" y="${cy - 2}" text-anchor="end" font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="700" fill="#0A1633">Security</text>
        <text x="${cx - r - 10}" y="${cy + 12}" text-anchor="end" font-size="10" fill="#7183A6">${radar.Security ?? 0}%</text>
      </svg>
    `;
  }

  function openWhatsAppImprove() {
    if (!state.report) return;
    const { scores, meta } = state.report;
    const websiteUrl = meta?.url || meta?.domain || '';
    const message = [
      'Hi VentureRush Tech,',
      'Here my S.G.A Checker result:',
      `SEO = ${scores?.seo ?? 0}/100`,
      `GEO = ${scores?.geo ?? 0}/100`,
      `AEO = ${scores?.aeo ?? 0}/100`,
      `Overall Score Meter = ${scores?.overall ?? 0}/100`,
      '',
      `Please help me improve my website = ${websiteUrl}`,
    ].join('\n');

    const waUrl = `https://wa.me/601160801477?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  function renderReport(report) {
    state.report = report;
    state.pillar = 'ALL';
    state.status = 'ALL';
    state.priority = 'ALL';
    state.search = '';
    els.priorityFilter.value = 'ALL';
    els.checkSearch.value = '';
    syncFilterButtons();

    // Update Nav links to jump to Results & Checks
    els.navResultsLink?.classList.remove('hidden');
    els.navChecksLink?.classList.remove('hidden');
    els.mobResultsLink?.classList.remove('hidden');
    els.mobChecksLink?.classList.remove('hidden');
    els.navPillarsLink?.classList.add('hidden');
    els.mobPillarsLink?.classList.add('hidden');

    // Header bar
    els.resHeadingDomain.textContent = report.meta.domain;
    els.resDomain.textContent = report.meta.domain;
    els.resGradePill.textContent = `Grade ${report.scores.grade}`;
    els.overallGradeBox.textContent = report.scores.grade;
    els.overallPassRateChip.textContent = `${report.summary.passRate}% pass`;

    els.resMetaChips.innerHTML = [
      `HTTP ${report.meta.statusCode}`,
      `${report.meta.responseTimeMs} ms load`,
      `${report.meta.pageSizeKb} KB HTML`,
      `${report.meta.wordCount.toLocaleString()} words`,
      `Scanned ${report.meta.scanDateFormatted}`,
    ]
      .map((chip) => `<span class="meta-chip">${escapeHtml(chip)}</span>`)
      .join('');

    // 4 Core Meters
    els.overallGaugeWrap.innerHTML = renderSpeedometerSvg(report.scores.overall);
    els.seoGaugeWrap.innerHTML = renderRingGaugeSvg(report.scores.seo, '#34D399', 'SEO');
    els.aeoGaugeWrap.innerHTML = renderRingGaugeSvg(report.scores.aeo, '#A78BFA', 'AEO');
    els.geoGaugeWrap.innerHTML = renderRingGaugeSvg(report.scores.geo, '#FBBF24', 'GEO');

    els.seoRatio.textContent = `${report.summary.seo.passed}/${report.summary.seo.total} passed`;
    els.aeoRatio.textContent = `${report.summary.aeo.passed}/${report.summary.aeo.total} passed`;
    els.geoRatio.textContent = `${report.summary.geo.passed}/${report.summary.geo.total} passed`;

    // 5 KPI Glass Cards
    const kpis = [
      { label: 'Total Checks', val: report.summary.totalExecuted, suffix: '', color: '#8AC0FF' },
      { label: 'Passed', val: report.summary.passed, suffix: '', color: '#34D399' },
      { label: 'Failed', val: report.summary.failed, suffix: '', color: '#F87171' },
      { label: 'Quick Wins', val: report.summary.quickWinsCount, suffix: '', color: '#FBBF24' },
      { label: 'Pass Rate', val: report.summary.passRate, suffix: '%', color: '#FFFFFF' },
    ];
    els.kpiStrip.innerHTML = kpis
      .map(
        (k) => `
        <div class="kpi-glass">
          <div class="kpi-val" data-target="${k.val}" data-suffix="${k.suffix}" style="color:${k.color}">0${k.suffix}</div>
          <div class="kpi-label">${escapeHtml(k.label)}</div>
        </div>`
      )
      .join('');

    // Priority Distribution
    const p = report.summary.priorities;
    els.priorityGrid.innerHTML = [
      { key: 'CRITICAL', label: 'Critical', cls: 'p-critical', val: p.CRITICAL },
      { key: 'HIGH', label: 'High', cls: 'p-high', val: p.HIGH },
      { key: 'MEDIUM', label: 'Medium', cls: 'p-medium', val: p.MEDIUM },
      { key: 'LOW', label: 'Low', cls: 'p-low', val: p.LOW },
    ]
      .map(
        (item) => `
        <button type="button" class="priority-card ${item.cls}" data-jump-priority="${item.key}">
          <div class="p-count">${item.val}</div>
          <div class="p-name">${item.label}</div>
        </button>`
      )
      .join('');

    els.priorityGrid.querySelectorAll('[data-jump-priority]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.status = 'FAIL';
        state.priority = btn.dataset.jumpPriority;
        els.priorityFilter.value = state.priority;
        syncFilterButtons();
        renderChecksList();
        document.getElementById('checksExplorer').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Category Breakdown Bars
    els.categoryBars.innerHTML = report.categoryBreakdown
      .map(
        (c) => `
        <div class="cat-row">
          <span class="cat-name">${escapeHtml(c.category)}</span>
          <div class="cat-track">
            <div class="cat-fill" style="width:${c.passRate}%"></div>
          </div>
          <span class="cat-ratio">${c.passed}/${c.total}</span>
        </div>`
      )
      .join('');

    // Donut & Radar Charts
    els.donutChartWrap.innerHTML = renderDonutChart(
      report.summary.passed,
      report.summary.failed,
      report.summary.na
    );
    els.radarChartWrap.innerHTML = renderRadarChart(report.radar);

    // Quick Wins
    if (!report.quickWins || report.quickWins.length === 0) {
      els.quickWinsList.innerHTML = `
        <div class="qw-card" style="grid-column: 1 / -1; border-left-color: #10B981; background: #ECFDF5;">
          <p class="qw-title" style="color:#065F46; margin:0;">No Critical or High-priority issues found! Your technical and AI readiness foundation is strong.</p>
        </div>`;
    } else {
      els.quickWinsList.innerHTML = report.quickWins
        .map(
          (qw) => `
          <div class="qw-card sev-${escapeHtml(qw.priority)}">
            <div class="qw-top">
              <span class="badge-prio pr-${escapeHtml(qw.priority)}">${escapeHtml(qw.priority)}</span>
              <span class="badge-pillar bp-${escapeHtml(qw.pillar)}">${escapeHtml(qw.pillar)}</span>
              <span class="code-id">${escapeHtml(qw.id)}</span>
            </div>
            <h4 class="qw-title">${formatWithGoogleBrand(qw.description)}</h4>
            <p class="qw-impact"><strong>Impact:</strong> ${formatWithGoogleBrand(qw.impact)}</p>
            <p class="qw-fix"><strong>How to Fix:</strong> ${formatWithGoogleBrand(qw.howToFix)}</p>
          </div>`
        )
        .join('');
    }

    // Tab counts
    els.cntAll.textContent = report.checks.length;
    els.cntSeo.textContent = report.checks.filter((c) => c.pillar === 'SEO').length;
    els.cntAeo.textContent = report.checks.filter((c) => c.pillar === 'AEO').length;
    els.cntGeo.textContent = report.checks.filter((c) => c.pillar === 'GEO').length;

    renderChecksList();

    els.pillarsOverview.classList.add('hidden');
    els.resultsSection.classList.remove('hidden');

    // Reset & re-observe scroll reveals inside results section
    els.resultsSection.querySelectorAll('.anim-reveal').forEach((el) => {
      el.classList.remove('in-view');
    });
    observeReveals(els.resultsSection);
    animateMetersInStage();

    els.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function syncFilterButtons() {
    els.pillarTabs.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.pillar === state.pillar);
    });
    els.statusPills.querySelectorAll('.status-pill').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.status === state.status);
    });
  }

  function renderChecksList() {
    if (!state.report) return;
    const q = state.search.trim().toLowerCase();
    const filtered = state.report.checks.filter((c) => {
      if (state.pillar !== 'ALL' && c.pillar !== state.pillar) return false;
      if (state.status !== 'ALL' && c.status !== state.status) return false;
      if (state.priority !== 'ALL' && c.priority !== state.priority) return false;
      if (q) {
        const hay = `${c.id} ${c.pillar} ${c.subCategory} ${c.description} ${c.impact} ${c.howToFix}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    els.visibleCheckCount.textContent = filtered.length;

    if (filtered.length === 0) {
      els.checksList.innerHTML = `<div class="empty-state">No checks match your current filters.</div>`;
      return;
    }

    els.checksList.innerHTML = filtered
      .map((c) => {
        const statusCls = c.status === 'PASS' ? 'st-PASS' : c.status === 'FAIL' ? 'st-FAIL' : 'st-NA';
        return `
          <div class="check-item">
            <button type="button" class="check-summary" aria-expanded="false">
              <div class="check-left">
                <span class="status-badge ${statusCls}">${escapeHtml(c.status)}</span>
                <div class="check-body">
                  <div class="check-desc">${formatWithGoogleBrand(c.description)}</div>
                  <div class="check-tags">
                    <span class="code-id">${escapeHtml(c.id)}</span>
                    <span class="badge-pillar bp-${escapeHtml(c.pillar)}">${escapeHtml(c.pillar)}</span>
                    <span class="badge-cat">${escapeHtml(c.subCategory)}</span>
                    <span class="badge-prio pr-${escapeHtml(c.priority)}">${escapeHtml(c.priority)}</span>
                  </div>
                </div>
              </div>
              <span class="faq-toggle-ico" aria-hidden="true">+</span>
            </button>
            <div class="check-details">
              <div class="detail-block">
                <h4>Business Impact</h4>
                <p>${formatWithGoogleBrand(c.impact)}</p>
              </div>
              <div class="detail-block fix-block">
                <h4>How to Fix</h4>
                <p>${formatWithGoogleBrand(c.howToFix)}</p>
              </div>
            </div>
          </div>`;
      })
      .join('');

    els.checksList.querySelectorAll('.check-summary').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.check-item');
        const isOpen = card.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });
    });
  }

  async function runScan(rawUrl) {
    hideError();
    const cleaned = (rawUrl || '').trim();
    if (!cleaned) {
      showError('Please enter a website URL to scan.');
      els.urlInput.focus();
      return;
    }

    els.scanBtn.disabled = true;
    els.resultsSection.classList.add('hidden');
    els.loadingSection.classList.remove('hidden');
    els.loadingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    startLoadingAnimation(cleaned);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleaned }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to complete the scan.');
      }

      stopLoadingAnimation();
      els.loadingSection.classList.add('hidden');
      try {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('scanUrl', cleaned);
        window.history.replaceState(null, '', `${nextUrl.pathname}${nextUrl.search}`);
      } catch {
        // ignore history errors
      }
      renderReport(data);
    } catch (err) {
      stopLoadingAnimation();
      els.loadingSection.classList.add('hidden');
      showError(err.message || 'Scan failed. Please check the URL and try again.');
    } finally {
      els.scanBtn.disabled = false;
    }
  }

  async function triggerExport(endpoint, buttonEl, fallbackFilename) {
    if (!state.report) return;
    const origHtml = buttonEl.innerHTML;
    buttonEl.disabled = true;
    const labelSpan = buttonEl.querySelector('span');
    if (labelSpan) labelSpan.textContent = 'Generating...';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: state.report }),
      });

      if (!res.ok) {
        throw new Error('Export failed.');
      }

      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const match = /filename="([^"]+)"/i.exec(cd);
      const filename = match ? match[1] : fallbackFilename;

      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(dlUrl), 3000);
    } catch (err) {
      showError(err.message || 'Could not export report.');
    } finally {
      buttonEl.disabled = false;
      buttonEl.innerHTML = origHtml;
    }
  }

  // Event Listeners
  els.scanForm.addEventListener('submit', (e) => {
    e.preventDefault();
    runScan(els.urlInput.value);
  });

  document.querySelectorAll('.example-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      els.urlInput.value = chip.dataset.url;
      runScan(chip.dataset.url);
    });
  });

  els.pillarTabs.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.pillar = btn.dataset.pillar;
      syncFilterButtons();
      renderChecksList();
    });
  });

  els.statusPills.querySelectorAll('.status-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.status = btn.dataset.status;
      syncFilterButtons();
      renderChecksList();
    });
  });

  els.priorityFilter.addEventListener('change', () => {
    state.priority = els.priorityFilter.value;
    renderChecksList();
  });

  els.checkSearch.addEventListener('input', () => {
    state.search = els.checkSearch.value;
    renderChecksList();
  });

  els.btnExportPdf.addEventListener('click', () => {
    const domain = state.report?.meta?.domain || 'website';
    const date = state.report?.meta?.scanDate || 'report';
    triggerExport('/api/export/pdf', els.btnExportPdf, `VentureRush-SEO-AEO-GEO-Report-${domain}-${date}.pdf`);
  });

  els.btnExportCsv.addEventListener('click', () => {
    const domain = state.report?.meta?.domain || 'website';
    const date = state.report?.meta?.scanDate || 'report';
    triggerExport('/api/export/csv', els.btnExportCsv, `venturerush-seo-aeo-geo-report-${domain}-${date}.csv`);
  });

  els.btnImproveNow.addEventListener('click', openWhatsAppImprove);
  els.btnImproveBottom?.addEventListener('click', openWhatsAppImprove);

  const navImproveCta = document.getElementById('navImproveCta');
  if (navImproveCta) {
    navImproveCta.addEventListener('click', (e) => {
      if (state.report) {
        e.preventDefault();
        openWhatsAppImprove();
      }
    });
  }

  els.btnScanAnother?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => els.urlInput.focus(), 450);
  });

  // Auto-scan when opened with ?scanUrl=<website> (also accepts ?scanurl= or ?url=)
  (function initAutoScanFromQuery() {
    try {
      const params = new URLSearchParams(window.location.search);
      const target = (
        params.get('scanUrl') ||
        params.get('scanurl') ||
        params.get('url') ||
        ''
      ).trim();

      if (target) {
        els.urlInput.value = target;
        runScan(target);
      }
    } catch {
      // ignore malformed query string
    }
  })();
})();
