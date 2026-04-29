# CLAUDE.md — מנהל ההזמנות

קובץ זה מתאר את מבנה הפרויקט לשימוש Claude. קרא אותו לפני כל שינוי.

---

## מה האפליקציה עושה

PWA (אפליקציית ווב מותקנת) לניהול הזמנות ירקות/מזון לעסק. כל הנתונים שמורים ב-LocalStorage בדפדפן — אין שרת. כתוב ב-HTML + Tailwind CSS + Vanilla JS.

---

## מבנה קבצים

```
vegetable-orders/
├── index.html              - דף הבית / דשבורד
├── new-order.html          - יצירת הזמנה חדשה
├── orders-list.html        - רשימת הזמנות
├── new-return.html         - יצירת החזרה חדשה
├── returns-list.html       - רשימת החזרות
├── catalog.html            - מחירונים ותבניות (שונה מ"קטלוג מחירים")
├── suppliers.html          - ניהול ספקים
├── monthly-report.html     - דו"ח חודשי
├── groups.html             - ניהול קבוצות WhatsApp
├── settings.html           - הגדרות (מצב כהה + קבוצות WhatsApp)
├── service-worker.js       - Service Worker לאופליין + מטמון
├── manifest.json           - הגדרות PWA
└── js/
    ├── utils.js            - פונקציות עזר גלובליות (נטען בכל הדפים)
    ├── storage.js          - שכבת אחסון LocalStorage (נטען בכל הדפים)
    ├── messaging.js        - שליחת WhatsApp / SMS / Email
    ├── theme.js            - מצב כהה/בהיר
    ├── sync.js             - סנכרון offline (נטען בכל הדפים)
    ├── app.js              - לוגיקת דשבורד (index.html)
    ├── orders.js           - לוגיקת הזמנה חדשה
    ├── orders-list.js      - לוגיקת רשימת הזמנות
    ├── catalog.js          - לוגיקת מחירונים ותבניות
    ├── returns.js          - לוגיקת החזרה חדשה
    ├── returns-list.js     - לוגיקת רשימת החזרות
    ├── suppliers.js        - לוגיקת ניהול ספקים
    ├── monthly-report.js   - לוגיקת דו"ח חודשי
    └── export.js           - ייצוא Excel (SheetJS)
```

---

## איזה דף טוען איזה JS

| דף HTML | קבצי JS (לפי סדר טעינה) |
|---|---|
| `index.html` | utils, storage, messaging, app, theme, sync |
| `new-order.html` | utils, storage, messaging, orders, theme, sync |
| `orders-list.html` | utils, storage, messaging, orders-list, theme, sync |
| `new-return.html` | utils, storage, messaging, returns, theme, sync |
| `returns-list.html` | utils, storage, messaging, returns-list, theme, sync |
| `catalog.html` | utils, storage, catalog, theme, sync |
| `suppliers.html` | utils, storage, messaging, suppliers, theme, sync |
| `monthly-report.html` | utils, storage, monthly-report, export, theme, sync |
| `settings.html` | utils, storage, theme, sync |

---

## מבנה הנתונים ב-LocalStorage

```
vegetable_suppliers        → [{id, name, phone, email, notes, createdAt}]

vegetable_orders           → [{id, orderNumber, supplierId, supplierName,
                               supplierPhone, orderDate, deliveryDate,
                               deliveryTime, mainHallName, items[], halls[],
                               total, status, notes, createdAt}]

vegetable_returns          → [{id, returnNumber, orderId, orderNumber,
                               supplierId, supplierName, supplierPhone,
                               returnDate, reason, items[], total,
                               status, notes, createdAt}]

vegetable_price_catalog    → ARRAY: [{id, name, price, category, notes,
                               supplierId, unit}]
                             ⚠️ מבנה ישן היה OBJECT — יש מיגרציה אוטומטית ב-getPriceCatalog()

vegetable_catalog_categories → [{key, label, icon}]
                               ברירת מחדל: רק [{key:'all', label:'הכל', icon:'fa-tag'}]

vegetable_settings         → {key: value}
vegetable_groups           → [{id, name, link, createdAt}]
```

---

## storage.js — פונקציות מרכזיות

