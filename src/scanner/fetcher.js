const dns = require('dns').promises;
const net = require('net');

const DEFAULT_UA =
  'Mozilla/5.0 (compatible; VentureRushSEOBot/1.0; +https://venturerushtech.com)';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const AI_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'PerplexityBot',
  'Google-Extended',
  'OAI-SearchBot',
  'ChatGPT-User',
  'CCBot',
  'anthropic-ai',
  'Bytespider',
  'Applebot-Extended',
];

const CORE_SEARCH_AI_CRAWLERS = [
  'OAI-SearchBot',
  'GPTBot',
  'ChatGPT-User',
  'PerplexityBot',
  'ClaudeBot',
  'Google-Extended',
];

function isPrivateIp(ip) {
  if (!ip) return true;
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    if (lower.startsWith('fe80')) return true;
    if (lower.startsWith('::ffff:')) {
      return isPrivateIp(lower.replace('::ffff:', ''));
    }
    return false;
  }
  return false;
}

async function normalizeAndValidateUrl(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    throw new Error('Please enter a valid website URL.');
  }

  let trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Please enter a valid website URL.');
  }

  const hadExplicitProtocol = /^https?:\/\//i.test(trimmed);
  if (!hadExplicitProtocol) {
    trimmed = `https://${trimmed}`;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL format. Example: https://venturerushtech.com');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS websites can be scanned.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    !hostname.includes('.')
  ) {
    throw new Error('Please enter a public website domain (e.g. example.com).');
  }

  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    throw new Error('Private or local network addresses cannot be scanned.');
  }

  try {
    const resolved = await dns.lookup(hostname, { all: true });
    if (resolved.some((r) => isPrivateIp(r.address))) {
      throw new Error('Target domain resolves to a private network address.');
    }
  } catch (err) {
    if (err.message && err.message.includes('private')) throw err;
    throw new Error(`Could not resolve domain "${hostname}". Please check the URL.`);
  }

  return {
    url: parsed.href,
    hadExplicitProtocol,
    hostname,
    origin: parsed.origin,
  };
}

async function safeFetch(url, options = {}) {
  const {
    method = 'GET',
    timeoutMs = 10000,
    userAgent = DEFAULT_UA,
    accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  } = options;

  const response = await fetch(url, {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'User-Agent': userAgent,
      Accept: accept,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
    },
  });

  return response;
}

