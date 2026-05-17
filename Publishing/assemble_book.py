#!/usr/bin/env python3
"""
Bible Word Search Book Assembler
=================================
Assembles a print-ready KDP interior PDF from individual puzzle and solution PDFs.

Usage:
    python3 assemble_book.py --folder /path/to/your/pdfs --output book_interior.pdf

Optional flags:
    --solutions-per-page 6   (default 6)
    --title "Your Book Title"
    --author "Your Name"
    --skip-front-matter      (skip to puzzles only, useful for testing)

Folder structure expected (all in one flat folder):
    Hope_NOT_fear_-_Verse_1_Puzzle (1).pdf
    Hope_NOT_fear_-_Verse_1_Solution (1).pdf
    Hope_NOT_fear_-_Reflection_1_Puzzle (5).pdf
    Hope_NOT_fear_-_Reflection_1_Solution (5).pdf
    ... up to Verse_50 and Reflection_50
"""

import argparse
import io
import re
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


PAGE_W, PAGE_H = 612.0, 792.0   # 8.5 x 11 in points

# ---------------------------------------------------------------------------
# Register and embed TrueType fonts so KDP receives a fully embedded PDF
# Auto-detects Windows or Linux and finds fonts accordingly
# ---------------------------------------------------------------------------
import platform
import os as _os

def _find_fonts():
    """Find Liberation Sans or Arial fonts depending on OS."""
    system = platform.system()

    if system == "Windows":
        # Windows: use Arial which is always present (metric-compatible with Helvetica)
        win_fonts = _os.path.join(_os.environ.get("WINDIR", "C:/Windows"), "Fonts")
        candidates = [
            # Liberation Sans (if installed)
            {
                "normal":     _os.path.join(win_fonts, "LiberationSans-Regular.ttf"),
                "bold":       _os.path.join(win_fonts, "LiberationSans-Bold.ttf"),
                "italic":     _os.path.join(win_fonts, "LiberationSans-Italic.ttf"),
                "bolditalic": _os.path.join(win_fonts, "LiberationSans-BoldItalic.ttf"),
            },
            # Arial -- always on Windows
            {
                "normal":     _os.path.join(win_fonts, "arial.ttf"),
                "bold":       _os.path.join(win_fonts, "arialbd.ttf"),
                "italic":     _os.path.join(win_fonts, "ariali.ttf"),
                "bolditalic": _os.path.join(win_fonts, "arialbi.ttf"),
            },
        ]
    else:
        # Linux/Mac
        candidates = [
            {
                "normal":     "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                "bold":       "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
                "italic":     "/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf",
                "bolditalic": "/usr/share/fonts/truetype/liberation/LiberationSans-BoldItalic.ttf",
            },
            {
                "normal":     "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
                "bold":       "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
                "italic":     "/usr/share/fonts/truetype/freefont/FreeSansOblique.ttf",
                "bolditalic": "/usr/share/fonts/truetype/freefont/FreeSansBoldOblique.ttf",
            },
        ]

    for candidate in candidates:
        if all(_os.path.exists(p) for p in candidate.values()):
            return candidate

    raise FileNotFoundError(
        "Could not find suitable TrueType fonts for embedding. "
        "Please install Liberation Sans (https://github.com/liberationfonts/liberation-fonts) "
        "or ensure Arial is present in your Windows Fonts folder."
    )

_fonts = _find_fonts()
pdfmetrics.registerFont(TTFont("MySans",            _fonts["normal"]))
pdfmetrics.registerFont(TTFont("MySans-Bold",       _fonts["bold"]))
pdfmetrics.registerFont(TTFont("MySans-Italic",     _fonts["italic"]))
pdfmetrics.registerFont(TTFont("MySans-BoldItalic", _fonts["bolditalic"]))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily("MySans",
    normal="MySans",
    bold="MySans-Bold",
    italic="MySans-Italic",
    boldItalic="MySans-BoldItalic")

# Font name aliases
F_NORMAL      = "MySans"
F_BOLD        = "MySans-Bold"
F_ITALIC      = "MySans-Italic"
F_BOLD_ITALIC = "MySans-BoldItalic"


# ---------------------------------------------------------------------------
# Decorative drawing helpers (greyscale -- safe for B&W print)
# ---------------------------------------------------------------------------

def draw_cross(c, x, y, size=18, gray=0.72):
    bar_w = size * 0.18
    c.setFillGray(gray)
    c.rect(x - bar_w/2, y - size*0.5, bar_w, size, stroke=0, fill=1)
    c.rect(x - size*0.38, y + size*0.1, size*0.76, bar_w, stroke=0, fill=1)

