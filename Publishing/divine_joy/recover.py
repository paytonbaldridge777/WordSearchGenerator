"""Recover editable Divine Joy data from the original interior and publisher exports."""

import argparse
import hashlib
import json
import math
import random
import re
import string
from pathlib import Path
from zipfile import ZipFile

import fitz

BOOKS = dict(zip(
    ['Philippians', '1 Chronicles', 'John', 'Psalms', 'Nehemiah', 'Proverbs',
     'Acts', 'Romans', 'Galatians', 'Colossians', 'Isaiah', 'Luke', 'Zephaniah',
     '1 Peter', '2 Timothy'],
    'PHI 1CH JOH PSA NEH PRO ACT ROM GAL COL ISA LUK ZEP 1PE 2TI'.split(),
))
TOKEN = re.compile(r"[A-Za-z]+(?:[’'-][A-Za-z]+)*")
REFERENCE = re.compile(r"((?:[1-3] )?[A-Za-z]+) (\d+):(\d+)(?:[-–](\d+))?")
DIRECTIONS = [(r, c) for r in (-1, 0, 1) for c in (-1, 0, 1) if (r, c) != (0, 0)]
REPLACEMENTS = {
    2: {'CHRONICLES': 'SHOULDERS'},
    5: {'IMMOVABLE': 'JUDGE'},
    7: {'IMAGINATION': 'THOUGHTS'},
    10: {'CHIEF': 'TRUST', 'FLUTES': 'STILL', 'MUSICIAN': 'BED'},
    20: {'FORTH': 'BORN'},
    29: {'SOLOMON': 'SINGING', 'SONG': 'DREAM'},
    30: {'FORTH': 'PRODUCES'},
    41: {'LIE': 'SPRINGS'},
    42: {'FORTH': 'OUT'},
    43: {'SEED': 'OFFSPRING', 'FORTH': 'PRODUCES'},
    44: {'OVER': 'DELIGHT', 'TAKE': 'WEEPING'},
    49: {'SEEN': 'SEE', 'UNTO': 'PROPHETS'},
    50: {'UNTO': 'GENTLENESS'},
}
REFLECTION_EDITS = {
    1: ('hands of the lord', 'hands of the Lord'),
    23: ('humility and need, does', 'humility and need. He does'),
    32: ('rejection; They', 'rejection. They'),
    46: ('HE tells', 'He tells'),
    48: ('in HIS name', 'in His name'),
}


def normalized(word):
    return re.sub('[^A-Za-z]', '', word).upper()


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def verses_from_publisher(path, usfm):
    with ZipFile(path) as archive:
        verses = {}
        for line in archive.read('eng-web_vpl.txt').decode('utf-8-sig').splitlines():
            match = re.fullmatch(r'(\w+ \d+:\d+) (.*)', line)
            if match:
                key, verse = match.groups()
                verses[key] = ' '.join(verse.split())
    # The VPL export puts Psalm superscriptions into verse 1. USFM marks
    # them separately with \d, outside the numbered verse body.
    with ZipFile(usfm) as archive:
        psalms = archive.read(next(n for n in archive.namelist() if 'PSAeng-web' in n)).decode('utf-8-sig')
    for chapter, heading in re.findall(r'^\\c (\d+) *\n\\d (.+)', psalms, re.M):
        heading = ' '.join(heading.split())
        key = f'PSA {chapter}:1'
        if verses.get(key, '').startswith(heading + ' '):
            verses[key] = verses[key][len(heading) + 1:]
    return verses


def find_paths(grid, word):
    for r in range(12):
        for c in range(12):
            for dr, dc in DIRECTIONS:
                end_r, end_c = r + dr * (len(word) - 1), c + dc * (len(word) - 1)
                if 0 <= end_r < 12 and 0 <= end_c < 12:
                    path = [[r + dr * i, c + dc * i] for i in range(len(word))]
                    if ''.join(grid[y][x] for y, x in path) == word:
                        yield path


