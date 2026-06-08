---
name: menu-to-xlsx
description: "Convert Hebrew event/catering menu documents (.docx, .txt, .pdf) into structured Excel spreadsheets. Use this skill whenever a user uploads a menu, catering plan, food order, event food list, or תפריט file and wants it organized into a table or spreadsheet. Also trigger when the user mentions תפריט, אירוע, קייטרינג, מנות, אולם, or similar Hebrew food/event terms alongside a request for Excel, טבלה, or סידור. Works fully offline — no cloud or internet needed."
---

# Menu-to-XLSX Skill

> **הערה:** הסקיל מיועד בעיקר לקבצי Word (`.docx`) — זהו הפורמט המומלץ לקבלת תוצאות הטובות ביותר. תמיכה ב-`.txt` ו-`.pdf` קיימת אך מוגבלת יותר.

Converts Hebrew event/catering menu documents into clean, structured Excel files. Designed to run fully locally without internet access.

## When to Use

- User uploads a `.docx`, `.txt`, or `.pdf` containing an event menu (תפריט)
- User asks to organize menu data into a spreadsheet/table
- Document contains Hebrew text with hall names, dish categories, and quantities

## How It Works

### Step 1: Read the Document

Read the uploaded file to extract raw text content. Use the appropriate method based on file type:

- `.docx` → use `python-docx` or `extract-text`
- `.txt` → read directly
- `.pdf` → use the pdf-reading skill

### Step 2: Parse the Menu Structure

Hebrew event menus typically follow this pattern:

```
[Event title + date]
[Logistics: entry/exit times]
[Hall name] - [number] מנות

[Category header:] (e.g., סלטים, מנה ראשונה, תוספות, מנה אחרונה, קינוחים)
item 1
item 2
...

[Next hall name] - [number] מנות
items...
```

Key parsing rules:

1. **Detect halls (אולמות):** Lines containing "אולם" or a name followed by a number and "מנות" mark a new hall section.
2. **Detect categories:** Lines ending with ":" or containing bold markers like `**...**` that match known category keywords:
   - סלטים (salads)
   - מנה ראשונה (first course / starter)
   - תוספות (sides)
   - מנה עיקרית / מנה אחרונה (main course / last course)
   - קינוחים (desserts)
   - משקאות (drinks)
   - Any other bold header followed by items
3. **Extract items:** Lines between one category header and the next are items belonging to that category.
4. **Extract quantities:** Numbers adjacent to "מנות" indicate portion count per hall.
5. **Parenthetical notes:** Preserve notes like "(לא בשרי!)" as part of the item name.

### Step 3: Build the Excel File

Use `openpyxl` to create a professionally formatted RTL spreadsheet.

#### Structure

One row per hall. Columns vary based on which categories appear in the document. Always include:

| אולם | כמות מנות | [each category found as its own column] |
|------|-----------|----------------------------------------|

- The column set is dynamic — only include categories that actually appear in the document.
- Within each cell, list multiple items separated by commas: `"חומוס, מטבוחה, סלט ירקות"`.
- If a hall has no items for a given category, leave the cell empty.

#### Formatting Requirements

```python
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

# RTL support
ws.sheet_view.rightToLeft = True

# Header style
header_font = Font(name='Arial', bold=True, size=12, color='FFFFFF')
header_fill = PatternFill('solid', fgColor='4472C4')

# Data style
data_font = Font(name='Arial', size=11)
cell_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

# Borders on all cells
thin_border = Border(
    left=Side(style='thin'), right=Side(style='thin'),
    top=Side(style='thin'), bottom=Side(style='thin')
)

# Column widths: auto-size based on content length, minimum 14, maximum 55
# Row heights: increase for cells with many items (wrap_text=True handles this)
```

#### Title Row (Optional)

If the document contains an event name and date, add a merged title row above the headers:
```python
ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(columns))
ws['A1'] = "תפריט בית חנה - 9/12"  # example
ws['A1'].font = Font(name='Arial', bold=True, size=14)
ws['A1'].alignment = Alignment(horizontal='center')
```
Then the header row starts at row 2 and data at row 3.

### Step 4: Save and Present

1. Save to `/mnt/user-data/outputs/<filename>.xlsx`
2. Use `present_files` to share with the user

## Example

**Input document** (abbreviated):
```
תפריט בית חנה-בוקר 9/12
אולם הדר-220 מנות
סלטים: חציל יוני, חומוס, פסטה איטלקית
מנה ראשונה: בורקס תפו"א +רוטב
תוספות: צ'יפס-כמות כפולה, אורז+חמוציות
מנה אחרונה: גלידה מיניס

אולם גוטניק-150 מנות
צ'יפס, נקניק פרווה, גלידה מיניס, פלטות ירקות
```

**Output columns:** אולם | כמות מנות | סלטים | מנה ראשונה | תוספות | מנה אחרונה

## Edge Cases

- **No explicit categories in a hall:** If a hall lists items without category headers (like אולם גוטניק above), try to match items to categories from other halls. If no match, put all items in a "פריטים" (items) column.
- **Mixed formatting:** Documents may use bold `**text**`, colons, or line breaks to separate categories. Handle all three.
- **Multiple events in one file:** If detected, create a separate sheet per event.
- **Missing quantities:** If no "מנות" number is found, leave כמות מנות empty rather than guessing.
- **Special notes:** Keep parenthetical notes like "(לא בשרי!)" or descriptors like "כמות כפולה" or "בשפעעע" attached to the item name.

## Dependencies

All standard — no internet needed:
- `openpyxl` (pre-installed)
- `python-docx` (pre-installed) for .docx reading
- Python 3 standard library
