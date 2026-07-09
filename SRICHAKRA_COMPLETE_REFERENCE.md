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
| Part 1 | Aptitude (MCQ) | 16 | 201–216 | 2-PL IRT — ability θ → percentile + 95% CI |
| Part 2 | Preference (Likert) | 60 | 301–360 | 1–5 scale → domain average |
| Part 3 | Validity — Consistency Pairs | 10 | 361–364, 380–389 | Mirror items, average absolute gap |
| Part 4 | Validity — Attention Checks | 2 | 395, 396 | Forced answers; 2 fails → Low validity |
| Part 5 | MBTI Step-I-style | 16 | 401–416 | 4 axes × 4 items, forced-Likert |
| **Total** | | **103** | | |

> **Why these counts?** Aptitude is small but item-response-scaled, so a few items still produce defensible percentile bands with 95% confidence intervals. MBTI uses 4 items per axis (E/I, S/N, T/F, J/P) — adequate for a coarse Step-I-style indicator, not a clinical type.

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

#### Step 1: Aptitude Scoring (IRT)
- Groups questions by domain (4 questions each).
- Estimates ability θ using a **2-parameter logistic IRT model** (`scoring/irt.ts`).
- Converts θ → 0–100 percentile via the standard normal CDF.
- Computes a **95% confidence interval** on the percentile from Fisher information (SE capped at 2.0). When the CI spans more than 40 points the domain is flagged `lowInformation = true` and a `LOW INFO` badge is rendered.
- Assigns level / readiness using **Wechsler-style z-score percentile cuts** (≈ 50th, 84th, 98th percentile):

