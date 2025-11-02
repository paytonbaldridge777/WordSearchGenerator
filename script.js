(() => {
  const el = (id) => document.getElementById(id);

  const titleInput = el("title");
  const verseInput = el("verse");
  const wordsInput = el("words");
  const refInput   = el("reference");

  const btnGenerate = el("btnGenerate");
  const btnExport   = el("btnExport");
  const btnClear    = el("btnClear");

  const messages    = el("messages");
  const previewTitle= el("previewTitle");
  const previewGrid = el("previewGrid");
  const previewVerse= el("previewVerse");
  const previewRef  = el("previewReference");

  // ------------------ Bible version loader ------------------
  let bibleData = {};
  const versionSelect = el("versionSelect");
  const bookSelect    = el("bookSelect");
  const chapterSelect = el("chapterSelect");
  const verseSelect   = el("verseSelect");

  const bookNumberMap = {
    1:"Genesis",2:"Exodus",3:"Leviticus",4:"Numbers",5:"Deuteronomy",
    6:"Joshua",7:"Judges",8:"Ruth",9:"1 Samuel",10:"2 Samuel",
    11:"1 Kings",12:"2 Kings",13:"1 Chronicles",14:"2 Chronicles",
    15:"Ezra",16:"Nehemiah",17:"Esther",18:"Job",19:"Psalms",
    20:"Proverbs",21:"Ecclesiastes",22:"Song of Solomon",23:"Isaiah",
    24:"Jeremiah",25:"Lamentations",26:"Ezekiel",27:"Daniel",
    28:"Hosea",29:"Joel",30:"Amos",31:"Obadiah",32:"Jonah",
    33:"Micah",34:"Nahum",35:"Habakkuk",36:"Zephaniah",
    37:"Haggai",38:"Zechariah",39:"Malachi",40:"Matthew",
    41:"Mark",42:"Luke",43:"John",44:"Acts",45:"Romans",
    46:"1 Corinthians",47:"2 Corinthians",48:"Galatians",
    49:"Ephesians",50:"Philippians",51:"Colossians",
    52:"1 Thessalonians",53:"2 Thessalonians",54:"1 Timothy",
    55:"2 Timothy",56:"Titus",57:"Philemon",58:"Hebrews",
    59:"James",60:"1 Peter",61:"2 Peter",62:"1 John",
    63:"2 John",64:"3 John",65:"Jude",66:"Revelation"
  };

  versionSelect.addEventListener("change", async () => {
    const path = versionSelect.value;
    if (!path) return;
    try {
      const res = await fetch(path);
      const data = await res.json();

      // Some datasets wrap verses in { metadata, verses: [...] }
      let verses = data;
      if (data.verses && Array.isArray(data.verses)) verses = data.verses;

      // Convert flat array → nested Book -> Chapter -> Verse
      if (Array.isArray(verses)) {
        bibleData = {};
        for (const v of verses) {
          let book = v.book ?? v.Book ?? "Unknown";
          if (!isNaN(book) && bookNumberMap[book]) book = bookNumberMap[book];
          const ch  = String(v.chapter ?? v.Chapter ?? 1);
          const vs  = String(v.verse   ?? v.Verse   ?? 1);
          const txt = String(v.text ?? v.Text ?? "").trim();
          if (!bibleData[book])     bibleData[book]     = {};
          if (!bibleData[book][ch]) bibleData[book][ch] = {};
          bibleData[book][ch][vs] = txt;
        }
      } else {
        bibleData = data; // already nested
      }
      populateBooks();
    } catch (err) {
      alert("Failed to load Bible version.");
      console.error(err);
    }
  });

  function populateBooks() {
    bookSelect.innerHTML = "<option value=''>-- Select Book --</option>";
    Object.keys(bibleData).forEach(book => {
      const opt = document.createElement("option");
      opt.value = book;
      opt.textContent = book;
      bookSelect.appendChild(opt);
    });
    chapterSelect.disabled = true;
    verseSelect.disabled = true;
  }

  bookSelect.addEventListener("change", () => {
    const book = bookSelect.value;
    chapterSelect.innerHTML = "<option value=''>-- Select Chapter --</option>";
    verseSelect.innerHTML   = "<option value=''>-- Select Verse --</option>";
    verseSelect.disabled = true;

    if (!book) { chapterSelect.disabled = true; return; }
    const chapters = Object.keys(bibleData[book]);
    chapters.forEach(ch => {
      const opt = document.createElement("option");
      opt.value = ch;
      opt.textContent = ch;
      chapterSelect.appendChild(opt);
    });
    chapterSelect.disabled = false;
  });

  chapterSelect.addEventListener("change", () => {
    const book    = bookSelect.value;
    const chapter = chapterSelect.value;
    verseSelect.innerHTML = "<option value=''>-- Select Verse --</option>";

    if (!chapter) { verseSelect.disabled = true; return; }
    const verses = Object.keys(bibleData[book][chapter]);
    verses.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      verseSelect.appendChild(opt);
    });
    verseSelect.disabled = false;
  });

  verseSelect.addEventListener("change", () => {
    const book    = bookSelect.value;
    const chapter = chapterSelect.value;
    const verseNo = verseSelect.value;
    if (!verseNo) return;
    verseInput.value = bibleData[book][chapter][verseNo];
    refInput.value   = `${book} ${chapter}:${verseNo}`;
  });

  // ------------------ Word search core ------------------
  const sanitizeWord = (w) => w.toUpperCase().replace(/[^A-Z]/g, "").trim();
  const uniq  = (arr) => [...new Set(arr)];
  const byLen = (a,b) => b.length - a.length;

  function parseWords(raw) {
    if (!raw) return [];
    return uniq(raw.split(/[\n,; ]+/g).map(sanitizeWord).filter(Boolean)).sort(byLen);
  }

  function canPlace(grid, word, r, c, dx, dy) {
    const N = grid.length;
    const endR = r + dy * (word.length - 1);
    const endC = c + dx * (word.length - 1);
    if (endR < 0 || endR >= N || endC < 0 || endC >= N) return false;
    for (let i = 0; i < word.length; i++) {
      const rr = r + dy * i, cc = c + dx * i;
      const existing = grid[rr][cc];
      if (existing && existing !== word[i]) return false;
    }
    return true;
  }

  function generateGrid(words, N = 15) {
    const grid   = Array.from({ length: N }, () => Array(N).fill(null));
    const placed = []; // { word, cells:[{r,c}] }
    const dirs = [
      {dx:1,dy:0},{dx:0,dy:1},{dx:1,dy:1},
      {dx:-1,dy:0},{dx:0,dy:-1},{dx:-1,dy:-1},
      {dx:1,dy:-1},{dx:-1,dy:1}
    ];

    for (const w of words) {
      if (w.length > N) continue;
      let done = false;
      for (let tries = 0; tries < 500 && !done; tries++) {
        const d = dirs[Math.floor(Math.random() * dirs.length)];
        const r = Math.floor(Math.random() * N);
        const c = Math.floor(Math.random() * N);
        if (!canPlace(grid, w, r, c, d.dx, d.dy)) continue;
        const cells = [];
        for (let i = 0; i < w.length; i++) {
          const rr = r + d.dy * i, cc = c + d.dx * i;
          grid[rr][cc] = w[i];
          cells.push({ r: rr, c: cc });
        }
        placed.push({ word: w, cells });
        done = true;
      }
    }

    const ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!grid[r][c]) grid[r][c] = ALPH[Math.floor(Math.random() * ALPH.length)];
      }
    }
    return { grid, placed };
  }

  // ------------------ Preview ------------------
  function renderPreview(title, grid, verse, reference, words) {
    previewTitle.textContent = title || "Word Search";
    previewGrid.innerHTML = "";
    for (let r = 0; r < grid.length; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < grid[r].length; c++) {
        const td = document.createElement("td");
        td.textContent = grid[r][c];
        tr.appendChild(td);
      }
      previewGrid.appendChild(tr);
    }

    // Bold + underline first occurrence of each target word in the verse
    const used = new Set();
    previewVerse.innerHTML = verse.split(/\b/).map(tok => {
      const up = tok.toUpperCase().replace(/[^A-Z]/g, "");
      if (words.includes(up) && !used.has(up)) {
        used.add(up);
        return `<span style="font-weight:bold;text-decoration:underline">${tok}</span>`;
      }
      return tok;
    }).join("");

    previewRef.textContent = reference || "";
  }

  // ------------------ PDF helpers ------------------
  function hexToRGB(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) } : { r:0,g:0,b:0 };
  }

  // Draw a real grid with centered letters; optionally highlight solution cells
  function drawPDFGrid(doc, grid, placed, opts, withHighlights) {
    const page = { w: 8.5, h: 11 };
    const m    = { l: 0.5, r: 0.5, t: 0.75, b: 0.75 };
    const innerW = page.w - m.l - m.r;
    const innerH = page.h - m.t - m.b;

    const N = grid.length;
    const titleH = opts.title ? 0.35 : 0;
    const verseReserve = 2.0; // reserve space below for verse and reference
    const cell = Math.min(innerW / N, (innerH - titleH - verseReserve) / N);
    const gridW = cell * N, gridH = cell * N;
    const gridX = m.l + (innerW - gridW) / 2;
    const gridY = m.t + (titleH ? titleH + 0.15 : 0);

    const gridColor = hexToRGB("#000000");
    const letterColor = hexToRGB("#000000");
    const hiColor = hexToRGB("#e6c200");

    // Title
    if (opts.title) {
      doc.setFont(opts.fontFamily || "helvetica", "bold");
      doc.setFontSize(16);
      doc.text(opts.title, page.w / 2, m.t + 0.2, { align: "center" });
    }

    // Outer border + cell lines
    doc.setLineWidth(0.015);
    doc.setDrawColor(gridColor.r, gridColor.g, gridColor.b);
    doc.rect(gridX, gridY, gridW, gridH);
    for (let i = 1; i < N; i++) {
      doc.line(gridX + i * cell, gridY, gridX + i * cell, gridY + gridH);         // vertical
      doc.line(gridX, gridY + i * cell, gridX + gridW, gridY + i * cell);         // horizontal
    }

    // Solution highlights
    if (withHighlights && placed?.length) {
      doc.setDrawColor(hiColor.r, hiColor.g, hiColor.b);
      doc.setFillColor(hiColor.r, hiColor.g, hiColor.b);
      const filled = new Set();
      for (const p of placed) {
        for (const cc of p.cells) {
          const key = cc.r + "_" + cc.c;
          if (filled.has(key)) continue;
          filled.add(key);
          const x = gridX + cc.c * cell;
          const y = gridY + cc.r * cell;
          doc.rect(x, y, cell, cell, "F"); // fill the cell (solid highlight)
        }
      }
    }

    // Letters
    const fontPt = Math.max(8, Math.min(48, cell * 72 * 0.66));
    doc.setFont(opts.fontFamily || "helvetica", "bold");
    doc.setFontSize(fontPt);
    doc.setTextColor(letterColor.r, letterColor.g, letterColor.b);
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const x = gridX + c * cell + cell / 2;
        const y = gridY + r * cell + cell / 2 + (fontPt / 72) * 0.3;
        doc.text(grid[r][c], x, y, { align: "center" });
      }
    }

    // Verse + reference
    let y = gridY + gridH + 0.35;
    doc.setFont(opts.fontFamily || "helvetica", "normal");
    doc.setFontSize(12);

    // Bold + underline the first occurrence of each target word
    const used = new Set();
    const tokens = (opts.verse || "").split(/\s+/);
    let line = [], lineW = 0;
    const maxW = innerW;

    function flushLine() {
      if (!line.length) return;
      let cursorX = page.w / 2 - (lineW / 2);
      for (const seg of line) {
        doc.setFont(opts.fontFamily || "helvetica", seg.bold ? "bold" : "normal");
        doc.text(seg.text, cursorX, y, { baseline: "alphabetic" });
        if (seg.bold) {
          doc.setLineWidth(0.015);
          doc.line(cursorX, y + 0.03, cursorX + doc.getTextWidth(seg.text), y + 0.03);
        }
        cursorX += doc.getTextWidth(seg.text + " ");
      }
      y += 0.25; line = []; lineW = 0;
    }

    for (const raw of tokens) {
      const up = raw.toUpperCase().replace(/[^A-Z]/g, "");
      const bold = opts.words?.includes(up) && !used.has(up);
      if (bold) used.add(up);
      const w = doc.getTextWidth(raw + " ");
      if (lineW + w > maxW) flushLine();
      line.push({ text: raw, bold });
      lineW += w;
    }
    flushLine();

    if (opts.reference) {
      doc.setFont(opts.fontFamily || "helvetica", "italic");
      doc.text(opts.reference, page.w / 2, y + 0.3, { align: "center" });
    }
  }

  function exportPDFs(state) {
    const { jsPDF } = window.jspdf;
    const { title, grid, placed, verse, reference, words } = state;

    const opts = {
      title,
      verse,
      reference,
      words,
      fontFamily: "helvetica"
    };

    // Puzzle
    const docPuzzle = new jsPDF({ unit: "in", format: "letter" });
    drawPDFGrid(docPuzzle, grid, placed, opts, false);

    // Solution
    const docSolution = new jsPDF({ unit: "in", format: "letter" });
    drawPDFGrid(docSolution, grid, placed, opts, true);

    const base = (title || "WordSearch").trim().replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "_");
    docPuzzle.save(`${base}_Puzzle.pdf`);
    docSolution.save(`${base}_Solution.pdf`);
  }

  // ------------------ Buttons ------------------
  let lastState = null;

  btnGenerate.addEventListener("click", () => {
    const title     = titleInput.value.trim();
    const verse     = verseInput.value.trim();
    const reference = refInput.value.trim();
    const words     = parseWords(wordsInput.value);

    if (!verse)       { messages.textContent = "Please paste or select a verse."; return; }
    if (!words.length){ messages.textContent = "Please provide at least one target word."; return; }

    const { grid, placed } = generateGrid(words, 15);
    renderPreview(title, grid, verse, reference, words);
    messages.textContent = "Preview generated successfully.";
    btnExport.disabled = false;

    lastState = { title, grid, placed, verse, reference, words };
  });

  btnExport.addEventListener("click", () => {
    if (!lastState) { alert("Generate a puzzle first!"); return; }
    exportPDFs(lastState);
  });

  btnClear.addEventListener("click", () => {
    titleInput.value = verseInput.value = wordsInput.value = refInput.value = "";
    previewGrid.innerHTML = "";
    previewTitle.textContent = "";
    previewVerse.textContent = "";
    previewRef.textContent = "";
    messages.textContent = "";
    btnExport.disabled = true;
    lastState = null;
  });
})();
