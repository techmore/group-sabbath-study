# Sacred Rhythm

A beautiful, reusable HTML-based companion for weekly group Bible study.

**Not another reading app.** A thoughtful scaffold that helps any group follow Scripture together while going deeper with trusted teachers, scholars, and original languages — all while encouraging real books, real conversation, and real formation.

## What it is

- A **self-contained, elegant single-page experience** you can open locally or host simply.
- Full **52-week Annual Rhythm** view (Friday–Saturday Sabbath model) with real dates, auto current-week detection, progress tracking, and now 14 weeks of rich seeded content (easily expandable).
- Strong **Group Practice Check-in** experience modeled on what actually works in healthy formation groups (especially Practicing the Way patterns).
- Built around a **weekly rhythm** with strong support for plans like Bible in a Year.
- Designed to integrate **John Mark Comer** (Practicing the Way, spiritual formation) and other respected voices.
- First-class support for **ESV** (with NIV toggle), plus curated **Greek & Hebrew word studies**.
- **Reusable scaffold**: Any group can fork this, edit a single config object, and have their own beautiful study companion in minutes.

## Design

The aesthetic is deliberately warm, contemplative, and trustworthy — inspired by the olive + Instrument Serif + Inter design language from the Emporia Mac Utility project. Clean cards, excellent typography, generous whitespace, subtle depth. It feels like a well-made book, not a dashboard.

## Core Philosophy

- We read the Bible in community.
- We use excellent secondary resources (books, courses, teachers) to go deeper — we don't replace them.
- Original languages are a gift for devotion, not academic show.
- The tool should disappear. The Word and the people around the table should remain primary.

## Getting Started (for your group)

1. Clone or download this folder.
2. Open `index.html` in any modern browser.
3. (Optional but recommended) Edit the `STUDY_CONFIG` object at the top of `index.html` to match your plan, group name, and resources.
4. Share the folder (or a hosted version) with your group.

No build step. No accounts. No tracking.

## Deploying to GitHub Pages (Recommended)

This project is designed to work perfectly on GitHub Pages.

### Quick Deploy Steps

1. Push your code to GitHub (you already did this).
2. Go to your repo → **Settings → Pages**
3. Under "Source", select:
   - **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**

GitHub will build and deploy your site. It usually takes 1–2 minutes.

Your app will be live at:
`https://techmore.github.io/group-sabbath-study/`

### Tips for GitHub Pages

- The `.nojekyll` file is included so GitHub doesn't try to process the site with Jekyll.
- Everything is self-contained in `index.html`, so no build step is needed.
- All Bible text, fonts, and resources are loaded from CDNs or the browser's localStorage.

After deploying, you can share the GitHub Pages URL with your group instead of the raw `index.html` file.

## Recommended Resources (the ones we love)

**Primary Formation**
- John Mark Comer – *Practicing the Way*, *The Ruthless Elimination of Hurry*, practicingtheway.org
- Dallas Willard – *The Divine Conspiracy*, *The Spirit of the Disciplines*
- Richard J. Foster – *Celebration of Discipline*

**Scholarly Companions**
- N.T. Wright – *The New Testament and the People of God*, *Jesus and the Victory of God*, many excellent videos
- Craig S. Keener, Ben Witherington, etc.

**Languages**
- ESV + NIV side-by-side where helpful
- Blue Letter Bible, StepBible.org, BibleHub for deeper personal study
- *The Greek New Testament* (UBS/Nestle-Aland) and *Biblia Hebraica Stuttgartensia*

## Customization

Everything important lives in one place near the top of `index.html`:

```js
const STUDY_CONFIG = {
  groupName: "Your Group Name",
  planName: "Bible in a Year + Practicing the Way",
  // ... weeks, readings, comer resources, word studies, prompts
}
```

You can add as many weeks as you want. Each week supports:
- Multiple Bible readings (any translation supported by bible-api.com)
- Comer / formation practices
- Specific scholar recommendations
- Curated word studies tied to that week's text
- Reflection prompts

## Technical Notes

- Bible text is fetched live from the excellent free Bolls.life API (strong ESV + NIV support, 100+ translations). Falls back gracefully when offline.
- All progress, notes, and preferences are saved in your browser (`localStorage`).
- Fully offline-capable after first load of a week's text (cached).
- Works great on phone, tablet, and desktop.
- Print-friendly for those who like paper.

## Roadmap / Future Ideas

- Multiple concurrent plans (personal + group)
- Export group notes as Markdown / PDF
- Simple "Lectio Divina" guided mode
- Integration points for YouVersion or physical book page numbers
- Theme switcher (more contemplative palettes)

## License & Spirit

MIT. Use it, fork it, make it yours. The goal is helping people encounter Scripture and be formed by Jesus together.

If this tool serves your community, we'd love to hear about it.

---

Made with care for groups who want depth without distraction.