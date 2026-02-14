# Srichakra Academy — Career Assessment System
## Complete Project Architecture & Reference

> **Last updated:** 12 Feb 2026
> **Status:** Fully deployed & functional
> **Live URL:** https://srichakraacademy-3f745.web.app
> **Custom domain:** srichakraacademy.org (DNS configured, Firebase verification pending)

---

## 1. TECHNOLOGY STACK

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript | React 18.2, TS 5.x |
| Build tool | Vite | 5.4.x |
| Routing | react-router-dom | 6.21.x |
| Hosting | Firebase Hosting | — |
| Charts | Inline SVG (no library) | — |
| State persistence | localStorage | — |
| CSS | Inline styles + HTML template CSS | — |

**No backend server.** All scoring runs client-side. Report is generated as an HTML string rendered in an iframe.

---

## 2. PROJECT FILE STRUCTURE

```
srichakra/
├── .firebaserc                    # Firebase project: srichakraacademy-3f745
├── firebase.json                  # Hosting config: public → client/dist, SPA rewrite
├── PROJECT_ARCHITECTURE.md        # ← THIS FILE
│
├── client/                        # Vite React app
│   ├── package.json               # v3.0.0, deps: react, react-dom, react-router-dom
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html                 # Entry HTML with spinner CSS animation
│   │
│   ├── dist/                      # Build output (deployed to Firebase)
│   │
│   └── src/
│       ├── main.tsx               # ReactDOM.createRoot, renders <App />
│       ├── App.tsx                # Router + DEMO_DATA + localStorage persistence
│       ├── vite-env.d.ts
│       │
│       ├── data/
│       │   └── questionBank.ts    # 76 questions (16 aptitude + 60 preference)
│       │
│       ├── scoring/
│       │   └── scoringEngine.ts   # Raw answers → ReportData conversion
│       │
│       ├── pages/
│       │   ├── Landing.tsx        # Welcome page with CTA buttons
│       │   ├── Assessment.tsx     # 76-question wizard (one at a time)
│       │   ├── CareerAssessment.tsx # Report display (toolbar + iframe)
│       │   └── reportTemplate.tsx # Full report HTML generator (10 page divs)
│       │
│       └── report/
│           └── reportLayoutSpec.ts # Layout spec reference (legacy)
```

---

## 3. APPLICATION ROUTES

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Landing` | Welcome page, "Start Assessment" & "View Demo" buttons |
| `/assessment` | `Assessment` | 76-question wizard with progress bar & timer |
| `/report` | `CareerAssessment` | Live report from assessment (persisted in localStorage) |
| `/demo` | `CareerAssessment` | Demo report with hardcoded DEMO_DATA |
| `/career-assessment` | `CareerAssessment` | Legacy route → shows DEMO_DATA |

---

## 4. DATA FLOW

```
Student lands on /
       │
       ▼
  Landing.tsx ──── "View Demo" ────→ /demo (DEMO_DATA → CareerAssessment)
       │
  "Start Assessment"
       │
       ▼
  Assessment.tsx
  ├── Phase 1: Name entry
  ├── Phase 2: 16 aptitude MCQs (one at a time)
  ├── Phase 3: 60 preference Likert (one at a time)
  └── Submit
       │
       │  buildReportFromAnswers(rawAnswers) ← scoringEngine.ts
       │
       ▼
  App.tsx receives ReportData via onComplete callback
  ├── Stores in React state
  ├── Persists to localStorage (key: srichakra_report_data)
  └── Navigates to /report
       │
       ▼
  CareerAssessment.tsx
  ├── Calls generateFullReport(reportData) → full HTML string
  ├── Renders in sandboxed iframe via srcDoc
  └── Toolbar: Print/Save PDF | Download HTML
