const cheerio = require('cheerio');

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was',
  'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now',
  'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she',
  'too', 'use', 'with', 'that', 'this', 'from', 'they', 'will', 'have', 'more', 'when',
  'your', 'into', 'than', 'them', 'then', 'some', 'what', 'there', 'their', 'about',
  'which', 'would', 'make', 'like', 'time', 'just', 'know', 'take', 'people', 'year',
  'good', 'could', 'also', 'well', 'only', 'come', 'over', 'think', 'back', 'after',
  'work', 'first', 'even', 'want', 'because', 'these', 'give', 'most', 'very', 'been',
  'were', 'being', 'does', 'done', 'here', 'where', 'best', 'top', 'free', 'home',
]);

const GENERIC_ANCHORS = new Set([
  'click here',
  'read more',
  'here',
  'more',
  'link',
  'click',
  'this link',
  'go here',
  'page',
  'website',
]);

const SEMANTIC_HTML5_TAGS = [
  'header', 'nav', 'main', 'article', 'section', 'aside', 'footer',
  'figure', 'figcaption', 'time', 'mark', 'details', 'summary', 'address',
];

const DEPRECATED_HTML_TAGS = [
  'font', 'center', 'marquee', 'blink', 'big', 'strike', 'tt', 'frame', 'frameset', 'acronym', 'applet',
];

const ISO_639_1_CODES = new Set([
  'aa','ab','ae','af','ak','am','an','ar','as','av','ay','az','ba','be','bg','bh','bi','bm','bn','bo','br','bs',
  'ca','ce','ch','co','cr','cs','cu','cv','cy','da','de','dv','dz','ee','el','en','eo','es','et','eu','fa','ff',
  'fi','fj','fo','fr','fy','ga','gd','gl','gn','gu','gv','ha','he','hi','ho','hr','ht','hu','hy','hz','ia','id',
  'ie','ig','ii','ik','io','is','it','iu','ja','jv','ka','kg','ki','kj','kk','kl','km','kn','ko','kr','ks','ku',
  'kv','kw','ky','la','lb','lg','li','ln','lo','lt','lu','lv','mg','mh','mi','mk','ml','mn','mr','ms','mt','my',
  'na','nb','nd','ne','ng','nl','nn','no','nr','nv','ny','oc','oj','om','or','os','pa','pi','pl','ps','pt','qu',
  'rm','rn','ro','ru','rw','sa','sc','sd','se','sg','si','sk','sl','sm','sn','so','sq','sr','ss','st','su','sv',
  'sw','ta','te','tg','th','ti','tk','tl','tn','to','tr','ts','tt','tw','ty','ug','uk','ur','uz','ve','vi','vo',
  'wa','wo','xh','yi','yo','za','zh','zu',
]);

const AUTHORITY_DOMAINS = [
  'wikipedia.org', 'wikidata.org', 'schema.org', 'w3.org', 'google.com', 'developers.google.com',
  'developer.mozilla.org', 'mozilla.org', 'arxiv.org', 'github.com', 'ietf.org', 'nist.gov',
  'who.int', 'europa.eu', 'harvard.edu', 'mit.edu', 'stanford.edu', 'forbes.com', 'hbr.org',
  'nytimes.com', 'reuters.com', 'bbc.com', 'nature.com', 'sciencedirect.com', 'pubmed.ncbi.nlm.nih.gov',
  'statista.com', 'gartner.com', 'mckinsey.com', 'owasp.org', 'cloudflare.com', 'web.dev',
];

const AUTHORITATIVE_SAMEAS_DOMAINS = [
  'wikipedia.org', 'wikidata.org', 'linkedin.com', 'github.com', 'crunchbase.com',
  'youtube.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'bloomberg.com',
];

function countSyllables(word) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 0;
  if (clean.length <= 3) return 1;
  const trimmed = clean.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const vowels = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, vowels ? vowels.length : 1);
}

function normalizeUrlForCompare(urlStr, baseOrigin) {
  try {
    const u = new URL(urlStr, baseOrigin);
    u.hash = '';
    let pathname = u.pathname.replace(/\/+$/, '') || '/';
    return `${u.protocol}//${u.hostname.toLowerCase()}${pathname}${u.search}`;
  } catch {
    return (urlStr || '').trim().replace(/\/+$/, '').toLowerCase();
  }
}

