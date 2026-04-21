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
  | 'Entrepreneurial'
  | 'Consistency'; // For internal validation

export interface AptitudeQuestion {
  id: number;
  type: 'aptitude';
  domain: AptitudeDomain;
  question: string;
  options: string[];
  correctIndex: number; // 0-based index
  // IRT Parameters
  difficulty: number; // b-parameter: 0-1 (Easy -> Hard)
  discrimination: number; // a-parameter: 0-1 (Low -> High)
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
  // 🟢 NUMERICAL REASONING (6 Questions - Balanced Difficulty)
  {
    id: 220,
    type: 'aptitude',
    domain: 'Numerical Reasoning',
    question: 'What is 15% of 400?',
    options: ['40', '50', '60', '75'],
    correctIndex: 2, // C) 60
    difficulty: 0.2,
    discrimination: 0.9,
  },
  {
    id: 202,
    type: 'aptitude',
    domain: 'Numerical Reasoning',
    question: 'If 40% of a number is 120, what is the number?',
    options: ['200', '250', '300', '320'],
    correctIndex: 2, // C) 300
    difficulty: 0.3,
    discrimination: 0.9,
  },
  {
    id: 203,
    type: 'aptitude',
    domain: 'Numerical Reasoning',
    question: 'A book costs ₹240 after a 20% discount. What was the original price?',
    options: ['₹260', '₹280', '₹300', '₹320'],
    correctIndex: 2, // C) ₹300
    difficulty: 0.5,
    discrimination: 0.85,
  },
  {
    id: 219,
    type: 'aptitude',
    domain: 'Numerical Reasoning',
    question: 'The ratio of boys to girls in a class is 3:5. If there are 40 students in total, how many are boys?',
    options: ['12', '15', '18', '20'],
    correctIndex: 1, // B) 15
    difficulty: 0.5,
    discrimination: 0.75,
  },
  {
    id: 237,
    type: 'aptitude',
    domain: 'Numerical Reasoning',
    question: 'The simple interest on a sum for 5 years is half the sum. What is the rate of interest per annum?',
    options: ['5%', '8%', '10%', '12%'],
    correctIndex: 2, // C) 10%
    difficulty: 0.7,
    discrimination: 0.8,
  },
  {
    id: 233,
    type: 'aptitude',
    domain: 'Numerical Reasoning',
    question: 'A shopkeeper mixes two varieties of tea, one costing ₹150/kg and another costing ₹250/kg, in the ratio 5:3. If he sells the mixture at ₹210/kg, what is his profit percentage?',
    options: ['12%', '15%', '18%', '20%'],
    correctIndex: 0, // A) 12%
    difficulty: 0.8,
    discrimination: 0.8,
  },

  // 🟢 LOGICAL REASONING (6 Questions - Balanced Difficulty)
  {
    id: 206,
    type: 'aptitude',
    domain: 'Logical Reasoning',
    question: '3 → 9\n5 → 25\n7 → ?',
    options: ['42', '49', '56', '64'],
    correctIndex: 1, // B) 49
    difficulty: 0.2,
    discrimination: 0.9,
  },
  {
    id: 221,
    type: 'aptitude',
    domain: 'Logical Reasoning',
    question: 'Tree is to Forest as Soldier is to ?',
    options: ['Gun', 'Army', 'Battle', 'Uniform'],
    correctIndex: 1, // B) Army
    difficulty: 0.3,
    discrimination: 0.85,
  },
  {
    id: 208,
    type: 'aptitude',
    domain: 'Logical Reasoning',
    question: 'Which comes next?\nA, C, F, J, O, ?',
    options: ['S', 'T', 'U', 'V'],
    correctIndex: 2, // C) U (+2, +3, +4, +5, +6)
    difficulty: 0.5,
    discrimination: 0.8,
  },
  {
    id: 222,
    type: 'aptitude',
    domain: 'Logical Reasoning',
    question: 'If FRIEND is coded as HUMJTK, how is CANDLE coded?',
    options: ['DEQJQM', 'EDRIRL', 'ESFJSF', 'FYOBOC'],
    correctIndex: 1, // B) EDRIRL (+2 pattern)
    difficulty: 0.6,
    discrimination: 0.75,
  },
  {
    id: 223,
    type: 'aptitude',
    domain: 'Logical Reasoning',
    question: 'Pointing to a photograph, a man said, "I have no brother or sister, but that man\'s father is my father\'s son." Whose photograph was it?',
    options: ['His own', 'His son\'s', 'His father\'s', 'His nephew\'s'],
    correctIndex: 1, // B) His son's
    difficulty: 0.7,
    discrimination: 0.7,
  },
  {
    id: 234,
    type: 'aptitude',
    domain: 'Logical Reasoning',
    question: 'Find the missing term: 4, 10, ?, 82, 244, 730',
    options: ['24', '28', '30', '26'],
    correctIndex: 3, // D) 26 (Pattern is x*3 - 2)
    difficulty: 0.85,
    discrimination: 0.75,
  },

