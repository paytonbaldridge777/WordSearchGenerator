(() => {
  // ------------------ Theme Toggle ------------------
  const themeToggle = document.getElementById("themeToggle");
  const body = document.body;

  // Load saved theme preference or default to light
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") {
    body.classList.add("dark-theme");
    themeToggle.textContent = "☀️ Light";
  }

  themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark-theme");
    const isDark = body.classList.contains("dark-theme");
    themeToggle.textContent = isDark ? "☀️ Light" : "🌙 Dark";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  // ------------------ Main App ------------------
  const el = (id) => document.getElementById(id);

  const titleInput = el("title");
  const verseInput = el("verse");
  const wordsInput = el("words");
  const refInput   = el("reference");
  const widthInput = el("puzzleWidth");
  const heightInput = el("puzzleHeight");

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

  // Book abbreviation to full name mapping for BBE format
  const bookAbbrevMap = {
    "gn":"Genesis","ex":"Exodus","lv":"Leviticus","nu":"Numbers","dt":"Deuteronomy",
    "js":"Joshua","jg":"Judges","rt":"Ruth","1sm":"1 Samuel","2sm":"2 Samuel",
    "1kg":"1 Kings","2kg":"2 Kings","1ch":"1 Chronicles","2ch":"2 Chronicles",
    "er":"Ezra","ne":"Nehemiah","et":"Esther","jb":"Job","ps":"Psalms",
    "pr":"Proverbs","ec":"Ecclesiastes","sng":"Song of Solomon","is":"Isaiah",
    "jr":"Jeremiah","lm":"Lamentations","ez":"Ezekiel","dn":"Daniel",
    "ho":"Hosea","jl":"Joel","am":"Amos","ob":"Obadiah","jn":"Jonah",
    "mc":"Micah","na":"Nahum","hk":"Habakkuk","zp":"Zephaniah",
    "hg":"Haggai","zc":"Zechariah","ml":"Malachi","mt":"Matthew",
    "mk":"Mark","lk":"Luke","jh":"John","ac":"Acts","ro":"Romans",
    "1co":"1 Corinthians","2co":"2 Corinthians","ga":"Galatians",
    "ep":"Ephesians","ph":"Philippians","cl":"Colossians",
    "1th":"1 Thessalonians","2th":"2 Thessalonians","1tm":"1 Timothy",
    "2tm":"2 Timothy","tt":"Titus","pm":"Philemon","hb":"Hebrews",
    "jm":"James","1pe":"1 Peter","2pe":"2 Peter","1jn":"1 John",
    "2jn":"2 John","3jn":"3 John","jd":"Jude","rv":"Revelation"
  };

  // ------------------ Bible JSON Parser Functions ------------------

  /**
   * Validates a Bible JSON structure and determines its format
   * @param {*} data - The parsed JSON data to validate
   * @returns {Object} - Validation result with success, format, and details
   */
  function validateBibleJSON(data) {
    if (!data || typeof data !== "object") {
      return {
        success: false,
        error: "Invalid JSON: Data is not an object or array",
        suggestions: ["Ensure the file contains valid JSON data"]
      };
    }

    // Format 1: KJV style with verses array
    if (data.verses && Array.isArray(data.verses)) {
      const sampleVerse = data.verses[0];
      if (sampleVerse && (sampleVerse.book !== undefined || sampleVerse.Book !== undefined)) {
        return {
          success: true,
          format: "KJV_VERSE_ARRAY",
          bookCount: new Set(data.verses.map(v => v.book || v.Book)).size,
          warnings: []
        };
      }
    }

    // Format 2: ASV style with resultset
    if (data.resultset && data.resultset.row && Array.isArray(data.resultset.row)) {
      const sampleRow = data.resultset.row[0];
      if (sampleRow && sampleRow.field && Array.isArray(sampleRow.field) && sampleRow.field.length >= 5) {
        return {
          success: true,
          format: "ASV_RESULTSET",
          bookCount: new Set(data.resultset.row.map(r => r.field[1])).size,
          warnings: []
        };
      }
    }

    // Format 3: BBE style - array of books with chapters
    if (Array.isArray(data) && data.length > 0) {
      const firstBook = data[0];
      if (firstBook.chapters && Array.isArray(firstBook.chapters)) {
        return {
          success: true,
          format: "BBE_CHAPTER_ARRAYS",
          bookCount: data.length,
          warnings: []
        };
      }
      
      // Format 6: Verse ID format
      if (firstBook.verse_id !== undefined || firstBook.book_name !== undefined) {
        return {
          success: true,
          format: "VERSE_ID_FORMAT",
          bookCount: new Set(data.map(v => v.book_name)).size,
          warnings: []
        };
      }
      
      // Flat array format (fallback for arrays with book/chapter/verse fields)
      if (firstBook.book !== undefined || firstBook.Book !== undefined ||
          firstBook.chapter !== undefined || firstBook.Chapter !== undefined) {
        return {
          success: true,
          format: "FLAT_VERSE_ARRAY",
          bookCount: new Set(data.map(v => v.book || v.Book)).size,
          warnings: ["Using fallback parser for flat verse array"]
        };
      }
    }

    // Format 5: Simple book objects
    if (data.books && Array.isArray(data.books)) {
      const sampleBook = data.books[0];
      if (sampleBook && sampleBook.name && sampleBook.verses && Array.isArray(sampleBook.verses)) {
        return {
          success: true,
          format: "SIMPLE_BOOK_OBJECTS",
          bookCount: data.books.length,
          warnings: []
        };
      }
    }

    // Format 4: Already normalized - check if it has book names as keys
    if (!Array.isArray(data)) {
      const keys = Object.keys(data);
      // Exclude metadata and other non-book keys
      const bookKeys = keys.filter(k => k !== "metadata" && k !== "resultset" && k !== "verses" && k !== "books");
      if (bookKeys.length > 0) {
        const firstBook = data[bookKeys[0]];
        if (firstBook && typeof firstBook === "object" && !Array.isArray(firstBook)) {
          const chapters = Object.keys(firstBook);
          if (chapters.length > 0) {
            const firstChapter = firstBook[chapters[0]];
            if (firstChapter && typeof firstChapter === "object") {
              return {
                success: true,
                format: "NORMALIZED",
                bookCount: bookKeys.length,
                warnings: []
              };
            }
          }
        }
      }
    }

    return {
      success: false,
      error: "No recognizable Bible structure found",
      suggestions: [
        "Check if file contains 'verses', 'resultset', or book objects",
        "Verify the JSON structure matches one of the supported formats",
        "Ensure the file contains actual Bible data"
      ]
    };
  }

  /**
   * Parses Format 1: KJV style with verses array
   * @param {Object} data - The JSON data with verses array
   * @returns {Object} - Normalized Bible data
   */
  function parseKJVFormat(data) {
    const verses = data.verses;
    const result = {};
    
    for (const v of verses) {
      let book = v.book ?? v.Book ?? v.bookname ?? v.BookName ?? "Unknown";
      if (!isNaN(book) && bookNumberMap[book]) {
        book = bookNumberMap[book];
      }
      const ch = String(v.chapter ?? v.Chapter ?? 1);
      const vs = String(v.verse ?? v.Verse ?? 1);
      const txt = String(v.text ?? v.Text ?? v.content ?? "").trim();
      
      if (!result[book]) result[book] = {};
      if (!result[book][ch]) result[book][ch] = {};
      result[book][ch][vs] = txt;
    }
    
    return result;
  }

  /**
   * Parses Format 2: ASV style with resultset
   * @param {Object} data - The JSON data with resultset
   * @returns {Object} - Normalized Bible data
   */
  function parseASVFormat(data) {
    const rows = data.resultset.row;
    const result = {};
    
    for (const row of rows) {
      const field = row.field;
      // field format: [verseId, bookNum, chapter, verse, text]
      const bookNum = field[1];
      let book = bookNumberMap[bookNum] || "Unknown";
      const ch = String(field[2]);
      const vs = String(field[3]);
      const txt = String(field[4] || "").trim();
      
      if (!result[book]) result[book] = {};
      if (!result[book][ch]) result[book][ch] = {};
      result[book][ch][vs] = txt;
    }
    
    return result;
  }

  /**
   * Parses Format 3: BBE style with chapter arrays
   * @param {Array} data - The JSON array of books with chapters
   * @returns {Object} - Normalized Bible data
   */
  function parseBBEFormat(data) {
    const result = {};
    
    for (const bookObj of data) {
      let bookName = bookObj.name || bookObj.Name;
      
      // If no name but has abbrev, try to map it
      if (!bookName && bookObj.abbrev) {
        bookName = bookAbbrevMap[bookObj.abbrev.toLowerCase()] || bookObj.abbrev;
      }
      
      if (!bookName) continue;
      
      result[bookName] = {};
      const chapters = bookObj.chapters || [];
      
      for (let chIdx = 0; chIdx < chapters.length; chIdx++) {
        const chNum = String(chIdx + 1);
        result[bookName][chNum] = {};
        const verses = chapters[chIdx];
        
        if (Array.isArray(verses)) {
          for (let vIdx = 0; vIdx < verses.length; vIdx++) {
            const vNum = String(vIdx + 1);
            result[bookName][chNum][vNum] = String(verses[vIdx] || "").trim();
          }
        }
      }
    }
    
    return result;
  }

  /**
   * Parses Format 5: Simple book objects
   * @param {Object} data - The JSON data with books array
   * @returns {Object} - Normalized Bible data
   */
  function parseSimpleBookObjects(data) {
    const books = data.books;
    const result = {};
    
    for (const bookObj of books) {
      const bookName = bookObj.name || bookObj.Name || "Unknown";
      result[bookName] = {};
      
      const verses = bookObj.verses || [];
      for (const v of verses) {
        const ch = String(v.chapter ?? v.Chapter ?? 1);
        const vs = String(v.verse ?? v.Verse ?? 1);
        const txt = String(v.text ?? v.Text ?? v.content ?? "").trim();
        
        if (!result[bookName][ch]) result[bookName][ch] = {};
        result[bookName][ch][vs] = txt;
      }
    }
    
    return result;
  }

  /**
   * Parses Format 6: Verse ID format
   * @param {Array} data - The JSON array of verses with verse_id
   * @returns {Object} - Normalized Bible data
   */
  function parseVerseIDFormat(data) {
    const result = {};
    
    for (const v of data) {
      const bookName = v.book_name || v.bookName || v.book || "Unknown";
      const txt = String(v.content ?? v.text ?? v.Text ?? "").trim();
      
      // Try to extract chapter and verse from verse_id (format: BBCCCVVV - 8 digits)
      let ch, vs;
      if (v.verse_id) {
        const verseId = String(v.verse_id);
        // Only parse if verse_id is reasonably sized (1-8 digits)
        if (verseId.length > 0 && verseId.length <= 8) {
          const paddedId = verseId.padStart(8, '0');
          // Parse: BB (book) CCC (chapter) VVV (verse)
          const CHAPTER_START = 2, CHAPTER_END = 5;
          const VERSE_START = 5, VERSE_END = 8;
          ch = String(parseInt(paddedId.substring(CHAPTER_START, CHAPTER_END)));
          vs = String(parseInt(paddedId.substring(VERSE_START, VERSE_END)));
        } else {
          // Fallback if verse_id format is unexpected
          ch = String(v.chapter ?? v.Chapter ?? 1);
          vs = String(v.verse ?? v.Verse ?? 1);
        }
      } else {
        ch = String(v.chapter ?? v.Chapter ?? 1);
        vs = String(v.verse ?? v.Verse ?? 1);
      }
      
      if (!result[bookName]) result[bookName] = {};
      if (!result[bookName][ch]) result[bookName][ch] = {};
      result[bookName][ch][vs] = txt;
    }
    
    return result;
  }

  /**
   * Main parser that auto-detects format and normalizes Bible JSON
   * @param {*} data - The raw parsed JSON data
   * @returns {Object} - Normalized Bible data in format { BookName: { chapter: { verse: text } } }
   */
  function parseBibleJSON(data) {
    // Validate first
    const validation = validateBibleJSON(data);
    
    if (!validation.success) {
      console.error("Bible JSON validation failed:", validation.error);
      console.error("Suggestions:", validation.suggestions);
      throw new Error(validation.error);
    }
    
    console.log(`✓ Detected Bible format: ${validation.format}`);
    console.log(`✓ Books found: ${validation.bookCount}`);
    
    // Parse based on detected format
    switch (validation.format) {
      case "KJV_VERSE_ARRAY":
        return parseKJVFormat(data);
      
      case "ASV_RESULTSET":
        return parseASVFormat(data);
      
      case "BBE_CHAPTER_ARRAYS":
        return parseBBEFormat(data);
      
      case "SIMPLE_BOOK_OBJECTS":
        return parseSimpleBookObjects(data);
      
      case "VERSE_ID_FORMAT":
        return parseVerseIDFormat(data);
      
      case "FLAT_VERSE_ARRAY":
        console.log("✓ Using fallback parser for flat verse array");
        return parseFlatArray(data);
      
      case "NORMALIZED":
        console.log("✓ Data is already normalized");
        // Filter out non-book keys
        const result = {};
        for (const key of Object.keys(data)) {
          if (key !== "metadata" && key !== "resultset" && key !== "verses" && key !== "books") {
            result[key] = data[key];
          }
        }
        return result;
      
      default:
        // Fallback: try to parse as flat array
        if (Array.isArray(data)) {
          console.warn("⚠ Unknown format, attempting fallback parse as verse array");
          return parseFlatArray(data);
        }
        
        throw new Error("Unable to parse Bible JSON - unrecognized format");
    }
  }

  /**
   * Parses a flat array of verses (fallback parser)
   * @param {Array} data - Array of verse objects
   * @returns {Object} - Normalized Bible data
   */
  function parseFlatArray(data) {
    const result = {};
    for (const v of data) {
      let book = v.book ?? v.Book ?? v.bookname ?? v.BookName ?? "Unknown";
      if (!isNaN(book) && bookNumberMap[book]) {
        book = bookNumberMap[book];
      }
      const ch = String(v.chapter ?? v.Chapter ?? 1);
      const vs = String(v.verse ?? v.Verse ?? 1);
      const txt = String(v.text ?? v.Text ?? v.content ?? "").trim();
      
      if (!result[book]) result[book] = {};
      if (!result[book][ch]) result[book][ch] = {};
      result[book][ch][vs] = txt;
    }
    return result;
  }

  versionSelect.addEventListener("change", async () => {
    const path = versionSelect.value;
    if (!path) return;
    
    try {
      console.log(`Loading Bible from: ${path}`);
      const res = await fetch(path);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Use the new parser to normalize the data
      bibleData = parseBibleJSON(data);
      
      populateBooks();
      console.log("✓ Bible loaded successfully");
    } catch (err) {
      const errorMsg = err.message || "Failed to load Bible version.";
      alert(`Error loading Bible: ${errorMsg}\n\nPlease check the console for details.`);
      console.error("Bible loading error:", err);
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
    verseSelect.innerHTML   = "";
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
    verseSelect.innerHTML = "";

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
    const selectedOptions = Array.from(verseSelect.selectedOptions);
    
    if (!selectedOptions.length) return;
    
    // Collect verse numbers and texts
    const verseNums = selectedOptions.map(opt => opt.value);
    const verseTexts = verseNums.map(v => bibleData[book][chapter][v]);
    
    // Concatenate verse texts with single space
    verseInput.value = verseTexts.join(" ");
    
    // Format reference as "Book Chapter:v1,v2,v3"
    refInput.value = `${book} ${chapter}:${verseNums.join(",")}`;
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
    const height = grid.length;
    const width = grid[0]?.length || 0;
    const endR = r + dy * (word.length - 1);
    const endC = c + dx * (word.length - 1);
    if (endR < 0 || endR >= height || endC < 0 || endC >= width) return false;
    for (let i = 0; i < word.length; i++) {
      const rr = r + dy * i, cc = c + dx * i;
      const existing = grid[rr][cc];
      if (existing && existing !== word[i]) return false;
    }
    return true;
  }

  function generateGrid(words, width = 14, height = 12) {
    const grid   = Array.from({ length: height }, () => Array(width).fill(null));
    const placed = []; // { word, cells:[{r,c}] }
    const dirs = [
      {dx:1,dy:0},{dx:0,dy:1},{dx:1,dy:1},
      {dx:-1,dy:0},{dx:0,dy:-1},{dx:-1,dy:-1},
      {dx:1,dy:-1},{dx:-1,dy:1}
    ];

    for (const w of words) {
      if (w.length > Math.max(width, height)) continue;
      let done = false;
      for (let tries = 0; tries < 500 && !done; tries++) {
        const d = dirs[Math.floor(Math.random() * dirs.length)];
        const r = Math.floor(Math.random() * height);
        const c = Math.floor(Math.random() * width);
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
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
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
    const m    = { l: 0.75, r: 0.75, t: 0.8, b: 0.8 };
    const innerW = page.w - m.l - m.r;
    const innerH = page.h - m.t - m.b;

    const height = grid.length;
    const width = grid[0]?.length || 0;
    const titleH = opts.title ? 0.35 : 0;
    const verseReserve = 2.0; // reserve space below for verse and reference
    const cellSize = Math.min(innerW / width, (innerH - titleH - verseReserve) / height) * 0.88;
    const gridW = cellSize * width, gridH = cellSize * height;
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
    for (let i = 1; i < width; i++) {
      doc.line(gridX + i * cellSize, gridY, gridX + i * cellSize, gridY + gridH);         // vertical
    }
    for (let i = 1; i < height; i++) {
      doc.line(gridX, gridY + i * cellSize, gridX + gridW, gridY + i * cellSize);         // horizontal
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
          const x = gridX + cc.c * cellSize;
          const y = gridY + cc.r * cellSize;
          doc.rect(x, y, cellSize, cellSize, "F"); // fill the cell (solid highlight)
        }
      }
    }

    // Letters
    const fontPt = Math.max(8, Math.min(48, cellSize * 72 * 0.66));
    doc.setFont(opts.fontFamily || "helvetica", "bold");
    doc.setFontSize(fontPt);
    doc.setTextColor(letterColor.r, letterColor.g, letterColor.b);
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const x = gridX + c * cellSize + cellSize / 2;
        const y = gridY + r * cellSize + cellSize / 2 + (fontPt / 72) * 0.3;
        doc.text(grid[r][c], x, y, { align: "center" });
      }
    }

    // Verse + reference
    let y = gridY + gridH + 1.5;
    doc.setFont(opts.fontFamily || "helvetica", "normal");
    doc.setFontSize(16);

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
    
    // Get and validate width and height
    const width = parseInt(widthInput.value, 10);
    const height = parseInt(heightInput.value, 10);
    
    if (isNaN(width) || width < 6 || width > 20) {
      messages.textContent = "Puzzle width must be between 6 and 20.";
      return;
    }
    if (isNaN(height) || height < 6 || height > 20) {
      messages.textContent = "Puzzle height must be between 6 and 20.";
      return;
    }

    if (!verse)       { messages.textContent = "Please paste or select a verse."; return; }
    if (!words.length){ messages.textContent = "Please provide at least one target word."; return; }

    const { grid, placed } = generateGrid(words, width, height);
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








