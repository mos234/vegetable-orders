---
name: catering-events-xlsx
description: "Convert Hebrew catering/event order documents (PDF or DOCX) into structured, multi-sheet Excel workbooks. Use this skill whenever a user uploads a catering plan, weekly event schedule, אירוע, הזמנה, תפריט, or קייטרינג file and wants it turned into Excel. Triggers on: תפריטים, הזמנות, דפי ביצוע, קייטרינג, שבוע הבא, ריכוז מנות, טבלת הזמנה, כמויות לשבוע. Produces: per-event sheets, per-day summary sheets, and a full weekly consolidation sheet. Also handles recipe/ingredient databases and supplier order calculations when a recipe file is provided. Always use this skill for any Hebrew catering workflow, even if the user just says 'תהפוך לאקסל' or 'תכין טבלה'."
---

# Catering Events → Excel Skill

Converts Hebrew catering order documents into professional, multi-sheet Excel workbooks with smart quantity calculations. Works fully offline.

## Outputs Produced

1. **ריכוז כללי** — Weekly/period summary: all items consolidated by category, total quantities, breakdown per hall/day
2. **Per-event sheets** — One sheet per event (e.g. "הדר - זלצברג-קוקובקה") with full menu and calculated quantities
3. **Per-day sheets** — One sheet per day (e.g. "יום ב - 04.05.2026") showing all halls side by side
4. **Recipe/order sheet** *(optional, when recipe DB provided)* — Ingredient quantities for suppliers and kitchen prep

---

## Step 1: Parse the Document

### Document structure (PDF or DOCX)

Each event block looks like:

```
[order#] [family name] אירוע [guests] [option]  [contact]
[date] [time] יום [day] [hall] קייטרינג חן הגשה לשולחנות [kashrut]

סלטים    1  חציל יווני          מטבח קר
         1  חומוס               מטבח קר
         300 חסה-שערות גזר...   (explicit qty = not per-guest)
ראשונות 110  בורקס תפו"א+רוטב
עיקריות 100  עוף בתנור          מטבח חם
תוספות   1  תפו"א צלויים פפריקה
מנות אחרונות 1  גלידה במנג'ט
מזנון סיום  300  מנות בר
            300  קוגל תפו"א
הערות    1  חופה בפנים
```

### Field extraction per event

| Field | How to find it |
|---|---|
| order number | first number on event header line |
| family name | second token (e.g. "זלצברג-קוקובקה") |
| hall | "הדר" / "גוטניק" or other hall name before "קייטרינג" |
| date | DD/MM/YYYY format |
| day letter | יום + letter (ב/ג/ד/ה/א) |
| guests | number after "אירוע" |
| option | number after guests |
| contact | last token on header line (optional) |
| kashrut | ט / חט / נ after "לשולחנות" (optional) |

### Category detection

Recognized category keywords (right-to-left lines starting with these):
- `סלטים` — salads
- `ראשונות` — starters  
- `מנת פתיחה` — opening course
- `מזנון פתיחה` — opening buffet
- `עיקריות` — mains
- `תוספות` — sides
- `מנות אחרונות` — desserts/last course
- `מזנון סיום` — closing buffet (**not** the same as מזנון פתיחה)
- `הערות` — notes

Items in each category: `[qty]  [item name]  [optional: מטבח קר/חם]`

---

## Step 2: Quantity Resolution

### The core rule

```python
PER_GUEST_CATEGORIES = {'סלטים', 'תוספות', 'מנות אחרונות', 'מזנון סיום', 'מזנון פתיחה'}

def resolve_qty(raw_qty, category, guests):
    """
    qty=1 in a per-guest category → replace with guests count
    qty≈half of guests (±25%) in a per-guest category → keep qty, add note "חצי מהמוזמנים"
    otherwise → keep qty as-is, no note
    """
    if category not in PER_GUEST_CATEGORIES:
        return raw_qty, ''
    if raw_qty == 1:
        return guests, ''
    half = guests / 2
    if abs(raw_qty - half) / half <= 0.25:
        return raw_qty, 'חצי מהמוזמנים'
    return raw_qty, ''
```