  // 🟢 VERBAL ABILITY (6 Questions - Balanced Difficulty)
  {
    id: 211,
    type: 'aptitude',
    domain: 'Verbal Ability',
    question: 'Choose the opposite of "Transparent".',
    options: ['Clear', 'Bright', 'Opaque', 'Thin'],
    correctIndex: 2, // C) Opaque
    difficulty: 0.3,
    discrimination: 0.9,
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
    difficulty: 0.4,
    discrimination: 0.8,
  },
  {
    id: 239,
    type: 'aptitude',
    domain: 'Verbal Ability',
    question: 'Choose the correctly spelled word.',
    options: ['Accomodate', 'Acomodate', 'Accommodate', 'Acomoddate'],
    correctIndex: 2,
    difficulty: 0.6,
    discrimination: 0.9,
  },
  {
    id: 227,
    type: 'aptitude',
    domain: 'Verbal Ability',
    question: 'Choose the word most similar to "Ubiquitous".',
    options: ['Rare', 'Scarce', 'Everywhere', 'Hidden'],
    correctIndex: 2, // C) Everywhere
    difficulty: 0.6,
    discrimination: 0.8,
  },
  {
    id: 226,
    type: 'aptitude',
    domain: 'Verbal Ability',
    question: 'The manager’s decision was met with both approval and ______ from the team.',
    options: ['praise', 'derision', 'indifference', 'confusion'],
    correctIndex: 1, // B) derision (means contempt or ridicule)
    difficulty: 0.7,
    discrimination: 0.75,
  },
  {
    id: 235,
    type: 'aptitude',
    domain: 'Verbal Ability',
    question: 'Read the passage and answer: "The treaty was a pyrrhic victory. Though the army won the battle, they lost so many soldiers that they could not sustain the war." What does "pyrrhic victory" mean?',
    options: ['A decisive victory', 'A victory with no losses', 'A victory that comes at too great a cost', 'A temporary truce'],
    correctIndex: 2,
    difficulty: 0.75,
    discrimination: 0.85,
  },

