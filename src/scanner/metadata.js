// Business Impact & How-to-Fix metadata catalog for all 224 checks
const CHECK_GUIDANCE = {
  title_exists: {
    impact: 'Without a title tag, search engines guess a headline from page text and click-through rates drop sharply.',
    howToFix: 'Add a unique <title>Your Primary Topic | Brand</title> element inside <head>.',
  },
  title_length: {
    impact: 'A long title can be cut off in search results so key words at the end are lost; a very short one tells searchers little about the page.',
    howToFix: 'Rewrite the title to between 30 and 60 characters (passes up to 65). Put descriptive keywords first and the brand name last.',
  },
  desc_exists: {
    impact: 'Missing meta descriptions force search engines to stitch arbitrary snippets from page text, lowering CTR.',
    howToFix: 'Add <meta name="description" content="..."> in <head> summarizing the page value clearly.',
  },
  desc_length: {
    impact: 'A long description can be truncated mid-sentence; a very short one gives searchers little reason to click.',
    howToFix: 'Rewrite the meta description to 120–160 characters (passes 70–165): one or two clear sentences with key value upfront.',
  },
  viewport: {
    impact: 'Without a viewport tag, mobile devices render a zoomed-out desktop layout, hurting mobile rankings and usability.',
    howToFix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> inside <head>.',
  },
  charset: {
    impact: 'Missing UTF-8 charset declaration can cause garbled special characters and browser parsing delays.',
    howToFix: 'Place <meta charset="UTF-8"> as the first tag inside <head>.',
  },
  lang_attr: {
    impact: 'Without a language attribute, screen readers and search engines cannot reliably determine the primary page language.',
    howToFix: 'Set the ISO language code on the root tag, e.g. <html lang="en">.',
  },
  theme_color: {
    impact: 'Provides branded browser UI chrome on mobile browsers and PWA splash screens.',
    howToFix: 'Add <meta name="theme-color" content="#0A1633"> matching your primary brand color in <head>.',
  },
  meta_refresh: {
    impact: 'Meta refresh redirects break browser history, degrade UX, and pass weaker SEO signals than HTTP 301 redirects.',
    howToFix: 'Remove <meta http-equiv="refresh"> and replace it with a server-side 301 permanent redirect.',
  },
  robots_meta: {
    impact: 'A noindex directive completely removes the page from Google and AI search engine indexes.',
    howToFix: 'Remove noindex from <meta name="robots"> and X-Robots-Tag headers on pages that should rank.',
  },
  meta_keywords: {
    impact: 'Meta keywords have been ignored by Google since 2009 and only bloat HTML markup.',
    howToFix: 'Remove <meta name="keywords"> to keep <head> clean.',
  },
  h1_exists: {
    impact: 'Missing or multiple H1 headings dilute the main topic signal for both readers and search engines.',
    howToFix: 'Ensure every page has exactly one visible <h1> stating the primary topic clearly.',
  },
  title_h1_alignment: {
    impact: 'When title and H1 describe different things, visitors who click from search may not recognize the landing page.',
    howToFix: 'Use the same core topic phrase in both <title> and <h1> so at least 30–50% of significant terms overlap.',
  },
  h2_exists: {
    impact: 'Pages without H2 subheadings appear as walls of text, reducing scanability and topical structure.',
    howToFix: 'Break content into logical sections using descriptive <h2> subheadings.',
  },
  heading_hierarchy: {
    impact: 'Skipped heading levels make the document outline harder for screen readers and crawlers to parse.',
    howToFix: 'Nest headings sequentially without skipping levels: place <h3> only under <h2>, and <h4> only under <h3>.',
  },
  word_count: {
    impact: 'Thin pages under 300 words rarely provide enough topical depth to rank competitively or get cited by AI.',
    howToFix: 'Expand the page with helpful, original answers, specifications, examples, and FAQs targeting user intent.',
  },
  readability_score: {
    impact: 'Overly complex prose increases bounce rates and makes content harder for users and AI models to digest.',
    howToFix: 'Use shorter sentences, plain vocabulary, subheadings, and bullet lists to aim for Flesch score 60+.',
  },
  sentence_length: {
    impact: 'Long sentences (>20 words) are harder to scan, especially on mobile screens.',
    howToFix: 'Split sentences exceeding 20 words into two crisp sentences in your primary body copy.',
  },
  img_alt: {
    impact: 'Images without ALT text hurt accessibility for screen readers and miss image-search and AI visual context.',
    howToFix: 'Add concise, descriptive alt="..." text to every meaningful <img> tag (use alt="" only for decorative icons).',
  },
  img_dimensions: {
    impact: 'Missing width and height causes Cumulative Layout Shift (CLS), making text jump while the page loads.',
    howToFix: 'Add intrinsic width and height attributes to every <img> (e.g. width="800" height="600") and keep height: auto in CSS.',
  },
  img_lazy: {
    impact: 'Eagerly loading off-screen images wastes bandwidth and slows Largest Contentful Paint (LCP).',
    howToFix: 'Add loading="lazy" to below-the-fold images while keeping hero/above-the-fold images eager.',
  },
  img_modern_format: {
    impact: 'WebP and AVIF images are 25–50% smaller than JPEG/PNG at equal quality, directly speeding up page load.',
    howToFix: 'Convert photos to WebP or AVIF and serve via <picture><source type="image/webp" srcset="..."></picture> or an image CDN.',
  },
  internal_links: {
    impact: 'Few internal links isolate pages from crawl discovery and limit topical authority flow across your site.',
    howToFix: 'Link naturally to at least 3–5 relevant internal pages (services, guides, case studies) with descriptive anchor text.',
  },
  external_links: {
    impact: 'Linking out to credible reference sources corroborates factual claims and builds trust signals.',
    howToFix: 'Add contextual links to authoritative primary sources, standards, or partner documentation where helpful.',
  },
  empty_hrefs: {
    impact: 'Empty href="" or "#" links confuse crawlers and create dead click targets for users.',
    howToFix: 'Replace empty links with valid destination URLs or use <button type="button"> for non-navigation JS actions.',
  },
  descriptive_anchors: {
    impact: 'Generic link texts like "click here" or "read more" waste anchor-text context for SEO and screen readers.',
    howToFix: 'Replace generic anchors with descriptive phrases stating the destination topic, e.g. "View SEO Audit Checklist".',
  },
  og_title: {
    impact: 'Without og:title, social platforms and chat previews may display awkward or truncated titles.',
    howToFix: 'Add <meta property="og:title" content="Your Compelling Title"> in <head>.',
  },
  og_desc: {
    impact: 'Missing og:description reduces click-through rates when your URL is shared on LinkedIn, WhatsApp, or Facebook.',
    howToFix: 'Add <meta property="og:description" content="..."> summarizing the page in 1–2 sentences.',
  },
  og_image: {
    impact: 'Links shared without an og:image look bland and earn significantly fewer clicks on social feeds.',
    howToFix: 'Add <meta property="og:image" content="https://yourdomain.com/og-image.jpg"> (recommended 1200x630px).',
  },
  og_url: {
    impact: 'og:url consolidates social share signals onto one canonical URL.',
    howToFix: 'Add <meta property="og:url" content="https://yourdomain.com/current-page/"> matching your canonical URL.',
  },
  og_type: {
    impact: 'og:type tells social crawlers whether the page is a website, article, or product.',
    howToFix: 'Add <meta property="og:type" content="website"> (or "article" for blog posts) inside <head>.',
  },
  og_site_name: {
    impact: 'og:site_name reinforces brand recognition in link previews and entity resolution.',
    howToFix: 'Add <meta property="og:site_name" content="Your Brand Name"> inside <head>.',
  },
  twitter_card: {
    impact: 'Without twitter:card, shares on X/Twitter display as plain text links instead of rich preview cards.',
    howToFix: 'Add <meta name="twitter:card" content="summary_large_image"> inside <head>.',
  },
  twitter_title: {
    impact: 'Defines the exact headline displayed when shared on X/Twitter.',
    howToFix: 'Add <meta name="twitter:title" content="..."> in <head>.',
  },
  twitter_desc: {
    impact: 'Defines the summary copy displayed in X/Twitter preview cards.',
    howToFix: 'Add <meta name="twitter:description" content="..."> in <head>.',
  },
  twitter_image: {
    impact: 'Ensures rich visual thumbnails render reliably on X/Twitter shares.',
    howToFix: 'Add <meta name="twitter:image" content="https://yourdomain.com/og-image.jpg"> in <head>.',
  },
  https: {
    impact: 'Non-HTTPS pages trigger browser "Not Secure" warnings, lose Google ranking trust, and expose visitor data.',
    howToFix: 'Install an SSL/TLS certificate (e.g., Let\'s Encrypt or Cloudflare) and 301-redirect all HTTP traffic to HTTPS.',
  },
  canonical: {
    impact: 'Missing canonical tags leave search engines guessing which URL version to index when query params or duplicates exist.',
    howToFix: 'Add <link rel="canonical" href="https://yourdomain.com/page-url/"> inside <head>.',
  },
  canonical_self: {
    impact: 'A mismatched canonical can accidentally de-index the current page in favor of another URL.',
    howToFix: 'Ensure <link rel="canonical"> points to the exact normalized HTTPS URL of this page unless intentionally consolidating.',
  },
  favicon: {
    impact: 'Missing favicons make browser tabs, bookmarks, and Google mobile SERP listings look unpolished.',
    howToFix: 'Add <link rel="icon" href="/favicon.ico"> and a PNG/SVG icon link inside <head>.',
  },
  apple_touch_icon: {
    impact: 'iOS devices display a generic screenshot thumbnail when users bookmark or save your site to their home screen.',
    howToFix: 'Add <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"> inside <head>.',
  },
  compression: {
    impact: 'Uncompressed HTML/CSS/JS transfers 3–5x more bytes, hurting Time to First Byte and mobile load speed.',
    howToFix: 'Enable Brotli (br) or Gzip compression on your web server (Nginx, Apache, or CDN like Cloudflare).',
  },
  url_length: {
    impact: 'Very long URLs are harder to share, truncate in SERPs, and often indicate bloated URL parameters.',
    howToFix: 'Keep URLs concise, descriptive, and under 75–100 characters.',
  },
  url_hyphens: {
    impact: 'Search engines treat hyphens as word separators, whereas underscores join words together.',
    howToFix: 'Use lowercase hyphens (-) instead of underscores (_) or spaces in URL slugs.',
  },
  hreflang: {
    impact: 'Multi-language sites need hreflang to serve the right regional page in international search results.',
    howToFix: 'If serving multiple languages/regions, add <link rel="alternate" hreflang="en" href="..."> links in <head>.',
  },
  deprecated_html: {
    impact: 'Deprecated HTML tags (like <font>, <center>, <marquee>) fail modern standards and break responsive accessibility.',
    howToFix: 'Replace deprecated tags with semantic HTML5 elements and modern CSS styling.',
  },
  text_html_ratio: {
    impact: 'A low text-to-HTML ratio signals heavy markup/inline bloat that increases download and parse time.',
    howToFix: 'Move large inline <style>, <script>, and SVG blocks to external cached files and trim unused DOM wrappers.',
  },
  inline_css: {
    impact: 'Large inline CSS bloats every HTML response and cannot be cached separately across page views.',
    howToFix: 'Extract non-critical styles from <style> tags into an external versioned stylesheet, keeping only critical above-the-fold CSS inline.',
  },
  inline_js: {
    impact: 'Heavy inline scripts bloat HTML payloads and prevent browser script caching across pages.',
    howToFix: 'Move large inline JavaScript blocks into external minified files loaded with defer.',
  },
  script_defer: {
    impact: 'Synchronous external scripts pause HTML parsing and delay First Contentful Paint.',
    howToFix: 'Add defer or async attributes (or type="module") to external <script src="..."> tags.',
  },
  font_preload: {
    impact: 'Without preconnect/preload hints, web fonts start downloading late and delay text rendering.',
    howToFix: 'Add <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> or <link rel="preload" as="font"> for key fonts.',
  },
  cache_control: {
    impact: 'Missing Cache-Control headers force browsers and proxies to re-validate assets unnecessarily.',
    howToFix: 'Configure Cache-Control headers on your server/CDN (e.g. max-age=3600 for HTML, max-age=31536000, immutable for versioned assets).',
  },
  hsts: {
    impact: 'Without HSTS, initial http:// visits are unencrypted until redirected and can be intercepted via downgrade attacks.',
    howToFix: 'Send response header: Strict-Transport-Security: max-age=31536000; includeSubDomains (test with max-age=300 first).',
  },
  x_content_type: {
    impact: 'Missing X-Content-Type-Options allows browsers to MIME-sniff responses, opening a classic XSS vector.',
    howToFix: 'Send response header: X-Content-Type-Options: nosniff on your server or CDN.',
  },
  csp: {
    impact: 'Without Content-Security-Policy, injected scripts can execute freely and steal form/session data.',
    howToFix: 'Start with Content-Security-Policy-Report-Only, or enforce a baseline like Content-Security-Policy: frame-ancestors \'self\';.',
  },
  trust_about: {
    impact: 'An About page helps visitors, search engines, and AI evaluators verify who operates the site (E-E-A-T).',
    howToFix: 'Link clearly to an /about page detailing your company background, team, and expertise in the navigation or footer.',
  },
  trust_contact: {
    impact: 'Accessible contact details build visitor confidence and satisfy Google Quality Rater trust signals.',
    howToFix: 'Include a visible link to /contact, email (mailto:), or phone number in the header or footer.',
  },
  trust_privacy: {
    impact: 'A Privacy Policy is legally required under GDPR/PDPA when collecting user data and is a core trust signal.',
    howToFix: 'Add a footer link such as <a href="/privacy-policy/">Privacy Policy</a> on every page.',
  },
  trust_terms: {
    impact: 'Terms of Service define usage rules and protect businesses offering services, products, or accounts.',
    howToFix: 'Add a footer link such as <a href="/terms/">Terms of Service</a> if applicable to your business.',
  },
  author_byline: {
    impact: 'Visible author attribution demonstrates human expertise and accountability for E-E-A-T.',
    howToFix: 'Display the author name in a visible byline and add a matching Person "author" object in JSON-LD.',
  },
  jsonld: {
    impact: 'Without JSON-LD structured data, search engines and AI models have to infer entities from unstructured text.',
    howToFix: 'Add a <script type="application/ld+json"> block describing your Organization, WebSite, and page content.',
  },
  schema_types: {
    impact: 'Clear schema @type declarations power rich results, Knowledge Graph links, and AI entity parsing.',
    howToFix: 'Include relevant Schema.org types (e.g. Organization, WebSite, WebPage, Article, Service, Product).',
  },
  schema_overuse: {
    impact: 'Excessive or bloated JSON-LD payloads add HTML weight and can signal spammy or redundant markup.',
    howToFix: 'Consolidate duplicate schema blocks into a single clean @graph under 12 KB focused on visible page content.',
  },
  html_doctype: {
    impact: 'Missing <!DOCTYPE html> triggers browser quirks mode, causing inconsistent layout rendering.',
    howToFix: 'Ensure <!DOCTYPE html> is the very first line of the HTML document.',
  },
  mixed_content: {
    impact: 'Loading HTTP assets on an HTTPS page breaks padlock trust and may cause browsers to block resources.',
    howToFix: 'Update all http:// image, script, CSS, and iframe URLs to https://.',
  },
  structured_data_valid: {
    impact: 'Invalid JSON syntax causes search engines and AI parsers to ignore the entire structured data block.',
    howToFix: 'Validate every <script type="application/ld+json"> block for trailing commas, unescaped quotes, or broken brackets.',
  },
  font_display: {
    impact: 'Without font-display: swap, browsers hide text (FOIT) until web fonts finish downloading.',
    howToFix: 'Add font-display: swap to @font-face declarations or append &display=swap to Google Fonts URLs.',
  },
  meta_viewport_content: {
    impact: 'Without width=device-width, mobile layouts fail responsive scaling and core mobile usability checks.',
    howToFix: 'Set <meta name="viewport" content="width=device-width, initial-scale=1">.',
  },
  robots_txt: {
    impact: 'Missing or overly restrictive robots.txt makes crawl budget management unpredictable or blocks indexing completely.',
    howToFix: 'Serve a valid /robots.txt file allowing crawlers (User-agent: * / Allow: /) and referencing your sitemap.',
  },
  robots_txt_sitemap: {
    impact: 'Listing your sitemap in robots.txt helps search engines and AI crawlers discover all indexable pages faster.',
    howToFix: 'Add "Sitemap: https://yourdomain.com/sitemap.xml" at the bottom of /robots.txt.',
  },
  ai_crawlers_blocked: {
    impact: 'Blocking AI crawlers in robots.txt prevents your brand from appearing in ChatGPT, Perplexity, and Claude answers.',
    howToFix: 'Review Disallow rules for GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, and Google-Extended in /robots.txt.',
  },
  sitemap_xml: {
    impact: 'Without a valid XML sitemap, deeper or newly published pages take much longer to get crawled and indexed.',
    howToFix: 'Generate and serve a standard XML sitemap at /sitemap.xml listing canonical indexable URLs.',
  },
  sitemap_urls: {
    impact: 'An empty sitemap provides no crawl discovery value to search engines.',
    howToFix: 'Ensure your sitemap contains valid <url><loc>...</loc></url> entries for all live public pages.',
  },
  broken_links: {
    impact: 'Broken internal links waste crawl budget, hurt user trust, and leak internal PageRank.',
    howToFix: 'Fix or redirect any internal links returning 404/5xx errors to active destination pages.',
  },
  nofollow_ratio: {
    impact: 'Overusing rel="nofollow" on internal links blocks PageRank distribution across your own site.',
    howToFix: 'Remove rel="nofollow" from legitimate internal navigation and contextual links.',
  },
  og_image_url: {
    impact: 'Relative og:image paths frequently fail to resolve in social media scrapers.',
    howToFix: 'Use a full absolute HTTPS URL in <meta property="og:image" content="https://...">.',
  },
  link_noopener: {
    impact: 'External target="_blank" links without rel="noopener" expose older browsers to tabnabbing security risks.',
    howToFix: 'Add rel="noopener noreferrer" to all links using target="_blank".',
  },
  web_manifest: {
    impact: 'A Web App Manifest enables installable PWA metadata, icons, and cleaner mobile branding.',
    howToFix: 'Serve a /site.webmanifest JSON file and link it with <link rel="manifest" href="/site.webmanifest">.',
  },
  resource_hints: {
    impact: 'Missing preconnect/dns-prefetch hints add extra DNS/TLS latency for critical third-party hosts.',
    howToFix: 'Add <link rel="preconnect" href="..."> for critical CDN or font origins.',
  },
  schema_required_props: {
    impact: 'Incomplete JSON-LD objects missing required Schema.org fields are rejected for rich results.',
    howToFix: 'Populate all required properties (e.g. name, url, headline, mainEntity) for each schema @type.',
  },
  first_person: {
    impact: 'First-hand voice ("we tested", "our team") reinforces genuine Experience in Google\'s E-E-A-T guidelines.',
    howToFix: 'Share real first-hand insights, lessons learned, and direct client or product experience in your copy.',
  },
  hreflang_valid: {
    impact: 'Invalid ISO language codes cause Google to ignore hreflang annotations.',
    howToFix: 'Use valid ISO 639-1 language codes (e.g. en, ms, zh) with optional ISO 3166-1 region codes (en-US, en-MY).',
  },
  hreflang_xdefault: {
    impact: 'Without x-default, visitors outside targeted regions have no explicit fallback URL.',
    howToFix: 'Add <link rel="alternate" hreflang="x-default" href="https://yourdomain.com/"> alongside regional hreflang tags.',
  },
  img_responsive: {
    impact: 'Without srcset, mobile phones download full desktop-sized images, wasting bandwidth and slowing LCP.',
    howToFix: 'Add srcset and sizes attributes to content images so browsers select the optimal resolution per screen.',
  },
  title_separator: {
    impact: 'Consistent clean separators improve title readability in SERPs and reduce Google title rewrites.',
    howToFix: 'Use a clean separator like "—" or "-" (or consistent "|") between the page topic and brand name.',
  },
  max_image_preview: {
    impact: 'Without max-image-preview:large, pages miss eligibility for large visual thumbnails in Google Discover and AI cards.',
    howToFix: 'Add <meta name="robots" content="index, follow, max-image-preview:large"> inside <head>.',
  },
  org_logo: {
    impact: 'Missing Organization logo in schema limits brand visual recognition in Knowledge Panels and AI cards.',
    howToFix: 'Add "logo": "https://yourdomain.com/logo.png" inside your Organization JSON-LD object.',
  },
  x_frame_options: {
    impact: 'Without clickjacking protection, malicious sites can embed your page in an invisible iframe.',
    howToFix: 'Send response header X-Frame-Options: SAMEORIGIN (or CSP frame-ancestors \'self\').',
  },
  referrer_policy: {
    impact: 'Without Referrer-Policy, full internal URLs and query parameters can leak to third-party destinations.',
    howToFix: 'Send response header Referrer-Policy: strict-origin-when-cross-origin.',
  },
  permissions_policy: {
    impact: 'Without Permissions-Policy, embedded scripts/frames could request unused browser APIs like camera or mic.',
    howToFix: 'Send Permissions-Policy: camera=(), microphone=(), geolocation=() for features your site does not use.',
  },
  h1_length: {
    impact: 'Overly long H1 headings (>70 chars) dilute focus and wrap poorly on mobile viewports.',
    howToFix: 'Trim your <h1> to a crisp 20–70 character topic headline and move supporting detail into the intro paragraph.',
  },
  title_desc_duplicate: {
    impact: 'Duplicating the title into the meta description wastes precious SERP real estate.',
    howToFix: 'Write a distinct meta description that expands on the title with concrete benefits and a call to action.',
  },
  og_canonical_match: {
    impact: 'Conflicting og:url and canonical URLs split share metrics and confuse link crawlers.',
    howToFix: 'Set <meta property="og:url"> to the exact same normalized URL as <link rel="canonical">.',
  },
  viewport_zoom: {
    impact: 'Disabling pinch-to-zoom violates WCAG accessibility standards for low-vision users.',
    howToFix: 'Remove user-scalable=no and maximum-scale=1 from your viewport meta tag.',
  },
  excessive_links: {
    impact: 'Too many links on one page dilute internal link equity and create noisy navigation.',
    howToFix: 'Keep page links focused and ideally under 150 by trimming redundant menu or footer links.',
  },
  dom_size: {
    impact: 'Excessive DOM elements (>1,500–2,500) increase browser memory, style recalculation, and INP latency.',
    howToFix: 'Flatten deeply nested wrapper divs, paginate long lists, and remove hidden/unused DOM nodes.',
  },
  nosnippet_blocking: {
    impact: 'nosnippet directives block search engines and AI Overviews from displaying or quoting your page text.',
    howToFix: 'Remove nosnippet from meta robots/headers and data-nosnippet from key content sections.',
  },
  render_blocking: {
    impact: 'Render-blocking scripts in <head> stall page painting until downloaded and executed.',
    howToFix: 'Add defer or async to scripts in <head>, or move non-critical scripts to the bottom of <body>.',
  },
  third_party_scripts: {
    impact: 'Excessive third-party script domains slow page load, increase main-thread blocking, and add privacy risk.',
    howToFix: 'Audit third-party tags, remove unused trackers, and defer non-essential analytics/widgets.',
  },
  aria_landmarks: {
    impact: 'Semantic landmarks (<main>, <nav>, skip link) help screen readers and AI parsers locate primary content fast.',
    howToFix: 'Wrap primary content in <main>, navigation in <nav>, and include a skip-to-content anchor at the top.',
  },
  form_labels: {
    impact: 'Unlabeled form inputs fail accessibility guidelines and confuse assistive technologies.',
    howToFix: 'Connect every input to a <label for="..."> element or add a clear aria-label attribute.',
  },
  duplicate_ids: {
    impact: 'Duplicate HTML IDs break anchor navigation, label associations, and JavaScript DOM selectors.',
    howToFix: 'Ensure every id="..." attribute value is unique across the HTML document.',
  },
  iframe_sandbox: {
    impact: 'Unsandboxed or untitled iframes introduce security exposure and accessibility issues.',
    howToFix: 'Add descriptive title="..." attributes and restrictive sandbox="..." flags to embedded iframes.',
  },
  rss_feed: {
    impact: 'RSS/Atom feeds help aggregators, syndicators, and AI pipelines discover newly published content quickly.',
    howToFix: 'If publishing regular posts/news, add <link rel="alternate" type="application/rss+xml" href="/feed/"> in <head>.',
  },
  indexnow: {
    impact: 'IndexNow notifies Bing, Yandex, and partner engines instantly on content updates (optional; Google does not use it).',
    howToFix: 'Optionally host an IndexNow API key file and submit updated URLs via your CMS or build pipeline.',
  },
  section_depth: {
    impact: 'Thin H2 sections give shallow answers that struggle to rank or satisfy complex user queries.',
    howToFix: 'Flesh out each H2 section with at least 60–150 words of concrete explanation, examples, or steps.',
  },

  // AEO
  aeo_structured_data: {
    impact: 'Answer engines rely heavily on structured data to map entities, services, FAQs, and relationships accurately.',
    howToFix: 'Add valid JSON-LD structured data describing your brand, webpage, and primary content entities.',
  },
  aeo_html_content: {
    impact: 'Many AI crawlers do not execute heavy client-side JavaScript; sparse initial HTML leaves them blind to your content.',
    howToFix: 'Use SSR or static pre-rendering so at least 300+ words of core content exist in the raw HTML response.',
  },
  aeo_clean_url: {
    impact: 'Clean, human-readable URLs communicate topical context clearly to answer engines and users.',
    howToFix: 'Use short, semantic URL paths without session IDs, messy query strings, or deep folder nesting.',
  },
  aeo_semantic_html: {
    impact: 'Semantic HTML5 elements help AI parsers distinguish main content from navigation, sidebars, and footers.',
    howToFix: 'Use <header>, <nav>, <main>, <article>, <section>, and <footer> instead of generic <div> containers.',
  },
  aeo_segmentation: {
    impact: 'Well-segmented pages allow AI systems to extract self-contained passages per subtopic.',
    howToFix: 'Organize content into clear <section> blocks with descriptive H2/H3 headings.',
  },
  aeo_topic_signals: {
    impact: 'Consistent meta description and og:description reinforce a clear topic summary for crawlers.',
    howToFix: 'Ensure both <meta name="description"> and <meta property="og:description"> are populated accurately.',
  },
  aeo_named_entities: {
    impact: 'Concrete named entities (brands, locations, products, frameworks) ground your page in knowledge graphs.',
    howToFix: 'Name specific technologies, standards, locations, and entities rather than relying on vague pronouns.',
  },
  aeo_internal_links: {
    impact: 'Internal links establish topical clusters so answer engines understand your broader domain authority.',
    howToFix: 'Add contextual internal links to related service pages, guides, and pillar content.',
  },
  aeo_definition_lists: {
    impact: 'Description lists (<dl><dt><dd>) explicitly bind terms to definitions in semantic markup.',
    howToFix: 'Where explaining glossary terms or specs, use <dl><dt>Term</dt><dd>Definition</dd></dl>.',
  },
  aeo_code_blocks: {
    impact: 'Formatted code or structured command snippets are highly citable for technical queries.',
    howToFix: 'Wrap technical snippets, formulas, or examples in <pre><code> blocks where relevant to your topic.',
  },
  aeo_faq: {
    impact: 'Explicit Q&A blocks align directly with conversational prompts asked in ChatGPT, Perplexity, and Gemini.',
    howToFix: 'Include a real customer FAQ section with concise, direct answers beneath each question.',
  },
  aeo_question_headings: {
    impact: 'Headings phrased as natural questions match how people prompt AI assistants and voice search.',
    howToFix: 'Frame key H2/H3 subheadings as questions users actually ask (e.g. "How much does X cost?").',
  },
  aeo_lists: {
    impact: 'Bulleted and numbered lists are easily extracted into structured AI summaries and featured snippets.',
    howToFix: 'Summarize key features, benefits, or criteria using clean <ul> or <ol> lists.',
  },
  aeo_tables: {
    impact: 'HTML tables make pricing, feature comparisons, and specifications unambiguously machine-readable.',
    howToFix: 'Present comparisons, pricing tiers, or specs inside a semantic <table> with <thead> and <th> headers.',
  },
  aeo_direct_answers: {
    impact: 'Answer engines extract the first crisp paragraph immediately following a heading as a direct citation.',
    howToFix: 'Place a direct 20–60 word answer paragraph right below each major H2/H3 heading before elaborating.',
  },
  aeo_numbered_steps: {
    impact: 'Procedural step-by-step instructions are prime candidates for AI how-to responses.',
    howToFix: 'Format workflows or processes as an ordered list (<ol>) with one clear action per step.',
  },
  aeo_short_sentences: {
    impact: 'Concise sentences reduce ambiguity and boost accurate verbatim quoting by LLMs.',
    howToFix: 'Keep at least half of your sentences at 20 words or fewer.',
  },
  aeo_concise_paragraphs: {
    impact: 'Short, focused paragraphs make passages easier for both humans and answer engines to scan and extract.',
    howToFix: 'Keep paragraphs under 80 words (2–4 sentences), starting each with its main point.',
  },
  aeo_key_value: {
    impact: 'Explicit "Label: Value" facts help AI extract structured attributes cleanly.',
    howToFix: 'Include structured key-value lines for key facts (e.g. "Turnaround Time: 2–4 weeks", "Location: Johor Bahru").',
  },
  aeo_section_depth: {
    impact: 'Adequate section depth ensures AI retrieves complete context rather than fragmentary blurbs.',
    howToFix: 'Provide thorough, self-contained explanations (50+ words) under each main section heading.',
  },
  aeo_author: {
    impact: 'Attributed authors strengthen credibility and E-E-A-T evaluation by answer engines.',
    howToFix: 'Add a visible author byline and matching author JSON-LD metadata.',
  },
  aeo_date: {
    impact: 'Without publication or update dates, answer engines cannot assess whether information is current.',
    howToFix: 'Display a visible date inside <time datetime="YYYY-MM-DD"> and include datePublished/dateModified in JSON-LD.',
  },
  aeo_statistics: {
    impact: 'Concrete numbers, benchmarks, and percentages are heavily favored for AI citations.',
    howToFix: 'Support claims with specific quantified figures, metrics, pricing ranges, or survey statistics.',
  },
  aeo_org_schema: {
    impact: 'Organization schema unambiguously connects your domain to your legal brand identity.',
    howToFix: 'Add an Organization or LocalBusiness JSON-LD block with name, url, logo, and contactPoint.',
  },
  aeo_eeat: {
    impact: 'Strong E-E-A-T signals (author, about, contact, legal, org identity) build eligibility for authoritative AI citations.',
    howToFix: 'Ensure HTTPS, About, Contact, Privacy Policy, Author info, and Organization schema are all present.',
  },
  aeo_citations: {
    impact: 'Statements backed by named sources can be verified and earn higher trust than unsupported claims.',
    howToFix: 'Cite primary studies, official documentation, or data sources in prose (e.g. "According to [Source]...") and link them.',
  },
  aeo_authority_links: {
    impact: 'Linking to reputable external references corroborates domain claims.',
    howToFix: 'Link out to credible third-party documentation, research, or industry standards where relevant.',
  },
  aeo_freshness: {
    impact: 'Explicit current-year references signal to answer engines that content is actively maintained.',
    howToFix: 'Review and update time-sensitive guides/pricing and reflect the current year where genuinely relevant.',
  },
  aeo_topic_focus: {
    impact: 'Alignment between title keywords and body copy confirms topical relevance.',
    howToFix: 'Use the primary terms from your <title> naturally throughout your main headings and opening copy.',
  },
  aeo_answer_box: {
    impact: 'Self-contained 20–75 word answer paragraphs right under headings match answer-box extraction patterns.',
    howToFix: 'Follow key H2/H3 headings with a crisp 2–3 sentence standalone summary answer.',
  },
  aeo_speakable: {
    impact: 'Informational check: Google Speakable schema remains in limited beta with minimal impact for most sites.',
    howToFix: 'Optional: only add SpeakableSpecification JSON-LD if you publish news/audio-targeted briefings.',
  },
  aeo_conversational: {
    impact: 'Natural, user-directed phrasing aligns closely with conversational AI prompts.',
    howToFix: 'Write clearly in natural language addressing reader questions directly ("you", "how", "why").',
  },
  aeo_snippet_ready: {
    impact: 'An opening paragraph of 20–60 words gives AI engines an ideal ready-to-quote page summary.',
    howToFix: 'Open your main content with a crisp 20–60 word paragraph stating exactly what the page offers or answers.',
  },
  aeo_search_action: {
    impact: 'Informational check: Google retired the Sitelinks Search Box rich result in 2024.',
    howToFix: 'No action needed unless you maintain SearchAction for internal tooling.',
  },
  aeo_reading_level: {
    impact: 'Clear, accessible sentence complexity improves comprehension for both readers and summarization models.',
    howToFix: 'Aim for an average sentence length of 12–20 words.',
  },
  aeo_active_voice: {
    impact: 'Active voice produces clearer subject-verb-object triples that AI systems parse accurately.',
    howToFix: 'Rewrite passive constructions ("X is done by Y") into direct active statements ("Y builds X").',
  },
  aeo_pronoun_density: {
    impact: 'User-focused language ("you", "your", "we") makes guidance feel practical and direct.',
    howToFix: 'Address the reader directly where offering advice, steps, or solutions.',
  },
  aeo_summary: {
    impact: 'Summary or Key Takeaways sections give AI engines pre-distilled bullet points ready for citation.',
    howToFix: 'Add a short "Key Takeaways" or "Summary" block near the top or bottom of long pages.',
  },
  aeo_heading_density: {
    impact: 'Regular H2/H3 subheadings create a clear semantic outline for passage indexing.',
    howToFix: 'Include descriptive H2/H3 headings every 150–300 words across long content.',
  },
  aeo_qa_blocks: {
    impact: 'Paired question headings + direct answer paragraphs form atomic units ideal for AI quotation.',
    howToFix: 'Add at least 2–3 real customer questions as H2/H3 headings (or <details><summary>) with concise answers directly beneath.',
  },
  aeo_ai_robots: {
    impact: 'Restrictive meta directives (noindex, nosnippet, noai) prevent answer engines from citing your content.',
    howToFix: 'Ensure public marketing/editorial pages do not carry noindex, nosnippet, or noai directives.',
  },
  aeo_last_modified: {
    impact: 'Last-Modified headers and dateModified schema let crawlers detect fresh updates efficiently.',
    howToFix: 'Send an accurate Last-Modified HTTP header or include dateModified in your page JSON-LD.',
  },
  aeo_llms_txt: {
    impact: 'Informational check: /llms.txt is an emerging convention for providing LLM-friendly markdown site summaries.',
    howToFix: 'Optional: host a concise /llms.txt file at your domain root linking to key documentation and service pages.',
  },
  aeo_ai_crawlers: {
    impact: 'Blocking major AI search crawlers in robots.txt removes your site from live AI search citations.',
    howToFix: 'Allow OAI-SearchBot, GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, and Google-Extended in /robots.txt if you want AI visibility.',
  },
  aeo_sameas_links: {
    impact: 'sameAs links connect your Organization schema to verified social profiles for entity disambiguation.',
    howToFix: 'Add a "sameAs": ["https://linkedin.com/company/...", "https://facebook.com/..."] array to your Organization JSON-LD.',
  },
  aeo_brand_consistency: {
    impact: 'Consistent brand naming across Title, Open Graph, and Schema reinforces a single unified entity.',
    howToFix: 'Use the exact same official brand name in <title>, og:site_name, and Organization JSON-LD "name".',
  },
  aeo_update_recency: {
    impact: 'AI search engines strongly favor recently verified and updated content for current queries.',
    howToFix: 'Review key pages periodically and update Last-Modified / dateModified when meaningful updates are made.',
  },
  aeo_toc: {
    impact: 'A Table of Contents with anchor links helps both visitors and crawlers jump directly to deep sections.',
    howToFix: 'Add an on-page Table of Contents linking to section IDs (#section-slug) on long pages.',
  },
  aeo_video: {
    impact: 'Embedded explanatory video increases user engagement and multimodal AI visibility.',
    howToFix: 'Where a topic benefits from visual demonstration, embed a relevant video with VideoObject JSON-LD.',
  },
  aeo_data_attribution: {
    impact: 'Statistics paired with named sources carry far higher citation weight in generative answers.',
    howToFix: 'Always state the source next to key stats (e.g., "According to Google, 53% of mobile visits...").',
  },
  aeo_collapsible: {
    impact: 'Native HTML <details>/<summary> accordions keep FAQs clean while remaining 100% readable in raw HTML.',
    howToFix: 'Use semantic <details><summary>Question</summary><p>Answer</p></details> elements for collapsible FAQs.',
  },
  aeo_entity_consistency: {
    impact: 'Consistent brand entity mentions build stronger brand-topic association in LLM training and retrieval.',
    howToFix: 'Mention your official brand name naturally in the hero, key value sections, and footer.',
  },

  // GEO
  geo_definitions: {
    impact: 'Clear declarative definitions ("X is...") are the #1 pattern extracted by generative answer engines.',
    howToFix: 'Define core concepts early using clear "X is a [category] that [function]" sentences.',
  },
  geo_paa_format: {
    impact: 'Question-based subheadings directly mirror Google People Also Ask and AI Overview sub-queries.',
    howToFix: 'Rewrite at least 2–3 headings as natural questions ending with "?" and answer each immediately below.',
  },
  geo_freshness: {
    impact: 'Visible dates and update timestamps reassure generative engines that facts are not stale.',
    howToFix: 'Add visible publication/update dates using <time datetime="YYYY-MM-DD"> and matching schema dates.',
  },
  geo_content_depth: {
    impact: 'Comprehensive multi-section pages serve as stronger primary references than shallow stubs.',
    howToFix: 'Cover the full scope of the topic across 800+ words and multiple structured H2 sections.',
  },
  geo_intent_clarity: {
    impact: 'Misaligned title and H1 tags confuse AI models about the page\'s primary search intent.',
    howToFix: 'Start both <title> and <h1> with the same core topic phrase so user intent is unmistakable.',
  },
  geo_structured_answers: {
    impact: 'Numbered step-by-step guides are easily synthesized into generative instructions.',
    howToFix: 'Format multi-step processes using an ordered list (<ol>) with clear sequential actions.',
  },
  geo_hierarchy_depth: {
    impact: 'Multi-level heading hierarchy (H1 > H2 > H3) helps LLMs map parent topics and sub-concepts.',
    howToFix: 'Structure major sections with H2 and break complex sections down with H3 subheadings.',
  },
  geo_paragraph_length: {
    impact: 'Medium-length paragraphs (20–80 words) encapsulate one complete idea ideal for AI passage retrieval.',
    howToFix: 'Split walls of text over 80 words and combine stray fragments in body copy to hit 20–80 words per paragraph.',
  },
  geo_author_schema: {
    impact: 'Structured author markup links content directly to identifiable real-world experts.',
    howToFix: 'Add an "author": {"@type": "Person", "name": "...", "jobTitle": "..."} block in JSON-LD.',
  },
  geo_citations: {
    impact: 'The Princeton GEO study (arXiv:2311.09735) showed adding credible citations significantly lifts generative visibility.',
    howToFix: 'Reference credible studies, official docs, or benchmarks inline and link directly to the primary source.',
  },
  geo_trust: {
    impact: 'Core trust signals (HTTPS, About, Contact, Privacy, Terms) verify business legitimacy to AI ranking systems.',
    howToFix: 'Ensure HTTPS is active and footer links exist for About, Contact, Privacy Policy, and Terms of Service.',
  },
  geo_brand: {
    impact: 'Matching Open Graph and Schema brand signals prevent entity ambiguity across generative platforms.',
    howToFix: 'Align og:site_name with Organization JSON-LD "name".',
  },
  geo_original: {
    impact: 'First-hand data, proprietary insights, and original experience differentiate your page from generic AI-rewritten text.',
    howToFix: 'Include unique findings, internal benchmarks, client metrics, or original methodology from your team.',
  },
  geo_expert_quotes: {
    impact: 'Quoting subject-matter experts or verified clients boosts authority and GEO citation likelihood.',
    howToFix: 'Add attributed expert quotes or client testimonials inside <blockquote> elements with name and role.',
  },
  geo_case_study: {
    impact: 'Concrete real-world examples illustrate abstract claims and give generative engines practical evidence to cite.',
    howToFix: 'Add at least one concrete example or short case study showing problem, solution, and measured outcome.',
  },
  geo_industry_terms: {
    impact: 'Accurate domain terminology signals true subject-matter depth rather than surface-level copy.',
    howToFix: 'Use precise industry concepts, standards, and technical terms naturally where appropriate.',
  },
  geo_authority_links: {
    impact: 'Outbound links to primary authorities (.gov, .edu, standards bodies, official docs) anchor factual accuracy.',
    howToFix: 'Link key factual claims to their primary authoritative documentation or research sources.',
  },
  geo_source_diversity: {
    impact: 'Referencing multiple independent domains strengthens factual corroboration.',
    howToFix: 'Cite 3+ distinct credible external domains when backing research or technical guidance.',
  },
  geo_faq_schema: {
    impact: 'Informational check: FAQPage schema is harmless, though Google retired FAQ SERP rich results in May 2026.',
    howToFix: 'Keep visible Q&A content crisp for AI retrieval; FAQPage JSON-LD remains optional.',
  },
  geo_howto_schema: {
    impact: 'Informational check: Google deprecated HowTo rich results in 2023, though step-by-step HTML still helps AI.',
    howToFix: 'Focus on clean visible <ol> steps; HowTo JSON-LD is optional.',
  },
  geo_comparison: {
    impact: 'AI users frequently ask comparison questions ("X vs Y"); explicit comparison sections earn high citation share.',
    howToFix: 'Include clear comparisons, pros/cons, or alternative evaluations where relevant to buyer decisions.',
  },
  geo_summary: {
    impact: 'Executive summaries give LLMs high-signal overview passages to cite verbatim.',
    howToFix: 'Add a concise Summary or Key Takeaways section summarizing the page\'s main points.',
  },
  geo_visual: {
    impact: 'Descriptive ALT text makes visual assets understandable to multimodal AI crawlers.',
    howToFix: 'Ensure every content image carries meaningful ALT text explaining what the visual depicts.',
  },
  geo_breadcrumb: {
    impact: 'BreadcrumbList schema clarifies site hierarchy and topical categorization for crawlers.',
    howToFix: 'Add BreadcrumbList JSON-LD on inner pages to reinforce site taxonomy.',
  },
  geo_data_viz: {
    impact: 'Structured tables, charts, and diagrams communicate comparative data cleanly.',
    howToFix: 'Present metrics or comparisons in semantic HTML tables or captioned visual charts where helpful.',
  },
  geo_list_variety: {
    impact: 'Using both unordered (<ul>) and ordered (<ol>) lists separates unordered features from sequential steps clearly.',
    howToFix: 'Use <ol> for ranked/step-by-step sequences and <ul> for unordered points where content calls for both.',
  },
  geo_format_variety: {
    impact: 'Varied formatting (headings, bold emphasis, lists, tables, callouts) improves extractability and engagement.',
    howToFix: 'Combine headings, concise paragraphs, bold key terms, lists, and visual callouts naturally.',
  },
  geo_multi_perspective: {
    impact: 'Balanced content acknowledging trade-offs, limitations, or alternatives earns higher AI trust than one-sided hype.',
    howToFix: 'Where relevant, mention drawbacks, caveats, or alternatives using phrases like "However, ..." or "On the other hand, ...".',
  },
  geo_actionable: {
    impact: 'Generative engines favor practical, actionable guidance that directly helps users complete a task.',
    howToFix: 'Include concrete next steps, checklists, or actionable recommendations readers can apply immediately.',
  },
  geo_conclusion: {
    impact: 'A clear conclusion or recommendation helps AI synthesize a decisive takeaway.',
    howToFix: 'End long pages with a concise recommendation, verdict, or next-steps section.',
  },
  geo_entity_markup: {
    impact: 'Multiple linked Schema entity types help AI classify your organization, people, services, and page role.',
    howToFix: 'Use connected JSON-LD entities (e.g. Organization, WebSite, WebPage, Service/Product, Person).',
  },
  geo_semantic_depth: {
    impact: 'Rich semantic HTML5 markup delineates structural roles cleanly for automated content extraction.',
    howToFix: 'Use semantic tags (<header>, <nav>, <main>, <article>, <section>, <footer>, <figure>, <time>, <details>) consistently.',
  },
  geo_time_element: {
    impact: 'Plain text dates (e.g. 03/04/2026) are ambiguous; <time datetime="..."> gives machines exact ISO timestamps.',
    howToFix: 'Wrap displayed publication or update dates in <time datetime="2026-11-24">24 Nov 2026</time>.',
  },
  geo_numerical_density: {
    impact: 'Informational mirror of geo_statistics_density showing quantified data points with units.',
    howToFix: 'Include accurate numerical metrics with clear units (%, ms, RM, $, years) where relevant.',
  },
  geo_keyword_prominence: {
    impact: 'AI retrieval systems weight the opening 200 words heavily when judging topical relevance.',
    howToFix: 'Naturally weave your primary title topic terms into the headline and opening 150–200 words.',
  },
  geo_cross_references: {
    impact: 'Contextual links connect related concepts across your site, reinforcing semantic depth.',
    howToFix: 'Link related sections, guides, and service pages naturally within your content.',
  },
  geo_categorization: {
    impact: 'Explicit topical categorization helps AI classify your page into the right industry vertical.',
    howToFix: 'Organize pages with clear navigation categories, breadcrumbs, schema types, and topical H2 headings.',
  },
  geo_subtopic_depth: {
    impact: 'H3 subtopics beneath H2 sections demonstrate thorough coverage of user follow-up questions.',
    howToFix: 'Break broad H2 sections into focused H3 sub-sections addressing specific facets of the topic.',
  },
  geo_mobile: {
    impact: 'Mobile-first indexing requires a properly configured responsive viewport across search and AI engines.',
    howToFix: 'Include <meta name="viewport" content="width=device-width, initial-scale=1"> in <head>.',
  },
  geo_https: {
    impact: 'HTTPS encryption is a baseline trust requirement for modern search and generative citation systems.',
    howToFix: 'Serve the entire website over HTTPS with valid TLS certificates and HSTS.',
  },
  geo_page_size: {
    impact: 'Bloated HTML documents (>500 KB) risk crawler truncation and slow down AI ingestion.',
    howToFix: 'Keep raw HTML lean (under 300 KB) by externalizing large CSS/JS/SVG payloads.',
  },
  geo_og_complete: {
    impact: 'Complete Open Graph tags provide clean preview cards in AI answer citations (e.g. Perplexity, ChatGPT Search).',
    howToFix: 'Configure og:title, og:description, and an absolute og:image URL on every public page.',
  },
  geo_canonical: {
    impact: 'Canonical URLs prevent AI engines from splitting citations across duplicate or parameterized URLs.',
    howToFix: 'Set an absolute self-referencing <link rel="canonical" href="..."> on every indexable page.',
  },
  geo_robots_ai: {
    impact: 'Blocking directives prevent generative systems from indexing or quoting your content.',
    howToFix: 'Remove noindex, nosnippet, or noai tags from pages intended for organic and AI discovery.',
  },
  geo_schema_richness: {
    impact: 'Rich connected schema types give AI parsers deeper structured context about your offering.',
    howToFix: 'Combine complementary schemas such as Organization, WebSite, WebPage, Service/Product, and Person.',
  },
  geo_lang_consistency: {
    impact: 'Consistent html lang and og:locale attributes ensure accurate regional and language matching.',
    howToFix: 'Set <html lang="en"> and matching <meta property="og:locale" content="en_US">.',
  },
  geo_aria_landmarks: {
    impact: 'ARIA and HTML5 landmarks let crawlers isolate core content cleanly from boilerplate chrome.',
    howToFix: 'Include <header>, <nav>, <main>, and <footer> landmarks across page templates.',
  },
  geo_img_alt_quality: {
    impact: 'Short or vague ALT attributes ("img1", "photo") provide zero semantic value to multimodal AI.',
    howToFix: 'Write descriptive ALT texts (>5 chars) stating the actual subject and context of each image.',
  },
  geo_content_length: {
    impact: 'Substantial content depth (500+ words) gives AI models enough context to verify expertise.',
    howToFix: 'Provide complete explanations, specifications, and answers without fluff.',
  },
  geo_first_200_words: {
    impact: 'Lead paragraphs strongly anchor retrieval scoring in RAG and AI search pipelines.',
    howToFix: 'State your core offering, target audience, and topic keywords clearly within the first 200 words.',
  },
  geo_featured_snippet: {
    impact: 'Pairing a crisp definition with a structured list or table maximizes featured-snippet and AI-overview capture.',
    howToFix: 'Follow clear declarative definitions with a scannable bulleted/numbered list or comparison table.',
  },
  geo_statistics_density: {
    impact: 'Per the GEO study (arXiv:2311.09735), quantified statistics measurably boost visibility in generative answers.',
    howToFix: 'Include verifiable metrics, benchmarks, timeframes, and percentage figures supporting your claims.',
  },
  geo_author_credentials: {
    impact: 'Anonymous or uncredentialed content carries weaker trust weight for YMYL and competitive GEO queries.',
    howToFix: 'Name the real author and state relevant qualifications (e.g. jobTitle, bio, LinkedIn sameAs in Person schema).',
  },
  geo_snippet_control: {
    impact: 'Allowing large image previews and unrestricted snippets maximizes rich visual attribution in AI results.',
    howToFix: 'Set <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">.',
  },
  geo_comprehensiveness: {
    impact: 'Answering multiple angles (What, Why, How, When, Where, Who) shows comprehensive topical coverage.',
    howToFix: 'Add headings covering the key reader questions your page genuinely answers (What is..., How it works, Why...).',
  },
  geo_anchor_quality: {
    impact: 'Descriptive link anchors pass clear semantic meaning about linked resources to AI crawlers.',
    howToFix: 'Avoid "click here" or "read more"; describe the linked topic clearly in the anchor text.',
  },
  geo_image_captions: {
    impact: 'Explicit <figure>/<figcaption> markup binds descriptive context directly to charts, photos, and diagrams.',
    howToFix: 'Wrap informative visuals in <figure><img ...><figcaption>Concise visual explanation</figcaption></figure>.',
  },
  geo_knowledge_graph: {
    impact: 'Linking Organization/Person schema via sameAs to authoritative profiles disambiguates your entity in Knowledge Graphs.',
    howToFix: 'Add verified Wikipedia, Wikidata, LinkedIn, GitHub, or YouTube URLs to your JSON-LD "sameAs" array.',
  },
  geo_no_cloaking: {
    impact: 'Hidden-text cloaking patterns trigger severe spam penalties from search and AI quality filters.',
    howToFix: 'Remove any hidden keyword blocks styled with font-size:0 or off-screen text-indent hacks.',
  },
  geo_keyword_stuffing: {
    impact: 'Unnatural keyword repetition degrades readability and triggers anti-spam downgrades.',
    howToFix: 'Keep primary keyword density natural (under 4–5%) and use natural synonyms and related concepts.',
  },
  geo_boilerplate: {
    impact: 'Pages dominated by navigation/footer chrome over unique content dilute topical signals.',
    howToFix: 'Ensure unique main-body content clearly outweighs repeated navigation, sidebar, and footer boilerplate.',
  },
  geo_no_popup_walls: {
    impact: 'Hard paywalls or intrusive interstitial flags prevent AI crawlers from indexing full passages.',
    howToFix: 'Keep public informational content accessible without blocking overlays or isAccessibleForFree: false.',
  },
  geo_passage_citability: {
    impact: 'Self-contained 100–200 word sections opening with a crisp definition/answer are easiest for RAG pipelines to quote intact.',
    howToFix: 'Structure key sections as focused 120–180 word blocks whose opening sentence directly defines or answers the subheading.',
  },
  geo_video_schema: {
    impact: 'VideoObject schema gives AI engines title, duration, description, and thumbnail context for embedded videos.',
    howToFix: 'When embedding video, include VideoObject JSON-LD with name, description, thumbnailUrl, and uploadDate.',
  },
  geo_bot_access: {
    impact: 'Blocking GPTBot, ClaudeBot, or PerplexityBot prevents leading generative engines from indexing your site.',
    howToFix: 'Allow GPTBot, ClaudeBot, and PerplexityBot in /robots.txt if you want citations in AI answers.',
  },
  geo_ai_discovery: {
    impact: 'Emerging machine-readable endpoints (/.well-known/ai.txt, /ai/summary.json, /ai/faq.json) streamline AI ingestion.',
    howToFix: 'Optionally publish /.well-known/ai.txt or /ai/summary.json summarizing your core brand facts and FAQs.',
  },
};

function getGuidance(checkId) {
  return (
    CHECK_GUIDANCE[checkId] || {
      impact: 'Impacts overall search engine crawlability, content clarity, or AI citation readiness.',
      howToFix: 'Review the diagnostic finding and apply best-practice HTML, schema, or header updates.',
    }
  );
}

module.exports = { CHECK_GUIDANCE, getGuidance };
