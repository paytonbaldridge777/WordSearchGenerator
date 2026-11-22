# Divine Joy — WEB Classic correction worklog (2026-11-21)

## Repository changes completed on this branch
- Corrected the English copyright notices in all three `Publishing/assemble_book*.py` files to: "Scripture quotations are taken from the World English Bible Classic (WEB), which is in the public domain."
- Removed "Spanish translation by the authors." from the English notices only.
- Normalized the English "Printed in the United States of America." line.
- Preserved Spanish-language copyright notices as written.
- No changes to `main`, Bible JSON files, puzzle content, or published PDFs.

## Existing separate editorial proof
The 125-page `Divine_Joy_corrected_scripture_PROOF_v2.pdf` is held outside GitHub. This is not KDP-ready. It patches 7 substantive passage issues and removes 8 improper Psalm headings. It does not reconcile previously selected puzzle words or solution-key highlights.

## Known obsolete selections requiring puzzle/solution review
| Verse puzzle | Existing selected words no longer in corrected passage |
| --- | --- |
| 5 | IMMOVABLE |
| 10 | CHIEF, FLUTES, MUSICIAN |
| 29 | SOLOMON, SONG |
| 41 | LIE |
| 49 | SEEN, UNTO |
| 50 | UNTO |

These findings use the prior correction manifest and must be confirmed against the exact intended edition and passage before words are replaced. Do not silently delete selections from a puzzle.

## Pending release gates
1. Verify every English quotation against a single authoritative WEB Classic source, including 23 earlier wording variants and all 50 Verse puzzles.
2. Confirm the source `Bibles/web.json` license and provenance; do not bulk-overwrite without checking references, book naming, verse boundaries and regression effects across other projects.
3. Replace obsolete selection words and regenerate the associated puzzle/solution pairs; preserve valid original grids where possible.
4. Audit the answer-key highlight vectors for all 100 puzzles; prior reports of extra highlighted paths require rechecking against the latest 125-page source.
5. Reassemble the 125-page interior, verify fonts/page geometry/text flow, and visually inspect all pages.
6. Update the full generator source and add regression tests so fixes persist.

**Status:** editorial work in progress; no final KDP interior approved.

## Layout regression discovered 2026-11-21
- The temporary PDF Scripture patch used a white redaction region starting at PDF y=442 while puzzle grid borders end at y≈445.72; this concealed the bottom horizontal rule and last ≈4 points of the side borders on 15 corrected puzzle pages (including Verse 5).
- An intermediate proof v3 repairs precisely these 15 borders without altering puzzle letters. Rendered Verse 5 was visually checked, and the horizontal border was detected on all 50 Verse puzzle pages.
- **Permanent fix required:** preserve original grid drawing objects; text editing/redaction must never overlap puzzle geometry. Add automated image-based regression for all 100 puzzle/answer-key pages, margins, heading, footer, and text overflow. The v3 proof remains NON-KDP-READY.

## Approved typography and layout policy (2026-11-21)
User approved **layout adjustments before any font-size reduction**. Treat the baseline Scripture font (~16.88 pt in the latest original Divine Joy PDF) as the target:
1. Maintain original 12×12 grid placement, full four-sided border, headers, page numbers, solution references, margins and readable underlines.
2. Fit verified WEB Classic text by optimizing verse text wrapping, inter-paragraph spacing and usable whitespace *only within the safe text zone*; do not overwrite or cover grid geometry.
3. If those adjustments cannot fit a longer WEB Classic passage, decrease Scripture font only as a last resort, by the smallest amount possible; maintain comfortable legibility and consistent line spacing. Verse 5 is a legitimate candidate.
4. Record effective Scripture font size and justification per revised page; visually inspect any reduced-size page. Do not alter puzzle dimensions to make text fit.
5. Run the border and geometry regression suite on **every Verse page**, then check Reflection pages and answer keys separately. Geometry passes do not certify Scripture accuracy, selections, print readiness or all visual issues.

### Baseline comparison for intermediate v3 proof
Automated PDF visual/geometry check: 50/50 Verse puzzle pages passed for left/right/bottom border detection, grid bounding box equivalence, page dimensions, and passage position/overflow limits. **15 Verse pages showed a reduced font size** relative to the original 16.88-pt body font: Verse 2 (16), 5 (15.5), 8 (14.5), 10 (16), 12 (16), 14 (16), 16 (16), 22 (16), 24 (16), 26 (16), 29 (16), 41 (14.5), 46 (15), 49 (16), 50 (16). Reassess each reduction in the next layout-first rebuild.

This is a narrow geometry validation, **not a full layout or KDP validation**.

