/**
 * CANONICAL REPORT LAYOUT SPECIFICATION
 * 
 * This file defines the authoritative structure for the Career Assessment PDF report.
 * Source: scope 271.pdf + authoritative reference structure
 * 
 * DO NOT modify this structure without updating the reference documentation.
 * This is the contract that CareerAssessment.tsx must follow.
 */

export interface ReportSection {
  name: string;
  purpose: string;
  columns?: string[];
}

export interface ReportPage {
  page: number;
  title: string;
  density: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  sections: ReportSection[];
  dataSource?: string;
  excludes?: string[];
  notes?: string;
}

export const REPORT_LAYOUT: ReportPage[] = [
  {
    page: 1,
    title: "Cover & Executive Summary",
    density: "MEDIUM",
    sections: [
      {
        name: "Cover Header",
        purpose: "Student identification, assessment title, branding"
      },
      {
        name: "Student Details Card",
        purpose: "Name, date, completion stats"
      },
      {
        name: "Executive Summary",
        purpose: "High-level synthesis of assessment results"
      },
      {
        name: "How to Read This Report",
        purpose: "Explain Aptitude (16 objective) vs Preferences (60 self-report)"
      },
      {
        name: "Gentle Disclaimer",
        purpose: "Guidance tool, not final decisions"
      }
    ],
    excludes: ["Decision tables", "Stream tables", "Course tables", "Career lists"],
    notes: "Introduction only. Sets context. No recommendations."
  },
  
  {
    page: 2,
    title: "Aptitude Ability Snapshot",
    density: "HEAVY",
    sections: [
      {
        name: "5-Column Aptitude Table",
        purpose: "Show objective test scores across cognitive domains",
        columns: ["Domain", "Raw Score", "Percentile", "Level", "Interpretation"]
      },
      {
        name: "Readiness Classification",
        purpose: "Categorize each aptitude: READY NOW / WITH DEVELOPMENT / EXPLORATORY"
      },
      {
        name: "Interpretation Text",
        purpose: "What these scores mean academically"
      }
    ],
    dataSource: "16 objective aptitude questions",
    notes: "Evidence-based. Objective. Early positioning of cognitive strengths."
  },
  
  {
    page: 3,
    title: "Preference Domain Analysis",
    density: "MEDIUM",
    sections: [
      {
        name: "Interest Charts",
        purpose: "Visual representation of RIASEC/MI scores"
      },
      {
        name: "Preference Explanation",
        purpose: "What student enjoys and is motivated by"
      },
      {
        name: "Top Preference Domains",
        purpose: "List strongest interest areas"
      }
    ],
    dataSource: "60 self-report preference questions",
    excludes: ["Career decisions", "Course recommendations"],
    notes: "Interest and motivation only. No pathway decisions yet."
  },
  
  {
    page: 4,
    title: "Brain Hemisphere & Learning Style",
    density: "LIGHT",
    sections: [
      {
        name: "Brain Dominance Result",
        purpose: "Left/Right/Balanced classification"
      },
      {
        name: "Learning Style Profile",
        purpose: "How student processes information (visual/auditory/kinesthetic)"
      },
      {
        name: "Five Senses Learning Grid",
        purpose: "Multi-sensory learning preferences"
      },
      {
        name: "Study Strategy Implications",
        purpose: "How this affects learning approaches"
      }
    ],
    notes: "Metacognitive insight. Helps understand HOW student learns."
  },
  
  {
    page: 5,
    title: "Class 10 Subject Stream Readiness",
    density: "HEAVY",
    sections: [
      {
        name: "Why This Recommendation Fits You",
        purpose: "Narrative explanation BEFORE table showing reasoning"
      },
      {
        name: "Stream Decision Table",
        purpose: "Science/Commerce/Arts with readiness levels and evidence",
        columns: ["Stream", "Readiness", "Supporting Evidence", "Fit Score"]
      },
      {
        name: "Confidence Level Indicator",
        purpose: "Show certainty of recommendation"
      }
    ],
    dataSource: "Combines aptitude scores + preference alignment",
    notes: "First decision point. Evidence-driven. Explanation comes BEFORE table."
  },
  
  {
    page: 6,
    title: "Class 12 Course Family Alignment",
    density: "HEAVY",
    sections: [
      {
        name: "Why This Recommendation Fits You",
        purpose: "Narrative explanation BEFORE table showing reasoning"
      },
      {
        name: "Course Family Decision Table",
        purpose: "Engineering/Medical/Business/etc. with alignment scores",
        columns: ["Course Family", "Alignment", "Key Strengths Match", "Score"]
      },
      {
        name: "Pathway Clarity Note",
        purpose: "Explain progression from Stream → Course Family"
      }
    ],
    dataSource: "Builds on stream + adds preference depth",
    notes: "Second decision point. Shows educational pathway. Explanation BEFORE table."
  },
  
  {
    page: 7,
    title: "Career Direction Clusters",
    density: "MEDIUM",
    sections: [
      {
        name: "Strong Disclaimer",
        purpose: "This is EXPLORATION, not final career selection"
      },
      {
        name: "Career Cluster Cards",
        purpose: "Show 3-5 career families that align with profile"
      },
      {
        name: "Career Awareness Grid",
        purpose: "Broaden horizons, show possibilities"
      },
      {
        name: "No Rankings",
        purpose: "Explicitly avoid 'best career' language"
      }
    ],
    notes: "Exploratory mindset. Age-appropriate. Avoid premature narrowing."
  },
  
  {
    page: 8,
    title: "Action Steps & Guidance",
    density: "LIGHT",
    sections: [
      {
        name: "Next Steps for Student",
        purpose: "Immediate actionable items"
      },
      {
        name: "Next Steps for Parents",
        purpose: "How to support exploration"
      },
      {
        name: "Consultation Offer",
        purpose: "Srichakra Academy contact/consultation info"
      },
      {
        name: "Encouragement & Closing",
        purpose: "Positive, growth-oriented conclusion"
      }
    ],
    notes: "Actionable. Supportive. Clear next steps."
  }
];

