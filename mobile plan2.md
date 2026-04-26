# תוכנית: הפיכת vegetable-orders לאפליקציה מובייל

## הקשר
הפרויקט הוא PWA בסיסי עם service worker ו-manifest.json, אבל חסר לו:
- כפתור "התקן אפליקציה" שיוזמן ע"י המשתמש
- splash screen אמיתי
- עטיפת Capacitor להפקת APK לאנדרואיד

המטרה: שיפור חוויית ה-PWA **וגם** הפקת קובץ APK שאפשר להתקין ישירות על אנדרואיד.

---

## שלב א׳ — שיפורי PWA

### 1. כפתור "התקן אפליקציה"
**קבצים:** `index.html` + `js/app.js`

- לכיד אירוע `beforeinstallprompt` ב-`app.js`
- להוסיף כפתור התקנה צף ב-`index.html` (נסתר כברירת מחדל, מופיע רק כשהדפדפן תומך)
- לאחר התקנה — להסתיר את הכפתור ולהציג toast "האפליקציה הותקנה בהצלחה"

### 2. שיפור `manifest.json`
**קובץ:** `manifest.json`

- להוסיף `screenshots` (2 תמונות — wide + narrow) לחווית התקנה עשירה
- להוסיף `display_override: ["window-controls-overlay", "standalone"]`
- להוסיף `id` ייחודי לאפליקציה

### 3. מסך פתיחה (Splash Screen)
**קבצים:** `css/styles.css` + כל קובצי ה-HTML

- להוסיף מסך פתיחה עם לוגו ואנימציית fade-out בטעינה ראשונה
- CSS: `#splash-screen` עם `position:fixed`, `z-index:9999`, fade-out אחרי 1.5 שניות
- לכלול את ה-HTML של ה-splash בכל הדפים

### 4. עדכון service worker
**קובץ:** `service-worker.js`

- להוסיף קבצים שחסרים כרגע ל-`CACHE_URLS`:
  - `catalog.html`, `groups.html`, `new-return.html`, `returns-list.html`
  - `js/catalog.js`, `js/groups.js`, `js/returns.js`, `js/returns-list.js`, `js/theme.js`
- לשדרג ל-`CACHE_NAME = 'vegetable-orders-v3'`

---

## שלב ב׳ — Capacitor (APK לאנדרואיד)

### מה זה Capacitor?
Capacitor עוטף את ה-HTML/CSS/JS ומייצר אפליקציה אנדרואיד אמיתית.  
הקוד לא משתנה — פשוט מוסיפים שכבת עטיפה מסביב לפרויקט הקיים.

### דרישות מקדימות
- Node.js + npm מותקנים
- Android Studio מותקן
- Java JDK 17

### שלבי הטמעה

**1. אתחול npm + התקנת Capacitor**
```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
```

**2. קובץ `capacitor.config.json` (חדש)**
```json
{
  "appId": "com.vegetableorders.app",
  "appName": "ניהול הזמנות ירקות",
  "webDir": ".",
  "bundledWebRuntime": false,
  "android": {
    "allowMixedContent": true
  }
}
```

**3. הוספת פלטפורמת אנדרואיד**
```bash
npx cap add android
npx cap sync
```

**4. בניית APK**
```bash
npx cap open android         # פותח Android Studio לבנייה ויזואלית
# או ישירות:
cd android && ./gradlew assembleDebug
```

**5. מיקום ה-APK לאחר בנייה**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## קבצים שישתנו / יווצרו

| קובץ | פעולה |
|------|--------|
| `manifest.json` | עדכון — screenshots, display_override, id |
| `service-worker.js` | עדכון — הוספת קבצים חסרים, שדרוג cache version |
| `css/styles.css` | הוספת styles למסך פתיחה |
| `index.html` | הוספת כפתור התקנה + splash HTML |
| כל שאר קובצי HTML | הוספת splash HTML |
| `js/app.js` | לוגיקת install prompt |
| `capacitor.config.json` | **חדש** |
| `package.json` | **חדש** (npm init) |
| `android/` | **תיקייה חדשה** (נוצרת ע"י Capacitor) |

---

## בדיקת תוצאות

1. **כפתור התקנה:** לפתוח ב-Chrome על מובייל → לראות כפתור "התקן" → ללחוץ → האפליקציה מופיעה על מסך הבית כאייקון
2. **Splash screen:** לפתוח → לראות מסך פתיחה עם לוגו שנעלם אחרי ~1.5 שניות
3. **APK:** להעביר `app-debug.apk` לאנדרואיד → להתקין → האפליקציה נפתחת ב-standalone ללא כתובת URL
4. **Offline:** לכבות WiFi → האפליקציה ממשיכה לעבוד מה-cache