## Selection compatibility audit (continued 2026-11-21)
- Checked original bold selections from the manifest against the corrected verse *body*, ignoring Scripture citation words (a first pass falsely flagged CHRONICLES in the reference, corrected in the follow-up).
- **10 unique words in six puzzles** are no longer in the quoted passage: Verse 5 IMMOVABLE; Verse 10 CHIEF/FLUTES/MUSICIAN; Verse 29 SOLOMON/SONG; Verse 41 LIE; Verse 49 SEEN/UNTO; Verse 50 UNTO.
- Searched those passage words in the original 12×12 printed letter grids, in eight directions. Only Verse 49 has an immediately reusable different word found in the grid, COME (one path); this does not certify that its highlighting is correct. Most replacements will require regenerating the affected puzzle/solution grid.
- **No edits to grid letters or answer-key shading were made**. Source Scripture and the 23 older-edition variants remain to be completely verified before final publication.
- Locally generated reproducible review CSV files and selection/replacement scripts are outside GitHub until independently checked and integrated.

## Six-puzzle reconstruction proof (continued)
- Created independent 12-page editorial PDF proof: Verse puzzles 5, 10, 29, 41, 49, 50 with six corresponding solution pages (12×12 grids).
- Replacements under review: 5 IMM​OVABLE→JUDGE; 10 CHIEF→TRUST, MUSICIAN→BED, FLUTES→STILL; 29 SOLOMON→SINGING, SONG→DREAM; 41 LIE→SPRINGS; 49 SEEN→SEE, UNTO→PROPHETS; 50 UNTO→GENTLENESS.
- New proof generated at 8.5×11 inches with Scripture typography at 16 pt using an *independent preview layout*. Regenerated solution strokes map to the new grid coordinates. Automated validation reported zero errors in word coordinate tracing, grid dimensions, and basic text boundary checks.
- **Not a final interior:** currently generated proof uses a standalone preview layout, not the published pagination, and its passage text still requires comparison to the WEB Classic source. No changes were made to the old 125-page PDF, source JSON or production puzzle-grid data.
- Artifacts generated in chat environment: `Divine_Joy_six_regenerated_puzzles_PROOF.pdf`, `Divine_Joy_six_puzzle_validation.json`, `rebuild_divine_joy_six.py`, `validate_six_rebuild.py`, and `Divine_Joy_six_rebuild_QA.md`.

## Independent source-level recheck (continued)
- Verified six affected Scripture selections against publisher's WEB Classic chapters for 1 Chronicles 16:29-35, Psalm 4:4-8, Psalm 126:1-6, Isaiah 35:6-10, 1 Peter 1:8-11, Philippians 4:4-7.
- Found and corrected two errors in the temporary **six-puzzle preview** source: Psalm 4:8 must read "for you alone, Yahweh, make me live in safety" (not "for you, Yahweh alone"); Psalm 126:4 needs the space after "Yahweh,". Corrected two spacing artifacts in Psalm 4:6-7 ("Yahweh, let", "You have").
- Regenerated proof as `Divine_Joy_six_regenerated_puzzles_PROOF_v2.pdf`. A standalone JSON export `Divine_Joy_six_rebuilt_source_v2.json` and validator `validate_divine_joy_six_source.py` were created in the ChatGPT working session; these files are not yet committed to GitHub. Preserve them for integration.
- Rechecked all **89 selections** across six new 12×12 grids (previous worklog incorrectly implied 84); every selected word matches the corrected verse body, its saved coordinates produce the exact letters, each placement has a straight eight-way path, and all obsolete words are excluded. Validator reported zero **source placement** failures.
- All 12 proof pages are 612×792 points, and all six puzzle pages retain a 12×12 border. The isolated preview still differs from the published interior, so do **not** insert the proof pages into the 125-page KDP interior without matched page templates and 6-per-page answer-key pagination.
- Pending: rigorous authoritative punctuation/verse coverage comparison for every Verse page, all answer-key highlight audits, integration into generator and current original book style, and full visual/KDP preflight. No new final interior, Bible JSON modifications, or main-branch changes claimed.

## 125-page integrated editorial proof (continued)
- Built `Divine_Joy_125page_integrated_six_puzzles_EDITORIAL_PROOF.pdf` (125 pages; 612×792 pt) from the most recent v3 full-book layout proof and six-puzzle proof v2.
- Replaced the body content on Verse 5/10/29/41/49/50 puzzle pages while keeping the existing printed page numbering and answer-key references.
- Redrew only the corresponding six **left-hand** Verse answer-key tiles, preserving the right-hand Reflection tiles and six-solutions-per-page organization.
- Corrected initial Verse 5 answer-key double-border artifact and visually inspected regenerated Verse 5, Verse 29, Verse 41, and compact key layout.
- Verse 41's long Isaiah passage required a 15 pt font reflow to fit within the original text footprint; puzzle geometry preserved.
- Caution: This editorial proof uses visual white covering plus overlaid content. **Hidden older PDF text can still be extracted**; it is not suitable for final release. A future source-native rebuild must eliminate all obsolete underlying text. Numeric text-layer checks may report old hidden content as footer overflow.
- Source-selected words total 89 across all six regenerated puzzles; new solutions are based on those source coordinates. **Do not claim full page or KDP validation.**
- Remaining release work: authoritative WEB Classic re-audit and rights wording in actual generated PDF, remove old hidden text layers with native-page generation, inspect all selected-word underlines and solution highlights, verify all 100 page layouts, and commit source changes in a reproducible pipeline.

