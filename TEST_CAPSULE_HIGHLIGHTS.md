# Testing Capsule-Style Word Highlights

## Overview
This document describes how to test the new capsule-style word highlighting in the solution PDF.

## Changes Made
The solution PDF now uses tightly fitted capsule-style bars to highlight each word, with the following characteristics:

1. **Full Cell Coverage**: Each bar extends from the left/top edge of the first letter cell to the right/bottom edge of the last letter cell
2. **Exact Cell Thickness**: Bar thickness equals cell size, ensuring flush alignment with no gaps
3. **Rounded Ends**: Semicircular ends (capsule style) for visual appeal
4. **No Gaps**: Adjacent parallel words have zero gap between their bars
5. **Word Independence**: Each word gets its own bar, even if overlapping with others

## Testing Steps

### 1. Generate a Word Search
1. Open `index.html` in a web browser
2. Enter a Bible verse, e.g., "The LORD is my shepherd I shall not want"
3. Enter target words, e.g., "LORD, shepherd, want"
4. Enter a reference, e.g., "Psalm 23:1"
5. Click "Generate Preview"
6. Click "Export PDFs"

### 2. Verify Solution PDF
Open the generated `*_Solution.pdf` file and verify:

#### Horizontal Words
- Bar extends from left edge of first letter to right edge of last letter
- Bar thickness is 85% of cell height (minimal gap above/below)
- Rounded semicircle ends on left and right
- Small gaps (15%) between adjacent horizontal words in consecutive rows

#### Vertical Words
- Bar extends from top edge of first letter to bottom edge of last letter
- Bar thickness is 85% of cell width (minimal gap left/right)
- Rounded semicircle ends on top and bottom
- Small gaps (15%) between adjacent vertical words in consecutive columns

#### Diagonal Words
- Bar follows the diagonal path
- Bar covers entire first and last cells
- Bar thickness is 85% of cell size along perpendicular axis
- Rectangular shape with proper rotation (note: jsPDF limitation prevents perfect rounded ends on rotated bars)

#### Letter Appearance
- Solution letters are bold and black
- Non-solution letters are light grey
- All letters remain visible and readable

#### Bar Appearance
- Semi-transparent grey fill (RGB 200, 200, 200) with 50% opacity
- Darker grey border (RGB 120, 120, 120)
- Bars overlap only where words intersect (at shared letters)
- **Overlapping bars are visible through transparency** - both shapes remain visible
- Multiple overlapping bars create darker appearance showing overlap depth

## Test Cases

### Test Case 1: Multiple Horizontal Words
Create a puzzle with words like:
- "THE" (horizontal, row 0)
- "LORD" (horizontal, row 1)
- "SHEPHERD" (horizontal, row 2)

**Expected**: Small gaps (15%) between bars, each word fully covered with 85% thickness.

### Test Case 2: Multiple Vertical Words
Create a puzzle with words placed vertically in adjacent columns.

**Expected**: Small gaps (15%) between bars, each word fully covered with 85% thickness.

### Test Case 3: Diagonal Words
Create a puzzle with diagonal words in various directions (NE, SE, SW, NW).

**Expected**: Each diagonal bar covers the entire word with proper rotation and 85% thickness.

### Test Case 4: Intersecting Words
Create a puzzle where words cross each other (e.g., "LORD" horizontal and "LOVE" vertical sharing the 'O').

**Expected**: Both bars are visible through transparency, overlapping only at the intersection point. The overlap area appears slightly darker.

### Test Case 5: Edge Cases
- Single letter word: Should create a perfect square capsule with 85% size
- Two letter word: Should create a short capsule with 85% thickness
- Maximum length word: Should extend properly across many cells

### Test Case 6: Transparency and Overlapping
Create a puzzle with multiple overlapping words:
- "LORD" horizontal (row 5, columns 4-7)
- "LOVE" vertical (column 5, rows 3-6) - sharing 'O' at position (5,5)
- "OVER" diagonal (starting at 4,4)

**Expected**: 
- All three bars are visible as semi-transparent grey
- Intersection points appear darker due to stacked transparency
- Each individual bar shape remains clearly visible
- Letters remain bold and black, fully readable through all bar layers

## Tunable Parameters

All parameters are documented in `script.js` around line 1052. Key parameters:

```javascript
// Bar colors (RGB 0-255)
const rectFillColor = { r: 200, g: 200, b: 200 };
const rectBorderColor = { r: 120, g: 120, b: 120 };

// Bar opacity (0.0 to 1.0)
const barOpacity = 0.5;

// Bar thickness as percentage of cell size (0.0 to 1.0)
const BAR_THICKNESS_PERCENT = 0.85;

// Corner radius for capsule ends (in inches)
const cornerRadius = (cellSize * BAR_THICKNESS_PERCENT) / 2;

// Bar extension beyond cell centers (in inches)
const barExtension = cellSize / 2;

// Bar thickness (in inches)
const barThickness = cellSize * BAR_THICKNESS_PERCENT;

// Border width (in inches)
const borderWidth = 0.01;
```

### Adjusting Parameters

To change the appearance:
- **Lighter/darker bars**: Adjust `rectFillColor` RGB values
- **Thicker/thinner border**: Adjust `rectBorderColor` and `borderWidth`
- **More/less transparent bars**: Adjust `barOpacity` (0.5 provides good visibility for overlapping bars)
- **More/less rounded ends**: Adjust `cornerRadius` (automatically set to match bar thickness)
- **Tighter/looser fit**: Adjust `barExtension` (cellSize/2 is perfect edge-to-edge coverage)
- **Thicker/thinner bars**: Adjust `BAR_THICKNESS_PERCENT` (0.85 = 85% provides minimal gaps, 1.0 = 100% eliminates gaps)

## Known Limitations

1. **Diagonal bars**: Due to jsPDF limitations, diagonal bars use a polygon approach rather than true rounded rectangles. The visual effect is still clean but ends are not perfectly rounded.

2. **Very small cell sizes**: With very small cells, the rounded corners may appear less smooth due to PDF rendering resolution.

## Success Criteria

The implementation is successful if:
- ✅ All words are fully covered from edge to edge
- ✅ Bar thickness matches cell size
- ✅ No visible gaps between adjacent parallel words
- ✅ Rounded ends are visible on horizontal/vertical words
- ✅ Solution letters are bold, non-solution letters are greyed
- ✅ Bars overlap only at word intersections
- ✅ All parameters are clearly documented