```

---

## 5. PERSISTENCE (localStorage)

### Assessment Progress
- **Key:** `srichakra_assessment_progress`
- **Saved on:** Every question answer, phase change, name entry
- **Contains:** `{ phase, studentName, currentIndex, aptitudeAnswers, preferenceAnswers }`
- **Cleared:** On successful submit
- **Purpose:** Survives page refresh mid-assessment

### Report Data
- **Key:** `srichakra_report_data`
- **Saved on:** Every time reportData state changes in App.tsx
- **Contains:** Full `ReportData` JSON object
- **Cleared:** Never (overwritten when new assessment completes)
- **Purpose:** /report survives page refresh

---

## 6. QUESTION BANK (`questionBank.ts`)

### Aptitude Questions (IDs 201–216)
16 objective MCQs with correct answers. 4 questions per domain:

| Domain | Question IDs | Correct Answer Property |
|--------|-------------|------------------------|
| Numerical Reasoning | 201–204 | `correctAnswer: number` (option index) |
| Logical Reasoning | 205–208 | `correctAnswer: number` |
| Verbal Ability | 209–212 | `correctAnswer: number` |
| Spatial Intelligence | 213–216 | `correctAnswer: number` |

### Preference Questions (IDs 301–360)
60 self-report Likert scale questions (1–5). Mapped to preference domains:

| Domain | Count | Question IDs |
|--------|-------|-------------|
| Analytical | 6 | 301–306 |
| Verbal | 6 | 307–312 |
| Creative | 6 | 313–318 |
| Technical | 6 | 319–324 |
| Social | 6 | 325–330 |
| Executive | 6 | 331–336 |
| Conscientiousness | 6 | 337–342 |
| LearningStyle | 6 | 343–348 |
| Naturalistic | 4 | 349–352 |
| Musical | 4 | 353–356 |
| Entrepreneurial | 4 | 357–360 |

### Likert Scale Labels
```
1 = Strongly Disagree
2 = Disagree
3 = Neutral
4 = Agree
5 = Strongly Agree
```

### Exported Types
- `AptitudeDomain` — union of 4 aptitude domain names
- `PreferenceDomain` — union of 11 preference domain names
- `AptitudeQuestion` — `{ id, question, options, correctAnswer, domain }`
- `PreferenceQuestion` — `{ id, question, domain }`
- `Question` — `AptitudeQuestion | PreferenceQuestion`

---

## 7. SCORING ENGINE (`scoringEngine.ts`)

### Input
```typescript
interface RawAnswers {
  studentName: string;
  aptitude: Record<number, number>;    // questionId → selected option index
  preference: Record<number, number>;  // questionId → likert value (1-5)
}
```

### Processing Pipeline
1. **scoreAptitude()** — correct/total per domain → percentage → level/readiness band
2. **scorePreferences()** — average per domain on 1–5 scale
3. **mapToRIASEC()** — maps 11 preference domains → 6 RIASEC codes:
   - Analytical + Conscientiousness → Investigative
   - Technical + LearningStyle → Realistic
   - Creative + Musical → Artistic
   - Social → Social
   - Executive + Entrepreneurial → Enterprising
   - Conscientiousness → Conventional
   - (Naturalistic + Verbal also contribute)
4. **deriveLearningStyles()** — from preference patterns
5. **deriveDominantHemisphere()** — from aptitude + preference balance
6. **deriveStreamRecommendations()** — Class 10 stream fit (Science/Commerce/Arts)
7. **deriveCourseFamilies()** — 60% aptitude + 40% preference for 6 course families
8. **deriveCareerClusters()** — 5 career cluster matches with roles & reasoning

### Output
```typescript
ReportData {
  studentName, assessmentDate,
  aptitudeScores[], preferenceScores[],
  dominantHemisphere, learningStyles,
  streamRecommendations[],
  courseFamilyRecommendations[],
  careerClusters[],
  totalAnswered, completionRate
}
```

### Readiness Bands
| Score Range | Level | Readiness | Color |
|------------|-------|-----------|-------|
| ≥ 75% | Strong | READY NOW | Green |
| 50–74% | Moderate | WITH DEVELOPMENT | Amber |
| < 50% | Developing | EXPLORATORY | Coral |

---

## 8. REPORT TEMPLATE (`reportTemplate.tsx`)

### ReportData Interface
```typescript
interface ReportData {
  studentName?: string;
  assessmentDate?: string;
  aptitudeScores?: any[];
  preferenceScores?: any[];
  dominantHemisphere?: string;
  learningStyles?: any;
  streamRecommendations?: any[];
  courseFamilyRecommendations?: any[];
  careerClusters?: any[];
  totalAnswered?: number;
  completionRate?: number;
}
```

### Report Pages (10 physical page divs)

| Page | Function | Content |
|------|----------|---------|
| 1 | `renderPage1ExecutiveSummary()` | Cover, branding, student details, what we measured, how to read, disclaimer |
| 2A | `renderPage2AptitudeSnapshot()` | Aptitude table (5 columns: domain, score, level, readiness, skills) |
| 2B | (continued) | **Bar chart (SVG)**, interpretation, strongest area, developing areas, guardrail note |
| 3 | `renderPage3PreferenceAnalysis()` | **Radar chart (SVG)**, RIASEC table with inline bars, top interests narrative, aptitude vs preference note |
| 4 | `renderPage4BrainAndLearning()` | Brain hemisphere analysis, learning style (Visual/Auditory/Kinesthetic), study strategies, five senses grid |
| 5A | `renderPage5Class10Decision()` | Class 10 stream decision, why-this-fits narrative |
| 5B | (continued) | Stream decision table (Science/Commerce/Arts), readiness comparison |
| 6 | `renderPage6Class12Decision()` | Course family alignment, 60/40 scoring method, 6-family decision table, pathway progression |
| 7 | `renderPage7CareerClusters()` | 5 career cluster cards, exploration disclaimer, broader career awareness, cross-cluster combos |
| 8 | `renderPage8ActionSteps()` | Student next steps, parent guidance, conversation starters, consultation CTA, closing message |

### SVG Charts
- **Bar Chart** (`generateBarChartSVG`) — Horizontal bars, color-coded by score tier, used on Page 2B
- **Radar Chart** (`generateRadarChartSVG`) — Hexagonal spider chart, concentric grid, data polygon fill, used on Page 3

### CSS Architecture (inside generated HTML)
- `@page { size: A4; margin: 0; }` — zero page margin for full-bleed control
- `.page` — `width: 210mm; min-height: 297mm; padding: 20mm 18mm; page-break-after: always`
- `@media print` — removes borders, uses `min-height: auto`, allows natural page flow with `page-break-inside: avoid` on tables/headers
- Color-adjusted for print: `-webkit-print-color-adjust: exact`
- Brand colors: `#006D77` (primary teal), `#E29578` (coral accent), `#83C5BE` (light teal)