**Why:** In Hebrew catering documents, `1` in סלטים/תוספות means "one type of this dish for the whole event" = quantity equals the number of guests. An explicit number like `300` means that specific quantity regardless.

---

## Step 3: Build the Excel Workbook

### Sheet order
1. `ריכוז כללי` (index 0 — first tab)
2. Per-event sheets (ordered by date, then hall)
3. Per-day sheets (one per unique date)

### Style constants

```python
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

hfont    = Font(name='Arial', bold=True, size=11, color='FFFFFF')
hfill    = PatternFill('solid', fgColor='4472C4')        # blue header
cat_font = Font(name='Arial', bold=True, size=11, color='1F4E79')
cat_fill = PatternFill('solid', fgColor='D6E4F0')        # light blue category
scf      = Font(name='Arial', bold=True, size=12, color='FFFFFF')
scfill   = PatternFill('solid', fgColor='2E75B6')        # darker blue summary cat
tot_f    = Font(name='Arial', bold=True, size=11)
tot_fill = PatternFill('solid', fgColor='FFF2CC')        # yellow total row
day_f    = Font(name='Arial', bold=True, size=13, color='FFFFFF')
day_fill = PatternFill('solid', fgColor='375623')        # dark green day header
note_f   = Font(name='Arial', size=10, italic=True, color='C00000')  # red italic notes
dfont    = Font(name='Arial', size=11)
bfont    = Font(name='Arial', bold=True, size=11)
border   = Border(left=Side('thin'), right=Side('thin'),
                  top=Side('thin'), bottom=Side('thin'))
center   = Alignment(horizontal='center', vertical='center', wrap_text=True)
right_al = Alignment(horizontal='right',  vertical='center', wrap_text=True)
```

**RTL:** Every sheet must have `ws.sheet_view.rightToLeft = True`

**Hebrew text alignment:** All cells containing Hebrew text must use `right_al` (not `center`) to prevent word-order reversal in Excel's RTL rendering.

### Per-event sheet layout

```
Row 1: [merged A:E] Title — "הזמנה {order} | {name} | אולם {hall} | יום {day} {date} {time}"
Row 2: [merged A:E] Info  — "כמות אורחים: {guests} | אופציה: {option} | איש קשר: {contact} | {service}"
Row 3: empty
Row 4+: For each category in CAT_ORDER:
    - Category header row (merged A:E, cat_font/cat_fill, right-aligned)
    - Column headers: # | פריט | כמות | הערה
    - Item rows: idx | item_name | resolved_qty (bold if int) | note (red italic if present)
    - Empty row between categories
```

Column widths: A=6, B=52, C=12, D=22

### ריכוז כללי layout

```
Row 1: [merged A:F] "ריכוז כללי - {date_range}"
Row 2: [merged A:F] Event list summary
Row 3: empty
For each category:
    - Category header (merged A:F, scf/scfill)
    - Column headers: # | פריט | סה"כ | מס' אירועים | פירוט
    - One row per unique item, aggregated across all events
      - פירוט format: "הדר/ב (300) | גוטניק/ג (300)"
    - Total row (yellow, tot_fill): "סה"כ {category}" + sum
    - Empty row
```

Column widths: A=6, B=45, C=12, D=14, E=45

**Aggregation logic:**
```python
from collections import defaultdict

item_data = defaultdict(lambda: {'total': 0, 'events': []})
for event in events:
    if category in event['categories']:
        for item_name, raw_qty in event['categories'][category]:
            disp_qty, _ = resolve_qty(raw_qty, category, event['guests'])
            if isinstance(disp_qty, int):
                item_data[item_name]['total'] += disp_qty
                item_data[item_name]['events'].append(
                    f"{event['hall']}/{event['day']} ({disp_qty})")
```

