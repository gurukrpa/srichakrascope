# SRICHAKRA ACADEMY — CAREER ASSESSMENT SYSTEM
## Complete Reference Document (Structure, Questions, Flow & Integration)

---

**Organization:** Srichakra Academy  
**Project:** Career Assessment Platform  
**Live URL:** https://srichakraacademy-3f745.web.app  
**Custom Domain:** srichakraacademy.org  
**Last Updated:** 14 February 2026  
**Document Purpose:** Complete repository for future reference — structure, questions, user flow, scoring logic, report generation, and website integration.

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [File Structure](#3-file-structure)
4. [User Flow & Navigation](#4-user-flow--navigation)
5. [Authentication System](#5-authentication-system)
6. [Question Bank — Complete List](#6-question-bank--complete-list)
7. [Scoring Engine — How Scores Are Calculated](#7-scoring-engine--how-scores-are-calculated)
8. [Report Template — 10-Page Report Structure](#8-report-template--10-page-report-structure)
9. [Website Integration & Routes](#9-website-integration--routes)
10. [Data Persistence & Storage](#10-data-persistence--storage)
11. [Deployment Guide](#11-deployment-guide)
12. [Design Decisions & Rationale](#12-design-decisions--rationale)
13. [Future Enhancements](#13-future-enhancements)

---

## 1. PROJECT OVERVIEW

Srichakra Academy's Career Assessment System is a **web-based psychometric assessment tool** designed for Class 8–10 students. It measures cognitive aptitude and personal preferences to generate a **10-page personalized career guidance report**.

### Key Highlights
- **76 questions** in total (16 aptitude + 60 preference)
- **25–35 minutes** to complete
- **Instant results** — all scoring happens client-side (no server needed)
- **10-page PDF-ready report** with SVG charts, tables, and narrative guidance
- Covers **stream selection (Class 10)**, **course families (Class 12)**, and **career clusters**
- **Firebase Authentication** for student login/register
- **Firestore Database** for storing assessment results
- **Admin Dashboard** for viewing all student results

---

## 2. TECHNOLOGY STACK

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React + TypeScript | React 18.2, TypeScript 5.x |
| Build Tool | Vite | 5.4.x |
| Routing | react-router-dom | 6.21.x |
| Authentication | Firebase Auth | Email/Password |
| Database | Cloud Firestore | — |
| Hosting | Firebase Hosting | — |
| Charts | Inline SVG (no external library) | — |
| State Persistence | localStorage + Firestore | — |
| CSS | Inline styles + HTML template CSS | — |

**Architecture:** Fully client-side. No backend server. All scoring runs in the browser. Report is generated as an HTML string rendered in a sandboxed iframe.

---

## 3. FILE STRUCTURE

```
srichakra/
├── firebase.json                  # Hosting config: public → client/dist, SPA rewrite
├── firestore.rules                # Firestore security rules
├── PROJECT_ARCHITECTURE.md        # Architecture reference
│
├── client/                        # Vite React application
│   ├── package.json               # v3.0.0
│   ├── tsconfig.json              # TypeScript config
│   ├── vite.config.ts             # Vite build config
│   ├── index.html                 # Entry HTML with spinner CSS
│   │
│   ├── dist/                      # Build output (deployed to Firebase)
│   │
│   └── src/
│       ├── main.tsx               # ReactDOM.createRoot → renders <App />
│       ├── App.tsx                # Router, DEMO_DATA, localStorage persistence
│       ├── firebase.ts            # Firebase app initialization & exports
│       ├── vite-env.d.ts          # Vite type declarations
│       │
│       ├── contexts/
│       │   └── AuthContext.tsx     # Firebase Auth provider (login, register, logout)
│       │
│       ├── data/
│       │   └── questionBank.ts    # 76 questions (16 aptitude + 60 preference)
│       │
│       ├── scoring/
│       │   └── scoringEngine.ts   # Raw answers → ReportData conversion
│       │
│       ├── pages/
│       │   ├── Landing.tsx        # Welcome page with CTA buttons
│       │   ├── StudentLogin.tsx   # Student login/register form
│       │   ├── AdminLogin.tsx     # Admin login form
│       │   ├── AdminDashboard.tsx # Admin view of all student results
│       │   ├── Assessment.tsx     # 76-question wizard (one at a time)
│       │   ├── CareerAssessment.tsx # Report display (toolbar + iframe)
│       │   └── reportTemplate.tsx # Full report HTML generator (10 pages)
│       │
│       └── report/
│           └── reportLayoutSpec.ts # Layout spec reference
```

---

## 4. USER FLOW & NAVIGATION

### Student Journey (Step-by-Step)

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: Landing Page (/)                               │
│  Student sees welcome screen with assessment info        │
│  Options: "Start Assessment" | "Login/Register" | "Demo" │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 2: Login / Register (/login)                      │
│  Student creates account (name, email, phone, password)  │
│  OR logs in with existing credentials                    │
│  Uses Firebase Authentication (Email/Password)           │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 3: Assessment Wizard (/assessment) — PROTECTED    │
│                                                          │
│  Phase A — Student Name Entry                            │
│  Student types their full name                           │
│                                                          │
│  Phase B — Part 1: Aptitude (16 MCQs)                   │
│  One question at a time, 4 options (A/B/C/D)            │
│  Progress bar (teal), timer running                      │
│  Back/Next navigation, must answer to proceed            │
│                                                          │
│  Phase C — Part 2: Preferences (60 Likert)              │
│  One question at a time, 5-point Likert scale            │
│  Progress bar (coral), timer running                     │
│  Back/Next navigation, must answer to proceed            │
│                                                          │
│  Phase D — Submitting                                    │
│  Spinner animation, "Generating Your Report..."          │
│  scoringEngine runs buildReportFromAnswers()             │
│  Results saved to Firestore                              │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 4: Report Display (/report)                       │
│  10-page career guidance report in iframe                │
│  Toolbar: "Print / Save PDF" | "Download HTML"           │
│  Report persists via localStorage for page refresh        │
└─────────────────────────────────────────────────────────┘
```

### Admin Journey

```
Admin → /admin/login → Enters admin credentials
     → /admin (AdminDashboard) — Views all student results
     Admin emails are hardcoded: admin@srichakraacademy.org
```

---

## 5. AUTHENTICATION SYSTEM

### Firebase Auth Integration

| Feature | Implementation |
|---|---|
| Provider | Firebase Authentication (Email/Password) |
| Context | `AuthContext.tsx` wraps `<App />` |
| Register | `createUserWithEmailAndPassword()` → saves profile to Firestore `students/{uid}` |
| Login | `signInWithEmailAndPassword()` |
| Logout | `signOut()` |
| State | `onAuthStateChanged()` listener updates React state |
| Admin Check | Compares email against `ADMIN_EMAILS` array |

### Protected Routes

| Route | Protection |
|---|---|
| `/assessment` | `RequireAuth` — must be logged in, else redirects to `/login` |
| `/admin` | `RequireAdmin` — must be logged in AND email in admin list |

### Admin Emails (hardcoded)
```
admin@srichakraacademy.org
```

### Firestore Student Profile (on register)
```json
{
  "name": "Student Name",
  "email": "student@email.com",
  "phone": "9876543210",
  "createdAt": "<server timestamp>",
  "assessmentCompleted": false
}
```

---

## 6. QUESTION BANK — COMPLETE LIST

### Overview

| Part | Type | Count | Question IDs | Scoring |
|---|---|---|---|---|
| Part 1 | Aptitude (MCQ) | 16 | 201–216 | Correct/Incorrect → percentage |
| Part 2 | Preference (Likert) | 60 | 301–360 | 1–5 scale → domain average |
| **Total** | | **76** | | |

---

### PART 1: APTITUDE QUESTIONS (16 Objective MCQs)

#### Domain: Numerical Reasoning (4 questions)

| ID | Question | Options | Correct Answer |
|---|---|---|---|
| 201 | What is the next number in the sequence: 2, 6, 12, 20, ? | A) 24, B) 28, C) 30, D) 32 | C) 30 |
| 202 | If 40% of a number is 120, what is the number? | A) 200, B) 250, C) 300, D) 320 | C) 300 |
| 203 | A book costs ₹240 after a 20% discount. What was the original price? | A) ₹260, B) ₹280, C) ₹300, D) ₹320 | C) ₹300 |
| 204 | Which fraction is the largest? | A) 3/4, B) 5/8, C) 7/10, D) 9/12 | A) 3/4 |

#### Domain: Logical Reasoning (4 questions)

| ID | Question | Options | Correct Answer |
|---|---|---|---|
| 205 | Which number does not belong? 27, 64, 125, 144 | A) 27, B) 64, C) 125, D) 144 | D) 144 (others are perfect cubes) |
| 206 | 3 → 9, 5 → 25, 7 → ? | A) 42, B) 49, C) 56, D) 64 | B) 49 |
| 207 | All cats are animals. Some animals are wild. Which statement is definitely true? | A) All cats are wild, B) Some cats may be wild, C) No cats are wild, D) All wild animals are cats | B) Some cats may be wild |
| 208 | Which comes next? A, C, F, J, O, ? | A) S, B) T, C) U, D) V | C) U (+2, +3, +4, +5, +6) |

#### Domain: Verbal Ability (4 questions)

| ID | Question | Options | Correct Answer |
|---|---|---|---|
| 209 | The scientist was known for her ______ approach to problem solving. | A) careless, B) systematic, C) accidental, D) hurried | B) systematic |
| 210 | Choose the word most similar to "Reluctant". | A) Eager, B) Unwilling, C) Excited, D) Ready | B) Unwilling |
| 211 | Choose the opposite of "Transparent". | A) Clear, B) Bright, C) Opaque, D) Thin | C) Opaque |
| 212 | Which sentence is grammatically correct? | A) She don't like maths, B) She doesn't likes maths, C) She doesn't like maths, D) She not like maths | C) She doesn't like maths |

#### Domain: Spatial Intelligence (4 questions)

| ID | Question | Options | Correct Answer |
|---|---|---|---|
| 213 | If a square is rotated 90° clockwise, how many sides remain in the same position? | A) 0, B) 1, C) 2, D) 4 | A) 0 |
| 214 | Which shape completes the pattern? ■ ▲ ■ ▲ ■ ? | A) ■ Square, B) ▲ Triangle, C) ● Circle, D) ▬ Rectangle | B) ▲ Triangle |
| 215 | You are facing North. You turn right, then left, then right. Which direction are you facing now? | A) North, B) East, C) South, D) West | B) East |
| 216 | How many small cubes make up a 2 × 2 × 2 cube? | A) 4, B) 6, C) 8, D) 12 | C) 8 |

---

### PART 2: PREFERENCE QUESTIONS (60 Self-Report Likert Scale)

**Scale:** 1 = Strongly Disagree | 2 = Disagree | 3 = Neutral | 4 = Agree | 5 = Strongly Agree

#### Domain: Analytical (6 questions, IDs 301–306)

| ID | Statement |
|---|---|
| 301 | I enjoy solving complex problems. |
| 302 | I like working with numbers and data. |
| 303 | I notice patterns quickly. |
| 304 | I enjoy logical reasoning tasks. |
| 305 | I like analyzing news or research articles. |
| 306 | I enjoy strategy games or puzzles. |

#### Domain: Verbal (6 questions, IDs 307–312)

| ID | Statement |
|---|---|
| 307 | I enjoy reading regularly. |
| 308 | I like writing essays or articles. |
| 309 | I feel confident expressing ideas in words. |
| 310 | I enjoy public speaking. |
| 311 | I like debating ideas respectfully. |
| 312 | I enjoy learning new languages. |

#### Domain: Creative (6 questions, IDs 313–318)

| ID | Statement |
|---|---|
| 313 | I enjoy designing or drawing. |
| 314 | I think of new ideas often. |
| 315 | I prefer creative freedom in work. |
| 316 | I like visual storytelling. |
| 317 | I enjoy imagining new solutions. |
| 318 | I enjoy brainstorming sessions. |

#### Domain: Technical (6 questions, IDs 319–324)

| ID | Statement |
|---|---|
| 319 | I enjoy understanding how machines work. |
| 320 | I like coding or working with computers. |
| 321 | I enjoy fixing gadgets. |
| 322 | I prefer hands-on practical work. |
| 323 | I enjoy experimenting with tools or software. |
| 324 | I like building models or prototypes. |

#### Domain: Social (6 questions, IDs 325–330)

| ID | Statement |
|---|---|
| 325 | I enjoy helping others learn. |
| 326 | I feel energized by teamwork. |
| 327 | I like mentoring or guiding people. |
| 328 | I enjoy working with diverse groups. |
| 329 | I feel motivated by helping a cause. |
| 330 | I like interacting with new people. |

#### Domain: Executive / Leadership (6 questions, IDs 331–336)

| ID | Statement |
|---|---|
| 331 | I like organizing events. |
| 332 | I enjoy planning and scheduling. |
| 333 | I like setting goals and tracking progress. |
| 334 | I stay calm under pressure. |
| 335 | I prefer measurable outcomes. |
| 336 | I take initiative when needed. |

#### Domain: Conscientiousness (6 questions, IDs 337–342)

| ID | Statement |
|---|---|
| 337 | I am organized and detail-oriented. |
| 338 | I pay attention to small mistakes. |
| 339 | I value stability and structure. |
| 340 | I follow through on commitments. |
| 341 | I manage my time well. |
| 342 | I prefer clear rules and processes. |

#### Domain: Learning Style (6 questions, IDs 343–348)

| ID | Statement | Maps To |
|---|---|---|
| 343 | I prefer visual learning (charts, diagrams). | Visual |
| 344 | I prefer listening to explanations. | Auditory |
| 345 | I prefer hands-on learning. | Kinesthetic |
| 346 | I reflect on mistakes to improve. | Reflective |
| 347 | I prefer step-by-step instructions. | Sequential |
| 348 | I learn best by teaching others. | Social |

#### Domain: Naturalistic (4 questions, IDs 349–352)

| ID | Statement |
|---|---|
| 349 | I enjoy learning about nature. |
| 350 | I notice environmental patterns. |
| 351 | I enjoy outdoor exploration. |
| 352 | I like studying biology or geography. |

#### Domain: Musical (4 questions, IDs 353–356)

| ID | Statement |
|---|---|
| 353 | I enjoy music deeply. |
| 354 | I can identify rhythms easily. |
| 355 | I enjoy creating music. |
| 356 | I notice sound patterns. |

#### Domain: Entrepreneurial (4 questions, IDs 357–360)

| ID | Statement |
|---|---|
| 357 | I get excited by business ideas. |
| 358 | I like planning finances. |
| 359 | I think about starting something of my own. |
| 360 | I enjoy risk-taking in ideas. |

---

## 7. SCORING ENGINE — HOW SCORES ARE CALCULATED

The scoring engine (`scoringEngine.ts`) converts raw student answers into a complete `ReportData` object. All processing is client-side.

### Input Format
```
RawAnswers {
  studentName: string
  aptitude: { questionId → selected option index (0-based) }
  preference: { questionId → likert value (1-5) }
}
```

### Processing Pipeline

#### Step 1: Aptitude Scoring
- Groups questions by domain (4 questions each)
- Counts correct answers per domain
- Converts to percentage: `(correct / total) × 100`
- Assigns level and readiness band:

| Score Range | Level | Readiness Tag | Color Code |
|---|---|---|---|
| 75% and above | Strong | READY NOW | Green (#28a745) |
| 50% – 74% | Moderate | WITH DEVELOPMENT | Amber (#f0ad4e) |
| Below 50% | Developing | EXPLORATORY | Coral (#E29578) |

#### Step 2: Preference Scoring
- Groups all 60 answers by preference domain
- Calculates average per domain (1.0 – 5.0 scale)
- Sorts by score (highest first)

#### Step 3: RIASEC Mapping
Maps the 11 internal preference domains to the 6 standard RIASEC personality types:

| Internal Domain | → | RIASEC Code |
|---|---|---|
| Technical | → | Realistic (R) |
| Analytical | → | Investigative (I) |
| Creative | → | Artistic (A) |
| Social | → | Social (S) |
| Executive | → | Enterprising (E) |
| Conscientiousness | → | Conventional (C) |

*Note: Naturalistic, Musical, Entrepreneurial, Verbal, and LearningStyle domains are used in other derivations but do not directly map to RIASEC.*

#### Step 4: Learning Style Derivation
- Extracts learning preferences from questions 343–348
- Each question maps to a learning style: Visual, Auditory, Kinesthetic, Reflective, Sequential, Social
- Returns the **top 2 learning styles** by score

#### Step 5: Brain Hemisphere Derivation
- **Left-brain indicators:** Numerical, Logical, Verbal aptitude + Analytical, Verbal, Conscientiousness, Executive preferences
- **Right-brain indicators:** Spatial aptitude + Creative, Musical, Naturalistic preferences
- If the difference is < 20 points → "Balanced"
- Otherwise → "Left" or "Right"

#### Step 6: Stream Recommendations (Class 10)
Calculates readiness for 3 academic streams:

| Stream | Formula | Domains Used |
|---|---|---|
| Science | Average of Numerical + Logical + Spatial | PCM or PCB pathway |
| Commerce | Average of Numerical + Verbal + Logical | Business/Economics pathway |
| Arts / Humanities | Average of Verbal + Logical | Humanities/Social Sciences pathway |

Each stream gets: readiness tag, confidence score, match description, and personalized guidance text.

#### Step 7: Course Family Recommendations (Class 12)
Uses a **60% aptitude + 40% preference** weighted formula for 6 course families:

| Course Family | Aptitude Inputs | Preference Inputs |
|---|---|---|
| Engineering / Technology | Numerical, Logical, Spatial | Analytical, Technical |
| Data Science & Analytics | Numerical, Logical | Analytical, Technical |
| Medicine / Life Sciences | Numerical, Logical, Verbal | Analytical, Social |
| Business / Commerce | Numerical, Verbal, Logical | Executive, Analytical |
| Law / Social Sciences | Verbal, Logical | Verbal, Social |
| Arts / Design / Media | Spatial, Verbal | Creative, Verbal |

Each family includes: fit score, alignment tag, guidance text, and specific course suggestions.

#### Step 8: Career Cluster Generation
Generates 6 career clusters with match scores:

| Cluster | Example Roles |
|---|---|
| STEM & Technology | Software Developer, Data Scientist, AI Engineer, Cybersecurity Analyst |
| Engineering & Design | Design Engineer, Civil Engineer, Robotics Engineer, Architect |
| Business, Finance & Management | Financial Analyst, CA, Entrepreneur, HR Manager |
| Healthcare & Life Sciences | Doctor, Pharmacist, Physiotherapist, Clinical Researcher |
| Creative Arts & Media | Graphic Designer, Animator, Film Director, UX Designer |
| Social Sciences & Education | Teacher, Psychologist, Social Worker, Journalist |

### Final Output
```
ReportData {
  studentName, assessmentDate,
  aptitudeScores[],           // 4 domains with scores, levels, readiness
  preferenceScores[],         // 6 RIASEC domains with 1-5 scores
  dominantHemisphere,         // "Left" | "Right" | "Balanced"
  learningStyles[],           // Top 2 learning styles
  streamRecommendations[],    // 3 streams (Science/Commerce/Arts)
  courseFamilyRecommendations[], // 6 course families sorted by fit
  careerClusters[],           // 6 career clusters sorted by match
  totalAnswered,              // Out of 76
  completionRate              // Percentage
}
```

---

## 8. REPORT TEMPLATE — 10-PAGE REPORT STRUCTURE

The report is generated as a **complete HTML document** by `generateFullReport()` in `reportTemplate.tsx`. It renders inside a sandboxed iframe and is print/PDF-ready.

### Page-by-Page Breakdown

| Page | Section | Content |
|---|---|---|
| **Page 1** | Executive Summary | Academy branding, student name & date, "What We Measured" summary, "How to Read This Report" guide, disclaimer |
| **Page 2A** | Aptitude Snapshot (Table) | 5-column table: Domain, Score, Level, Readiness, Key Skills |
| **Page 2B** | Aptitude Snapshot (Chart) | Horizontal bar chart (SVG), interpretation text, strongest area highlight, developing areas, guardrail note |
| **Page 3** | Preference Analysis | Radar/spider chart (SVG), RIASEC table with inline bars, top interests narrative, aptitude vs preference comparison |
| **Page 4** | Brain & Learning Style | Brain hemisphere analysis, learning style identification (Visual/Auditory/Kinesthetic), study strategies, five senses grid |
| **Page 5A** | Class 10 Stream Decision | Stream readiness overview, why-this-fits narrative |
| **Page 5B** | Class 10 Stream Decision (cont.) | Stream decision table (Science/Commerce/Arts), readiness comparison, guidance per stream |
| **Page 6** | Class 12 Course Families | Course family alignment, 60/40 scoring method explanation, 6-family decision table, pathway progression |
| **Page 7** | Career Clusters | 5–6 career cluster cards with roles & reasoning, exploration disclaimer, cross-cluster combinations |
| **Page 8** | Action Steps & Guidance | Student next steps, parent guidance, conversation starters, consultation CTA, closing message |

### SVG Charts (Inline, No External Library)

**Bar Chart** — Horizontal bars, color-coded by score tier:
- Green (≥75%): Strong / READY NOW
- Amber (50–74%): Moderate / WITH DEVELOPMENT
- Coral (<50%): Developing / EXPLORATORY

**Radar Chart** — Hexagonal spider chart with concentric grid, data polygon fill, used for RIASEC preference profile.

### Print & PDF Design

| Property | Value |
|---|---|
| Page size | A4 (210mm × 297mm) |
| Page margins | 20mm top/bottom, 18mm left/right |
| Page breaks | `page-break-after: always` per page div |
| Print colors | `-webkit-print-color-adjust: exact` |
| Brand colors | Primary teal (#006D77), Coral accent (#E29578), Light teal (#83C5BE) |

---

## 9. WEBSITE INTEGRATION & ROUTES

### Route Map

| Route | Component | Auth Required | Purpose |
|---|---|---|---|
| `/` | `Landing` | No | Welcome page with "Start Assessment", "Login", "Demo" |
| `/login` | `StudentLogin` | No | Student login & registration form |
| `/admin/login` | `AdminLogin` | No | Admin login form |
| `/admin` | `AdminDashboard` | Yes (Admin) | View all student assessment results |
| `/assessment` | `Assessment` | Yes (Student) | 76-question wizard with progress & timer |
| `/report` | `CareerAssessment` | No* | Report display (requires reportData in state/localStorage) |
| `/demo` | `CareerAssessment` | No | Demo report with hardcoded sample data |
| `/career-assessment` | `CareerAssessment` | No | Legacy route → shows demo data |

*The `/report` route redirects to Landing if no report data exists.

### Component Responsibilities

| Component | File | Responsibility |
|---|---|---|
| `App` | App.tsx | Router setup, DEMO_DATA, report state management, localStorage persistence |
| `Landing` | Landing.tsx | Welcome UI, assessment info, CTA buttons |
| `StudentLogin` | StudentLogin.tsx | Email/password login & registration form |
| `AdminLogin` | AdminLogin.tsx | Admin-specific login form |
| `AdminDashboard` | AdminDashboard.tsx | Table of all student assessments from Firestore |
| `Assessment` | Assessment.tsx | Question wizard (name → aptitude → preference → submit) |
| `CareerAssessment` | CareerAssessment.tsx | Report viewer (iframe + toolbar) |
| `reportTemplate` | reportTemplate.tsx | HTML report generator (10 pages) |
| `AuthContext` | AuthContext.tsx | Firebase Auth state provider |

### Data Flow Between Components

```
Landing.tsx
    │
    ├── "Start Assessment" → navigates to /assessment
    ├── "Login/Register" → navigates to /login
    └── "View Demo" → navigates to /demo
         │
         ▼
    CareerAssessment.tsx ← receives DEMO_DATA props from App.tsx

Assessment.tsx
    │
    ├── Student answers 76 questions
    ├── On submit: buildReportFromAnswers(rawAnswers) → ReportData
    ├── Saves to Firestore (if logged in)
    ├── Calls onComplete(reportData) → App.tsx state
    └── Navigates to /report
         │
         ▼
    App.tsx
    ├── Stores reportData in React state
    ├── Persists to localStorage (key: srichakra_report_data)
    └── Passes reportData as props to CareerAssessment at /report

CareerAssessment.tsx
    ├── Receives ReportData as props
    ├── Calls generateFullReport(reportData) → HTML string
    ├── Renders HTML in sandboxed iframe (srcDoc)
    └── Toolbar: Print/Save PDF | Download HTML
```

---

## 10. DATA PERSISTENCE & STORAGE

### localStorage Keys

| Key | Purpose | Saved When | Cleared When |
|---|---|---|---|
| `srichakra_assessment_progress` | In-progress assessment state (phase, answers, index) | Every answer/navigation change | On successful submit |
| `srichakra_report_data` | Completed report data (full ReportData JSON) | When report is generated | Never (overwritten on next assessment) |

### Firestore Collections

| Collection | Document ID | Fields | Purpose |
|---|---|---|---|
| `students` | `{uid}` | name, email, phone, createdAt, assessmentCompleted | Student profiles |
| `assessments` | `{uid}` | uid, studentName, rawAnswers, reportData, completedAt, timeTaken | Assessment results |

### Firestore Document Structure — Assessment
```json
{
  "uid": "firebase-user-id",
  "studentName": "Student Name",
  "rawAnswers": {
    "studentName": "Student Name",
    "aptitude": { "201": 2, "202": 2, ... },
    "preference": { "301": 4, "302": 3, ... }
  },
  "reportData": {
    "studentName": "Student Name",
    "assessmentDate": "14 February 2026",
    "aptitudeScores": [...],
    "preferenceScores": [...],
    "dominantHemisphere": "Left",
    "learningStyles": ["Visual", "Logical"],
    "streamRecommendations": [...],
    "courseFamilyRecommendations": [...],
    "careerClusters": [...],
    "totalAnswered": 76,
    "completionRate": 100
  },
  "completedAt": "<server timestamp>",
  "timeTaken": 1800
}
```

---

## 11. DEPLOYMENT GUIDE

### Prerequisites
- Node.js installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project: `srichakraacademy-3f745`

### Build
```bash
cd client
npm install          # Install dependencies (first time)
npm run build        # tsc && vite build → generates client/dist/
```

### Deploy to Firebase
```bash
cd ..                # Back to srichakra root
firebase login       # Authenticate (first time)
firebase deploy --only hosting
```

### Firebase Configuration

**firebase.json:**
```json
{
  "hosting": {
    "public": "client/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

### Custom Domain Setup
- **Domain:** srichakraacademy.org
- **Registrar:** Namecheap
- **A Records:** 151.101.1.195, 151.101.65.195
- **TXT Record:** `hosting-site=srichakraacademy-org`

### Live URLs
- Firebase default: https://srichakraacademy-3f745.web.app
- Custom domain: https://srichakraacademy.org (once verification completes)

---

## 12. DESIGN DECISIONS & RATIONALE

| Decision | Rationale |
|---|---|
| **No external chart library** | SVG charts are inline in the HTML template, ensuring they render perfectly in print/PDF without runtime dependencies |
| **Single HTML string for report** | One `generateFullReport()` call produces a complete `<!DOCTYPE html>` document — self-contained, portable, downloadable |
| **All scoring client-side** | No server round trip needed, instant results, works offline, simpler deployment |
| **One question at a time** | Improves focus and reduces overwhelm for young students (Class 8–10) |
| **Iframe-based report display** | Sandboxed rendering with full CSS isolation; enables native browser print/PDF |
| **localStorage for progress** | Survives page refresh mid-assessment; simple, no server dependency |
| **3-tier readiness bands** | READY NOW / WITH DEVELOPMENT / EXPLORATORY provides actionable guidance without rigid labels |
| **60/40 aptitude-preference weighting** | Balances objective ability with subjective interest for course families |
| **RIASEC mapping** | Industry-standard personality typology makes results credible and comparable |
| **Defensive data normalization** | Every page renderer handles both old and new field formats gracefully |

---

## 13. FUTURE ENHANCEMENTS

### Planned
- [ ] Complete custom domain DNS verification
- [ ] Admin analytics dashboard with charts
- [ ] Bulk student import/export (CSV)
- [ ] Email report delivery to parents
- [ ] Multi-language support (Hindi, Telugu)

### Potential
- [ ] Question bank expansion (more questions per domain)
- [ ] Adaptive testing (difficulty adjusts based on performance)
- [ ] Parent/counselor login with read-only access
- [ ] Historical comparison (retake and compare growth)
- [ ] Integration with school management systems
- [ ] Mobile app version (React Native)

---

## APPENDIX: DEMO DATA REFERENCE

The `DEMO_DATA` constant in `App.tsx` provides a complete sample for testing:

| Parameter | Demo Value |
|---|---|
| Student Name | Demo Student |
| Numerical Reasoning | 78% (Strong) |
| Verbal Ability | 85% (Strong) |
| Logical Reasoning | 72% (Moderate) |
| Spatial Intelligence | 65% (Moderate) |
| Clerical Speed | 60% (Moderate) |
| Mechanical Reasoning | 55% (Developing) |
| Top RIASEC | Investigative (4.1/5) |
| Hemisphere | Left |
| Learning Styles | Visual, Logical |
| Top Stream | Science (88% confidence) |
| Top Course Family | Engineering/Technology (85 fit score) |
| Top Career Cluster | STEM & Technology (90 match score) |

---

*This document is the complete reference for the Srichakra Academy Career Assessment System. Store it in Google Docs for team access and future development reference.*

---

**Document Version:** 2.0  
**Created:** 14 February 2026  
**Author:** Srichakra Academy Development Team