def recover_body(page):
    paragraphs = []
    targets = []
    for block in page.get_text('rawdict')['blocks']:
        for line in block.get('lines', []):
            spans = [s for s in line['spans'] if 16.7 < s['size'] < 17.1 and 440 < s['origin'][1] < 725]
            if not spans:
                continue
            line_parts = []
            for span in spans:
                gap = span['chars'][0]['bbox'][0] - previous if line_parts else 0
                parts = []
                right = span['chars'][0]['bbox'][0]
                for char in span['chars']:
                    if parts and parts[-1].isalnum() and char['c'].isalnum() and char['bbox'][0] - right > 1.5:
                        parts.append(' ')
                    parts.append(char['c'])
                    right = char['bbox'][2]
                value = ''.join(parts)
                if line_parts and gap > 1.5 and not value.startswith((' ', '.', ',', ';', ':', '!', '?')):
                    line_parts.append(' ')
                line_parts.append(value)
                previous = span['chars'][-1]['bbox'][2]
                if 'Bold' in span['font']:
                    targets.extend(normalized(w) for w in TOKEN.findall(value))
            paragraphs.append(''.join(line_parts).strip())
    body = ' '.join(paragraphs)
    body = re.sub(r'([.,;:!?])(?=[A-Za-z])', r'\1 ', body)
    body = re.sub(r'([.!?][”"]) *(?=[A-Z])', r'\1 ', body)
    return body, list(dict.fromkeys(targets))


def key_marks(page, x, y, cell):
    tile = fitz.Rect(x - 1, y - 1, x + cell * 12 + 1, y + cell * 12 + 1)
    marks = set()
    for shape in page.get_drawings():
        rect = shape['rect']
        if rect not in tile:
            continue
        if shape['type'] == 'fs' and shape['fill'] and 0.75 < shape['fill'][0] < 0.81:
            first = (rect.x0, rect.y0)
            last = (rect.x1, rect.y1)
        elif shape['type'] == 's' and 12 < (shape['width'] or 0) < 14 and shape['items'][0][0] == 'l':
            _, first, last = shape['items'][0]
        else:
            continue
        cells = [(math.floor((pt[1] - y) / cell + 0.05), math.floor((pt[0] - x) / cell + 0.05)) for pt in (first, last)]
        cells = [tuple(min(11, max(0, v)) for v in point) for point in cells]
        marks.add(tuple(sorted(cells)))
    return marks


def build_grid(grid, words, missing, identifier):
    """Prefer a minimal letter edit outside all retained word paths."""
    rng = random.Random(identifier)
    used = {tuple(cell) for path in words.values() for cell in path}
    grid = [list(row) for row in grid]
    for word in sorted(missing, key=len, reverse=True):
        if placements := list(find_paths(grid, word)):
            chosen = placements[0]
        else:
            candidates = []
            for r in range(12):
                for c in range(12):
                    for dr, dc in DIRECTIONS:
                        path = [[r + dr * i, c + dc * i] for i in range(len(word))]
                        if not all(0 <= y < 12 and 0 <= x < 12 for y, x in path):
                            continue
                        changes = [(y, x, ch) for (y, x), ch in zip(path, word) if grid[y][x] != ch]
                        if all((y, x) not in used for y, x, _ in changes):
                            candidates.append((len(changes), rng.random(), path, changes))
            if not candidates:
                return fresh_grid([*words, *missing], identifier)
            _, _, chosen, changes = min(candidates)
            for y, x, ch in changes:
                grid[y][x] = ch
        words[word] = chosen
        used.update(map(tuple, chosen))
    return [''.join(row) for row in grid], words


def fresh_grid(words, identifier):
    rng = random.Random(identifier)
    for _ in range(500):
        grid = [[''] * 12 for _ in range(12)]
        placements = {}
        for word in sorted(words, key=len, reverse=True):
            candidates = []
            for r in range(12):
                for c in range(12):
                    for dr, dc in DIRECTIONS:
                        path = [[r + dr * i, c + dc * i] for i in range(len(word))]
                        if all(0 <= y < 12 and 0 <= x < 12 and grid[y][x] in ('', ch)
                               for (y, x), ch in zip(path, word)):
                            overlaps = sum(bool(grid[y][x]) for y, x in path)
                            candidates.append((overlaps, rng.random(), path))
            if not candidates:
                break
            _, _, path = max(candidates)
            placements[word] = path
            for (y, x), ch in zip(path, word):
                grid[y][x] = ch
        else:
            return [''.join(ch or rng.choice(string.ascii_uppercase) for ch in row) for row in grid], placements
    raise ValueError(f'Cannot place words for {identifier}')


