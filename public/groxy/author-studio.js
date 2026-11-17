/**
 * Groxy AI v1.7.0 — Multi-Genre Storytelling Brain, Hemingway Readability Auditor,
 * XSS-Safe schema.org/Book JSON-LD Engine & Pure Grex JS Author Studio.
 * Zero wrapper <div> elements, zero innerHTML writes, zero eval()/new Function().
 */

export const GROXY_VERSION = "1.7.0";
export const AUTHOR_STUDIO_VERSION = "1.7.0";

import {
  auditAccessibility,
  isSafeUrl,
  setSafeText,
  validateElementNode,
} from "./grex.js";
import {
  isExactGrabDecimalString,
  isExactGrabIntegerString,
} from "./auditor.js";
import { escapeJsonLdForScript } from "./site-context.js";
import {
  auditDesignCraft,
  canonicalJson,
  sha256,
  validateSubtreeStrict,
} from "./section-copilot.js";

export const REQUIRED_GENRE_SLUGS = Object.freeze([
  "urban-fiction",
  "thriller",
  "romance",
  "sci-fi-fantasy",
  "self-help-reentry",
  "true-crime",
]);

export const CANONICAL_GENRE_PRICING_TIERS = Object.freeze([
  "0.00",
  "2.99",
  "4.99",
  "9.99",
  "14.99",
]);

const ALLOWED_BOOK_FORMATS = new Set([
  "https://schema.org/EBook",
  "https://schema.org/Paperback",
  "https://schema.org/Hardcover",
  "https://schema.org/AudiobookFormat",
]);

const ALLOWED_AVAILABILITY = new Set([
  "https://schema.org/InStock",
  "https://schema.org/PreOrder",
  "https://schema.org/OutOfStock",
]);

const XSS_PATTERN = /<\s*\/?\s*(?:script|iframe|object|embed|style|div)\b|\bon[a-z]+\s*=|(?:javascript|vbscript|file|data):/i;
const MARKDOWN_LINK_PATTERN = /\[[^\]]+\]\([^)]+\)/;

const NON_ADVERB_LY = new Set([
  "only",
  "family",
  "early",
  "daily",
  "friendly",
  "lonely",
  "ugly",
  "holy",
  "silly",
  "belly",
  "alley",
  "valley",
  "rally",
  "reply",
  "supply",
  "apply",
  "rely",
  "fly",
  "july",
  "italy",
  "emily",
  "lovely",
  "lively",
  "likely",
  "unlikely",
  "costly",
  "timely",
  "deadly",
  "elderly",
]);

const WEAK_ADVERBS = new Set([
  "very",
  "really",
  "just",
  "quite",
  "rather",
  "somewhat",
  "literally",
  "basically",
  "actually",
]);

const IRREGULAR_PARTICIPLES = new Set([
  "written",
  "taken",
  "broken",
  "stolen",
  "hidden",
  "driven",
  "given",
  "known",
  "seen",
  "done",
  "made",
  "told",
  "found",
  "left",
  "kept",
  "held",
  "built",
  "caught",
  "taught",
  "shot",
  "sold",
  "sent",
  "lost",
  "chosen",
  "spoken",
  "woken",
  "frozen",
  "forgotten",
  "drawn",
  "blown",
  "thrown",
  "grown",
  "worn",
  "torn",
  "born",
  "sworn",
  "struck",
  "hung",
  "rung",
  "sung",
  "sunk",
  "drunk",
  "beaten",
  "eaten",
  "fallen",
  "shaken",
  "risen",
  "bitten",
  "paid",
  "said",
  "laid",
]);

const PASSIVE_AUXILIARIES = new Set(["am", "is", "are", "was", "were", "be", "been", "being"]);

export class AuthorStudioError extends Error {
  constructor(code, message, status = 422, details = null) {
    super(message);
    this.name = "AuthorStudioError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export { canonicalJson, sha256 };

function formatDecimal2FromScaled(scaledInt) {
  const safe = Math.max(0, Math.round(Number.isFinite(scaledInt) ? scaledInt : 0));
  const whole = Math.floor(safe / 100);
  const frac = String(safe % 100).padStart(2, "0");
  return `${whole}.${frac}`;
}

function scanPlaybookStringsForXss(node, pathLabel = "playbook") {
  if (typeof node === "string") {
    if (XSS_PATTERN.test(node)) {
      throw new AuthorStudioError(
        "GENRE_PLAYBOOK_XSS",
        `Unsafe HTML or script payload found at ${pathLabel}.`,
        422
      );
    }
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item, idx) => scanPlaybookStringsForXss(item, `${pathLabel}[${idx}]`));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      scanPlaybookStringsForXss(v, `${pathLabel}.${k}`);
    }
  }
}

function assertExactDecimalField(val, label) {
  if (typeof val === "number") {
    throw new AuthorStudioError(
      "ADR025C_WIRE_REQUIRED",
      `${label} must be an exact base-10 wire string; raw JS numbers/floats are rejected.`,
      422
    );
  }
  if (typeof val !== "string" || !isExactGrabDecimalString(val)) {
    throw new AuthorStudioError(
      "ADR025C_WIRE_REQUIRED",
      `${label} "${String(val ?? "")}" is not a valid base-10 GrabDecimal wire string.`,
      422
    );
  }
}

function assertExactIntegerField(val, label, minVal = 0) {
  if (typeof val === "number") {
    throw new AuthorStudioError(
      "ADR025C_WIRE_REQUIRED",
      `${label} must be an exact base-10 integer wire string; raw JS numbers are rejected.`,
      422
    );
  }
  if (typeof val !== "string" || !isExactGrabIntegerString(val)) {
    throw new AuthorStudioError(
      "ADR025C_WIRE_REQUIRED",
      `${label} "${String(val ?? "")}" is not a valid base-10 GrabInteger wire string.`,
      422
    );
  }
  if (Number(val) < minVal) {
    throw new AuthorStudioError(
      "ADR025C_WIRE_REQUIRED",
      `${label} must be >= ${minVal}.`,
      422
    );
  }
}