| Score Range | Level | Readiness Tag | Color Code |
|---|---|---|---|
| ≥ 98 | Exceptional | READY NOW | Green (#28a745) |
| 84 – 97 | Strong | READY NOW | Green (#28a745) |
| 50 – 83 | Moderate | WITH DEVELOPMENT | Amber (#f0ad4e) |
| < 50 | Developing | EXPLORATORY | Coral (#E29578) |

#### Step 2: Preference Scoring
- Groups all 60 answers by preference domain.
- **Excludes** the validity domains (`Consistency`, `AttentionCheck`) and the four MBTI domains (`MBTI_EI/SN/TF/JP`) from RIASEC averaging — these are scored separately.
- Calculates average per domain (1.0 – 5.0 scale).
- Sorts by score (highest first).

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

Each stream gets: readiness tag, confidence score, match description, and personalized guidance text. Streams within **5 points** of the leader are flagged `tied: true` and rendered as **EQUALLY VIABLE**.

#### Step 7: Course Family Recommendations (Class 12)
Uses a **50% aptitude + 30% personality + 20% interest** base score for 6 course families, plus a curated MBTI fit bonus capped at **±5 points**:

| Course Family | Aptitude Inputs | Preference Inputs | Typical MBTI |
|---|---|---|---|
| Engineering / Technology | Numerical, Logical, Spatial | Analytical, Technical | xxTJ |
| Data Science & Analytics | Numerical, Logical | Analytical, Technical | xNTJ |
| Medicine / Life Sciences | Numerical, Logical, Verbal | Analytical, Social | xSxJ |
| Business / Commerce | Numerical, Verbal, Logical | Executive, Analytical | ExxJ |
| Law / Social Sciences | Verbal, Logical | Verbal, Social | xxxJ |
| Arts / Design / Media | Spatial, Verbal | Creative, Verbal | xNFP |

Each family gets: fit score, alignment tag, MBTI bonus, guidance text, and course suggestions. Families within **5 points** of the leader are flagged `tied: true`.

#### Step 8: Career Cluster Generation
Scores all **18 clusters** in `careerClusters.ts` (filtered to top 3 for the report). Each cluster carries a curated `mbtiFit` pattern drawn from the published **Holland (RIASEC) ↔ MBTI correspondence** (Tieger / Barron-Tieger; Hammer & Macdaid) — *not* inferred from RIASEC scores at runtime. The same ±5 pt MBTI bonus is applied. Clusters within 5 points of the leader render an **EQUALLY VIABLE** badge.

#### Step 9: MBTI Scoring (Step-I-style)
- 16 forced-Likert items, 4 per axis (E/I, S/N, T/F, J/P).
- Each axis returns `{leaning, strength: 0–100, itemsAnswered}`.
- A type is reported only when **all 4 axes** have at least 3 answered items.
- The MBTI signal is **supporting**, not deciding — its contribution to family/cluster scores is hard-capped at ±5 points and is suppressed when validity is Low.

#### Step 10: Validity Controls
- **10 mirror-pair consistency items** (361–364, 380–389) — average absolute Likert gap classified Low/Moderate/High.
- **2 attention checks** (395, 396) with forced expected answers.
- Two attention failures force the consistency rating to **Low** and disable the MBTI bonus.

### Final Output
```
ReportData {
  studentName, assessmentDate,
  aptitudeScores[],           // 4 domains with scores, levels, readiness
  preferenceScores[],         // 6 RIASEC domains with 1-5 scores
  dominantHemisphere,         // "Left" | "Right" | "Balanced"
  learningStyles[],           // Top 2 learning styles
  streamRecommendations[],    // 3 streams (Science/Commerce/Arts) + tied flag
  courseFamilyRecommendations[], // 6 course families + mbtiBonus + tied flag
  careerClusters[],           // top 3 of 18 clusters + mbtiBonus + tied flag
  miScores[],                 // 8 Multiple Intelligences (display-only)
  mbti: { type, axes[], reliable }, // 4-letter code + per-axis strength
  consistency: { level, attentionCheckPassed }, // validity summary
  totalAnswered,              // Out of 103
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
| **Page 2A** | Aptitude Snapshot (Table) | 5-column table: Domain, Score, Performance Level, Readiness, Key Skills (parent-facing — technical CI column removed) |
| **Page 2B** | Aptitude Snapshot (Chart) | Horizontal bar chart (SVG), interpretation text, strongest area highlight, developing areas, guardrail note |
| **Page 3** | Preference & Personality | RIASEC radar chart (SVG), RIASEC table, top interests narrative, **Personality Type Indicator** (4-letter MBTI code with bidirectional axis bars and ±5pt-cap note) |
| **Page 4** | Brain & Learning Style | Brain hemisphere analysis, **MI distribution** (8-row horizontal bar chart, display-only), learning style identification, study strategies, five senses grid |
| **Page 5A** | Class 10 Stream Decision | Stream readiness overview, why-this-fits narrative |
| **Page 5B** | Class 10 Stream Decision (cont.) | Stream decision table with **EQUALLY VIABLE** tied-zone badges, guidance per stream |
| **Page 6** | Class 12 Course Families | Course family alignment, 50/30/20 + ±5 Personality-fit adjustment, 6-family decision table with tied badges, pathway progression |
| **Page 7** | Career Clusters | Top-3 cluster cards (out of 18) with curated MBTI-fit, exploration disclaimer, tied badges, cross-cluster combinations |
| **Page 8** | Action Steps & Guidance | Student next steps, parent guidance, consultation CTA, **How Your Scores Are Built** block (plain-language summary — no IRT/CI/MBTI jargon), closing message |

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

The `DEMO_DATA` constant in `App.tsx` provides a complete sample for testing the `/demo` route. It is rebuilt to match the current schema (IRT bands, MBTI, MI, validity, tied flags).

| Parameter | Demo Value |
|---|---|
| Student Name | Demo Student |
| Numerical Reasoning | 78% (CI 64–88, Moderate) |
| Logical Reasoning | 84% (CI 71–92, Strong) |
| Verbal Ability | 71% (CI 56–83, Moderate) |
| Spatial Intelligence | 68% (CI 53–81, Moderate) |
| Top RIASEC | Investigative (4.2/5) |
| MBTI Type | INTJ (reliable: true) |
| Response Reliability | High (consistency level + attention checks passed) |
| MI Top 3 | Logical-Mathematical (82), Linguistic (70), Visual-Spatial (68) |
| Hemisphere | Left |
| Learning Styles | Visual, Logical |
| Top Stream | Science / Commerce / Arts all 77% confidence (Commerce + Arts marked **Equally Viable**) |
| Top Course Family | Engineering/Technology (86 fit) — Data Science tied |
| Top Career Cluster | Engineering & Technology (85) — Pure Sciences tied |
| Items Answered | 103 / 103 |

> Stale fields removed in this audit: `Clerical Speed` and `Mechanical Reasoning` aptitude domains (never measured), and the legacy 76-question total. The current bank is **103 items**.

---

## APPENDIX B: CAREER COUNSELLOR CERTIFICATION (CCC) LANDING PAGE

A standalone marketing landing page for the 3-month Career Counsellor Certification programme.

### Routing & Files
| Item | Path |
|---|---|
| Public URL | `/career-counsellor-certification/` |
| Source (deployed) | `client/public/career-counsellor-certification/index.html` |
| Source (root copy / preview) | `srichakra/career-counsellor-certification.html` |
| Tracking script | `client/public/ccc-landing.js` |
| Meta Pixel | `client/public/meta-pixel.js` |
| Campaign brief | `Career_Counsellor_Certification_Campaign.md` |
| Ad scripts | `Career_Counsellor_Certification_Campaign.md` + `VinayagarAgaval/Ad_Scripts_Career_Counselling.md` |
| WhatsApp flow | `WhatsApp_Automation_Flow_CCC.md` |
| Meta ads strategy | `Meta_Ads_Strategy_CCC.md` |

> The page is **served as a static HTML file** by Firebase Hosting from `client/public/`. It is *not* part of the React SPA bundle, so it loads fast and has its own SEO meta. The SPA's catch-all rewrite (`** → /index.html`) does not apply because the file exists at the requested path.

### Programme Snapshot (kept in sync with the page)
| Field | Value |
|---|---|
| Duration | 3 months |
| Delivery | Live online, 2 classes / week |
| Modules | 6 (Foundations, Assessment Science, RIASEC & MBTI, Counselling Skills, Practicum, Business Setup) |
| Cohort size | 15 seats / batch (capped) |
| Backed by | SCOPE assessment science (the same engine documented above) |
| Brand voice | Dronacharya × Modern Science |

### Target Personas (from `Career_Counsellor_Certification_Campaign.md`)
1. The Frustrated / Experienced Teacher
2. The Psychology Graduate
3. The Empowered / Ambitious Parent
4. The HR / Corporate Switcher
5. The School Management Buyer

### Conversion Surfaces on the Page
- Sticky top bar with **"Only 15 seats / batch"** scarcity badge
- Hero CTA → WhatsApp enrolment number (`wa.me/...`)
- "Made for you if…" persona grid
- Module breakdown (6 cards)
- Pricing block with seats counter
- Final CTA section with WhatsApp + call buttons
- Meta Pixel `Lead` event fires on CTA click (`ccc-landing.js`)

### Audit Notes
- ✅ Page served from `client/public/` so it deploys on every `firebase deploy --only hosting`.
- ✅ Same Content-Security-Policy headers from `firebase.json` apply (Razorpay, Meta, GA allowed).
- ⚠️  No client-side enrolment form yet — leads are captured via WhatsApp + manual sales follow-up. A Firestore `cccLeads` collection is *not yet* wired.
- ⚠️  The seats-remaining number is currently hard-coded; consider promoting to a Firestore-backed counter so it updates across the site without a redeploy.

---

## APPENDIX C: CHANGE LOG / AUDIT TRAIL

Major upgrades to the assessment platform, in chronological order.

| Wave | Scope | Files Touched |
|---|---|---|
| **W1 — MI decoupling** | Multiple Intelligences was leaking into stream/family/cluster scoring. Removed MI from `preferenceFit` for 4 clusters; demoted MI to **display-only** (Page 4 distribution chart). | `careerClusters.ts`, `scoringEngine.ts`, `reportTemplate.tsx` |
| **W2 — MI distribution chart** | Added 8-row horizontal bar chart on Page 4 between hemisphere block and learning-style insights. | `reportTemplate.tsx` |
| **W3 — Validity v1** | 5 mirror-pair consistency check + Response Reliability badge on Page 1. | `questionBank.ts`, `scoringEngine.ts`, `reportTemplate.tsx` |
| **W4 — Honesty audit** | Removed claims about MBTI/clerical/mechanical that were never actually measured. | docs + `reportTemplate.tsx` |
| **W5 — Reliability + MBTI** | 16-item MBTI Step-I-style; expanded to **10 mirror pairs + 2 attention checks**; aptitude IRT Standard Error → 95% CI; ±5pt MBTI fit cap. | `irt.ts`, `scoringEngine.ts`, `questionBank.ts`, `reportTemplate.tsx` |
| **W6 — Standards-based fit** | Curated `mbtiFit` per cluster (Tieger/Barron + Hammer & Macdaid); Wechsler-style 98/84/50 z-cuts; tie-zone rule (within 5 pts → "Equally Viable"); low-info CI flag (>40 pt span); Methodology Notes block on Page 8. | `careerClusters.ts`, `scoringEngine.ts`, `reportTemplate.tsx` |
| **W7 — Demo refresh + audit** | Rewrote `DEMO_DATA` (App.tsx) to match the current schema. Updated Page 1 "What We Measured" to reflect the 16+60+10+2+16 = 103-item bank. Documented the CCC landing page. | `App.tsx`, `reportTemplate.tsx`, this doc |
| **W8 — Parent-facing language cleanup** | Stripped psychometric jargon from the student/parent report: removed the 95% CI column and LOW INFO badge from the Page 2A aptitude table; replaced "Psychometric Analysis" header with "Career Assessment"; rewrote "What We Measured" and the Page 8 "How Your Scores Are Built" block in plain English (no IRT, Wechsler, RIASEC, Likert, Holland\u2194MBTI references); corrected the Page 6 Scoring Method footnote from "60% Aptitude + 40% Preference" to the actual **50% Aptitude + 30% Personality + 20% Interest** (with capped \u00b15 personality-fit adjustment); renamed the in-table "MBTI fit" badge to "Personality fit". The standalone Counsellor's Note (`/counsellor-note`) is unchanged and remains the technical companion document. Demo report (`scope-demo-report.html`) regenerated. | `reportTemplate.tsx`, `scope-demo-report.html`, this doc || **W9 — Counsellor Note access control** | Gated `/counsellor-note` and `/counsellor-note/demo` behind `RequireAdmin` (only emails in `ADMIN_EMAILS` can open them). Added a 📋 **Counsellor's Note** button to the report toolbar in `CareerAssessment.tsx`, visible only when `isAdmin === true`; clicking opens the note in a new tab using the same cached `reportData`. Students and parents see no link or button. | `App.tsx`, `CareerAssessment.tsx`, this doc |
### Reliability Component — Single-Page Reference
The **Response Reliability** badge that appears under the student's name on Page 1 is the visible expression of the validity controls:

```
consistency.level = High  | Medium | Low
consistency.attentionCheckPassed = true | false
```

Derivation (in `scoringEngine.ts → checkConsistency`):
1. For each of the 10 mirror pairs, compute `|likertA − likertB|`.
2. Average those 10 absolute gaps → `meanGap`.
3. Bucket: `meanGap < 1.0` → High, `< 1.6` → Medium, else → Low.
4. Evaluate the 2 attention-check items against their `expectedValue` field.
5. **If two attention checks fail, force `level = 'Low'` AND set `mbti.reliable = false`** so the MBTI bonus is suppressed.

Page 1 colours: High → green pill (`#d4edda` / `#155724`), Medium → amber, Low → red. Low rating shows a sentence advising cautious interpretation.

---

*This document is the complete reference for the Srichakra Academy Career Assessment System. Store it in Google Docs for team access and future development reference.*

---

**Document Version:** 3.0  
**Created:** 14 February 2026  
**Last Audited:** 30 May 2026 (Wave 7 — demo data refresh + CCC landing page documented)  
**Author:** Srichakra Academy Development Team