### Per-day sheet layout

```
Row 1: [merged A:F] "יום {day} - {date}" (day_fill green header)
Row 3+: For each event on that day:
    - Event sub-header row (green tint E2EFDA): "אולם {hall} | {name} | {guests} אורחים"
    - For each category: category sub-header + item rows (B:F, col A empty)
    - Empty row between events
```

---

## Step 4: Recipe/Order Calculations (optional)

When the user provides a recipe database file (מאגר מתכונים), build two additional sheets:

### Recipe DB format expected

| שם מנה | קטגוריה | רכיב | כמות למנה | יחידה | הערות |
|---|---|---|---|---|---|
| מטבוחה פיקנטית | סלטים | עגבניות | 25 | ג | |

### Calculation rules

```python
CALC_RULES = {
    'סלטים':         {'method': 'per_guest_grams', 'grams': 35},
    'תוספות':        {'method': 'per_guest_grams', 'grams': 100},
    'לחמניות':       {'method': 'per_guest_plus_pct', 'pct': 30},
    'ראשונות':       {'method': 'as_ordered'},   # use qty from menu
    'עיקריות':       {'method': 'as_ordered'},
    'מנות אחרונות':  {'method': 'as_ordered'},
    'מזנון סיום':    {'method': 'as_ordered'},
    'מזנון פתיחה':   {'method': 'as_ordered'},
}
```

For each dish in the event menu:
1. Look up dish in recipe DB
2. Determine effective portion count using CALC_RULES
3. Multiply each ingredient by portion count
4. Aggregate same ingredients across all events

### Output sheets

**טבלת הזמנה לספק** — grouped by raw material category (ירקות, בשר, יבש...), total weight in kg/units

**הכנה למטבח** — grouped by dish, shows: dish name | portions | each ingredient + total amount

---

## Step 5: Recipe Template Generation

When user has no existing recipe DB, generate `מאגר_מתכונים_תבנית.xlsx` with:
- **הוראות** sheet — usage instructions
- **מתכונים** sheet — pre-filled examples from the uploaded menu's dishes, with columns: שם מנה | קטגוריה | רכיב | כמות למנה | יחידה | הערות
- **כללי חישוב** sheet — the CALC_RULES table above, editable by user

Pre-fill examples for common dishes found in menus:
- מטבוחה, חציל יווני, חומוס, חציל קלוי+טחינה, חמוצי הבית
- תפו"א צלויים, אורז לבן+חמוציות, ירקות מוקפצים
- עוף בתנור, שניצל וינאי, סטייק עוף
- בורקס תפו"א, מוסקה

Leave 30 blank rows at the bottom for user additions. Freeze header row (`ws.freeze_panes = 'A2'`).

---

## Edge Cases & Rules

- **"מנות בר"** in מזנון סיום = closing buffet item, not a separate category
- **"חמין ג"** — the ג/נ/ט suffix indicates kashrut (גלאט/נקיה/טריפה), keep as part of item name
- **Explicit large qty in סלטים** (e.g. `300 חסה-שערות גזר...`) = actual quantity, not per-guest; apply resolve_qty which will pass it through unchanged since it's not 1
- **הערות category** — show in per-event sheets, exclude from ריכוז כללי aggregation
- **Beverages** (שישית פפסי, שישית מים etc.) — keep in מזנון סיום, don't apply per-guest logic (raw_qty is already explicit)
- **Multiple halls same day** — each gets its own event sheet; both appear in the day sheet
- **Sheet name length** — Excel max 31 chars; truncate if needed
- **File naming** — output as `שבוע_הבא_{date_range}.xlsx` or `תפריטים_{date}.xlsx`

---

## Dependencies

All pre-installed, no internet needed:
- `openpyxl` — Excel generation
- `pdfplumber` or `PyMuPDF` — PDF text extraction  
- `python-docx` — DOCX reading
- `collections.defaultdict`, `collections.OrderedDict` — data structures