/** Fail-closed schema validator for groxy-genre-playbook-v1.0 (Conditions C1 & C2). */
export function validateGenrePlaybook(playbook, expectedSlug = null) {
  if (!playbook || typeof playbook !== "object" || Array.isArray(playbook)) {
    throw new AuthorStudioError("GENRE_PLAYBOOK_INVALID", "Genre playbook must be a JSON object.", 422);
  }
  if (playbook.schema_version !== "groxy-genre-playbook-v1.0") {
    throw new AuthorStudioError(
      "GENRE_PLAYBOOK_INVALID",
      `Unsupported schema_version "${String(playbook.schema_version ?? "")}".`,
      422
    );
  }
  const slug = String(playbook.genre_slug || "").trim();
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new AuthorStudioError("GENRE_PLAYBOOK_INVALID", "Invalid genre_slug.", 422);
  }
  if (expectedSlug && slug !== expectedSlug) {
    throw new AuthorStudioError(
      "GENRE_PLAYBOOK_INVALID",
      `Playbook genre_slug "${slug}" does not match expected "${expectedSlug}".`,
      422
    );
  }
  if (typeof playbook.display_name !== "string" || !playbook.display_name.trim()) {
    throw new AuthorStudioError("GENRE_PLAYBOOK_INVALID", "display_name is required.", 422);
  }

  for (const sectionKey of [
    "target_audience",
    "pacing_and_structure",
    "trope_checklist",
    "character_archetypes",
    "voice_and_dialogue_rules",
    "publishing_and_pricing_tiers",
    "schema_org_book_defaults",
  ]) {
    if (!playbook[sectionKey] || typeof playbook[sectionKey] !== "object" || Array.isArray(playbook[sectionKey])) {
      throw new AuthorStudioError(
        "GENRE_PLAYBOOK_INVALID",
        `Playbook missing required object section "${sectionKey}".`,
        422
      );
    }
  }

  scanPlaybookStringsForXss(playbook, slug);

  // Word-count & cliffhanger numeric wire string enforcement
  const pacing = playbook.pacing_and_structure;
  for (const bagKey of ["novel_word_count_targets", "chapter_word_count_targets"]) {
    const bag = pacing[bagKey];
    if (!bag || typeof bag !== "object") {
      throw new AuthorStudioError("GENRE_PLAYBOOK_INVALID", `Missing pacing_and_structure.${bagKey}.`, 422);
    }
    for (const [k, v] of Object.entries(bag)) {
      if (k.endsWith("_words")) {
        assertExactIntegerField(v, `pacing_and_structure.${bagKey}.${k}`, 1);
      }
    }
  }
  if (pacing.cliffhanger_cadence) {
    if (pacing.cliffhanger_cadence.micro_tension_interval_words !== undefined) {
      assertExactIntegerField(
        pacing.cliffhanger_cadence.micro_tension_interval_words,
        "cliffhanger_cadence.micro_tension_interval_words",
        1
      );
    }
    if (pacing.cliffhanger_cadence.chapter_ending_cliffhanger_rate_percent !== undefined) {
      assertExactDecimalField(
        pacing.cliffhanger_cadence.chapter_ending_cliffhanger_rate_percent,
        "cliffhanger_cadence.chapter_ending_cliffhanger_rate_percent"
      );
    }
  }

  // Hemingway clarity check thresholds
  const hem = playbook.voice_and_dialogue_rules?.hemingway_clarity_checks;
  if (!hem || typeof hem !== "object") {
    throw new AuthorStudioError("GENRE_PLAYBOOK_INVALID", "Missing hemingway_clarity_checks.", 422);
  }
  for (const decKey of [
    "target_reading_grade_level",
    "max_reading_grade_level",
    "passive_voice_max_percent",
    "adverb_density_max_percent",
  ]) {
    assertExactDecimalField(hem[decKey], `hemingway_clarity_checks.${decKey}`);
  }
  for (const intKey of ["average_sentence_length_words", "hard_sentence_length_ceiling_words"]) {
    assertExactIntegerField(hem[intKey], `hemingway_clarity_checks.${intKey}`, 1);
  }

  // ADR-025c pricing tiers
  const pub = playbook.publishing_and_pricing_tiers;
  const tiers = pub.pricing_tiers_usd;
  if (!tiers || typeof tiers !== "object" || Array.isArray(tiers)) {
    throw new AuthorStudioError("GENRE_PLAYBOOK_INVALID", "Missing pricing_tiers_usd.", 422);
  }
  const tierValues = new Set();
  for (const [k, v] of Object.entries(tiers)) {
    assertExactDecimalField(v, `pricing_tiers_usd.${k}`);
    tierValues.add(v);
  }
  for (const reqTier of CANONICAL_GENRE_PRICING_TIERS) {
    if (!tierValues.has(reqTier)) {
      throw new AuthorStudioError(
        "GENRE_PLAYBOOK_INVALID",
        `pricing_tiers_usd must include canonical ADR-025c tier "${reqTier}".`,
        422
      );
    }
  }
  if (pub.royalty_and_unit_economics && typeof pub.royalty_and_unit_economics === "object") {
    for (const [k, v] of Object.entries(pub.royalty_and_unit_economics)) {
      assertExactDecimalField(v, `royalty_and_unit_economics.${k}`);
    }
  }

  // Condition C1: schema.org defaults must be plain https://schema.org/... URLs (no Markdown links)
  const sOrg = playbook.schema_org_book_defaults;
  if (sOrg["@context"] !== "https://schema.org") {
    throw new AuthorStudioError(
      "GENRE_PLAYBOOK_INVALID",
      'schema_org_book_defaults["@context"] must be plain "https://schema.org".',
      422
    );
  }
  if (sOrg["@type"] !== "Book") {
    throw new AuthorStudioError("GENRE_PLAYBOOK_INVALID", 'schema_org_book_defaults["@type"] must be "Book".', 422);
  }
  if (typeof sOrg.bookFormat !== "string" || MARKDOWN_LINK_PATTERN.test(sOrg.bookFormat) || !ALLOWED_BOOK_FORMATS.has(sOrg.bookFormat)) {
    throw new AuthorStudioError(
      "GENRE_PLAYBOOK_INVALID",
      "schema_org_book_defaults.bookFormat must be a plain https://schema.org/ bookFormat URL.",
      422
    );
  }
  const offers = sOrg.offers_defaults;
  if (!offers || typeof offers !== "object") {
    throw new AuthorStudioError("GENRE_PLAYBOOK_INVALID", "schema_org_book_defaults.offers_defaults is required.", 422);
  }
  assertExactDecimalField(offers.price, "schema_org_book_defaults.offers_defaults.price");
  if (typeof offers.availability !== "string" || MARKDOWN_LINK_PATTERN.test(offers.availability) || !ALLOWED_AVAILABILITY.has(offers.availability)) {
    throw new AuthorStudioError(
      "GENRE_PLAYBOOK_INVALID",
      "schema_org_book_defaults.offers_defaults.availability must be a plain https://schema.org/ availability URL.",
      422
    );
  }
  if (typeof sOrg.isAccessibleForFree !== "boolean") {
    throw new AuthorStudioError("GENRE_PLAYBOOK_INVALID", "schema_org_book_defaults.isAccessibleForFree must be boolean.", 422);
  }

  return playbook;
}

function countSyllablesWord(rawWord) {
  const w = String(rawWord || "").toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  let cleaned = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const matches = cleaned.match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches ? matches.length : 1);
}

function splitProseSentences(prose) {
  const lines = String(prose || "").split(/\r?\n/);
  const sentences = [];
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx += 1) {
    const line = lines[lineIdx].trim();
    if (!line) continue;
    const chunks = line
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const chunk of chunks) {
      sentences.push({ line_index: lineIdx + 1, text: chunk });
    }
  }
  return sentences;
}

