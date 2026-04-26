# 📱 תוכנית עבודה מאוחדת ושלמה: Vegetable Orders Mobile v3

**הפיכת הפרויקט vegetable-orders לאפליקציית מובייל היברידית (PWA + Capacitor APK)**

---

## 🎯 אסטרטגיית העל
תוכנית זו מאחדת את כל הפרטים הטכניים משתי התוכניות הקודמות לכדי מקור אמת אחד. המטרה היא שיפור חוויית ה-PWA עבור משתמשי דפדפן והפקת קובץ APK להתקנה ישירה על אנדרואיד באמצעות Capacitor.

---

## 🛠 שלב א׳ — שיפורי PWA (חוויית משתמש ו-Offline)

### 1.1 התאמה למכשירים מודרניים (UI/UX)
* **Safe Area:** הוספת `viewport-fit=cover` ל-Meta viewport ב-`index.html`.
* **CSS:** שימוש ב-`safe-area-inset` ב-CSS כדי למנוע חיתוך של אלמנטים (כמו ה-Bottom Nav) במכשירים עם Notch.
* **Touch:** הגדרת `user-select: none` ו-`touch-action` לכפתורים לשיפור התחושה המוביילית.

### 1.2 עדכון `manifest.json` (חוויית התקנה עשירה)
* **Display:** הגדרת `display: standalone` ו-`display_override: ["window-controls-overlay", "standalone"]`.
* **Orientation:** קיבוע ל-`portrait` (לאורך).
* **Screenshots:** הוספת 2 תמונות (Wide + Narrow) כדי שחלונית ההתקנה תיראה כמו בחנות אפליקציות.
* **Shortcuts:** הוספת קיצורי דרך מהסמל (למשל: הזמנה חדשה).
* **ID:** הוספת `id` ייחודי למניעת כפילויות בהתקנה.

### 1.3 Service Worker v3 (100% Offline)
עדכון ה-Cache ב-`service-worker.js`:
* **גרסה:** שדרוג ל-`CACHE_NAME = 'vegetable-orders-v3'`.
* **קבצים נוספים ל-Cache:** * HTML: `catalog.html`, `groups.html`, `new-return.html`, `returns-list.html`.
    * JS: `js/catalog.js`, `js/groups.js`, `js/returns.js`, `js/returns-list.js`, `js/theme.js`.

### 1.4 מסך פתיחה (Splash Screen) ו-Install Prompt
* **כפתור התקנה:** לכידת אירוע `beforeinstallprompt` ב-`js/app.js` והצגת כפתור צף ב-`index.html` שנסתר כברירת מחדל.
* **Splash Screen:** הוספת אלמנט `#splash-screen` ב-HTML עם לוגו ואנימציית fade-out לאחר 1.5 שניות בטעינה הראשונה.

---

## 🤖 שלב ב׳ — Capacitor (APK לאנדרואיד)

### 2.1 דרישות מקדימות
* Node.js + npm.
* Android Studio + Android SDK.
* Java JDK 17.

### 2.2 שיפור ה-Clipboard (שיתוף לוואטסאפ)
בשל מגבלות אבטחה בדפדפנים, נשתמש בתוסף Native כדי להבטיח שהעתקת ההזמנות תעבוד תמיד:
* **התקנה:** `npm install @capacitor/clipboard`.
* **קונפיגורציה:** הוספת `"Clipboard": { "enabled": true }` לקובץ ההגדרות.
* **שימוש:** החלפת ה-API של הדפדפן ב-`Clipboard.write({ string: text })`.

### 2.3 פקודות בנייה ותהליך ה-Build
סדר הפקודות להקמת הפרויקט ויצירת ה-APK:

1.  **אתחול npm והתקנת Capacitor:**
    ```bash
    npm init -y
    npm install @capacitor/core @capacitor/cli @capacitor/android
    ```
2.  **יצירת קובץ `capacitor.config.json`:**
    ```json
    {
      "appId": "com.stokiq.orders",
      "appName": "ניהול הזמנות ירקות",
      "webDir": ".",
      "android": { "allowMixedContent": true },
      "plugins": { "Clipboard": { "enabled": true } }
    }
    ```
3.  **הוספת פלטפורמת אנדרואיד וסנכרון:**
    ```bash
    npx cap add android
    npx cap sync
    ```
4.  **בניית ה-APK ב-Android Studio:**
    ```bash
    npx cap open android
    ```
    בתוך Android Studio: `Build` > `Build Bundle(s)/APK(s)` > `Build APK(s)`.
5.  **מיקום הקובץ המוכן:**
    `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 📋 טבלת ריכוז שינויים בקבצים

| קובץ | פעולה | דגש לביצוע |
| :--- | :--- | :--- |
| `manifest.json` | עדכון | screenshots, shortcuts, display_override ו-ID. |
| `service-worker.js` | שדרוג (v3) | הוספת כל קבצי ה-JS וה-HTML החסרים ל-Cache. |
| `index.html` | עריכה | Splash HTML, Meta viewport-fit וכפתור התקנה. |
| `css/styles.css` | עריכה | עיצוב ה-Splash וטיפול ב-Safe Area (Notch). |
| `js/app.js` | לוגיקה | ניהול ה-Install Prompt והטמעת תוסף ה-Clipboard. |
| `capacitor.config.json`| **חדש** | הגדרת appId, appName ותוספים. |

---
*נערך עבור Moshe - פרויקט vegetable-orders - אפריל 2026*