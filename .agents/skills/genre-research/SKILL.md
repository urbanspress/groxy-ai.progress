---
name: genre-research
description: Reusable Plotific Press genre playbook research and validation template for authoring groxy-genre-playbook-v1.0 JSON files with ADR-025c exact base-10 numeric fidelity and zero-XSS schema.org/Book defaults.
---

# Genre Research Skill (`groxy-genre-playbook-v1.0`)

Use this reusable workflow when researching and authoring a new genre playbook under `playbook/genres/<genre_slug>.v1.json` for **Groxy AI v1.7.0+**.

## 1. Required File & Schema Contract
- Save playbooks strictly under `playbook/genres/<genre_slug>.v1.json` where `genre_slug` matches `^[a-z0-9-]+$`.
- Set `"schema_version": "groxy-genre-playbook-v1.0"`.
- Include all 9 required top-level keys:
  1. `schema_version`
  2. `genre_slug`
  3. `display_name`
  4. `target_audience`
  5. `pacing_and_structure`
  6. `trope_checklist`
  7. `character_archetypes`
  8. `voice_and_dialogue_rules`
  9. `publishing_and_pricing_tiers`
  10. `schema_org_book_defaults`

## 2. Demographic, Motivation & Conversion Research
Under `target_audience`, document:
- `primary_demographics`: `age_range`, `core_age_bracket`, `gender_skew`, `reading_frequency`, `preferred_formats`.
- `reading_motivations` and `emotional_payoffs` tailored to real reader expectations.
- `cover_and_blurb_conversion_hooks`:
  - `cover_design_rules`: Thumbnail legibility at `120px`, typography, and visual trope shorthand.
  - `blurb_structure_rules`: 4-paragraph conversion arc (Tagline Hook, Protagonist Stakes, Counterpart/Conflict Collision, Ultimatum Closer + series CTA).

## 3. Act Structure, Pacing & Cliffhanger Cadence
Under `pacing_and_structure`, define:
- `novel_word_count_targets` & `chapter_word_count_targets` (all values as exact base-10 `GrabInteger` wire strings, e.g., `"2200"`, `"3500"`).
- `act_structure`: `act_1_the_inciting_hustle`, `act_2_escalation_and_pressure_cooker`, `act_3_retribution_and_reckoning` with `percentage_range` and `structural_beats`.
- `cliffhanger_cadence`: `micro_tension_interval_words`, `chapter_ending_cliffhanger_rate_percent`, `mandatory_chapter_exit_hooks`, and `series_arc_cliffhanger_strategy`.

## 4. Tropes, Anti-Patterns & Character Archetypes
- `trope_checklist.core_tropes_readers_expect`: Each entry has `trope_id`, `name`, `execution_rule`.
- `trope_checklist.cliches_and_anti_patterns_to_avoid`: Each entry has `anti_pattern_id`, `name`, `prevention_rule`.
- `character_archetypes`: `protagonist_models`, `antagonist_models`, and `foil_and_ensemble_dynamics` (including `spin_off_seeding_rule`).

## 5. Voice, Dialogue & Hemingway Clarity Calibration
Under `voice_and_dialogue_rules`:
- `pov_conventions`: `preferred_pov`, `secondary_pov_option`, `head_hopping_rule`.
- `dialogue_cadence`: `dialogue_to_narration_ratio_percent` (e.g., `"55.00 to 65.00"`) and `rhythm_and_vernacular_rules`.
- `sensory_grounding`: `required_sensory_layers_per_scene` (exact integer wire string) and `signature_urban_textures`.
- `hemingway_clarity_checks` (all numeric thresholds MUST be exact base-10 wire strings):
  - `target_reading_grade_level` (e.g., `"6.50"`)
  - `max_reading_grade_level` (e.g., `"8.00"`)
  - `average_sentence_length_words` (e.g., `"14"`)
  - `hard_sentence_length_ceiling_words` (e.g., `"28"`)
  - `passive_voice_max_percent` (e.g., `"4.00"`)
  - `adverb_density_max_percent` (e.g., `"1.50"`)
  - `clarity_directives`

## 6. `ADR-025c` Pricing Tiers & Zero-XSS `schema.org/Book` Defaults
- **Never use raw JSON numbers/floats** in monetary, royalty, word-count, or Hemingway threshold fields (HTTP `422` fail-closed).
- `publishing_and_pricing_tiers.pricing_tiers_usd` MUST use exact base-10 `GrabDecimal` strings and include the five canonical storefront tiers (`"0.00"`, `"2.99"`, `"4.99"`, `"9.99"`, `"14.99"`).
- `schema_org_book_defaults` MUST use plain `https://schema.org/...` strings (never Markdown links `[url](url)`):
  - `"@context": "https://schema.org"`
  - `"@type": "Book"`
  - `"bookFormat": "https://schema.org/EBook"` (or `Paperback` / `Hardcover`)
  - `"offers_defaults.availability": "https://schema.org/InStock"`
  - `"offers_defaults.price"` as an exact base-10 `GrabDecimal` string.
- Reject any `<script`, `</script`, `<iframe`, `<object`, `<style`, `<div`, `on*=`, `javascript:`, `vbscript:`, `file:`, or `data:` payloads.
