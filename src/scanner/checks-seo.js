const { getGuidance } = require('./metadata');

function makeCheck(id, subCategory, priority, status, description) {
  const g = getGuidance(id);
  return {
    id,
    pillar: 'SEO',
    subCategory,
    priority,
    status,
    description,
    impact: g.impact,
    howToFix: g.howToFix,
  };
}

function runSeoChecks(ctx) {
  const checks = [];
  const { $, page, aux, images, headingsByLevel, og, twitter, trustLinks } = ctx;
  const headers = page.headers || {};

  // 1. title_exists
  checks.push(
    makeCheck(
      'title_exists',
      'Meta',
      'CRITICAL',
      ctx.title ? 'PASS' : 'FAIL',
      ctx.title
        ? `Title tag found: "${ctx.title.length > 62 ? ctx.title.slice(0, 59) + '...' : ctx.title}"`
        : 'No <title> tag found on page'
    )
  );

  // 2. title_length
  const titleLenOk = ctx.titleLength >= 20 && ctx.titleLength <= 65;
  checks.push(
    makeCheck(
      'title_length',
      'Meta',
      'CRITICAL',
      titleLenOk ? 'PASS' : 'FAIL',
      ctx.titleLength === 0
        ? 'Title length: 0 characters (missing title tag)'
        : ctx.titleLength > 65
          ? `Title length: ${ctx.titleLength} characters (too long, keep under 60)`
          : ctx.titleLength < 20
            ? `Title length: ${ctx.titleLength} characters (too short, aim for 30-60)`
            : `Title length: ${ctx.titleLength} characters (optimal)`
    )
  );

  // 3. desc_exists
  checks.push(
    makeCheck(
      'desc_exists',
      'Meta',
      'HIGH',
      ctx.metaDescription ? 'PASS' : 'FAIL',
      ctx.metaDescription
        ? `Meta description found (${ctx.metaDescLength} chars)`
        : 'Missing meta description tag'
    )
  );

  // 4. desc_length
  const descLenOk = ctx.metaDescLength >= 70 && ctx.metaDescLength <= 165;
  checks.push(
    makeCheck(
      'desc_length',
      'Meta',
      'HIGH',
      descLenOk ? 'PASS' : 'FAIL',
      ctx.metaDescLength === 0
        ? 'Description length: 0 chars (missing)'
        : ctx.metaDescLength > 165
          ? `Description length: ${ctx.metaDescLength} chars (too long)`
          : ctx.metaDescLength < 70
            ? `Description length: ${ctx.metaDescLength} chars (too short, aim for 120-160)`
            : `Description length: ${ctx.metaDescLength} chars (optimal)`
    )
  );

  // 5. viewport
  checks.push(
    makeCheck(
      'viewport',
      'Meta',
      'HIGH',
      ctx.viewport ? 'PASS' : 'FAIL',
      ctx.viewport ? 'Viewport meta tag found (mobile-friendly)' : 'Missing viewport meta tag'
    )
  );

  // 6. charset
  const isUtf8 = /utf-?8/i.test(ctx.charset) || /utf-?8/i.test(page.contentType);
  checks.push(
    makeCheck(
      'charset',
      'Meta',
      'MEDIUM',
      isUtf8 ? 'PASS' : 'FAIL',
      isUtf8 ? 'UTF-8 charset declared' : 'UTF-8 charset meta tag not declared'
    )
  );

  // 7. lang_attr
  checks.push(
    makeCheck(
      'lang_attr',
      'Meta',
      'MEDIUM',
      ctx.htmlLang ? 'PASS' : 'FAIL',
      ctx.htmlLang ? `Language attribute set on HTML tag (${ctx.htmlLang})` : 'Missing lang attribute on <html> tag'
    )
  );

  // 8. theme_color
  checks.push(
    makeCheck(
      'theme_color',
      'Meta',
      'LOW',
      ctx.themeColor ? 'PASS' : 'FAIL',
      ctx.themeColor ? `Theme color set: ${ctx.themeColor}` : 'No theme-color meta tag set'
    )
  );

  // 9. meta_refresh
  checks.push(
    makeCheck(
      'meta_refresh',
      'Technical',
      'HIGH',
      !ctx.metaRefresh ? 'PASS' : 'FAIL',
      !ctx.metaRefresh
        ? 'No meta refresh redirect (good)'
        : `Meta refresh redirect detected: "${ctx.metaRefresh}"`
    )
  );

  // 10. robots_meta
  const hasNoindex = /\bnoindex\b/i.test(ctx.combinedRobotsMeta);
  checks.push(
    makeCheck(
      'robots_meta',
      'Technical',
      'CRITICAL',
      !hasNoindex ? 'PASS' : 'FAIL',
      hasNoindex
        ? `Page blocks indexing via robots directive: "${ctx.combinedRobotsMeta}"`
        : ctx.robotsMeta
          ? `Robots: "${ctx.robotsMeta}"`
          : 'No blocking robots meta directive (indexable by default)'
    )
  );

  // 11. meta_keywords
  checks.push(
    makeCheck(
      'meta_keywords',
      'Meta',
      'LOW',
      'PASS',
      ctx.metaKeywords
        ? 'meta keywords tag found — deprecated since 2009, Google ignores it. Remove to keep HTML clean'
        : 'No deprecated meta keywords tag (clean HTML)'
    )
  );

  // 12. h1_exists
  const h1Count = headingsByLevel[1].length;
  checks.push(
    makeCheck(
      'h1_exists',
      'Meta',
      'CRITICAL',
      h1Count === 1 ? 'PASS' : 'FAIL',
      h1Count === 1
        ? 'Single H1 tag found'
        : h1Count === 0
          ? 'No H1 tag found on page'
          : `${h1Count} H1 tags found — use a single primary H1`
    )
  );

  // 13. title_h1_alignment
  checks.push(
    makeCheck(
      'title_h1_alignment',
      'Other',
      'MEDIUM',
      ctx.titleH1OverlapPct >= 30 ? 'PASS' : 'FAIL',
      ctx.titleH1OverlapPct >= 30
        ? `Title-H1 alignment: ${ctx.titleH1OverlapPct}% word overlap (well aligned)`
        : `Title-H1 alignment: ${ctx.titleH1OverlapPct}% word overlap — title and H1 should share key terms`
    )
  );

  // 14. h2_exists
  checks.push(
    makeCheck(
      'h2_exists',
      'Content',
      'MEDIUM',
      headingsByLevel[2].length > 0 ? 'PASS' : 'FAIL',
      headingsByLevel[2].length > 0
        ? `${headingsByLevel[2].length} H2 tags found`
        : 'No H2 subheadings found — add H2 tags to structure content'
    )
  );

  // 15. heading_hierarchy
  checks.push(
    makeCheck(
      'heading_hierarchy',
      'Meta',
      'MEDIUM',
      !ctx.headingHierarchyHasGaps && ctx.allHeadings.length > 0 ? 'PASS' : 'FAIL',
      ctx.allHeadings.length === 0
        ? 'No heading tags found on page'
        : !ctx.headingHierarchyHasGaps
          ? 'Heading hierarchy follows sequential order without gaps'
          : 'Heading hierarchy has gaps (e.g. H1 to H3 without H2)'
    )
  );

  // 16. word_count
  checks.push(
    makeCheck(
      'word_count',
      'Content',
      'HIGH',
      ctx.wordCount >= 300 ? 'PASS' : 'FAIL',
      ctx.wordCount >= 300
        ? `${ctx.wordCount} words on page (good content depth)`
        : `Only ${ctx.wordCount} words on page — thin content (aim for 300+ words)`
    )
  );

  // 17. readability_score
  checks.push(
    makeCheck(
      'readability_score',
      'Content',
      'LOW',
      ctx.readabilityScore >= 30 ? 'PASS' : 'FAIL',
      ctx.readabilityScore >= 60
        ? `Readability: ${ctx.readabilityScore} (easy to read)`
        : ctx.readabilityScore >= 30
          ? `Readability: ${ctx.readabilityScore} (moderate — aim for 60+)`
          : `Readability: ${ctx.readabilityScore} (difficult — simplify sentence structure)`
    )
  );

  // 18. sentence_length
  checks.push(
    makeCheck(
      'sentence_length',
      'Other',
      'LOW',
      ctx.longSentencePct <= 25 ? 'PASS' : 'FAIL',
      ctx.longSentencePct <= 25
        ? `${ctx.longSentencePct}% long sentences (>20 words) — good scannability`
        : `${ctx.longSentencePct}% long sentences (>20 words) — break up for readability`
    )
  );

  // 19. img_alt
  const missingAlt = images.total - images.withAlt;
  checks.push(
    makeCheck(
      'img_alt',
      'Technical',
      'HIGH',
      images.total === 0 || missingAlt === 0 ? 'PASS' : 'FAIL',
      images.total === 0
        ? 'No <img> elements on page'
        : missingAlt === 0
          ? `All ${images.total} images have ALT text`
          : `${missingAlt} of ${images.total} images missing ALT text`
    )
  );

  // 20. img_dimensions
  checks.push(
    makeCheck(
      'img_dimensions',
      'Technical',
      'HIGH',
      images.total === 0 || images.missingDimensions === 0 ? 'PASS' : 'FAIL',
      images.total === 0
        ? 'No <img> elements to check for dimensions'
        : images.missingDimensions === 0
          ? `All ${images.total} images specify width and height`
          : `${images.missingDimensions} images missing width/height — causes layout shift (CLS)`
    )
  );

  // 21. img_lazy
  const hasLazy = images.total <= 2 || images.lazyCount > 0 || images.jsLazyDetected;
  checks.push(
    makeCheck(
      'img_lazy',
      'Technical',
      'LOW',
      hasLazy ? 'PASS' : 'FAIL',
      images.total <= 2
        ? `${images.total} image(s) on page — lazy loading not required`
        : images.lazyCount > 0
          ? `Native lazy loading detected on ${images.lazyCount}/${images.total} images`
          : images.jsLazyDetected
            ? 'JS-based lazy loading detected'
            : `No lazy loading detected across ${images.total} images — add loading="lazy"`
    )
  );

  // 22. img_modern_format
  const modernRatio = images.total > 0 ? images.modernFormatCount / images.total : 1;
  checks.push(
    makeCheck(
      'img_modern_format',
      'Other',
      'MEDIUM',
      images.total === 0 || modernRatio >= 0.5 ? 'PASS' : 'FAIL',
      images.total === 0
        ? 'No images to check for modern formats'
        : modernRatio >= 0.5
          ? `${images.modernFormatCount} of ${images.total} images use modern formats (WebP/AVIF/SVG)`
          : `${images.legacyFormatCount} of ${images.total} images use legacy formats (JPG/PNG/GIF) — convert to WebP/AVIF for 25-50% smaller files`
    )
  );

  // 23. internal_links
  checks.push(
    makeCheck(
      'internal_links',
      'Content',
      'MEDIUM',
      ctx.internalLinks.length >= 3 ? 'PASS' : 'FAIL',
      ctx.internalLinks.length >= 3
        ? `${ctx.internalLinks.length} internal links found`
        : `Only ${ctx.internalLinks.length} internal link(s) found — add more internal navigation links`
    )
  );

  // 24. external_links
  checks.push(
    makeCheck(
      'external_links',
      'Content',
      'LOW',
      ctx.externalLinks.length >= 1 ? 'PASS' : 'FAIL',
      ctx.externalLinks.length >= 1
        ? `${ctx.externalLinks.length} external links found`
        : 'No external links found — link to credible references where relevant'
    )
  );

  // 25. empty_hrefs
  checks.push(
    makeCheck(
      'empty_hrefs',
      'Technical',
      'MEDIUM',
      ctx.emptyHrefsCount === 0 ? 'PASS' : 'FAIL',
      ctx.emptyHrefsCount === 0
        ? 'No empty href attributes found'
        : `${ctx.emptyHrefsCount} link(s) have empty or "#" href attributes`
    )
  );

  // 26. descriptive_anchors
  checks.push(
    makeCheck(
      'descriptive_anchors',
      'Content',
      'LOW',
      ctx.genericAnchorsCount === 0 ? 'PASS' : 'FAIL',
      ctx.genericAnchorsCount === 0
        ? 'All link texts are descriptive (no "click here" or "read more")'
        : `${ctx.genericAnchorsCount} link(s) use generic anchor text ("click here", "read more", etc.)`
    )
  );

  // 27-32. Open Graph checks
  checks.push(makeCheck('og_title', 'Social', 'MEDIUM', og.title ? 'PASS' : 'FAIL', og.title ? 'Open Graph title found' : 'Missing og:title meta tag'));
  checks.push(makeCheck('og_desc', 'Social', 'MEDIUM', og.description ? 'PASS' : 'FAIL', og.description ? 'Open Graph description found' : 'Missing og:description meta tag'));
  checks.push(makeCheck('og_image', 'Social', 'MEDIUM', og.image ? 'PASS' : 'FAIL', og.image ? 'Open Graph image found' : 'Missing og:image meta tag'));
  checks.push(makeCheck('og_url', 'Social', 'LOW', og.url ? 'PASS' : 'FAIL', og.url ? 'Open Graph URL found' : 'Missing og:url meta tag'));
  checks.push(makeCheck('og_type', 'Social', 'LOW', og.type ? 'PASS' : 'FAIL', og.type ? `og:type set to "${og.type}"` : 'Missing og:type meta tag'));
  checks.push(makeCheck('og_site_name', 'Social', 'LOW', og.siteName ? 'PASS' : 'FAIL', og.siteName ? `og:site_name: "${og.siteName}"` : 'Missing og:site_name meta tag'));

  // 33-36. Twitter Card checks
  checks.push(makeCheck('twitter_card', 'Social', 'LOW', twitter.card ? 'PASS' : 'FAIL', twitter.card ? `Twitter Card: "${twitter.card}"` : 'Missing twitter:card meta tag'));
  checks.push(makeCheck('twitter_title', 'Social', 'LOW', twitter.title ? 'PASS' : 'FAIL', twitter.title ? 'Twitter title found' : 'Missing twitter:title meta tag'));
  checks.push(makeCheck('twitter_desc', 'Social', 'LOW', twitter.description ? 'PASS' : 'FAIL', twitter.description ? 'Twitter description found' : 'Missing twitter:description meta tag'));
  checks.push(makeCheck('twitter_image', 'Social', 'LOW', twitter.image ? 'PASS' : 'FAIL', twitter.image ? 'Twitter image found' : 'Missing twitter:image meta tag'));

  // 37. https
  checks.push(
    makeCheck(
      'https',
      'Security',
      'CRITICAL',
      ctx.isHttps ? 'PASS' : 'FAIL',
      ctx.isHttps ? 'HTTPS enabled' : 'Site is not served over HTTPS'
    )
  );

  // 38. canonical
  checks.push(
    makeCheck(
      'canonical',
      'Technical',
      'HIGH',
      ctx.canonical ? 'PASS' : 'FAIL',
      ctx.canonical ? 'Canonical tag found' : 'Missing <link rel="canonical"> tag'
    )
  );

  // 39. canonical_self
  const canonicalMatches = Boolean(ctx.canonical) && ctx.canonicalNormalized === ctx.pageNormalized;
  checks.push(
    makeCheck(
      'canonical_self',
      'Technical',
      'MEDIUM',
      !ctx.canonical ? 'FAIL' : canonicalMatches ? 'PASS' : 'FAIL',
      !ctx.canonical
        ? 'No canonical tag to verify self-referencing'
        : canonicalMatches
          ? 'Canonical tag is self-referencing (correct)'
          : `Canonical points elsewhere: ${ctx.canonical}`
    )
  );

  // 40. favicon
  checks.push(
    makeCheck(
      'favicon',
      'Technical',
      'LOW',
      ctx.favicon ? 'PASS' : 'FAIL',
      ctx.favicon ? 'Favicon found' : 'No <link rel="icon"> favicon tag found in <head>'
    )
  );

  // 41. apple_touch_icon
  checks.push(
    makeCheck(
      'apple_touch_icon',
      'Technical',
      'LOW',
      ctx.appleTouchIcon ? 'PASS' : 'FAIL',
      ctx.appleTouchIcon ? 'Apple touch icon found' : 'Missing apple-touch-icon link tag'
    )
  );

  // 42. compression
  const contentEncoding = (headers['content-encoding'] || '').toLowerCase();
  const hasCompression = /gzip|br|deflate|zstd/.test(contentEncoding);
  checks.push(
    makeCheck(
      'compression',
      'Technical',
      'MEDIUM',
      hasCompression ? 'PASS' : 'FAIL',
      hasCompression
        ? `Compression: ${contentEncoding}`
        : 'No HTTP compression (gzip/brotli) detected in response headers'
    )
  );

  // 43. url_length
  const urlLen = page.finalUrl.length;
  checks.push(
    makeCheck(
      'url_length',
      'Technical',
      'LOW',
      urlLen <= 100 ? 'PASS' : 'FAIL',
      urlLen <= 100
        ? `URL length: ${urlLen} chars (good)`
        : `URL length: ${urlLen} chars (too long — keep under 100)`
    )
  );

  // 44. url_hyphens
  const hasUnderscores = ctx.parsedUrl.pathname.includes('_');
  checks.push(
    makeCheck(
      'url_hyphens',
      'Technical',
      'LOW',
      !hasUnderscores ? 'PASS' : 'FAIL',
      !hasUnderscores
        ? 'URL uses hyphens or no separators (good)'
        : 'URL path contains underscores — use hyphens (-) instead'
    )
  );

  // 45. hreflang
  checks.push(
    makeCheck(
      'hreflang',
      'Technical',
      'LOW',
      ctx.hreflangTags.length > 0 ? 'PASS' : 'N/A',
      ctx.hreflangTags.length > 0
        ? `${ctx.hreflangTags.length} hreflang tags found (multi-language)`
        : 'No hreflang tags found (optional for single-language sites)'
    )
  );

  // 46. deprecated_html
  checks.push(
    makeCheck(
      'deprecated_html',
      'Technical',
      'LOW',
      ctx.deprecatedTagsFound.length === 0 ? 'PASS' : 'FAIL',
      ctx.deprecatedTagsFound.length === 0
        ? 'No deprecated HTML tags found'
        : `Deprecated HTML tags detected: ${ctx.deprecatedTagsFound.join(', ')}`
    )
  );

  // 47. text_html_ratio
  checks.push(
    makeCheck(
      'text_html_ratio',
      'Content',
      'LOW',
      ctx.textHtmlRatioPct >= 10 ? 'PASS' : 'FAIL',
      ctx.textHtmlRatioPct >= 10
        ? `Text-to-HTML ratio: ${ctx.textHtmlRatioPct}% (healthy)`
        : `Text-to-HTML ratio: ${ctx.textHtmlRatioPct}% — too code-heavy, add more content or reduce inline bloat`
    )
  );

  // 48. inline_css
  const inlineCssKb = Number((ctx.inlineCssBytes / 1024).toFixed(1));
  checks.push(
    makeCheck(
      'inline_css',
      'Technical',
      'LOW',
      inlineCssKb <= 50 ? 'PASS' : 'FAIL',
      inlineCssKb <= 50
        ? `Inline CSS: ${inlineCssKb} KB (acceptable)`
        : `Inline CSS: ${inlineCssKb} KB — too much, move to external stylesheet`
    )
  );

  // 49. inline_js
  const inlineJsKb = Number((ctx.inlineJsBytes / 1024).toFixed(1));
  checks.push(
    makeCheck(
      'inline_js',
      'Technical',
      'LOW',
      inlineJsKb <= 50 ? 'PASS' : 'FAIL',
      inlineJsKb <= 50
        ? `Inline JS: ${inlineJsKb} KB (acceptable)`
        : `Inline JS: ${inlineJsKb} KB — consider moving large scripts to external files`
    )
  );

  // 50. script_defer
  const unDeferred = ctx.externalScripts.filter((s) => !s.hasDefer && !s.hasAsync && !s.isModule);
  checks.push(
    makeCheck(
      'script_defer',
      'Technical',
      'MEDIUM',
      unDeferred.length === 0 ? 'PASS' : 'FAIL',
      ctx.externalScripts.length === 0
        ? 'No external scripts'
        : unDeferred.length === 0
          ? `All ${ctx.externalScripts.length} external script(s) use defer/async/module`
          : `${unDeferred.length} of ${ctx.externalScripts.length} external script(s) missing defer or async`
    )
  );

  // 51. font_preload
  checks.push(
    makeCheck(
      'font_preload',
      'Technical',
      'LOW',
      ctx.fontPreloads.length > 0 ? 'PASS' : 'FAIL',
      ctx.fontPreloads.length > 0
        ? 'Font preload/preconnect found — faster font loading'
        : 'No font preload or preconnect resource hint found'
    )
  );

  // 52. cache_control
  const cacheControl = headers['cache-control'] || '';
  checks.push(
    makeCheck(
      'cache_control',
      'Technical',
      'LOW',
      Boolean(cacheControl) ? 'PASS' : 'FAIL',
      cacheControl ? `Cache-Control: ${cacheControl}` : 'No Cache-Control header set'
    )
  );

  // 53. hsts
  const hsts = headers['strict-transport-security'] || '';
  checks.push(
    makeCheck(
      'hsts',
      'Security',
      'HIGH',
      Boolean(hsts) ? 'PASS' : 'FAIL',
      hsts ? `Strict-Transport-Security: ${hsts}` : 'No Strict-Transport-Security header'
    )
  );

  // 54. x_content_type
  const xcto = (headers['x-content-type-options'] || '').toLowerCase();
  checks.push(
    makeCheck(
      'x_content_type',
      'Other',
      'LOW',
      xcto.includes('nosniff') ? 'PASS' : 'FAIL',
      xcto.includes('nosniff')
        ? 'X-Content-Type-Options: nosniff set'
        : 'Missing X-Content-Type-Options header'
    )
  );

  // 55. csp
  const cspHeader = headers['content-security-policy'] || $('meta[http-equiv="Content-Security-Policy" i]').attr('content') || '';
  checks.push(
    makeCheck(
      'csp',
      'Security',
      'MEDIUM',
      Boolean(cspHeader) ? 'PASS' : 'FAIL',
      cspHeader ? 'Content-Security-Policy header configured' : 'No Content-Security-Policy header — XSS risk'
    )
  );

  // 56-59. Trust pages
  checks.push(makeCheck('trust_about', 'Other', 'MEDIUM', trustLinks.about ? 'PASS' : 'FAIL', trustLinks.about ? 'About page link found — builds trust and E-E-A-T' : 'No About page link found'));
  checks.push(makeCheck('trust_contact', 'Other', 'MEDIUM', trustLinks.contact ? 'PASS' : 'FAIL', trustLinks.contact ? 'Contact page/email link found' : 'No Contact page or email/phone link found'));
  checks.push(makeCheck('trust_privacy', 'Other', 'MEDIUM', trustLinks.privacy ? 'PASS' : 'FAIL', trustLinks.privacy ? 'Privacy Policy link found' : 'No Privacy Policy link — required by GDPR and improves trust'));
  checks.push(makeCheck('trust_terms', 'Other', 'LOW', trustLinks.terms ? 'PASS' : 'FAIL', trustLinks.terms ? 'Terms of Service link found' : 'No Terms of Service link — add for legal compliance and trust'));

  // 60. author_byline
  checks.push(
    makeCheck(
      'author_byline',
      'Other',
      'MEDIUM',
      ctx.hasAuthorByline ? 'PASS' : 'FAIL',
      ctx.hasAuthorByline
        ? ctx.authorFromSchema
          ? 'Author byline found + author in schema'
          : 'Author attribution found on page'
        : 'No author byline or author schema detected'
    )
  );

  // 61. jsonld
  checks.push(
    makeCheck(
      'jsonld',
      'Schema',
      'HIGH',
      ctx.jsonLdBlocks.length > 0 ? 'PASS' : 'FAIL',
      ctx.jsonLdBlocks.length > 0
        ? `${ctx.jsonLdBlocks.length} JSON-LD schema block(s) found`
        : 'No JSON-LD structured data blocks found'
    )
  );

  // 62. schema_types
  checks.push(
    makeCheck(
      'schema_types',
      'Schema',
      'MEDIUM',
      ctx.schemaTypes.length > 0 ? 'PASS' : 'FAIL',
      ctx.schemaTypes.length > 0
        ? `Schema types: ${ctx.schemaTypes.join(', ')}`
        : 'No Schema.org @type declarations detected'
    )
  );

  // 63. schema_overuse
  const schemaKb = Number((ctx.jsonLdTotalBytes / 1024).toFixed(1));
  const schemaExcessive = ctx.jsonLdBlocks.length > 5 || schemaKb > 12;
  checks.push(
    makeCheck(
      'schema_overuse',
      'Other',
      'MEDIUM',
      !schemaExcessive ? 'PASS' : 'FAIL',
      !schemaExcessive
        ? `JSON-LD size is concise (${ctx.jsonLdBlocks.length} block(s), ${schemaKb} KB)`
        : `Schema may be excessive: ${ctx.jsonLdBlocks.length} JSON-LD blocks, ${schemaKb} KB total — consider consolidating`
    )
  );

  // 64. html_doctype
  checks.push(
    makeCheck(
      'html_doctype',
      'Technical',
      'MEDIUM',
      ctx.hasDoctype ? 'PASS' : 'FAIL',
      ctx.hasDoctype ? '<!DOCTYPE html> declared' : 'Missing <!DOCTYPE html> declaration'
    )
  );

  // 65. mixed_content
  checks.push(
    makeCheck(
      'mixed_content',
      'Security',
      'HIGH',
      ctx.mixedContentUrls.length === 0 ? 'PASS' : 'FAIL',
      ctx.mixedContentUrls.length === 0
        ? 'No mixed content — all resources use HTTPS'
        : `${ctx.mixedContentUrls.length} insecure http:// resource(s) loaded on HTTPS page`
    )
  );

  // 66. structured_data_valid
  checks.push(
    makeCheck(
      'structured_data_valid',
      'Schema',
      'HIGH',
      ctx.jsonLdBlocks.length === 0
        ? 'FAIL'
        : ctx.jsonLdInvalidCount === 0
          ? 'PASS'
          : 'FAIL',
      ctx.jsonLdBlocks.length === 0
        ? 'No JSON-LD blocks to validate'
        : ctx.jsonLdInvalidCount === 0
          ? `All ${ctx.jsonLdBlocks.length} JSON-LD block(s) have valid syntax`
          : `${ctx.jsonLdInvalidCount} JSON-LD block(s) contain invalid JSON syntax`
    )
  );

  // 67. font_display
  checks.push(
    makeCheck(
      'font_display',
      'Technical',
      'LOW',
      ctx.hasFontDisplaySwap ? 'PASS' : 'FAIL',
      ctx.hasFontDisplaySwap
        ? 'font-display: swap detected — prevents invisible text'
        : 'No font-display: swap declaration detected'
    )
  );

  // 68. meta_viewport_content
  const hasDeviceWidth = /width\s*=\s*device-width/i.test(ctx.viewport);
  checks.push(
    makeCheck(
      'meta_viewport_content',
      'Technical',
      'HIGH',
      hasDeviceWidth ? 'PASS' : 'FAIL',
      hasDeviceWidth
        ? 'Viewport includes width=device-width (responsive)'
        : 'Viewport missing width=device-width directive'
    )
  );

  // 69. robots_txt
  const robotsOk = aux.robots.exists && !aux.robots.wildcardBlocked;
  checks.push(
    makeCheck(
      'robots_txt',
      'Technical',
      'HIGH',
      robotsOk ? 'PASS' : 'FAIL',
      !aux.robots.exists
        ? 'robots.txt not found at site root'
        : aux.robots.wildcardBlocked
          ? 'robots.txt blocks all crawlers (Disallow: /)'
          : 'robots.txt found and allows crawling'
    )
  );

  // 70. robots_txt_sitemap
  checks.push(
    makeCheck(
      'robots_txt_sitemap',
      'Technical',
      'MEDIUM',
      aux.robots.sitemaps.length > 0 ? 'PASS' : 'FAIL',
      aux.robots.sitemaps.length > 0
        ? 'robots.txt includes Sitemap reference'
        : 'robots.txt does not include a Sitemap directive'
    )
  );

  // 71. ai_crawlers_blocked
  checks.push(
    makeCheck(
      'ai_crawlers_blocked',
      'Technical',
      'MEDIUM',
      aux.robots.blockedAiCrawlers.length === 0 ? 'PASS' : 'FAIL',
      aux.robots.blockedAiCrawlers.length === 0
        ? 'No AI crawlers blocked in robots.txt — AI search and training can access content'
        : `AI crawlers blocked in robots.txt: ${aux.robots.blockedAiCrawlers.join(', ')}`
    )
  );

  // 72. sitemap_xml
  checks.push(
    makeCheck(
      'sitemap_xml',
      'Technical',
      'HIGH',
      aux.sitemap.exists && aux.sitemap.valid ? 'PASS' : 'FAIL',
      aux.sitemap.exists && aux.sitemap.valid
        ? 'sitemap.xml found with valid format'
        : 'No valid sitemap.xml found'
    )
  );

  // 73. sitemap_urls
  checks.push(
    makeCheck(
      'sitemap_urls',
      'Technical',
      'MEDIUM',
      aux.sitemap.urlCount > 0 ? 'PASS' : 'FAIL',
      aux.sitemap.urlCount > 0
        ? `Sitemap contains ${aux.sitemap.urlCount} URL(s)`
        : 'Sitemap contains 0 URLs or was not found'
    )
  );

  // 74. broken_links
  const sampled = aux.sampledLinks || { checked: 0, working: 0, broken: [] };
  checks.push(
    makeCheck(
      'broken_links',
      'Technical',
      'HIGH',
      sampled.broken.length === 0 ? 'PASS' : 'FAIL',
      sampled.checked === 0
        ? 'No internal links available to probe'
        : sampled.broken.length === 0
          ? `All ${sampled.checked} checked internal links are working`
          : `${sampled.broken.length} of ${sampled.checked} checked internal link(s) returned errors`
    )
  );

  // 75. nofollow_ratio
  const totalNavigableLinks = ctx.internalLinks.length + ctx.externalLinks.length;
  const nofollowPct = totalNavigableLinks > 0
    ? Math.round((ctx.nofollowCount / totalNavigableLinks) * 100)
    : 0;
  checks.push(
    makeCheck(
      'nofollow_ratio',
      'Technical',
      'LOW',
      nofollowPct <= 30 ? 'PASS' : 'FAIL',
      nofollowPct <= 30
        ? `${nofollowPct}% nofollow links (${ctx.nofollowCount}/${totalNavigableLinks}) — good link equity flow`
        : `${nofollowPct}% nofollow links (${ctx.nofollowCount}/${totalNavigableLinks}) — excessive nofollow restricts equity flow`
    )
  );

  // 76. og_image_url
  const ogImgAbsolute = /^https?:\/\//i.test(og.image);
  checks.push(
    makeCheck(
      'og_image_url',
      'Social',
      'LOW',
      ogImgAbsolute ? 'PASS' : 'FAIL',
      ogImgAbsolute
        ? 'OG image uses absolute URL (correct)'
        : og.image
          ? `OG image uses relative URL ("${og.image}") — switch to absolute https:// URL`
          : 'No og:image URL configured'
    )
  );

  // 77. link_noopener
  checks.push(
    makeCheck(
      'link_noopener',
      'Security',
      'LOW',
      ctx.targetBlankMissingNoopener === 0 ? 'PASS' : 'FAIL',
      ctx.targetBlankCount === 0
        ? 'No target="_blank" links found'
        : ctx.targetBlankMissingNoopener === 0
          ? `All ${ctx.targetBlankCount} target="_blank" links have rel="noopener"`
          : `${ctx.targetBlankMissingNoopener} of ${ctx.targetBlankCount} target="_blank" links missing rel="noopener"`
    )
  );

  // 78. web_manifest
  checks.push(
    makeCheck(
      'web_manifest',
      'Technical',
      'LOW',
      ctx.webManifest ? 'PASS' : 'FAIL',
      ctx.webManifest ? 'Web App Manifest found (PWA-ready)' : 'No Web App Manifest link found'
    )
  );

  // 79. resource_hints
  checks.push(
    makeCheck(
      'resource_hints',
      'Technical',
      'LOW',
      ctx.resourceHints.length > 0 ? 'PASS' : 'FAIL',
      ctx.resourceHints.length > 0
        ? `${ctx.resourceHints.length} resource hint(s) (dns-prefetch/preconnect/preload) — faster loading`
        : 'No resource hints (preconnect/dns-prefetch) found'
    )
  );

  // 80. schema_required_props
  checks.push(
    makeCheck(
      'schema_required_props',
      'Schema',
      'MEDIUM',
      ctx.jsonLdObjects.length === 0
        ? 'FAIL'
        : ctx.schemaMissingProps.length === 0
          ? 'PASS'
          : 'FAIL',
      ctx.jsonLdObjects.length === 0
        ? 'No JSON-LD schema objects found'
        : ctx.schemaMissingProps.length === 0
          ? 'All schema types have required properties'
          : `Missing required schema properties: ${ctx.schemaMissingProps.slice(0, 5).join(', ')}`
    )
  );

  // 81. first_person
  checks.push(
    makeCheck(
      'first_person',
      'Content',
      'LOW',
      ctx.firstPersonCount >= 3 ? 'PASS' : 'FAIL',
      ctx.firstPersonCount >= 3
        ? `${ctx.firstPersonCount} first-person pronouns — strong personal experience`
        : `Only ${ctx.firstPersonCount} first-person pronouns — add real first-hand perspective`
    )
  );

  // 82. hreflang_valid
  if (ctx.hreflangTags.length === 0) {
    checks.push(makeCheck('hreflang_valid', 'Technical', 'LOW', 'N/A', 'No hreflang tags present on page'));
  } else {
    const invalidCodes = ctx.hreflangTags
      .map((t) => t.code)
      .filter((code) => {
        if (code.toLowerCase() === 'x-default') return false;
        const primary = code.split('-')[0].toLowerCase();
        return !ctx.ISO_639_1_CODES.has(primary);
      });
    checks.push(
      makeCheck(
        'hreflang_valid',
        'Technical',
        'LOW',
        invalidCodes.length === 0 ? 'PASS' : 'FAIL',
        invalidCodes.length === 0
          ? `All ${ctx.hreflangTags.length} hreflang codes are valid ISO 639-1`
          : `Invalid hreflang codes found: ${invalidCodes.join(', ')}`
      )
    );
  }

  // 83. hreflang_xdefault
  if (ctx.hreflangTags.length === 0) {
    checks.push(makeCheck('hreflang_xdefault', 'Technical', 'LOW', 'N/A', 'No hreflang tags present on page'));
  } else {
    const hasXDefault = ctx.hreflangTags.some((t) => t.code.toLowerCase() === 'x-default');
    checks.push(
      makeCheck(
        'hreflang_xdefault',
        'Technical',
        'LOW',
        hasXDefault ? 'PASS' : 'FAIL',
        hasXDefault
          ? 'hreflang x-default found — proper language fallback'
          : 'hreflang tags present without x-default fallback'
      )
    );
  }

  // 84. img_responsive
  const responsivePct = images.total > 0 ? Math.round((images.responsiveCount / images.total) * 100) : 100;
  checks.push(
    makeCheck(
      'img_responsive',
      'Other',
      'MEDIUM',
      images.total === 0 || responsivePct >= 50 ? 'PASS' : 'FAIL',
      images.total === 0
        ? 'No images to check for srcset'
        : responsivePct >= 50
          ? `${responsivePct}% of images use responsive srcset`
          : `Only ${responsivePct}% responsive images — add srcset for mobile`
    )
  );

  // 85. title_separator
  const hasPipe = ctx.title.includes('|');
  const hasDash = /\s[—–-]\s/.test(ctx.title);
  checks.push(
    makeCheck(
      'title_separator',
      'Meta',
      'LOW',
      ctx.title ? 'PASS' : 'FAIL',
      !ctx.title
        ? 'No title tag found'
        : hasPipe
          ? 'Title uses "|" separator — Google may rewrite it; consider using "—" instead'
          : hasDash
            ? 'Title uses clean dash separator'
            : 'Title does not use a brand separator (acceptable)'
    )
  );

  // 86. max_image_preview
  const hasLargeImgPreview = /max-image-preview\s*:\s*large/i.test(ctx.combinedRobotsMeta);
  checks.push(
    makeCheck(
      'max_image_preview',
      'Meta',
      'LOW',
      hasLargeImgPreview ? 'PASS' : 'FAIL',
      hasLargeImgPreview
        ? 'max-image-preview:large — eligible for Google Discover large images'
        : 'Missing max-image-preview:large robots directive'
    )
  );

  // 87. org_logo
  checks.push(
    makeCheck(
      'org_logo',
      'Other',
      'MEDIUM',
      ctx.hasOrgLogo ? 'PASS' : 'FAIL',
      ctx.hasOrgLogo
        ? 'Organization schema includes logo'
        : 'Organization schema missing logo — add for knowledge panel'
    )
  );

  // 88. x_frame_options
  const hasFrameProtection = Boolean(headers['x-frame-options']) || /frame-ancestors/i.test(cspHeader);
  checks.push(
    makeCheck(
      'x_frame_options',
      'Other',
      'LOW',
      hasFrameProtection ? 'PASS' : 'FAIL',
      hasFrameProtection
        ? `Clickjacking protection active (${headers['x-frame-options'] || 'CSP frame-ancestors'})`
        : 'Missing X-Frame-Options — clickjacking risk'
    )
  );

  // 89. referrer_policy
  const refPol = headers['referrer-policy'] || $('meta[name="referrer" i]').attr('content') || '';
  checks.push(
    makeCheck(
      'referrer_policy',
      'Other',
      'LOW',
      Boolean(refPol) ? 'PASS' : 'FAIL',
      refPol ? `Referrer-Policy: ${refPol}` : 'No Referrer-Policy header — may leak URL data'
    )
  );

  // 90. permissions_policy
  const permPol = headers['permissions-policy'] || headers['feature-policy'] || '';
  checks.push(
    makeCheck(
      'permissions_policy',
      'Other',
      'LOW',
      Boolean(permPol) ? 'PASS' : 'FAIL',
      permPol ? 'Permissions-Policy header configured' : 'No Permissions-Policy — restrict camera/mic/geo access'
    )
  );

  // 91. h1_length
  const h1Len = (headingsByLevel[1][0] || '').length;
  const h1LenOk = h1Len >= 10 && h1Len <= 70;
  checks.push(
    makeCheck(
      'h1_length',
      'Other',
      'LOW',
      h1LenOk ? 'PASS' : 'FAIL',
      h1Len === 0
        ? 'No H1 text found'
        : h1Len > 70
          ? `H1 length: ${h1Len} characters — too long, keep under 70`
          : h1Len < 10
            ? `H1 length: ${h1Len} characters — too short, aim for 20-70`
            : `H1 length: ${h1Len} characters (optimal)`
    )
  );

  // 92. title_desc_duplicate
  const isDupTitleDesc =
    Boolean(ctx.title && ctx.metaDescription) &&
    ctx.title.toLowerCase() === ctx.metaDescription.toLowerCase();
  checks.push(
    makeCheck(
      'title_desc_duplicate',
      'Meta',
      'MEDIUM',
      !isDupTitleDesc ? 'PASS' : 'FAIL',
      !isDupTitleDesc
        ? 'Title and meta description are different (good)'
        : 'Title and meta description are identical — write unique copy for each'
    )
  );

  // 93. og_canonical_match
  const ogCanonMatch =
    !og.url || !ctx.canonical ? Boolean(og.url && ctx.canonical) : ctx.ogUrlNormalized === ctx.canonicalNormalized;
  checks.push(
    makeCheck(
      'og_canonical_match',
      'Social',
      'LOW',
      ogCanonMatch ? 'PASS' : 'FAIL',
      !og.url || !ctx.canonical
        ? 'Missing og:url or canonical tag to verify consistency'
        : ogCanonMatch
          ? 'OG URL matches canonical URL (consistent)'
          : 'OG URL differs from canonical URL'
    )
  );

  // 94. viewport_zoom
  const blocksZoom = /user-scalable\s*=\s*(no|0)/i.test(ctx.viewport) || /maximum-scale\s*=\s*1(\.0)?(\b|,|$)/i.test(ctx.viewport);
  checks.push(
    makeCheck(
      'viewport_zoom',
      'Technical',
      'MEDIUM',
      !blocksZoom ? 'PASS' : 'FAIL',
      !blocksZoom
        ? 'Viewport allows zoom (good for accessibility)'
        : 'Viewport disables pinch-to-zoom — remove user-scalable=no / maximum-scale=1'
    )
  );

  // 95. excessive_links
  checks.push(
    makeCheck(
      'excessive_links',
      'Technical',
      'LOW',
      ctx.totalLinks <= 150 ? 'PASS' : 'FAIL',
      ctx.totalLinks <= 150
        ? `${ctx.totalLinks} links on page (within limit)`
        : `${ctx.totalLinks} links on page — excessive links dilute link equity`
    )
  );

  // 96. dom_size
  checks.push(
    makeCheck(
      'dom_size',
      'Technical',
      'MEDIUM',
      ctx.domElementCount <= 2000 ? 'PASS' : 'FAIL',
      ctx.domElementCount <= 2000
        ? `DOM size: ~${ctx.domElementCount} elements (good)`
        : `DOM size: ~${ctx.domElementCount} elements — large DOM slows rendering`
    )
  );

  // 97. nosnippet_blocking
  const hasNosnippet = /\bnosnippet\b/i.test(ctx.combinedRobotsMeta) || $('[data-nosnippet]').length > 0;
  checks.push(
    makeCheck(
      'nosnippet_blocking',
      'Technical',
      'HIGH',
      !hasNosnippet ? 'PASS' : 'FAIL',
      !hasNosnippet
        ? 'No snippet blocking detected (good — content is fully accessible)'
        : 'nosnippet or data-nosnippet blocking detected on page'
    )
  );

  // 98. render_blocking
  checks.push(
    makeCheck(
      'render_blocking',
      'Technical',
      'MEDIUM',
      ctx.renderBlockingScripts.length === 0 ? 'PASS' : 'FAIL',
      ctx.renderBlockingScripts.length === 0
        ? 'No render-blocking scripts in head (good)'
        : `${ctx.renderBlockingScripts.length} render-blocking script(s) in <head> — add defer or async`
    )
  );

  // 99. third_party_scripts
  checks.push(
    makeCheck(
      'third_party_scripts',
      'Technical',
      'LOW',
      ctx.thirdPartyScriptDomains.length <= 5 ? 'PASS' : 'FAIL',
      ctx.thirdPartyScriptDomains.length <= 5
        ? `${ctx.thirdPartyScriptDomains.length} third-party script domain(s) (acceptable)`
        : `${ctx.thirdPartyScriptDomains.length} third-party script domains — audit and trim heavy scripts`
    )
  );

  // 100. aria_landmarks
  const fullLandmarks = ctx.hasMainLandmark && ctx.hasNavLandmark && ctx.hasSkipLink;
  checks.push(
    makeCheck(
      'aria_landmarks',
      'Other',
      'MEDIUM',
      fullLandmarks ? 'PASS' : 'FAIL',
      fullLandmarks
        ? 'ARIA landmarks (<main>, <nav>) and skip-to-content link present'
        : 'Missing ARIA landmarks — add <main>, <nav>, and skip-to-content link for accessibility'
    )
  );

  // 101. form_labels
  const unlabeled = ctx.formInputsTotal - ctx.formInputsLabeled;
  checks.push(
    makeCheck(
      'form_labels',
      'Technical',
      'MEDIUM',
      unlabeled === 0 ? 'PASS' : 'FAIL',
      ctx.formInputsTotal === 0
        ? 'No form inputs on page'
        : unlabeled === 0
          ? `All ${ctx.formInputsTotal} form input(s) have labels or aria-labels`
          : `${unlabeled} of ${ctx.formInputsTotal} form input(s) missing labels or aria-labels`
    )
  );

  // 102. duplicate_ids
  checks.push(
    makeCheck(
      'duplicate_ids',
      'Technical',
      'LOW',
      ctx.duplicateIds.length === 0 ? 'PASS' : 'FAIL',
      ctx.duplicateIds.length === 0
        ? `No duplicate IDs found (${ctx.uniqueIdsCount} unique IDs)`
        : `${ctx.duplicateIds.length} duplicate ID(s) found: ${ctx.duplicateIds.slice(0, 4).join(', ')}`
    )
  );

  // 103. iframe_sandbox
  checks.push(
    makeCheck(
      'iframe_sandbox',
      'Security',
      'LOW',
      ctx.iframesUnsafe === 0 ? 'PASS' : 'FAIL',
      ctx.iframesTotal === 0
        ? 'No iframes on page'
        : ctx.iframesUnsafe === 0
          ? `All ${ctx.iframesTotal} iframe(s) include sandbox or accessible title`
          : `${ctx.iframesUnsafe} of ${ctx.iframesTotal} iframe(s) missing sandbox/title attributes`
    )
  );

  // 104. rss_feed
  checks.push(
    makeCheck(
      'rss_feed',
      'Other',
      'LOW',
      ctx.rssFeeds.length > 0 ? 'PASS' : 'FAIL',
      ctx.rssFeeds.length > 0
        ? `RSS/Atom feed found in <head> (${ctx.rssFeeds.length})`
        : 'No RSS/Atom feed in <head> — add for content discovery by aggregators and AI'
    )
  );

  // 105. indexnow
  checks.push(
    makeCheck(
      'indexnow',
      'Other',
      'LOW',
      aux.indexNowFound ? 'PASS' : 'FAIL',
      aux.indexNowFound
        ? 'IndexNow reference detected'
        : 'No IndexNow integration — optional: speeds up Bing/Yandex indexing only, Google does not use IndexNow'
    )
  );

  // 106. section_depth
  const sectionDepthOk = headingsByLevel[2].length > 0 && ctx.avgH2SectionWords >= 50;
  checks.push(
    makeCheck(
      'section_depth',
      'Content',
      'MEDIUM',
      sectionDepthOk ? 'PASS' : 'FAIL',
      headingsByLevel[2].length === 0
        ? 'No H2 sections found to measure depth'
        : sectionDepthOk
          ? `All ${headingsByLevel[2].length} H2 sections have sufficient depth (avg ${ctx.avgH2SectionWords} words)`
          : `Shallow H2 sections (avg ${ctx.avgH2SectionWords} words) — expand section content`
    )
  );

  return checks;
}

module.exports = { runSeoChecks };