/**
 * Layout principles that must be followed when rendering the report
 */
export const LAYOUT_PRINCIPLES = [
  "Aptitude (objective) before Preferences (subjective)",
  "Evidence before Decisions",
  "Education pathways before Career exploration",
  "Explanation narratives BEFORE decision tables",
  "No career decisions on Page 1",
  "Gentle disclaimers throughout",
  "Age-appropriate language (14-16 year olds)"
];

/**
 * The logical flow of information through the report
 */
export const FLOW_LOGIC = "Cognitive Evidence → Learning Style → Stream Decision → Course Alignment → Career Awareness → Action Steps";

/**
 * Page density guidelines for A4 layout
 */
export const PAGE_DENSITY_GUIDE = {
  LIGHT: "50-65% vertical fill - more whitespace, breathing room",
  MEDIUM: "65-85% vertical fill - balanced content and spacing",
  HEAVY: "85-95% vertical fill - dense tables/charts, minimal waste"
};

/**
 * Helper function to get sections for a specific page
 */
export function getSectionsForPage(pageNumber: number): ReportSection[] {
  const page = REPORT_LAYOUT.find(p => p.page === pageNumber);
  return page?.sections || [];
}

/**
 * Helper function to validate if content belongs on a specific page
 */
export function isContentAllowedOnPage(pageNumber: number, contentType: string): boolean {
  const page = REPORT_LAYOUT.find(p => p.page === pageNumber);
  if (!page) return false;
  
  if (page.excludes && page.excludes.some(ex => 
    contentType.toLowerCase().includes(ex.toLowerCase())
  )) {
    return false;
  }
  
  return true;
}

/**
 * Total number of pages in the report
 */
export const TOTAL_PAGES = 8;

/**
 * Paging strategy for PDF generation
 */
export const PAGING_STRATEGY = "A4 portrait, ~85-95% vertical fill, page breaks between logical sections";
