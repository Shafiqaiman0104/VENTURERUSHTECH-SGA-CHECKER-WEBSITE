const { getGuidance } = require('./metadata');

function makeCheck(id, subCategory, priority, status, description) {
  const g = getGuidance(id);
  return {
    id,
    pillar: 'AEO',
    subCategory,
    priority,
    status,
    description,
    impact: g.impact,
    howToFix: g.howToFix,
  };
}

function runAeoChecks(ctx) {
  const checks = [];
  const { aux, headingsByLevel, og } = ctx;

  // 1. aeo_structured_data
  checks.push(
    makeCheck(
      'aeo_structured_data',
      'AEO',
      'HIGH',
      ctx.hasStructuredData ? 'PASS' : 'FAIL',
      ctx.hasStructuredData
        ? 'Structured data found — AI can understand your content'
        : 'No structured data found — add JSON-LD so AI can parse page entities'
    )
  );

  // 2. aeo_html_content
  checks.push(
    makeCheck(
      'aeo_html_content',
      'AEO',
      'HIGH',
      ctx.wordCount >= 300 ? 'PASS' : 'FAIL',
      ctx.wordCount >= 300
        ? `${ctx.wordCount} words in HTML — good content for AI parsing`
        : `Only ${ctx.wordCount} words in raw HTML — ensure server-side rendered content for AI crawlers`
    )
  );

  // 3. aeo_clean_url
  const pathDepth = ctx.parsedUrl.pathname.split('/').filter(Boolean).length;
  const cleanUrl = !ctx.parsedUrl.search && pathDepth <= 4 && !/\.php|\.aspx|sessionid/i.test(ctx.parsedUrl.pathname);
  checks.push(
    makeCheck(
      'aeo_clean_url',
      'AEO',
      'LOW',
      cleanUrl ? 'PASS' : 'FAIL',
      cleanUrl ? 'Clean URL structure' : 'URL contains query parameters, file extensions, or deep nesting'
    )
  );

  // 4. aeo_semantic_html
  checks.push(
    makeCheck(
      'aeo_semantic_html',
      'AEO',
      'MEDIUM',
      ctx.semanticTagsFound.length >= 3 ? 'PASS' : 'FAIL',
      ctx.semanticTagsFound.length >= 3
        ? `${ctx.semanticTagsFound.length} semantic HTML5 elements found`
        : `Only ${ctx.semanticTagsFound.length} semantic HTML5 element(s) — add <main>, <article>, <section>, <header>, <footer>`
    )
  );

  // 5. aeo_segmentation
  checks.push(
    makeCheck(
      'aeo_segmentation',
      'AEO',
      'MEDIUM',
      ctx.contentSectionsCount >= 3 ? 'PASS' : 'FAIL',
      ctx.contentSectionsCount >= 3
        ? `${ctx.contentSectionsCount} content sections — well-structured for AI`
        : `Only ${ctx.contentSectionsCount} content section(s) — segment page into distinct topical blocks`
    )
  );

  // 6. aeo_topic_signals
  const bothDescs = Boolean(ctx.metaDescription && og.description);
  checks.push(
    makeCheck(
      'aeo_topic_signals',
      'AEO',
      'MEDIUM',
      bothDescs ? 'PASS' : 'FAIL',
      bothDescs
        ? 'Description + OG description both present — clear topic signals'
        : 'Missing meta description or OG description — add both for consistent topic signals'
    )
  );

  // 7. aeo_named_entities
  checks.push(
    makeCheck(
      'aeo_named_entities',
      'AEO',
      'LOW',
      ctx.namedEntities.length >= 5 ? 'PASS' : 'FAIL',
      ctx.namedEntities.length >= 5
        ? `${ctx.namedEntities.length} named entities found — helps AI understand context`
        : `Only ${ctx.namedEntities.length} named entities detected — reference specific entities and terms`
    )
  );

  // 8. aeo_internal_links
  checks.push(
    makeCheck(
      'aeo_internal_links',
      'AEO',
      'MEDIUM',
      ctx.internalLinks.length >= 3 ? 'PASS' : 'FAIL',
      ctx.internalLinks.length >= 3
        ? `${ctx.internalLinks.length} internal links — good topic cluster signal`
        : `Only ${ctx.internalLinks.length} internal link(s) — build stronger internal topic clusters`
    )
  );

  // 9. aeo_definition_lists
  checks.push(
    makeCheck(
      'aeo_definition_lists',
      'Other',
      'MEDIUM',
      ctx.dlCount > 0 ? 'PASS' : 'FAIL',
      ctx.dlCount > 0
        ? `${ctx.dlCount} definition list(s) (<dl>) found`
        : 'No definition lists (<dl>) — great for term/value pairs'
    )
  );

  // 10. aeo_code_blocks
  checks.push(
    makeCheck(
      'aeo_code_blocks',
      'AEO',
      'LOW',
      ctx.codeBlocksCount > 0 ? 'PASS' : 'FAIL',
      ctx.codeBlocksCount > 0
        ? `${ctx.codeBlocksCount} code/pre blocks found — technical content AI can cite`
        : 'No code/pre blocks found (optional for non-technical pages)'
    )
  );

  // 11. aeo_faq
  const faqDetected =
    ctx.hasFaqSchema ||
    ctx.questionHeadings.length >= 2 ||
    ctx.detailsCount >= 2 ||
    /\bfrequently asked questions\b|\bfaq\b/i.test(ctx.bodyText);
  checks.push(
    makeCheck(
      'aeo_faq',
      'AEO',
      'MEDIUM',
      faqDetected ? 'PASS' : 'FAIL',
      faqDetected
        ? 'Q&A/FAQ content detected — useful for AI answers (note: Google retired FAQ rich results in May 2026; the schema itself no longer produces SERP features)'
        : 'No FAQ/Q&A content detected — add a FAQ section answering common customer questions'
    )
  );

  // 12. aeo_question_headings
  checks.push(
    makeCheck(
      'aeo_question_headings',
      'AEO',
      'MEDIUM',
      ctx.questionHeadings.length >= 1 ? 'PASS' : 'FAIL',
      ctx.questionHeadings.length >= 1
        ? `Question-style headings found (${ctx.questionHeadings.length}) — ideal for AI snippets`
        : 'No question-style headings found — phrase key headings as natural questions'
    )
  );

  // 13. aeo_lists
  checks.push(
    makeCheck(
      'aeo_lists',
      'AEO',
      'MEDIUM',
      ctx.totalLists >= 1 ? 'PASS' : 'FAIL',
      ctx.totalLists >= 1
        ? `${ctx.totalLists} lists found — structured content for AI`
        : 'No bulleted or numbered lists found — use <ul>/<ol> for scannable answers'
    )
  );

  // 14. aeo_tables
  checks.push(
    makeCheck(
      'aeo_tables',
      'AEO',
      'LOW',
      ctx.tablesCount >= 1 ? 'PASS' : 'FAIL',
      ctx.tablesCount >= 1
        ? `${ctx.tablesCount} data table(s) found — great for AI comparisons`
        : 'No data tables — tables help AI compare and cite data'
    )
  );

  // 15. aeo_direct_answers
  checks.push(
    makeCheck(
      'aeo_direct_answers',
      'AEO',
      'MEDIUM',
      ctx.directAnswersCount >= 1 ? 'PASS' : 'FAIL',
      ctx.directAnswersCount >= 1
        ? 'Concise answer paragraphs after headings — great for AI citation'
        : 'No concise direct-answer paragraphs immediately following headings'
    )
  );

  // 16. aeo_numbered_steps
  checks.push(
    makeCheck(
      'aeo_numbered_steps',
      'AEO',
      'LOW',
      ctx.stepByStepDetected ? 'PASS' : 'FAIL',
      ctx.stepByStepDetected
        ? 'Step-by-step content detected — AI loves procedural answers'
        : 'No numbered step-by-step sequences detected'
    )
  );

  // 17. aeo_short_sentences
  checks.push(
    makeCheck(
      'aeo_short_sentences',
      'AEO',
      'LOW',
      ctx.shortSentencePct >= 50 ? 'PASS' : 'FAIL',
      ctx.shortSentencePct >= 50
        ? `${ctx.shortSentencePct}% short sentences — easy for AI to extract`
        : `Only ${ctx.shortSentencePct}% short sentences — simplify complex sentences for AI extraction`
    )
  );

  // 18. aeo_concise_paragraphs
  checks.push(
    makeCheck(
      'aeo_concise_paragraphs',
      'AEO',
      'LOW',
      ctx.conciseParagraphPct >= 70 ? 'PASS' : 'FAIL',
      ctx.conciseParagraphPct >= 70
        ? `${ctx.conciseParagraphPct}% concise paragraphs — scannable for AI`
        : `Only ${ctx.conciseParagraphPct}% concise paragraphs — break up dense text blocks`
    )
  );

  // 19. aeo_key_value
  checks.push(
    makeCheck(
      'aeo_key_value',
      'AEO',
      'LOW',
      ctx.keyValueMatches.length >= 2 ? 'PASS' : 'FAIL',
      ctx.keyValueMatches.length >= 2
        ? `${ctx.keyValueMatches.length} key-value patterns found — structured data AI can parse`
        : 'Few or no explicit key-value patterns (e.g. "Metric: Value") found'
    )
  );

  // 20. aeo_section_depth
  checks.push(
    makeCheck(
      'aeo_section_depth',
      'AEO',
      'MEDIUM',
      ctx.avgH2SectionWords >= 50 ? 'PASS' : 'FAIL',
      ctx.avgH2SectionWords >= 50
        ? `Avg ${ctx.avgH2SectionWords} words/section — sufficient depth`
        : `Avg ${ctx.avgH2SectionWords} words/section — deepen section coverage for AI answers`
    )
  );

  // 21. aeo_author
  checks.push(
    makeCheck(
      'aeo_author',
      'AEO',
      'MEDIUM',
      ctx.hasAuthorByline ? 'PASS' : 'FAIL',
      ctx.hasAuthorByline
        ? 'Author information found — builds E-E-A-T'
        : 'No author information detected — add author byline or schema'
    )
  );

  // 22. aeo_date
  checks.push(
    makeCheck(
      'aeo_date',
      'Other',
      'MEDIUM',
      ctx.hasDateInfo ? 'PASS' : 'FAIL',
      ctx.hasDateInfo
        ? 'Publication or update date metadata found'
        : 'No date information — AI prefers fresh, dated content'
    )
  );

  // 23. aeo_statistics
  checks.push(
    makeCheck(
      'aeo_statistics',
      'AEO',
      'MEDIUM',
      ctx.statsMatches.length >= 2 ? 'PASS' : 'FAIL',
      ctx.statsMatches.length >= 2
        ? `Statistics and data found in content (${ctx.statsMatches.length} figures) — highly citable`
        : 'Few or no statistics/metrics found — add concrete numbers to boost citability'
    )
  );

  // 24. aeo_org_schema
  checks.push(
    makeCheck(
      'aeo_org_schema',
      'AEO',
      'MEDIUM',
      ctx.orgSchemas.length > 0 ? 'PASS' : 'FAIL',
      ctx.orgSchemas.length > 0
        ? 'Organization schema found — AI can identify your brand'
        : 'Missing Organization/LocalBusiness schema'
    )
  );

  // 25. aeo_eeat
  checks.push(
    makeCheck(
      'aeo_eeat',
      'AEO',
      'HIGH',
      ctx.eeatCount >= 3 ? 'PASS' : 'FAIL',
      ctx.eeatCount >= 3
        ? `${ctx.eeatCount}/5 E-E-A-T signals present`
        : `Only ${ctx.eeatCount}/5 E-E-A-T signals present — add Author, About, Contact, Privacy, and Org Schema`
    )
  );

  // 26. aeo_citations
  checks.push(
    makeCheck(
      'aeo_citations',
      'AEO',
      'MEDIUM',
      ctx.citationSignals ? 'PASS' : 'FAIL',
      ctx.citationSignals
        ? 'Source citations detected — strengthens factual credibility'
        : 'No source citations — reference studies and data for authority'
    )
  );

  // 27. aeo_authority_links
  checks.push(
    makeCheck(
      'aeo_authority_links',
      'AEO',
      'MEDIUM',
      ctx.externalLinks.length >= 1 ? 'PASS' : 'FAIL',
      ctx.externalLinks.length >= 1
        ? `${ctx.externalLinks.length} external links — references external sources`
        : 'No external reference links found'
    )
  );

  // 28. aeo_freshness
  checks.push(
    makeCheck(
      'aeo_freshness',
      'AEO',
      'LOW',
      ctx.recentYearMentioned ? 'PASS' : 'FAIL',
      ctx.recentYearMentioned
        ? 'Recent year referenced in content — signals up-to-date information'
        : 'No recent year mentioned — AI prefers up-to-date content'
    )
  );

  // 29. aeo_topic_focus
  checks.push(
    makeCheck(
      'aeo_topic_focus',
      'AEO',
      'MEDIUM',
      ctx.titleKeywordsInBodyPct >= 50 ? 'PASS' : 'FAIL',
      ctx.titleKeywordsInBodyPct >= 50
        ? `Topic focus: ${ctx.titleKeywordsInBodyPct}% — title keywords found in content`
        : `Topic focus: ${ctx.titleKeywordsInBodyPct}% — align page body closer to title keywords`
    )
  );

  // 30. aeo_answer_box
  checks.push(
    makeCheck(
      'aeo_answer_box',
      'AEO',
      'MEDIUM',
      ctx.answerBoxParagraphsCount >= 1 ? 'PASS' : 'FAIL',
      ctx.answerBoxParagraphsCount >= 1
        ? `${ctx.answerBoxParagraphsCount} answer-box-ready paragraphs found after headings`
        : 'No answer-box-ready paragraphs (15-75 words) found directly after headings'
    )
  );

  // 31. aeo_speakable (Informational N/A like reference CSV)
  checks.push(
    makeCheck(
      'aeo_speakable',
      'AEO',
      'LOW',
      'N/A',
      ctx.hasSpeakable
        ? 'Speakable schema found (Google beta — limited impact)'
        : 'No Speakable schema (optional — Google beta with limited impact)'
    )
  );

  // 32. aeo_conversational
  checks.push(
    makeCheck(
      'aeo_conversational',
      'AEO',
      'LOW',
      ctx.conversationalCount >= 10 ? 'PASS' : 'FAIL',
      ctx.conversationalCount >= 10
        ? `${ctx.conversationalCount} conversational words — good for AI summaries`
        : `Only ${ctx.conversationalCount} conversational words — adopt clearer reader-focused phrasing`
    )
  );

  // 33. aeo_snippet_ready
  const firstPWords = ctx.firstSubstantialParagraph ? ctx.firstSubstantialParagraph.wordCount : 0;
  const snippetReady = firstPWords >= 20 && firstPWords <= 75;
  checks.push(
    makeCheck(
      'aeo_snippet_ready',
      'AEO',
      'MEDIUM',
      snippetReady ? 'PASS' : 'FAIL',
      snippetReady
        ? `Opening paragraph is ${firstPWords} words — ready for AI snippets`
        : firstPWords < 20
          ? 'First paragraph too short for AI snippets'
          : `First paragraph is ${firstPWords} words — trim to 20-60 words for crisp AI snippets`
    )
  );

  // 34. aeo_search_action (Informational N/A like reference CSV)
  checks.push(
    makeCheck(
      'aeo_search_action',
      'AEO',
      'LOW',
      'N/A',
      ctx.hasSearchAction
        ? 'SearchAction schema found (informational — Google retired sitelinks search box in 2024)'
        : 'No SearchAction schema — fine: Google retired the sitelinks search box in 2024'
    )
  );

  // 35. aeo_reading_level
  checks.push(
    makeCheck(
      'aeo_reading_level',
      'AEO',
      'LOW',
      ctx.avgWordsPerSentence > 0 && ctx.avgWordsPerSentence <= 22 ? 'PASS' : 'FAIL',
      ctx.avgWordsPerSentence <= 22
        ? `Avg ${ctx.avgWordsPerSentence} words/sentence — easy reading level`
        : `Avg ${ctx.avgWordsPerSentence} words/sentence — shorten sentences to <= 20 words`
    )
  );

  // 36. aeo_active_voice
  checks.push(
    makeCheck(
      'aeo_active_voice',
      'AEO',
      'LOW',
      ctx.passivePct <= 25 ? 'PASS' : 'FAIL',
      ctx.passivePct <= 25
        ? `Active voice dominant (${ctx.passivePct}% passive) — AI-friendly`
        : `High passive voice usage (${ctx.passivePct}%) — rewrite key sentences in active voice`
    )
  );

  // 37. aeo_pronoun_density
  checks.push(
    makeCheck(
      'aeo_pronoun_density',
      'AEO',
      'LOW',
      ctx.pronounDensity >= 0.5 ? 'PASS' : 'FAIL',
      ctx.pronounDensity >= 0.5
        ? `Pronoun density: ${ctx.pronounDensity}% — engaging, user-focused`
        : `Pronoun density: ${ctx.pronounDensity}% — address readers more directly`
    )
  );

  // 38. aeo_summary
  checks.push(
    makeCheck(
      'aeo_summary',
      'AEO',
      'LOW',
      ctx.summarySignals ? 'PASS' : 'FAIL',
      ctx.summarySignals
        ? 'Summary/conclusion section found — AI can extract key points'
        : 'No summary or key takeaways section detected'
    )
  );

  // 39. aeo_heading_density
  const h2h3Count = headingsByLevel[2].length + headingsByLevel[3].length;
  checks.push(
    makeCheck(
      'aeo_heading_density',
      'AEO',
      'MEDIUM',
      h2h3Count >= 3 ? 'PASS' : 'FAIL',
      h2h3Count >= 3
        ? `${h2h3Count} H2/H3 headings — good content structure for AI`
        : `Only ${h2h3Count} H2/H3 heading(s) — add more subheadings to segment topics`
    )
  );

  // 40. aeo_qa_blocks
  checks.push(
    makeCheck(
      'aeo_qa_blocks',
      'Other',
      'MEDIUM',
      ctx.qaBlocksCount >= 2 ? 'PASS' : 'FAIL',
      ctx.qaBlocksCount >= 2
        ? `${ctx.qaBlocksCount} Q&A blocks found — strong answer-engine structure`
        : 'Few Q&A blocks — add question headings followed by answer paragraphs'
    )
  );

  // 41. aeo_ai_robots
  const aiBlockedMeta = /\b(noindex|nosnippet|noai|noimageai)\b/i.test(ctx.combinedRobotsMeta);
  checks.push(
    makeCheck(
      'aeo_ai_robots',
      'AEO',
      'HIGH',
      !aiBlockedMeta ? 'PASS' : 'FAIL',
      !aiBlockedMeta
        ? 'No AI-blocking robots directives — AI crawlers can access content'
        : `AI-restricting robots directive found: "${ctx.combinedRobotsMeta}"`
    )
  );

  // 42. aeo_last_modified
  const hasFreshnessSignal = Boolean(ctx.lastModifiedHeader || ctx.schemaDates.dateModified || ctx.metaModified);
  checks.push(
    makeCheck(
      'aeo_last_modified',
      'AEO',
      'LOW',
      hasFreshnessSignal ? 'PASS' : 'FAIL',
      hasFreshnessSignal
        ? 'Freshness signal found (Last-Modified header or dateModified)'
        : 'No Last-Modified HTTP header or dateModified schema found'
    )
  );

  // 43. aeo_llms_txt (Informational N/A like reference CSV)
  checks.push(
    makeCheck(
      'aeo_llms_txt',
      'AEO',
      'LOW',
      'N/A',
      aux.llmsTxt.exists
        ? '/llms.txt found (experimental — Google confirmed it has no effect on Google Search; some other AI services may read it)'
        : 'No /llms.txt found (experimental — optional convention for LLM-friendly site summaries)'
    )
  );

  // 44. aeo_ai_crawlers
  const allowedSearch = aux.robots.allowedSearchAiCrawlers.length;
  const totalSearch = aux.robots.totalSearchAiCrawlers;
  checks.push(
    makeCheck(
      'aeo_ai_crawlers',
      'AEO',
      'HIGH',
      allowedSearch === totalSearch ? 'PASS' : 'FAIL',
      allowedSearch === totalSearch
        ? `AI search crawlers not blocked in robots.txt (${allowedSearch}/${totalSearch} allowed)`
        : `Some AI search crawlers blocked in robots.txt (${allowedSearch}/${totalSearch} allowed)`
    )
  );

  // 45. aeo_sameas_links
  checks.push(
    makeCheck(
      'aeo_sameas_links',
      'AEO',
      'MEDIUM',
      ctx.sameAsLinks.length > 0 ? 'PASS' : 'FAIL',
      ctx.sameAsLinks.length > 0
        ? `${ctx.sameAsLinks.length} sameAs profile link(s) found in schema`
        : 'No sameAs links in schema — add social profiles for brand recognition'
    )
  );

  // 46. aeo_brand_consistency
  checks.push(
    makeCheck(
      'aeo_brand_consistency',
      'AEO',
      'MEDIUM',
      ctx.brandConsistencySignals >= 2 ? 'PASS' : 'FAIL',
      ctx.brandConsistencySignals >= 2
        ? `Brand name consistent across ${ctx.brandConsistencySignals}/3 signals (title, OG, schema)`
        : `Brand name only matched in ${ctx.brandConsistencySignals}/3 signals (title, OG, schema)`
    )
  );

  // 47. aeo_update_recency
  checks.push(
    makeCheck(
      'aeo_update_recency',
      'AEO',
      'MEDIUM',
      ctx.updateWithin90Days ? 'PASS' : 'FAIL',
      ctx.updateWithin90Days
        ? 'Content updated within 90 days — AI engines strongly prefer fresh content'
        : 'No recent update timestamp within last 90 days detected'
    )
  );

  // 48. aeo_toc
  checks.push(
    makeCheck(
      'aeo_toc',
      'AEO',
      'LOW',
      ctx.tocDetected ? 'PASS' : 'FAIL',
      ctx.tocDetected
        ? 'Table of Contents detected — helps AI navigate long content'
        : 'No Table of Contents or section jump links detected'
    )
  );

  // 49. aeo_video
  checks.push(
    makeCheck(
      'aeo_video',
      'AEO',
      'LOW',
      ctx.videosCount > 0 ? 'PASS' : 'FAIL',
      ctx.videosCount > 0
        ? `${ctx.videosCount} video embed/element(s) detected`
        : 'No video content — multimedia increases AI engagement and citation rate'
    )
  );

  // 50. aeo_data_attribution
  checks.push(
    makeCheck(
      'aeo_data_attribution',
      'AEO',
      'LOW',
      ctx.dataAttributionMatches.length > 0 ? 'PASS' : 'FAIL',
      ctx.dataAttributionMatches.length > 0
        ? 'Statistics with source attribution — highly credible for AI citation'
        : 'No source-attributed statistics detected — pair figures with their source'
    )
  );

  // 51. aeo_collapsible
  checks.push(
    makeCheck(
      'aeo_collapsible',
      'AEO',
      'LOW',
      ctx.accordionCount > 0 ? 'PASS' : 'FAIL',
      ctx.detailsCount > 0
        ? `${ctx.detailsCount} collapsible section(s) (<details>) — interactive AI-friendly content`
        : ctx.accordionCount > 0
          ? `${ctx.accordionCount} interactive collapsible accordion(s) detected`
          : 'No collapsible FAQ/accordion sections (<details>) detected'
    )
  );

  // 52. aeo_entity_consistency
  checks.push(
    makeCheck(
      'aeo_entity_consistency',
      'AEO',
      'MEDIUM',
      ctx.brandMentions >= 2 ? 'PASS' : 'FAIL',
      ctx.brandMentions >= 2
        ? `Brand "${ctx.brandName}" used consistently (${ctx.brandMentions} mentions)`
        : `Brand "${ctx.brandName || ctx.hostname}" mentioned fewer than 2 times on page`
    )
  );

  return checks;
}

module.exports = { runAeoChecks };