function tokenizeSignificantWords(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function flattenJsonLd(node, out = []) {
  if (!node) return out;
  if (Array.isArray(node)) {
    for (const item of node) flattenJsonLd(item, out);
    return out;
  }
  if (typeof node === 'object') {
    if (node['@type']) {
      out.push(node);
    }
    if (Array.isArray(node['@graph'])) {
      flattenJsonLd(node['@graph'], out);
    }
    for (const [k, v] of Object.entries(node)) {
      if (k === '@graph') continue;
      if (v && typeof v === 'object') {
        flattenJsonLd(v, out);
      }
    }
  }
  return out;
}

function getTypesArray(obj) {
  if (!obj || !obj['@type']) return [];
  return Array.isArray(obj['@type']) ? obj['@type'].map(String) : [String(obj['@type'])];
}

function buildScanContext(page, aux) {
  const $ = cheerio.load(page.html);
  const parsedUrl = new URL(page.finalUrl);
  const origin = parsedUrl.origin;
  const hostname = parsedUrl.hostname.toLowerCase();
  const isHttps = parsedUrl.protocol === 'https:';

  // --- Head & Meta ---
  const hasDoctype = /^\s*<!doctype\s+html/i.test(page.html.slice(0, 512));
  const htmlLang = ($('html').attr('lang') || '').trim();
  const title = $('head title').first().text().replace(/\s+/g, ' ').trim() || $('title').first().text().replace(/\s+/g, ' ').trim();
  const metaDescription = (
    $('meta[name="description" i]').attr('content') ||
    $('meta[property="description" i]').attr('content') ||
    ''
  ).replace(/\s+/g, ' ').trim();
  const viewport = ($('meta[name="viewport" i]').attr('content') || '').trim();
  const charsetAttr = ($('meta[charset]').attr('charset') || '').trim();
  const contentTypeMeta = ($('meta[http-equiv="content-type" i]').attr('content') || '').trim();
  const charset = charsetAttr || (/charset=([^;\s]+)/i.exec(contentTypeMeta)?.[1] || '');
  const themeColor = ($('meta[name="theme-color" i]').attr('content') || '').trim();
  const metaRefresh = ($('meta[http-equiv="refresh" i]').attr('content') || '').trim();
  const robotsMeta = ($('meta[name="robots" i]').attr('content') || '').trim();
  const googlebotMeta = ($('meta[name="googlebot" i]').attr('content') || '').trim();
  const combinedRobotsMeta = [robotsMeta, googlebotMeta, page.headers['x-robots-tag'] || '']
    .filter(Boolean)
    .join(', ');
  const metaKeywords = ($('meta[name="keywords" i]').attr('content') || '').trim();
  const canonical = ($('link[rel="canonical" i]').attr('href') || '').trim();
  const favicon = (
    $('link[rel~="icon" i]').attr('href') ||
    $('link[rel="shortcut icon" i]').attr('href') ||
    ''
  ).trim();
  const appleTouchIcon = ($('link[rel="apple-touch-icon" i], link[rel="apple-touch-icon-precomposed" i]').attr('href') || '').trim();
  const webManifest = ($('link[rel="manifest" i]').attr('href') || '').trim();

  const rssFeeds = [];
  $('link[rel="alternate" i]').each((_, el) => {
    const type = ($(el).attr('type') || '').toLowerCase();
    const href = ($(el).attr('href') || '').trim();
    if (href && (type.includes('rss+xml') || type.includes('atom+xml'))) {
      rssFeeds.push(href);
    }
  });

  const hreflangTags = [];
  $('link[rel="alternate" i][hreflang]').each((_, el) => {
    const code = ($(el).attr('hreflang') || '').trim();
    const href = ($(el).attr('href') || '').trim();
    if (code) hreflangTags.push({ code, href });
  });

  const resourceHints = [];
  $('link[rel="preconnect" i], link[rel="dns-prefetch" i], link[rel="preload" i], link[rel="prefetch" i]').each((_, el) => {
    resourceHints.push({
      rel: ($(el).attr('rel') || '').toLowerCase(),
      as: ($(el).attr('as') || '').toLowerCase(),
      href: ($(el).attr('href') || '').trim(),
    });
  });

  const fontPreloads = resourceHints.filter(
    (h) =>
      (h.rel === 'preload' && h.as === 'font') ||
      ((h.rel === 'preconnect' || h.rel === 'dns-prefetch') &&
        /fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|fonts\.bunny\.net|font/i.test(h.href))
  );

  // --- Social Meta ---
  const og = {
    title: ($('meta[property="og:title" i]').attr('content') || '').trim(),
    description: ($('meta[property="og:description" i]').attr('content') || '').trim(),
    image: ($('meta[property="og:image" i]').attr('content') || '').trim(),
    url: ($('meta[property="og:url" i]').attr('content') || '').trim(),
    type: ($('meta[property="og:type" i]').attr('content') || '').trim(),
    siteName: ($('meta[property="og:site_name" i]').attr('content') || '').trim(),
    locale: ($('meta[property="og:locale" i]').attr('content') || '').trim(),
  };

  const twitter = {
    card: ($('meta[name="twitter:card" i], meta[property="twitter:card" i]').attr('content') || '').trim(),
    title: ($('meta[name="twitter:title" i], meta[property="twitter:title" i]').attr('content') || '').trim(),
    description: ($('meta[name="twitter:description" i], meta[property="twitter:description" i]').attr('content') || '').trim(),
    image: ($('meta[name="twitter:image" i], meta[property="twitter:image" i]').attr('content') || '').trim(),
  };

  // --- Headings ---
  const headingsByLevel = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const allHeadings = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const level = Number(tag.slice(1));
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text) {
      headingsByLevel[level].push(text);
      allHeadings.push({ level, text, el });
    }
  });

  let headingHierarchyHasGaps = false;
  for (let i = 1; i < allHeadings.length; i++) {
    if (allHeadings[i].level > allHeadings[i - 1].level + 1) {
      headingHierarchyHasGaps = true;
      break;
    }
  }
  const distinctHeadingLevels = Object.keys(headingsByLevel).filter(
    (lvl) => headingsByLevel[lvl].length > 0
  ).length;

  const questionRegex = /(\?$|^(what|how|why|when|where|who|which|can|does|do|is|are|should|will)\b)/i;
  const questionHeadings = allHeadings.filter((h) => h.level >= 2 && questionRegex.test(h.text));

  // Question types across headings & Q&A
  const questionTypes = new Set();
  const qTypePatterns = [
    ['what', /\bwhat\b/i],
    ['why', /\bwhy\b/i],
    ['how', /\bhow\b/i],
    ['when', /\bwhen\b/i],
    ['where', /\bwhere\b/i],
    ['who', /\bwho\b/i],
  ];
  for (const h of allHeadings) {
    for (const [name, rx] of qTypePatterns) {
      if (rx.test(h.text)) questionTypes.add(name);
    }
  }

  // --- JSON-LD Structured Data ---
  const jsonLdBlocks = [];
  const jsonLdObjects = [];
  let jsonLdTotalBytes = 0;
  let jsonLdInvalidCount = 0;

  $('script[type="application/ld+json" i]').each((_, el) => {
    const raw = ($(el).html() || '').trim();
    if (!raw) return;
    const bytes = Buffer.byteLength(raw, 'utf8');
    jsonLdTotalBytes += bytes;
    try {
      const parsed = JSON.parse(raw);
      jsonLdBlocks.push({ raw, bytes, valid: true, parsed });
      flattenJsonLd(parsed, jsonLdObjects);
    } catch {
      jsonLdInvalidCount += 1;
      jsonLdBlocks.push({ raw, bytes, valid: false, parsed: null });
    }
  });

  const schemaTypesSet = new Set();
  for (const obj of jsonLdObjects) {
    for (const t of getTypesArray(obj)) {
      schemaTypesSet.add(t);
    }
  }
  const schemaTypes = [...schemaTypesSet];

  // Validate required properties on top schema types
  const requiredMap = {
    Organization: ['name'],
    LocalBusiness: ['name'],
    ProfessionalService: ['name'],
    WebSite: ['name', 'url'],
    Article: ['headline'],
    BlogPosting: ['headline'],
    NewsArticle: ['headline'],
    Product: ['name'],
    FAQPage: ['mainEntity'],
    BreadcrumbList: ['itemListElement'],
    Person: ['name'],
    HowTo: ['name', 'step'],
    VideoObject: ['name', 'description'],
  };
  const schemaMissingProps = [];
  for (const obj of jsonLdObjects) {
    for (const t of getTypesArray(obj)) {
      const req = requiredMap[t];
      if (!req) continue;
      for (const prop of req) {
        if (!obj[prop]) {
          schemaMissingProps.push(`${t}.${prop}`);
        }
      }
    }
  }

  const orgSchemas = jsonLdObjects.filter((o) =>
    getTypesArray(o).some((t) =>
      /^(Organization|Corporation|LocalBusiness|ProfessionalService|NGO|EducationalOrganization|OnlineBusiness)$/i.test(t)
    )
  );
  const personSchemas = jsonLdObjects.filter((o) =>
    getTypesArray(o).some((t) => /^Person$/i.test(t))
  );

  const hasOrgLogo = orgSchemas.some((o) => Boolean(o.logo));

  const sameAsLinks = [];
  for (const obj of jsonLdObjects) {
    if (obj.sameAs) {
      const list = Array.isArray(obj.sameAs) ? obj.sameAs : [obj.sameAs];
      for (const link of list) {
        if (typeof link === 'string' && /^https?:\/\//i.test(link)) {
          sameAsLinks.push(link);
        }
      }
    }
  }
  const authoritativeSameAsLinks = sameAsLinks.filter((url) =>
    AUTHORITATIVE_SAMEAS_DOMAINS.some((dom) => url.toLowerCase().includes(dom))
  );

  const schemaDates = {
    datePublished: null,
    dateModified: null,
  };
  for (const obj of jsonLdObjects) {
    if (!schemaDates.datePublished && obj.datePublished) {
      schemaDates.datePublished = String(obj.datePublished);
    }
    if (!schemaDates.dateModified && obj.dateModified) {
      schemaDates.dateModified = String(obj.dateModified);
    }
  }

  const authorFromSchema =
    personSchemas.length > 0 ||
    jsonLdObjects.some((o) => Boolean(o.author));

  const authorHasCredentials =
    personSchemas.some((p) => Boolean(p.jobTitle || p.description || p.knowsAbout || p.alumniOf || p.sameAs)) ||
    jsonLdObjects.some(
      (o) =>
        o.author &&
        typeof o.author === 'object' &&
        Boolean(o.author.jobTitle || o.author.description || o.author.sameAs || o.author.url)
    );

  const hasSpeakable = jsonLdObjects.some((o) => Boolean(o.speakable));
  const hasSearchAction = schemaTypes.some((t) => /^SearchAction$/i.test(t)) ||
    jsonLdObjects.some((o) => o.potentialAction && JSON.stringify(o.potentialAction).includes('SearchAction'));
  const hasFaqSchema = schemaTypes.some((t) => /^FAQPage$/i.test(t));
  const hasHowToSchema = schemaTypes.some((t) => /^HowTo$/i.test(t));
  const hasBreadcrumbSchema = schemaTypes.some((t) => /^BreadcrumbList$/i.test(t));
  const hasVideoSchema = schemaTypes.some((t) => /^VideoObject$/i.test(t));
  const hasMicrodata = $('[itemscope]').length > 0;
  const hasRdfa = $('[vocab], [typeof]').length > 0;

  // --- Clean Visible Body Text Extraction ---
  const $bodyClone = cheerio.load(page.html);
  $bodyClone('script, style, noscript, svg, template, iframe').remove();
  const rawBodyText = $bodyClone('body').text() || $bodyClone.root().text();
  const bodyText = rawBodyText.replace(/\s+/g, ' ').trim();
  const bodyTextBytes = Buffer.byteLength(bodyText, 'utf8');
  const textHtmlRatioPct = page.htmlBytes > 0 ? Number(((bodyTextBytes / page.htmlBytes) * 100).toFixed(1)) : 0;

  // Boilerplate ratio (nav + header + footer text vs total body text)
  const $boilerplateClone = cheerio.load(page.html);
  $boilerplateClone('script, style, noscript, svg, template').remove();
  const chromeText = $boilerplateClone('nav, footer').text().replace(/\s+/g, ' ').trim();
  const boilerplatePct = bodyText.length > 0
    ? Math.min(100, Math.round((chromeText.length / bodyText.length) * 100))
    : 0;

  const words = bodyText.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) || [];
  const wordCount = words.length;
  const first200WordsText = words.slice(0, 200).join(' ').toLowerCase();
  const bodyLower = bodyText.toLowerCase();

  // Sentences & Readability
  const sentences = bodyText
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => {
      const wc = (s.match(/[A-Za-z0-9]+/g) || []).length;
      return wc >= 3;
    });

  const sentenceWordCounts = sentences.map((s) => (s.match(/[A-Za-z0-9]+/g) || []).length);
  const sentenceCount = Math.max(1, sentences.length);
  const totalSentenceWords = sentenceWordCounts.reduce((a, b) => a + b, 0);
  const avgWordsPerSentence = sentences.length > 0
    ? Math.round(totalSentenceWords / sentences.length)
    : 0;
  const longSentenceCount = sentenceWordCounts.filter((c) => c > 20).length;
  const longSentencePct = sentences.length > 0
    ? Math.round((longSentenceCount / sentences.length) * 100)
    : 0;
  const shortSentencePct = Math.max(0, 100 - longSentencePct);

  const sampleWords = words.slice(0, 1500);
  const totalSyllables = sampleWords.reduce((sum, w) => sum + countSyllables(w), 0);
  const syllablesPerWord = sampleWords.length > 0 ? totalSyllables / sampleWords.length : 1.5;
  const readabilityScore = Math.max(
    0,
    Math.min(100, Math.round(206.835 - 1.015 * Math.max(1, avgWordsPerSentence) - 84.6 * syllablesPerWord))
  );

  // Passive voice estimate
  const passiveRegex = /\b(is|are|was|were|be|been|being)\s+[a-z]+(ed|en)\b/i;
  const passiveCount = sentences.filter((s) => passiveRegex.test(s)).length;
  const passivePct = sentences.length > 0 ? Math.round((passiveCount / sentences.length) * 100) : 0;

  // Paragraphs
  const paragraphs = [];
  $bodyClone('p').each((_, el) => {
    const t = $bodyClone(el).text().replace(/\s+/g, ' ').trim();
    const wc = (t.match(/[A-Za-z0-9]+/g) || []).length;
    if (wc >= 3) {
      paragraphs.push({ text: t, wordCount: wc });
    }
  });
  const firstSubstantialParagraph = paragraphs[0] || null;
  const conciseParagraphPct = paragraphs.length > 0
    ? Math.round((paragraphs.filter((p) => p.wordCount <= 80).length / paragraphs.length) * 100)
    : 0;
  const optimalParagraphPct = paragraphs.length > 0
    ? Math.round((paragraphs.filter((p) => p.wordCount >= 20 && p.wordCount <= 80).length / paragraphs.length) * 100)
    : 0;

  // Pronouns & Conversational language
  const firstPersonCount = (bodyText.match(/\b(i|we|our|my|us|ourselves|myself)\b/gi) || []).length;
  const userPronounsCount = (bodyText.match(/\b(you|your|yours|yourself|we|our)\b/gi) || []).length;
  const pronounDensity = wordCount > 0 ? Number(((userPronounsCount / wordCount) * 100).toFixed(1)) : 0;
  const conversationalCount = (
    bodyText.match(/\b(you|your|how|why|what|can|help|best|need|easy|simple|guide|start|get|find|make|build|grow|learn)\b/gi) || []
  ).length;

  // Named entities (capitalized multi-word phrases / proper nouns)
  const entityMatches = bodyText.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})+\b/g) || [];
  const namedEntities = [...new Set(entityMatches)];

  // Title-H1 Alignment & Topic Focus
  const titleKeywords = [...new Set(tokenizeSignificantWords(title))];
  const h1Text = headingsByLevel[1][0] || '';
  const h1Keywords = [...new Set(tokenizeSignificantWords(h1Text))];
  let titleH1OverlapPct = 0;
  if (titleKeywords.length > 0 && h1Keywords.length > 0) {
    const h1Set = new Set(h1Keywords);
    const shared = titleKeywords.filter((w) => h1Set.has(w)).length;
    const denom = Math.min(titleKeywords.length, h1Keywords.length);
    titleH1OverlapPct = Math.round((shared / denom) * 100);
  }

  const titleKeywordsInBodyPct = titleKeywords.length > 0
    ? Math.round((titleKeywords.filter((kw) => bodyLower.includes(kw)).length / titleKeywords.length) * 100)
    : 0;
  const titleKeywordsInFirst200Pct = titleKeywords.length > 0
    ? Math.round((titleKeywords.filter((kw) => first200WordsText.includes(kw)).length / titleKeywords.length) * 100)
    : 0;

  // Keyword stuffing check
  const wordFreq = new Map();
  for (const rawW of words) {
    const w = rawW.toLowerCase();
    if (w.length < 4 || STOP_WORDS.has(w)) continue;
    wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
  }
  let topWord = '';
  let topWordCount = 0;
  for (const [w, count] of wordFreq.entries()) {
    if (count > topWordCount) {
      topWord = w;
      topWordCount = count;
    }
  }
  const keywordStuffingMaxPct = wordCount > 50 ? Number(((topWordCount / wordCount) * 100).toFixed(1)) : 0;

  // Sections & Direct Answers / Answer Box / Q&A Blocks / Passage Citability
  const sectionElements = $('section, article');
  const contentSectionsCount = Math.max(sectionElements.length, headingsByLevel[2].length);

  // Compute words per H2 section
  const h2Sections = [];
  $('h2').each((_, el) => {
    let textParts = [];
    let sibling = $(el).next();
    let safety = 0;
    while (sibling.length && !/^h[12]$/i.test(sibling[0].tagName || '') && safety < 40) {
      textParts.push(sibling.text());
      sibling = sibling.next();
      safety++;
    }
    const sectionText = textParts.join(' ').replace(/\s+/g, ' ').trim();
    const wc = (sectionText.match(/[A-Za-z0-9]+/g) || []).length;
    // Fallback to parent container if H2 is wrapped inside its own section div
    let finalWc = wc;
    let finalText = sectionText;
    if (finalWc < 15) {
      const parentText = $(el).parent().text().replace(/\s+/g, ' ').trim();
      const parentWc = (parentText.match(/[A-Za-z0-9]+/g) || []).length;
      if (parentWc > finalWc && parentWc < wordCount * 0.7) {
        finalWc = parentWc;
        finalText = parentText;
      }
    }
    h2Sections.push({ heading: $(el).text().trim(), wordCount: finalWc, text: finalText });
  });

  const avgH2SectionWords = h2Sections.length > 0
    ? Math.round(h2Sections.reduce((s, sec) => s + sec.wordCount, 0) / h2Sections.length)
    : Math.round(wordCount / Math.max(1, contentSectionsCount));

  // Direct answer paragraphs & Q&A blocks after headings
  let directAnswersCount = 0;
  let answerBoxParagraphsCount = 0;
  let qaBlocksCount = 0;
  let citablePassagesCount = 0;

  $('h2, h3, h4').each((_, el) => {
    const hText = $(el).text().replace(/\s+/g, ' ').trim();
    const isQ = questionRegex.test(hText);
    const nextP = $(el).nextAll('p').first();
    const pText = nextP.length ? nextP.text().replace(/\s+/g, ' ').trim() : '';
    const pWords = (pText.match(/[A-Za-z0-9]+/g) || []).length;
    if (pWords >= 12 && pWords <= 85) {
      directAnswersCount++;
    }
    if (pWords >= 15 && pWords <= 75) {
      answerBoxParagraphsCount++;
    }
    if (isQ && pWords >= 10) {
      qaBlocksCount++;
    }
  });

  // Also count <details><summary> Q&A blocks
  $('details').each((_, el) => {
    const sum = $(el).find('summary').first().text().trim();
    const full = $(el).text().replace(sum, '').trim();
    if (sum && full.length > 20) {
      qaBlocksCount++;
      answerBoxParagraphsCount++;
    }
  });

  // Citation-ready passages: self-contained 100-200 word blocks opening with a clear definition/declarative answer
  const passageCandidates = h2Sections.length > 0
    ? h2Sections.map((s) => s.text)
    : paragraphs.map((p) => p.text);
  for (const txt of passageCandidates) {
    const wc = (txt.match(/[A-Za-z0-9]+/g) || []).length;
    if (wc >= 100 && wc <= 200 && /\b(is|are|refers to|means|provides|delivers|helps)\b/i.test(txt.slice(0, 160))) {
      citablePassagesCount++;
    }
  }
  const citablePassagesPct = passageCandidates.length > 0
    ? Math.round((citablePassagesCount / passageCandidates.length) * 100)
    : 0;

  // Subtopic depth: H2 sections that have H3s
  let sectionsWithSubtopics = 0;
  if (headingsByLevel[3].length > 0) {
    let seenH2 = false;
    let currentHasH3 = false;
    for (const h of allHeadings) {
      if (h.level === 2) {
        if (seenH2 && currentHasH3) sectionsWithSubtopics++;
        seenH2 = true;
        currentHasH3 = false;
      } else if (h.level === 3 && seenH2) {
        currentHasH3 = true;
      }
    }
    if (seenH2 && currentHasH3) sectionsWithSubtopics++;
    if (sectionsWithSubtopics === 0 && headingsByLevel[3].length > 0) {
      sectionsWithSubtopics = Math.min(headingsByLevel[2].length || 1, headingsByLevel[3].length);
    }
  }

  // --- HTML Structure, Lists, Tables, Media, Semantic, Accessibility ---
  const ulCount = $('ul').length;
  const olCount = $('ol').length;
  const dlCount = $('dl').length;
  const totalLists = ulCount + olCount;
  const tablesCount = $('table').length;
  const codeBlocksCount = $('pre, code').length;
  const detailsCount = $('details').length;
  const accordionCount = detailsCount + $('[aria-expanded]').length;
  const figuresCount = $('figure').length;
  const figcaptionsCount = $('figure figcaption').length;
  const timeElements = [];
  $('time').each((_, el) => {
    timeElements.push({
      datetime: ($(el).attr('datetime') || '').trim(),
      text: $(el).text().trim(),
    });
  });

  const videoIframes = $('iframe[src*="youtube"], iframe[src*="youtu.be"], iframe[src*="vimeo"], iframe[src*="wistia"], iframe[src*="loom"]').length;
  const videosCount = $('video').length + videoIframes + (hasVideoSchema ? 1 : 0);
  const dataVizCount = tablesCount + $('canvas').length + $('figure svg').length;

  const semanticTagsFound = SEMANTIC_HTML5_TAGS.filter((tag) => $(tag).length > 0);
  const deprecatedTagsFound = DEPRECATED_HTML_TAGS.filter((tag) => $(tag).length > 0);

  const hasMainLandmark = $('main, [role="main"]').length > 0;
  const hasNavLandmark = $('nav, [role="navigation"]').length > 0;
  const hasHeaderLandmark = $('header, [role="banner"]').length > 0;
  const hasFooterLandmark = $('footer, [role="contentinfo"]').length > 0;
  const hasAsideLandmark = $('aside, [role="complementary"]').length > 0;
  const hasSkipLink = $('a[href^="#"]').toArray().some((el) =>
    /skip\s+(to\s+)?(main|content|navigation)/i.test($(el).text().trim())
  );
  const ariaLandmarksCount = [
    hasMainLandmark,
    hasNavLandmark,
    hasHeaderLandmark,
    hasFooterLandmark,
    hasAsideLandmark,
  ].filter(Boolean).length;

  // TOC detection
  const hashLinks = $('a[href^="#"]').filter((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    return href.length > 1 && href !== '#top';
  });
  const tocDetected =
    $('[id*="toc" i], [class*="toc" i], [aria-label*="table of contents" i], nav[aria-label*="contents" i]').length > 0 ||
    hashLinks.length >= 4;

  // DOM Size & Duplicate IDs
  const domElementCount = $('*').length;
  const idCounts = new Map();
  $('[id]').each((_, el) => {
    const id = ($(el).attr('id') || '').trim();
    if (id) idCounts.set(id, (idCounts.get(id) || 0) + 1);
  });
  const duplicateIds = [...idCounts.entries()].filter(([, c]) => c > 1).map(([id]) => id);

  // Forms accessibility
  let formInputsTotal = 0;
  let formInputsLabeled = 0;
  $('input, select, textarea').each((_, el) => {
    const type = ($(el).attr('type') || 'text').toLowerCase();
    if (['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) return;
    formInputsTotal++;
    const id = $(el).attr('id');
    const hasForLabel = id ? $(`label[for="${id.replace(/"/g, '\\"')}"]`).length > 0 : false;
    const hasWrappingLabel = $(el).closest('label').length > 0;
    const hasAria = Boolean($(el).attr('aria-label') || $(el).attr('aria-labelledby') || $(el).attr('title'));
    if (hasForLabel || hasWrappingLabel || hasAria) {
      formInputsLabeled++;
    }
  });

  // Iframes
  const iframesTotal = $('iframe').length;
  let iframesUnsafe = 0;
  $('iframe').each((_, el) => {
    if (!$(el).attr('sandbox') && !$(el).attr('title')) {
      iframesUnsafe++;
    }
  });

  // --- Images ---
  const images = {
    total: 0,
    withAlt: 0,
    descriptiveAlt: 0,
    missingDimensions: 0,
    lazyCount: 0,
    jsLazyDetected: false,
    modernFormatCount: 0,
    legacyFormatCount: 0,
    responsiveCount: 0,
  };

  const hasPictureModern = $('picture source[type="image/webp"], picture source[type="image/avif"]').length > 0;

  $('img').each((_, el) => {
    images.total++;
    const src = ($(el).attr('src') || $(el).attr('data-src') || '').trim();
    const alt = $(el).attr('alt');
    const role = ($(el).attr('role') || '').toLowerCase();
    const ariaHidden = $(el).attr('aria-hidden') === 'true';

    if (alt !== undefined && (alt.trim().length > 0 || role === 'presentation' || ariaHidden)) {
      images.withAlt++;
      if (alt.trim().length > 5 || role === 'presentation' || ariaHidden) {
        images.descriptiveAlt++;
      }
    }

    const width = $(el).attr('width');
    const height = $(el).attr('height');
    if (!width || !height) {
      images.missingDimensions++;
    }

    const loading = ($(el).attr('loading') || '').toLowerCase();
    if (loading === 'lazy') images.lazyCount++;
    if ($(el).attr('data-src') || $(el).attr('data-lazy') || $(el).attr('data-nimg') || $(el).hasClass('lazyload')) {
      images.jsLazyDetected = true;
    }

    const inModernPicture =
      $(el).closest('picture').find('source[type="image/webp"], source[type="image/avif"]').length > 0;
    const lowerSrc = src.toLowerCase();
    if (inModernPicture || /\.(webp|avif)(\?|$)/i.test(lowerSrc) || /format=(webp|avif)/i.test(lowerSrc) || /\.svg(\?|$)/i.test(lowerSrc) || lowerSrc.startsWith('data:image/svg')) {
      images.modernFormatCount++;
    } else if (/\.(jpe?g|png|gif|bmp)(\?|$)/i.test(lowerSrc) || src) {
      images.legacyFormatCount++;
    }

    if ($(el).attr('srcset') || $(el).closest('picture').find('source[srcset]').length > 0) {
      images.responsiveCount++;
    }
  });
  if (!images.jsLazyDetected && /IntersectionObserver|lazyload|lazy-load/i.test(page.html)) {
    images.jsLazyDetected = true;
  }
  if (hasPictureModern && images.modernFormatCount === 0) {
    images.modernFormatCount = 1;
  }

  // --- Links ---
  const internalLinks = [];
  const externalLinks = [];
  const externalDomains = new Set();
  const authorityLinks = [];
  let emptyHrefsCount = 0;
  let genericAnchorsCount = 0;
  let nofollowCount = 0;
  let targetBlankCount = 0;
  let targetBlankMissingNoopener = 0;
  let totalLinks = 0;
  let contextualLinksCount = 0;

  const trustLinks = {
    about: false,
    contact: false,
    privacy: false,
    terms: false,
  };

  $('a').each((_, el) => {
    totalLinks++;
    const rawHref = $(el).attr('href');
    const href = (rawHref || '').trim();
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    const lowerText = text.toLowerCase();
    const lowerHref = href.toLowerCase();
    const rel = ($(el).attr('rel') || '').toLowerCase();
    const target = ($(el).attr('target') || '').toLowerCase();

    if (rawHref === undefined || href === '' || href === '#') {
      emptyHrefsCount++;
      return;
    }

    if (lowerText && GENERIC_ANCHORS.has(lowerText)) {
      genericAnchorsCount++;
    }

    if (rel.includes('nofollow')) {
      nofollowCount++;
    }

    if (target === '_blank') {
      targetBlankCount++;
      if (!rel.includes('noopener') && !rel.includes('noreferrer')) {
        targetBlankMissingNoopener++;
      }
    }

    // Trust link detection
    if (/about|who-we-are|company|our-story/i.test(lowerHref) || /\babout(\s+us)?\b/i.test(lowerText)) {
      trustLinks.about = true;
    }
    if (/contact|get-in-touch|support/i.test(lowerHref) || lowerHref.startsWith('mailto:') || lowerHref.startsWith('tel:') || /\bcontact(\s+us)?\b/i.test(lowerText)) {
      trustLinks.contact = true;
    }
    if (/privacy|gdpr|data-protection/i.test(lowerHref) || /\bprivacy(\s+policy)?\b/i.test(lowerText)) {
      trustLinks.privacy = true;
    }
    if (/terms|tos|legal|conditions/i.test(lowerHref) || /\bterms(\s+of\s+(service|use)|\s+and\s+conditions)?\b/i.test(lowerText)) {
      trustLinks.terms = true;
    }

    if (lowerHref.startsWith('mailto:') || lowerHref.startsWith('tel:') || lowerHref.startsWith('javascript:')) {
      return;
    }

    try {
      const resolved = new URL(href, page.finalUrl);
      if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return;

      const isInternal = resolved.hostname.toLowerCase() === hostname ||
        resolved.hostname.toLowerCase() === `www.${hostname}` ||
        `www.${resolved.hostname.toLowerCase()}` === hostname;

      if (isInternal) {
        if (!href.startsWith('#')) {
          internalLinks.push(resolved.href);
        }
        contextualLinksCount++;
      } else {
        externalLinks.push(resolved.href);
        const extHost = resolved.hostname.toLowerCase().replace(/^www\./, '');
        externalDomains.add(extHost);
        if (
          extHost.endsWith('.gov') ||
          extHost.endsWith('.edu') ||
          extHost.endsWith('.org') ||
          AUTHORITY_DOMAINS.some((d) => extHost === d || extHost.endsWith(`.${d}`))
        ) {
          authorityLinks.push(resolved.href);
        }
      }
    } catch {
      // malformed href
    }
  });

  // --- CSS, JS, Mixed Content, Fonts ---
  let inlineCssBytes = 0;
  let hasFontDisplaySwap = false;
  $('style').each((_, el) => {
    const css = $(el).html() || '';
    inlineCssBytes += Buffer.byteLength(css, 'utf8');
    if (/font-display\s*:\s*(swap|optional|fallback)/i.test(css)) {
      hasFontDisplaySwap = true;
    }
  });
  $('[style]').each((_, el) => {
    inlineCssBytes += Buffer.byteLength($(el).attr('style') || '', 'utf8');
  });
  $('link[rel="stylesheet" i]').each((_, el) => {
    const href = ($(el).attr('href') || '').toLowerCase();
    if (href.includes('display=swap') || href.includes('display=optional') || href.includes('display=fallback')) {
      hasFontDisplaySwap = true;
    }
  });

  let inlineJsBytes = 0;
  const externalScripts = [];
  const renderBlockingScripts = [];
  const thirdPartyScriptDomains = new Set();

  $('script').each((_, el) => {
    const type = ($(el).attr('type') || '').toLowerCase();
    if (type === 'application/ld+json' || type === 'application/json') return;
    const src = ($(el).attr('src') || '').trim();
    if (!src) {
      inlineJsBytes += Buffer.byteLength($(el).html() || '', 'utf8');
    } else {
      const hasAsync = $(el).attr('async') !== undefined;
      const hasDefer = $(el).attr('defer') !== undefined;
      const isModule = type === 'module';
      const inHead = $(el).closest('head').length > 0;
      externalScripts.push({ src, hasAsync, hasDefer, isModule, inHead });
      if (inHead && !hasAsync && !hasDefer && !isModule) {
        renderBlockingScripts.push(src);
      }
      try {
        const u = new URL(src, page.finalUrl);
        if (u.hostname.toLowerCase() !== hostname) {
          thirdPartyScriptDomains.add(u.hostname.toLowerCase());
        }
      } catch {
        // ignore
      }
    }
  });

  const mixedContentUrls = [];
  if (isHttps) {
    $('img[src], script[src], link[rel="stylesheet"][href], iframe[src], video[src], source[src]').each((_, el) => {
      const url = ($(el).attr('src') || $(el).attr('href') || '').trim();
      if (/^http:\/\//i.test(url)) {
        mixedContentUrls.push(url);
      }
    });
  }

  // --- Author, Brand, Dates, Content Signals (AEO / GEO) ---
  const metaAuthor = ($('meta[name="author" i], meta[property="article:author" i]').attr('content') || '').trim();
  const hasVisibleAuthorEl = $('[rel="author"], [itemprop="author"], .author, .byline, [class*="author-name" i]').length > 0;
  const hasAuthorByline = Boolean(metaAuthor || hasVisibleAuthorEl || authorFromSchema);

  const metaPublished = ($('meta[property="article:published_time" i], meta[name="date" i], meta[name="pubdate" i]').attr('content') || '').trim();
  const metaModified = ($('meta[property="article:modified_time" i], meta[property="og:updated_time" i]').attr('content') || '').trim();
  const lastModifiedHeader = page.headers['last-modified'] || '';

  const hasDateInfo = Boolean(
    timeElements.length > 0 ||
    metaPublished ||
    metaModified ||
    schemaDates.datePublished ||
    schemaDates.dateModified
  );

  const latestDateCandidate =
    schemaDates.dateModified ||
    metaModified ||
    lastModifiedHeader ||
    schemaDates.datePublished ||
    metaPublished ||
    (timeElements[0]?.datetime || '');

  let updateWithin90Days = false;
  if (latestDateCandidate) {
    const parsedTime = Date.parse(latestDateCandidate);
    if (!Number.isNaN(parsedTime)) {
      const diffDays = Math.abs(Date.now() - parsedTime) / (1000 * 60 * 60 * 24);
      if (diffDays <= 90) updateWithin90Days = true;
    }
  }

  const currentYear = new Date().getFullYear();
  const recentYearRegex = new RegExp(`\\b(${currentYear}|${currentYear - 1})\\b`);
  const recentYearMentioned = recentYearRegex.test(bodyText);

  // Brand name detection & consistency
  const schemaOrgName = orgSchemas.find((o) => o.name)?.name || '';
  const titleBrandCandidate = title.split(/\s*[|\-—–·]\s*/).map((s) => s.trim()).filter(Boolean);
  const brandName =
    og.siteName ||
    schemaOrgName ||
    (titleBrandCandidate.length > 1 ? titleBrandCandidate[0] : hostname.split('.')[0]);

  let brandConsistencySignals = 0;
  if (brandName) {
    const bLower = brandName.toLowerCase();
    if (title.toLowerCase().includes(bLower)) brandConsistencySignals++;
    if (og.siteName.toLowerCase().includes(bLower) || og.title.toLowerCase().includes(bLower)) brandConsistencySignals++;
    if (schemaOrgName.toLowerCase().includes(bLower)) brandConsistencySignals++;
  }
  let brandMentions = 0;
  if (brandName && brandName.length >= 2) {
    const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    brandMentions = (bodyText.match(new RegExp(escaped, 'gi')) || []).length;
  }

  // Numerical & Statistical data points
  const statsMatches =
    bodyText.match(/\b\d+(?:\.\d+)?(?:\s*%|\s*\+|\s*x\b|\s*(?:ms|kb|mb|gb|sec|seconds|minutes|hours|days|months|years|users|clients|projects|million|billion|k\b))|(?:RM|\$|€|£)\s*\d[\d,.]*/gi) || [];
  const dataAttributionMatches =
    bodyText.match(/(?:according to|source:|study|research|survey|report|benchmark|data from|published by|per\s+[A-Z][a-z]+)[^.]{0,120}\d+/gi) || [];

  // Key-value patterns
  const keyValueMatches = [];
  $('li, p, td').each((_, el) => {
    const txt = $(el).text().replace(/\s+/g, ' ').trim();
    if (txt.length >= 8 && txt.length <= 140 && /^[A-Z][A-Za-z0-9\s/-]{2,28}:\s+.{3,}$/.test(txt)) {
      keyValueMatches.push(txt);
    }
  });

  // Content pattern detections
  const definitionSignals = /\b(is a|is an|is the|are the|refers to|defined as|means that|stands for)\b/i.test(bodyText);
  const stepByStepDetected = olCount > 0 || /\b(step\s*1|step\s*one|1\.\s+[A-Z])/i.test(bodyText);
  const citationSignals =
    /\b(according to|cited by|source:|research by|study by|report by|as reported by|arxiv|doi\.org)\b/i.test(bodyText) ||
    /\[\d+\]/.test(bodyText);
  const summarySignals =
    /\b(summary|in summary|key takeaways|takeaways|tl;dr|overview|conclusion|in conclusion|final thoughts|bottom line)\b/i.test(bodyText);
  const conclusionSignals =
    /\b(conclusion|in conclusion|to summarize|recommendation|recommended|get started|next steps|ready to|final verdict|wrap up)\b/i.test(bodyText);
  const comparisonSignals =
    /\b(vs\.?|versus|compared to|comparison|difference between|pros and cons|better than|alternative to|alternatives)\b/i.test(bodyText);
  const multiPerspectiveSignals =
    /\b(on the other hand|however,|although|trade-off|tradeoff|drawback|downside|limitation|conversely|alternatively|pros and cons|whereas)\b/i.test(bodyText);
  const actionableSignals =
    /\b(how to|step-by-step|checklist|best practices|start by|make sure|follow these|tips to|guide to|you can|choose the|implement|optimize)\b/i.test(bodyText);
  const originalResearchSignals =
    /\b(our research|our data|our team|our clients|we tested|we analyzed|we found|proprietary|in-house|first-hand|our experience|benchmark|survey)\b/i.test(bodyText);
  const expertQuotesSignals =
    $('blockquote').length > 0 ||
    /[“"][^”"]{20,240}[”"]\s*(?:—|-|–|,)\s*[A-Z]/.test(bodyText) ||
    /\b(testimonial|client review|ceo|founder|director|expert)\b/i.test(bodyLower) ||
    schemaTypes.some((t) => /^(Review|AggregateRating)$/i.test(t));
  const caseStudySignals =
    /\b(case study|case studies|for example|e\.g\.|real-world example|success story|client result|portfolio example)\b/i.test(bodyText);

  // Domain/industry terminology (specialized multi-syllable or compound technical terms)
  const industryTermsSet = new Set();
  for (const w of words) {
    const lw = w.toLowerCase();
    if (lw.length >= 9 && !STOP_WORDS.has(lw) && /^[a-z]+$/.test(lw)) {
      industryTermsSet.add(lw);
    }
  }

  // Formatting variety out of 6
  const formatTypesUsed = [
    allHeadings.length >= 2,
    $('strong, b').length > 0,
    totalLists > 0,
    tablesCount > 0 || dlCount > 0,
    $('blockquote, details').length > 0,
    codeBlocksCount > 0 || images.total > 0,
  ].filter(Boolean).length;

  // Cloaking & Popup/Paywall checks
  let cloakingSignals = 0;
  $('[style]').each((_, el) => {
    const st = ($(el).attr('style') || '').toLowerCase();
    const txt = $(el).text().trim();
    if (txt.length > 80 && (/font-size\s*:\s*0\b/.test(st) || /text-indent\s*:\s*-9999/.test(st))) {
      cloakingSignals++;
    }
  });
  const hasPopupWallSignals =
    jsonLdObjects.some((o) => o.isAccessibleForFree === false || o.isAccessibleForFree === 'False') ||
    $('[class*="paywall" i], [id*="paywall" i]').length > 0;

  // E-E-A-T & Trust counts
  const eeatCount = [
    hasAuthorByline,
    trustLinks.about,
    trustLinks.contact,
    trustLinks.privacy || trustLinks.terms,
    orgSchemas.length > 0 || isHttps,
  ].filter(Boolean).length;

  const trustSignalsCount = [
    isHttps,
    trustLinks.about,
    trustLinks.contact,
    trustLinks.privacy,
    trustLinks.terms,
  ].filter(Boolean).length;

  return {
    $,
    page,
    aux,
    parsedUrl,
    origin,
    hostname,
    isHttps,
    hasDoctype,
    htmlLang,
    title,
    titleLength: title.length,
    metaDescription,
    metaDescLength: metaDescription.length,
    viewport,
    charset,
    themeColor,
    metaRefresh,
    robotsMeta,
    combinedRobotsMeta,
    metaKeywords,
    canonical,
    canonicalNormalized: canonical ? normalizeUrlForCompare(canonical, origin) : '',
    pageNormalized: normalizeUrlForCompare(page.finalUrl, origin),
    ogUrlNormalized: og.url ? normalizeUrlForCompare(og.url, origin) : '',
    favicon,
    appleTouchIcon,
    webManifest,
    rssFeeds,
    hreflangTags,
    resourceHints,
    fontPreloads,
    og,
    twitter,
    headingsByLevel,
    allHeadings,
    headingHierarchyHasGaps,
    distinctHeadingLevels,
    questionHeadings,
    questionTypes: [...questionTypes],
    jsonLdBlocks,
    jsonLdObjects,
    jsonLdTotalBytes,
    jsonLdInvalidCount,
    schemaTypes,
    schemaMissingProps,
    orgSchemas,
    personSchemas,
    hasOrgLogo,
    sameAsLinks,
    authoritativeSameAsLinks,
    schemaDates,
    authorFromSchema,
    authorHasCredentials,
    hasSpeakable,
    hasSearchAction,
    hasFaqSchema,
    hasHowToSchema,
    hasBreadcrumbSchema,
    hasVideoSchema,
    hasStructuredData: jsonLdBlocks.length > 0 || hasMicrodata || hasRdfa,
    bodyText,
    bodyTextBytes,
    textHtmlRatioPct,
    boilerplatePct,
    words,
    wordCount,
    first200WordsText,
    sentences,
    sentenceCount,
    avgWordsPerSentence,
    longSentencePct,
    shortSentencePct,
    readabilityScore,
    passivePct,
    paragraphs,
    firstSubstantialParagraph,
    conciseParagraphPct,
    optimalParagraphPct,
    firstPersonCount,
    pronounDensity,
    conversationalCount,
    namedEntities,
    titleKeywords,
    titleH1OverlapPct,
    titleKeywordsInBodyPct,
    titleKeywordsInFirst200Pct,
    topWord,
    keywordStuffingMaxPct,
    contentSectionsCount,
    h2Sections,
    avgH2SectionWords,
    directAnswersCount,
    answerBoxParagraphsCount,
    qaBlocksCount,
    citablePassagesPct,
    sectionsWithSubtopics,
    ulCount,
    olCount,
    dlCount,
    totalLists,
    tablesCount,
    codeBlocksCount,
    detailsCount,
    accordionCount,
    figuresCount,
    figcaptionsCount,
    timeElements,
    videosCount,
    dataVizCount,
    semanticTagsFound,
    deprecatedTagsFound,
    hasMainLandmark,
    hasNavLandmark,
    hasSkipLink,
    ariaLandmarksCount,
    tocDetected,
    domElementCount,
    uniqueIdsCount: idCounts.size,
    duplicateIds,
    formInputsTotal,
    formInputsLabeled,
    iframesTotal,
    iframesUnsafe,
    images,
    internalLinks,
    externalLinks,
    externalDomains: [...externalDomains],
    authorityLinks,
    emptyHrefsCount,
    genericAnchorsCount,
    nofollowCount,
    targetBlankCount,
    targetBlankMissingNoopener,
    totalLinks,
    contextualLinksCount,
    trustLinks,
    inlineCssBytes,
    inlineJsBytes,
    hasFontDisplaySwap,
    externalScripts,
    renderBlockingScripts,
    thirdPartyScriptDomains: [...thirdPartyScriptDomains],
    mixedContentUrls,
    hasAuthorByline,
    hasVisibleAuthorEl,
    metaAuthor,
    hasDateInfo,
    lastModifiedHeader,
    metaModified,
    updateWithin90Days,
    recentYearMentioned,
    brandName,
    brandMentions,
    brandConsistencySignals,
    statsMatches,
    dataAttributionMatches,
    keyValueMatches,
    definitionSignals,
    stepByStepDetected,
    citationSignals,
    summarySignals,
    conclusionSignals,
    comparisonSignals,
    multiPerspectiveSignals,
    actionableSignals,
    originalResearchSignals,
    expertQuotesSignals,
    caseStudySignals,
    industryTerms: [...industryTermsSet],
    formatTypesUsed,
    cloakingSignals,
    hasPopupWallSignals,
    eeatCount,
    trustSignalsCount,
    ISO_639_1_CODES,
  };
}

module.exports = { buildScanContext };
