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

  // Default font constants
  const DEFAULT_TITLE_FONT = "Helvetica";
  const DEFAULT_GRID_FONT = "Courier";
  const DEFAULT_CLUE_FONT = "Times";

  // Font name to jsPDF-compatible font mapping
  const FONT_MAP = {
    "Helvetica": "helvetica",
    "Arial": "helvetica",
    "Times": "times",
    "Times New Roman": "times",
    "Courier": "courier",
    "Courier New": "courier",
    "Georgia": "times",
    "Palatino": "times",
    "Garamond": "times",
    "Bookman": "times",
    "Comic Sans MS": "helvetica",
    "Trebuchet MS": "helvetica",
    "Impact": "helvetica",
    "Monaco": "courier",
    "Consolas": "courier",
    "Lucida Console": "courier",
    "Baskerville": "times",
    "Caslon": "times",
    // Custom script fonts
    "Satisfy": "Satisfy",
    "Allura": "Allura",
    "Great Vibes": "GreatVibes",
    "Pacifico": "Pacifico"
  };

  // Set of custom font names for fallback detection
  const CUSTOM_FONT_NAMES = new Set(["Satisfy", "Allura", "GreatVibes", "Pacifico"]);

  // Custom fonts object (intentionally empty - see FONT_SETUP.md in root)
  const CUSTOM_FONTS = {};

  // Function to load custom fonts into jsPDF document
  function loadCustomFonts(doc) {
    try {
      // Custom fonts would be loaded here if CUSTOM_FONTS object has data
      return true;
    } catch (error) {
      console.error("Failed to load custom fonts:", error);
      return false;
    }
  }

  // Convert font names to jsPDF-compatible format
  function mapFontForPDF(fontName) {
    const mapped = FONT_MAP[fontName] || "helvetica";
    if (CUSTOM_FONT_NAMES.has(mapped) && !CUSTOM_FONTS[mapped]) {
      console.warn(`Custom font "${mapped}" not loaded, falling back to helvetica`);
      return "helvetica";
    }
    return mapped;
  }

  // UI Elements
  const titleInput = el("title");
  const refInput = el("reference");
  const wordInput = el("wordInput");
  const clueInput = el("clueInput");
  const btnAddWord = el("btnAddWord");
  const wordClueList = el("wordClueList");
  const verseText = el("verseText");
  
  // Word suggestion elements
  const btnSuggestWords = el("btnSuggestWords");
  const suggestedWordsContainer = el("suggestedWordsContainer");
  const suggestedWordsChips = el("suggestedWordsChips");
  const btnClearSuggestedWords = el("btnClearSuggestedWords");

  const titleFontInput = el("titleFont");
  const gridFontInput = el("gridFont");
  const clueFontInput = el("clueFont");
  const titleFontSizeInput = el("titleFontSize");
  const clueFontSizeInput = el("clueFontSize");
  const gridFontSizeInput = el("gridFontSize");
  const lineSpacingInput = el("lineSpacing");
  const marginTopInput = el("marginTop");
  const marginLeftInput = el("marginLeft");
  const marginRightInput = el("marginRight");
  const marginBottomInput = el("marginBottom");
  const gridColorInput = el("gridColor");
  const textColorInput = el("textColor");
  const numberColorInput = el("numberColor");

  const btnGenerate = el("btnGenerate");
  const btnExport = el("btnExport");
  const btnClear = el("btnClear");

  const messages = el("messages");
  const previewTitle = el("previewTitle");
  const previewGrid = el("previewGrid");
  const previewContainer = el("previewContainer");
  const acrossClues = el("acrossClues");
  const downClues = el("downClues");
  const previewRef = el("previewReference");

  // Word/clue pairs storage
  let wordCluePairs = [];

  // ------------------ Bible version loader ------------------
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
      
      if (firstBook.verse_id !== undefined || firstBook.book_name !== undefined) {
        return {
          success: true,
          format: "VERSE_ID_FORMAT",
          bookCount: new Set(data.map(v => v.book_name)).size,
          warnings: []
        };
      }
      
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

    if (!Array.isArray(data)) {
      const keys = Object.keys(data);
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

  function parseASVFormat(data) {
    const rows = data.resultset.row;
    const result = {};
    
    for (const row of rows) {
      const field = row.field;
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

  function parseBBEFormat(data) {
    const result = {};
    
    for (const bookObj of data) {
      let bookName = bookObj.name || bookObj.Name;
      
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

  function parseVerseIDFormat(data) {
    const result = {};
    
    for (const v of data) {
      const bookName = v.book_name || v.bookName || v.book || "Unknown";
      const txt = String(v.content ?? v.text ?? v.Text ?? "").trim();
      
      let ch, vs;
      if (v.verse_id) {
        const verseId = String(v.verse_id);
        if (verseId.length > 0 && verseId.length <= 8) {
          const paddedId = verseId.padStart(8, '0');
          const CHAPTER_START = 2, CHAPTER_END = 5;
          const VERSE_START = 5, VERSE_END = 8;
          ch = String(parseInt(paddedId.substring(CHAPTER_START, CHAPTER_END)));
          vs = String(parseInt(paddedId.substring(VERSE_START, VERSE_END)));
        } else {
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

  function parseBibleJSON(data) {
    const validation = validateBibleJSON(data);
    
    if (!validation.success) {
      console.error("Bible JSON validation failed:", validation.error);
      console.error("Suggestions:", validation.suggestions);
      throw new Error(validation.error);
    }
    
    console.log(`✓ Detected Bible format: ${validation.format}`);
    console.log(`✓ Books found: ${validation.bookCount}`);
    
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
        const result = {};
        for (const key of Object.keys(data)) {
          if (key !== "metadata" && key !== "resultset" && key !== "verses" && key !== "books") {
            result[key] = data[key];
          }
        }
        return result;
      default:
        if (Array.isArray(data)) {
          console.warn("⚠ Unknown format, attempting fallback parse as verse array");
          return parseFlatArray(data);
        }
        throw new Error("Unable to parse Bible JSON - unrecognized format");
    }
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
    verseSelect.innerHTML = "";
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
    const book = bookSelect.value;
    const chapter = chapterSelect.value;
    const selectedOptions = Array.from(verseSelect.selectedOptions);
    
    if (!selectedOptions.length) return;
    
    const verseNums = selectedOptions.map(opt => opt.value);
    const verseTexts = verseNums.map(v => bibleData[book][chapter][v]);
    
    const text = verseTexts.join(" ");
    verseText.value = text;
    
    // Enable/disable suggest words button based on verse text
    btnSuggestWords.disabled = text.trim().length === 0;
    
    // Auto-populate reference
    refInput.value = `${book} ${chapter}:${verseNums.join(",")}`;
  });

  // ------------------ Word/Clue Management ------------------
  
  // Helper function to show messages
  function showMessage(text, type = 'info') {
    messages.textContent = text;
    messages.style.color = type === 'error' ? 'var(--error-text)' : 
                           type === 'warning' ? 'orange' : 
                           type === 'success' ? 'green' : 'var(--text-primary)';
    
    // Clear message after 5 seconds
    setTimeout(() => {
      if (messages.textContent === text) {
        messages.textContent = '';
      }
    }, 5000);
  }
  
  // Extract suggested words from verse text
  function extractSuggestedWords(verseText) {
    // Common words to filter out
    const commonWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'is', 'was', 
      'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'should', 'could', 'may', 'might', 'can', 'shall', 
      'am', 'are', 'for', 'with', 'at', 'by', 'from', 'as', 'on', 'it',
      'he', 'she', 'they', 'them', 'his', 'her', 'their', 'this', 'that',
      'these', 'those', 'not', 'no', 'yes', 'if', 'then', 'than', 'all',
      'any', 'some', 'my', 'me', 'you', 'your', 'we', 'us', 'our', 'him',
      'into', 'up', 'out', 'who', 'what', 'when', 'where', 'which', 'why', 'how'
    ]);
    
    // Extract words
    const words = verseText.match(/[a-zA-Z]+/g) || [];
    const suggestions = [];
    const seen = new Set();
    
    for (const word of words) {
      const cleanWord = word.toUpperCase();
      const lowerWord = word.toLowerCase();
      
      // Filter: must be 4+ letters, not common, not duplicate
      if (cleanWord.length >= 4 && 
          !commonWords.has(lowerWord) && 
          !seen.has(cleanWord)) {
        
        // Find context snippet (portion of verse containing this word)
        const wordIndex = verseText.toLowerCase().indexOf(lowerWord);
        const contextStart = Math.max(0, wordIndex - 20);
        const contextEnd = Math.min(verseText.length, wordIndex + word.length + 30);
        let snippet = verseText.substring(contextStart, contextEnd);
        
        // Add ellipsis if truncated
        if (contextStart > 0) snippet = '...' + snippet;
        if (contextEnd < verseText.length) snippet = snippet + '...';
        
        suggestions.push({
          word: cleanWord,
          snippet: snippet.trim()
        });
        
        seen.add(cleanWord);
      }
    }
    
    // Sort by length (longest first)
    suggestions.sort((a, b) => b.word.length - a.word.length);
    
    return suggestions;
  }
  
  // Function to add word from suggestion (with empty clue)
  function addWordFromSuggestion(word) {
    // Check if word already exists in word-clue list
    const existingWords = wordCluePairs.map(pair => pair.word);
    
    if (existingWords.includes(word)) {
      showMessage(`"${word}" is already in your list`, 'warning');
      return;
    }
    
    // Add to word-clue list with empty clue
    wordCluePairs.push({ word, clue: '' });
    renderWordClueList();
    
    showMessage(`Added "${word}" to list - please add a clue`, 'success');
  }
  
  function sanitizeWord(word) {
    return word.toUpperCase().replace(/[^A-Z]/g, "").trim();
  }

  function validateWord(word) {
    if (!word || word.length < 2) {
      return { valid: false, error: "Word must be at least 2 letters" };
    }
    if (word.length > 15) {
      return { valid: false, error: "Word must be 15 letters or less" };
    }
    if (!/^[A-Z]+$/.test(word)) {
      return { valid: false, error: "Word must contain only letters A-Z" };
    }
    if (wordCluePairs.some(pair => pair.word === word)) {
      return { valid: false, error: "Word already added" };
    }
    return { valid: true };
  }

  function validateClue(clue) {
    if (!clue || clue.trim().length === 0) {
      return { valid: false, error: "Clue cannot be empty" };
    }
    if (clue.length > 200) {
      return { valid: false, error: "Clue must be 200 characters or less" };
    }
    return { valid: true };
  }

  function addWordClue() {
    const word = sanitizeWord(wordInput.value);
    const clue = clueInput.value.trim();
    
    const wordValidation = validateWord(word);
    if (!wordValidation.valid) {
      messages.textContent = wordValidation.error;
      return;
    }
    
    const clueValidation = validateClue(clue);
    if (!clueValidation.valid) {
      messages.textContent = clueValidation.error;
      return;
    }
    
    wordCluePairs.push({ word, clue });
    renderWordClueList();
    
    wordInput.value = "";
    clueInput.value = "";
    messages.textContent = "";
    wordInput.focus();
  }

  function removeWordClue(index) {
    wordCluePairs.splice(index, 1);
    renderWordClueList();
  }

  function renderWordClueList() {
    if (wordCluePairs.length === 0) {
      wordClueList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No words added yet</p>';
      return;
    }
    
    // Clear the list
    wordClueList.innerHTML = '';
    
    // Create word-clue items with editable input fields
    wordCluePairs.forEach((pair, index) => {
      const item = document.createElement('div');
      item.className = 'word-clue-item';
      item.dataset.word = pair.word;
      item.dataset.index = index;
      
      // Word display (bold, read-only)
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';
      wordSpan.textContent = pair.word;
      
      // Clue input field (editable)
      const clueInput = document.createElement('input');
      clueInput.type = 'text';
      clueInput.className = 'clue-input';
      clueInput.placeholder = `Enter clue for ${pair.word}`;
      clueInput.value = pair.clue;
      
      // Update wordCluePairs when clue input changes
      clueInput.addEventListener('input', (e) => {
        const currentIndex = parseInt(e.target.closest('.word-clue-item').dataset.index);
        wordCluePairs[currentIndex].clue = e.target.value.trim();
      });
      
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', (e) => {
        const currentIndex = parseInt(e.target.closest('.word-clue-item').dataset.index);
        removeWordClue(currentIndex);
      });
      
      // Assemble the item
      item.appendChild(wordSpan);
      item.appendChild(clueInput);
      item.appendChild(deleteBtn);
      
      wordClueList.appendChild(item);
      
      // Focus the clue input if it's empty (newly added from suggestion)
      if (!pair.clue) {
        clueInput.focus();
      }
    });
  }

  // Make removeWordClue globally accessible for inline onclick
  window.removeWordClue = removeWordClue;

  btnAddWord.addEventListener("click", addWordClue);
  
  // Allow Enter key in word or clue input to add
  wordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addWordClue();
    }
  });
  
  clueInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addWordClue();
    }
  });
  
  // ------------------ Word Suggestion Feature ------------------
  
  // Enable "Suggest Words" button when verse text is available
  verseText.addEventListener('input', () => {
    const hasText = verseText.value.trim().length > 0;
    btnSuggestWords.disabled = !hasText;
  });
  
  // Handle "Suggest Words" button click
  btnSuggestWords.addEventListener('click', () => {
    const verseTextValue = verseText.value.trim();
    if (!verseTextValue) return;
    
    // Extract suggestions
    const suggestions = extractSuggestedWords(verseTextValue);
    
    if (suggestions.length === 0) {
      showMessage('No significant words found in verses (need 4+ letter words)', 'warning');
      return;
    }
    
    // Clear previous suggestions
    suggestedWordsChips.innerHTML = '';
    
    // Create word chips
    suggestions.forEach(suggestion => {
      const chip = document.createElement('div');
      chip.className = 'word-chip';
      chip.dataset.word = suggestion.word;
      
      // Create word and snippet elements safely to avoid XSS
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word-chip-word';
      wordSpan.textContent = suggestion.word;
      
      const snippetSpan = document.createElement('span');
      snippetSpan.className = 'word-chip-snippet';
      snippetSpan.textContent = `"${suggestion.snippet}"`;
      
      chip.appendChild(wordSpan);
      chip.appendChild(snippetSpan);
      
      chip.addEventListener('click', () => {
        if (!chip.classList.contains('added')) {
          addWordFromSuggestion(suggestion.word);
          chip.classList.add('added');
        }
      });
      
      suggestedWordsChips.appendChild(chip);
    });
    
    // Show suggestions container
    suggestedWordsContainer.style.display = 'block';
    
    showMessage(`Found ${suggestions.length} suggested words - click to add`, 'success');
  });

  // ------------------ Crossword Generation Algorithm ------------------
  
  /**
   * Generates a traditional crossword puzzle from word/clue pairs
   * @param {Array} wordCluePairs - Array of {word, clue} objects
   * @returns {Object} - {grid, clueMap, acrossClues, downClues, gridSize}
   */
  function generateCrossword(wordCluePairs) {
    if (!wordCluePairs || wordCluePairs.length === 0) {
      throw new Error("No words provided for crossword generation");
    }
    
    // Sort words by length (longest first) for better placement
    const sortedPairs = [...wordCluePairs].sort((a, b) => b.word.length - a.word.length);
    
    // Calculate grid size based on total letters and word count
    const totalLetters = sortedPairs.reduce((sum, pair) => sum + pair.word.length, 0);
    const avgLength = totalLetters / sortedPairs.length;
    const estimatedSize = Math.ceil(Math.sqrt(totalLetters * 1.8));
    const gridSize = Math.max(10, Math.min(25, estimatedSize));
    
    console.log(`Generating ${gridSize}x${gridSize} crossword for ${sortedPairs.length} words`);
    
    // Initialize empty grid
    const grid = Array.from({ length: gridSize }, () => 
      Array.from({ length: gridSize }, () => ({ letter: null, black: true }))
    );
    
    // Track placed words: {word, clue, row, col, direction, number}
    const placedWords = [];
    
    // Place first word in center horizontally
    const firstPair = sortedPairs[0];
    const startRow = Math.floor(gridSize / 2);
    const startCol = Math.floor((gridSize - firstPair.word.length) / 2);
    
    placeWord(grid, firstPair.word, startRow, startCol, "across");
    placedWords.push({
      word: firstPair.word,
      clue: firstPair.clue,
      row: startRow,
      col: startCol,
      direction: "across",
      number: null // Will be assigned during numbering
    });
    
    // Try to place remaining words
    for (let i = 1; i < sortedPairs.length; i++) {
      const pair = sortedPairs[i];
      const placement = findBestPlacement(grid, pair.word, placedWords);
      
      if (placement) {
        placeWord(grid, pair.word, placement.row, placement.col, placement.direction);
        placedWords.push({
          word: pair.word,
          clue: pair.clue,
          row: placement.row,
          col: placement.col,
          direction: placement.direction,
          number: null
        });
      } else {
        console.warn(`Could not place word: ${pair.word}`);
      }
    }
    
    // Number the grid and organize clues
    const { clueMap, acrossClues, downClues } = numberGrid(grid, placedWords);
    
    return { grid, clueMap, acrossClues, downClues, gridSize, placedWords };
  }

  /**
   * Places a word on the grid
   */
  function placeWord(grid, word, row, col, direction) {
    for (let i = 0; i < word.length; i++) {
      const r = direction === "across" ? row : row + i;
      const c = direction === "across" ? col + i : col;
      grid[r][c].letter = word[i];
      grid[r][c].black = false;
    }
  }

  /**
   * Finds the best placement for a word by looking for intersections
   */
  function findBestPlacement(grid, word, placedWords) {
    const possibilities = [];
    
    // Try to find intersection with already placed words
    for (const placed of placedWords) {
      // Try intersecting with each letter of the placed word
      for (let i = 0; i < placed.word.length; i++) {
        const placedLetter = placed.word[i];
        
        // Find matching letters in new word
        for (let j = 0; j < word.length; j++) {
          if (word[j] === placedLetter) {
            // Try perpendicular placement
            const newDirection = placed.direction === "across" ? "down" : "across";
            
            let newRow, newCol;
            if (placed.direction === "across") {
              // Placed word is horizontal, new word goes vertical
              newRow = placed.row - j;
              newCol = placed.col + i;
            } else {
              // Placed word is vertical, new word goes horizontal
              newRow = placed.row + i;
              newCol = placed.col - j;
            }
            
            if (canPlaceWord(grid, word, newRow, newCol, newDirection)) {
              const score = calculatePlacementScore(grid, word, newRow, newCol, newDirection);
              possibilities.push({ row: newRow, col: newCol, direction: newDirection, score });
            }
          }
        }
      }
    }
    
    // Return best placement (highest score)
    // NO RANDOM FALLBACK - we only place words that intersect with existing words
    // This ensures all words in the crossword are connected (traditional crossword requirement)
    if (possibilities.length > 0) {
      possibilities.sort((a, b) => b.score - a.score);
      return possibilities[0];
    }
    
    // Return null if no valid intersection placement found
    return null;
  }

  /**
   * Checks if a word can be placed at the given position
   */
  function canPlaceWord(grid, word, row, col, direction) {
    const gridSize = grid.length;
    
    // Check bounds
    if (direction === "across") {
      if (col < 0 || col + word.length > gridSize || row < 0 || row >= gridSize) {
        return false;
      }
    } else {
      if (row < 0 || row + word.length > gridSize || col < 0 || col >= gridSize) {
        return false;
      }
    }
    
    // Check each cell
    for (let i = 0; i < word.length; i++) {
      const r = direction === "across" ? row : row + i;
      const c = direction === "across" ? col + i : col;
      const cell = grid[r][c];
      
      // Cell must be empty or have matching letter
      if (cell.letter !== null && cell.letter !== word[i]) {
        return false;
      }
    }
    
    // Check perpendicular conflicts (cells adjacent to word shouldn't have letters)
    for (let i = 0; i < word.length; i++) {
      const r = direction === "across" ? row : row + i;
      const c = direction === "across" ? col + i : col;
      
      // Skip if this position already has the same letter (intersection point)
      if (grid[r][c].letter === word[i]) continue;
      
      // Check cells perpendicular to word direction
      if (direction === "across") {
        // Check above and below
        if (r > 0 && grid[r - 1][c].letter !== null) return false;
        if (r < gridSize - 1 && grid[r + 1][c].letter !== null) return false;
      } else {
        // Check left and right
        if (c > 0 && grid[r][c - 1].letter !== null) return false;
        if (c < gridSize - 1 && grid[r][c + 1].letter !== null) return false;
      }
    }
    
    // Check before and after word
    if (direction === "across") {
      if (col > 0 && grid[row][col - 1].letter !== null) return false;
      if (col + word.length < gridSize && grid[row][col + word.length].letter !== null) return false;
    } else {
      if (row > 0 && grid[row - 1][col].letter !== null) return false;
      if (row + word.length < gridSize && grid[row + word.length][col].letter !== null) return false;
    }
    
    return true;
  }

  /**
   * Calculates a score for a placement (higher is better)
   */
  function calculatePlacementScore(grid, word, row, col, direction) {
    let score = 0;
    
    // Count intersections (prefer more intersections)
    for (let i = 0; i < word.length; i++) {
      const r = direction === "across" ? row : row + i;
      const c = direction === "across" ? col + i : col;
      if (grid[r][c].letter === word[i]) {
        score += 10; // Intersection bonus
      }
    }
    
    // Prefer positions closer to center
    const gridSize = grid.length;
    const center = gridSize / 2;
    const distanceFromCenter = Math.abs(row - center) + Math.abs(col - center);
    score -= distanceFromCenter * 0.5;
    
    return score;
  }

  /**
   * Numbers the grid and organizes clues
   */
  function numberGrid(grid, placedWords) {
    const gridSize = grid.length;
    let currentNumber = 1;
    const cellNumbers = {};
    const acrossClues = [];
    const downClues = [];
    
    // First pass: assign numbers to cells where words start
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = grid[r][c];
        if (cell.black) continue;
        
        // Check if any word starts here
        const wordsStartingHere = placedWords.filter(w => w.row === r && w.col === c);
        
        if (wordsStartingHere.length > 0) {
          cellNumbers[`${r},${c}`] = currentNumber;
          cell.number = currentNumber;
          
          // Assign number to words and add to clue lists
          wordsStartingHere.forEach(w => {
            w.number = currentNumber;
            if (w.direction === "across") {
              acrossClues.push({ number: currentNumber, clue: w.clue, word: w.word });
            } else {
              downClues.push({ number: currentNumber, clue: w.clue, word: w.word });
            }
          });
          
          currentNumber++;
        }
      }
    }
    
    // Sort clues by number
    acrossClues.sort((a, b) => a.number - b.number);
    downClues.sort((a, b) => a.number - b.number);
    
    return { clueMap: cellNumbers, acrossClues, downClues };
  }

  // ------------------ Preview Rendering ------------------
  
  function renderPreview(crosswordData, title, reference) {
    const { grid, acrossClues: acrossCluesList, downClues: downCluesList } = crosswordData;
    
    // Debug logging
    console.log("Rendering preview with data:", { 
      hasGrid: !!grid, 
      acrossCount: acrossCluesList?.length || 0, 
      downCount: downCluesList?.length || 0 
    });
    console.log("Across clues:", acrossCluesList);
    console.log("Down clues:", downCluesList);
    
    // Show preview container
    previewContainer.style.display = "block";
    
    // Render title
    previewTitle.textContent = title || "Crossword Puzzle";
    previewTitle.style.fontFamily = titleFontInput.value || DEFAULT_TITLE_FONT;
    
    // Render grid
    previewGrid.innerHTML = "";
    const gridFont = gridFontInput.value || DEFAULT_GRID_FONT;
    
    for (let r = 0; r < grid.length; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c];
        const td = document.createElement("td");
        
        if (cell.black) {
          td.className = "black";
        } else {
          td.className = "white";
          
          // Add cell number if present
          if (cell.number) {
            const numSpan = document.createElement("span");
            numSpan.className = "cell-number";
            numSpan.textContent = cell.number;
            td.appendChild(numSpan);
          }
          
          // Add letter
          if (cell.letter) {
            const letterSpan = document.createElement("span");
            letterSpan.className = "cell-letter";
            letterSpan.textContent = cell.letter;
            letterSpan.style.fontFamily = gridFont;
            td.appendChild(letterSpan);
          }
        }
        
        tr.appendChild(td);
      }
      previewGrid.appendChild(tr);
    }
    
    // Render clues
    const clueFont = clueFontInput.value || DEFAULT_CLUE_FONT;
    
    acrossClues.innerHTML = acrossCluesList && acrossCluesList.length > 0
      ? acrossCluesList.map(c => 
          `<div class="clue-item" style="font-family: ${clueFont}">
            <span class="clue-number">${c.number}.</span>${c.clue}
          </div>`
        ).join("")
      : '<p style="text-align: center; color: var(--text-secondary);">No across clues</p>';
    
    downClues.innerHTML = downCluesList && downCluesList.length > 0
      ? downCluesList.map(c => 
          `<div class="clue-item" style="font-family: ${clueFont}">
            <span class="clue-number">${c.number}.</span>${c.clue}
          </div>`
        ).join("")
      : '<p style="text-align: center; color: var(--text-secondary);">No down clues</p>';
    
    // Render reference
    previewRef.textContent = reference || "";
  }

  // ------------------ PDF Export ------------------
  
  function hexToRGB(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 };
  }

  function exportCrosswordPDFs(crosswordData, title, reference) {
    const { jsPDF } = window.jspdf;
    const { grid, acrossClues, downClues } = crosswordData;
    
    // Get configuration
    const titleFont = mapFontForPDF(titleFontInput.value || DEFAULT_TITLE_FONT);
    const gridFont = mapFontForPDF(gridFontInput.value || DEFAULT_GRID_FONT);
    const clueFont = mapFontForPDF(clueFontInput.value || DEFAULT_CLUE_FONT);
    
    const titleFontSize = parseFloat(titleFontSizeInput.value) || 20;
    const clueFontSize = parseFloat(clueFontSizeInput.value) || 11;
    const gridFontSize = parseFloat(gridFontSizeInput.value) || 14;
    const lineSpacing = parseFloat(lineSpacingInput.value) || 0.15;
    
    const marginTop = parseFloat(marginTopInput.value) || 0.5;
    const marginLeft = parseFloat(marginLeftInput.value) || 0.5;
    const marginRight = parseFloat(marginRightInput.value) || 0.5;
    const marginBottom = parseFloat(marginBottomInput.value) || 0.5;
    
    const gridColor = hexToRGB(gridColorInput.value);
    const textColor = hexToRGB(textColorInput.value);
    const numberColor = hexToRGB(numberColorInput.value);
    
    // Create Puzzle PDF (blank)
    const docPuzzle = new jsPDF({ unit: "in", format: "letter" });
    loadCustomFonts(docPuzzle);
    drawCrosswordPDF(docPuzzle, grid, acrossClues, downClues, {
      title, reference, titleFont, gridFont, clueFont,
      titleFontSize, clueFontSize, gridFontSize, lineSpacing,
      marginTop, marginLeft, marginRight, marginBottom,
      gridColor, textColor, numberColor,
      showLetters: false // Blank for puzzle
    });
    
    // Create Solution PDF (filled)
    const docSolution = new jsPDF({ unit: "in", format: "letter" });
    loadCustomFonts(docSolution);
    drawCrosswordPDF(docSolution, grid, acrossClues, downClues, {
      title, reference, titleFont, gridFont, clueFont,
      titleFontSize, clueFontSize, gridFontSize, lineSpacing,
      marginTop, marginLeft, marginRight, marginBottom,
      gridColor, textColor, numberColor,
      showLetters: true // Filled for solution
    });
    
    // Save PDFs
    const baseName = (title || "Crossword").trim().replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "_");
    docPuzzle.save(`${baseName}_Puzzle.pdf`);
    docSolution.save(`${baseName}_Solution.pdf`);
  }

  function drawCrosswordPDF(doc, grid, acrossClues, downClues, opts) {
    const page = { w: 8.5, h: 11 };
    const m = {
      top: opts.marginTop,
      left: opts.marginLeft,
      right: opts.marginRight,
      bottom: opts.marginBottom
    };
    
    let yPos = m.top;
    
    // Title
    if (opts.title) {
      doc.setFont(opts.titleFont, "bold");
      doc.setFontSize(opts.titleFontSize);
      doc.setTextColor(opts.textColor.r, opts.textColor.g, opts.textColor.b);
      doc.text(opts.title, page.w / 2, yPos, { align: "center" });
      yPos += 0.3;
    }
    
    // Calculate grid dimensions
    const gridSize = grid.length;
    const availableWidth = page.w - m.left - m.right;
    const cellSize = Math.min(0.35, availableWidth / gridSize);
    const gridWidth = cellSize * gridSize;
    const gridHeight = cellSize * gridSize;
    const gridX = m.left + (availableWidth - gridWidth) / 2;
    const gridY = yPos;
    
    // Draw grid
    doc.setLineWidth(0.01);
    doc.setDrawColor(opts.gridColor.r, opts.gridColor.g, opts.gridColor.b);
    
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = grid[r][c];
        const x = gridX + c * cellSize;
        const y = gridY + r * cellSize;
        
        if (cell.black) {
          // Fill black cells
          doc.setFillColor(0, 0, 0);
          doc.rect(x, y, cellSize, cellSize, "F");
        } else {
          // Draw white cell border
          doc.rect(x, y, cellSize, cellSize);
          
          // Add cell number
          if (cell.number) {
            doc.setFont(opts.gridFont, "normal");
            doc.setFontSize(6);
            doc.setTextColor(opts.numberColor.r, opts.numberColor.g, opts.numberColor.b);
            doc.text(String(cell.number), x + 0.02, y + 0.08);
          }
          
          // Add letter (if solution)
          if (opts.showLetters && cell.letter) {
            doc.setFont(opts.gridFont, "bold");
            doc.setFontSize(opts.gridFontSize);
            doc.setTextColor(opts.textColor.r, opts.textColor.g, opts.textColor.b);
            doc.text(cell.letter, x + cellSize / 2, y + cellSize / 2 + 0.05, { align: "center" });
          }
        }
      }
    }
    
    yPos = gridY + gridHeight + 0.3;
    
    // Draw clues
    doc.setFont(opts.clueFont, "normal");
    doc.setFontSize(opts.clueFontSize);
    doc.setTextColor(opts.textColor.r, opts.textColor.g, opts.textColor.b);
    
    // Check if we have space for clues on this page
    const remainingSpace = page.h - m.bottom - yPos;
    const clueHeight = opts.clueFontSize / 72 + opts.lineSpacing;
    
    if (remainingSpace > clueHeight * 3) {
      // Across clues
      if (acrossClues.length > 0) {
        doc.setFont(opts.clueFont, "bold");
        doc.text("ACROSS", m.left, yPos);
        yPos += clueHeight;
        
        doc.setFont(opts.clueFont, "normal");
        for (const clue of acrossClues) {
          if (yPos > page.h - m.bottom) break; // Stop if we run out of space
          const text = `${clue.number}. ${clue.clue}`;
          const lines = doc.splitTextToSize(text, availableWidth);
          doc.text(lines, m.left, yPos);
          yPos += lines.length * clueHeight;
        }
        
        yPos += 0.1; // Extra space before down clues
      }
      
      // Down clues
      if (downClues.length > 0 && yPos < page.h - m.bottom) {
        doc.setFont(opts.clueFont, "bold");
        doc.text("DOWN", m.left, yPos);
        yPos += clueHeight;
        
        doc.setFont(opts.clueFont, "normal");
        for (const clue of downClues) {
          if (yPos > page.h - m.bottom) break; // Stop if we run out of space
          const text = `${clue.number}. ${clue.clue}`;
          const lines = doc.splitTextToSize(text, availableWidth);
          doc.text(lines, m.left, yPos);
          yPos += lines.length * clueHeight;
        }
      }
    }
    
    // Reference
    if (opts.reference && yPos < page.h - m.bottom) {
      yPos += 0.1;
      doc.setFont(opts.clueFont, "italic");
      doc.setFontSize(opts.clueFontSize);
      doc.text(opts.reference, page.w / 2, yPos, { align: "center" });
    }
  }

  // ------------------ Button Handlers ------------------
  
  let lastCrosswordData = null;
  let lastTitle = null;
  let lastReference = null;

  btnGenerate.addEventListener("click", () => {
    try {
      messages.textContent = "";
      
      if (wordCluePairs.length === 0) {
        messages.textContent = "Please add at least one word/clue pair.";
        return;
      }
      
      // Check for words without clues
      const wordsWithoutClues = wordCluePairs.filter(pair => !pair.clue || pair.clue.trim() === '');
      if (wordsWithoutClues.length > 0) {
        const wordList = wordsWithoutClues.map(pair => pair.word).join(', ');
        messages.textContent = `Please add clues for: ${wordList}`;
        return;
      }
      
      // Generate crossword
      const crosswordData = generateCrossword(wordCluePairs);
      
      // Check if all words were placed
      const placedCount = crosswordData.placedWords.length;
      if (placedCount < wordCluePairs.length) {
        messages.textContent = `Warning: Only ${placedCount} of ${wordCluePairs.length} words were placed. Consider simplifying your word list.`;
      } else {
        messages.textContent = "Crossword generated successfully!";
      }
      
      // Render preview
      const title = titleInput.value.trim();
      const reference = refInput.value.trim();
      renderPreview(crosswordData, title, reference);
      
      // Enable export
      btnExport.disabled = false;
      
      // Save state
      lastCrosswordData = crosswordData;
      lastTitle = title;
      lastReference = reference;
      
    } catch (error) {
      console.error("Error generating crossword:", error);
      messages.textContent = `Error: ${error.message}`;
    }
  });

  btnExport.addEventListener("click", () => {
    if (!lastCrosswordData) {
      alert("Please generate a crossword first!");
      return;
    }
    
    try {
      exportCrosswordPDFs(lastCrosswordData, lastTitle, lastReference);
      messages.textContent = "PDFs exported successfully!";
    } catch (error) {
      console.error("Error exporting PDFs:", error);
      messages.textContent = `Export error: ${error.message}`;
    }
  });

  // Clear Suggested Words button
  btnClearSuggestedWords.addEventListener("click", () => {
    suggestedWordsContainer.style.display = "none";
    suggestedWordsChips.innerHTML = "";
    messages.textContent = "";
  });

  btnClear.addEventListener("click", () => {
    // Clear inputs
    titleInput.value = "";
    refInput.value = "";
    wordInput.value = "";
    clueInput.value = "";
    verseText.value = "";
    
    // Clear word/clue pairs
    wordCluePairs = [];
    renderWordClueList();
    
    // Clear word suggestions
    suggestedWordsContainer.style.display = "none";
    suggestedWordsChips.innerHTML = "";
    btnSuggestWords.disabled = true;
    
    // Clear preview
    previewContainer.style.display = "none";
    previewGrid.innerHTML = "";
    previewTitle.textContent = "";
    acrossClues.innerHTML = "";
    downClues.innerHTML = "";
    previewRef.textContent = "";
    
    // Reset state
    lastCrosswordData = null;
    lastTitle = null;
    lastReference = null;
    btnExport.disabled = true;
    messages.textContent = "";
  });
})();
