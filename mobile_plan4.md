# 📱 תוכנית עבודה מאוחדת ושלמה: Vegetable Orders Mobile v4

**הפיכת הפרויקט vegetable-orders לאפליקציית מובייל היברידית (PWA + Capacitor APK)**

> גרסה זו משלבת את כל שיפורי v3 יחד עם 7 שיפורים חדשים: Offline Sync, Push Notifications, מנגנון עדכון גרסה, אבטחת נתונים, Crash Reporting, Dark Mode ו-Haptic Feedback.

---

## 🎯 אסטרטגיית העל

תוכנית זו מאחדת את כל הפרטים הטכניים מהגרסאות הקודמות לכדי מקור אמת אחד מלא. המטרה היא שיפור חוויית ה-PWA עבור משתמשי דפדפן, הפקת קובץ APK להתקנה ישירה על אנדרואיד באמצעות Capacitor, ובניית תשתית עמידה לאורך זמן.

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

### 1.3 Service Worker v4 (100% Offline + Background Sync)
עדכון ה-Cache ב-`service-worker.js`:
* **גרסה:** שדרוג ל-`CACHE_NAME = 'vegetable-orders-v4'`.
* **קבצים נוספים ל-Cache:**
    * HTML: `catalog.html`, `groups.html`, `new-return.html`, `returns-list.html`.
    * JS: `js/catalog.js`, `js/groups.js`, `js/returns.js`, `js/returns-list.js`, `js/theme.js`.
* **Background Sync — חדש ב-v4:**
    * רישום ל-`sync` event בתוך ה-Service Worker.
    * כאשר משתמש מגיש הזמנה ללא חיבור — שמירתה ב-IndexedDB תחת תור `pending-orders`.
    * כשהרשת חוזרת, ה-Service Worker מעביר את ההזמנות הממתינות אוטומטית:
    ```javascript
    // service-worker.js
    self.addEventListener('sync', (event) => {
      if (event.tag === 'sync-orders') {
        event.waitUntil(syncPendingOrders());
      }
    });

    async function syncPendingOrders() {
      const db = await openDB();
      const pending = await db.getAll('pending-orders');
      for (const order of pending) {
        await fetch('/api/orders', { method: 'POST', body: JSON.stringify(order) });
        await db.delete('pending-orders', order.id);
      }
    }
    ```

### 1.4 מסך פתיחה (Splash Screen) ו-Install Prompt
* **כפתור התקנה:** לכידת אירוע `beforeinstallprompt` ב-`js/app.js` והצגת כפתור צף ב-`index.html` שנסתר כברירת מחדל.
* **Splash Screen:** הוספת אלמנט `#splash-screen` ב-HTML עם לוגו ואנימציית fade-out לאחר 1.5 שניות בטעינה הראשונה.

### 1.5 Dark Mode — חדש ב-v4
* **CSS:** הוספת `prefers-color-scheme: dark` עם כל משתני הצבע המותאמים.
* **שמירת העדפה:** שמירת בחירת המשתמש ב-`localStorage` דרך `js/theme.js`.
* **Toggle:** הוספת כפתור מעבר ידני בתפריט ההגדרות.
```css
/* css/styles.css */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a1a;
    --text-color: #f0f0f0;
    --card-bg: #2d2d2d;
  }
}
```

---

## 🤖 שלב ב׳ — Capacitor (APK לאנדרואיד)

### 2.1 דרישות מקדימות
* Node.js + npm.
* Android Studio + Android SDK.
* Java JDK 17.

### 2.2 שיפור ה-Clipboard (שיתוף לוואטסאפ)
בשל מגבלות אבטחה בדפדפנים, נשתמש בתוסף Native:
* **התקנה:** `npm install @capacitor/clipboard`.
* **קונפיגורציה:** הוספת `"Clipboard": { "enabled": true }` לקובץ ההגדרות.
* **שימוש:** החלפת ה-API של הדפדפן ב-`Clipboard.write({ string: text })`.

### 2.3 Push Notifications — חדש ב-v4
שליחת התראות בזמן אמת על אישור הזמנה, שינוי מחיר, או עדכון סטטוס:
* **התקנה:** `npm install @capacitor/push-notifications`.
* **הגדרת FCM:** יצירת פרויקט ב-Firebase Console, הורדת `google-services.json` לתיקיית `android/app/`.
* **קוד אתחול ב-`js/app.js`:**
```javascript
import { PushNotifications } from '@capacitor/push-notifications';

async function initPushNotifications() {
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive === 'granted') {
    await PushNotifications.register();
  }

  PushNotifications.addListener('registration', (token) => {
    console.log('FCM Token:', token.value);
    // שלח את ה-Token לשרת שלך
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    showInAppNotification(notification.title, notification.body);
  });
}
```

### 2.4 Haptic Feedback — חדש ב-v4
ריטוט עדין בלחיצה על כפתורי פעולה ראשיים (שלח הזמנה, אשר החזרה):
* **התקנה:** `npm install @capacitor/haptics`.
* **שימוש:**
```javascript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// בעת לחיצה על "שלח הזמנה"
await Haptics.impact({ style: ImpactStyle.Medium });
```

