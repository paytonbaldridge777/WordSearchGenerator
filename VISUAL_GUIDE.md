# Visual Guide: 85% Bar Thickness with Transparency

## Before vs After

### OLD (100% thickness, opaque)
```
Row 0:  ╔════════════════════════╗
        ║    L O R D             ║  <- 100% thickness bar (opaque grey)
        ╚════════════════════════╝
Row 1:  ╔════════════════════════╗
        ║    L O V E             ║  <- 100% thickness bar (opaque grey)
        ╚════════════════════════╝
        ^                        ^
        |                        |
        No gap - bars touch

When overlapping: Later bar completely hides earlier bar
```

### NEW (85% thickness, semi-transparent)
```
Row 0:  ╭────────────────────────╮
        │    L O R D             │  <- 85% thickness bar (50% opacity)
        ╰────────────────────────╯
        ▓▓▓ 15% gap ▓▓▓
Row 1:  ╭────────────────────────╮
        │    L O V E             │  <- 85% thickness bar (50% opacity)
        ╰────────────────────────╯
        ^                        ^
        |                        |
        Small gap - visual separation

When overlapping: Both bars visible, overlap appears darker
```

## Transparency Effect

### Single Bar (50% opacity)
```
Background: ░░░░░░░░░░░░░░░░░░░░
Single bar: ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  (50% grey)
Letters:    L  O  R  D           (100% black, bold)
```

### Two Overlapping Bars (50% opacity each)
```
Background: ░░░░░░░░░░░░░░░░░░░░
Bar 1:      ▒▒▒▒▒▒▒▒▒▒▒▒
Overlap:            ▓▓▓▓
Bar 2:              ▒▒▒▒▒▒▒▒▒▒▒▒
Result:     ▒▒▒▒▒▒▒▒▓▓▓▓▒▒▒▒▒▒▒▒  (overlap appears ~75% grey)
Letters:    L  O  V  E  R  D     (100% black, bold)
```

## Bar Dimensions

### Cell Size = 0.5 inches

#### OLD Implementation
```
┌──────────┐
│          │  cellSize = 0.5"
│    L     │  barThickness = 0.5" (100%)
│          │  cornerRadius = 0.25"
└──────────┘
```

#### NEW Implementation
```
┌──────────┐
│  ░░░░░   │  cellSize = 0.5"
│  ▒▒▒▒▒   │  barThickness = 0.425" (85%)
│  ░░░░░   │  cornerRadius = 0.2125"
└──────────┘  gap = 0.075" (15%)
```

## Mathematical Details

### Horizontal Word "LORD" (4 letters)
```
Cell positions: [0, 1, 2, 3]
Cell centers:   [0.25", 0.75", 1.25", 1.75"]

Bar start:  0.25" - 0.25" = 0" (left edge of cell 0)
Bar end:    1.75" + 0.25" = 2.0" (right edge of cell 3)
Bar length: 2.0" (covers all 4 cells exactly)

Bar center Y: gridY + row * 0.5" + 0.25"
Bar thickness: 0.425" (85% of 0.5")
Bar top:    centerY - 0.2125"
Bar bottom: centerY + 0.2125"
```

### Adjacent Words Gap Calculation
```
Word 1 (Row 0):
  Center:  gridY + 0.25"
  Bottom:  gridY + 0.25" + 0.2125" = gridY + 0.4625"

Word 2 (Row 1):
  Center:  gridY + 0.75"
  Top:     gridY + 0.75" - 0.2125" = gridY + 0.5375"

Gap = 0.5375" - 0.4625" = 0.075" (15% of cell size)
```

## Tunable Constants Location

File: `script.js`, lines ~1070-1095

```javascript
// Bar opacity (0.0 to 1.0)
const barOpacity = 0.5;

// Bar thickness as percentage of cell size (0.0 to 1.0)
const BAR_THICKNESS_PERCENT = 0.85;

// Derived calculations
const cornerRadius = (cellSize * BAR_THICKNESS_PERCENT) / 2;
const barThickness = cellSize * BAR_THICKNESS_PERCENT;
```

## Example Adjustments

### For Flush Bars (No Gap)
```javascript
const BAR_THICKNESS_PERCENT = 1.0;
// Result: No gap, bars touch like original
```

### For Larger Gaps
```javascript
const BAR_THICKNESS_PERCENT = 0.75;
// Result: 25% gap between bars
```

### For More Transparency
```javascript
const barOpacity = 0.3;
// Result: Very transparent, good for 4+ overlapping bars
```

### For Less Transparency
```javascript
const barOpacity = 0.7;
// Result: Less transparent, better for 2-3 overlapping bars
```

## Visual Test Checklist

When testing the PDF output, verify:

✅ **Bar Thickness**
- [ ] Bars are visibly thinner than grid cells
- [ ] Small gap visible between parallel words
- [ ] Gap is consistent and minimal (~15%)

✅ **Transparency**
- [ ] Single bars appear semi-transparent grey
- [ ] Overlapping areas appear darker
- [ ] Both bar shapes remain visible when overlapping
- [ ] 3+ overlaps create progressively darker appearance

✅ **Rounded Ends**
- [ ] Horizontal bars have semicircle ends
- [ ] Vertical bars have semicircle ends
- [ ] Corner radius matches bar thickness

✅ **Letter Appearance**
- [ ] Solution letters are bold and black (100% opacity)
- [ ] Non-solution letters are light grey
- [ ] All letters readable through bar transparency

✅ **Overall Quality**
- [ ] Professional appearance
- [ ] Clear distinction between words
- [ ] Natural stacking effect for overlaps
- [ ] Clean capsule/rounded bar style maintained