function tokenizeWords(text) {
  const matches = String(text || "").match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g);
  return matches || [];
}

function isPastParticiple(wordLower) {
  if (IRREGULAR_PARTICIPLES.has(wordLower)) return true;
  return wordLower.length >= 4 && wordLower.endsWith("ed");
}

function isAdverbWord(wordLower) {
  if (WEAK_ADVERBS.has(wordLower)) return true;
  if (wordLower.length >= 5 && wordLower.endsWith("ly") && !NON_ADVERB_LY.has(wordLower)) {
    return true;
  }
  return false;
}

function parseDialogueTargetPercent(rawRange) {
  const s = String(rawRange || "45.00 to 55.00");
  const nums = s.match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return { min: 40, max: 60 };
  if (nums.length === 1) return { min: Number(nums[0]), max: Number(nums[0]) };
  return { min: Number(nums[0]), max: Number(nums[1]) };
}

/** Deterministic Hemingway Clarity & Readability Auditor (Condition C2 wire strings). */
export function auditReadabilityHemingway(prose, genrePlaybook = null) {
  const raw = String(prose || "").trim();
  if (!raw) {
    throw new AuthorStudioError("PROSE_REQUIRED", "Prose text is required for readability auditing.", 400);
  }
  if (raw.length > 50000) {
    throw new AuthorStudioError("PROSE_TOO_LARGE", "Prose text exceeds 50,000 characters.", 400);
  }
  if (XSS_PATTERN.test(raw)) {
    throw new AuthorStudioError("GREX-SEC-003", "Unsafe HTML or script markup is not permitted in prose.", 422);
  }

  const validPlaybook = genrePlaybook ? validateGenrePlaybook(genrePlaybook) : null;
  const hem = validPlaybook?.voice_and_dialogue_rules?.hemingway_clarity_checks || {
    target_reading_grade_level: "7.00",
    max_reading_grade_level: "9.00",
    average_sentence_length_words: "15",
    hard_sentence_length_ceiling_words: "28",
    passive_voice_max_percent: "5.00",
    adverb_density_max_percent: "2.00",
  };
  const dialogueRange = parseDialogueTargetPercent(
    validPlaybook?.voice_and_dialogue_rules?.dialogue_cadence?.dialogue_to_narration_ratio_percent
  );

  const sentences = splitProseSentences(raw);
  const effectiveSentences = sentences.length > 0 ? sentences : [{ line_index: 1, text: raw }];
  const allWords = tokenizeWords(raw);
  const totalWords = Math.max(1, allWords.length);
  const totalSentences = effectiveSentences.length;

  let totalSyllables = 0;
  let adverbCount = 0;
  const adverbHits = [];
  for (const w of allWords) {
    totalSyllables += countSyllablesWord(w);
    const wl = w.toLowerCase();
    if (isAdverbWord(wl)) {
      adverbCount += 1;
      if (!adverbHits.includes(wl)) adverbHits.push(wl);
    }
  }

  let passiveSentences = 0;
  let complexSentences = 0;
  const flaggedSentences = [];
  const suggestions = [];

  for (let i = 0; i < effectiveSentences.length; i += 1) {
    const sObj = effectiveSentences[i];
    const sWords = tokenizeWords(sObj.text);
    const sWordLower = sWords.map((w) => w.toLowerCase());
    let hasPassive = false;
    for (let j = 0; j < sWordLower.length - 1; j += 1) {
      if (PASSIVE_AUXILIARIES.has(sWordLower[j]) && isPastParticiple(sWordLower[j + 1])) {
        hasPassive = true;
        break;
      }
    }
    if (hasPassive) {
      passiveSentences += 1;
      suggestions.push({
        line_index: sObj.line_index,
        sentence_index: i + 1,
        category: "passive_voice",
        original_excerpt: sObj.text.slice(0, 140),
        plain_english_suggestion: "Rewrite using an active subject performing a concrete verb.",
      });
    }

    const clauseDelims = (sObj.text.match(/[,;:\u2014]|\b(?:which|although|however|because|whereas|nevertheless)\b/gi) || []).length;
    const hardCeiling = Number(hem.hard_sentence_length_ceiling_words);
    const avgCeiling = Number(hem.average_sentence_length_words);
    const isComplex = sWords.length > hardCeiling || (sWords.length > avgCeiling && clauseDelims >= 3);
    if (isComplex) {
      complexSentences += 1;
      flaggedSentences.push({
        sentence_index: i + 1,
        line_index: sObj.line_index,
        word_count: String(sWords.length),
        clause_markers: String(clauseDelims),
        excerpt: sObj.text.slice(0, 140),
      });
      suggestions.push({
        line_index: sObj.line_index,
        sentence_index: i + 1,
        category: "complex_clause",
        original_excerpt: sObj.text.slice(0, 140),
        plain_english_suggestion: `Split this ${sWords.length}-word sentence into two punchier beats under ${avgCeiling} words.`,
      });
    }

    const sAdverbs = sWordLower.filter((wl) => isAdverbWord(wl));
    if (sAdverbs.length > 0) {
      suggestions.push({
        line_index: sObj.line_index,
        sentence_index: i + 1,
        category: "adverb_clutter",
        original_excerpt: sObj.text.slice(0, 140),
        plain_english_suggestion: `Replace weak modifier(s) (${sAdverbs.slice(0, 3).join(", ")}) with a stronger action verb.`,
      });
    }
  }

  // Dialogue ratio: count words inside "..." or “...”
  let dialogueWords = 0;
  const quoteMatches = raw.match(/["\u201c]([^"\u201d]+)["\u201d]/g) || [];
  for (const qm of quoteMatches) {
    dialogueWords += tokenizeWords(qm).length;
  }

  const paragraphs = raw.split(/\r?\n\s*\r?\n|\r?\n/).map((p) => p.trim()).filter(Boolean);
  const denseParagraphs = [];
  paragraphs.forEach((p, idx) => {
    const pSents = p.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (pSents.length > 5) {
      denseParagraphs.push(idx + 1);
      suggestions.push({
        line_index: idx + 1,
        sentence_index: 0,
        category: "mobile_pacing",
        original_excerpt: p.slice(0, 140),
        plain_english_suggestion: `Break this ${pSents.length}-sentence paragraph into 2-to-4-sentence blocks for mobile readability.`,
      });
    }
  });

  const fkGradeRaw =
    0.39 * (totalWords / totalSentences) +
    11.8 * (totalSyllables / totalWords) -
    15.59;
  const gradeScaled = Math.max(0, Math.round(fkGradeRaw * 100));
  const passivePctScaled = Math.round((passiveSentences / totalSentences) * 10000);
  const adverbPctScaled = Math.round((adverbCount / totalWords) * 10000);
  const dialoguePctScaled = Math.round((dialogueWords / totalWords) * 10000);
  const avgSentScaled = Math.round((totalWords / totalSentences) * 100);

  const gradeLevelStr = formatDecimal2FromScaled(gradeScaled);
  const passivePctStr = formatDecimal2FromScaled(passivePctScaled);
  const adverbPctStr = formatDecimal2FromScaled(adverbPctScaled);
  const dialoguePctStr = formatDecimal2FromScaled(dialoguePctScaled);
  const avgSentStr = formatDecimal2FromScaled(avgSentScaled);

  let penalty = 0;
  if (gradeScaled > Math.round(Number(hem.max_reading_grade_level) * 100)) {
    penalty += 15;
  } else if (gradeScaled > Math.round(Number(hem.target_reading_grade_level) * 100)) {
    penalty += 5;
  }
  if (passivePctScaled > Math.round(Number(hem.passive_voice_max_percent) * 100)) {
    penalty += 15;
  }
  if (adverbPctScaled > Math.round(Number(hem.adverb_density_max_percent) * 100)) {
    penalty += 12;
  }
  penalty += Math.min(20, complexSentences * 6);
  penalty += Math.min(10, denseParagraphs.length * 5);

  const score = Math.max(0, Math.min(100, 100 - penalty));
  const grade =
    score >= 95 ? "A+" : score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";

  const dialogueNum = dialoguePctScaled / 100;
  let pacingNote = "Dialogue-to-narration pacing fits target genre cadence.";
  if (dialogueNum < dialogueRange.min) {
    pacingNote = `Dialogue ratio (${dialoguePctStr}%) is below target (${dialogueRange.min.toFixed(2)}%–${dialogueRange.max.toFixed(2)}%); convert exposition into spoken tension.`;
  } else if (dialogueNum > dialogueRange.max) {
    pacingNote = `Dialogue ratio (${dialoguePctStr}%) exceeds target (${dialogueRange.min.toFixed(2)}%–${dialogueRange.max.toFixed(2)}%); add sensory grounding beats between lines.`;
  }

  return {
    ok: true,
    schema_version: "1.7.0",
    genre_slug: validPlaybook ? validPlaybook.genre_slug : "default",
    score,
    grade,
    publish_ready: score >= 80,
    metrics: {
      word_count: String(allWords.length),
      sentence_count: String(totalSentences),
      paragraph_count: String(Math.max(1, paragraphs.length)),
      grade_level: gradeLevelStr,
      average_sentence_words: avgSentStr,
      passive_voice_percent: passivePctStr,
      adverb_density_percent: adverbPctStr,
      dialogue_ratio_percent: dialoguePctStr,
      complex_sentence_count: String(complexSentences),
    },
    thresholds: {
      target_reading_grade_level: hem.target_reading_grade_level,
      max_reading_grade_level: hem.max_reading_grade_level,
      average_sentence_length_words: hem.average_sentence_length_words,
      hard_sentence_length_ceiling_words: hem.hard_sentence_length_ceiling_words,
      passive_voice_max_percent: hem.passive_voice_max_percent,
      adverb_density_max_percent: hem.adverb_density_max_percent,
      dialogue_target_percent: `${dialogueRange.min.toFixed(2)} to ${dialogueRange.max.toFixed(2)}`,
    },
    pacing_recommendation: pacingNote,
    adverb_hits: adverbHits,
    flagged_sentences: flaggedSentences,
    suggestions,
  };
}

function normalizeBookFormat(rawFormat, defaultFormat = "https://schema.org/EBook") {
  const s = String(rawFormat || "").trim();
  if (!s) return defaultFormat;
  if (s === "EBook" || s === "ebook") return "https://schema.org/EBook";
  if (s === "Paperback" || s === "paperback") return "https://schema.org/Paperback";
  if (s === "Hardcover" || s === "hardcover") return "https://schema.org/Hardcover";
  if (s === "AudiobookFormat" || s === "audiobook") return "https://schema.org/AudiobookFormat";
  if (ALLOWED_BOOK_FORMATS.has(s)) return s;
  throw new AuthorStudioError("BOOK_META_INVALID", `Unsupported bookFormat "${s}".`, 422);
}

/** XSS-safe schema.org/Book & BookSeries JSON-LD generator (Conditions C2 & C3). */
export function generateBookJsonLd({
  genrePlaybook,
  bookMeta = {},
  brief = {},
  siteUrl = "https://example.com",
  artifactType = "chapter_outline",
} = {}) {
  const validPlaybook = validateGenrePlaybook(genrePlaybook);
  const sDefaults = validPlaybook.schema_org_book_defaults;

  if (bookMeta.price !== undefined) {
    assertExactDecimalField(bookMeta.price, "book_meta.price");
  }
  if (bookMeta.offers?.price !== undefined) {
    assertExactDecimalField(bookMeta.offers.price, "book_meta.offers.price");
  }
  if (bookMeta.numberOfPages !== undefined) {
    assertExactIntegerField(bookMeta.numberOfPages, "book_meta.numberOfPages", 1);
  }
  if (brief.price !== undefined) {
    assertExactDecimalField(brief.price, "brief.price");
  }

  const cleanPrice = bookMeta.offers?.price ?? bookMeta.price ?? brief.price ?? sDefaults.offers_defaults.price;
  const cleanPages = bookMeta.numberOfPages ?? "280";
  const cleanFormat = normalizeBookFormat(bookMeta.bookFormat, sDefaults.bookFormat);
  const cleanLang = String(bookMeta.inLanguage || sDefaults.inLanguage || "en-US").trim();
  const cleanIsbn = String(bookMeta.isbn || "978-0-00-000000-0").trim();
  if (!/^[0-9Xx-]{10,20}$/.test(cleanIsbn)) {
    throw new AuthorStudioError("BOOK_META_INVALID", "Invalid ISBN format.", 422);
  }

  const title = String(bookMeta.title || brief.title || `${validPlaybook.display_name} Release`).trim();
  const authorName = String(bookMeta.author_name || brief.author_name || "Plotific Press Author").trim();
  const seriesName = String(bookMeta.series_name || brief.series_name || "").trim();
  const cleanSiteUrl = String(siteUrl || "https://example.com").replace(/\/+$/, "");
  if (!isSafeUrl(cleanSiteUrl)) {
    throw new AuthorStudioError("GREX-SEC-003", "Unsafe site URL in JSON-LD.", 422);
  }

  const bookNode = {
    "@type": "Book",
    name: title,
    author: {
      "@type": "Person",
      name: authorName,
    },
    bookFormat: cleanFormat,
    isbn: cleanIsbn,
    numberOfPages: cleanPages,
    inLanguage: cleanLang,
    genre: sDefaults.genre,
    keywords: Array.isArray(sDefaults.keywords) ? sDefaults.keywords.join(", ") : "",
    typicalAgeRange: String(bookMeta.typicalAgeRange || sDefaults.typicalAgeRange || "18-"),
    isAccessibleForFree: cleanPrice === "0.00" ? true : Boolean(sDefaults.isAccessibleForFree),
    offers: {
      "@type": "Offer",
      priceCurrency: sDefaults.offers_defaults.priceCurrency || "USD",
      price: cleanPrice,
      availability: sDefaults.offers_defaults.availability || "https://schema.org/InStock",
      url: `${cleanSiteUrl}/books/${validPlaybook.genre_slug}`,
    },
  };

  let payload;
  if (seriesName || artifactType === "series_reading_grid") {
    const resolvedSeries = seriesName || `${title} Series`;
    bookNode.isPartOf = {
      "@type": "BookSeries",
      name: resolvedSeries,
    };
    payload = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BookSeries",
          name: resolvedSeries,
          genre: sDefaults.genre,
          inLanguage: cleanLang,
          author: { "@type": "Person", name: authorName },
        },
        bookNode,
      ],
    };
  } else {
    payload = {
      "@context": "https://schema.org",
      ...bookNode,
    };
  }

  const rawJson = JSON.stringify(payload, null, 2);
  const escapedJson = escapeJsonLdForScript(rawJson);

  return {
    ok: true,
    schema_type: seriesName || artifactType === "series_reading_grid" ? "BookSeries+Book" : "Book",
    json_ld_object: payload,
    json_ld_escaped: escapedJson,
    script_tag_preview: `<script type="application/ld+json">\n${escapedJson}\n</script>`,
  };
}

