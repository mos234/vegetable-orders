<div dir="rtl">

# מפת קוד - שוק הירקות

## מבנה הפרויקט

```
vegetable-orders/
├── index.html              (320 שורות) - דף הבית / דשבורד
├── new-order.html          (331 שורות) - יצירת הזמנה חדשה
├── orders-list.html        (224 שורות) - רשימת הזמנות
├── new-return.html         (348 שורות) - יצירת החזרה חדשה
├── returns-list.html       (233 שורות) - רשימת החזרות
├── suppliers.html          (251 שורות) - ניהול ספקים
├── monthly-report.html     (316 שורות) - דו"ח חודשי
├── manifest.json           (56 שורות)  - הגדרות PWA
├── service-worker.js       (181 שורות) - Service Worker לאופליין
├── icons/
│   ├── icon.svg            - אייקון SVG
│   ├── icon-192x192.png    - אייקון 192px
│   └── icon-512x512.png    - אייקון 512px
└── js/
    ├── utils.js            (235 שורות) - פונקציות עזר משותפות
    ├── storage.js          (470 שורות) - שכבת אחסון (LocalStorage)
    ├── messaging.js        (160 שורות) - WhatsApp / SMS
    ├── app.js              (93 שורות)  - דשבורד ראשי
    ├── orders.js           (573 שורות) - לוגיקת יצירת הזמנה
    ├── orders-list.js      (360 שורות) - לוגיקת רשימת הזמנות
    ├── returns.js          (763 שורות) - לוגיקת יצירת החזרה
    ├── returns-list.js     (351 שורות) - לוגיקת רשימת החזרות
    ├── suppliers.js        (245 שורות) - לוגיקת ניהול ספקים
    ├── monthly-report.js   (240 שורות) - לוגיקת דו"ח חודשי
    └── export.js           (343 שורות) - ייצוא Excel
```

**סה"כ: ~6,100 שורות קוד | 7 דפי HTML | 11 קבצי JavaScript | 147 פונקציות**

---

## קבצי JavaScript - פירוט פונקציות

### `js/utils.js` - פונקציות עזר משותפות (10 פונקציות)
קובץ ליבה שנטען בכל הדפים. מכיל פונקציות שירות גלובליות.

| פונקציה | תיאור |
|---|---|
| `showToast(message, type)` | הצגת הודעה צפה (success/error) |
| `formatDateHebrew(dateStr)` | המרת תאריך לפורמט עברי (DD/MM/YYYY) |
| `escapeHtml(text)` | הגנה מפני XSS - escape לתווים מיוחדים |
| `buildOrderMessage(order)` | בניית טקסט הזמנה לשליחה |
| `buildReturnMessage(returnObj)` | בניית טקסט החזרה לשליחה |
| `debounce(func, wait)` | דיליי לאירועי input |
| `getStatusBadgeHtml(status)` | תג סטטוס הזמנה (טיוטה/נשלח/סופק/בוטל) |
| `getReturnStatusBadgeHtml(status)` | תג סטטוס החזרה (ממתין/אושר/נדחה) |
| `toggleMobileMenu()` | פתיחה/סגירה של תפריט המבורגר |
| `addStyles()` | הזרקת CSS לאנימציות מודלים (IIFE) |

---

### `js/storage.js` - שכבת אחסון (26 פונקציות)
מנהל את כל הנתונים ב-LocalStorage. שלושה אוספים: ספקים, הזמנות, החזרות.

**מפתחות אחסון:**
- `vegetable_suppliers` - רשימת ספקים
- `vegetable_orders` - רשימת הזמנות
- `vegetable_returns` - רשימת החזרות