### ספקים
- `getSuppliers()` / `saveSupplier(supplier)` / `updateSupplier(id, data)` / `deleteSupplier(id)` / `getSupplierById(id)`

### הזמנות
- `getOrders()` / `saveOrder(order)` / `updateOrder(id, data)` / `deleteOrder(id)` / `getOrderById(id)`
- `getOrdersByStatus(status)` / `getOrdersBySupplierId(supplierId)`

### החזרות
- `getReturns()` / `saveReturn(obj)` / `updateReturn(id, data)` / `deleteReturn(id)` / `getReturnById(id)`

### מחירון (array-based — שונה ב-2026)
- `getPriceCatalog()` — מחזיר array. כולל מיגרציה אוטומטית מפורמט ישן (object)
- `saveCatalogItem(item)` — item עם `{id?, name, price, unit, category, notes, supplierId}`; אם יש id → עדכון, אחרת → יצירה
- `deleteCatalogItem(id)` — מוחק לפי id (לא לפי שם!)
- `getCatalogItemsBySupplier(supplierId)` — פילטר לפי ספק
- `updatePriceCatalog(items)` — עדכון מחירים בלבד

### קטגוריות
- `getCatalogCategories()` / `saveCatalogCategories(cats)`

### גיבוי
- `exportAllData()` / `importAllData(event)` — פונקציות קיימות אבל **לא מחוברות לממשק** (חסר כפתורים ב-settings.html)

---

## catalog.js — מחירונים ותבניות

**תצוגה:** כרטסיות קטגוריה → בתוך כל כרטסיה: בלוקים לפי ספק → כל בלוק: טבלת פריטים + שדות כמות זמניים + כפתור "הפוך להזמנה"

**חשוב:**
- כרטסיית "הכל" מציגה רק פריטים **ללא קטגוריה** (לא הכל!)
- שדות כמות הם **זמניים בלבד** — לא נשמרים, מתאפסים בכל טעינה
- `convertSupplierToOrder(supplierId)` — שומר ב-sessionStorage ומנווט ל-`new-order.html?fromTemplate=1`

**פונקציות עיקריות:**
- `renderPriceLists()` — רינדור כל הבלוקים
- `openAddCatalogModal(presetSupplierId)` / `openEditCatalogModal(id)` / `saveCatalogModal()`
- `deleteCatalogItemConfirm(id)` — מוחק לפי id
- `convertSupplierToOrder(supplierId)`
- `openManageCategoriesModal()` / `saveCategoriesAndClose()`

---

## orders.js — הזמנה חדשה

**Autocomplete חכם:**
- מסנן לפי הספק הנבחר ב-dropdown
- אם לספק אין פריטים במחירון → fallback לרשימה הכללית
- `getSelectedSupplierId()` — מחזיר supplierId מה-dropdown
- `getCatalogPrice(name)` — מחפש לפי שם + ספק, fallback לכל ספק

**טעינת תבנית:**
- `loadFromTemplate()` — מופעל כש-URL מכיל `?fromTemplate=1`
- קורא מ-`sessionStorage.getItem('templateOrder')` את `{supplierId, items[]}`
- ממלא אוטומטית ספק + שורות פריטים

---

## ניווט

**Sidebar (desktop):** קיים בכל דף HTML ישירות (לא component)
**Bottom nav (mobile):** קיים בכל דף HTML ישירות

כשמשנים שם/קישור בניווט — צריך לעדכן **בכל קבצי ה-HTML** ידנית.

---

## דגשים חשובים לפני עריכה

1. **אין framework** — Vanilla JS בלבד. אין React/Vue/Angular.
2. **אין build process** — עריכה ישירה בקבצים, push ל-GitHub Pages.
3. **כל JS הוא global** — פונקציות מוגדרות ב-`window` ונקראות מה-HTML עם `onclick=`.
4. **Tailwind מ-CDN** — לא מקומי, לא צריך build.
5. **Service Worker מטמן קבצים** — אחרי שינוי, משתמשים צריכים לרענן כדי לקבל עדכון.
6. **גיבוי/סנכרון** — אין סנכרון בין מכשירים. `exportAllData`/`importAllData` קיימות אך לא מחוברות ל-UI.