def draw_ichthys(c, cx, cy, width=60, height=28, gray=0.65):
    """Ichthys: closed lens body, tail on RIGHT (fish faces left)."""
    c.setStrokeGray(gray)
    c.setLineWidth(4.0)
    w = width / 2.0
    h = height / 2.0
    right_x = cx + w * 0.45   # right crossing point (where tail intersects)
    left_x  = cx - w           # left tip (head)

    # Single closed path -- mirrored so tail is on right, head points left
    p = c.beginPath()
    p.moveTo(right_x, cy)
    p.curveTo(cx + w*0.1, cy + h*0.6,  cx - w*0.6, cy + h*0.6,  left_x, cy)
    p.curveTo(cx - w*0.6, cy - h*0.6,  cx + w*0.1, cy - h*0.6,  right_x, cy)
    p.close()
    c.drawPath(p, stroke=1, fill=0)

    # Tail: V through the right crossing point
    tail_x = right_x + w * 0.25
    p = c.beginPath()
    p.moveTo(tail_x, cy + h * 0.6)
    p.lineTo(right_x, cy)
    p.lineTo(tail_x, cy - h * 0.6)
    c.drawPath(p, stroke=1, fill=0)


def draw_olive_branch(c, cx, cy, size=30, gray=0.60):
    c.setStrokeGray(gray)
    c.setFillGray(gray)
    c.setLineWidth(1.2)
    s = size / 30.0
    c.line(cx, cy, cx+28*s, cy+14*s)
    for lx, ly, angle in [
        (cx+5*s,  cy+3*s,  -30),
        (cx+10*s, cy+6*s,   40),
        (cx+15*s, cy+8*s,  -35),
        (cx+20*s, cy+11*s,  38),
        (cx+25*s, cy+13*s, -30),
    ]:
        c.saveState()
        c.translate(lx, ly)
        c.rotate(angle)
        c.ellipse(-5*s, -2.5*s, 5*s, 2.5*s, stroke=0, fill=1)
        c.restoreState()


def draw_decorative_rule(c, x, y, width, gray=0.55, thickness=0.8):
    c.setStrokeGray(gray)
    c.setFillGray(gray)
    c.setLineWidth(thickness)
    c.line(x+10, y, x+width-10, y)
    for dx in [x+5, x+width-5]:
        c.saveState()
        c.translate(dx, y)
        c.rotate(45)
        c.rect(-3, -3, 6, 6, stroke=0, fill=1)
        c.restoreState()


def draw_corner_ornament(c, x, y, size=28, gray=0.70, flip_x=False, flip_y=False):
    c.setStrokeGray(gray)
    c.setFillGray(gray)
    c.setLineWidth(1.0)
    sx = -1 if flip_x else 1
    sy = -1 if flip_y else 1
    c.line(x, y, x+sx*size, y)
    c.line(x, y, x, y+sy*size)
    sq = 4
    c.rect(x-sq/2, y-sq/2, sq, sq, stroke=0, fill=1)
    for t in [0.45, 0.78]:
        draw_cross(c, x+sx*size*t, y, size=5, gray=gray)
        draw_cross(c, x, y+sy*size*t, size=5, gray=gray)


def draw_page_corners(c, margin=38, size=28, gray=0.70):
    draw_corner_ornament(c, margin,        PAGE_H-margin, size, gray, False, False)
    draw_corner_ornament(c, PAGE_W-margin, PAGE_H-margin, size, gray, True,  False)
    draw_corner_ornament(c, margin,        margin,        size, gray, False, True)
    draw_corner_ornament(c, PAGE_W-margin, margin,        size, gray, True,  True)


# ---------------------------------------------------------------------------
# Text wrapping helper
# ---------------------------------------------------------------------------

def draw_wrapped_text(c, text, x, y, max_w, font, size, gray, line_h, align="left"):
    """Wraps and draws text. Returns y after last line."""
    c.setFont(font, size)
    c.setFillGray(gray)
    words = text.split()
    lines, line = [], []
    for word in words:
        test = " ".join(line + [word])
        if c.stringWidth(test, font, size) <= max_w:
            line.append(word)
        else:
            if line:
                lines.append(" ".join(line))
            line = [word]
    if line:
        lines.append(" ".join(line))
    for ln in lines:
        if align == "center":
            c.drawCentredString(PAGE_W/2, y, ln)
        elif align == "right":
            c.drawRightString(x + max_w, y, ln)
        else:
            c.drawString(x, y, ln)
        y -= line_h
    return y


# ---------------------------------------------------------------------------
# Filename parsing
# ---------------------------------------------------------------------------

def parse_filename(filename):
    name = Path(filename).stem
    name = re.sub(r'\s*\(\d+\)\s*$', '', name).strip()
    m = re.match(r'.*?[-_]\s*(Verse|Reflection)[_\s]+(\d+)[_\s]+(Puzzle|Solution)',
                 name, re.IGNORECASE)
    if not m:
        return None
    return m.group(1).capitalize(), int(m.group(2)), m.group(3).capitalize()


def collect_files(folder):
    puzzles, solutions = {}, {}
    for f in Path(folder).iterdir():
        if f.suffix.lower() != '.pdf':
            continue
        parsed = parse_filename(f.name)
        if not parsed:
            print(f"  [skip] Unrecognised: {f.name}")
            continue
        ptype, number, role = parsed
        (puzzles if role == 'Puzzle' else solutions)[(ptype, number)] = f
    return puzzles, solutions


