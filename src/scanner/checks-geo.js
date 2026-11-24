const { getGuidance } = require('./metadata');

function makeCheck(id, subCategory, priority, status, description) {
  const g = getGuidance(id);
  return {
    id,
    pillar: 'GEO',
    subCategory,
    priority,
    status,
    description,
    impact: g.impact,
    howToFix: g.howToFix,
  };
}

function runGeoChecks(ctx) {
  const checks = [];
  const { aux, page, headingsByLevel, og, images } = ctx;

  // 1. geo_definitions
  checks.push(
    makeCheck(
      'geo_definitions',
      'GEO',
      'MEDIUM',
      ctx.definitionSignals ? 'PASS' : 'FAIL',
      ctx.definitionSignals
        ? 'Definition-style content found — featured snippet candidate'
        : 'No clear definition statements ("X is...") found'
    )
  );

  // 2. geo_paa_format
  checks.push(
    makeCheck(
      'geo_paa_format',
      'GEO',
      'MEDIUM',
      ctx.questionHeadings.length >= 2 ? 'PASS' : 'FAIL',
      ctx.questionHeadings.length >= 2
        ? `${ctx.questionHeadings.length} question headings found — aligned with People Also Ask`
        : 'Few question headings — add Q&A headings for AI Overview'
    )
  );

  // 3. geo_freshness
  checks.push(
    makeCheck(
      'geo_freshness',
      'GEO',
      'MEDIUM',
      ctx.hasDateInfo ? 'PASS' : 'FAIL',
      ctx.hasDateInfo
        ? 'Freshness date/timestamp signals found'
        : 'No freshness signals — add dates, update timestamps'
    )
  );

  // 4. geo_content_depth
  const deepContent = ctx.wordCount >= 800 && ctx.contentSectionsCount >= 3;
  checks.push(
    makeCheck(
      'geo_content_depth',
      'GEO',
      'HIGH',
      deepContent ? 'PASS' : 'FAIL',
      deepContent
        ? `Comprehensive content (${ctx.wordCount} words, ${ctx.contentSectionsCount} sections)`
        : `Content depth limited (${ctx.wordCount} words, ${ctx.contentSectionsCount} sections) — aim for 800+ words across 3+ sections`
    )
  );

  // 5. geo_intent_clarity
  checks.push(
    makeCheck(
      'geo_intent_clarity',
      'GEO',
      'MEDIUM',
      ctx.titleH1OverlapPct >= 30 ? 'PASS' : 'FAIL',
      ctx.titleH1OverlapPct >= 30
        ? `Title and H1 align clearly (${ctx.titleH1OverlapPct}% overlap) — strong AI topic matching`
        : "Title and H1 don't align — confusing for AI topic matching"
    )
  );

  // 6. geo_structured_answers
  checks.push(
    makeCheck(
      'geo_structured_answers',
      'GEO',
      'LOW',
      ctx.olCount > 0 ? 'PASS' : 'FAIL',
      ctx.olCount > 0
        ? `${ctx.olCount} ordered step-by-step list(s) found`
        : 'No step-by-step content — add numbered guides for AI'
    )
  );

  // 7. geo_hierarchy_depth
  checks.push(
    makeCheck(
      'geo_hierarchy_depth',
      'GEO',
      'MEDIUM',
      ctx.distinctHeadingLevels >= 3 ? 'PASS' : 'FAIL',
      ctx.distinctHeadingLevels >= 3
        ? `${ctx.distinctHeadingLevels}-level heading hierarchy — deep content structure`
        : `Only ${ctx.distinctHeadingLevels} heading level(s) — add H2 and H3 layers for deeper structure`
    )
  );

  // 8. geo_paragraph_length
  checks.push(
    makeCheck(
      'geo_paragraph_length',
      'GEO',
      'LOW',
      ctx.optimalParagraphPct >= 60 ? 'PASS' : 'FAIL',
      ctx.optimalParagraphPct >= 60
        ? `${ctx.optimalParagraphPct}% optimal paragraphs (20-80 words)`
        : `${ctx.optimalParagraphPct}% optimal paragraphs — aim for 20-80 words per paragraph`
    )
  );

  // 9. geo_author_schema
  checks.push(
    makeCheck(
      'geo_author_schema',
      'GEO',
      'MEDIUM',
      ctx.authorFromSchema ? 'PASS' : 'FAIL',
      ctx.authorFromSchema
        ? 'Author schema markup found'
        : 'No author/Person schema markup in JSON-LD'
    )
  );

  // 10. geo_citations
  checks.push(
    makeCheck(
      'geo_citations',
      'GEO',
      'MEDIUM',
      ctx.citationSignals ? 'PASS' : 'FAIL',
      ctx.citationSignals
        ? 'Source citations found in content'
        : 'No source citations — reference studies and data for authority'
    )
  );

  // 11. geo_trust
  checks.push(
    makeCheck(
      'geo_trust',
      'GEO',
      'HIGH',
      ctx.trustSignalsCount >= 3 ? 'PASS' : 'FAIL',
      ctx.trustSignalsCount >= 3
        ? `${ctx.trustSignalsCount}/5 trust signals found`
        : `Only ${ctx.trustSignalsCount}/5 trust signals found — add HTTPS, About, Contact, Privacy & Terms`
    )
  );

  // 12. geo_brand
  const brandOgSchema = Boolean(og.siteName && ctx.orgSchemas.length > 0);
  checks.push(
    makeCheck(
      'geo_brand',
      'GEO',
      'MEDIUM',
      brandOgSchema ? 'PASS' : 'FAIL',
      brandOgSchema
        ? 'Brand identity consistent (OG + Schema)'
        : 'Brand identity incomplete — align og:site_name with Organization schema'
    )
  );

  // 13. geo_original
  checks.push(
    makeCheck(
      'geo_original',
      'GEO',
      'LOW',
      ctx.originalResearchSignals ? 'PASS' : 'FAIL',
      ctx.originalResearchSignals
        ? 'Original research/data signals found'
        : 'No original research or first-hand team experience signals detected'
    )
  );

  // 14. geo_expert_quotes
  checks.push(
    makeCheck(
      'geo_expert_quotes',
      'GEO',
      'LOW',
      ctx.expertQuotesSignals ? 'PASS' : 'FAIL',
      ctx.expertQuotesSignals
        ? 'Expert quotes or testimonials found — authority signal'
        : 'No expert quotes or client testimonials detected'
    )
  );

  // 15. geo_case_study
  checks.push(
    makeCheck(
      'geo_case_study',
      'Other',
      'LOW',
      ctx.caseStudySignals ? 'PASS' : 'FAIL',
      ctx.caseStudySignals
        ? 'Real-world examples or case studies detected'
        : 'No examples or case studies — add real-world examples'
    )
  );

  // 16. geo_industry_terms
  checks.push(
    makeCheck(
      'geo_industry_terms',
      'GEO',
      'LOW',
      ctx.industryTerms.length >= 5 ? 'PASS' : 'FAIL',
      ctx.industryTerms.length >= 5
        ? `${ctx.industryTerms.length} industry terms used — domain expertise signal`
        : `Only ${ctx.industryTerms.length} specialized industry terms detected`
    )
  );

  // 17. geo_authority_links
  checks.push(
    makeCheck(
      'geo_authority_links',
      'GEO',
      'LOW',
      ctx.authorityLinks.length > 0 ? 'PASS' : 'FAIL',
      ctx.authorityLinks.length > 0
        ? `${ctx.authorityLinks.length} link(s) to authoritative external domains`
        : 'No links to authoritative sources — cite Google, Schema.org, etc.'
    )
  );

  // 18. geo_source_diversity
  checks.push(
    makeCheck(
      'geo_source_diversity',
      'GEO',
      'MEDIUM',
      ctx.externalDomains.length >= 3 ? 'PASS' : 'FAIL',
      ctx.externalDomains.length >= 3
        ? `${ctx.externalDomains.length} distinct external reference domains`
        : 'Few external source domains — diversify your references'
    )
  );

  // 19. geo_faq_schema (Informational N/A like reference CSV)
  checks.push(
    makeCheck(
      'geo_faq_schema',
      'GEO',
      'LOW',
      'N/A',
      ctx.hasFaqSchema
        ? 'FAQ Schema found (harmless, but Google retired FAQ rich results in May 2026 — no SERP feature anymore)'
        : 'No FAQPage Schema (optional — Google retired FAQ rich results in May 2026)'
    )
  );

  // 20. geo_howto_schema (Informational N/A like reference CSV)
  checks.push(
    makeCheck(
      'geo_howto_schema',
      'GEO',
      'LOW',
      'N/A',
      ctx.hasHowToSchema
        ? 'HowTo Schema found (optional — Google deprecated HowTo rich results in 2023)'
        : 'No HowTo Schema (optional — Google deprecated HowTo rich results in 2023; step-by-step content itself still helps)'
    )
  );

  // 21. geo_comparison
  checks.push(
    makeCheck(
      'geo_comparison',
      'GEO',
      'LOW',
      ctx.comparisonSignals ? 'PASS' : 'FAIL',
      ctx.comparisonSignals
        ? 'Comparison content detected — AI loves comparing'
        : 'No comparison content detected — add comparisons or alternatives where helpful'
    )
  );

  // 22. geo_summary
  checks.push(
    makeCheck(
      'geo_summary',
      'GEO',
      'LOW',
      ctx.summarySignals ? 'PASS' : 'FAIL',
      ctx.summarySignals
        ? 'Summary/conclusion section found'
        : 'No summary section found'
    )
  );

  // 23. geo_visual
  const altRatio = images.total > 0 ? images.withAlt / images.total : 0;
  checks.push(
    makeCheck(
      'geo_visual',
      'GEO',
      'MEDIUM',
      images.total > 0 && altRatio >= 0.9 ? 'PASS' : 'FAIL',
      images.total === 0
        ? 'No images found — add relevant visuals with ALT text'
        : altRatio >= 0.9
          ? `${images.withAlt}/${images.total} images with ALT text — AI can understand visuals`
          : `Only ${images.withAlt}/${images.total} images have ALT text`
    )
  );

  // 24. geo_breadcrumb (PASS when found, N/A when absent — matches ref CSV)
  checks.push(
    makeCheck(
      'geo_breadcrumb',
      'GEO',
      'LOW',
      ctx.hasBreadcrumbSchema ? 'PASS' : 'N/A',
      ctx.hasBreadcrumbSchema
        ? 'BreadcrumbList schema found — clear site hierarchy for AI'
        : 'No BreadcrumbList schema — add for better AI context'
    )
  );

  // 25. geo_data_viz
  checks.push(
    makeCheck(
      'geo_data_viz',
      'GEO',
      'LOW',
      ctx.dataVizCount > 0 ? 'PASS' : 'FAIL',
      ctx.dataVizCount > 0
        ? 'Data visualization elements found (tables/charts/figures)'
        : 'No data visualization elements (tables/charts) detected'
    )
  );

  // 26. geo_list_variety
  const bothLists = ctx.ulCount > 0 && ctx.olCount > 0;
  checks.push(
    makeCheck(
      'geo_list_variety',
      'GEO',
      'LOW',
      bothLists ? 'PASS' : 'FAIL',
      bothLists
        ? `Both <ul> (${ctx.ulCount}) and <ol> (${ctx.olCount}) list types used`
        : ctx.totalLists === 0
          ? 'No lists used — add <ul> and <ol> lists for scannable structure'
          : 'Only one list type — use both <ul> and <ol> for content variety'
    )
  );

  // 27. geo_format_variety
  checks.push(
    makeCheck(
      'geo_format_variety',
      'GEO',
      'LOW',
      ctx.formatTypesUsed >= 3 ? 'PASS' : 'FAIL',
      ctx.formatTypesUsed >= 3
        ? `${ctx.formatTypesUsed}/6 formatting types used — rich content`
        : `Only ${ctx.formatTypesUsed}/6 formatting types used — vary formatting with lists, bold text, tables, or callouts`
    )
  );

  // 28. geo_multi_perspective
  checks.push(
    makeCheck(
      'geo_multi_perspective',
      'GEO',
      'HIGH',
      ctx.multiPerspectiveSignals ? 'PASS' : 'FAIL',
      ctx.multiPerspectiveSignals
        ? 'Balanced multi-perspective phrasing detected'
        : 'Single-perspective content — add "on the other hand..." for balance'
    )
  );

  // 29. geo_actionable
  checks.push(
    makeCheck(
      'geo_actionable',
      'GEO',
      'LOW',
      ctx.actionableSignals ? 'PASS' : 'FAIL',
      ctx.actionableSignals
        ? 'Actionable advice found — AI prefers practical content'
        : 'Limited actionable guidance — include practical steps or recommendations'
    )
  );

  // 30. geo_conclusion
  checks.push(
    makeCheck(
      'geo_conclusion',
      'GEO',
      'LOW',
      ctx.conclusionSignals ? 'PASS' : 'FAIL',
      ctx.conclusionSignals
        ? 'Conclusion/recommendation found — helps AI provide answers'
        : 'No clear conclusion or recommendation section found'
    )
  );

  // 31. geo_entity_markup
  checks.push(
    makeCheck(
      'geo_entity_markup',
      'GEO',
      'MEDIUM',
      ctx.schemaTypes.length >= 2 ? 'PASS' : 'FAIL',
      ctx.schemaTypes.length >= 2
        ? `${ctx.schemaTypes.length} entity types in Schema — AI can classify content`
        : `Only ${ctx.schemaTypes.length} entity type(s) in Schema — add connected entities`
    )
  );

  // 32. geo_semantic_depth
  checks.push(
    makeCheck(
      'geo_semantic_depth',
      'GEO',
      'MEDIUM',
      ctx.semanticTagsFound.length >= 4 ? 'PASS' : 'FAIL',
      ctx.semanticTagsFound.length >= 4
        ? `${ctx.semanticTagsFound.length}/14 semantic HTML5 elements — deep semantic structure`
        : `Only ${ctx.semanticTagsFound.length}/14 semantic HTML5 elements used`
    )
  );

  // 33. geo_time_element
  checks.push(
    makeCheck(
      'geo_time_element',
      'Other',
      'LOW',
      ctx.timeElements.length > 0 ? 'PASS' : 'FAIL',
      ctx.timeElements.length > 0
        ? `${ctx.timeElements.length} <time> element(s) found`
        : 'No <time> elements — wrap dates in <time datetime="...">'
    )
  );

  // 34. geo_numerical_density (Informational N/A like reference CSV)
  checks.push(
    makeCheck(
      'geo_numerical_density',
      'GEO',
      'LOW',
      'N/A',
      `${ctx.statsMatches.length} data points with units (see also geo_statistics_density — the scored variant)`
    )
  );

  // 35. geo_keyword_prominence
  checks.push(
    makeCheck(
      'geo_keyword_prominence',
      'GEO',
      'MEDIUM',
      ctx.titleKeywordsInFirst200Pct >= 50 ? 'PASS' : 'FAIL',
      ctx.titleKeywordsInFirst200Pct >= 50
        ? `${ctx.titleKeywordsInFirst200Pct}% title keywords in first 200 words — good prominence`
        : `Only ${ctx.titleKeywordsInFirst200Pct}% of title keywords appear in the first 200 words`
    )
  );

  // 36. geo_cross_references
  checks.push(
    makeCheck(
      'geo_cross_references',
      'GEO',
      'LOW',
      ctx.contextualLinksCount >= 5 ? 'PASS' : 'FAIL',
      ctx.contextualLinksCount >= 5
        ? `${ctx.contextualLinksCount} contextual links — good cross-referencing`
        : `Only ${ctx.contextualLinksCount} contextual internal links found`
    )
  );

  // 37. geo_categorization
  const hasCategorization =
    ctx.hasBreadcrumbSchema ||
    ctx.schemaTypes.length >= 2 ||
    headingsByLevel[2].length >= 2;
  checks.push(
    makeCheck(
      'geo_categorization',
      'GEO',
      'LOW',
      hasCategorization ? 'PASS' : 'FAIL',
      hasCategorization
        ? 'Content categorization found — clear topic classification'
        : 'Weak content categorization — add clear topic sections or breadcrumbs'
    )
  );

  // 38. geo_subtopic_depth
  checks.push(
    makeCheck(
      'geo_subtopic_depth',
      'GEO',
      'MEDIUM',
      ctx.sectionsWithSubtopics >= 2 ? 'PASS' : 'FAIL',
      ctx.sectionsWithSubtopics >= 2
        ? `${ctx.sectionsWithSubtopics} sections have subtopics (H3) — deep coverage`
        : `Only ${ctx.sectionsWithSubtopics} section(s) have H3 subtopics`
    )
  );

  // 39. geo_mobile
  checks.push(
    makeCheck(
      'geo_mobile',
      'GEO',
      'HIGH',
      Boolean(ctx.viewport) ? 'PASS' : 'FAIL',
      ctx.viewport ? 'Mobile-friendly (viewport set)' : 'Viewport not set — poor mobile readiness for AI crawlers'
    )
  );

  // 40. geo_https
  checks.push(
    makeCheck(
      'geo_https',
      'GEO',
      'HIGH',
      ctx.isHttps ? 'PASS' : 'FAIL',
      ctx.isHttps ? 'HTTPS secure — trusted by AI systems' : 'Not using HTTPS — lowers AI trust score'
    )
  );

  // 41. geo_page_size
  const pageKb = Math.round(page.htmlBytes / 1024);
  checks.push(
    makeCheck(
      'geo_page_size',
      'GEO',
      'MEDIUM',
      pageKb <= 500 ? 'PASS' : 'FAIL',
      pageKb <= 500
        ? `Page size: ${pageKb} KB — reasonable`
        : `Page size: ${pageKb} KB — heavy HTML may be truncated by AI crawlers`
    )
  );

  // 42. geo_og_complete
  const ogComplete = Boolean(og.title && og.description && og.image);
  checks.push(
    makeCheck(
      'geo_og_complete',
      'GEO',
      'MEDIUM',
      ogComplete ? 'PASS' : 'FAIL',
      ogComplete
        ? 'Open Graph fully configured (title, description, image)'
        : 'Open Graph tags incomplete — configure og:title, og:description, and og:image'
    )
  );

  // 43. geo_canonical
  checks.push(
    makeCheck(
      'geo_canonical',
      'GEO',
      'HIGH',
      Boolean(ctx.canonical) ? 'PASS' : 'FAIL',
      ctx.canonical
        ? 'Canonical URL set — prevents AI from citing duplicates'
        : 'Missing canonical URL — risk of duplicate citations'
    )
  );

  // 44. geo_robots_ai
  const aiBlocked = /\b(noindex|nosnippet|noai)\b/i.test(ctx.combinedRobotsMeta);
  checks.push(
    makeCheck(
      'geo_robots_ai',
      'GEO',
      'HIGH',
      !aiBlocked ? 'PASS' : 'FAIL',
      !aiBlocked
        ? 'Page allows AI indexing (no noindex/nosnippet)'
        : `AI indexing restricted by robots meta (${ctx.combinedRobotsMeta})`
    )
  );

  // 45. geo_schema_richness
  checks.push(
    makeCheck(
      'geo_schema_richness',
      'GEO',
      'MEDIUM',
      ctx.schemaTypes.length >= 2 ? 'PASS' : 'FAIL',
      ctx.schemaTypes.length >= 2
        ? `${ctx.schemaTypes.length} Schema types — rich structured data`
        : `Only ${ctx.schemaTypes.length} Schema type(s) — enrich with connected JSON-LD types`
    )
  );

  // 46. geo_lang_consistency
  const langOk = Boolean(ctx.htmlLang) && (!og.locale || og.locale.toLowerCase().startsWith(ctx.htmlLang.split('-')[0].toLowerCase()));
  checks.push(
    makeCheck(
      'geo_lang_consistency',
      'GEO',
      'LOW',
      langOk ? 'PASS' : 'FAIL',
      langOk
        ? og.locale
          ? 'Language + OG locale set — clear language signal'
          : `HTML language set (${ctx.htmlLang})`
        : 'Missing <html lang> or mismatch with og:locale'
    )
  );

  // 47. geo_aria_landmarks
  checks.push(
    makeCheck(
      'geo_aria_landmarks',
      'GEO',
      'MEDIUM',
      ctx.ariaLandmarksCount >= 2 ? 'PASS' : 'FAIL',
      ctx.ariaLandmarksCount >= 2
        ? `${ctx.ariaLandmarksCount} ARIA landmarks found — good accessibility for AI`
        : `Only ${ctx.ariaLandmarksCount} ARIA landmark(s) found — add <main>, <nav>, <header>, <footer>`
    )
  );

  // 48. geo_img_alt_quality
  const goodAltQuality = images.total === 0 || images.descriptiveAlt >= Math.ceil(images.total * 0.8);
  checks.push(
    makeCheck(
      'geo_img_alt_quality',
      'GEO',
      'LOW',
      goodAltQuality ? 'PASS' : 'FAIL',
      images.total === 0
        ? 'No images to evaluate ALT quality'
        : goodAltQuality
          ? 'All image ALT texts are descriptive (>5 chars)'
          : `Only ${images.descriptiveAlt}/${images.total} images have descriptive ALT texts (>5 chars)`
    )
  );

  // 49. geo_content_length
  checks.push(
    makeCheck(
      'geo_content_length',
      'GEO',
      'MEDIUM',
      ctx.wordCount >= 500 ? 'PASS' : 'FAIL',
      ctx.wordCount >= 500
        ? `${ctx.wordCount} words — sufficient depth for AI analysis`
        : `Only ${ctx.wordCount} words — expand content to 500+ words for AI synthesis`
    )
  );

  // 50. geo_first_200_words
  checks.push(
    makeCheck(
      'geo_first_200_words',
      'GEO',
      'MEDIUM',
      ctx.titleKeywordsInFirst200Pct >= 30 ? 'PASS' : 'FAIL',
      ctx.titleKeywordsInFirst200Pct >= 30
        ? 'First 200 words contain topic keywords — AI extracts primarily from the start'
        : 'First 200 words lack primary title topic keywords'
    )
  );

  // 51. geo_featured_snippet
  const snippetCombo = ctx.definitionSignals && (ctx.totalLists > 0 || ctx.tablesCount > 0);
  checks.push(
    makeCheck(
      'geo_featured_snippet',
      'GEO',
      'MEDIUM',
      snippetCombo ? 'PASS' : 'FAIL',
      snippetCombo
        ? 'Definition + list combo — strong featured snippet candidate'
        : 'Add a clear definition paired with a structured list or table for featured snippets'
    )
  );

  // 52. geo_statistics_density
  checks.push(
    makeCheck(
      'geo_statistics_density',
      'GEO',
      'MEDIUM',
      ctx.statsMatches.length >= 3 ? 'PASS' : 'FAIL',
      ctx.statsMatches.length >= 3
        ? `${ctx.statsMatches.length} data points found — statistics measurably boost generative-engine visibility (GEO study, arXiv:2311.09735)`
        : `Only ${ctx.statsMatches.length} data point(s) found — add verifiable statistics and metrics`
    )
  );

  // 53. geo_author_credentials
  checks.push(
    makeCheck(
      'geo_author_credentials',
      'Other',
      'MEDIUM',
      ctx.authorHasCredentials ? 'PASS' : 'FAIL',
      ctx.authorHasCredentials
        ? 'Author credentials/role found in schema'
        : 'Author lacks credentials — anonymous content is a GEO penalty'
    )
  );

  // 54. geo_snippet_control
  const optimalSnippets = /max-image-preview\s*:\s*large/i.test(ctx.combinedRobotsMeta);
  checks.push(
    makeCheck(
      'geo_snippet_control',
      'GEO',
      'LOW',
      optimalSnippets ? 'PASS' : 'FAIL',
      optimalSnippets
        ? 'max-image-preview:large — optimal AI rich result display'
        : 'Add max-image-preview:large to robots meta for rich visual AI snippets'
    )
  );

  // 55. geo_comprehensiveness
  checks.push(
    makeCheck(
      'geo_comprehensiveness',
      'GEO',
      'LOW',
      ctx.questionTypes.length >= 3 ? 'PASS' : 'FAIL',
      ctx.questionTypes.length >= 3
        ? `${ctx.questionTypes.length}/6 question types covered (${ctx.questionTypes.join(', ')})`
        : `Only ${ctx.questionTypes.length}/6 question types — add What, Why, How headings`
    )
  );

  // 56. geo_anchor_quality
  checks.push(
    makeCheck(
      'geo_anchor_quality',
      'GEO',
      'LOW',
      ctx.genericAnchorsCount === 0 ? 'PASS' : 'FAIL',
      ctx.genericAnchorsCount === 0
        ? 'Link anchor texts are descriptive — good AI context signal'
        : `${ctx.genericAnchorsCount} generic anchor(s) found — use descriptive link phrases`
    )
  );

  // 57. geo_image_captions
  checks.push(
    makeCheck(
      'geo_image_captions',
      'GEO',
      'LOW',
      ctx.figcaptionsCount > 0 ? 'PASS' : 'FAIL',
      ctx.figcaptionsCount > 0
        ? `${ctx.figcaptionsCount} captioned <figure>/<figcaption> element(s) found`
        : 'No <figure>/<figcaption> — wrap images with descriptive captions for AI'
    )
  );

  // 58. geo_knowledge_graph
  checks.push(
    makeCheck(
      'geo_knowledge_graph',
      'Other',
      'MEDIUM',
      ctx.authoritativeSameAsLinks.length > 0 ? 'PASS' : 'FAIL',
      ctx.authoritativeSameAsLinks.length > 0
        ? `${ctx.authoritativeSameAsLinks.length} authoritative sameAs URI(s) found for Knowledge Graph disambiguation`
        : 'No authoritative sameAs links — add Wikipedia/Wikidata/LinkedIn URIs to schema for entity disambiguation'
    )
  );

  // 59. geo_no_cloaking
  checks.push(
    makeCheck(
      'geo_no_cloaking',
      'GEO',
      'HIGH',
      ctx.cloakingSignals === 0 ? 'PASS' : 'FAIL',
      ctx.cloakingSignals === 0
        ? 'No hidden-text cloaking patterns detected'
        : `${ctx.cloakingSignals} potential hidden-text cloaking pattern(s) detected`
    )
  );

  // 60. geo_keyword_stuffing
  checks.push(
    makeCheck(
      'geo_keyword_stuffing',
      'GEO',
      'MEDIUM',
      ctx.keywordStuffingMaxPct <= 5 ? 'PASS' : 'FAIL',
      ctx.keywordStuffingMaxPct <= 5
        ? 'No keyword-stuffing detected'
        : `High keyword repetition: "${ctx.topWord}" appears at ${ctx.keywordStuffingMaxPct}% density`
    )
  );

  // 61. geo_boilerplate
  checks.push(
    makeCheck(
      'geo_boilerplate',
      'GEO',
      'LOW',
      ctx.boilerplatePct < 60 ? 'PASS' : 'FAIL',
      ctx.boilerplatePct < 60
        ? `Healthy content-to-chrome ratio (~${ctx.boilerplatePct}% boilerplate)`
        : `High boilerplate chrome (~${ctx.boilerplatePct}%) relative to main content`
    )
  );

  // 62. geo_no_popup_walls
  checks.push(
    makeCheck(
      'geo_no_popup_walls',
      'GEO',
      'MEDIUM',
      !ctx.hasPopupWallSignals ? 'PASS' : 'FAIL',
      !ctx.hasPopupWallSignals
        ? 'No intrusive interstitial/paywall signals'
        : 'Paywall or gated content signal detected — may restrict AI extraction'
    )
  );

  // 63. geo_passage_citability
  checks.push(
    makeCheck(
      'geo_passage_citability',
      'GEO',
      'MEDIUM',
      ctx.citablePassagesPct >= 20 ? 'PASS' : 'FAIL',
      ctx.citablePassagesPct >= 20
        ? `${ctx.citablePassagesPct}% citation-ready passages (100-200 words opening with clear answers)`
        : `${ctx.citablePassagesPct}% citation-ready passages — write self-contained 120-180 word sections that open with a definition/answer`
    )
  );

  // 64. geo_video_schema (N/A if no video, matches reference CSV)
  if (ctx.videosCount === 0) {
    checks.push(makeCheck('geo_video_schema', 'GEO', 'LOW', 'N/A', 'No video content on page'));
  } else {
    checks.push(
      makeCheck(
        'geo_video_schema',
        'GEO',
        'LOW',
        ctx.hasVideoSchema ? 'PASS' : 'FAIL',
        ctx.hasVideoSchema
          ? 'VideoObject schema found for embedded video'
          : 'Video content found without VideoObject JSON-LD schema'
      )
    );
  }

  // 65. geo_bot_access
  checks.push(
    makeCheck(
      'geo_bot_access',
      'GEO',
      'HIGH',
      aux.robots.blockedGeoBots.length === 0 ? 'PASS' : 'FAIL',
      aux.robots.blockedGeoBots.length === 0
        ? 'All tested AI crawlers can access the page (GPTBot, ClaudeBot, PerplexityBot)'
        : `AI crawlers blocked in robots.txt: ${aux.robots.blockedGeoBots.join(', ')}`
    )
  );

  // 66. geo_ai_discovery
  checks.push(
    makeCheck(
      'geo_ai_discovery',
      'GEO',
      'LOW',
      aux.aiDiscovery.found ? 'PASS' : 'FAIL',
      aux.aiDiscovery.found
        ? `AI-discovery files found: ${aux.aiDiscovery.files.join(', ')}`
        : 'No AI-discovery files (.well-known/ai.txt, /ai/summary.json, /ai/faq.json) — optional but emerging for AI visibility'
    )
  );

  return checks;
}

module.exports = { runGeoChecks };
