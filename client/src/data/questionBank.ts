/**
 * QUESTION BANK — Srichakra Career Assessment
 *
 * Part 1: 16 Objective Aptitude questions (4 domains × 4 questions)
 * Part 2: 60 Self-Report Preference questions (11 domains, Likert 1-5)
 *
 * Domain mappings are internal — not shown to the student.
 */

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export type AptitudeDomain =
  | 'Numerical Reasoning'
  | 'Logical Reasoning'
  | 'Verbal Ability'
  | 'Spatial Intelligence';

export type PreferenceDomain =
  | 'Analytical'
  | 'Verbal'
  | 'Creative'
  | 'Technical'
  | 'Social'
  | 'Executive'
  | 'Conscientiousness'
  | 'LearningStyle'
  | 'Naturalistic'
  | 'Musical'
  | 'Entrepreneurial';

export interface AptitudeQuestion {
  id: number;
  type: 'aptitude';
  domain: AptitudeDomain;
  question: string;
  options: string[];
  correctIndex: number; // 0-based index
}

export interface PreferenceQuestion {
  id: number;
  type: 'preference';
  domain: PreferenceDomain;
  question: string;
  // Likert scale 1-5, no options needed
}

export type Question = AptitudeQuestion | PreferenceQuestion;

// ────────────────────────────────────────────
// PART 1 — Objective Aptitude (16 Questions)
// ────────────────────────────────────────────

export const APTITUDE_QUESTIONS: AptitudeQuestion[] = [
  // 🟢 NUMERICAL REASONING (4)
  {
    id: 201,
    type: 'aptitude',
    domain: 'Numerical Reasoning',
    question: 'What is the next number in the sequence: 2, 6, 12, 20, ?',
    options: ['24', '28', '30', '32'],
    correctIndex: 2, // C) 30
  },
  {
    id: 202,
    type: 'aptitude',
    domain: 'Numerical Reasoning',
    question: 'If 40% of a number is 120, what is the number?',
    options: ['200', '250', '300', '320'],
    correctIndex: 2, // C) 300
  },
  {
    id: 203,
    type: 'aptitude',
    domain: 'Numerical Reasoning',
    question: 'A book costs ₹240 after a 20% discount. What was the original price?',
    options: ['₹260', '₹280', '₹300', '₹320'],
    correctIndex: 2, // C) ₹300
  },
  {
    id: 204,
    type: 'aptitude',
    domain: 'Numerical Reasoning',
    question: 'Which fraction is the largest?',
    options: ['3/4', '5/8', '7/10', '9/12'],
    correctIndex: 0, // A) 3/4
  },

  // 🟢 LOGICAL REASONING (4)
  {
    id: 205,
    type: 'aptitude',
    domain: 'Logical Reasoning',
    question: 'Which number does not belong?\n27, 64, 125, 144',
    options: ['27', '64', '125', '144'],
    correctIndex: 3, // D) 144 (others are cubes)
  },
  {
    id: 206,
    type: 'aptitude',
    domain: 'Logical Reasoning',
    question: '3 → 9\n5 → 25\n7 → ?',
    options: ['42', '49', '56', '64'],
    correctIndex: 1, // B) 49
  },
  {
    id: 207,
    type: 'aptitude',
    domain: 'Logical Reasoning',
    question: 'All cats are animals.\nSome animals are wild.\nWhich statement is definitely true?',
    options: [
      'All cats are wild',
      'Some cats may be wild',
      'No cats are wild',
      'All wild animals are cats',
    ],
    correctIndex: 1, // B) Some cats may be wild
  },
  {
    id: 208,
    type: 'aptitude',
    domain: 'Logical Reasoning',
    question: 'Which comes next?\nA, C, F, J, O, ?',
    options: ['S', 'T', 'U', 'V'],
    correctIndex: 2, // C) U (+2, +3, +4, +5, +6)
  },

  // 🟢 VERBAL REASONING (4)
  {
    id: 209,
    type: 'aptitude',
    domain: 'Verbal Ability',
    question:
      'The scientist was known for her ______ approach to problem solving.',
    options: ['careless', 'systematic', 'accidental', 'hurried'],
    correctIndex: 1, // B) systematic
  },
  {
    id: 210,
    type: 'aptitude',
    domain: 'Verbal Ability',
    question: 'Choose the word most similar to "Reluctant".',
    options: ['Eager', 'Unwilling', 'Excited', 'Ready'],
    correctIndex: 1, // B) Unwilling
  },
  {
    id: 211,
    type: 'aptitude',
    domain: 'Verbal Ability',
    question: 'Choose the opposite of "Transparent".',
    options: ['Clear', 'Bright', 'Opaque', 'Thin'],
    correctIndex: 2, // C) Opaque
  },
  {
    id: 212,
    type: 'aptitude',
    domain: 'Verbal Ability',
    question: 'Which sentence is grammatically correct?',
    options: [
      "She don't like maths.",
      "She doesn't likes maths.",
      "She doesn't like maths.",
      'She not like maths.',
    ],
    correctIndex: 2, // C)
  },

  // 🟢 SPATIAL / PATTERN (4)
  {
    id: 213,
    type: 'aptitude',
    domain: 'Spatial Intelligence',
    question:
      'If a square is rotated 90° clockwise, how many sides remain in the same position?',
    options: ['0', '1', '2', '4'],
    correctIndex: 0, // A) 0
  },
  {
    id: 214,
    type: 'aptitude',
    domain: 'Spatial Intelligence',
    question:
      'Which shape completes the pattern?\n\n■  ▲  ■  ▲  ■  ?',
    options: ['■ Square', '▲ Triangle', '● Circle', '▬ Rectangle'],
    correctIndex: 1, // B) Triangle
  },
  {
    id: 215,
    type: 'aptitude',
    domain: 'Spatial Intelligence',
    question:
      'You are facing North. You turn right, then left, then right. Which direction are you facing now?',
    options: ['North', 'East', 'South', 'West'],
    correctIndex: 1, // B) East
  },
  {
    id: 216,
    type: 'aptitude',
    domain: 'Spatial Intelligence',
    question: 'How many small cubes make up a 2 × 2 × 2 cube?',
    options: ['4', '6', '8', '12'],
    correctIndex: 2, // C) 8
  },
];