async function fetchMainPage(rawInput) {
  const validated = await normalizeAndValidateUrl(rawInput);
  const startTime = Date.now();
  let response;
  let usedUrl = validated.url;

  try {
    response = await safeFetch(usedUrl, { timeoutMs: 15000, userAgent: BROWSER_UA });
    if (response.status === 403 || response.status === 406 || response.status === 429) {
      response = await safeFetch(usedUrl, { timeoutMs: 15000, userAgent: DEFAULT_UA });
    }
  } catch (err) {
    if (!validated.hadExplicitProtocol && usedUrl.startsWith('https://')) {
      usedUrl = usedUrl.replace(/^https:\/\//i, 'http://');
      response = await safeFetch(usedUrl, { timeoutMs: 15000, userAgent: BROWSER_UA });
    } else {
      throw new Error(
        `Unable to reach ${validated.hostname}: ${err.cause?.message || err.message || 'Connection failed'}`
      );
    }
  }

  const html = await response.text();
  const responseTimeMs = Date.now() - startTime;

  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const finalUrl = response.url || usedUrl;
  const finalParsed = new URL(finalUrl);

  return {
    initialUrl: validated.url,
    finalUrl,
    origin: finalParsed.origin,
    hostname: finalParsed.hostname.toLowerCase(),
    pathname: finalParsed.pathname,
    statusCode: response.status,
    responseTimeMs,
    headers,
    html,
    htmlBytes: Buffer.byteLength(html, 'utf8'),
    contentType: headers['content-type'] || '',
  };
}

function parseRobotsTxt(text) {
  const lines = text.split(/\r?\n/);
  const rulesByAgent = new Map();
  const sitemaps = [];
  let currentAgents = [];

  for (const rawLine of lines) {
    const line = rawLine.split('#')[0].trim();
    if (!line) {
      continue;
    }
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const directive = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (directive === 'user-agent') {
      const agent = value.toLowerCase();
      if (currentAgents.length === 0 || rulesByAgent.has(currentAgents[currentAgents.length - 1]) && rulesByAgent.get(currentAgents[currentAgents.length - 1])._hasRules) {
        currentAgents = [agent];
      } else {
        currentAgents.push(agent);
      }
      if (!rulesByAgent.has(agent)) {
        rulesByAgent.set(agent, { allow: [], disallow: [], _hasRules: false });
      }
    } else if (directive === 'disallow' || directive === 'allow') {
      if (currentAgents.length === 0) {
        currentAgents = ['*'];
        if (!rulesByAgent.has('*')) {
          rulesByAgent.set('*', { allow: [], disallow: [], _hasRules: false });
        }
      }
      for (const agent of currentAgents) {
        const entry = rulesByAgent.get(agent);
        if (entry) {
          entry[directive].push(value);
          entry._hasRules = true;
        }
      }
    } else if (directive === 'sitemap' && value) {
      sitemaps.push(value);
    }
  }

  const isBotBlocked = (botName) => {
    const key = botName.toLowerCase();
    const specific = rulesByAgent.get(key);
    if (specific) {
      const blocksAll = specific.disallow.some((d) => d === '/' || d === '/*');
      const allowsAll = specific.allow.some((a) => a === '/' || a === '/*');
      return blocksAll && !allowsAll;
    }
    const wildcard = rulesByAgent.get('*');
    if (wildcard) {
      const blocksAll = wildcard.disallow.some((d) => d === '/' || d === '/*');
      const allowsAll = wildcard.allow.some((a) => a === '/' || a === '/*');
      return blocksAll && !allowsAll;
    }
    return false;
  };

  const wildcardBlocked = isBotBlocked('*');
  const blockedAiCrawlers = AI_CRAWLERS.filter((bot) => isBotBlocked(bot));
  const allowedSearchAiCrawlers = CORE_SEARCH_AI_CRAWLERS.filter((bot) => !isBotBlocked(bot));
  const coreGeoBots = ['GPTBot', 'ClaudeBot', 'PerplexityBot'];
  const blockedGeoBots = coreGeoBots.filter((bot) => isBotBlocked(bot));

  return {
    sitemaps,
    wildcardBlocked,
    blockedAiCrawlers,
    allowedSearchAiCrawlers,
    totalSearchAiCrawlers: CORE_SEARCH_AI_CRAWLERS.length,
    blockedGeoBots,
    coreGeoBots,
  };
}

async function fetchRobotsTxt(origin) {
  try {
    const res = await safeFetch(`${origin}/robots.txt`, {
      timeoutMs: 5000,
      userAgent: BROWSER_UA,
      accept: 'text/plain,*/*',
    });
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const text = await res.text();
    const looksLikeHtml =
      contentType.includes('text/html') || /^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text);

    if (res.ok && !looksLikeHtml && text.trim().length > 0) {
      return {
        exists: true,
        status: res.status,
        content: text,
        ...parseRobotsTxt(text),
      };
    }
  } catch {
    // ignore
  }

  return {
    exists: false,
    status: 0,
    content: '',
    sitemaps: [],
    wildcardBlocked: false,
    blockedAiCrawlers: [],
    allowedSearchAiCrawlers: [...CORE_SEARCH_AI_CRAWLERS],
    totalSearchAiCrawlers: CORE_SEARCH_AI_CRAWLERS.length,
    blockedGeoBots: [],
    coreGeoBots: ['GPTBot', 'ClaudeBot', 'PerplexityBot'],
  };
}

