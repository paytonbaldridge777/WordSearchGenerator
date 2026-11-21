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
