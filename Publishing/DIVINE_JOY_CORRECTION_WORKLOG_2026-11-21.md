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