async function fetchSitemap(origin, robotsSitemaps = []) {
  const candidates = [...new Set([...robotsSitemaps, `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`])];

  for (const url of candidates.slice(0, 3)) {
    try {
      const res = await safeFetch(url, {
        timeoutMs: 5000,
        userAgent: BROWSER_UA,
        accept: 'application/xml,text/xml,*/*',
      });
      if (!res.ok) continue;
      const text = await res.text();
      const isValidXml =
        /<urlset[\s>]/i.test(text) || /<sitemapindex[\s>]/i.test(text);
      if (isValidXml) {
        const locMatches = text.match(/<loc>\s*([^<\s]+)\s*<\/loc>/gi) || [];
        const isIndex = /<sitemapindex[\s>]/i.test(text);
        let urlCount = locMatches.length;

        // If sitemap index, sample first child sitemap to estimate URL count
        if (isIndex && locMatches.length > 0) {
          const firstChild = locMatches[0].replace(/<\/?loc>/gi, '').trim();
          try {
            const childRes = await safeFetch(firstChild, {
              timeoutMs: 4000,
              userAgent: BROWSER_UA,
              accept: 'application/xml,text/xml,*/*',
            });
            if (childRes.ok) {
              const childText = await childRes.text();
              const childLocs = childText.match(/<loc>\s*([^<\s]+)\s*<\/loc>/gi) || [];
              if (childLocs.length > 0) {
                urlCount = childLocs.length;
              }
            }
          } catch {
            // keep index count
          }
        }

        return {
          exists: true,
          valid: true,
          url,
          isIndex,
          urlCount,
        };
      }
    } catch {
      // try next candidate
    }
  }

  return {
    exists: false,
    valid: false,
    url: `${origin}/sitemap.xml`,
    isIndex: false,
    urlCount: 0,
  };
}

async function fetchTextResource(url, expectedType = 'text') {
  try {
    const res = await safeFetch(url, {
      timeoutMs: 4000,
      userAgent: BROWSER_UA,
      accept: expectedType === 'json' ? 'application/json,*/*' : 'text/plain,text/markdown,*/*',
    });
    if (!res.ok) return { exists: false, status: res.status };
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const text = await res.text();
    const looksLikeHtml =
      ct.includes('text/html') || /^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text);
    if (looksLikeHtml || !text.trim()) return { exists: false, status: res.status };
    if (expectedType === 'json') {
      try {
        JSON.parse(text);
      } catch {
        return { exists: false, status: res.status };
      }
    }
    return { exists: true, status: res.status, length: text.length };
  } catch {
    return { exists: false, status: 0 };
  }
}

async function fetchAuxResources(origin, html) {
  const robots = await fetchRobotsTxt(origin);

  const [sitemap, llmsTxt, wellKnownAi, aiSummary, aiFaq, llmsFull] = await Promise.all([
    fetchSitemap(origin, robots.sitemaps),
    fetchTextResource(`${origin}/llms.txt`, 'text'),
    fetchTextResource(`${origin}/.well-known/ai.txt`, 'text'),
    fetchTextResource(`${origin}/ai/summary.json`, 'json'),
    fetchTextResource(`${origin}/ai/faq.json`, 'json'),
    fetchTextResource(`${origin}/llms-full.txt`, 'text'),
  ]);

  const aiDiscoveryFiles = [];
  if (wellKnownAi.exists) aiDiscoveryFiles.push('/.well-known/ai.txt');
  if (aiSummary.exists) aiDiscoveryFiles.push('/ai/summary.json');
  if (aiFaq.exists) aiDiscoveryFiles.push('/ai/faq.json');
  if (llmsFull.exists) aiDiscoveryFiles.push('/llms-full.txt');

  const indexNowFound =
    /indexnow/i.test(html) ||
    /indexnow/i.test(robots.content || '');

  return {
    robots,
    sitemap,
    llmsTxt,
    aiDiscovery: {
      found: aiDiscoveryFiles.length > 0,
      files: aiDiscoveryFiles,
    },
    indexNowFound,
  };
}

async function checkSampledInternalLinks(urls) {
  const sample = [...new Set(urls)].slice(0, 5);
  if (sample.length === 0) {
    return { checked: 0, working: 0, broken: [] };
  }

  const results = await Promise.all(
    sample.map(async (url) => {
      try {
        let res = await safeFetch(url, {
          method: 'HEAD',
          timeoutMs: 4500,
          userAgent: BROWSER_UA,
        });
        if (res.status === 405 || res.status === 403 || res.status === 501) {
          res = await safeFetch(url, {
            method: 'GET',
            timeoutMs: 4500,
            userAgent: BROWSER_UA,
          });
        }
        return { url, status: res.status, ok: res.status >= 200 && res.status < 400 };
      } catch {
        return { url, status: 0, ok: false };
      }
    })
  );

  const broken = results.filter((r) => !r.ok);
  return {
    checked: results.length,
    working: results.length - broken.length,
    broken,
  };
}

module.exports = {
  normalizeAndValidateUrl,
  fetchMainPage,
  fetchAuxResources,
  checkSampledInternalLinks,
};
