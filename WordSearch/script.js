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
	
	
  let lastGrid = null, lastPlaced = [], lastWords = [], lastOptions = null, lastVerse = "", lastReference = "";

  const el = (id) => document.getElementById(id);

  const titleInput = el("title");
  const verseInput = el("verse");
  const wordsInput = el("words");
  const refInput = el("reference");
  const lineSpacingInput = el("lineSpacing");

  const gridSizeSel = el("gridSize");
  const fontFamilySel = el("fontFamily");
  const allowH = el("allowH");
  const allowV = el("allowV");
  const allowD = el("allowD");
  const allowBack = el("allowBack");

  const letterColorInp = el("letterColor");
  const gridColorInp = el("gridColor");
  const highlightColorInp = el("circleColor");

  const btnGenerate = el("btnGenerate");
  const btnExport = el("btnExport");
  const btnClear = el("btnClear");

  const previewTitle = el("previewTitle");
  const previewGrid = el("previewGrid");
  const previewVerse = el("previewVerse");
  const previewRef = el("previewReference");
  const messages = el("messages");

  // --- helpers ---
  const sanitizeWord = (w) => w.toUpperCase().replace(/[^A-Z]/g, "").trim();
  const uniq = (arr) => [...new Set(arr)];
  const byLengthDesc = (a,b) => b.length - a.length;
  const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));

  // Font name to jsPDF-compatible font mapping
  const FONT_MAP = {
    "helvetica": "helvetica",
    "times": "times",
    "courier": "courier",
    "arial": "helvetica",
    "georgia": "times",
    "palatino": "times",
    "garamond": "times",
    "bookman": "times",
    "comic-sans": "helvetica",
    "trebuchet": "helvetica",
    "impact": "helvetica",
    "monaco": "courier",
    "consolas": "courier",
    "lucida-console": "courier",
    // Custom script fonts (loaded via loadCustomFonts)
    "satisfy": "Satisfy",
    "allura": "Allura",
    "great-vibes": "GreatVibes",
    "pacifico": "Pacifico"
  };

  // ==================== CUSTOM FONTS FOR jsPDF ====================
  const CUSTOM_FONTS = {
    // Example structure (actual base64 data should be added here):
    // "Satisfy": "AAEAAAASAQAABAAgRFNJRwAAAAEAAAS8AAAACEdERUYAMQBa..." 
  };

  // Function to load custom fonts into jsPDF document
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
      
      return true;
    } catch (error) {
      console.error("Failed to load custom fonts:", error);
      return false;
    }
  }

  // Convert font names to jsPDF-compatible format
  function mapFontForPDF(fontName) {
    const normalized = (fontName || "helvetica").toLowerCase().replace(/\s+/g, "-");
    const mapped = FONT_MAP[normalized] || "helvetica";
    // If it's a custom font (capitalized), check if it's loaded
    // If not loaded, fallback to helvetica
    if (mapped && mapped[0] === mapped[0].toUpperCase() && !CUSTOM_FONTS[mapped]) {
      console.warn(`Custom font "${mapped}" not loaded, falling back to helvetica`);
      return "helvetica";
    }
    return mapped;
  }
	// --- Local Bible loader (like the Task app's JSON import) ---
	let bibleData = {};
	const bookNumberMap = {
	  1: "Genesis", 2: "Exodus", 3: "Leviticus", 4: "Numbers", 5: "Deuteronomy",
	  6: "Joshua", 7: "Judges", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
	  11: "1 Kings", 12: "2 Kings", 13: "1 Chronicles", 14: "2 Chronicles",
	  15: "Ezra", 16: "Nehemiah", 17: "Esther", 18: "Job", 19: "Psalms",
	  20: "Proverbs", 21: "Ecclesiastes", 22: "Song of Solomon", 23: "Isaiah",
	  24: "Jeremiah", 25: "Lamentations", 26: "Ezekiel", 27: "Daniel",
	  28: "Hosea", 29: "Joel", 30: "Amos", 31: "Obadiah", 32: "Jonah",
	  33: "Micah", 34: "Nahum", 35: "Habakkuk", 36: "Zephaniah",
	  37: "Haggai", 38: "Zechariah", 39: "Malachi", 40: "Matthew",
	  41: "Mark", 42: "Luke", 43: "John", 44: "Acts", 45: "Romans",
	  46: "1 Corinthians", 47: "2 Corinthians", 48: "Galatians",
	  49: "Ephesians", 50: "Philippians", 51: "Colossians",
	  52: "1 Thessalonians", 53: "2 Thessalonians", 54: "1 Timothy",
	  55: "2 Timothy", 56: "Titus", 57: "Philemon", 58: "Hebrews",
	  59: "James", 60: "1 Peter", 61: "2 Peter", 62: "1 John",
	  63: "2 John", 64: "3 John", 65: "Jude", 66: "Revelation"
	};


	const bibleFileInput = document.getElementById("bibleFileInput");
	const bookSelect = document.getElementById("bookSelect");
	const chapterSelect = document.getElementById("chapterSelect");
	const verseSelect = document.getElementById("verseSelect");
	const verseArea = document.getElementById("verse");
	const referenceInput = document.getElementById("reference");

	// Load bible.json from user's computer
	bibleFileInput.addEventListener("change", async (e) => {
	  const file = e.target.files?.[0];
	  if (!file) return;
	  const text = await file.text();
	  try {
		bibleData = JSON.parse(text);
		populateBooks();
	  } catch (err) {
		alert("Invalid JSON format.");
	  }
	});
	bibleFileInput.addEventListener("change", async (e) => {
	  const file = e.target.files?.[0];
	  if (!file) return;
	  const text = await file.text();
	  try {
		let data = JSON.parse(text);

		// --- Handle nested "verses" array (and ignore metadata)
		if (data.verses && Array.isArray(data.verses)) {
		  data = data.verses;
		}

		// --- Handle flat array of verse objects
		if (Array.isArray(data)) {
		  bibleData = {};
		  for (const v of data) {
			let book = v.book || v.Book || "Unknown";
			if (!isNaN(book) && bookNumberMap[book]) {
			  book = bookNumberMap[book];
			  }
			const ch = (v.chapter || v.Chapter || 1).toString();
			const vs = (v.verse || v.Verse || 1).toString();
			const text = v.text || v.Text || "";
			if (!bibleData[book]) bibleData[book] = {};
			if (!bibleData[book][ch]) bibleData[book][ch] = {};
			bibleData[book][ch][vs] = text.trim();
		  }
		} else {
		  // already nested correctly
		  bibleData = data;
		}

		populateBooks();
	  } catch (err) {
		alert("Invalid JSON format or unexpected structure.");
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

	// Populate chapters
	bookSelect.addEventListener("change", () => {
	  const book = bookSelect.value;
	  chapterSelect.innerHTML = "<option value=''>-- Select Chapter --</option>";
	  verseSelect.innerHTML = "";
	  verseSelect.disabled = true;

	  if (!book) {
		chapterSelect.disabled = true;
		return;
	  }
	  const chapters = Object.keys(bibleData[book]);
	  chapters.forEach(ch => {
		const opt = document.createElement("option");
		opt.value = ch;
		opt.textContent = ch;
		chapterSelect.appendChild(opt);
	  });
	  chapterSelect.disabled = false;
	});

	// Populate verses
	chapterSelect.addEventListener("change", () => {
	  const book = bookSelect.value;
	  const chapter = chapterSelect.value;
	  verseSelect.innerHTML = "";
	  if (!chapter) {
		verseSelect.disabled = true;
		return;
	  }
	  const verses = Object.keys(bibleData[book][chapter]);
	  verses.forEach(v => {
		const opt = document.createElement("option");
		opt.value = v;
		opt.textContent = v;
		verseSelect.appendChild(opt);
	  });
	  verseSelect.disabled = false;
	});

	// When verses are chosen (multi-select)
	verseSelect.addEventListener("change", () => {
	  const book = bookSelect.value;
	  const chapter = chapterSelect.value;
	  const selectedOptions = Array.from(verseSelect.selectedOptions);
	  
	  if (!selectedOptions.length) return;
	  
	  // Collect verse numbers and texts
	  const verseNums = selectedOptions.map(opt => opt.value);
	  const verseTexts = verseNums.map(v => bibleData[book][chapter][v]);
	  
	  // Concatenate verse texts with single space
	  verseArea.value = verseTexts.join(" ");
	  
	  // Format reference as "Book Chapter:v1,v2,v3"
	  referenceInput.value = `${book} ${chapter}:${verseNums.join(",")}`;
	});


  function parseWords(raw) {
    if (!raw) return [];
    return uniq(raw.split(/[\n,; ]+/g).map(sanitizeWord).filter(Boolean)).sort(byLengthDesc);
  }

  function cleanAndFormatVerse(raw) {
    if (!raw) return "";
    let text = raw.trim().replace(/\s+/g, " ");
    let sentences = text.split(/([.?!])/).reduce((acc, part) => {
      if (/[.?!]/.test(part) && acc.length) acc[acc.length-1]+=part;
      else if (part.trim()) acc.push(part.trim());
      return acc;
    }, []);
    return sentences.map(s=>{
      s = s.replace(/\bi\b/g,"I");
      return s.charAt(0).toUpperCase()+s.slice(1);
    }).join(" ");
  }

  function hexToRGB(hex){const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:{r:0,g:0,b:0};}

  function buildDirections(o){const d=[];if(o.allowH)d.push({dx:1,dy:0});if(o.allowV)d.push({dx:0,dy:1});if(o.allowD)d.push({dx:1,dy:1});if(o.allowBack){d.push({dx:-1,dy:0});d.push({dx:0,dy:-1});d.push({dx:-1,dy:-1});}return d;}

  function canPlace(grid,word,r,c,dx,dy){const N=grid.length;const endR=r+dy*(word.length-1),endC=c+dx*(word.length-1);if(endR<0||endR>=N||endC<0||endC>=N)return false;for(let i=0;i<word.length;i++){const rr=r+dy*i,cc=c+dx*i;const existing=grid[rr][cc];if(existing&&existing!==word[i])return false;}return true;}

  function placeWord(grid,word,dirs,maxTries=500){const N=grid.length;for(let t=0;t<maxTries;t++){const d=dirs[Math.floor(Math.random()*dirs.length)],r=Math.floor(Math.random()*N),c=Math.floor(Math.random()*N);if(!canPlace(grid,word,r,c,d.dx,d.dy))continue;const cells=[];for(let i=0;i<word.length;i++){const rr=r+d.dy*i,cc=c+d.dx*i;grid[rr][cc]=word[i];cells.push({r:rr,c:cc});}return{ok:true,cells};}return{ok:false,cells:[]};}

  function generateGrid(words,opts){const N=opts.size;const grid=Array.from({length:N},()=>Array(N).fill(null));const placed=[];const dirs=buildDirections(opts);for(const w of words){if(w.length>N)continue;const res=placeWord(grid,w,dirs);if(res.ok)placed.push({word:w,cells:res.cells});}const ALPH="ABCDEFGHIJKLMNOPQRSTUVWXYZ";for(let r=0;r<N;r++){for(let c=0;c<N;c++){if(!grid[r][c])grid[r][c]=ALPH[Math.floor(Math.random()*ALPH.length)];}}return{grid,placed};}

  const previewFontMap={helvetica:"Arial, Helvetica, sans-serif",times:"Times New Roman, Times, serif",courier:"Courier New, Courier, monospace"};

  function highlightVerseHTML(verse,words){const tokens=verse.split(/\b/);const used=new Set();for(let i=0;i<tokens.length;i++){const w=tokens[i],up=w.toUpperCase();if(words.includes(up)&&!used.has(up)){tokens[i]=`<span style="font-weight:bold;text-decoration:underline">${w}</span>`;used.add(up);}}return tokens.join("");}

  function renderPreview(title,grid,verse,ref,words,opts){
    previewTitle.textContent=title;
    previewGrid.innerHTML="";
    previewGrid.style.fontFamily=previewFontMap[opts.fontFamily]||"Arial";
    const N=grid.length;
    for(let r=0;r<N;r++){
      const tr=document.createElement("tr");
      for(let c=0;c<N;c++){
        const td=document.createElement("td");
        td.textContent=grid[r][c];
        td.style.color=opts.letterColor;
        td.style.borderColor=opts.gridColor;
        tr.appendChild(td);
      }
      previewGrid.appendChild(tr);
    }
    previewVerse.innerHTML=highlightVerseHTML(verse,words);
    // Apply dynamic line spacing to preview verse
    // Convert PDF spacing (inches) to a line-height multiplier
    const lineHeight = 1 + ((opts.lineSpacing || 0.3) * 2.33);
    previewVerse.style.lineHeight = lineHeight.toString();
    previewRef.textContent=ref;
  }

  function sanitizeFileName(name,fallback){return (name||"").trim().replace(/[\\/:*?"<>|]+/g,"").replace(/\s+/g,"_")||fallback;}

  // ---- PDF Export ----
  function exportPDFs(title,grid,placed,verse,reference,words,opts){
    const { jsPDF }=window.jspdf;
    const docPuzzle=new jsPDF({unit:"in",format:"letter"});
    const docSolution=new jsPDF({unit:"in",format:"letter"});
    
    // Load custom fonts into PDF documents
    loadCustomFonts(docPuzzle);
    loadCustomFonts(docSolution);

    const page={w:8.5,h:11},m={l:0.6,r:0.6,t:0.6,b:0.6},innerW=page.w-m.l-m.r,innerH=page.h-m.t-m.b;
    const N=grid.length,titleH=title?0.35:0,verseReserve=1.0;
    const cell = Math.min(innerW / N, (innerH - titleH - verseReserve) / N) * 0.75;
    const gridW=cell*N,gridH=cell*N,gridX=m.l+(innerW-gridW)/2,gridY=m.t+(titleH?titleH+0.15:0);

    const font=mapFontForPDF(opts.fontFamily),fontPt=clamp(cell*72*0.66,8,48),labelPt=18;
    const letterRGB=hexToRGB(opts.letterColor),gridRGB=hexToRGB(opts.gridColor),highlightRGB=hexToRGB(opts.circleColor);

    function drawTitle(doc){if(!title)return;doc.setFont(font,"bold");doc.setFontSize(22);doc.text(title,page.w/2,m.t+0.2,{align:"center"});}
    function drawGrid(doc,highlight=false){
      doc.setLineWidth(0.015);
      doc.setDrawColor(gridRGB.r,gridRGB.g,gridRGB.b);
      doc.rect(gridX,gridY,gridW,gridH);
      for(let i=1;i<N;i++){doc.line(gridX+i*cell,gridY,gridX+i*cell,gridY+gridH);doc.line(gridX,gridY+i*cell,gridX+gridW,gridY+i*cell);}
      
      // Build a set of answer cell coordinates for quick lookup
      const answerCells = new Set();
      if (highlight && placed?.length) {
        for (const p of placed) {
          for (const cc of p.cells) {
            answerCells.add(cc.r + "_" + cc.c);
          }
        }
      }
      
      for(let r=0;r<N;r++){
        for(let c=0;c<N;c++){
          const x=gridX+c*cell+cell/2;
          const y=gridY+r*cell+cell/2+(fontPt/72)*0.3;
          const key = r + "_" + c;
          const isAnswer = answerCells.has(key);
          
          if (highlight) {
            // For solution page: bold answer letters, grey non-answer letters
            if (isAnswer) {
              doc.setFont(font,"bold");
              doc.setFontSize(fontPt);
              doc.setTextColor(letterRGB.r,letterRGB.g,letterRGB.b); // Black
            } else {
              doc.setFont(font,"normal");
              doc.setFontSize(fontPt);
              doc.setTextColor(220, 220, 220); // Light grey
            }
          } else {
            // For puzzle page: all letters black and bold
            doc.setFont(font,"bold");
            doc.setFontSize(fontPt);
            doc.setTextColor(letterRGB.r,letterRGB.g,letterRGB.b);
          }
          
          doc.text(grid[r][c],x,y,{align:"center"});
        }
      }
    }

    function drawVerseBlock(doc){
      const used=new Set();doc.setFontSize(labelPt);
      let y=gridY+gridH+1.5;const maxW=innerW;	  
      const wordsArr=verse.split(/\s+/);
      let line=[];let lineW=0;
      function flushLine(){
        if(!line.length)return;
        let cursorX=m.l;  // Start at left margin instead of center
        for(const seg of line){
          doc.setFont(font,seg.bold?"bold":"normal");
          doc.text(seg.text,cursorX,y,{baseline:"alphabetic"});
          if(seg.bold){
            doc.setLineWidth(0.015);
            doc.line(cursorX,y+0.03,cursorX+doc.getTextWidth(seg.text),y+0.03);
          }
          cursorX+=doc.getTextWidth(seg.text+" ");
        }
        y+=(opts.lineSpacing || 0.3) * 4;line=[];lineW=0;
      }
      for(const raw of wordsArr){
        let up=raw.toUpperCase().replace(/[^A-Z]/g,"");
        let bold=false;
        if(words.includes(up)&&!used.has(up)){bold=true;used.add(up);}
        doc.setFont(font,bold?"bold":"normal");
        let w=doc.getTextWidth(raw+" ");
        if(lineW+w>maxW)flushLine();
        line.push({text:raw,bold});lineW+=w;
      }
      flushLine();
      if(reference){doc.setFont(font,"italic");doc.text(reference,m.l,y+0.3,{align:"left"});}
    }

    drawTitle(docPuzzle);drawGrid(docPuzzle,false);drawVerseBlock(docPuzzle);
    drawTitle(docSolution);drawGrid(docSolution,true);
    // Don't draw verse block on solution page

    const base=sanitizeFileName(title,`WordSearch_${N}x${N}`);
    docPuzzle.save(`${base}_Puzzle.pdf`);
    docSolution.save(`${base}_Solution.pdf`);
  }

  // ---- Handlers ----
  btnGenerate.addEventListener("click",()=>{
    const title=titleInput.value.trim(),verse=cleanAndFormatVerse(verseInput.value),words=parseWords(wordsInput.value),reference=refInput.value.trim();
    if(!verse){messages.textContent="Please paste a verse.";return;}
    if(!words.length){messages.textContent="Please provide at least one target word.";return;}
    const lineSpacing = lineSpacingInput ? parseFloat(lineSpacingInput.value) || 0.3 : 0.3;
    const opts={size:gridSizeSel?+gridSizeSel.value:14,allowH:allowH?allowH.checked:true,allowV:allowV?allowV.checked:true,allowD:allowD?allowD.checked:true,allowBack:allowBack?allowBack.checked:false,fontFamily:fontFamilySel?fontFamilySel.value:"helvetica",letterColor:letterColorInp?letterColorInp.value:"#000000",gridColor:gridColorInp?gridColorInp.value:"#000000",circleColor:highlightColorInp?highlightColorInp.value:"#e6c200",lineSpacing:lineSpacing};
    const {grid,placed}=generateGrid(words,opts);
    lastGrid=grid;lastPlaced=placed;lastWords=words;lastOptions=opts;lastVerse=verse;lastReference=reference;
    renderPreview(title,grid,verse,reference,words,opts);
    btnExport.disabled=false;
  });

  btnExport.addEventListener("click",()=>{if(lastGrid&&lastOptions){exportPDFs(titleInput.value.trim(),lastGrid,lastPlaced,lastVerse,lastReference,lastWords,lastOptions);}});
  btnClear.addEventListener("click",()=>{titleInput.value=verseInput.value=wordsInput.value=refInput.value="";previewTitle.textContent=previewGrid.innerHTML=previewVerse.innerHTML=previewRef.textContent=messages.textContent="";btnExport.disabled=true;lastGrid=null;});
})();