  // 🟢 SPATIAL INTELLIGENCE (6 Questions - Balanced Difficulty)
  {
    id: 229,
    type: 'aptitude',
    domain: 'Spatial Intelligence',
    question: 'Which of the following is a 3D shape?',
    options: ['Circle', 'Triangle', 'Sphere', 'Square'],
    correctIndex: 2, // C) Sphere
    difficulty: 0.1,
    discrimination: 0.95,
  },
  {
    id: 214,
    type: 'aptitude',
    domain: 'Spatial Intelligence',
    question:
      'Which shape completes the pattern?\n\n■  ▲  ■  ▲  ■  ?',
    options: ['■ Square', '▲ Triangle', '● Circle', '▬ Rectangle'],
    correctIndex: 1, // B) Triangle
    difficulty: 0.2,
    discrimination: 0.9,
  },
  {
    id: 215,
    type: 'aptitude',
    domain: 'Spatial Intelligence',
    question:
      'You are facing North. You turn right, then left, then right. Which direction are you facing now?',
    options: ['North', 'East', 'South', 'West'],
    correctIndex: 1, // B) East
    difficulty: 0.4,
    discrimination: 0.8,
  },
  {
    id: 231,
    type: 'aptitude',
    domain: 'Spatial Intelligence',
    question: 'If you look at a dice, which number is on the opposite face of 3?',
    options: ['1', '2', '4', '5'],
    correctIndex: 2, // C) 4 (opposite faces of a standard die add up to 7)
    difficulty: 0.5,
    discrimination: 0.75,
  },
  {
    id: 232,
    type: 'aptitude',
    domain: 'Spatial Intelligence',
    question: 'Which shape cannot be created by joining two triangles together?',
    options: ['Square', 'Diamond (Rhombus)', 'Larger Triangle', 'Circle'],
    correctIndex: 3, // D) Circle
    difficulty: 0.6,
    discrimination: 0.7,
  },
  {
    id: 236,
    type: 'aptitude',
    domain: 'Spatial Intelligence',
    question: 'A cube is painted blue on all faces. It is then cut into 64 smaller, equal cubes. How many small cubes have exactly one face painted?',
    options: ['8', '12', '24', '36'],
    correctIndex: 2, // C) 24
    difficulty: 0.8,
    discrimination: 0.8,
  },
];

// ────────────────────────────────────────────
// PART 2 — Self-Report Preferences (50 Questions)
// ────────────────────────────────────────────