def ordered_puzzle_keys(puzzles):
    max_num = max((n for (_, n) in puzzles), default=0)
    return [k for i in range(1, max_num+1)
            for k in [('Verse', i), ('Reflection', i)] if k in puzzles]

def format_scripture_ref(ref):
    """
    Converts 'Psalms 13:1,2,3,4,5' to 'Psalms 13:1-5'
    Leaves anything that doesn't match the pattern unchanged.
    """
    import re
    m = re.match(r'^(.*?:\s*)(\d+(?:,\d+)+)$', ref.strip())
    if not m:
        return ref
    prefix = m.group(1)
    numbers = [int(n) for n in m.group(2).split(',')]
    return f"{prefix}{numbers[0]}-{numbers[-1]}"

# ---------------------------------------------------------------------------
# Solution reference overlay -- reduced font to avoid crowding page number
# ---------------------------------------------------------------------------

def extract_puzzle_metrics(puzzle_path):
    """
    Extracts from a puzzle PDF:
      - scripture reference text (bottommost line)
      - src_ref_top_from_bottom, src_ref_bot_from_bottom: position of ref line
      - src_content_top_from_bottom: position of topmost content (title)
    """
    import pdfplumber
    with pdfplumber.open(str(puzzle_path)) as pdf:
        page = pdf.pages[0]
        words = page.extract_words()
        if not words:
            return "", 0, 0, 0
        # Scripture ref = bottommost line
        max_top = max(w['top'] for w in words)
        bottom_words = [w for w in words if abs(w['top'] - max_top) < 2]
        bottom_words.sort(key=lambda w: w['x0'])
        raw_text = " ".join(w['text'] for w in bottom_words)
        text = format_scripture_ref(raw_text)
        src_ref_top = PAGE_H - max_top
        src_ref_bot = PAGE_H - max(w['bottom'] for w in bottom_words)
        # Topmost content
        min_top = min(w['top'] for w in words)
        src_content_top = PAGE_H - min_top
        return text, src_ref_top, src_ref_bot, src_content_top


def add_solution_reference(puzzle_path, solution_page_number, output_buffer):
    """
    Scales puzzle page to 95% with a vertical shift to guarantee bottom
    clearance, extracts and re-renders the scripture reference line using
    embedded fonts (replacing the invisible original), then overlays the
    solution page reference and page number.
    """
    # Scale and shift calculated to satisfy BOTH margins simultaneously:
    # - Title always at exactly 36pts from top (consistent across all pages)
    # - Worst-case bottom content (11.8pts from bottom) clears 62pts from bottom
    # Formula: scale = (PAGE_H - BOTTOM_CLEAR - TOP_MARGIN) / (PAGE_H - 40 - 11.8)
    SCALE        = 0.9376
    TY_FIXED     = 62.0 - SCALE * 11.8   # = 50.9pts -- same for every page
    BOTTOM_CLEAR = 62.0

    SOL_FONT      = "MySans-Italic"
    SOL_FONT_SIZE = 13
    REF_FONT      = "MySans-Italic"
    REF_FONT_SIZE = 18    # matches original Helvetica-Oblique 18pt
    MARGIN_L      = 72    # left margin for scripture ref
    MARGIN_R      = 72    # right margin for solution ref
    Y_BOTTOM      = 22    # baseline for both bottom text elements

    # Extract scripture reference, its position, and topmost content position
    scripture_ref, src_ref_top, src_ref_bot, src_content_top = extract_puzzle_metrics(puzzle_path)

    # Build blank white base page
    base_buf = io.BytesIO()
    bc = rl_canvas.Canvas(base_buf, pagesize=(PAGE_W, PAGE_H))
    bc.setFillColorRGB(1, 1, 1)
    bc.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    bc.showPage()
    bc.save()
    base_buf.seek(0)
    base_page = PdfReader(base_buf).pages[0]

    # Fixed ty -- same for every page, anchors title to consistent top position
    ty = TY_FIXED

    # Scale and shift puzzle page: center horizontally, fixed vertical shift
    x_offset = (PAGE_W - PAGE_W * SCALE) / 2
    puzzle_reader = PdfReader(str(puzzle_path))
    base_page.merge_transformed_page(
        puzzle_reader.pages[0],
        (SCALE, 0, 0, SCALE, x_offset, ty)
    )

    # Overlay: white rectangle to cover the original (now-shifted) scripture
    # ref area, then re-draw it with embedded font + draw solution ref
    ov = io.BytesIO()
    c = rl_canvas.Canvas(ov, pagesize=(PAGE_W, PAGE_H))

    # Calculate exactly where the original scripture ref lands after transform
    # and white it out precisely -- avoids clipping body text above or missing it below
    dest_ref_bottom = SCALE * src_ref_bot + ty - 2   # 2pt padding below
    dest_ref_top    = SCALE * src_ref_top + ty + 4   # 4pt padding above
    c.setFillColorRGB(1, 1, 1)
    c.rect(0, dest_ref_bottom, PAGE_W, dest_ref_top - dest_ref_bottom, stroke=0, fill=1)
    # Also white out below the ref down to page edge (covers page number area too, redrawn below)
    c.rect(0, 0, PAGE_W, dest_ref_bottom + 1, stroke=0, fill=1)

    Y_REF     = 40   # scripture ref + solution ref baseline (above KDP 36pt margin)
    Y_PAGENUM = 58   # page number baseline -- safely above ref line

    # Re-render scripture reference with embedded font (left-aligned)
    if scripture_ref:
        c.setFont(REF_FONT, REF_FONT_SIZE)
        c.setFillGray(0.0)
        c.drawString(MARGIN_L, Y_REF, scripture_ref)

    # Solution page reference right-aligned, same line as scripture ref
    c.setFont(SOL_FONT, SOL_FONT_SIZE)
    c.setFillGray(0.0)
    sol_text = f"(Solution on page {solution_page_number})"
    tw = c.stringWidth(sol_text, SOL_FONT, SOL_FONT_SIZE)
    c.drawString(PAGE_W - MARGIN_R - tw, Y_REF, sol_text)

    c.save()
    ov.seek(0)
    base_page.merge_page(PdfReader(ov).pages[0])

    w = PdfWriter()
    w.add_page(base_page)
    w.write(output_buffer)