/** Builds a pure Grex JS v1.0.0 series reading-order grid layout (Conditions C2 & C4). */
export function buildSeriesReadingGridLayout({
  genrePlaybook,
  brief = {},
  bookMeta = {},
  designSystem = "",
  cmsContentTypes = null,
} = {}) {
  const validPlaybook = validateGenrePlaybook(genrePlaybook);
  const tiers = validPlaybook.publishing_and_pricing_tiers.pricing_tiers_usd;
  const seriesTitle = String(bookMeta.series_name || brief.series_name || brief.title || `${validPlaybook.display_name} Series`).trim();
  const authorName = String(bookMeta.author_name || brief.author_name || "Plotific Press").trim();

  const prequelPrice = tiers.reader_magnet_prequel_price || "0.00";
  const b1Price = tiers.book_1_standard_price || "2.99";
  const b2Price = tiers.book_2_standard_price || "4.99";
  const b3Price = tiers.book_3_finale_standard_price || "4.99";
  const boxPrice = tiers.trilogy_box_set_bundle_price || "9.99";
  const printPrice = tiers.trade_paperback_print_price || "14.99";

  const books = [
    {
      id: "series-card-prequel",
      order: "Book 0 — Prequel Novella",
      title: `${seriesTitle}: Origin Spark`,
      price: prequelPrice,
      summary: "Free reader-magnet prequel establishing the inciting stakes.",
      ctaText: "Claim Free Prequel",
      href: "/books/prequel",
      variant: "secondary",
    },
    {
      id: "series-card-book-1",
      order: "Book 1 — Series Opener",
      title: `${seriesTitle}: First Collision`,
      price: b1Price,
      summary: "Act 1 launch installment tuned for high-velocity read-through.",
      ctaText: `Start Book 1 ($${b1Price})`,
      href: "/books/book-1",
      variant: "primary",
    },
    {
      id: "series-card-book-2",
      order: "Book 2 — Escalation",
      title: `${seriesTitle}: Pressure Point`,
      price: b2Price,
      summary: "Raises personal and empire stakes toward the series midpoint.",
      ctaText: `Continue Book 2 ($${b2Price})`,
      href: "/books/book-2",
      variant: "secondary",
    },
    {
      id: "series-card-book-3",
      order: "Book 3 — Reckoning Finale",
      title: `${seriesTitle}: Final Claim`,
      price: b3Price,
      summary: `Complete trilogy arc ($${boxPrice} digital box set / $${printPrice} print).`,
      ctaText: `Complete Series ($${boxPrice})`,
      href: "/books/box-set",
      variant: "secondary",
    },
  ];

  const preferredType = Array.isArray(cmsContentTypes) && cmsContentTypes.some((c) => c.slug === "book")
    ? "book"
    : "post";

  const layoutTree = {
    element: "Container",
    tag: "main",
    props: { id: "author-series-reading-grid" },
    styles: {
      base: {
        padding: "var(--grex-space-md)",
        "background-color": "#ffffff",
        color: "#0f172a",
      },
    },
    children: [
      {
        element: "Section",
        tag: "section",
        props: {
          id: "author-series-hero",
          "aria-label": `${seriesTitle} Reading Order`,
        },
        styles: {
          base: {
            padding: "var(--grex-space-md)",
            gap: "var(--grex-space-md)",
          },
        },
        children: [
          {
            element: "Heading",
            props: {
              id: "author-series-h1",
              level: 1,
              text: `${seriesTitle} — Complete Reading Order`,
            },
          },
          {
            element: "Text",
            tag: "p",
            props: {
              id: "author-series-intro",
              text: `Written by ${authorName} in ${validPlaybook.display_name}. Start at $${prequelPrice}, launch Book 1 at $${b1Price}, read sequels at $${b2Price}, or grab the complete box set at $${boxPrice} (print $${printPrice}).`,
            },
          },
        ],
      },
      {
        element: "Section",
        tag: "section",
        props: {
          id: "author-series-cards-section",
          "aria-label": "Series Installment Grid",
        },
        styles: {
          base: {
            padding: "var(--grex-space-md)",
            gap: "var(--grex-space-md)",
          },
        },
        children: [
          {
            element: "Heading",
            props: {
              id: "author-series-h2",
              level: 2,
              text: "Installments & Exact Edition Pricing",
            },
          },
          {
            element: "Grid",
            props: { id: "author-series-grid", columns: "2" },
            styles: { base: { gap: "var(--grex-space-md)" } },
            children: books.map((b) => ({
              element: "Card",
              tag: "article",
              props: { id: b.id, price: b.price },
              styles: {
                base: {
                  padding: "var(--grex-space-md)",
                  "background-color": "#ffffff",
                  color: "#0f172a",
                },
              },
              children: [
                {
                  element: "Heading",
                  props: { id: `${b.id}-h3`, level: 3, text: `${b.order}: ${b.title}` },
                },
                {
                  element: "Text",
                  tag: "p",
                  props: { id: `${b.id}-desc`, text: b.summary },
                },
                {
                  element: "Text",
                  tag: "p",
                  props: { id: `${b.id}-price`, text: `Direct Price: $${b.price} USD` },
                },
                {
                  element: "Link",
                  props: {
                    id: `${b.id}-cta`,
                    href: b.href,
                    text: b.ctaText,
                    variant: b.variant,
                  },
                },
              ],
            })),
          },
          {
            element: "ForEach",
            props: {
              id: "author-series-cms-loop",
              query: {
                content_type: preferredType,
                per_page: "6",
                sort_by: "published_at",
                sort_dir: "desc",
              },
            },
            children: [
              {
                element: "Text",
                tag: "p",
                props: { id: "author-series-loop-item", text: "{title}" },
              },
            ],
          },
        ],
      },
    ],
  };

  const fallbackDs = `
## 1. Active \`--grex-*\` Design Tokens
### Base \`:root\` Tokens
| Token | Value |
|---|---|
| \`--grex-bg\` | \`#ffffff\` |
| \`--grex-ink\` | \`#0f172a\` |
| \`--grex-space-md\` | \`24px\` |
`;
  const effectiveDs = designSystem && String(designSystem).includes("--grex-") ? designSystem : fallbackDs;
  const craft = auditDesignCraft(layoutTree, { designSystem: effectiveDs, cmsContentTypes });
  validateSubtreeStrict(craft.repaired_subtree, effectiveDs);

  return {
    layout: craft.repaired_subtree,
    design_craft: craft,
  };
}