### Data Normalization
Each page renderer normalizes incoming data to handle both old (`name` field) and new (`domain` field) formats, and auto-derives missing fields (level, readiness, skills) from scores.

---

## 9. COMPONENT DETAILS

### Landing.tsx (178 lines)
- Welcome card with academy branding
- Assessment info: 76 questions, 25–35 min estimate
- Two part descriptions (aptitude + preference)
- Two CTA buttons: "Start Assessment →" and "View Demo Report"
- Gradient background, responsive card layout

### Assessment.tsx (~500 lines)
- **Phases:** name → aptitude → preference → submitting
- One question at a time for focus
- Progress bar (teal for aptitude, coral for preference)
- Timer display (mm:ss)
- Back/Next navigation
- Cannot proceed without answering
- Aptitude: 4-option MCQ buttons with letter indicators (A/B/C/D)
- Preference: 5 Likert scale buttons (1–5 with labels)
- Submitting phase: spinner animation with "Generating Your Report..." message
- **localStorage persistence** for progress recovery

### CareerAssessment.tsx (104 lines)
- Green toolbar: title, Print/Save PDF button, Download HTML button
- Full-height iframe with `srcDoc={reportHtml}`
- Download creates Blob → `<a>` click → `.html` file
- Print calls `iframe.contentWindow.print()`

---

## 10. DEPLOYMENT

### Build
```bash
cd client
npm run build          # tsc && vite build → client/dist/
```

### Deploy
```bash
cd ..                  # back to srichakra root
firebase deploy --only hosting
```

### Firebase Config
- **Project ID:** `srichakraacademy-3f745`
- **Hosting URL:** https://srichakraacademy-3f745.web.app
- **Public directory:** `client/dist`
- **SPA rewrite:** `** → /index.html`

### Custom Domain (srichakraacademy.org)
- **Registrar:** Namecheap
- **A Records:** 151.101.1.195, 151.101.65.195
- **TXT Record:** `hosting-site=srichakraacademy-org`
- **Status:** DNS propagated, Firebase verification pending

---

## 11. DEMO DATA (in App.tsx)

The `DEMO_DATA` constant provides a complete `ReportData` object for testing:
- Student: "Demo Student"
- 6 aptitude domains (scores: 55–85%)
- 6 RIASEC preference domains (scores: 2.0–4.1 / 5.0)
- Hemisphere: Left, Learning styles: Visual + Logical
- 3 stream recommendations (Science/Commerce/Arts)
- 6 course family recommendations (Engineering → Arts/Design)
- 5 career clusters (STEM → Social Sciences)

---

## 12. NEXT PHASE: Student Login & Data Storage

### Planned Features (for tomorrow)
1. **Student Authentication** — Individual student login (Firebase Auth or simple login)
2. **Data Storage** — Save assessment results to a database (Firebase Firestore or Realtime DB)
3. **Data Retrieval** — Student/admin can retrieve past reports
4. **Multi-student support** — Each student sees only their own results
5. **Admin dashboard** — View all student reports (optional)

### Suggested Architecture
```
Firebase Auth (Email/Password or Google Sign-In)
       │
       ▼
Firestore Database
├── users/{uid}
│   ├── displayName
│   ├── email
│   └── createdAt
│
├── assessments/{uid}
│   ├── rawAnswers (aptitude + preference records)
│   ├── reportData (full ReportData JSON)
│   ├── completedAt (timestamp)
│   └── timeTaken (seconds)
│
└── (optional) admin collection for analytics
```

### Migration Path
- Add `firebase` npm package to client
- Create `src/firebase.ts` config file
- Add `AuthContext` provider wrapping `<App />`
- Replace localStorage persistence with Firestore reads/writes
- Add `/login` route with sign-in form
- Guard `/assessment` and `/report` behind auth
- Store report on submit → retrieve on `/report` load

---

## 13. KEY DESIGN DECISIONS

1. **No external chart library** — SVG charts are inline in the HTML template, ensuring they render in print/PDF without any runtime dependency
2. **Single HTML string** — The entire report is one `generateFullReport()` call producing a complete `<!DOCTYPE html>` document, rendered in an iframe
3. **All scoring is client-side** — No server round trip, instant results, works offline
4. **Data normalization** — Every page renderer handles both old and new field name formats defensively
5. **localStorage persistence** — Chosen over sessionStorage for cross-tab survival; will migrate to Firestore in next phase
6. **Readiness bands (3-tier)** — READY NOW / WITH DEVELOPMENT / EXPLORATORY provides actionable guidance without rigid labels

---

*This document captures the full system as of 12 Feb 2026. Use it as the reference when implementing student login, Firestore integration, and data retrieval in the next session.*