# ---------------------------------------------------------------------------
# Page number overlay -- -N- centered at bottom, applied to numbered pages
# ---------------------------------------------------------------------------

def add_page_number(page, display_number):
    """Overlays -N- centered at bottom of page. Returns the modified page."""
    FONT      = "MySans"
    FONT_SIZE = 14
    Y_BOTTOM  = 58

    ov = io.BytesIO()
    c = rl_canvas.Canvas(ov, pagesize=(PAGE_W, PAGE_H))
    c.setFont(FONT, FONT_SIZE)
    c.setFillGray(0.2)
    c.drawCentredString(PAGE_W / 2, Y_BOTTOM, f"-{display_number}-")
    c.save()
    ov.seek(0)

    page.merge_page(PdfReader(ov).pages[0])
    return page


# ---------------------------------------------------------------------------
# Solutions tiling -- 6 per page, label below, no borders
# ---------------------------------------------------------------------------

def assemble_solutions(solution_files_ordered, per_page=6):
    MARGIN   = 28.0
    LABEL_H  = 18.0
    GAP      = 8.0
    FONT_SZ  = 11
    FONT     = "MySans-Bold"

    cols = 2
    rows = per_page // cols
    usable_w = PAGE_W - 2*MARGIN
    usable_h = PAGE_H - 2*MARGIN
    cell_w   = usable_w / cols
    cell_h   = (usable_h - GAP*(rows-1)) / rows

    CONTENT_TOP    = 40.0
    CONTENT_BOTTOM = 469.0
    CONTENT_H = CONTENT_BOTTOM - CONTENT_TOP
    CONTENT_W = PAGE_W

    img_area_h = cell_h - LABEL_H - 4
    scale    = min(cell_w / CONTENT_W, img_area_h / CONTENT_H)
    scaled_w = CONTENT_W * scale
    scaled_h = CONTENT_H * scale

    writer = PdfWriter()
    chunks = [solution_files_ordered[i:i+per_page]
              for i in range(0, len(solution_files_ordered), per_page)]

    for chunk in chunks:
        bb = io.BytesIO()
        bc = rl_canvas.Canvas(bb, pagesize=(PAGE_W, PAGE_H))
        bc.setFillColorRGB(1, 1, 1)
        bc.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
        bc.showPage()
        bc.save()
        bb.seek(0)
        sheet_page = PdfReader(bb).pages[0]

        lb = io.BytesIO()
        lc = rl_canvas.Canvas(lb, pagesize=(PAGE_W, PAGE_H))
        lc.setFont(FONT, FONT_SZ)
        lc.setFillGray(0.2)

        for idx, (sol_path, label) in enumerate(chunk):
            col = idx % cols
            row = idx // cols

            cell_x   = MARGIN + col * cell_w
            cell_top = PAGE_H - MARGIN - row*(cell_h + GAP)

            img_top    = cell_top
            img_bottom = img_top - scaled_h
            x_offset   = cell_x + (cell_w - scaled_w) / 2

            ty = img_top - scale*(PAGE_H - CONTENT_TOP)

            sheet_page.merge_transformed_page(
                PdfReader(str(sol_path)).pages[0],
                (scale, 0, 0, scale, x_offset, ty)
            )

            label_y = img_bottom - LABEL_H + 1
            lc.drawCentredString(cell_x + cell_w/2, label_y, label)

        lc.save()
        lb.seek(0)
        sheet_page.merge_page(PdfReader(lb).pages[0])
        writer.add_page(sheet_page)

    return writer


# ---------------------------------------------------------------------------
# Front matter -- 5 pages so Verse lands on left (even) page
# ---------------------------------------------------------------------------

