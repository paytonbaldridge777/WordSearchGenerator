(() => {
  // ---------------- Theme Toggle ------------------
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

  // ------------------ Main App ----------------
  const el = (id) => document.getElementById(id);

  // Default font constants
  const DEFAULT_TITLE_FONT = "Helvetica";
  const DEFAULT_PUZZLE_FONT = "Courier";
  const DEFAULT_VERSE_FONT = "Times";

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
    // Custom script fonts (loaded via loadCustomFonts)
    "Satisfy": "Satisfy",
    "Allura": "Allura",
    "Great Vibes": "GreatVibes",
    "Pacifico": "Pacifico"
  };

  // Set of custom font names for fallback detection
  const CUSTOM_FONT_NAMES = new Set(["Satisfy", "Allura", "GreatVibes", "Pacifico"]);

  // ==================== CUSTOM FONTS FOR jsPDF ====================
  // Base64-encoded font data for custom fonts
  // 
  // IMPORTANT: This object is intentionally empty. To enable custom fonts:
  //   1. Download .ttf file from Google Fonts (https://fonts.google.com/)
  //   2. Convert to base64: `base64 -w 0 fontname.ttf` or use online converter
  //   3. Add to CUSTOM_FONTS object below: "FontName": "base64string"
  //   4. Uncomment corresponding loading code in loadCustomFonts() function
  //   5. See FONT_SETUP.md for detailed instructions
  //
  // Until font data is added, custom fonts will fallback to helvetica.
  // This is expected behavior and allows the UI to show font options
  // while the infrastructure waits for font data to be added.
  
  const CUSTOM_FONTS = {
    // Example structure (actual base64 data should be added here):
    // "Satisfy": "AAEAAAASAQAABAAgRFNJRwAAAAEAAAS8AAAACEdERUYAMQBa..." 
    // Each font is approximately 200-400KB in base64 format
  };

  // Function to load custom fonts into jsPDF document
  // This must be called before any text is written to the PDF
  function loadCustomFonts(doc) {
    try {
      // Load custom fonts from CUSTOM_FONTS object
      // Uncomment and add base64 data to CUSTOM_FONTS above to enable custom fonts
      
      // Example for Satisfy font:
      // if (CUSTOM_FONTS["Satisfy"]) {
      //   doc.addFileToVFS("Satisfy.ttf", CUSTOM_FONTS["Satisfy"]);
      //   doc.addFont("Satisfy.ttf", "Satisfy", "normal");
      //   doc.addFont("Satisfy.ttf", "Satisfy", "bold");
      // }
      
      // Example for Allura font:
      // if (CUSTOM_FONTS["Allura"]) {
      //   doc.addFileToVFS("Allura.ttf", CUSTOM_FONTS["Allura"]);
      //   doc.addFont("Allura.ttf", "Allura", "normal");
      //   doc.addFont("Allura.ttf", "Allura", "bold");
      // }
      
      // Add similar code for GreatVibes, Pacifico, etc.
      
      return true;
    } catch (error) {
      console.error("Failed to load custom fonts:", error);
      return false;
    }
  }

  const titleInput = el("title");
  const verseInput = el("verse");
  const wordsInput = el("words");
  const refInput   = el("reference");
  const sizeInput = el("puzzleSize");
  const lineSpacingInput = el("lineSpacing");
  const titleFontInput = el("titleFont");
  const puzzleFontInput = el("puzzleFont");
  const verseFontInput = el("verseFont");
  const titleFontSizeInput = el("titleFontSize");
  const verseFontSizeInput = el("verseFontSize");
  const puzzleLetterFontSizeInput = el("puzzleLetterFontSize");
  const puzzleSizeMultiplierInput = el("puzzleSizeMultiplier");
  const puzzleVerseSpacingInput = el("puzzleVerseSpacing");
  const marginTopInput = el("marginTop");
  const marginLeftInput = el("marginLeft");
  const marginRightInput = el("marginRight");
  const marginBottomInput = el("marginBottom");

  const btnGenerate = el("btnGenerate");
  const btnExport   = el("btnExport");
  const btnClear    = el("btnClear");

  // Word suggestion elements
  const btnSuggestWords = el("btnSuggestWords");
  const suggestedWordsContainer = el("suggestedWordsContainer");
  const suggestedWordsChips = el("suggestedWordsChips");
  const btnClearTargetWords = el("btnClearTargetWords");
  const btnClearSuggestedWords = el("btnClearSuggestedWords");

  const messages    = el("messages");
  const previewTitle= el("previewTitle");
  const previewGrid = el("previewGrid");
  const previewVerse= el("previewVerse");
  const previewRef  = el("previewReference");

  // Common words to filter out from word suggestions
  const COMMON_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'is', 'was', 
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'should', 'could', 'may', 'might', 'can', 'shall', 
    'am', 'are', 'for', 'with', 'at', 'by', 'from', 'as', 'on', 'it',
    'he', 'she', 'they', 'them', 'his', 'her', 'their', 'this', 'that',
    'these', 'those', 'not', 'no', 'yes', 'if', 'then', 'than', 'all',
    'any', 'some', 'my', 'me', 'you', 'your', 'we', 'us', 'our', 'him',
    'into', 'up', 'out', 'who', 'what', 'when', 'where', 'which', 'why', 'how'
  ]);

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

  // ------------------ Translation Service ------------------
  async function translateText(text, targetLang) {
    if (targetLang === 'en' || !text) {
      return text; // No translation needed for English
    }
    
    try {
      const encodedText = encodeURIComponent(text);
      const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData) {
        return data.responseData.translatedText;
      } else if (data.responseStatus === 403) {
        console.warn('Translation quota exceeded, using original text');
        messages.textContent = 'Translation quota exceeded. Showing English text.';
        return text;
      } else {
        console.warn('Translation failed, using original text');
        messages.textContent = 'Translation unavailable. Showing English text.';
        return text;
      }
    } catch (error) {
      console.error('Translation error:', error);
      messages.textContent = 'Translation service unavailable. Showing English text.';
      return text; // Fallback to original text
    }
  }

  verseSelect.addEventListener("change", async () => {
    const book    = bookSelect.value;
    const chapter = chapterSelect.value;
    const selectedOptions = Array.from(verseSelect.selectedOptions);
    
    if (!selectedOptions.length) return;
    
    // Collect verse numbers and texts
    const verseNums = selectedOptions.map(opt => opt.value);
    const verseTexts = verseNums.map(v => bibleData[book][chapter][v]);
    
    // Concatenate verse texts with single space
    const originalText = verseTexts.join(" ");
    
    // Get selected language
    const targetLang = el("languageSelect").value;
    
    // Translate if needed
    const translatedText = await translateText(originalText, targetLang);
    verseInput.value = translatedText;
    
    // Enable "Suggest Words" button when verse text is populated
    if (btnSuggestWords) {
      btnSuggestWords.disabled = false;
    }
    
    // Format reference as "Book Chapter:v1,v2,v3"
    refInput.value = `${book} ${chapter}:${verseNums.join(",")}`;
  });

  // Re-translate verses when language changes
  const languageSelect = el("languageSelect");
  languageSelect.addEventListener("change", async () => {
    const currentVerse = verseInput.value.trim();
    if (!currentVerse) return; // No verse to translate
    
    const book = bookSelect.value;
    const chapter = chapterSelect.value;
    const selectedOptions = Array.from(verseSelect.selectedOptions);
    
    if (!selectedOptions.length || !book || !chapter) return;
    
    // Get original English text from Bible data
    const verseNums = selectedOptions.map(opt => opt.value);
    const verseTexts = verseNums.map(v => bibleData[book][chapter][v]);
    const originalText = verseTexts.join(" ");
    
    // Translate to new language
    const targetLang = languageSelect.value;
    const translatedText = await translateText(originalText, targetLang);
    verseInput.value = translatedText;
    
    // Update preview if it exists
    if (lastState) {
      lastState.verse = translatedText;
      const placedWords = lastState.placed.map(p => p.word);
      renderPreview(lastState.title, lastState.grid, translatedText, lastState.reference, lastState.lineSpacing, placedWords);
    }
  });

  // ------------------ Word Suggestion Feature ------------------
  function extractSuggestedWords(verseText) {
    // Extract words
    const words = verseText.match(/[a-zA-Z]+/g) || [];
    const suggestions = [];
    const seen = new Set();
    
    for (const word of words) {
      const cleanWord = word.toUpperCase();
      
      // Filter: must be 4+ letters, not common, not duplicate
      if (cleanWord.length >= 4 && 
          !COMMON_WORDS.has(word.toLowerCase()) && 
          !seen.has(cleanWord)) {
        
        suggestions.push({
          word: cleanWord
        });
        
        seen.add(cleanWord);
      }
    }
    
    // Sort by length (longest first)
    suggestions.sort((a, b) => b.word.length - a.word.length);
    
    return suggestions;
  }

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
    // Check both start and end positions are within bounds
    if (r < 0 || r >= height || c < 0 || c >= width) return false;
    if (endR < 0 || endR >= height || endC < 0 || endC >= width) return false;
    for (let i = 0; i < word.length; i++) {
      const rr = r + dy * i, cc = c + dx * i;
      const existing = grid[rr][cc];
      if (existing && existing !== word[i]) return false;
    }
    return true;
  }

  // Helper function to find common letters between a word and placed words
  function findCommonLetters(word, placedWords) {
    const intersections = [];
    for (const placed of placedWords) {
      for (let i = 0; i < word.length; i++) {
        for (let j = 0; j < placed.word.length; j++) {
          if (word[i] === placed.word[j]) {
            intersections.push({
              wordIdx: i,
              placedWord: placed.word,
              placedIdx: j,
              cell: placed.cells[j]
            });
          }
        }
      }
    }
    return intersections;
  }

  // Helper function to get available space in a direction from a position
  function getAvailableSpace(grid, r, c, dx, dy) {
    const height = grid.length;
    const width = grid[0]?.length || 0;
    let space = 0;
    let rr = r, cc = c;
    while (rr >= 0 && rr < height && cc >= 0 && cc < width) {
      if (grid[rr][cc]) break; // Cell is occupied
      space++;
      rr += dy;
      cc += dx;
    }
    return space;
  }

  // Try to place word by intersecting with already placed words
  function tryIntersectionPlacement(grid, word, placed, dirs) {
    const intersections = findCommonLetters(word, placed);
    if (intersections.length === 0) return false;

    // Shuffle intersections for randomness
    for (let i = intersections.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [intersections[i], intersections[j]] = [intersections[j], intersections[i]];
    }

    // Try each intersection point
    for (const inter of intersections) {
      const { wordIdx, cell } = inter;
      
      // Try each direction
      for (const d of dirs) {
        // Calculate starting position based on intersection
        const r = cell.r - d.dy * wordIdx;
        const c = cell.c - d.dx * wordIdx;
        
        if (canPlace(grid, word, r, c, d.dx, d.dy)) {
          const cells = [];
          for (let i = 0; i < word.length; i++) {
            const rr = r + d.dy * i, cc = c + d.dx * i;
            grid[rr][cc] = word[i];
            cells.push({ r: rr, c: cc });
          }
          placed.push({ word, cells });
          return true;
        }
      }
    }
    return false;
  }

  // Try smart random placement prioritizing areas with more space
  function trySmartRandomPlacement(grid, word, width, height, dirs, maxTries, placed) {
    // Build a list of positions with their available space scores
    const positions = [];
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        let score = 0;
        for (const d of dirs) {
          const space = getAvailableSpace(grid, r, c, d.dx, d.dy);
          if (space >= word.length) score += space;
        }
        if (score > 0) {
          positions.push({ r, c, score });
        }
      }
    }

    if (positions.length === 0) return false;

    // Sort by score (higher is better) but add some randomness
    positions.sort((a, b) => b.score - a.score);

    // Try positions, biased toward higher scores
    const tries = Math.min(maxTries, positions.length * dirs.length);
    for (let attempt = 0; attempt < tries; attempt++) {
      // Use weighted random selection favoring higher scores
      const idx = Math.floor(Math.pow(Math.random(), 2) * Math.min(positions.length, 50));
      const pos = positions[idx];
      const d = dirs[Math.floor(Math.random() * dirs.length)];
      
      if (canPlace(grid, word, pos.r, pos.c, d.dx, d.dy)) {
        const cells = [];
        for (let i = 0; i < word.length; i++) {
          const rr = pos.r + d.dy * i, cc = pos.c + d.dx * i;
          grid[rr][cc] = word[i];
          cells.push({ r: rr, c: cc });
        }
        placed.push({ word, cells });
        return true;
      }
    }
    return false;
  }

  function generateGrid(words, width = 14, height = 12) {
    const grid   = Array.from({ length: height }, () => Array(width).fill(null));
    const placed = []; // { word, cells:[{r,c}] }
    const failed = []; // words that couldn't be placed
    const dirs = [
      {dx:1,dy:0},{dx:0,dy:1},{dx:1,dy:1},
      {dx:-1,dy:0},{dx:0,dy:-1},{dx:-1,dy:-1},
      {dx:1,dy:-1},{dx:-1,dy:1}
    ];

    for (const w of words) {
      // Check if word is too long for grid
      if (w.length > Math.max(width, height)) {
        failed.push(w);
        continue;
      }

      let done = false;

      // Try intersection-based placement first (after first word)
      if (placed.length > 0) {
        done = tryIntersectionPlacement(grid, w, placed, dirs);
      }

      // Fall back to smart random placement
      if (!done) {
        done = trySmartRandomPlacement(grid, w, width, height, dirs, 300, placed);
      }

      // Track failed words
      if (!done) {
        failed.push(w);
      }
    }

    const ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (!grid[r][c]) grid[r][c] = ALPH[Math.floor(Math.random() * ALPH.length)];
      }
    }
    return { grid, placed, failed };
  }

  // ------------------ Preview ------------------
  function renderPreview(title, grid, verse, reference, lineSpacing, placedWords) {
    // Get selected fonts with fallback to defaults
    const titleFont = titleFontInput?.value || DEFAULT_TITLE_FONT;
    const puzzleFont = puzzleFontInput?.value || DEFAULT_PUZZLE_FONT;
    const verseFont = verseFontInput?.value || DEFAULT_VERSE_FONT;

    // Apply title
    previewTitle.textContent = title || "Word Search";
    previewTitle.style.fontFamily = titleFont;
    
    // Apply grid
    previewGrid.innerHTML = "";
    for (let r = 0; r < grid.length; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < grid[r].length; c++) {
        const td = document.createElement("td");
        td.textContent = grid[r][c];
        td.style.fontFamily = puzzleFont;
        tr.appendChild(td);
      }
      previewGrid.appendChild(tr);
    }

    // Bold + underline first occurrence of each target word in the verse
    // BUT only for words that were successfully placed
    const placedWordSet = new Set(placedWords || []);
    const used = new Set();
    previewVerse.innerHTML = verse.split(/\b/).map(tok => {
      const up = tok.toUpperCase().replace(/[^A-Z]/g, "");
      if (placedWordSet.has(up) && !used.has(up)) {
        used.add(up);
        return `<span style="font-weight:bold;text-decoration:underline">${tok}</span>`;
      }
      return tok;
    }).join("");

    // Apply verse font and line spacing
    previewVerse.style.fontFamily = verseFont;
    // Convert PDF spacing (inches) to a line-height multiplier
    // 0.3 inches ≈ 1.7 line-height is a reasonable conversion
    const lineHeight = 1 + (lineSpacing * 2.33); // scaling factor
    previewVerse.style.lineHeight = lineHeight.toString();

    previewRef.textContent = reference || "";
  }

  // ------------------ PDF helpers ------------------
  function hexToRGB(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) } : { r:0,g:0,b:0 };
  }

  // Convert font names to jsPDF-compatible format
  function mapFontForPDF(fontName) {
    const mapped = FONT_MAP[fontName] || "helvetica";
    // If it's a custom font, check if it's loaded
    // If not loaded, fallback to helvetica
    if (CUSTOM_FONT_NAMES.has(mapped) && !CUSTOM_FONTS[mapped]) {
      console.warn(`Custom font "${mapped}" not loaded, falling back to helvetica`);
      return "helvetica";
    }
    return mapped;
  }

  // Draw a real grid with centered letters; optionally highlight solution cells
  function drawPDFGrid(doc, grid, placed, opts, withHighlights, showVerse = true) {
    const page = { w: 8.5, h: 11 };
    const m = opts.margins || { top: 0.6, left: 0.6, right: 0.6, bottom: 0.6 };
    const innerW = page.w - m.left - m.right;
    const innerH = page.h - m.top - m.bottom;

    const height = grid.length;
    const width = grid[0]?.length || 0;
    const titleH = opts.title ? 0.35 : 0;
    const verseReserve = opts.puzzleVerseSpacing || 0.75; // configurable space between puzzle grid and verse
    const puzzleSizeMultiplier = opts.puzzleSizeMultiplier || 0.88;
    const cellSize = Math.min(innerW / width, (innerH - titleH - verseReserve) / height) * puzzleSizeMultiplier;
    const gridW = cellSize * width, gridH = cellSize * height;
    const gridX = m.left + (innerW - gridW) / 2;
    const gridY = m.top + (titleH ? titleH + 0.15 : 0);

    const gridColor = hexToRGB("#000000");
    const letterColor = hexToRGB("#000000");
    const hiColor = hexToRGB("#e6c200");

    // Title
    if (opts.title) {
      const titleFont = mapFontForPDF(opts.titleFont || DEFAULT_TITLE_FONT);
      doc.setFont(titleFont, "bold");
      doc.setFontSize(opts.titleFontSize || 22);
      doc.text(opts.title, page.w / 2, m.top + 0.2, { align: "center" });
    }

    // Outer border + cell lines
    doc.setLineWidth(0.015);
    doc.setDrawColor(gridColor.r, gridColor.g, gridColor.b);
    doc.rect(gridX, gridY, gridW, gridH);
    //for (let i = 1; i < width; i++) {
     // doc.line(gridX + i * cellSize, gridY, gridX + i * cellSize, gridY + gridH);         // vertical
    //}
    //for (let i = 1; i < height; i++) {
    //  doc.line(gridX, gridY + i * cellSize, gridX + gridW, gridY + i * cellSize);         // horizontal
    //}

    // Solution highlights - draw tightly fitted capsule-style rounded rectangles for each word
    if (withHighlights && placed?.length) {
      // ==================== TUNABLE PARAMETERS ====================
      // These parameters control the appearance of the word highlight capsules.
      //
      // Visual representation of a horizontal word bar:
      //   ┌─────┬─────┬─────┬─────┐
      //   │  L  │  O  │  R  │  D  │  <- Grid cells
      //   └─────┴─────┴─────┴─────┘
      //   ╭────────────────────────╮  <- Capsule bar
      //   │ L     O     R     D    │     (rounded ends, covers entire cells)
      //   ╰────────────────────────╯
      //
      // The bar extends from the left edge of the first cell to the right edge
      // of the last cell, with rounded semicircle ends (capsule style).
      
      // Bar colors (RGB 0-255)
      const rectFillColor = { r: 200, g: 200, b: 200 };     // Light grey fill (semi-transparent appearance)
      const rectBorderColor = { r: 120, g: 120, b: 120 };   // Darker grey border for definition
      
      // Bar opacity (0.0 to 1.0)
      // Semi-transparent so overlapping bars are visible and stack naturally
      const barOpacity = 0.5;
      
      // Bar thickness as percentage of cell size (0.0 to 1.0)
      // Tunable constant for easy adjustment. Set to 0.85 (85%) for slight spacing
      // between parallel/adjacent words while maintaining visual coverage.
      const BAR_THICKNESS_PERCENT = 0.85;
      
      // Corner radius for capsule ends (in inches)
      // Set to (cellSize * BAR_THICKNESS_PERCENT) / 2 for perfect semicircle ends
      const cornerRadius = (cellSize * BAR_THICKNESS_PERCENT) / 2;
      
      // Bar extension beyond cell centers (in inches)
      // This ensures the bar covers the ENTIRE first and last letter cell.
      // Calculation: bar runs from (firstCellCenter - barExtension) to (lastCellCenter + barExtension)
      // With barExtension = cellSize/2, this means bar runs from edge to edge of cells
      const barExtension = cellSize / 2;
      const diagonalBarExtension = cellSize / 6.5;  // Shorter for diagonals only

      
      // Bar thickness (in inches)
      // Set to BAR_THICKNESS_PERCENT * cellSize (85% by default) for minimal gaps
      // between adjacent parallel words while maintaining clean separation
      const barThickness = cellSize * BAR_THICKNESS_PERCENT;
      
      // Border width (in inches)
      const borderWidth = 0.01;
      
      // ============================================================
      
      // Set opacity for semi-transparent bars
      doc.setGState(new doc.GState({ opacity: barOpacity }));
      
      doc.setLineWidth(borderWidth);
      
      // Draw a capsule-shaped bar for each placed word independently
      for (const p of placed) {
        if (!p.cells || p.cells.length === 0) continue;
        
        // Get start and end cells
        const startCell = p.cells[0];
        const endCell = p.cells[p.cells.length - 1];
        
        // Calculate the direction vector
        const dr = endCell.r - startCell.r;
        const dc = endCell.c - startCell.c;
        const wordLength = p.cells.length;
        
        // Determine if word is horizontal, vertical, or diagonal
        const isHorizontal = dr === 0;
        const isVertical = dc === 0;
        
        doc.setFillColor(rectFillColor.r, rectFillColor.g, rectFillColor.b);
        doc.setDrawColor(rectBorderColor.r, rectBorderColor.g, rectBorderColor.b);
        doc.setGState(new doc.GState({ opacity: barOpacity }));
        
        // For horizontal and vertical words, draw a simple capsule using roundedRect
        if (isHorizontal) {
          // Horizontal word capsule
          // Start from center of first cell, extend to center of last cell, then add extensions
          const startCellCenterX = gridX + startCell.c * cellSize + cellSize / 2;
          const endCellCenterX = gridX + endCell.c * cellSize + cellSize / 2;
          const rowCenterY = gridY + startCell.r * cellSize + cellSize / 2;
          
          // Calculate bar position: extend from barExtension before first center to barExtension after last center
          const rectX = Math.min(startCellCenterX, endCellCenterX) - barExtension;
          const rectY = rowCenterY - barThickness / 2;
          const rectW = Math.abs(endCellCenterX - startCellCenterX) + 2 * barExtension;
          const rectH = barThickness;
          
          doc.roundedRect(rectX, rectY, rectW, rectH, cornerRadius, cornerRadius, 'FD');
        } else if (isVertical) {
          // Vertical word capsule
          // Start from center of first cell, extend to center of last cell, then add extensions
          const colCenterX = gridX + startCell.c * cellSize + cellSize / 2;
          const startCellCenterY = gridY + startCell.r * cellSize + cellSize / 2;
          const endCellCenterY = gridY + endCell.r * cellSize + cellSize / 2;
          
          // Calculate bar position: extend from barExtension before first center to barExtension after last center
          const rectX = colCenterX - barThickness / 2;
          const rectY = Math.min(startCellCenterY, endCellCenterY) - barExtension;
          const rectW = barThickness;
          const rectH = Math.abs(endCellCenterY - startCellCenterY) + 2 * barExtension;
          
          doc.roundedRect(rectX, rectY, rectW, rectH, cornerRadius, cornerRadius, 'FD');
        } else {
          // Diagonal word - draw a capsule with rounded ends using stroked lines with round caps
          // This approach gives us perfectly rounded ends matching horizontal/vertical bars
          
          // Calculate cell centers for start and end
          const startCellCenterX = gridX + startCell.c * cellSize + cellSize / 2;
          const startCellCenterY = gridY + startCell.r * cellSize + cellSize / 2;
          const endCellCenterX = gridX + endCell.c * cellSize + cellSize / 2;
          const endCellCenterY = gridY + endCell.r * cellSize + cellSize / 2;
          
          // Calculate the direction vector and normalize it
          const dx = endCellCenterX - startCellCenterX;
          const dy = endCellCenterY - startCellCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const unitX = dx / distance;
          const unitY = dy / distance;
          
          // Calculate start and end points with extension
          const lineStartX = startCellCenterX - unitX * diagonalBarExtension;
          const lineStartY = startCellCenterY - unitY * diagonalBarExtension;
          const lineEndX = endCellCenterX + unitX * diagonalBarExtension;
          const lineEndY = endCellCenterY + unitY * diagonalBarExtension;
          
           // For diagonal - SINGLE line with correct opacity (no border/fill layering)
          doc.setDrawColor(rectFillColor.r, rectFillColor.g, rectFillColor.b);
          doc.setGState(new doc.GState({ opacity: barOpacity, 'stroke-opacity': barOpacity })); // 0.5 only!
          doc.setLineWidth(barThickness);
          doc.setLineCap('round');
          doc.line(lineStartX, lineStartY, lineEndX, lineEndY, 'S');
          
          // Draw the fill line on top at desired opacity
          doc.setDrawColor(rectFillColor.r, rectFillColor.g, rectFillColor.b);
          doc.setGState(new doc.GState({ opacity: .3, 'stroke-opacity': .3 })); // 0.5 opacity for fill
          doc.setLineWidth(barThickness);
          doc.setLineCap('round');
          doc.line(lineStartX, lineStartY, lineEndX, lineEndY, 'S');
          
          // Reset line width for subsequent operations
          doc.setLineWidth(borderWidth);
        }
      }
      
      // Reset opacity to full for letters and verse text
      doc.setGState(new doc.GState({ opacity: 1.0 }));
    }

    // Letters - use configured font size or auto-calculate based on cell size
    const letterSizePercent = (opts.puzzleLetterFontSize && opts.puzzleLetterFontSize > 0) 
      ? opts.puzzleLetterFontSize / 100 
      : 0.66;
    const fontPt = Math.max(8, Math.min(48, cellSize * 72 * letterSizePercent));
    
    // Build a set of answer cell coordinates for quick lookup
    const answerCells = new Set();
    if (withHighlights && placed?.length) {
      for (const p of placed) {
        for (const cc of p.cells) {
          answerCells.add(cc.r + "_" + cc.c);
        }
      }
    }
    
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const x = gridX + c * cellSize + cellSize / 2;
        const y = gridY + r * cellSize + cellSize / 2 + (fontPt / 72) * 0.3;
        const key = r + "_" + c;
        const isAnswer = answerCells.has(key);
        
        const puzzleFont = mapFontForPDF(opts.puzzleFont || DEFAULT_PUZZLE_FONT);
        
        if (withHighlights) {
          // For solution page: bold answer letters, grey non-answer letters
          if (isAnswer) {
            doc.setFont(puzzleFont, "bold");
            doc.setFontSize(fontPt);
            doc.setTextColor(letterColor.r, letterColor.g, letterColor.b); // Black
          } else {
            doc.setFont(puzzleFont, "normal");
            doc.setFontSize(fontPt);
            doc.setTextColor(220, 220, 220); // Light grey
          }
        } else {
          // For puzzle page: all letters black and bold
          doc.setFont(puzzleFont, "bold");
          doc.setFontSize(fontPt);
          doc.setTextColor(letterColor.r, letterColor.g, letterColor.b);
        }
        
        doc.text(grid[r][c], x, y, { align: "center" });
      }
    }

    // Verse + reference (only show on puzzle page, not solution page)
    if (showVerse) {
      const verseFont = mapFontForPDF(opts.verseFont || DEFAULT_VERSE_FONT);
      const verseFontSize = opts.verseFontSize || 18;
      let y = gridY + gridH + (opts.puzzleVerseSpacing || 0.75);
      doc.setFont(verseFont, "normal");
      doc.setFontSize(verseFontSize);

      // Bold + underline the first occurrence of each target word
      // BUT only for words that were successfully placed
      const placedWordSet = new Set(placed.map(p => p.word));
      const used = new Set();
      const tokens = (opts.verse || "").split(/\s+/);
      let line = [], lineW = 0;
      const maxW = innerW;

      function flushLine() {
        if (!line.length) return;
        let cursorX = m.left;  // Start at left margin instead of center
        for (const seg of line) {
          doc.setFont(verseFont, seg.bold ? "bold" : "normal");
          doc.setFontSize(verseFontSize);  // Use configured verse font size
          doc.text(seg.text, cursorX, y, { baseline: "alphabetic" });
          if (seg.bold) {
            doc.setLineWidth(0.015);
            doc.line(cursorX, y + 0.03, cursorX + doc.getTextWidth(seg.text), y + 0.03);
          }
          cursorX += doc.getTextWidth(seg.text + " ");
        }
        y += (opts.lineSpacing || 0.3) * 4; line = []; lineW = 0;
      }

      for (const raw of tokens) {
        const up = raw.toUpperCase().replace(/[^A-Z]/g, "");
        const bold = placedWordSet.has(up) && !used.has(up);
        if (bold) used.add(up);
        const w = doc.getTextWidth(raw + " ");
        if (lineW + w > maxW) flushLine();
        line.push({ text: raw, bold });
        lineW += w;
      }
      flushLine();

      if (opts.reference) {
        doc.setFont(verseFont, "italic");
        doc.setFontSize(verseFontSize);
        doc.text(opts.reference, m.left, y + 0.3, { align: "left" });
      }
    }
  }

  function exportPDFs(state) {
    const { jsPDF } = window.jspdf;
    const { title, grid, placed, verse, reference, words, lineSpacing,
            titleFont, puzzleFont, verseFont,
            titleFontSize, verseFontSize, puzzleLetterFontSize,
            puzzleVerseSpacing, puzzleSizeMultiplier, marginTop, marginLeft, marginRight, marginBottom } = state;

    const opts = {
      title,
      verse,
      reference,
      words,
      titleFont,
      puzzleFont,
      verseFont,
      lineSpacing: lineSpacing || 0.3,
      titleFontSize: titleFontSize || 22,
      verseFontSize: verseFontSize || 18,
      puzzleLetterFontSize: puzzleLetterFontSize || 66,
      puzzleSizeMultiplier: puzzleSizeMultiplier || 0.88,
      puzzleVerseSpacing: puzzleVerseSpacing || 0.75,
      margins: {
        top: marginTop || 0.6,
        left: marginLeft || 0.6,
        right: marginRight || 0.6,
        bottom: marginBottom || 0.6
      }
    };

    // Puzzle
    const docPuzzle = new jsPDF({ unit: "in", format: "letter" });
    loadCustomFonts(docPuzzle); // Load custom fonts into the PDF document
    drawPDFGrid(docPuzzle, grid, placed, opts, false, true);  // Show verse on puzzle page

    // Solution
    const docSolution = new jsPDF({ unit: "in", format: "letter" });
    loadCustomFonts(docSolution); // Load custom fonts into the PDF document
    drawPDFGrid(docSolution, grid, placed, opts, true, false);  // Don't show verse on solution page

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
    
    // Get and validate size
    const size = parseInt(sizeInput.value, 10);
    
    if (isNaN(size) || size < 6 || size > 20) {
      messages.textContent = "Puzzle size must be between 6 and 20.";
      return;
    }

    // Get configuration values
    const titleFont = titleFontInput?.value || DEFAULT_TITLE_FONT;
    const puzzleFont = puzzleFontInput?.value || DEFAULT_PUZZLE_FONT;
    const verseFont = verseFontInput?.value || DEFAULT_VERSE_FONT;
    const lineSpacing = parseFloat(lineSpacingInput.value) || 0.3;
    const titleFontSize = parseFloat(titleFontSizeInput.value) || 22;
    const verseFontSize = parseFloat(verseFontSizeInput.value) || 18;
    const puzzleLetterFontSize = parseFloat(puzzleLetterFontSizeInput.value) || 66;
    const puzzleSizeMultiplier = parseFloat(puzzleSizeMultiplierInput.value) || 0.88;
    const puzzleVerseSpacing = parseFloat(puzzleVerseSpacingInput.value) || 0.75;
    const marginTop = parseFloat(marginTopInput.value) || 0.6;
    const marginLeft = parseFloat(marginLeftInput.value) || 0.6;
    const marginRight = parseFloat(marginRightInput.value) || 0.6;
    const marginBottom = parseFloat(marginBottomInput.value) || 0.6;

    if (!verse)       { messages.textContent = "Please paste or select a verse."; return; }
    if (!words.length){ messages.textContent = "Please provide at least one target word."; return; }

    const { grid, placed, failed } = generateGrid(words, size, size);
    const placedWords = placed.map(p => p.word);
    renderPreview(title, grid, verse, reference, lineSpacing, placedWords);
    
    // Check if any words failed to place and notify user
    if (failed.length > 0) {
      const failedList = failed.join(", ");
      messages.textContent = `⚠️ Warning: The following words could not be placed: ${failedList}. Try increasing the puzzle size or removing some words.`;
      messages.style.color = "var(--error-text)";
    } else {
      messages.textContent = "Preview generated successfully.";
      messages.style.color = "var(--text-primary)";
    }
    
    btnExport.disabled = false;

    lastState = { 
      title, grid, placed, verse, reference, words, lineSpacing,
      titleFont, puzzleFont, verseFont,
      titleFontSize, verseFontSize, puzzleLetterFontSize, 
      puzzleVerseSpacing, puzzleSizeMultiplier, marginTop, marginLeft, marginRight, marginBottom
    };
  });

  btnExport.addEventListener("click", () => {
    if (!lastState) { alert("Generate a puzzle first!"); return; }
    exportPDFs(lastState);
  });

  // ------------------ Word Suggestion Event Handlers ------------------
  // Enable "Suggest Words" button when verse text is available
  if (verseInput && btnSuggestWords) {
    verseInput.addEventListener('input', () => {
      const hasText = verseInput.value.trim().length > 0;
      btnSuggestWords.disabled = !hasText;
    });
  }

  // Handle "Suggest Words" button click
  if (btnSuggestWords) {
    btnSuggestWords.addEventListener('click', () => {
      const verseText = verseInput.value.trim();
      if (!verseText) return;
      
      // Extract suggestions
      const suggestions = extractSuggestedWords(verseText);
      
      if (suggestions.length === 0) {
        messages.textContent = 'No significant words found in verses (need 4+ letter words)';
        return;
      }
      
      // Clear previous suggestions
      suggestedWordsChips.innerHTML = '';
      
      // Create word chips (simplified - no snippet)
      suggestions.forEach(suggestion => {
        const chip = document.createElement('div');
        chip.className = 'word-chip';
        chip.dataset.word = suggestion.word;
        chip.textContent = suggestion.word;
        
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
      
      messages.textContent = `Found ${suggestions.length} suggested words - click to add`;
      messages.style.color = 'green';
      setTimeout(() => { messages.textContent = ''; }, 5000);
    });
  }

  // Function to add word from suggestion to words textarea
  function addWordFromSuggestion(word) {
    const currentWords = wordsInput.value.trim();
    
    // Check if word already exists - use Set for O(1) lookup performance
    const existingWordsSet = new Set(
      currentWords
        .split(/[\n,]+/)
        .map(w => w.trim().toUpperCase())
        .filter(w => w.length > 0)
    );
    
    if (existingWordsSet.has(word)) {
      messages.textContent = `"${word}" is already in your word list`;
      messages.style.color = 'orange';
      setTimeout(() => { messages.textContent = ''; }, 3000);
      return;
    }
    
    // Add word to textarea (comma-separated or new line)
    if (currentWords.length > 0) {
      // Add comma if last character isn't comma or newline
      if (!currentWords.endsWith(',') && !currentWords.endsWith('\n')) {
        wordsInput.value += ', ';
      } else if (currentWords.endsWith(',')) {
        wordsInput.value += ' ';
      }
    }
    
    wordsInput.value += word;
    
    messages.textContent = `Added "${word}" to word list`;
    messages.style.color = 'green';
    setTimeout(() => { messages.textContent = ''; }, 2000);
  }

  // Clear Target Words button
  btnClearTargetWords.addEventListener("click", () => {
    wordsInput.value = "";
    messages.textContent = "";
  });

  // Clear Suggested Words button
  btnClearSuggestedWords.addEventListener("click", () => {
    suggestedWordsContainer.style.display = "none";
    suggestedWordsChips.innerHTML = "";
    messages.textContent = "";
  });

  btnClear.addEventListener("click", () => {
    titleInput.value = verseInput.value = wordsInput.value = refInput.value = "";
    previewGrid.innerHTML = "";
    previewTitle.textContent = "";
    previewVerse.textContent = "";
    previewRef.textContent = "";
    messages.textContent = "";
    suggestedWordsContainer.style.display = "none";
    suggestedWordsChips.innerHTML = "";
    btnExport.disabled = true;
    lastState = null;
  });
})();





