export const PREFERENCE_QUESTIONS: PreferenceQuestion[] = [
  // ANALYTICAL (4)
  { id: 301, type: 'preference', domain: 'Analytical', question: 'I enjoy solving complex problems.' },
  { id: 302, type: 'preference', domain: 'Analytical', question: 'I like working with numbers and data.' },
  { id: 303, type: 'preference', domain: 'Analytical', question: 'I notice patterns quickly.' },
  { id: 306, type: 'preference', domain: 'Analytical', question: 'I enjoy strategy games or puzzles.' },

  // VERBAL (4)
  { id: 307, type: 'preference', domain: 'Verbal', question: 'I enjoy reading regularly.' },
  { id: 309, type: 'preference', domain: 'Verbal', question: 'I feel confident expressing ideas in words.' },
  { id: 310, type: 'preference', domain: 'Verbal', question: 'I enjoy public speaking.' },
  { id: 312, type: 'preference', domain: 'Verbal', question: 'I enjoy learning new languages.' },

  // CREATIVE (4)
  { id: 313, type: 'preference', domain: 'Creative', question: 'I enjoy designing or drawing.' },
  { id: 314, type: 'preference', domain: 'Creative', question: 'I think of new ideas often.' },
  { id: 315, type: 'preference', domain: 'Creative', question: 'I prefer creative freedom in work.' },
  { id: 318, type: 'preference', domain: 'Creative', question: 'I enjoy brainstorming sessions.' },

  // TECHNICAL (4)
  { id: 319, type: 'preference', domain: 'Technical', question: 'I enjoy understanding how machines work.' },
  { id: 320, type: 'preference', domain: 'Technical', question: 'I like coding or working with computers.' },
  { id: 322, type: 'preference', domain: 'Technical', question: 'I prefer hands-on practical work.' },
  { id: 324, type: 'preference', domain: 'Technical', question: 'I like building models or prototypes.' },

  // SOCIAL (4)
  { id: 325, type: 'preference', domain: 'Social', question: 'I enjoy helping others learn.' },
  { id: 326, type: 'preference', domain: 'Social', question: 'I feel energized by teamwork.' },
  { id: 329, type: 'preference', domain: 'Social', question: 'I feel motivated by helping a cause.' },
  { id: 330, type: 'preference', domain: 'Social', question: 'I like interacting with new people.' },

  // EXECUTIVE / LEADERSHIP (4)
  { id: 331, type: 'preference', domain: 'Executive', question: 'I like organizing events.' },
  { id: 332, type: 'preference', domain: 'Executive', question: 'I enjoy planning and scheduling.' },
  { id: 334, type: 'preference', domain: 'Executive', question: 'I stay calm under pressure.' },
  { id: 336, type: 'preference', domain: 'Executive', question: 'I take initiative when needed.' },

  // CONSCIENTIOUSNESS (4)
  { id: 337, type: 'preference', domain: 'Conscientiousness', question: 'I am organized and detail-oriented.' },
  { id: 338, type: 'preference', domain: 'Conscientiousness', question: 'I pay attention to small mistakes.' },
  { id: 340, type: 'preference', domain: 'Conscientiousness', question: 'I follow through on commitments.' },
  { id: 342, type: 'preference', domain: 'Conscientiousness', question: 'I prefer clear rules and processes.' },

  // LEARNING STYLE (4)
  { id: 343, type: 'preference', domain: 'LearningStyle', question: 'I prefer visual learning (charts, diagrams).' },
  { id: 344, type: 'preference', domain: 'LearningStyle', question: 'I prefer listening to explanations.' },
  { id: 345, type: 'preference', domain: 'LearningStyle', question: 'I prefer hands-on learning.' },
  { id: 348, type: 'preference', domain: 'LearningStyle', question: 'I learn best by teaching others.' },

  // NATURALISTIC (3)
  { id: 349, type: 'preference', domain: 'Naturalistic', question: 'I enjoy learning about nature.' },
  { id: 351, type: 'preference', domain: 'Naturalistic', question: 'I enjoy outdoor exploration.' },
  { id: 352, type: 'preference', domain: 'Naturalistic', question: 'I like studying biology or geography.' },

  // MUSICAL (3)
  { id: 353, type: 'preference', domain: 'Musical', question: 'I enjoy music deeply.' },
  { id: 354, type: 'preference', domain: 'Musical', question: 'I can identify rhythms easily.' },
  { id: 356, type: 'preference', domain: 'Musical', question: 'I notice sound patterns.' },

  // ENTREPRENEURIAL (3)
  { id: 357, type: 'preference', domain: 'Entrepreneurial', question: 'I get excited by business ideas.' },
  { id: 358, type: 'preference', domain: 'Entrepreneurial', question: 'I like planning finances.' },
  { id: 359, type: 'preference', domain: 'Entrepreneurial', question: 'I think about starting something of my own.' },

  // CONSISTENCY CHECKS (5 pairs) - For internal validation only
  { id: 361, type: 'preference', domain: 'Consistency', question: 'I enjoy being part of a team.' }, // Mirror of 362
  { id: 362, type: 'preference', domain: 'Consistency', question: 'I prefer working alone.' },

  { id: 363, type: 'preference', domain: 'Consistency', question: 'I like having a clear, predictable schedule.' }, // Mirror of 364
  { id: 364, type: 'preference', domain: 'Consistency', question: 'I enjoy flexibility and spontaneous tasks.' },

  { id: 365, type: 'preference', domain: 'Consistency', question: 'I am more of a creative, ideas person.' }, // Mirror of 366
  { id: 366, type: 'preference', domain: 'Consistency', question: 'I prefer practical, hands-on tasks over brainstorming.' },

  { id: 367, type: 'preference', domain: 'Consistency', question: 'I make decisions quickly based on my gut feeling.' }, // Mirror of 368
  { id: 368, type: 'preference', domain: 'Consistency', question: 'I prefer to analyze all data before making a choice.' },

  { id: 373, type: 'preference', domain: 'Consistency', question: 'I find it easy to talk to new people.' }, // Mirror of 374
  { id: 374, type: 'preference', domain: 'Consistency', question: 'I am usually quiet in a room full of strangers.' },
];

// ────────────────────────────────────────────
// Combined & Utility
// ────────────────────────────────────────────

export const ALL_QUESTIONS: Question[] = [
  ...APTITUDE_QUESTIONS,
  ...PREFERENCE_QUESTIONS,
];

export const TOTAL_APTITUDE = APTITUDE_QUESTIONS.length; // 24
export const TOTAL_PREFERENCE = PREFERENCE_QUESTIONS.length; // 50
export const TOTAL_QUESTIONS = ALL_QUESTIONS.length; // 74

/** Likert scale labels for preference questions */
export const LIKERT_LABELS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];