def build_front_matter(title, theme, author, total_puzzles):
    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(PAGE_W, PAGE_H))

    MW = 440
    MX = (PAGE_W - MW) / 2

    # ---- PAGE 1: TITLE ------------------------------------------------
    draw_ichthys(c, PAGE_W/2, PAGE_H-110, width=60, height=28, gray=0.64)
    draw_decorative_rule(c, 80, PAGE_H-148, PAGE_W-160, gray=0.55)

    c.setFont("MySans", 13)
    c.setFillGray(0.45)
    c.drawCentredString(PAGE_W/2, PAGE_H-172,
                        "A  B I B L E  W O R D  S E A R C H  D E V O T I O N A L")

    if title and title.strip():
        c.setFont("MySans-Bold", 36)
        c.setFillGray(0.10)
        c.drawCentredString(PAGE_W/2, PAGE_H-224, title)
    else:
        c.setFont("MySans", 16)
        c.setFillGray(0.50)
        c.drawCentredString(PAGE_W/2, PAGE_H-224, "[Book Title Goes Here]")
        c.setFont("MySans", 11)
        c.setFillGray(0.62)
        c.drawCentredString(PAGE_W/2, PAGE_H-246,
                            "Pass --title \"Your Title\" when running the script")

    c.setFont("MySans-Italic", 18)
    c.setFillGray(0.30)
    c.drawCentredString(PAGE_W/2, PAGE_H-278, theme)

    c.setFont("MySans", 14)
    c.setFillGray(0.45)
    c.drawCentredString(PAGE_W/2, PAGE_H-304,
                        "100 Puzzles of Faith, Hope, & Scripture")

    # Central cross in oval
    draw_cross(c, PAGE_W/2, PAGE_H/2+10, size=44, gray=0.76)
    c.setStrokeGray(0.70)
    c.setLineWidth(0.7)
    c.ellipse(PAGE_W/2-48, PAGE_H/2-42, PAGE_W/2+48, PAGE_H/2+60, stroke=1, fill=0)

    draw_decorative_rule(c, 80, 178, PAGE_W-160, gray=0.55)
    c.setFont("MySans", 16)
    c.setFillGray(0.12)
    c.drawCentredString(PAGE_W/2, 154, f"by  {author}")

    c.showPage()

    # ---- PAGE 2: COPYRIGHT --------------------------------------------
    draw_cross(c, PAGE_W/2, PAGE_H-100, size=20, gray=0.68)
    draw_decorative_rule(c, 100, PAGE_H-118, PAGE_W-200, gray=0.62)

    c.setFont("MySans-Bold", 16)
    c.setFillGray(0.12)
    c.drawCentredString(PAGE_W/2, PAGE_H-142, "Copyright")

    y = PAGE_H - 168
    y = draw_wrapped_text(c,
        f"Copyright \u00a9 2026 by {author}. All rights reserved.",
        MX, y, MW, "MySans-Bold", 12, 0.14, 16, "center")
    y -= 12
    y = draw_wrapped_text(c,
        "No part of this publication may be reproduced, distributed, or transmitted "
        "in any form or by any means, including photocopying, recording, or other "
        "electronic or mechanical methods, without the prior written permission of "
        "the publisher, except in the case of brief quotations embodied in reviews "
        "and certain other noncommercial uses permitted by copyright law.",
        MX, y, MW, "MySans", 11, 0.25, 15)
    y -= 12
    y = draw_wrapped_text(c,
        "Scripture quotations are taken from the World English Bible (WEB), "
        "which is in the public domain.",
        MX, y, MW, "MySans", 11, 0.25, 15)
    y -= 12
    y = draw_wrapped_text(c, "Printed in the United States of America.",
        MX, y, MW, "MySans", 11, 0.30, 15, "center")
    y = draw_wrapped_text(c, "First Edition, 2026",
        MX, y-4, MW, "MySans", 11, 0.30, 15, "center")

    draw_decorative_rule(c, 100, 112, PAGE_W-200, gray=0.62)
    draw_cross(c, PAGE_W/2, 76, size=20, gray=0.68)
    c.showPage()

    # ---- PAGE 3: DEDICATION -------------------------------------------
    draw_decorative_rule(c, 100, PAGE_H-80, PAGE_W-200, gray=0.58)

    c.setFont("MySans-Bold", 18)
    c.setFillGray(0.12)
    c.drawCentredString(PAGE_W/2, PAGE_H-110, "Dedication")
    draw_decorative_rule(c, 170, PAGE_H-124, PAGE_W-340, gray=0.68)

    c.setFont("MySans-Italic", 13)
    c.setFillGray(0.48)
    dedication_lines = [
        "This book is dedicated to the memory of my mother, Elizabeth,",
        "whose gentle hands turned the pages of countless word search books",
        "and whose faithful heart never stopped seeking.",
        "",
        "In her later years, words became harder to hold onto,",
        "but her love for Scripture, and the God who authored it, never wavered.",
        "",
        "She deserved books worthy of her faith.",
        "This one is for her, and for every soul like hers.",
        "",
        "Gone from our sight in 2023, but never from our hearts.",
        "",
        "\u201cI am the resurrection and the life.",
        "Whoever believes in me, though he die, yet shall he live.\u201d",
        "-- John 11:25",
    ]

    y_ded = PAGE_H - 155
    for line in dedication_lines:
        if line == "":
            y_ded -= 10
        else:
            c.drawCentredString(PAGE_W/2, y_ded, line)
            y_ded -= 18

    draw_cross(c, PAGE_W/2, 112, size=22, gray=0.70)
    c.showPage()

    # ---- PAGE 4: HOW TO USE -------------------------------------------
    draw_decorative_rule(c, 72, PAGE_H-78, PAGE_W-144, gray=0.58)
    c.setFont("MySans-Bold", 20)
    c.setFillGray(0.12)
    c.drawCentredString(PAGE_W/2, PAGE_H-106, "How to Use This Book")
    draw_decorative_rule(c, 72, PAGE_H-120, PAGE_W-144, gray=0.58)

    def block(heading, body, y_start):
        c.setFont("MySans-Bold", 13)
        c.setFillGray(0.12)
        c.drawString(MX, y_start, heading)
        y2 = draw_wrapped_text(c, body, MX, y_start-16, MW,
                               "MySans", 12, 0.24, 15)
        return y2 - 8

    y = PAGE_H - 148

    y = block("Welcome",
        "This devotional draws you deeper into Scripture through focused, "
        "meditative puzzle-solving. Each numbered pair of puzzles is built "
        "from the same Bible passage, approached from two angles.", y)
    draw_cross(c, PAGE_W/2, y-1, size=9, gray=0.70); y -= 18

    y = block("Verse Puzzles",
        "Words are drawn directly from a specific Bible verse. As you search, "
        "let each word anchor you to the passage. The full verse is printed "
        "below the grid, with hidden words highlighted.", y)
    draw_cross(c, PAGE_W/2, y-1, size=9, gray=0.70); y -= 18

    y = block("Reflection Puzzles",
        "Words are drawn from a devotional reflection on the same verse. "
        "These puzzles invite you to think more deeply about how the Scripture "
        "speaks to your life today.", y)
    draw_cross(c, PAGE_W/2, y-1, size=9, gray=0.70); y -= 18

    y = block("Finding Words",
        "Words may be hidden horizontally, vertically, or diagonally, and "
        "may run forwards or backwards. Circle or highlight each word as you "
        "find it.", y)
    draw_cross(c, PAGE_W/2, y-1, size=9, gray=0.70); y -= 18

    y = block("Solutions",
        "The solution page number is printed in the bottom-right corner of "
        "each puzzle page. All solutions are gathered at the back of the book.", y)
    draw_cross(c, PAGE_W/2, y-1, size=9, gray=0.70); y -= 18

    y = block("A Word of Encouragement",
        "There is no rush. Take your time with each puzzle. Pray over the "
        "verse. Let the words sink in. This is not just a game. It is an "
        "invitation to spend unhurried time in the Word.", y)

    draw_decorative_rule(c, 72, 90, PAGE_W-144, gray=0.60)
    draw_ichthys(c, PAGE_W/2, 58, width=60, height=28, gray=0.64)
    c.showPage()

    # ---- PAGE 5: SCRIPTURE QUOTE (keeps Verse on left/even page) ------
    draw_decorative_rule(c, 80, PAGE_H/2+110, PAGE_W-160, gray=0.55)
    draw_cross(c, PAGE_W/2, PAGE_H/2+66, size=36, gray=0.72)
    draw_decorative_rule(c, 120, PAGE_H/2+28, PAGE_W-240, gray=0.62)

    c.setFont("MySans-Italic", 17)
    c.setFillGray(0.22)
    c.drawCentredString(PAGE_W/2, PAGE_H/2,
                        "\u201cFor God has not given us a spirit of fear,")
    c.drawCentredString(PAGE_W/2, PAGE_H/2-26,
                        "but of power and of love")
    c.drawCentredString(PAGE_W/2, PAGE_H/2-52,
                        "and of a sound mind.\u201d")

    c.setFont("MySans", 14)
    c.setFillGray(0.40)
    c.drawCentredString(PAGE_W/2, PAGE_H/2-82, "2 Timothy 1:7")

    draw_decorative_rule(c, 120, PAGE_H/2-102, PAGE_W-240, gray=0.62)
    draw_decorative_rule(c, 80, PAGE_H/2-148, PAGE_W-160, gray=0.55)

    c.showPage()

    c.save()
    buf.seek(0)
    return buf


