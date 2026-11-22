"""Build a fresh 125-page Divine Joy paperback interior from editable source."""

import argparse
import io
import json
import sys
from pathlib import Path

from pypdf import PdfWriter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen.canvas import Canvas

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from assemble_book import (
    PAGE_H, PAGE_W, STRINGS, build_closing_pages, build_front_matter,
    build_solutions_header, draw_printed_page_number,
)
from recover import TOKEN, normalized

REGULAR = 'MySans'
BOLD = 'MySans-Bold'
ITALIC = 'MySans-Italic'
AUTHOR = 'Payton & Gloria Baldridge'
TITLE = 'Anchored in the Word'
THEME = 'Divine Joy'


def words_for_display(puzzle):
    """Select the first full body occurrence of each search word."""
    seen = set()
    prefix = f"{puzzle['reference']} " if puzzle['kind'] == 'verse' else ''
    result = [(text, False) for text in prefix.split()]
    for text in puzzle['text'].split():
        tokens = TOKEN.findall(text)
        key = normalized(tokens[0]) if len(tokens) == 1 else ''
        bold = key in puzzle['selections'] and key not in seen
        if bold:
            seen.add(key)
        result.append((text, bold))
    if seen != set(puzzle['selections']):
        raise ValueError(f"{puzzle['id']}: missing display selections {set(puzzle['selections']) - seen}")
    return result


def wrap(words, width, size):
    lines = [[]]
    used = 0
    space = stringWidth(' ', REGULAR, size)
    for word, bold in words:
        length = stringWidth(word, BOLD if bold else REGULAR, size)
        if length > width:
            raise ValueError(f'Word exceeds line width: {word}')
        if lines[-1] and used + space + length > width:
            lines.append([])
            used = 0
        used += (space if lines[-1] else 0) + length
        lines[-1].append((word, bold))
    return lines


def layout(puzzle):
    words = words_for_display(puzzle)
    # Preserve letter grid dimensions and use the original passage font.
    # Try wider text block, tighter leading and a smaller grid-to-body gap first.
    for left, top, leading in [(86.6, 479.5, 18.9), (72, 479.5, 18.9),
                               (63, 474.5, 18.3), (54, 470, 18)]:
        lines = wrap(words, PAGE_W - 2 * left, 16.88)
        if top + (len(lines) - 1) * leading <= 708:
            return left, top, leading, lines
    raise ValueError(f'{puzzle["id"]}: passage requires more layout space')


def draw_grid(canvas, puzzle, x, top, cell, scale, solution=False):
    def center(row, col):
        return x + (col + 0.5) * cell, PAGE_H - top - (row + 0.5) * cell

    canvas.setStrokeGray(0)
    canvas.setLineWidth(max(scale, 0.75))
    canvas.rect(x, PAGE_H - top - 12 * cell, 12 * cell, 12 * cell)
    if solution:
        canvas.setLineCap(1)
        for path in puzzle['paths'].values():
            start, end = center(*path[0]), center(*path[-1])
            canvas.setStrokeGray(0.47)
            canvas.setLineWidth(cell * 0.87)
            canvas.line(*start, *end)
            canvas.setStrokeGray(0.78)
            canvas.setLineWidth(cell * 0.79)
            canvas.line(*start, *end)
        canvas.setLineCap(0)
    marked_cells = {tuple(point) for path in puzzle['paths'].values() for point in path} if solution else set()
    size = 15.54 * scale
    canvas.setFont(BOLD, size)
    for row, letters in enumerate(puzzle['grid']):
        for col, letter in enumerate(letters):
            canvas.setFillGray(0.82 if solution and (row, col) not in marked_cells else 0)
            cx, cy = center(row, col)
            canvas.drawCentredString(cx, cy - size * 0.35, letter)