## Source-native six-puzzle pages: first full interior trial (2026-11-21)
- Generated a **new 125-page editorial PDF** with six affected puzzle pages (PDF pages 14, 24, 62, 86, 102, 104) rendered directly as fresh PDF vector/text content by ReportLab, then inserted via PyMuPDF. These six pages are no longer white-cover overlays and contain no old puzzle-page text layer. The remaining 119 pages were copied from the **v3 proof**, not native rebuilt.
- File created outside repository: `Divine_Joy_125page_NATIVE_six_puzzle_pages_EDITORIAL.pdf`; reproducible script: `build_native_divine_joy_six.py`; structured QA: `Divine_Joy_native_six_page_report.json`. Source: `Divine_Joy_six_rebuilt_source_v2.json`.
- Native page passage fonts selected with a layout-first fit within fixed text bounds: Verse 5 15.25 pt, Verse 10 16 pt, Verse 29 16 pt, Verse 41 14.5 pt, Verse 49 16 pt, Verse 50 16 pt. Original puzzle reference and print footer preserved.
- Important regression caught and corrected **before release of this proof**: initial generated solution-page citations incorrectly assumed linear grouping. The corrected script reads the exact `Solution on page` reference from each original page: Verse 5→104, 10→106, 29→112, 41→116, 49→119, 50→119.
- Rendered and inspected native Verse 5 and Verse 41. Both show a complete grid border and text clear of footer. Baseline audit confirms each new page has text, 12×12 grid, and matching 8.5×11 media box. This is a narrow validation only.
- **Not KDP ready:** The six compact answer-key tiles are still inherited from the previous editorial overlay proof and may retain obsolete hidden text; 119 other pages are not source-native, and all 50 Scripture passages remain subject to complete edition consistency checks and wider visual review. Before release, source-native rebuild the compact answer-key pages or remove hidden text with certified redaction, then perform all 100 puzzles and key checks.

## Native compact answer-key reconstruction (next pass)
- Rebuilt all six affected left-column compact answer-key tiles on five book pages (PDF pages 108, 110, 116, 120, 123) using *actual PDF redaction* of each affected tile before new source-coordinate highlights, letters, and border were drawn. This removes prior text and vector highlights from the replaced tiles, unlike white overlay patches.
- Output produced in the ChatGPT workspace: `Divine_Joy_125page_NATIVE_six_puzzles_and_keys_EDITORIAL.pdf`. Rebuild script: `rebuild_divine_joy_six_answer_tiles.py`. QA JSON: `Divine_Joy_native_six_keys_QA.json`.
- Rebuilt tiles: Verse 5 (page 108 middle-left); Verse 10 (110 top-left); Verse 29 (116 middle-left); Verse 41 (120 middle-left); Verse 49 (123 top-left); Verse 50 (123 middle-left).
- Validated title appears exactly once in each replaced tile, each replacement has 144 letter glyphs, exact passage solution coordinates were used for highlights; 125-page size retained. Visual inspections included pages 108 and 123 and unchanged neighboring Reflection tiles. Raster comparison of five before/after key pages found only 10–29 changed pixels outside target tile masks (antialiasing at boundary edges), and 20k–44k pixels inside the target regions.
- This is **still an editorial proof**, not KDP-ready: other historical answer-key highlights, remaining source-old hidden text outside the six key tiles, all 50 WEB Classic verse checks and generator integration remain open. The six puzzle pages are natively rebuilt; the five whole answer-key pages still contain untouched older tiles.