# ---------------------------------------------------------------------------
# Answer Key header page
# ---------------------------------------------------------------------------

def build_solutions_header():
    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(PAGE_W, PAGE_H))
    draw_decorative_rule(c, 80, PAGE_H/2+62, PAGE_W-160, gray=0.56)
    c.setFont("MySans-Bold", 36)
    c.setFillGray(0.12)
    c.drawCentredString(PAGE_W/2, PAGE_H/2+16, "Answer Key")
    c.setFont("MySans-Italic", 13)
    c.setFillGray(0.40)
    c.drawCentredString(PAGE_W/2, PAGE_H/2-14,
                        "Solutions appear in the same order as the puzzles.")
    draw_decorative_rule(c, 80, PAGE_H/2-32, PAGE_W-160, gray=0.56)
    draw_cross(c, PAGE_W/2-62, PAGE_H-450, size=14, gray=0.70)
    draw_cross(c, PAGE_W/2+62, PAGE_H-450, size=14, gray=0.70)
    c.showPage()
    c.save()
    buf.seek(0)
    return buf



# ---------------------------------------------------------------------------
# Closing pages: Note of Thanks + My Notes
# ---------------------------------------------------------------------------

def build_closing_pages(author):
    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(PAGE_W, PAGE_H))

    MW = 440
    MX = (PAGE_W - MW) / 2

    # ---- NOTE OF THANKS ------------------------------------------------
    draw_decorative_rule(c, 80, PAGE_H-78, PAGE_W-160, gray=0.55)
    c.setFont("MySans-Bold", 20)
    c.setFillGray(0.12)
    c.drawCentredString(PAGE_W/2, PAGE_H-106, "A Note of Thanks")
    draw_decorative_rule(c, 80, PAGE_H-120, PAGE_W-160, gray=0.55)

    thanks_lines = [
        ("Above all, we give thanks to God, the Author of every good word, the Giver of "
         "every good gift, and the One whose truth anchors us when everything else shifts. "
         "This book exists because He does."),
        ("We are grateful for our mother, Elizabeth, whose love for Scripture planted a seed "
         "in us that grew into these pages. We hope she would have loved this book. "
         "We believe she does."),
        ("To everyone who has read these puzzles, prayed over these verses, and lingered in "
         "the Word a little longer because of this devotional, thank you. You are exactly "
         "who we made this for."),
        ("If this book blessed you, we would be deeply grateful if you shared it with someone "
         "you love. A friend, a parent, a neighbor, anyone whose heart could use a little "
         "more hope and a little less fear."),
        ("If you have a moment, leaving a review on Amazon helps others find this book and "
         "means more to us than you know."),
        ("This is the first volume in what we hope will be a long series. We are already "
         "working on the next one. Stay anchored."),
    ]

    y = PAGE_H - 150
    for para in thanks_lines:
        c.setFont("MySans-Italic", 11)
        c.setFillGray(0.22)
        # Wrap each paragraph
        words = para.split()
        lines, line = [], []
        for word in words:
            test = " ".join(line + [word])
            if c.stringWidth(test, "MySans-Italic", 11) <= MW:
                line.append(word)
            else:
                lines.append(" ".join(line))
                line = [word]
        if line:
            lines.append(" ".join(line))
        for ln in lines:
            c.drawString(MX, y, ln)
            y -= 14
        y -= 8  # paragraph gap

    y -= 6
    c.setFont("MySans-Italic", 12)
    c.setFillGray(0.22)
    c.drawString(MX, y, "With gratitude and grace,")
    y -= 16
    c.setFont("MySans-BoldItalic", 12)
    c.drawString(MX, y, author)

    draw_decorative_rule(c, 80, 90, PAGE_W-160, gray=0.55)
    draw_ichthys(c, PAGE_W/2, 58, width=55, height=24, gray=0.64)

    c.showPage()

    # ---- MY NOTES ------------------------------------------------------
    draw_decorative_rule(c, 80, PAGE_H-78, PAGE_W-160, gray=0.55)
    c.setFont("MySans-Bold", 20)
    c.setFillGray(0.12)
    c.drawCentredString(PAGE_W/2, PAGE_H-106, "My Notes")
    draw_decorative_rule(c, 80, PAGE_H-120, PAGE_W-160, gray=0.55)

    # Lined area
    LINE_GRAY = 0.78
    LINE_START_Y = PAGE_H - 148
    LINE_END_Y = 72
    LINE_GAP = 26
    c.setStrokeGray(LINE_GRAY)
    c.setLineWidth(0.5)
    y = LINE_START_Y
    while y >= LINE_END_Y:
        c.line(MX, y, PAGE_W - MX, y)
        y -= LINE_GAP

    draw_decorative_rule(c, 80, 52, PAGE_W-160, gray=0.55)
    c.showPage()

    c.save()
    buf.seek(0)
    return buf


