(() => {
  const el = (id) => document.getElementById(id);

  const titleInput = el("title");
  const verseInput = el("verse");
  const wordsInput = el("words");
  const refInput = el("reference");
  const btnGenerate = el("btnGenerate");
  const btnExport = el("btnExport");
  const btnClear = el("btnClear");
  const messages = el("messages");
  const previewTitle = el("previewTitle");
  const previewGrid = el("previewGrid");
  const previewVerse = el("previewVerse");
  const previewRef = el("previewReference");

  // Bible version loader
  let bibleData = {};
  const versionSelect = el("versionSelect");
  const bookSelect = el("bookSelect");
  const chapterSelect = el("chapterSelect");
  const verseSelect = el("verseSelect");

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
      let verses = data;
      if (data.verses && Array.isArray(data.verses)) verses = data.verses;

      if (Array.isArray(verses)) {
        bibleData = {};
        for (const v of verses) {
          let book = v.book || v.Book || "Unknown";
          if (!isNaN(book) && bookNumberMap[book]) book = bookNumberMap[book];
          const ch = (v.chapter || v.Chapter || 1).toString();
          const vs = (v.verse || v.Verse || 1).toString();
          const text = v.text || v.Text || "";
          if (!bibleData[book]) bibleData[book] = {};
          if (!bibleData[book][ch]) bibleData[book][ch] = {};
          bibleData[book][ch][vs] = text.trim();
        }
      } else {
        bibleData = data;
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
    verseSelect.innerHTML = "<option value=''>-- Select Verse --</option>";
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
    const book = bookSelect.value;
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
    const book = bookSelect.value;
    const chapter = chapterSelect.value;
    const verseNum = verseSelect.value;
    if (!verseNum) return;
    const verseText = bibleData[book][chapter][verseNum];
    verseInput.value = verseText;
    refInput.value = `${book} ${chapter}:${verseNum}`;
  });

  // Word Search core logic
  const sanitizeWord = (w) => w.toUpperCase().replace(/[^A-Z]/g, "").trim();
  const uniq = (arr) => [...new Set(arr)];
  const byLengthDesc = (a,b) => b.length - a.length;

  function parseWords(raw) {
    if (!raw) return [];
    return uniq(raw.split(/[\n,; ]+/g).map(sanitizeWord).filter(Boolean)).sort(byLengthDesc);
  }

  function generateGrid(words, N = 15) {
    const grid = Array.from({ length: N }, () => Array(N).fill(null));
    const placed = [];
    const dirs = [{dx:1,dy:0},{dx:0,dy:1},{dx:1,dy:1},{dx:-1,dy:0},{dx:0,dy:-1},{dx:-1,dy:-1}];
    for (const w of words) {
      if (w.length > N) continue;
      let placedOK = false;
      for (let tries=0; tries<300 && !placedOK; tries++) {
        const d = dirs[Math.floor(Math.random()*dirs.length)];
        const r = Math.floor(Math.random()*N);
        const c = Math.floor(Math.random()*N);
        const endR = r + d.dy*(w.length-1);
        const endC = c + d.dx*(w.length-1);
        if (endR<0||endR>=N||endC<0||endC>=N) continue;
        let fits=true;
        for (let i=0;i<w.length;i++){
          const rr=r+d.dy*i,cc=c+d.dx*i;
          if (grid[rr][cc] && grid[rr][cc]!==w[i]) { fits=false; break; }
        }
        if (!fits) continue;
        for (let i=0;i<w.length;i++) {
          const rr=r+d.dy*i,cc=c+d.dx*i;
          grid[rr][cc]=w[i];
        }
        placed.push({word:w});
        placedOK=true;
      }
    }
    const letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for(let r=0;r<N;r++) for(let c=0;c<N;c++)
      if(!grid[r][c]) grid[r][c]=letters[Math.floor(Math.random()*letters.length)];
    return grid;
  }

  function renderPreview(title, grid, verse, reference, words) {
    previewTitle.textContent = title || "Word Search";
    previewGrid.innerHTML = "";
    for (let r=0;r<grid.length;r++) {
      const tr = document.createElement("tr");
      for (let c=0;c<grid[r].length;c++) {
        const td = document.createElement("td");
        td.textContent = grid[r][c];
        tr.appendChild(td);
      }
      previewGrid.appendChild(tr);
    }
    previewVerse.innerHTML = verse.replace(
      new RegExp(words.join("|"), "gi"),
      (m) => `<span style='font-weight:bold;text-decoration:underline'>${m}</span>`
    );
    previewRef.textContent = reference;
  }

  // Buttons
  btnGenerate.addEventListener("click", () => {
    const title = titleInput.value.trim();
    const verse = verseInput.value.trim();
    const words = parseWords(wordsInput.value);
    const reference = refInput.value.trim();
    if (!verse) { messages.textContent = "Please paste or select a verse."; return; }
    if (!words.length) { messages.textContent = "Please provide at least one target word."; return; }
    const grid = generateGrid(words, 15);
    renderPreview(title, grid, verse, reference, words);
    messages.textContent = "Preview generated successfully.";
    btnExport.disabled = false;
    window._puzzleState = { title, grid, verse, reference, words };
  });

  btnExport.addEventListener("click", () => {
    if (!window._puzzleState) return alert("Generate a puzzle first!");
    const { jsPDF } = window.jspdf;
    const { title, grid, verse, reference } = window._puzzleState;
    const doc = new jsPDF({ unit: "in", format: "letter" });
    doc.setFont("helvetica", "bold");
    doc.text(title || "Word Search", 4.25, 0.75, { align: "center" });
    doc.text(reference, 4.25, 1.1, { align: "center" });
    let y = 1.5;
    grid.forEach(row => { doc.text(row.join(" "), 0.75, y); y += 0.22; });
    doc.text(verse, 0.75, y + 0.3, { maxWidth: 7 });
    doc.save(title ? `${title}.pdf` : "WordSearch.pdf");
  });

  btnClear.addEventListener("click", () => {
    titleInput.value = verseInput.value = wordsInput.value = refInput.value = "";
    previewGrid.innerHTML = previewTitle.textContent = previewVerse.textContent = previewRef.textContent = "";
    messages.textContent = "";
    btnExport.disabled = true;
  });
})();