def draw_puzzle(canvas, puzzle):
    number, kind = puzzle['number'], puzzle['kind'].title()
    canvas.setFillGray(0)
    canvas.setFont(BOLD, 20.63)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H - 52.5, f'{THEME} - {kind} {number}')
    draw_grid(canvas, puzzle, 119.51, 72.7, 31.08145, 1)
    left, top, leading, lines = layout(puzzle)
    for row, words in enumerate(lines):
        baseline = PAGE_H - top - row * leading
        text = canvas.beginText(left, baseline)
        x = left
        for index, (word, marked) in enumerate(words):
            if index:
                text.setFont(REGULAR, 16.88)
                text.textOut(' ')
                x += stringWidth(' ', REGULAR, 16.88)
            font = BOLD if marked else REGULAR
            text.setFont(font, 16.88)
            text.textOut(word)
            width = stringWidth(word, font, 16.88)
            if marked:
                canvas.setStrokeGray(0)
                canvas.setLineWidth(1)
                canvas.line(x, baseline - 2, x + width, baseline - 2)
            x += width
        canvas.drawText(text)
    canvas.setFillGray(0)
    canvas.setFont(ITALIC, 18)
    canvas.drawString(72, 40, puzzle['reference'])
    canvas.setFont(ITALIC, 13)
    canvas.drawRightString(540, 40, f"(Solution on page {puzzle['key_label']})")
    draw_printed_page_number(canvas, puzzle['pdf_page'] - 4)
    canvas.showPage()


def draw_key(canvas, tiles, page):
    for puzzle in tiles:
        col = puzzle['kind'] == 'reflection'
        offset = 248 * ((puzzle['number'] - 1) % 3)
        x = 76.65 + 278 * col
        cx = x + 6 * 15.05833
        name = f"{puzzle['kind'].title()} {puzzle['number']}"
        canvas.setFillGray(0)
        canvas.setFont(BOLD, 9.99)
        canvas.drawCentredString(cx, PAGE_H - 36 - offset, f'{THEME} - {name}')
        draw_grid(canvas, puzzle, x, 45.8065 + offset, 15.05833, 15.05833 / 31.08145, solution=True)
        canvas.setFillGray(0.2)
        canvas.setFont(BOLD, 11)
        canvas.drawCentredString(cx, PAGE_H - 239.9 - offset, name)
    draw_printed_page_number(canvas, page - 4)
    canvas.showPage()


def build(book, output):
    strings = dict(STRINGS['en'])
    published = book['publisher_verses']
    # Use the published speech in the dedication, with typeset quotation marks.
    speech = published['JOH 11:25'].split('“', 1)[1]
    strings['dedication_lines'] = [
        *strings['dedication_lines'][:-3],
        '“' + speech.split('. ', 1)[0] + '.',
        speech.split('. ', 1)[1] + '”',
        '-- John 11:25',
    ]
    quote = '“' + published['2TI 1:7'] + '”'
    strings['quote_lines'] = [
        ' '.join(word for word, _ in line) for line in wrap([(w, False) for w in quote.split()], 330, 17)
    ]
    strings['howto_blocks'] = [
        (heading, body.replace('a specific Bible verse', 'a specific Bible passage')
                      .replace('The full verse', 'The full passage')
                      .replace('hidden words highlighted', 'search words in bold and underlined'))
        for heading, body in strings['howto_blocks']
    ]

    def native_section(draw):
        buffer = io.BytesIO()
        canvas = Canvas(buffer, pagesize=(PAGE_W, PAGE_H), invariant=True, initialFontName=REGULAR)
        draw(canvas)
        canvas.save()
        buffer.seek(0)
        return buffer

    def puzzles(canvas):
        for puzzle in book['puzzles']:
            draw_puzzle(canvas, puzzle)

    def answer_key(canvas):
        for page in range(107, 124):
            draw_key(canvas, [p for p in book['puzzles'] if p['key_page'] == page], page)

    writer = PdfWriter()
    writer.append(build_front_matter(TITLE, THEME, AUTHOR, 100, strings=strings, quote_page_number=1))
    writer.append(native_section(puzzles))
    writer.append(build_solutions_header(page_number=102))
    writer.append(native_section(answer_key))
    writer.append(build_closing_pages(AUTHOR, first_page_number=120))
    writer.metadata = None
    writer.write(output)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    build(json.loads(args.source.read_text()), args.output)
