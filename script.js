(() => {
  // ------------------------------
  // BASIC ELEMENTS
  // ------------------------------
  const el = (id) => document.getElementById(id);

  const titleInput = el("title");
  const verseInput = el("verse");
  const wordsInput = el("words");
  const refInput = el("reference");

  const btnGenerate = el("btnGenerate");
  const btnExport = el("btnExport");
  const btnClear = el("btnClear");

  const messages = el("messages");

  // Optional preview elements (will exist once you re-add the grid preview)
  const previewTitle = el("previewTitle") || document.createElement("div");
  const previewGrid = el("previewGrid") || document.createElement("div");
  const previewVerse = el("previewVerse") || document.createElement("div");
  const previewRef = el("previewReference") || document.createElement("div");

  // ------------------------------
  // BIBLE VERSION LOADER
  // ------------------------------
  let bibleData = {};
  const versionSelect = el("versionSelect");
  const bookSelect = el("bookSelect");
  const chapterSelect = el("chapterSelect");
  const verseSelect = el("verseSelect");

  // book ID → name map
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

      // unwrap metadata if present
      let verses = data;
      if (data.verses && Array.isArray(data.verses)) verses = data.verses;

      // convert to nested structure
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

  // ------------------------------
  // PUZZLE GENERATION HELPERS
  // ------------------------------
  const sanitizeWord = (w) => w.toUpperCase().replace(/[^A-Z]/g, "").trim();
  const uniq = (arr) => [...new Set(arr)];
  const byLengthDesc = (a,b) => b.length - a.length;
  const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));

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

  function hexToRGB(hex){
    const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:{r:0,g:0,b:0};
  }

  function buildDirections(o){const d=[];if(o.allowH)d.push({dx:1,dy:0});if(o.allowV)d.push({dx:0,dy:1});if(o.allowD)d.push({dx:1,dy:1});if(o.allowBack){d.push({dx:-1,dy:0});d.push({dx:0,dy:-1});d.push({dx:-1,dy:-1});}return d;}

  function canPlace(grid,word,r,c,dx,dy){
    const N=grid.length;
    const endR=r+dy*(word.length-1),endC=c+dx*(word.length-1);
    if(endR<0||endR>=N||endC<0||endC>=N)return false;
    for(let i=0;i<word.length;i++){
      const rr=r+dy*i,cc=c+dx*i;
      const existing=grid[rr][cc];
      if(existing&&existing!==word[i])return false;
    }
    return true;
  }

  function placeWord(grid,word,dirs,maxTries=500){
    const N=grid.length;
    for(let t=0;t<maxTries;t++){
      const d=dirs[Math.floor(Math.random()*dirs.length)],
            r=Math.floor(Math.random()*N),
            c=Math.floor(Math.random()*N);
      if(!canPlace(grid,word,r,c,d.dx,d.dy))continue;
      const cells=[];
      for(let i=0;i<word.length;i++){
        const rr=r+d.dy*i,cc=c+d.dx*i;
        grid[rr][cc]=word[i];
        cells.push({r:rr,c:cc});
      }
      return{ok:true,cells};
    }
    return{ok:false,cells:[]};
  }

  function generateGrid(words,opts){
    const N=opts.size;
    const grid=Array.from({length:N},()=>Array(N).fill(null));
    const placed=[];
    const dirs=buildDirections(opts);
    for(const w of words){
      if(w.length>N)continue;
      const res=placeWord(grid,w,dirs);
      if(res.ok)placed.push({word:w,cells:res.cells});
    }
    const ALPH="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for(let r=0;r<N;r++){
      for(let c=0;c<N;c++){
        if(!grid[r][c])grid[r][c]=ALPH[Math.floor(Math.random()*ALPH.length)];
      }
    }
    return{grid,placed};
  }

  // ------------------------------
  // PREVIEW + PDF EXPORT (unchanged)
  // ------------------------------
  const previewFontMap={helvetica:"Arial, Helvetica, sans-serif",times:"Times New Roman, Times, serif",courier:"Courier New, Courier, monospace"};

  function highlightVerseHTML(verse,words){
    const tokens=verse.split(/\b/);
    const used=new Set();
    for(let i=0;i<tokens.length;i++){
      const w=tokens[i],up=w.toUpperCase();
      if(words.includes(up)&&!used.has(up)){
        tokens[i]=`<span style="font-weight:bold;text-decoration:underline">${w}</span>`;
        used.add(up);
      }
    }
    return tokens.join("");
  }

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
        td.style.border="1px solid #444";
        tr.appendChild(td);
      }
      previewGrid.appendChild(tr);
    }
    previewVerse.innerHTML=highlightVerseHTML(verse,words);
    previewRef.textContent=ref;
  }

  function sanitizeFileName(name,fallback){
    return (name||"").trim().replace(/[\\/:*?"<>|]+/g,"").replace(/\s+/g,"_")||fallback;
  }

  // ------------------------------
  // DEFAULT OPTIONS + BUTTONS
  // ------------------------------
  btnGenerate.addEventListener("click",()=>{
    const title=titleInput.value.trim(),
          verse=cleanAndFormatVerse(verseInput.value),
          words=parseWords(wordsInput.value),
          reference=refInput.value.trim();

    if(!verse){messages.textContent="Please paste or select a verse.";return;}
    if(!words.length){messages.textContent="Please provide at least one target word.";return;}

    const opts={
      size:15,
      allowH:true,
      allowV:true,
      allowD:true,
      allowBack:true,
      fontFamily:"helvetica",
      letterColor:"#000000",
      gridColor:"#000000",
      circleColor:"#e6c200"
    };

    const {grid,placed}=generateGrid(words,opts);
    renderPreview(title,grid,verse,reference,words,opts);
    messages.textContent="Preview generated successfully.";
    btnExport.disabled=false;

    // Save for PDF
    window._puzzleState={title,grid,placed,verse,reference,words,opts};
  });

  btnExport.addEventListener("click",()=>{
    if(!window._puzzleState)return alert("Generate a puzzle first!");
    const { jsPDF }=window.jspdf;
    const doc=new jsPDF({unit:"in",format:"letter"});
    const {title,grid,verse,reference,words}=window._puzzleState;
    doc.setFont("helvetica","bold");
    doc.text(title||"Word Search",4.25,0.75,{align:"center"});
    doc.text(reference,4.25,1.1,{align:"center"});
    doc.text(verse,0.75,1.5,{maxWidth:7});
    doc.save(sanitizeFileName(title,"WordSearch")+".pdf");
  });

  btnClear.addEventListener("click",()=>{
    titleInput.value=verseInput.value=wordsInput.value=refInput.value="";
    messages.textContent="";
    btnExport.disabled=true;
  });
})();