# ---------------------------------------------------------------------------
# Main assembler
# ---------------------------------------------------------------------------

def assemble_book(folder, output_path, solutions_per_page=6,
                  title="", theme="", author="Author Name", skip_front_matter=False):

    print(f"\n=== Bible Word Search Book Assembler ===")
    print(f"Scanning: {folder}")

    puzzles, solutions = collect_files(folder)
    print(f"Found {len(puzzles)} puzzle files, {len(solutions)} solution files.")

    ordered_keys = ordered_puzzle_keys(puzzles)
    if not ordered_keys:
        print("ERROR: No puzzles found. Check folder path and filenames.")
        sys.exit(1)

    print(f"Order ({len(ordered_keys)} puzzles):")
    for k in ordered_keys:
        print(f"  {k[0]} {k[1]}")

    front_pages      = 0 if skip_front_matter else 5
    puzzle_start     = front_pages + 1
    solutions_header = puzzle_start + len(ordered_keys)
    solutions_start  = solutions_header + 1

    # Page numbering starts at the scripture quote page (page 5 = display "1")
    # Front matter pages 1-4 get no numbers
    # Page 5 (scripture quote) = -1-, page 6 (Verse 1) = -2-, etc.
    numbered_from = 4   # interior page index (0-based) where numbering begins

    def physical_to_display(physical_page):
        """Convert 1-based physical page number to display page number."""
        return physical_page - numbered_from

    # Store DISPLAY page numbers so the printed reference matches what the reader sees
    puzzle_to_sol = {
        key: physical_to_display(solutions_start + (idx // solutions_per_page))
        for idx, key in enumerate(ordered_keys)
    }

    print(f"\nPage layout:")
    if not skip_front_matter:
        print(f"  Front matter  : 1-{front_pages}")
    print(f"  Puzzles       : {puzzle_start}-{puzzle_start+len(ordered_keys)-1}")
    print(f"  Answer Key hdr: {solutions_header}")
    print(f"  Solutions     : {solutions_start}+")

    final_writer = PdfWriter()

    if not skip_front_matter:
        print("\nBuilding front matter...")
        fm = PdfReader(build_front_matter(title, theme, author, len(ordered_keys)))
        for i, p in enumerate(fm.pages):
            if i >= numbered_from:
                display_num = i - numbered_from + 1
                p = add_page_number(p, display_num)
            final_writer.add_page(p)
        print(f"  {len(fm.pages)} pages added.")

    print("\nAdding puzzle pages...")
    # Page numbers continue from where front matter left off
    # front matter contributed (5 - numbered_from) = 1 numbered page
    fm_numbered = (front_pages - numbered_from) if not skip_front_matter else 0

    for idx, key in enumerate(ordered_keys):
        buf = io.BytesIO()
        add_solution_reference(puzzles[key], puzzle_to_sol[key], buf)
        buf.seek(0)
        puzzle_page = PdfReader(buf).pages[0]
        display_num = fm_numbered + idx + 1
        puzzle_page = add_page_number(puzzle_page, display_num)
        final_writer.add_page(puzzle_page)
        if (idx+1) % 10 == 0:
            print(f"  {idx+1}/{len(ordered_keys)}...")
    print(f"  All {len(ordered_keys)} puzzle pages added.")

    print("\nBuilding Answer Key header...")
    hdr_page = PdfReader(build_solutions_header()).pages[0]
    display_num = fm_numbered + len(ordered_keys) + 1
    hdr_page = add_page_number(hdr_page, display_num)
    final_writer.add_page(hdr_page)

    print(f"\nBuilding solutions ({solutions_per_page} per page)...")
    sol_files = []
    for key in ordered_keys:
        if key in solutions:
            sol_files.append((solutions[key], f"{key[0]} {key[1]}"))
        else:
            print(f"  WARNING: Missing solution for {key[0]} {key[1]}")

    sol_writer = assemble_solutions(sol_files, per_page=solutions_per_page)
    for i, p in enumerate(sol_writer.pages):
        display_num = fm_numbered + len(ordered_keys) + 2 + i
        p = add_page_number(p, display_num)
        final_writer.add_page(p)
    print(f"  {len(sol_writer.pages)} solution page(s) added.")

    print("\nBuilding closing pages...")
    closing_start_num = fm_numbered + len(ordered_keys) + 2 + len(sol_writer.pages)
    closing_buf = build_closing_pages(author)
    closing_reader = PdfReader(closing_buf)
    for i, p in enumerate(closing_reader.pages):
        p = add_page_number(p, closing_start_num + i)
        final_writer.add_page(p)
    print(f"  {len(closing_reader.pages)} closing pages added.")

    print(f"\nWriting: {output_path}")
    with open(output_path, "wb") as f:
        final_writer.write(f)

    total = front_pages + len(ordered_keys) + 1 + len(sol_writer.pages) + len(closing_reader.pages)
    print(f"\nDone! Total pages: {total}")
    print(f"KDP: 8.5x11, B&W interior, spine calculated from {total} pages.")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--folder",   required=True)
    p.add_argument("--output",   default="book_interior.pdf")
    p.add_argument("--solutions-per-page", type=int, default=6, choices=[4, 6])
    p.add_argument("--title",    default="")
    p.add_argument("--theme",    default="")
    p.add_argument("--author",   default="Author Name")
    p.add_argument("--skip-front-matter", action="store_true")
    args = p.parse_args()

    assemble_book(
        folder=args.folder,
        output_path=args.output,
        solutions_per_page=args.solutions_per_page,
        title=args.title,
        theme=args.theme,
        author=args.author,
        skip_front_matter=args.skip_front_matter,
    )