function toGrexAuditNode(node, palette = "light") {
  const el = String(node.element || node.type || "Section");
  const props = { ...(node.props || {}) };
  const attrs = {};
  if (props.id) { attrs.id = props.id; delete props.id; }
  if (props.class) { attrs.class = props.class; delete props.class; }
  if (props["aria-label"]) { attrs["aria-label"] = props["aria-label"]; delete props["aria-label"]; }
  if (el === "Section" && !props.label) props.label = attrs["aria-label"] || "Author Studio";
  const out = {
    type: el,
    tag: node.tag,
    props,
    attrs,
    styles: {
      color: palette === "dark" ? "#f8fafc" : "#0f172a",
      "background-color": palette === "dark" ? "#0f172a" : "#ffffff",
    },
  };
  if (Array.isArray(node.children) && node.children.length > 0) {
    out.children = node.children.map((ch) => toGrexAuditNode(ch, palette));
  }
  return out;
}

/** Audits the Author Studio UI panel using Grex JS validateElementNode + Light/Dark auditAccessibility (Condition C4). */
export function auditAuthorStudioUi(palette = "light") {
  const studioTree = {
    element: "Section",
    tag: "section",
    props: { id: "author-studio-panel", label: "Author Mode Multi-Genre Brain & Hemingway Auditor" },
    children: [
      { element: "Heading", tag: "h2", props: { level: 2, text: "Author Mode & Multi-Genre Storytelling Brain" }, children: [] },
      {
        element: "Form",
        tag: "form",
        props: {},
        children: [
          {
            element: "Select",
            tag: "select",
            props: {
              label: "Genre Playbook",
              options: REQUIRED_GENRE_SLUGS.map((slug) => ({ value: slug, label: slug })),
            },
            children: [],
          },
          {
            element: "Select",
            tag: "select",
            props: {
              label: "Artifact Type",
              options: [
                { value: "chapter_outline", label: "Chapter Outline" },
                { value: "chapter_draft", label: "Chapter Draft" },
                { value: "back_cover_blurb", label: "Back-Cover Blurb" },
                { value: "series_reading_grid", label: "Series Reading-Order Grid" },
              ],
            },
            children: [],
          },
          { element: "Input", tag: "input", props: { label: "Book or Series Title", type: "text", required: true }, children: [] },
          { element: "Input", tag: "input", props: { label: "Exact Price (USD ADR-025c)", type: "text", required: true }, children: [] },
          { element: "Input", tag: "textarea", props: { label: "Story Brief or Manuscript Excerpt", type: "textarea", required: true }, children: [] },
          { element: "Button", tag: "button", props: { type: "submit", text: "Stage Author Proposal" }, children: [] },
        ],
      },
      {
        element: "Modal",
        tag: "dialog",
        props: { open: true, title: "Confirm Draft-Only Author Dispatch" },
        children: [
          { element: "Heading", tag: "h3", props: { level: 3, text: "Confirm Draft-Only Author Dispatch" }, children: [] },
          { element: "Text", tag: "p", props: { text: "Stages strictly as a GrabLab CMS draft or 1-click undoable Grex Builder slot." }, children: [] },
          { element: "Button", tag: "button", props: { type: "button", text: "Approve & Save Draft" }, children: [] },
          { element: "Button", tag: "button", props: { type: "button", text: "Cancel" }, children: [] },
        ],
      },
    ],
  };
  const tree = toGrexAuditNode(studioTree, palette);
  validateElementNode(tree);
  const accessibility = auditAccessibility(tree);
  return { valid: true, palette, accessibility };
}

