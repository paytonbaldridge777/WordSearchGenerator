"""Validate the rendered Divine Joy PDF against source and publisher artifacts."""

import argparse
from collections import Counter
import json
import math
from pathlib import Path
import re
from zipfile import ZipFile

import fitz

from recover import BOOKS, REFERENCE, TOKEN, digest, normalized, scripture, verses_from_publisher


def compact(text):
    return ' '.join(text.split())


def read_usfm(archive_path):
    """Read numbered verse bodies separately from section titles and notes."""
    aliases = {'PHP': 'PHI', 'JHN': 'JOH', 'MRK': 'MAR', 'JAS': 'JAM'}
    result = {}
    with ZipFile(archive_path) as archive:
        for name in archive.namelist():
            if not name.endswith('.usfm'):
                continue
            book = name.split('-')[1].removesuffix('eng')
            book = aliases.get(book, book)
            if book not in BOOKS.values():
                continue
            text = archive.read(name).decode('utf-8-sig')
            text = re.sub(r'\\(?:f|x) .*?\\(?:f|x)\*', '', text, flags=re.S)
            text = re.sub(r'\\\+?w ([^|]+)\|[^\\]+\\\+?w\*', r'\1', text)
            text = re.sub(r'\\(?:wj|qs)(?:\*| )', '', text)
            chapter = None
            key = None
            for line in text.splitlines():
                if match := re.match(r'\\c (\d+)', line):
                    chapter = match[1]
                    key = None
                elif match := re.match(r'\\v (\d+) (.*)', line):
                    key = f'{book} {chapter}:{match[1]}'
                    result[key] = match[2]
                elif key and (match := re.match(r'\\(?:q\d?|m|p|pi\d?|nb) (.+)', line)):
                    result[key] += ' ' + match[1]
    return {key: compact(value) for key, value in result.items()}


def spans(page):
    return [span for block in page.get_text('dict')['blocks'] for line in block.get('lines', [])
            for span in line['spans']]


def letter_grid(page, rect, cell, size):
    chars = {}
    for span in spans(page):
        if abs(span['size'] - size) > 0.02 or not re.fullmatch('[A-Z]', span['text']):
            continue
        x0, _, x1, _ = span['bbox']
        x = (x0 + x1) / 2
        y = span['origin'][1] - size * 0.35
        if fitz.Point(x, y) not in rect:
            continue
        row, col = math.floor((y - rect.y0) / cell), math.floor((x - rect.x0) / cell)
        if (row, col) in chars:
            raise ValueError(f'PDF page {page.number + 1}: duplicate grid letter')
        chars[row, col] = span['text']
    return [''.join(chars.get((row, col), '?') for col in range(12)) for row in range(12)]


