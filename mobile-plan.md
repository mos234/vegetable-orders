# 📱 תוכנית: הפיכת Vegetable Orders ל-אפליקציה מובייל
**גישה: PWA שיפור → Capacitor APK**

---

## שלב 1 — שיפור PWA (עצמאי, ללא כלים)
> מטרה: האפליקציה תיראה ותרגיש כמו אפליקציה אמיתית כשמותקנת מהדפדפן

### 1.1 שיפור `manifest.json`
- בדיקה ועדכון `start_url`, `display: standalone`, `orientation: portrait`
- הוספת `shortcuts` — קיצורי דרך מהסמל (הזמנה חדשה / רשימת הזמנות)
- וידוא שקיימים אייקונים בגדלים: 192x192, 512x512 (maskable)

### 1.2 Service Worker (`sw.js`)
- יצירה/שיפור של Service Worker לתמיכה **אופליין מלאה**
- Cache strategy: `Cache First` לכל הקבצים הסטטיים (HTML, CSS, JS, אייקונים)
- הכל נשמר ב-localStorage — אין קריאות רשת, לכן האפליקציה עובדת 100% אופליין

### 1.3 Install Prompt (באנר התקנה)
- הוספת קוד שמאזין לאירוע `beforeinstallprompt`
- הצגת כפתור "הוסף למסך הבית" בתפריט הראשי
- אחרי התקנה — האפליקציה נפתחת ב-fullscreen ללא שורת כתובת

### 1.4 שיפורי מובייל קטנים
- `viewport-fit=cover` — תמיכה ב-notch של אייפון
- `safe-area-inset` CSS — ה-bottom nav לא נחתך
- `touch-action` ו-`user-select: none` לכפתורים

---

## שלב 2 — Capacitor APK (לאחר השלב הראשון)
> מטרה: קובץ APK ניתן להתקנה על אנדרואיד ← ניתן להפיץ לאחרים

### 2.1 הכנת סביבה (חד-פעמי)
- התקנת **Node.js** (אם לא קיים)
- התקנת **Android Studio** + Android SDK
- `npm init` בתיקיית הפרויקט

### 2.2 אינטגרציית Capacitor
```
npm install @capacitor/core @capacitor/cli
npx cap init "Vegetable Orders" "com.stokiq.orders"
npx cap add android
```

### 2.3 הגדרת `capacitor.config.json`
```json
{
  "appId": "com.stokiq.orders",
  "appName": "StokIQ Orders",
  "webDir": ".",
  "server": { "androidScheme": "https" },
  "plugins": {
    "Clipboard": { "enabled": true }
  }
}
```

### 2.4 Clipboard Plugin (שיפור WhatsApp)
- התקנת `@capacitor/clipboard`
- החלפת `navigator.clipboard.writeText()` ב-`Clipboard.write()` של Capacitor
- **תוצאה:** העתקה ל-clipboard **תעבוד בצורה מהימנה** גם על אנדרואיד ישן

### 2.5 Build ו-APK
```
npx cap sync
npx cap open android        ← פותח Android Studio
```
ב-Android Studio:
- `Build → Build Bundle(s)/APK(s) → Build APK(s)`
- קובץ `app-debug.apk` מוכן לשיתוף

---

## סדר ביצוע מומלץ

| # | משימה | זמן משוער | תלויות |
|---|-------|-----------|---------|
| 1 | שיפור manifest.json | 20 דקות | — |
| 2 | כתיבת Service Worker | 45 דקות | — |
| 3 | Install Prompt | 15 דקות | — |
| 4 | שיפורי CSS מובייל | 20 דקות | — |
| 5 | התקנת Node + Android Studio | 30-60 דקות | צריך Internet |
| 6 | אינטגרציית Capacitor | 20 דקות | שלב 5 |
| 7 | Clipboard Plugin | 15 דקות | שלב 6 |
| 8 | Build APK | 20 דקות | שלב 5-7 |

**סה"כ משוער: ~3-4 שעות (כולל הורדות)**

---

## מה *לא* ישתנה
- ❌ אין שכתוב של קוד קיים
- ❌ אין שינוי בלוגיקת הנתונים
- ❌ אין שינוי ב-localStorage
- ✅ כל הפונקציות הקיימות עובדות בדיוק אותו דבר

---

## תוצאה סופית
1. **PWA** — לחיצה בדפדפן Chrome → "הוסף למסך הבית" → אפליקציה עם אייקון, ללא שורת URL, עובד אופליין
2. **APK** — קובץ שאפשר לשלוח ב-WhatsApp לכל מי שצריך → מתקין ישירות על אנדרואיד