function appendEl(doc, parent, tag, attrs = {}, text = "") {
  const el = doc.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) el.setAttribute(k, String(v));
  }
  if (text) setSafeText(el, text);
  parent.appendChild(el);
  return el;
}

/** Pure Grex JS v1.0.0 Author Studio panel for /groxy (zero <div>, zero innerHTML, Escape/focus-restoring dialog). */
export function mountAuthorStudio({
  root,
  document: doc = globalThis.document,
  csrfToken = "",
  fetchFn = globalThis.fetch,
} = {}) {
  if (!root || !doc) throw new TypeError("Author Studio requires a root and document.");

  const section = appendEl(doc, root, "section", {
    id: "author-studio-panel",
    class: "groxy-card groxy-author-studio",
    "aria-labelledby": "author-studio-title",
  });
  appendEl(doc, section, "h2", { id: "author-studio-title" }, "Author Mode: Multi-Genre Storytelling Brain & Hemingway Auditor (v1.7.0)");
  appendEl(
    doc,
    section,
    "p",
    { class: "groxy-muted" },
    "Generate genre-calibrated outlines, chapter drafts, back-cover blurbs, and pure-Grex series grids with exact ADR-025c pricing, Hemingway clarity checks, and XSS-safe schema.org/Book JSON-LD. Saved strictly as GrabLab drafts or 1-click undoable Builder slots."
  );

  const form = appendEl(doc, section, "form", { id: "author-studio-form" });

  const genreField = appendEl(doc, form, "p", { class: "groxy-field" });
  appendEl(doc, genreField, "label", { for: "author-genre-select" }, "Genre Playbook");
  const genreSelect = appendEl(doc, genreField, "select", { id: "author-genre-select", name: "genre_slug" });
  for (const [slug, lbl] of [
    ["urban-fiction", "Urban Fiction"],
    ["thriller", "Thriller / Mystery"],
    ["romance", "Romance"],
    ["sci-fi-fantasy", "Sci-Fi / Fantasy"],
    ["self-help-reentry", "Self-Help / Re-Entry"],
    ["true-crime", "True Crime"],
  ]) {
    appendEl(doc, genreSelect, "option", { value: slug }, lbl);
  }

  const artifactField = appendEl(doc, form, "p", { class: "groxy-field" });
  appendEl(doc, artifactField, "label", { for: "author-artifact-select" }, "Artifact Type");
  const artifactSelect = appendEl(doc, artifactField, "select", { id: "author-artifact-select", name: "artifact_type" });
  for (const [val, lbl] of [
    ["chapter_outline", "Chapter Outline (with Cliffhanger Hooks)"],
    ["chapter_draft", "Chapter Draft (POV + Sensory Grounded)"],
    ["back_cover_blurb", "Back-Cover Conversion Blurb"],
    ["series_reading_grid", "Series Reading-Order Grid (Grex JS Layout)"],
  ]) {
    appendEl(doc, artifactSelect, "option", { value: val }, lbl);
  }

  const modeField = appendEl(doc, form, "p", { class: "groxy-field" });
  appendEl(doc, modeField, "label", { for: "author-mode-select" }, "Generation Mode");
  const modeSelect = appendEl(doc, modeField, "select", { id: "author-mode-select", name: "generation_mode" });
  for (const [val, lbl] of [
    ["deterministic", "Deterministic Playbook Engine (Zero Fee)"],
    ["ollama", "Local Ollama (127.0.0.1:11434)"],
    ["byok", "Allowlisted HTTPS BYOK"],
  ]) {
    appendEl(doc, modeSelect, "option", { value: val }, lbl);
  }

  const titleField = appendEl(doc, form, "p", { class: "groxy-field" });
  appendEl(doc, titleField, "label", { for: "author-title-input" }, "Book or Series Title");
  const titleInput = appendEl(doc, titleField, "input", {
    id: "author-title-input",
    name: "title",
    type: "text",
    value: "Crown of Concrete",
    required: "required",
    maxlength: "140",
  });

  const priceField = appendEl(doc, form, "p", { class: "groxy-field" });
  appendEl(doc, priceField, "label", { for: "author-price-input" }, "Exact Price (USD ADR-025c)");
  const priceInput = appendEl(doc, priceField, "input", {
    id: "author-price-input",
    name: "price",
    type: "text",
    value: "4.99",
    required: "required",
    maxlength: "16",
  });

  const pagesField = appendEl(doc, form, "p", { class: "groxy-field" });
  appendEl(doc, pagesField, "label", { for: "author-pages-input" }, "Page Count (Exact Integer)");
  const pagesInput = appendEl(doc, pagesField, "input", {
    id: "author-pages-input",
    name: "numberOfPages",
    type: "text",
    value: "280",
    required: "required",
    maxlength: "8",
  });

  const slotField = appendEl(doc, form, "p", { class: "groxy-field" });
  appendEl(doc, slotField, "label", { for: "author-slot-input" }, "Target Slot (CMS Draft or Builder Slot)");
  const slotInput = appendEl(doc, slotField, "input", {
    id: "author-slot-input",
    name: "target_slot",
    type: "text",
    value: "home",
    maxlength: "64",
  });

  const briefField = appendEl(doc, form, "p", { class: "groxy-field" });
  appendEl(doc, briefField, "label", { for: "author-brief-input" }, "Story Brief or Manuscript Excerpt");
  const briefInput = appendEl(doc, briefField, "textarea", {
    id: "author-brief-input",
    name: "brief_text",
    rows: "4",
    maxlength: "5000",
    required: "required",
  });
  briefInput.value =
    "A fiercely loyal accountant uncovers a ledger betrayal inside an Atlanta logistics empire while protecting her younger brother.";

  const actions = appendEl(doc, form, "p", { class: "groxy-actions" });
  const generateBtn = appendEl(doc, actions, "button", { id: "author-generate-btn", type: "submit", class: "groxy-btn" }, "Stage Author Proposal");
  const readabilityBtn = appendEl(doc, actions, "button", { id: "author-readability-btn", type: "button", class: "groxy-btn groxy-btn-secondary" }, "Run Hemingway Readability Audit");
  const reviewApplyBtn = appendEl(doc, actions, "button", { id: "author-review-apply-btn", type: "button", class: "groxy-btn", disabled: "disabled" }, "Review & Save Draft");
  const discardBtn = appendEl(doc, actions, "button", { id: "author-discard-btn", type: "button", class: "groxy-btn groxy-btn-secondary", disabled: "disabled" }, "Discard Proposal");

  const statusOut = appendEl(doc, section, "p", { id: "author-status", role: "status", "aria-live": "polite", class: "groxy-muted" }, "Ready to generate genre-calibrated author drafts or audit prose clarity.");
  const errorOut = appendEl(doc, section, "p", { id: "author-error", role: "alert", class: "groxy-alert-danger" }, "");

  const previewDetails = appendEl(doc, section, "details", { id: "author-preview-details" });
  appendEl(doc, previewDetails, "summary", {}, "Hemingway Clarity Report, Staged Artifact & schema.org/Book JSON-LD");
  const metricsSummary = appendEl(doc, previewDetails, "p", { id: "author-metrics-summary", class: "groxy-muted" }, "No readability audit or staged author artifact yet.");
  const artifactPre = appendEl(doc, previewDetails, "pre", { id: "author-artifact-pre", "aria-label": "Author artifact preview" }, "");
  const jsonLdPre = appendEl(doc, previewDetails, "pre", { id: "author-jsonld-pre", "aria-label": "Escaped schema.org/Book JSON-LD preview" }, "");

  const confirmDialog = appendEl(doc, section, "dialog", {
    id: "author-confirm-dialog",
    class: "groxy-commerce-dialog",
    "aria-labelledby": "author-dialog-title",
  });
  appendEl(doc, confirmDialog, "h3", { id: "author-dialog-title" }, "Confirm Draft-Only Author Dispatch");
  const dialogSummary = appendEl(doc, confirmDialog, "p", { id: "author-dialog-summary" }, "");
  const dialogActions = appendEl(doc, confirmDialog, "p", { class: "groxy-actions" });
  const confirmApplyBtn = appendEl(doc, dialogActions, "button", { id: "author-confirm-apply-btn", type: "button", class: "groxy-btn" }, "Approve & Save Draft");
  const cancelDialogBtn = appendEl(doc, dialogActions, "button", { id: "author-cancel-dialog-btn", type: "button", class: "groxy-btn groxy-btn-secondary" }, "Cancel");

  let staged = null;
  let lastReadability = null;
  let lastOpener = null;

  const setDialogOpen = (open) => {
    if (open) {
      confirmDialog.setAttribute("open", "open");
      if (typeof confirmDialog.showModal === "function") {
        try { confirmDialog.showModal(); } catch { /* fallback open attr */ }
      }
      confirmApplyBtn.focus?.();
    } else {
      confirmDialog.removeAttribute("open");
      if (typeof confirmDialog.close === "function") {
        try { confirmDialog.close(); } catch { /* ignore */ }
      }
      if (lastOpener && typeof lastOpener.focus === "function") {
        lastOpener.focus();
      }
    }
  };

  const renderState = () => {
    if (!staged) {
      reviewApplyBtn.setAttribute("disabled", "disabled");
      reviewApplyBtn.disabled = true;
      discardBtn.setAttribute("disabled", "disabled");
      discardBtn.disabled = true;
      if (!lastReadability) {
        setSafeText(artifactPre, "");
        setSafeText(jsonLdPre, "");
      }
      return;
    }
    reviewApplyBtn.removeAttribute("disabled");
    reviewApplyBtn.disabled = false;
    discardBtn.removeAttribute("disabled");
    discardBtn.disabled = false;
    const hem = staged.hemingway_audit || {};
    const m = hem.metrics || {};
    setSafeText(
      metricsSummary,
      `Hemingway Clarity: Grade ${hem.grade || "A"} (${hem.score ?? 95}/100) | Reading Level: ${m.grade_level || "6.50"} | Passive: ${m.passive_voice_percent || "0.00"}% | Adverbs: ${m.adverb_density_percent || "0.00"}% | Dialogue: ${m.dialogue_ratio_percent || "50.00"}%`
    );
    setSafeText(artifactPre, JSON.stringify(staged.artifact, null, 2));
    setSafeText(jsonLdPre, staged.schema_org_json_ld?.script_tag_preview || "");
    setSafeText(
      dialogSummary,
      `Dispatch ${staged.artifact_type} (${staged.genre_slug}, plan ${staged.author_plan_id}) strictly as a draft (never auto-published).`
    );
  };

  const runReadabilityAudit = async () => {
    setSafeText(errorOut, "");
    const prose = String(briefInput.value || "").trim();
    const genreSlug = String(genreSelect.value || "urban-fiction");
    if (!prose) {
      setSafeText(errorOut, "Enter story prose or a manuscript excerpt to audit.");
      return null;
    }
    if (typeof fetchFn !== "function") {
      const localRep = auditReadabilityHemingway(prose);
      lastReadability = localRep;
      setSafeText(
        metricsSummary,
        `Hemingway Clarity: Grade ${localRep.grade} (${localRep.score}/100) | Reading Level: ${localRep.metrics.grade_level} | Passive: ${localRep.metrics.passive_voice_percent}% | Adverbs: ${localRep.metrics.adverb_density_percent}%`
      );
      setSafeText(artifactPre, JSON.stringify(localRep, null, 2));
      return localRep;
    }
    readabilityBtn.disabled = true;
    try {
      const resp = await fetchFn("/api/groxy/author/readability-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ prose, genre_slug: genreSlug }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setSafeText(errorOut, data.error || "Readability audit failed.");
        return null;
      }
      lastReadability = data;
      setSafeText(
        metricsSummary,
        `Hemingway Clarity: Grade ${data.grade} (${data.score}/100) | Reading Level: ${data.metrics?.grade_level} | Passive: ${data.metrics?.passive_voice_percent}% | Adverbs: ${data.metrics?.adverb_density_percent}%`
      );
      setSafeText(artifactPre, JSON.stringify(data, null, 2));
      setSafeText(statusOut, `Hemingway Readability Audit complete: Grade ${data.grade} (${data.score}/100).`);
      return data;
    } catch (err) {
      setSafeText(errorOut, err?.message || "Readability audit request failed.");
      return null;
    } finally {
      readabilityBtn.disabled = false;
    }
  };

  const generateProposal = async () => {
    setSafeText(errorOut, "");
    const title = String(titleInput.value || "").trim();
    const price = String(priceInput.value || "").trim();
    const numberOfPages = String(pagesInput.value || "").trim();
    const premise = String(briefInput.value || "").trim();
    if (!title || !premise) {
      setSafeText(errorOut, "Title and story brief are required.");
      return null;
    }
    if (typeof fetchFn !== "function") {
      setSafeText(statusOut, "Offline UI preview ready (server fetch unavailable).");
      return null;
    }
    generateBtn.disabled = true;
    try {
      const resp = await fetchFn("/api/groxy/author/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({
          genre_slug: String(genreSelect.value || "urban-fiction"),
          artifact_type: String(artifactSelect.value || "chapter_outline"),
          generation_mode: String(modeSelect.value || "deterministic"),
          target_slot: String(slotInput.value || "home").trim() || "home",
          brief: { title, premise },
          book_meta: { title, price, numberOfPages },
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setSafeText(errorOut, data.error || "Author proposal generation failed.");
        return null;
      }
      staged = data;
      setSafeText(statusOut, `Staged ${data.artifact_type} (${data.author_plan_id}). Review Hemingway report & JSON-LD before saving draft.`);
      renderState();
      return data;
    } catch (err) {
      setSafeText(errorOut, err?.message || "Author proposal request failed.");
      return null;
    } finally {
      generateBtn.disabled = false;
    }
  };

  const applyStaged = async () => {
    if (!staged || typeof fetchFn !== "function") return null;
    setSafeText(errorOut, "");
    confirmApplyBtn.disabled = true;
    try {
      const resp = await fetchFn("/api/groxy/author/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({
          author_plan_id: staged.author_plan_id,
          genre_slug: staged.genre_slug,
          artifact_type: staged.artifact_type,
          target_slot: staged.target_slot,
          payload_sha256: staged.payload_sha256,
          approval_token: staged.approval_token,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setSafeText(errorOut, data.error || "Author apply failed.");
        return null;
      }
      setSafeText(
        statusOut,
        `Saved ${staged.artifact_type} (${data.status_enforced || "draft"}) safely with human-in-the-loop isolation.`
      );
      staged = null;
      renderState();
      setDialogOpen(false);
      return data;
    } catch (err) {
      setSafeText(errorOut, err?.message || "Author apply request failed.");
      return null;
    } finally {
      confirmApplyBtn.disabled = false;
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void generateProposal();
  });
  readabilityBtn.addEventListener("click", () => {
    void runReadabilityAudit();
  });
  reviewApplyBtn.addEventListener("click", () => {
    if (!staged) return;
    lastOpener = reviewApplyBtn;
    setDialogOpen(true);
  });
  reviewApplyBtn.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (staged) {
        lastOpener = reviewApplyBtn;
        setDialogOpen(true);
      }
    }
  });
  confirmApplyBtn.addEventListener("click", () => {
    void applyStaged();
  });
  cancelDialogBtn.addEventListener("click", () => {
    setDialogOpen(false);
  });
  confirmDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault?.();
      setDialogOpen(false);
    }
  });
  discardBtn.addEventListener("click", () => {
    staged = null;
    renderState();
    setSafeText(statusOut, "Discarded staged author proposal.");
    setSafeText(errorOut, "");
  });

  return {
    section,
    generateProposal,
    runReadabilityAudit,
    applyStaged,
    getStaged: () => staged,
    getReadability: () => lastReadability,
    openConfirmDialog: () => {
      if (staged) {
        lastOpener = reviewApplyBtn;
        setDialogOpen(true);
      }
    },
    closeConfirmDialog: () => setDialogOpen(false),
    dispose: () => section.parentNode?.removeChild(section),
  };
}
