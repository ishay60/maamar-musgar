<div dir="rtl" align="right">

<h1 align="center">מאמר מוסגר</h1>

<p align="center">
  <strong>חידת סוגריים יומית בעברית.</strong><br>
  משפט אחד מוסתר מאחורי סוגריים מקוננים. פותרים מבפנים החוצה עד שהוא נחשף.
</p>

<p align="center">
  <a href="https://maamar-musgar.vercel.app">🎮 לשחק בחידת היום</a>
  &nbsp;·&nbsp;
  <a href="#הרצה-מקומית">🛠 הרצה מקומית</a>
  &nbsp;·&nbsp;
  <a href="#סטודיו-החידות">✍️ סטודיו החידות</a>
</p>

<p align="center">
  <img alt="Next.js 14" src="https://img.shields.io/badge/Next.js-14-000?logo=nextdotjs&logoColor=fff">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=fff">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=fff">
  <img alt="Vitest" src="https://img.shields.io/badge/Vitest-2-6E9F18?logo=vitest&logoColor=fff">
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-deployed-000?logo=vercel&logoColor=fff">
</p>

---

## איך משחקים?

כל חידה היא משפט שבו חלק מהמילים הוחלפו ברמזים בתוך סוגריים מרובעים. הרמזים **מקוננים** זה בתוך זה, כך שפתרון של סוגר פנימי חושף טקסט חדש בסוגר שמעליו.

```
ב[שר של [חיה שנוהמת]] טעים
```

| שלב | מה רואים | מה פותרים |
|:--:|---|---|
| 1 | `[חיה שנוהמת]` | **אריה** |
| 2 | `[שר של אריה]` | **בשר** |
| 3 | **בבשר טעים** | המשפט נחשף 🎉 |

### הכללים

- **מהעלים החוצה.** רק סוגר שכל ילדיו נפתרו מקבל קלט.
- **אחים עצמאיים.** סוגרים תחת אותו הורה נפתרים בכל סדר.
- **תגובת שרשרת.** פתרון עלה עשוי להפוך את ההורה שלו לפתיר.
- **בלי שעון.** אין טיימר. יש ניקוד.

### ניקוד ודרגות

מתחילים עם 100 נקודות.

| פעולה | עלות |
|---|:--:|
| ניחוש שגוי | ‎−2 |
| הצצה (אות ראשונה) | ‎−5 |
| חשיפה מלאה | ‎−20 |

| דרגה | איך מגיעים |
|---|---|
| 🥾 תייר | פחות מ־40 נקודות |
| 🚌 נוסע יומי | 40 נקודות ומעלה |
| 🏛 ראש עיר | 75 נקודות ומעלה |
| 👑 בורא המלכים | אפס טעויות, אפס הצצות, אפס חשיפות |

בסיום מקבלים תמונת שיתוף בסגנון רשת של סדר הפתרון, ורצף ימים (streak) נשמר בדפדפן.

---

## הרצה מקומית

```bash
npm install
npm run dev        # http://localhost:3000
```

| פקודה | תפקיד |
|---|---|
| `npm run dev` | שרת פיתוח |
| `npm run build` / `npm start` | build והרצה של פרודקשן |
| `npm test` / `npm run test:watch` | בדיקות יחידה (Vitest) |
| `npm run lint` | ESLint |

בסביבה מקומית קובץ `.env` עם `WORKSPACE=local` פותח את הסטודיו בלי סיסמה.

---

## סטודיו החידות

הסטודיו ב־`/admin` הוא כלי הכתיבה של העורכים.

| מסך | מה עושים שם |
|---|---|
| `/admin` | בונה החידות: מחרוזת סוגריים, טבלת תשובות, עץ פירוק ותצוגה מקדימה חיה. נפתח על חידת היום. |
| `/admin/calendar` | לוח חודשי. ימים ירוקים = יש חידה, אדומים = חסר. קליק פותח את הבונה לאותו יום. |
| `/admin/archive` | כל החידות, לעריכה או למשחק. |

הבונה מציע לכל תאריך **אירועים היסטוריים** מתוך [`data/historical-events.json`](data/historical-events.json), כנקודת פתיחה למשפט. רשימת כותרות לחודש הקרוב: [`docs/puzzle-calendar-2026-09-14.md`](docs/puzzle-calendar-2026-09-14.md).

### איך שמירה עובדת

החידות חיות בקובץ אחד: [`data/puzzles.json`](data/puzzles.json), לפי `date` (YYYY‑MM‑DD, שעון ישראל). חידה מופיעה לשחקנים רק החל מהתאריך שלה.

```
מקומי:     [שמירה]  ──►  data/puzzles.json בדיסק  ──►  רואים מיד
פרודקשן:   [שמירה]  ──►  קומיט ל־GitHub  ──►  דיפלוי ב־Vercel  ──►  באוויר תוך כדקה
```

הסטודיו עצמו קורא תמיד את הגרסה החיה, כך שחידה שנשמרה מופיעה בו מיד.

### משתני סביבה (Vercel)

| משתנה | ערך | למה |
|---|---|---|
| `ADMIN_PASSWORD` | סיסמה חזקה | מפעיל את הסטודיו מאחורי כניסה |
| `GITHUB_TOKEN` | fine‑grained token, הרשאת **Contents: Read and write** לריפו בלבד | כל שמירה היא קומיט |
| `GITHUB_REPO` | `ishay60/maamar-musgar` | לאן לכתוב |
| `GITHUB_BRANCH` | `main` (ברירת מחדל) | לאיזה ענף |

בלי `ADMIN_PASSWORD` הסטודיו מחזיר 404. אין להגדיר `WORKSPACE=local` בפרודקשן.

---

## מבנה הפרויקט

```
app/
  page.tsx             דף החידה היומית (בוחר חידה לפי שעון ישראל, בצד השרת)
  admin/               סטודיו: בונה, לוח שנה, ארכיון
  api/admin/           כניסה, שמירת חידה, אירועים היסטוריים
components/
  GameContainer.tsx    מצב המשחק
  PuzzleBoard.tsx      רינדור עץ הסוגריים
  HebrewKeyboard.tsx   מקלדת עברית למובייל
  admin/               רכיבי הסטודיו
lib/
  puzzle/parser.ts     מחרוזת סוגריים ← עץ
  puzzle/engine.ts     נעילה, פתרון, שרשרת
  puzzle/scoring.ts    ניקוד ודרגות
  puzzle/hebrew.ts     נירמול עברית (סופיות, ניקוד, גרשיים)
  puzzle/share.ts      טקסט שיתוף
  puzzleStore.ts       דיסק / GitHub
  streak.ts            לוגיקת רצף (טהורה, נבדקת)
data/
  puzzles.json         מאגר החידות
  historical-events.json  "היום בהיסטוריה" לסטודיו
```

## טכנולוגיות

**Next.js 14** (App Router) · **React 18** · **TypeScript** · **Tailwind CSS** עם מאפיינים לוגיים ל־RTL · **Vitest** למנוע החידה, לרצף ולגישת הניהול.

</div>
