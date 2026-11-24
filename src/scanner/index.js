const { fetchMainPage, fetchAuxResources, checkSampledInternalLinks } = require('./fetcher');
const { buildScanContext } = require('./context');
const { runSeoChecks } = require('./checks-seo');
const { runAeoChecks } = require('./checks-aeo');
const { runGeoChecks } = require('./checks-geo');

const PRIORITY_WEIGHTS = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const PRIORITY_ORDER = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function computeWeightedScore(checks) {
  let earned = 0;
  let max = 0;
  let passed = 0;
  let failed = 0;
  let na = 0;

  for (const c of checks) {
    if (c.status === 'N/A') {
      na++;
      continue;
    }
    const w = PRIORITY_WEIGHTS[c.priority] || 1;
    max += w;
    if (c.status === 'PASS') {
      earned += w;
      passed++;
    } else {
      failed++;
    }
  }

  const scorableTotal = passed + failed;
  const score = max > 0 ? Math.round((earned / max) * 100) : 0;
  return { score, passed, failed, na, total: scorableTotal, allCount: checks.length };
}

function getGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function buildCategoryBreakdown(allChecks) {
  const order = ['Other', 'GEO', 'AEO', 'Technical', 'Social', 'Meta', 'Content', 'Security', 'Schema'];
  const map = new Map();
  for (const name of order) {
    map.set(name, { category: name, passed: 0, failed: 0, na: 0, total: 0, passRate: 0 });
  }

  for (const c of allChecks) {
    const key = map.has(c.subCategory) ? c.subCategory : 'Other';
    const entry = map.get(key);
    if (c.status === 'N/A') {
      entry.na++;
    } else {
      entry.total++;
      if (c.status === 'PASS') entry.passed++;
      else entry.failed++;
    }
  }

  const list = [];
  for (const entry of map.values()) {
    if (entry.total > 0) {
      entry.passRate = Math.round((entry.passed / entry.total) * 100);
      list.push(entry);
    }
  }
  return list;
}

function buildRadarMetrics(allChecks) {
  const buckets = ['Technical', 'Content', 'Schema', 'Security'];
  const out = {};
  for (const bucket of buckets) {
    const items = allChecks.filter((c) => c.subCategory === bucket && c.status !== 'N/A');
    const passed = items.filter((c) => c.status === 'PASS').length;
    out[bucket] = items.length > 0 ? Math.round((passed / items.length) * 100) : 0;
  }
  return out;
}

async function scanWebsite(rawUrl) {
  const scanStart = Date.now();
  const page = await fetchMainPage(rawUrl);

  // Build preliminary context once to gather internal links, while fetching aux resources in parallel
  const preliminaryCtx = buildScanContext(page, {
    robots: {
      exists: false,
      sitemaps: [],
      wildcardBlocked: false,
      blockedAiCrawlers: [],
      allowedSearchAiCrawlers: [],
      totalSearchAiCrawlers: 6,
      blockedGeoBots: [],
    },
    sitemap: { exists: false, valid: false, urlCount: 0 },
    llmsTxt: { exists: false },
    aiDiscovery: { found: false, files: [] },
    indexNowFound: false,
    sampledLinks: { checked: 0, working: 0, broken: [] },
  });

  const [auxResources, sampledLinks] = await Promise.all([
    fetchAuxResources(page.origin, page.html),
    checkSampledInternalLinks(preliminaryCtx.internalLinks),
  ]);

  preliminaryCtx.aux = {
    ...auxResources,
    sampledLinks,
  };

  const seoChecks = runSeoChecks(preliminaryCtx);
  const aeoChecks = runAeoChecks(preliminaryCtx);
  const geoChecks = runGeoChecks(preliminaryCtx);

  const allChecks = [...seoChecks, ...aeoChecks, ...geoChecks];

  const seoStats = computeWeightedScore(seoChecks);
  const aeoStats = computeWeightedScore(aeoChecks);
  const geoStats = computeWeightedScore(geoChecks);

  const overallScore = Math.round((seoStats.score + aeoStats.score + geoStats.score) / 3);
  const grade = getGrade(overallScore);

  const totalPassed = seoStats.passed + aeoStats.passed + geoStats.passed;
  const totalFailed = seoStats.failed + aeoStats.failed + geoStats.failed;
  const totalNa = seoStats.na + aeoStats.na + geoStats.na;
  const totalScorable = totalPassed + totalFailed;
  const passRate = totalScorable > 0 ? Math.round((totalPassed / totalScorable) * 100) : 0;

  const failedChecks = allChecks
    .filter((c) => c.status === 'FAIL')
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));

  const priorityCounts = {
    CRITICAL: failedChecks.filter((c) => c.priority === 'CRITICAL').length,
    HIGH: failedChecks.filter((c) => c.priority === 'HIGH').length,
    MEDIUM: failedChecks.filter((c) => c.priority === 'MEDIUM').length,
    LOW: failedChecks.filter((c) => c.priority === 'LOW').length,
  };

  const quickWins = failedChecks
    .filter((c) => c.priority === 'CRITICAL' || c.priority === 'HIGH')
    .slice(0, 6);

  const categoryBreakdown = buildCategoryBreakdown(allChecks);
  const radar = buildRadarMetrics(allChecks);

  const now = new Date();
  const scanDateIso = now.toISOString().slice(0, 10);
  const scanDateFormatted = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    meta: {
      domain: page.hostname.replace(/^www\./, ''),
      url: page.finalUrl,
      statusCode: page.statusCode,
      responseTimeMs: page.responseTimeMs,
      totalScanTimeMs: Date.now() - scanStart,
      pageSizeKb: Math.round(page.htmlBytes / 1024),
      wordCount: preliminaryCtx.wordCount,
      title: preliminaryCtx.title || page.hostname,
      scanDate: scanDateIso,
      scanDateFormatted,
      totalCheckDefinitions: allChecks.length,
    },
    scores: {
      overall: overallScore,
      grade,
      seo: seoStats.score,
      aeo: aeoStats.score,
      geo: geoStats.score,
    },
    summary: {
      totalChecks: totalScorable,
      totalExecuted: allChecks.length,
      passed: totalPassed,
      failed: totalFailed,
      na: totalNa,
      passRate,
      quickWinsCount: quickWins.length,
      seo: seoStats,
      aeo: aeoStats,
      geo: geoStats,
      priorities: priorityCounts,
    },
    quickWins,
    categoryBreakdown,
    radar,
    checks: allChecks,
  };
}

module.exports = { scanWebsite };