### 2.5 אבטחת נתונים מקומיים — חדש ב-v4
מעבר מ-`localStorage` ל-`@capacitor/preferences` לנתונים רגישים (פרטי לקוחות, הזמנות):
* **התקנה:** `npm install @capacitor/preferences`.
* **יתרון:** שכבת הפרדה בין אפליקציות, מוצפן ב-Keychain/Keystore על iOS/Android.
* **שימוש:**
```javascript
import { Preferences } from '@capacitor/preferences';

// שמירה
await Preferences.set({ key: 'orders', value: JSON.stringify(ordersData) });

// קריאה
const { value } = await Preferences.get({ key: 'orders' });
const orders = JSON.parse(value);
```
> ⚠️ **הערה:** `localStorage` יכול להישאר לנתוני UI (העדפת תצוגה, Dark Mode). רק נתוני עסקאות ולקוחות עוברים ל-Preferences.

### 2.6 מנגנון עדכון גרסאות — חדש ב-v4
משתמשים שהתקינו APK לא יקבלו שיפורים אוטומטית — זה פותר את הבעיה:
* **התקנה:** `npm install @capawesome/capacitor-app-update`.
* **בדיקה בעת פתיחת האפליקציה:**
```javascript
import { AppUpdate } from '@capawesome/capacitor-app-update';

async function checkForUpdate() {
  const result = await AppUpdate.getAppUpdateInfo();
  if (result.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE) {
    showUpdateBanner('גרסה חדשה זמינה — לחץ לעדכון');
  }
}
```
* **אפשרות נוספת (ללא חנות):** הפנייה לדאונלואד ישיר של APK חדש מ-URL ידוע.

### 2.7 Crash Reporting עם Sentry — חדש ב-v4
מעקב אוטומטי אחר קריסות ושגיאות JavaScript בייצור:
* **התקנה:** `npm install @sentry/capacitor @sentry/vue`.
* **אתחול ב-`js/app.js`:**
```javascript
import * as Sentry from '@sentry/capacitor';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  release: 'vegetable-orders@4.0.0',
  environment: 'production',
});
```
* **חינמי עד 5,000 שגיאות לחודש** — מספיק לאפליקציה פנימית.
* **דאשבורד:** כל קריסה תתועד ב-Sentry עם stack trace, גרסת מכשיר ושלבי הפעולה שהובילו לשגיאה.

### 2.8 פקודות בנייה ותהליך ה-Build
סדר הפקודות המלא להקמת הפרויקט ויצירת ה-APK:

1. **אתחול npm והתקנת כל החבילות:**
    ```bash
    npm init -y
    npm install @capacitor/core @capacitor/cli @capacitor/android
    npm install @capacitor/clipboard @capacitor/push-notifications
    npm install @capacitor/haptics @capacitor/preferences
    npm install @capawesome/capacitor-app-update
    npm install @sentry/capacitor
    ```

2. **יצירת קובץ `capacitor.config.json`:**
    ```json
    {
      "appId": "com.stokiq.orders",
      "appName": "ניהול הזמנות ירקות",
      "webDir": ".",
      "android": { "allowMixedContent": true },
      "plugins": {
        "Clipboard": { "enabled": true },
        "PushNotifications": { "presentationOptions": ["badge", "sound", "alert"] },
        "Haptics": { "enabled": true }
      }
    }
    ```

3. **הוספת פלטפורמת אנדרואיד וסנכרון:**
    ```bash
    npx cap add android
    npx cap sync
    ```

4. **בניית ה-APK ב-Android Studio:**
    ```bash
    npx cap open android
    ```
    בתוך Android Studio: `Build` > `Build Bundle(s)/APK(s)` > `Build APK(s)`.

5. **מיקום הקובץ המוכן:**
    `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📋 טבלת ריכוז שינויים בקבצים

| קובץ | פעולה | דגש לביצוע |
| :--- | :--- | :--- |
| `manifest.json` | עדכון | screenshots, shortcuts, display_override ו-ID |
| `service-worker.js` | שדרוג (v4) | Cache מלא + Background Sync לתור הזמנות ממתינות |
| `index.html` | עריכה | Splash HTML, Meta viewport-fit וכפתור התקנה |
| `css/styles.css` | עריכה | Dark Mode, עיצוב Splash, טיפול ב-Safe Area |
| `js/app.js` | לוגיקה | Install Prompt, Push Notifications, Sentry init, עדכון גרסה |
| `js/theme.js` | עריכה | שמירת העדפת Dark/Light Mode ב-localStorage |
| `js/orders.js` | עריכה | Haptic Feedback + מעבר ל-Preferences API לנתונים רגישים |
| `capacitor.config.json` | **חדש** | appId, appName, כל התוספים |

---

## 🗓 סדר עדיפויות מומלץ לביצוע

| עדיפות | משימה | השפעה | מורכבות |
| :---: | :--- | :--- | :--- |
| 1 | Background Sync (Offline Orders) | קריטי — נשמת האפליקציה | בינונית |
| 2 | שדרוג Service Worker v4 + Cache | בסיס ל-Offline | נמוכה |
| 3 | Capacitor + APK Build | הפצה לאנדרואיד | בינונית |
| 4 | Push Notifications | ערך עסקי ישיר | בינונית-גבוהה |
| 5 | מנגנון עדכון גרסה | תחזוקה לאורך זמן | נמוכה |
| 6 | Dark Mode | חוויית משתמש | נמוכה |
| 7 | Haptic Feedback | תחושה נייטיב | נמוכה מאוד |
| 8 | Preferences API (אבטחה) | הגנת נתונים | נמוכה |
| 9 | Sentry Crash Reporting | ניטור ייצור | נמוכה |

---

*נערך עבור Moshe - פרויקט vegetable-orders - אפריל 2026*