def line_path(start, end):
    dr, dc = end[0] - start[0], end[1] - start[1]
    length = max(abs(dr), abs(dc))
    if length < 1 or dr not in (-length, 0, length) or dc not in (-length, 0, length):
        return []
    return [(start[0] + dr * i // length, start[1] + dc * i // length) for i in range(length + 1)]


def check_pdf(pdf_path, book, vpl, usfm, original_path, baseline_report):
    errors = []
    checks = Counter()
    exceptions = []

    def check(test, result, where):
        if result:
            checks[test] += 1
        else:
            errors.append(f'{where}: {test}')

    original_counts = {
        int(page): int(count) for page, count in re.findall(
            r'\| (?:Verse|Reflection) \d+ \| (\d+) \| (\d+) \|', baseline_report.read_text())
    }
    publisher = verses_from_publisher(vpl, usfm)
    usfm_records = read_usfm(usfm)
    check('publisher archive digests', digest(vpl) == book['vpl_sha256'] and digest(usfm) == book['usfm_sha256'], 'Source')
    for key, expected in book['publisher_verses'].items():
        check('numbered verse matches VPL', publisher.get(key) == expected, key)
        check('numbered verse matches USFM', usfm_records.get(key) == expected, key)

    doc = fitz.open(pdf_path)
    original = fitz.open(original_path)
    check('original file digest', digest(original_path) == book['original_sha256'], 'Source')
    check('125 single pages, unencrypted', len(doc) == 125 and not doc.is_encrypted, 'PDF')
    check('100 source puzzles', len(book['puzzles']) == 100, 'Source')
    shape_cache = {}
    for page in doc:
        number = page.number + 1
        where = f'PDF page {number}'
        left, right = (27, 18) if number % 2 else (18, 27)
        safe = fitz.Rect(left, 18, 612 - right, 774)
        check('letter page geometry', page.rect == page.mediabox == page.cropbox == fitz.Rect(0, 0, 612, 792)
              and page.rotation == 0, where)
        check('no annotations, links, images or reused PDF forms', not any(
            (page.first_annot, page.first_widget, page.get_links(), page.get_images(), page.get_xobjects())), where)
        check('complete render', bool(page.get_pixmap(matrix=fitz.Matrix(.5, .5), colorspace=fitz.csGRAY).samples), where)
        check('text fits print margins; fonts at least 7 pt', all(
            fitz.Rect(s['bbox']) in safe and s['size'] >= 7 for s in spans(page)), where)
        shapes = page.get_drawings()
        shape_cache[number] = shapes
        check('artwork fits print margins', all(s['rect'] in safe for s in shapes), where)
        check('stroke width at least 0.75 pt', all(s['width'] is None or s['width'] >= .75 for s in shapes), where)
        check('embedded Unicode fonts', all(
            item[1] == 'ttf' and bool(doc.extract_font(item[0])[3]) and
            doc.xref_get_key(item[0], 'ToUnicode')[0] == 'xref' for item in page.get_fonts()), where)
        if number >= 5:
            check('printed page number', page.get_text().splitlines().count(f'-{number - 4}-') == 1, where)
        check('text has no invalid glyphs', '\ufffd' not in page.get_text(), where)

    check('copyright credits WEB Classic', 'World English Bible Classic (WEB)' in compact(doc[1].get_text())
          and 'United States of America' in compact(doc[1].get_text()), 'Copyright')
    for key, page_number in [('JOH 11:25', 3), ('2TI 1:7', 5)]:
        verse = publisher[key].split('“', 1)[-1]
        check('front quotation matches publisher', verse in compact(doc[page_number - 1].get_text()), key)

    grids = {'retained_from_original': 0, 'edited_or_replaced': 0}
    reflows = []
    for index, puzzle in enumerate(book['puzzles']):
        identifier = puzzle['id']
        page_num = index + 6
        key_num = 107 + index // 6
        label = f"{puzzle['kind'].title()} {puzzle['number']}"
        page, key = doc[page_num - 1], doc[key_num - 1]
        check('paired puzzle order and pagination', puzzle['pdf_page'] == page_num and puzzle['key_page'] == key_num
              and puzzle['key_label'] == key_num - 4 and puzzle['number'] == 1 + index // 2
              and puzzle['kind'] == ('reflection' if index % 2 else 'verse'), identifier)
        check('puzzle and key titles and captions', page.get_text().splitlines().count(f'Divine Joy - {label}') == 1
              and key.get_text().splitlines().count(f'Divine Joy - {label}') == 1
              and key.get_text().splitlines().count(label) == 1, identifier)
        check('Scripture and solution footer', page.get_text().splitlines().count(
            f'(Solution on page {key_num - 4})') == 1 and
            page.get_text().splitlines().count(puzzle['reference']) == 1, identifier)
        check('recovered search word count matches original audit',
              len(puzzle['recovered_selections']) == len(puzzle['selections']) == original_counts.get(page_num), identifier)

        if puzzle['kind'] == 'verse':
            expected = ' '.join(scripture(puzzle['reference'], publisher).values())
            check('complete publisher passage', expected == puzzle['text'], identifier)
            expected = f"{puzzle['reference']} {expected}"
        else:
            expected = puzzle['text']
            reference = REFERENCE.search(expected)
            check('reflection citation agrees with paired Scripture',
                  bool(reference) and reference.group().replace('–', '-') == puzzle['reference'], identifier)
        body = [s for s in spans(page) if 16.87 < s['size'] < 16.89]
        body_text = compact(page.get_text(clip=fitz.Rect(35, 451, 577, 717)))
        check('rendered body exact, at original 16.88 pt', body_text == expected and bool(body), identifier)
        if body:
            check('body clear of grid and footer', min(s['bbox'][1] for s in body) >= 450
                  and max(s['bbox'][3] for s in body) < 718, identifier)
            if min(s['bbox'][0] for s in body) < 86.5:
                reflows.append(identifier)
        targets = set(puzzle['selections'])
        bold_spans = [s for s in body if 'Bold' in s['font']]
        bold_words = Counter(normalized(w) for s in bold_spans for w in TOKEN.findall(s['text']))
        check('exact bold search words', bold_words == Counter(targets), identifier)
        lines = [s['rect'] for s in shape_cache[page_num] if s['rect'].height == 0 and s['rect'].y0 > 450]
        check('one underline per marked word', len(lines) == len(targets) and all(any(
            abs(line.y0 - (span['origin'][1] + 2)) < .14 and abs(line.x0 - span['bbox'][0]) < .14
            and abs(line.x1 - span['bbox'][2]) < .14 for line in lines) for span in bold_spans), identifier)

        puzzle_cell, key_cell = 31.08145, 15.05833
        x, y = 76.65 + 278 * (index % 2), 45.8065 + 248 * ((index // 2) % 3)
        puzzle_box = fitz.Rect(119.51, 72.7, 119.51 + 12 * puzzle_cell, 72.7 + 12 * puzzle_cell)
        key_box = fitz.Rect(x, y, x + 12 * key_cell, y + 12 * key_cell)
        puzzle_rows = letter_grid(page, puzzle_box, puzzle_cell, 15.54)
        key_rows = letter_grid(key, key_box, key_cell, 15.54 * key_cell / puzzle_cell)
        check('puzzle, key and source grids match 144 letters', puzzle_rows == key_rows == puzzle['grid']
              and all(re.fullmatch('[A-Z]{12}', row) for row in puzzle_rows), identifier)
        for box, pdf_page in ((puzzle_box, page_num), (key_box, key_num)):
            check('complete grid border', sum(all(abs(a - b) < .03 for a, b in zip(s['rect'], box))
                  and any(item[0] == 're' for item in s['items']) for s in shape_cache[pdf_page]) == 1, identifier)

        orig_page = original[page_num - 1]
        orig_letters = orig_page.get_text().splitlines()
        old_grid = ''.join(s for s in orig_letters if re.fullmatch('[A-Z]', s) and len(s) == 1)[:144]
        grids['retained_from_original' if old_grid == ''.join(puzzle_rows) else 'edited_or_replaced'] += 1
        expected_paths = {}
        for word, path in puzzle['paths'].items():
            cells = [tuple(cell) for cell in path]
            check('valid source placement', word in targets and
                  cells == line_path(cells[0], cells[-1]) and word == ''.join(key_rows[r][c] for r, c in cells),
                  f'{identifier} {word}')
            expected_paths[tuple(sorted((cells[0], cells[-1])))] = word
        check('selection and path sets agree', set(puzzle['paths']) == targets and
              len(expected_paths) == len(targets), identifier)
        rendered = Counter()
        for shape in shape_cache[key_num]:
            if shape['type'] != 's' or len(shape['items']) != 1 or shape['items'][0][0] != 'l':
                continue
            if not shape['width'] or abs(shape['width'] - key_cell * .79) > .03:
                continue
            _, start, end = shape['items'][0]
            if start not in key_box or end not in key_box:
                continue
            cells = [((point.y - y) / key_cell - .5, (point.x - x) / key_cell - .5)
                     for point in (start, end)]
            snapped = [tuple(round(value) for value in cell) for cell in cells]
            check('highlight endpoints centered in cells', all(
                abs(value - rounded) < .005 for cell, target in zip(cells, snapped)
                for value, rounded in zip(cell, target)), identifier)
            rendered[tuple(sorted(snapped))] += 1
        missing = expected_paths.keys() - rendered.keys()
        extras = rendered.keys() - expected_paths.keys()
        check('all mandatory solution highlights rendered once',
              not missing and all(rendered[path] == 1 for path in expected_paths), identifier)
        check('no unreviewed extra highlights', not extras, identifier)
        if extras:
            exceptions.append({'id': identifier, 'extra_paths': sorted(extras)})

    return dict(pdf_sha256=digest(pdf_path), counts=dict(checks), failures=errors, reflows=reflows,
                original_grids=grids, extra_highlights=exceptions)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('pdf', 'source', 'vpl', 'usfm', 'original', 'baseline_audit', 'result'):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    result = check_pdf(args.pdf, json.loads(args.source.read_text()), args.vpl, args.usfm, args.original,
                       args.baseline_audit)
    args.result.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))
    raise SystemExit(bool(result['failures']))