// ────────────────────────────────────────────
// PART 2 — Self-Report Preferences (60 Questions)
// ────────────────────────────────────────────

export const PREFERENCE_QUESTIONS: PreferenceQuestion[] = [
  // ANALYTICAL (6)
  { id: 301, type: 'preference', domain: 'Analytical', question: 'I enjoy solving complex problems.' },
  { id: 302, type: 'preference', domain: 'Analytical', question: 'I like working with numbers and data.' },
  { id: 303, type: 'preference', domain: 'Analytical', question: 'I notice patterns quickly.' },
  { id: 304, type: 'preference', domain: 'Analytical', question: 'I enjoy logical reasoning tasks.' },
  { id: 305, type: 'preference', domain: 'Analytical', question: 'I like analyzing news or research articles.' },
  { id: 306, type: 'preference', domain: 'Analytical', question: 'I enjoy strategy games or puzzles.' },

  // VERBAL (6)
  { id: 307, type: 'preference', domain: 'Verbal', question: 'I enjoy reading regularly.' },
  { id: 308, type: 'preference', domain: 'Verbal', question: 'I like writing essays or articles.' },
  { id: 309, type: 'preference', domain: 'Verbal', question: 'I feel confident expressing ideas in words.' },
  { id: 310, type: 'preference', domain: 'Verbal', question: 'I enjoy public speaking.' },
  { id: 311, type: 'preference', domain: 'Verbal', question: 'I like debating ideas respectfully.' },
  { id: 312, type: 'preference', domain: 'Verbal', question: 'I enjoy learning new languages.' },

  // CREATIVE (6)
  { id: 313, type: 'preference', domain: 'Creative', question: 'I enjoy designing or drawing.' },
  { id: 314, type: 'preference', domain: 'Creative', question: 'I think of new ideas often.' },
  { id: 315, type: 'preference', domain: 'Creative', question: 'I prefer creative freedom in work.' },
  { id: 316, type: 'preference', domain: 'Creative', question: 'I like visual storytelling.' },
  { id: 317, type: 'preference', domain: 'Creative', question: 'I enjoy imagining new solutions.' },
  { id: 318, type: 'preference', domain: 'Creative', question: 'I enjoy brainstorming sessions.' },

  // TECHNICAL (6)
  { id: 319, type: 'preference', domain: 'Technical', question: 'I enjoy understanding how machines work.' },
  { id: 320, type: 'preference', domain: 'Technical', question: 'I like coding or working with computers.' },
  { id: 321, type: 'preference', domain: 'Technical', question: 'I enjoy fixing gadgets.' },
  { id: 322, type: 'preference', domain: 'Technical', question: 'I prefer hands-on practical work.' },
  { id: 323, type: 'preference', domain: 'Technical', question: 'I enjoy experimenting with tools or software.' },
  { id: 324, type: 'preference', domain: 'Technical', question: 'I like building models or prototypes.' },

  // SOCIAL (6)
  { id: 325, type: 'preference', domain: 'Social', question: 'I enjoy helping others learn.' },
  { id: 326, type: 'preference', domain: 'Social', question: 'I feel energized by teamwork.' },
  { id: 327, type: 'preference', domain: 'Social', question: 'I like mentoring or guiding people.' },
  { id: 328, type: 'preference', domain: 'Social', question: 'I enjoy working with diverse groups.' },
  { id: 329, type: 'preference', domain: 'Social', question: 'I feel motivated by helping a cause.' },
  { id: 330, type: 'preference', domain: 'Social', question: 'I like interacting with new people.' },

  // EXECUTIVE / LEADERSHIP (6)
  { id: 331, type: 'preference', domain: 'Executive', question: 'I like organizing events.' },
  { id: 332, type: 'preference', domain: 'Executive', question: 'I enjoy planning and scheduling.' },
  { id: 333, type: 'preference', domain: 'Executive', question: 'I like setting goals and tracking progress.' },
  { id: 334, type: 'preference', domain: 'Executive', question: 'I stay calm under pressure.' },
  { id: 335, type: 'preference', domain: 'Executive', question: 'I prefer measurable outcomes.' },
  { id: 336, type: 'preference', domain: 'Executive', question: 'I take initiative when needed.' },

  // CONSCIENTIOUSNESS (6)
  { id: 337, type: 'preference', domain: 'Conscientiousness', question: 'I am organized and detail-oriented.' },
  { id: 338, type: 'preference', domain: 'Conscientiousness', question: 'I pay attention to small mistakes.' },
  { id: 339, type: 'preference', domain: 'Conscientiousness', question: 'I value stability and structure.' },
  { id: 340, type: 'preference', domain: 'Conscientiousness', question: 'I follow through on commitments.' },
  { id: 341, type: 'preference', domain: 'Conscientiousness', question: 'I manage my time well.' },
  { id: 342, type: 'preference', domain: 'Conscientiousness', question: 'I prefer clear rules and processes.' },

  // LEARNING STYLE (6)
  { id: 343, type: 'preference', domain: 'LearningStyle', question: 'I prefer visual learning (charts, diagrams).' },
  { id: 344, type: 'preference', domain: 'LearningStyle', question: 'I prefer listening to explanations.' },
  { id: 345, type: 'preference', domain: 'LearningStyle', question: 'I prefer hands-on learning.' },
  { id: 346, type: 'preference', domain: 'LearningStyle', question: 'I reflect on mistakes to improve.' },
  { id: 347, type: 'preference', domain: 'LearningStyle', question: 'I prefer step-by-step instructions.' },
  { id: 348, type: 'preference', domain: 'LearningStyle', question: 'I learn best by teaching others.' },

  // NATURALISTIC (4)
  { id: 349, type: 'preference', domain: 'Naturalistic', question: 'I enjoy learning about nature.' },
  { id: 350, type: 'preference', domain: 'Naturalistic', question: 'I notice environmental patterns.' },
  { id: 351, type: 'preference', domain: 'Naturalistic', question: 'I enjoy outdoor exploration.' },
  { id: 352, type: 'preference', domain: 'Naturalistic', question: 'I like studying biology or geography.' },

  // MUSICAL (4)
  { id: 353, type: 'preference', domain: 'Musical', question: 'I enjoy music deeply.' },
  { id: 354, type: 'preference', domain: 'Musical', question: 'I can identify rhythms easily.' },
  { id: 355, type: 'preference', domain: 'Musical', question: 'I enjoy creating music.' },
  { id: 356, type: 'preference', domain: 'Musical', question: 'I notice sound patterns.' },

  // ENTREPRENEURIAL (4)
  { id: 357, type: 'preference', domain: 'Entrepreneurial', question: 'I get excited by business ideas.' },
  { id: 358, type: 'preference', domain: 'Entrepreneurial', question: 'I like planning finances.' },
  { id: 359, type: 'preference', domain: 'Entrepreneurial', question: 'I think about starting something of my own.' },
  { id: 360, type: 'preference', domain: 'Entrepreneurial', question: 'I enjoy risk-taking in ideas.' },
];

// ────────────────────────────────────────────
// Combined & Utility
// ────────────────────────────────────────────

export const ALL_QUESTIONS: Question[] = [
  ...APTITUDE_QUESTIONS,
  ...PREFERENCE_QUESTIONS,
];

export const TOTAL_APTITUDE = APTITUDE_QUESTIONS.length; // 16
export const TOTAL_PREFERENCE = PREFERENCE_QUESTIONS.length; // 60
export const TOTAL_QUESTIONS = ALL_QUESTIONS.length; // 76

/** Likert scale labels for preference questions */
export const LIKERT_LABELS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];
