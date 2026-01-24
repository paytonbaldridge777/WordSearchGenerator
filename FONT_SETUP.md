# Custom Font Setup Guide

This document explains how to add custom fonts to the Word Search Generator for PDF export.

## Current Status

The application has infrastructure for custom fonts but requires font data to be added. The following fonts are configured in `FONT_MAP` but need base64 font data:

### Script Fonts (High Priority)
- **Satisfy** - Handwritten script font
- **Allura** - Elegant calligraphy font
- **Great Vibes** - Flowing script font
- **Pacifico** - Casual script font

### System Font Alternatives (Lower Priority)
Currently using jsPDF built-in fallbacks:
- Arial → Helvetica
- Georgia, Palatino, Garamond, etc. → Times

## How to Add Custom Fonts

### Step 1: Download Font Files

Download `.ttf` font files from Google Fonts:

```bash
# Download from Google Fonts repository
curl -L "https://github.com/google/fonts/raw/main/ofl/satisfy/Satisfy-Regular.ttf" -o Satisfy.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/allura/Allura-Regular.ttf" -o Allura.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/greatvibes/GreatVibes-Regular.ttf" -o GreatVibes.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf" -o Pacifico.ttf
```

### Step 2: Convert to Base64

Convert each font file to base64:

```bash
# Using base64 command (Linux/Mac)
base64 -w 0 Satisfy.ttf > Satisfy.base64.txt
base64 -w 0 Allura.ttf > Allura.base64.txt
base64 -w 0 GreatVibes.ttf > GreatVibes.base64.txt
base64 -w 0 Pacifico.ttf > Pacifico.base64.txt

# Or using Node.js
node -e "const fs=require('fs'); console.log(fs.readFileSync('Satisfy.ttf').toString('base64'));" > Satisfy.base64.txt
```

### Step 3: Add Font Data to JavaScript

Edit `script.js` and `WordSearch/script.js`, find the `CUSTOM_FONTS` object and add the base64 data:

```javascript
const CUSTOM_FONTS = {
  "Satisfy": "AAEAAAASAQAABAAgRFNJRwAAAAEA...", // Paste full base64 string here
  "Allura": "AAEAAAASAQAABAAgRFNJRwAAAAEA...",  // Paste full base64 string here
  "GreatVibes": "AAEAAAASAQAABAAgRFNJRw...",     // Paste full base64 string here
  "Pacifico": "AAEAAAASAQAABAAgRFNJRwAAA..."    // Paste full base64 string here
};
```

### Step 4: Uncomment Font Loading Code

In both `script.js` and `WordSearch/script.js`, find the `loadCustomFonts()` function and uncomment the loading code for each font:

```javascript
function loadCustomFonts(doc) {
  try {
    // Satisfy font
    if (CUSTOM_FONTS["Satisfy"]) {
      doc.addFileToVFS("Satisfy.ttf", CUSTOM_FONTS["Satisfy"]);
      doc.addFont("Satisfy.ttf", "Satisfy", "normal");
      doc.addFont("Satisfy.ttf", "Satisfy", "bold");
    }
    
    // Allura font
    if (CUSTOM_FONTS["Allura"]) {
      doc.addFileToVFS("Allura.ttf", CUSTOM_FONTS["Allura"]);
      doc.addFont("Allura.ttf", "Allura", "normal");
      doc.addFont("Allura.ttf", "Allura", "bold");
    }
    
    // GreatVibes font
    if (CUSTOM_FONTS["GreatVibes"]) {
      doc.addFileToVFS("GreatVibes.ttf", CUSTOM_FONTS["GreatVibes"]);
      doc.addFont("GreatVibes.ttf", "GreatVibes", "normal");
      doc.addFont("GreatVibes.ttf", "GreatVibes", "bold");
    }
    
    // Pacifico font
    if (CUSTOM_FONTS["Pacifico"]) {
      doc.addFileToVFS("Pacifico.ttf", CUSTOM_FONTS["Pacifico"]);
      doc.addFont("Pacifico.ttf", "Pacifico", "normal");
      doc.addFont("Pacifico.ttf", "Pacifico", "bold");
    }
    
    return true;
  } catch (error) {
    console.error("Failed to load custom fonts:", error);
    return false;
  }
}
```

### Step 5: Test

1. Open the application in a browser
2. Generate a word search
3. Select a script font (e.g., "Satisfy") from the font dropdown
4. Export to PDF
5. Open the PDF and verify the custom font is rendered correctly

## File Size Considerations

Each font adds approximately 200-400KB to the JavaScript file when base64-encoded:
- Satisfy: ~290KB → ~397KB base64
- Allura: ~241KB → ~329KB base64
- GreatVibes: ~447KB → ~610KB base64
- Pacifico: ~322KB → ~439KB base64

**Total: ~1.7MB for all 4 fonts**

For production use, consider:
1. Adding only the most popular fonts
2. Using a separate `fonts.js` file that can be loaded optionally
3. Implementing lazy loading of fonts
4. Using a CDN approach if file size is a concern

## Alternative Approach: External Fonts

Instead of inline base64, you could:

1. Create a `/fonts` directory
2. Place `.ttf` files there
3. Load fonts dynamically using `fetch()`:

```javascript
async function loadCustomFontsExternal(doc) {
  try {
    const satisfyResponse = await fetch('/fonts/Satisfy.ttf');
    const satisfyBuffer = await satisfyResponse.arrayBuffer();
    const satisfyBase64 = btoa(String.fromCharCode(...new Uint8Array(satisfyBuffer)));
    
    doc.addFileToVFS("Satisfy.ttf", satisfyBase64);
    doc.addFont("Satisfy.ttf", "Satisfy", "normal");
    
    return true;
  } catch (error) {
    console.error("Failed to load custom fonts:", error);
    return false;
  }
}
```

**Note:** This approach requires the application to be served over HTTP/HTTPS and won't work with the `file://` protocol.

## Fallback Behavior

If a custom font fails to load or base64 data is not provided:
- Script fonts (Satisfy, Allura, etc.) will fallback to jsPDF's built-in Helvetica
- The application will log an error to the console but continue to function
- Users will still be able to generate PDFs with the fallback fonts

## License Considerations

All fonts from Google Fonts are open-source and free to use:
- Satisfy: SIL Open Font License 1.1
- Allura: SIL Open Font License 1.1
- Great Vibes: SIL Open Font License 1.1
- Pacifico: SIL Open Font License 1.1

Always verify license terms before distributing fonts with your application.
