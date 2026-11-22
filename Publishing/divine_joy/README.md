# Divine Joy English interior

Build the 125-page, 8.5 × 11 inch, no-bleed paperback from the editable
`book.json`. Grid coordinates are zero-based `[row, column]`. Each puzzle
record contains the passage or reflection, selected words, grid, answer paths,
and printed solution reference. The rendered PDF uses the shared assembler's
front matter, Answer Key divider, and closing page templates.

The validated build used Python with ReportLab 4.4.9, pypdf 6.21.4,
PyMuPDF 1.26.6, and Liberation Sans TrueType fonts. Install the fonts and
Python packages before running the commands from the repository root.

```sh
python Publishing/divine_joy/build.py Publishing/divine_joy/book.json Divine_Joy_English_Interior.pdf
```

The build requires only the checked-in source and its dependencies. To repeat
the source recovery, supply the original `book_interior_divineJoy(1).pdf` and
the November 22 canonical inventory. The latter carries the six recovered
proof grids. The original PDF supplies selections, reflections, and key-path
evidence. Neither PDF pages nor proof content streams enter the build.

The authoritative Scripture inputs are the
[World English Bible Classic](https://ebible.org/bible/details.php?id=eng-web)
publisher's `eng-web_vpl.zip` and `eng-web_usfm.zip` exports. The input digests
in `book.json` identify the exact files used. When repeating the audit, use
those exact archive versions. The audit checks the numbered text against both
exports and treats Psalm superscriptions as separate headings, as marked in
USFM.

```sh
python Publishing/divine_joy/recover.py \
  'book_interior_divineJoy(1).pdf' Divine_Joy_CANONICAL_SOURCE_INVENTORY_2026-11-22.json \
  eng-web_vpl.zip eng-web_usfm.zip Publishing/divine_joy/book.json

python Publishing/divine_joy/audit.py \
  Divine_Joy_English_Interior.pdf Publishing/divine_joy/book.json \
  eng-web_vpl.zip eng-web_usfm.zip 'book_interior_divineJoy(1).pdf' \
  Divine_Joy_Updated_Interior_Audit_2026-11-14.md validation.json
```

The validator returns a nonzero exit status for any failed check. The
previous audit provides an independent count of original selections on each
puzzle page. `validation.json` records the acceptance checks and delivered
PDF digest. KDP calculates 126 production pages from this 125-page PDF.