## Answer-key highlight cleanup trial — 2026-11-22
- Reopened current 125-page editorial proof and November 14, 2026 spacing-normalized audit; extracted geometric paths from all 21 historically flagged solution tiles.
- Of the 35 formerly flagged paths, 31 remain in the current PDF before edits. Four are already absent, on Verse 10 (DONT), Verse 41 (JOY), and Verse 49 (EVEN, COME), whose tiles were previously rebuilt.
- Generated a **cautious editorial correction** of 18 answer-key tiles on 13 pages using the existing tile letter grids and decoded bar coordinates, omitting the 31 historical extras from the drawing list. All 100 puzzle-to-key letter grids continue to match exactly.
- Follow-up vector scan detects **27/35 historical flags absent and eight residual flags still present**: Reflection 23 SELF; Reflection 25 KEEPS; Reflection 28 FEET; Verse 33 JOY; Reflection 36 SELF; Verse 38 JOY; Verse 42 EARTH; Verse 46 WELL. Some older strokes survive the limited redaction setting. These MUST be resolved; 18 tiles are not certified clean.
- A more aggressive PDF redaction setting removed all 35 flagged words but also erased/damaged artwork outside the target tiles (pixel diff 269,251 changed pixels outside masks across the 13 edited key pages). **Rejected this aggressive output**; it must not be used as a basis for subsequent builds.
- Retained editorial-only output: `Divine_Joy_125page_highlight_corrected_EDITORIAL.pdf`. Reproducible helper scripts: `divine_joy_highlight_path_review.py` and `rebuild_divine_joy_extra_highlights.py`. Detailed reports: `Divine_Joy_highlight_path_review_2026-11-22.json`, `Divine_Joy_highlight_path_postfix_2026-11-22.json`, `Divine_Joy_highlight_corrections_QA_2026-11-22.json`.
- This exercise validates a critical architectural need: avoid editing existing dense vector PDF tile contents; reconstruct each answer-key **whole page from source** with all six tiles and independently verify selections/positions. The original/current WEB Classic textual proof and generator still require full end-to-end validation.

## Revised editorial priorities (2026-11-22)
User approved tolerating **one incidental extra highlighted word per puzzle**, provided all intended words remain correctly marked and the grid and text are accurate. Do not spend additional time deleting benign single-word extras at the expense of Scripture correctness or layout. Recheck any key with multiple intrusive highlights and all missing intended highlights.

### Scripture text extraction review (2026-11-22)
- Examined every one of 50 Verse-page text layers in the latest `Divine_Joy_125page_highlight_corrected_EDITORIAL.pdf`, using an independent non-destructive spacing screen.
- 86 candidate joins were found across **28 Verse pages**. Examples from extracted Scripture: Verse 3 `Yahweh.Call`; Verse 16 `Yahweh,my` and `Youhave`; Verse 24 `Youwho`; Verse 28 `Yahweh!Yahweh` and `Yahweh.Yahwehis`. Detection is **not a verified count of print defects**: PDF extraction may merge spans, and false positives are possible.
- Generated `Divine_Joy_Scripture_Spacing_Audit_2026-11-22.csv`, `.json`, and the reproducible `audit_divine_joy_scripture_spacing.py` in the conversation workspace. These have not yet been committed or incorporated into the generator.
- This makes Scripture text normalization and final publisher matching the highest-priority outstanding work. Do not patch dozens of pages with white rectangles; instead rebuild Scripture passages natively after preserving their selected words and layouts.
- **No new KDP-ready PDF is claimed by this review.** Use the cautious editorial proof rather than the aggressive-redaction version, which was rejected due to unintended artwork damage.

## Canonical source inventory extracted (2026-11-22)
Following user instruction to stop repeated piecemeal PDF patching, froze `Divine_Joy_125page_highlight_corrected_EDITORIAL.pdf` as **reference input**. Its SHA-256 is `fe678b84098a11507fddbd559c09af8cfe1504212de96653a453d4dbe471699f`.
- Produced `Divine_Joy_CANONICAL_SOURCE_INVENTORY_2026-11-22.json` and reproducible `build_divine_joy_canonical_inventory.py` in the conversation workspace (NOT committed to GitHub).
- Deterministically extracted 100/100 original 12×12 puzzle grids (14,400 letters total), 100 displayed passages/reflections and 100 solution-page footer references from the frozen 125-page editorial PDF.
- Cross-checked the six already regenerated grids against `Divine_Joy_six_rebuilt_source_v2.json`; **6/6 grid matches**, with saved selected words and solution-coordinate paths attached to those six source records.
- This is a **staging inventory only**, not authoritative Scripture. The remaining 94 puzzle selected word lists and placement paths are not recovered in this inventory.
- Confirmed official publisher WEB Classic 2020 stable edition is `https://ebible.org/bible/details.php?id=eng-web`. The official `eng-web_usfm.zip` could not be retrieved inside the current container due network restrictions. Therefore **0/50 passages have undergone a new complete word-for-word publisher comparison in this pass**. This is a clear release blocker, not a pass.
- Do not regenerate all grids or modify the book from this partial source yet. The next coherent production work is to obtain/verify publisher USFM, recover 94 saved selected-word/path sets, and then perform **one source-native full build + one final acceptance audit**.