def scripture(reference, verses):
    book, chapter, first, last = REFERENCE.fullmatch(reference).groups()
    keys = [f'{BOOKS[book]} {chapter}:{n}' for n in range(int(first), int(last or first) + 1)]
    return {key: verses[key] for key in keys}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for argument in ('original', 'inventory', 'vpl', 'usfm', 'output'):
        parser.add_argument(argument, type=Path)
    args = parser.parse_args()
    verses = verses_from_publisher(args.vpl, args.usfm)
    inventory = json.loads(args.inventory.read_text())
    original = fitz.open(args.original)
    puzzles = []
    published = {}
    reference_by_number = {
        item['number']: ('1 Chronicles 15:13-16' if item['number'] == 2 else REFERENCE.search(item['footer']).group())
        for item in inventory['puzzles'] if item['type'] == 'verse'
    }
    for item in inventory['puzzles']:
        number, kind = item['number'], item['type']
        old_page = original[item['pdf_page'] - 1]
        body, selections = recover_body(old_page)
        label = reference_by_number[number]
        if kind == 'verse':
            records = scripture(label, verses)
            published.update(records)
            new_body = ' '.join(records.values())
        else:
            edit = REFLECTION_EDITS.get(number)
            new_body = body.replace(*edit) if edit else body
        available = set(map(normalized, TOKEN.findall(new_body)))
        missing = [word for word in selections if word not in available]
        grid = item['grid']
        original_grid = grid
        from_proof = item.get('saved_solution_paths', {})
        x = 76.65 + 278 * (kind == 'reflection')
        y = 45.8065 + 248 * ((number - 1) % 3)
        if kind == 'verse' and number == 2:
            y -= 16.36  # The old tile had no title and sat higher.
        marks = key_marks(original[item['answer_key_pdf_page'] - 1], x, y, 15.05833)
        planned = REPLACEMENTS.get(number, {}) if kind == 'verse' else {}
        changes = {word: planned[word] for word in missing if planned.get(word) in available}
        if not selections:
            raise ValueError(f"{item['id']}: no original selections recovered")
        if set(missing) != changes.keys():
            raise ValueError(f"{item['id']}: unresolved selections {set(missing) - changes.keys()}")
        selected = list(dict.fromkeys(changes.get(word, word) for word in selections))
        paths = {}
        for word in selected:
            options = list(find_paths(grid, word))
            if options:
                preferred = from_proof.get(word)
                def rank(path):
                    ends = tuple(sorted((tuple(path[0]), tuple(path[-1]))))
                    return path == preferred, ends in marks

                paths[word] = max(options, key=rank)
        grid, paths = build_grid(grid, paths, [word for word in selected if word not in paths], item['id'])
        letter_edits = sum(a != b for a, b in zip(''.join(original_grid), ''.join(grid)))
        puzzles.append(dict(id=item['id'], kind=kind, number=number, pdf_page=item['pdf_page'],
                            key_page=item['answer_key_pdf_page'], key_label=item['printed_solution_page'],
                            reference=label, text=new_body, grid=grid, selections=selected,
                            paths=paths, replacements=changes, recovered_selections=selections, letter_edits=letter_edits))
    for quote in ('John 11:25', '2 Timothy 1:7'):
        published.update(scripture(quote, verses))
    output = dict(original_sha256=digest(args.original), inventory_sha256=digest(args.inventory),
                  publisher='https://ebible.org/bible/details.php?id=eng-web',
                  vpl_sha256=digest(args.vpl), usfm_sha256=digest(args.usfm),
                  publisher_verses=published, puzzles=puzzles)
    source = json.dumps(output, ensure_ascii=False, indent=2)
    # Keep each coordinate path on a single line, so grid edits are easy to review.
    source = re.sub(r'\[\s*(?:\[\s*\d+,\s*\d+\s*\]\s*,?\s*)+\]',
                    lambda match: json.dumps(json.loads(match[0])), source)
    args.output.write_text(source + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