| פונקציה | תיאור |
|---|---|
| `initStorage()` | אתחול מפתחות אחסון אם לא קיימים |
| `getData(key)` / `saveData(key, data)` | קריאה/כתיבה כלליות |
| **ספקים** | |
| `getSuppliers()` | קבלת כל הספקים |
| `saveSupplier(supplier)` | שמירת ספק חדש |
| `updateSupplier(id, updatedData)` | עדכון ספק |
| `deleteSupplier(id)` | מחיקת ספק |
| `getSupplierById(id)` | חיפוש ספק לפי ID |
| **הזמנות** | |
| `getOrders()` | קבלת כל ההזמנות |
| `saveOrder(order)` | שמירת הזמנה חדשה |
| `updateOrder(id, updatedData)` | עדכון הזמנה |
| `deleteOrder(id)` | מחיקת הזמנה |
| `getOrderById(id)` | חיפוש הזמנה לפי ID |
| `generateOrderNumber()` | יצירת מספר הזמנה (#1001+) |
| `getOrdersByStatus(status)` | סינון הזמנות לפי סטטוס |
| `getOrdersBySupplierId(supplierId)` | סינון הזמנות לפי ספק |
| **החזרות** | |
| `getReturns()` | קבלת כל ההחזרות |
| `saveReturn(returnObj)` | שמירת החזרה חדשה |
| `updateReturn(id, updatedData)` | עדכון החזרה |
| `deleteReturn(id)` | מחיקת החזרה |
| `getReturnById(id)` | חיפוש החזרה לפי ID |
| `generateReturnNumber()` | יצירת מספר החזרה (R#5001+) |
| `getReturnsByOrderId(orderId)` | החזרות לפי הזמנה |
| `getReturnsBySupplierId(supplierId)` | החזרות לפי ספק |
| **גיבוי** | |
| `exportAllData()` | ייצוא כל הנתונים לקובץ JSON |
| `importAllData(event)` | ייבוא נתונים מקובץ JSON |

---

### `js/messaging.js` - שליחת הודעות (8 פונקציות)
אינטגרציה עם WhatsApp ו-SMS דרך URL schemes.

| פונקציה | תיאור |
|---|---|
| `formatPhoneNumber(phone)` | עיצוב טלפון לפורמט בינלאומי (972) |
| `formatPhoneForSMS(phone)` | עיצוב טלפון ל-SMS |
| `sendOrderToWhatsApp(order)` | שליחת הזמנה ב-WhatsApp |
| `sendOrderToSMS(order)` | שליחת הזמנה ב-SMS |
| `openWhatsAppChat(phone)` | פתיחת צ'אט WhatsApp |
| `openSMSChat(phone)` | פתיחת צ'אט SMS |
| `sendWhatsAppMessage(phone, message)` | שליחת הודעה חופשית ב-WhatsApp |
| `sendSMSMessage(phone, message)` | שליחת הודעה חופשית ב-SMS |

---

### `js/app.js` - דשבורד ראשי (2 פונקציות)
לוגיקה של דף הבית בלבד.

| פונקציה | תיאור |
|---|---|
| `renderDashboard()` | חישוב סטטיסטיקות + הצגת הזמנות אחרונות + סטטיסטיקות החזרות |
| `setupNavigation()` | הגדרת אירועי ניווט |

---

### `js/orders.js` - יצירת הזמנה (18 פונקציות)
לוגיקת הטופס של `new-order.html`. כולל autocomplete ל-50 ירקות.

| פונקציה | תיאור |
|---|---|
| `initOrderPage()` | אתחול דף ההזמנה |
| `setupDateDefaults()` | הגדרת תאריכים ברירת מחדל |
| `formatDateForInput(date)` | המרת תאריך לפורמט input |
| `populateSupplierDropdown()` | מילוי dropdown ספקים |
| `setupAddItemButton()` | הגדרת כפתור "הוסף פריט" |
| `addNewItemRow()` | הוספת שורת פריט חדשה לטבלה |
| `setupItemRowListeners(itemId)` | הגדרת listeners לשורת פריט |
| `showAutocomplete(itemId, query)` | הצגת autocomplete לשם פריט |
| `hideAutocomplete(itemId)` | הסתרת autocomplete |
| `handleAutocompleteKeydown(e, itemId)` | ניווט מקלדת ב-autocomplete |
| `selectAutocomplete(itemId, value)` | בחירת פריט מ-autocomplete |
| `updateItemData(itemId, field, value)` | עדכון נתוני פריט |
| `calculateItemTotal(itemId)` | חישוב סה"כ לפריט |
| `removeItemRow(itemId)` | מחיקת שורת פריט |
| `updateOrderSummary()` | עדכון סיכום הזמנה (סה"כ + מספר פריטים) |
| `setupActionButtons()` | הגדרת כפתורי שמירה/שליחה |
| `saveOrderAction(action)` | שמירת ההזמנה (draft/whatsapp/sms) |
| `resetOrderForm()` | איפוס הטופס |

---

### `js/orders-list.js` - רשימת הזמנות (12 פונקציות)
לוגיקת `orders-list.html`. צפייה, סינון, ושליחה מחדש.

| פונקציה | תיאור |
|---|---|
| `initOrdersListPage()` | אתחול דף רשימת ההזמנות |
| `populateSupplierFilter()` | מילוי dropdown סינון ספקים |
| `setupFilters()` | הגדרת listeners לפילטרים |
| `renderOrdersList()` | רינדור רשימת ההזמנות (כרטיסים) |
| `getFilteredOrders()` | סינון הזמנות לפי סטטוס/ספק/חיפוש |
| `updateStats()` | עדכון סטטיסטיקות (סה"כ/טיוטה/נשלח/סופק) |
| `viewOrder(orderId)` | פתיחת מודל צפייה בהזמנה |
| `closeViewModal()` | סגירת מודל |
| `updateOrderStatus(orderId, status)` | עדכון סטטוס הזמנה |
| `resendWhatsApp(orderId)` | שליחה מחדש ב-WhatsApp |
| `resendSMS(orderId)` | שליחה מחדש ב-SMS |
| `deleteOrderConfirm(orderId)` | מחיקת הזמנה עם אישור |

---

### `js/returns.js` - יצירת החזרה (21 פונקציות)
לוגיקת `new-return.html`. דומה ל-orders.js עם התאמות להחזרות.

| פונקציה | תיאור |
|---|---|
| `initReturnPage()` | אתחול + קריאת orderId מ-URL |
| `setupReturnDateDefault()` | תאריך ברירת מחדל |
| `formatReturnDateForInput(date)` | המרת תאריך |
| `populateOrderDropdown()` | מילוי dropdown הזמנות (רק סטטוס delivered) |
| `populateReturnSupplierDropdown()` | מילוי dropdown ספקים |
| `onOrderSelected(orderId)` | מילוי אוטומטי של ספק + פריטים מהזמנה |
| `setupAddReturnItemButton()` | כפתור "הוסף פריט" |
| `addNewReturnItemRow()` | הוספת שורת פריט |
| `addPrefilledReturnItem(item)` | הוספת פריט מלא מהזמנה |
| `setupReturnItemRowListeners(itemId)` | listeners לשורת פריט |
| `showReturnAutocomplete(itemId, query)` | autocomplete |
| `hideReturnAutocomplete(itemId)` | הסתרת autocomplete |
| `handleReturnAutocompleteKeydown(e, itemId)` | ניווט מקלדת |
| `selectReturnAutocomplete(itemId, value)` | בחירת פריט |
| `updateReturnItemData(itemId, field, value)` | עדכון נתוני פריט |
| `calculateReturnItemTotal(itemId)` | חישוב סה"כ לפריט |
| `removeReturnItemRow(itemId)` | מחיקת שורת פריט |
| `updateReturnSummary()` | עדכון סיכום החזרה |
| `setupReturnActionButtons()` | כפתורי שמירה/שליחה |
| `saveReturnAction(action)` | שמירת ההחזרה (pending/whatsapp/sms) |
| `resetReturnForm()` | איפוס הטופס |

---

### `js/returns-list.js` - רשימת החזרות (12 פונקציות)
לוגיקת `returns-list.html`. זהה במבנה ל-orders-list.js.

| פונקציה | תיאור |
|---|---|
| `initReturnsListPage()` | אתחול דף רשימת ההחזרות |
| `populateReturnSupplierFilter()` | מילוי dropdown סינון ספקים |
| `setupReturnFilters()` | הגדרת listeners לפילטרים |
| `renderReturnsList()` | רינדור רשימת ההחזרות |
| `getFilteredReturns()` | סינון לפי סטטוס/ספק/חיפוש |
| `updateReturnStats()` | עדכון סטטיסטיקות (סה"כ/ממתינות/אושרו) |
| `viewReturn(returnId)` | פתיחת מודל צפייה בהחזרה |
| `closeReturnViewModal()` | סגירת מודל |
| `updateReturnStatus(returnId, status)` | עדכון סטטוס החזרה |
| `resendReturnWhatsApp(returnId)` | שליחה מחדש ב-WhatsApp |
| `resendReturnSMS(returnId)` | שליחה מחדש ב-SMS |
| `deleteReturnConfirm(returnId)` | מחיקת החזרה עם אישור |

---

### `js/suppliers.js` - ניהול ספקים (9 פונקציות)

| פונקציה | תיאור |
|---|---|
| `initSuppliersPage()` | אתחול דף ספקים |
| `setupSupplierForm()` | הגדרת טופס הוספת ספק |
| `setupEditModal()` | הגדרת מודל עריכה |
| `openEditModal(id)` | פתיחת מודל עריכה |
| `closeEditModal()` | סגירת מודל עריכה |
| `renderSuppliersList()` | רינדור רשימת ספקים |
| `handleWhatsApp(id)` | פתיחת WhatsApp לספק |
| `handleSMS(id)` | פתיחת SMS לספק |
| `handleDelete(id)` | מחיקת ספק עם אישור |

---

### `js/monthly-report.js` - דו"ח חודשי (10 פונקציות)

| פונקציה | תיאור |
|---|---|
| `initMonthlyReportPage()` | אתחול דף הדו"ח |
| `setDefaultMonth()` | הגדרת חודש נוכחי כברירת מחדל |
| `setupEventListeners()` | listeners לשינוי חודש |
| `loadReport()` | טעינת נתוני הדו"ח |
| `getOrdersForMonth(month, year)` | סינון הזמנות לפי חודש |
| `updateSummaryStats(orders)` | עדכון סטטיסטיקות סיכום |
| `renderSupplierBreakdown(orders)` | פירוט לפי ספק |
| `renderOrdersTimeline(orders)` | ציר זמן הזמנות |
| `renderOrdersTable(orders)` | טבלת הזמנות |
| `downloadExcel()` | הורדת דו"ח Excel |

---

### `js/export.js` - ייצוא Excel (6 פונקציות)
שימוש בספריית SheetJS (xlsx) לייצוא.

| פונקציה | תיאור |
|---|---|
| `exportMonthlyReport(orders, month, year)` | ייצוא דו"ח חודשי ל-Excel |
| `createSummarySheet(orders, month, year)` | יצירת גיליון סיכום |
| `createDetailSheet(orders)` | יצירת גיליון פירוט |
| `formatDateForExcel(dateStr)` | המרת תאריך לפורמט Excel |
| `exportOrdersToExcel(orders, filename)` | ייצוא הזמנות ל-Excel |
| `exportSuppliersToExcel(suppliers)` | ייצוא ספקים ל-Excel |

---

## זרימת נתונים (Data Flow)

```
דפי HTML
    ↓ טוענים
js/utils.js + js/storage.js + js/messaging.js  (קבצי ליבה)
    ↓ ואז
js/[page-specific].js  (לוגיקה ספציפית לדף)

LocalStorage
    ├── vegetable_suppliers  →  [{id, name, phone, address, notes}]
    ├── vegetable_orders     →  [{id, orderNumber, supplierId, supplierName,
    │                              supplierPhone, orderDate, deliveryDate,
    │                              items[], total, status, notes, createdAt}]
    └── vegetable_returns    →  [{id, returnNumber, orderId, orderNumber,
                                   supplierId, supplierName, supplierPhone,
                                   returnDate, reason, items[], total,
                                   status, notes, createdAt}]
```

## איזה דף טוען איזה JS

| דף HTML | קבצי JS |
|---|---|
| `index.html` | utils, storage, messaging, app |
| `new-order.html` | utils, storage, messaging, orders |
| `orders-list.html` | utils, storage, messaging, orders-list |
| `new-return.html` | utils, storage, messaging, returns |
| `returns-list.html` | utils, storage, messaging, returns-list |
| `suppliers.html` | utils, storage, messaging, suppliers |
| `monthly-report.html` | utils, storage, monthly-report, export |

</div>
