/**
 * CAREER CLUSTER REPOSITORY — Srichakra Career Assessment
 *
 * Comprehensive stream → career cluster → career pathway mapping
 * aligned with Indian education system (Class 10/12 decision points).
 *
 * Structure:
 *   Stream (Science / Commerce / Arts)
 *     └── Career Cluster
 *           └── Career Pathways (with roles, qualifications, exams, skills)
 *
 * Aptitude & Preference mappings reference domains from questionBank.ts
 * and are consumed by scoringEngine.ts for match scoring.
 */

import type { AptitudeDomain, PreferenceDomain } from './questionBank';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export type StreamName = 'Science' | 'Commerce' | 'Arts / Humanities';

export type ClusterName =
  | 'Engineering & Technology'
  | 'Medicine & Healthcare'
  | 'Pure Sciences & Research'
  | 'Agriculture & Environmental Science'
  | 'Defence & Government Services'
  | 'Architecture & Planning'
  | 'Finance & Accounting'
  | 'Business Management & Entrepreneurship'
  | 'Economics & Policy'
  | 'Banking, Insurance & FinTech'
  | 'Law & Legal Services'
  | 'Media, Journalism & Communication'
  | 'Education & Teaching'
  | 'Psychology & Counselling'
  | 'Design, Arts & Performing Arts'
  | 'Public Administration & Social Work'
  | 'Hospitality, Travel & Tourism'
  | 'Sports & Fitness';

export interface CareerPathway {
  /** Specific career role */
  role: string;
  /** Brief role description */
  description: string;
  /** Typical UG qualifications in India */
  qualifications: string[];
  /** Relevant entrance exams (Indian context) */
  entranceExams: string[];
  /** Average starting salary range (LPA) */
  salaryRange: string;
  /** Growth outlook: High / Moderate / Stable */
  growthOutlook: 'High' | 'Moderate' | 'Stable';
}

export interface CareerCluster {
  /** Cluster name */
  name: ClusterName;
  /** Display icon */
  icon: string;
  /** Parent stream(s) — some clusters span multiple streams */
  streams: StreamName[];
  /** Brief cluster description */
  description: string;
  /** Aptitude domains that are most relevant (from questionBank) */
  aptitudeFit: AptitudeDomain[];
  /** Preference domains that are most relevant (from questionBank) */
  preferenceFit: PreferenceDomain[];
  /**
   * Typical MBTI pattern for this cluster, drawn from the published Holland-RIASEC
   * ↔ MBTI correspondence (Tieger, Barron-Tieger; Hammer & Macdaid).
   * Use '*' on an axis to mean "either pole works for this cluster".
   */
  mbtiFit?: {
    EI?: 'E' | 'I' | '*';
    SN?: 'S' | 'N' | '*';
    TF?: 'T' | 'F' | '*';
    JP?: 'J' | 'P' | '*';
  };
  /** Key skills needed */
  keySkills: string[];
  /** Class 11-12 recommended subjects */
  recommendedSubjects: string[];
  /** Specific career pathways within this cluster */
  pathways: CareerPathway[];
}

// ────────────────────────────────────────────
// CAREER CLUSTER DATA
// ────────────────────────────────────────────

export const CAREER_CLUSTERS: CareerCluster[] = [

  // ═══════════════════════════════════════════
  //  SCIENCE STREAM CLUSTERS
  // ═══════════════════════════════════════════

  {
    name: 'Engineering & Technology',
    icon: '⚙️',
    streams: ['Science'],
    description:
      'Design, build, and optimize systems — from software and AI to bridges and circuits. The backbone of modern innovation.',
    aptitudeFit: ['Numerical Reasoning', 'Logical Reasoning', 'Spatial Intelligence'],
    preferenceFit: ['Analytical', 'Technical'],
    mbtiFit: { EI: '*', SN: '*', TF: 'T', JP: 'J' },
    keySkills: [
      'Problem-solving',
      'Mathematical modelling',
      'Systems thinking',
      'Programming',
      'Technical communication',
    ],
    recommendedSubjects: ['Physics', 'Chemistry', 'Mathematics'],
    pathways: [
      {
        role: 'Software Developer / Engineer',
        description: 'Build applications, platforms, and systems using code.',
        qualifications: ['B.Tech CSE', 'BCA', 'B.Sc CS'],
        entranceExams: ['JEE Main', 'JEE Advanced', 'BITSAT', 'VITEEE', 'State CETs'],
        salaryRange: '4–12 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Data Scientist / AI Engineer',
        description: 'Extract insights from data using statistics, ML, and AI.',
        qualifications: ['B.Tech CSE/AI', 'B.Sc Data Science', 'B.Stat'],
        entranceExams: ['JEE Main', 'BITSAT', 'ISI Entrance'],
        salaryRange: '6–15 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Mechanical / Manufacturing Engineer',
        description: 'Design and manufacture machines, vehicles, and industrial systems.',
        qualifications: ['B.Tech Mechanical', 'B.E. Manufacturing'],
        entranceExams: ['JEE Main', 'JEE Advanced', 'MHT CET', 'KCET'],
        salaryRange: '3.5–8 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Civil / Structural Engineer',
        description: 'Plan and construct infrastructure — roads, bridges, buildings.',
        qualifications: ['B.Tech Civil', 'B.E. Structural'],
        entranceExams: ['JEE Main', 'JEE Advanced', 'State CETs'],
        salaryRange: '3–7 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Electronics / Embedded Systems Engineer',
        description: 'Design circuits, embedded systems, IoT devices, and VLSI chips.',
        qualifications: ['B.Tech ECE', 'B.Tech EEE'],
        entranceExams: ['JEE Main', 'JEE Advanced', 'BITSAT'],
        salaryRange: '3.5–10 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Cybersecurity Analyst',
        description: 'Protect organizations from digital threats and data breaches.',
        qualifications: ['B.Tech CSE', 'BCA + certifications (CEH, CISSP)'],
        entranceExams: ['JEE Main', 'BITSAT'],
        salaryRange: '5–14 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Robotics / Automation Engineer',
        description: 'Build intelligent machines, drones, and automated systems.',
        qualifications: ['B.Tech Robotics', 'B.Tech Mechatronics'],
        entranceExams: ['JEE Main', 'JEE Advanced', 'BITSAT'],
        salaryRange: '4–10 LPA',
        growthOutlook: 'High',
      },
    ],
  },

  {
    name: 'Medicine & Healthcare',
    icon: '🏥',
    streams: ['Science'],
    description:
      'Diagnose, treat, and prevent illness. Spans clinical practice, surgery, research, allied health, and public health.',
    aptitudeFit: ['Numerical Reasoning', 'Logical Reasoning', 'Verbal Ability'],
    preferenceFit: ['Analytical', 'Social'],
    mbtiFit: { EI: '*', SN: '*', TF: '*', JP: 'J' },
    keySkills: [
      'Attention to detail',
      'Empathy and patient care',
      'Scientific reasoning',
      'Communication',
      'Decision-making under pressure',
    ],
    recommendedSubjects: ['Physics', 'Chemistry', 'Biology'],
    pathways: [
      {
        role: 'Doctor (MBBS / MD)',
        description: 'Diagnose and treat patients; specialize via MD/MS.',
        qualifications: ['MBBS', 'MD / MS (PG)'],
        entranceExams: ['NEET UG', 'NEET PG', 'AIIMS INI-CET'],
        salaryRange: '6–20 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Dentist (BDS)',
        description: 'Oral healthcare, surgery, and preventive dentistry.',
        qualifications: ['BDS', 'MDS (PG)'],
        entranceExams: ['NEET UG'],
        salaryRange: '3–10 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Pharmacist / Pharmaceutical Scientist',
        description: 'Develop, test, and dispense medications.',
        qualifications: ['B.Pharm', 'Pharm.D', 'M.Pharm'],
        entranceExams: ['NEET UG', 'GPAT', 'State-level pharmacy exams'],
        salaryRange: '3–8 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Physiotherapist',
        description: 'Rehabilitate patients through physical therapy and exercise.',
        qualifications: ['BPT', 'MPT'],
        entranceExams: ['State CET', 'University entrances'],
        salaryRange: '2.5–6 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Clinical Researcher',
        description: 'Conduct drug trials and medical research studies.',
        qualifications: ['B.Sc Life Sciences', 'MBBS', 'PG Diploma Clinical Research'],
        entranceExams: ['NEET UG', 'University entrances'],
        salaryRange: '4–10 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Public Health Specialist',
        description: 'Design community health programs and epidemiological studies.',
        qualifications: ['MBBS + MPH', 'B.Sc Public Health'],
        entranceExams: ['NEET UG', 'University entrances'],
        salaryRange: '4–12 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Nursing Professional',
        description: 'Provide patient care in hospitals, clinics, and communities.',
        qualifications: ['B.Sc Nursing', 'GNM'],
        entranceExams: ['State Nursing CET', 'AIIMS Nursing'],
        salaryRange: '2.5–6 LPA',
        growthOutlook: 'Stable',
      },
    ],
  },

  {
    name: 'Pure Sciences & Research',
    icon: '🔬',
    streams: ['Science'],
    description:
      'Investigate fundamental questions in physics, chemistry, biology, and mathematics through research and experimentation.',
    aptitudeFit: ['Numerical Reasoning', 'Logical Reasoning'],
    preferenceFit: ['Analytical', 'Technical'],
    mbtiFit: { EI: 'I', SN: 'N', TF: 'T', JP: '*' },
    keySkills: [
      'Research methodology',
      'Quantitative analysis',
      'Critical thinking',
      'Scientific writing',
      'Lab techniques',
    ],
    recommendedSubjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    pathways: [
      {
        role: 'Research Scientist (Physics / Chemistry / Biology)',
        description: 'Publish research, teach at universities, and push scientific frontiers.',
        qualifications: ['B.Sc + M.Sc + Ph.D', 'Integrated M.Sc (IISc, IISER, NISER)'],
        entranceExams: ['IIT JAM', 'IISER Aptitude Test', 'NEST', 'KVPY (discontinued, see INSPIRE)'],
        salaryRange: '5–15 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Mathematician / Statistician',
        description: 'Develop mathematical models; work in finance, tech, or academia.',
        qualifications: ['B.Sc / B.Stat (ISI)', 'M.Sc / M.Stat'],
        entranceExams: ['ISI Entrance', 'CMI Entrance', 'IIT JAM'],
        salaryRange: '5–18 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Biotechnologist',
        description: 'Apply biology to healthcare, agriculture, and environmental solutions.',
        qualifications: ['B.Tech Biotech', 'B.Sc Biotech + M.Sc'],
        entranceExams: ['JEE Main', 'NEET UG', 'GAT-B'],
        salaryRange: '3–8 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Space Scientist / Astrophysicist',
        description: 'Work at ISRO, observatories, or aerospace organizations.',
        qualifications: ['B.Sc Physics + M.Sc + Ph.D', 'B.Tech Aerospace'],
        entranceExams: ['IIST Admission', 'ISRO Scientist exam', 'IIT JAM'],
        salaryRange: '6–15 LPA',
        growthOutlook: 'Moderate',
      },
    ],
  },

  {
    name: 'Agriculture & Environmental Science',
    icon: '🌱',
    streams: ['Science'],
    description:
      'Sustainable farming, food technology, environmental conservation, and climate science.',
    aptitudeFit: ['Numerical Reasoning', 'Logical Reasoning'],
    preferenceFit: ['Analytical', 'Technical'],
    mbtiFit: { EI: '*', SN: 'S', TF: '*', JP: '*' },
    keySkills: [
      'Fieldwork',
      'Data collection and analysis',
      'Environmental awareness',
      'Biological sciences',
      'Sustainability mindset',
    ],
    recommendedSubjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics (optional)'],
    pathways: [
      {
        role: 'Agricultural Scientist / Agronomist',
        description: 'Improve crop yields, soil health, and farming practices.',
        qualifications: ['B.Sc Agriculture', 'B.Tech Agricultural Engineering'],
        entranceExams: ['ICAR AIEEA', 'State Agriculture CETs'],
        salaryRange: '3–8 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Food Technologist',
        description: 'Develop and test food products, ensure safety standards.',
        qualifications: ['B.Tech Food Technology', 'B.Sc Food Science'],
        entranceExams: ['JEE Main', 'ICAR AIEEA', 'State CETs'],
        salaryRange: '3–7 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Environmental Scientist / Consultant',
        description: 'Assess environmental impact and develop conservation strategies.',
        qualifications: ['B.Sc Environmental Science', 'B.Tech Environmental Engineering'],
        entranceExams: ['University entrances', 'JEE Main'],
        salaryRange: '3–9 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Forestry Officer',
        description: 'Manage forest resources and wildlife conservation.',
        qualifications: ['B.Sc Forestry', 'IFS via UPSC'],
        entranceExams: ['ICAR AIEEA', 'UPSC IFS'],
        salaryRange: '5–12 LPA (Govt)',
        growthOutlook: 'Stable',
      },
    ],
  },

  {
    name: 'Defence & Government Services',
    icon: '🎖️',
    streams: ['Science', 'Commerce', 'Arts / Humanities'],
    description:
      'Serve the nation through armed forces, civil services, or technical government roles.',
    aptitudeFit: ['Logical Reasoning', 'Numerical Reasoning', 'Verbal Ability'],
    preferenceFit: ['Executive', 'Social', 'Conscientiousness'],
    mbtiFit: { EI: '*', SN: 'S', TF: 'T', JP: 'J' },
    keySkills: [
      'Physical fitness',
      'Leadership',
      'Discipline and integrity',
      'Strategic thinking',
      'Communication',
    ],
    recommendedSubjects: ['Any stream — Physics/Maths preferred for technical branches'],
    pathways: [
      {
        role: 'IAS / IPS / IFS (Civil Services)',
        description: 'Administer governance, law enforcement, or foreign affairs.',
        qualifications: ['Any graduation + UPSC CSE'],
        entranceExams: ['UPSC Civil Services Exam'],
        salaryRange: '8–18 LPA (Govt scale + perks)',
        growthOutlook: 'Stable',
      },
      {
        role: 'Defence Officer (Army / Navy / Air Force)',
        description: 'Lead military operations and personnel.',
        qualifications: ['NDA (after 12th)', 'CDS (after graduation)', 'AFCAT'],
        entranceExams: ['NDA', 'CDS', 'AFCAT', 'SSB Interview'],
        salaryRange: '7–15 LPA (Govt scale + perks)',
        growthOutlook: 'Stable',
      },
      {
        role: 'ISRO / DRDO Scientist',
        description: 'Technical research in space, defence, and strategic sectors.',
        qualifications: ['B.Tech / M.Tech / M.Sc'],
        entranceExams: ['ISRO Scientist exam', 'DRDO SET/CEPTAM'],
        salaryRange: '7–16 LPA',
        growthOutlook: 'Stable',
      },
      {
        role: 'SSC / Banking / Railways (Group B/C)',
        description: 'Government administrative and clerical roles.',
        qualifications: ['Graduation (any stream)'],
        entranceExams: ['SSC CGL', 'IBPS PO/Clerk', 'RRB NTPC'],
        salaryRange: '3–7 LPA',
        growthOutlook: 'Stable',
      },
    ],
  },

  {
    name: 'Architecture & Planning',
    icon: '🏛️',
    streams: ['Science'],
    description:
      'Design functional, aesthetic, and sustainable spaces — buildings, cities, and landscapes.',
    aptitudeFit: ['Spatial Intelligence', 'Numerical Reasoning', 'Logical Reasoning'],
    preferenceFit: ['Creative', 'Technical'],
    mbtiFit: { EI: '*', SN: 'N', TF: '*', JP: 'J' },
    keySkills: [
      'Spatial visualization',
      'Sketching and CAD',
      'Structural understanding',
      'Aesthetic sense',
      'Project management',
    ],
    recommendedSubjects: ['Physics', 'Chemistry', 'Mathematics'],
    pathways: [
      {
        role: 'Architect',
        description: 'Design buildings and spaces with structural and aesthetic integrity.',
        qualifications: ['B.Arch (5 years)'],
        entranceExams: ['NATA', 'JEE Main Paper 2'],
        salaryRange: '3–10 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Urban / Town Planner',
        description: 'Plan city layouts, infrastructure, and zoning.',
        qualifications: ['B.Planning', 'B.Arch + M.Plan'],
        entranceExams: ['JEE Main Paper 2', 'NATA'],
        salaryRange: '4–10 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Interior Designer',
        description: 'Design functional and aesthetic interior spaces.',
        qualifications: ['B.Des Interior', 'B.Sc Interior Design'],
        entranceExams: ['NATA', 'NID DAT', 'UCEED'],
        salaryRange: '3–8 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Landscape Architect',
        description: 'Design outdoor spaces — parks, campuses, residential landscapes.',
        qualifications: ['B.Arch + specialization', 'M.L.A (Masters in Landscape Architecture)'],
        entranceExams: ['NATA', 'JEE Main Paper 2'],
        salaryRange: '3–8 LPA',
        growthOutlook: 'Moderate',
      },
    ],
  },

  // ═══════════════════════════════════════════
  //  COMMERCE STREAM CLUSTERS
  // ═══════════════════════════════════════════

  {
    name: 'Finance & Accounting',
    icon: '💰',
    streams: ['Commerce'],
    description:
      'Manage money, audit books, assess risk, and guide financial decisions for individuals and organizations.',
    aptitudeFit: ['Numerical Reasoning', 'Logical Reasoning'],
    preferenceFit: ['Analytical', 'Conscientiousness'],
    mbtiFit: { EI: '*', SN: 'S', TF: 'T', JP: 'J' },
    keySkills: [
      'Numerical accuracy',
      'Financial analysis',
      'Regulatory knowledge',
      'Attention to detail',
      'Excel / Tally proficiency',
    ],
    recommendedSubjects: ['Accountancy', 'Business Studies', 'Mathematics', 'Economics'],
    pathways: [
      {
        role: 'Chartered Accountant (CA)',
        description: 'Audit, taxation, financial advisory, and compliance.',
        qualifications: ['CA Foundation → Intermediate → Final'],
        entranceExams: ['CA Foundation (ICAI)'],
        salaryRange: '7–20 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Cost & Management Accountant (CMA)',
        description: 'Cost analysis, budgeting, and management accounting.',
        qualifications: ['CMA Foundation → Intermediate → Final (ICMAI)'],
        entranceExams: ['CMA Foundation'],
        salaryRange: '5–14 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Company Secretary (CS)',
        description: 'Corporate governance, compliance, and legal advisory.',
        qualifications: ['CS Foundation → Executive → Professional (ICSI)'],
        entranceExams: ['CS Foundation'],
        salaryRange: '5–15 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Financial Analyst / Investment Banker',
        description: 'Analyze markets, manage portfolios, and advise on investments.',
        qualifications: ['B.Com / BBA + MBA Finance', 'CFA'],
        entranceExams: ['CAT', 'XAT', 'GMAT', 'CFA Level I'],
        salaryRange: '6–25 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Tax Consultant',
        description: 'Advise on income tax, GST, and corporate taxation.',
        qualifications: ['B.Com + CA/CMA or LL.B'],
        entranceExams: ['CA Foundation', 'CLAT'],
        salaryRange: '4–12 LPA',
        growthOutlook: 'Stable',
      },
    ],
  },

  {
    name: 'Business Management & Entrepreneurship',
    icon: '🚀',
    streams: ['Commerce'],
    description:
      'Lead organizations, launch ventures, and drive strategy in marketing, operations, and human resources.',
    aptitudeFit: ['Verbal Ability', 'Logical Reasoning', 'Numerical Reasoning'],
    preferenceFit: ['Executive', 'Social'],
    mbtiFit: { EI: 'E', SN: '*', TF: 'T', JP: 'J' },
    keySkills: [
      'Leadership',
      'Strategic thinking',
      'Communication and negotiation',
      'Decision-making',
      'Risk management',
    ],
    recommendedSubjects: ['Business Studies', 'Accountancy', 'Economics', 'Mathematics (optional)'],
    pathways: [
      {
        role: 'Management Consultant',
        description: 'Advise organizations on strategy, operations, and transformation.',
        qualifications: ['BBA / B.Com + MBA'],
        entranceExams: ['CAT', 'XAT', 'NMAT', 'SNAP'],
        salaryRange: '8–25 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Marketing Manager',
        description: 'Plan campaigns, manage brands, and drive customer acquisition.',
        qualifications: ['BBA / B.Com + MBA Marketing'],
        entranceExams: ['CAT', 'XAT', 'IIFT'],
        salaryRange: '5–18 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'HR Manager',
        description: 'Recruit talent, manage culture, and handle employee relations.',
        qualifications: ['BBA + MBA HR', 'BA Psychology + MBA'],
        entranceExams: ['CAT', 'XAT', 'TISS NET'],
        salaryRange: '4–15 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Entrepreneur / Startup Founder',
        description: 'Launch and scale a business venture.',
        qualifications: ['Any degree + domain expertise', 'BBA / MBA preferred'],
        entranceExams: ['Not mandatory — incubator programs (IIM, T-Hub, etc.)'],
        salaryRange: 'Variable (0 to unlimited)',
        growthOutlook: 'High',
      },
      {
        role: 'Supply Chain / Operations Manager',
        description: 'Optimize logistics, inventory, and production processes.',
        qualifications: ['BBA + MBA Operations', 'B.Tech + MBA'],
        entranceExams: ['CAT', 'XAT', 'NMAT'],
        salaryRange: '5–15 LPA',
        growthOutlook: 'Moderate',
      },
    ],
  },

  {
    name: 'Economics & Policy',
    icon: '📈',
    streams: ['Commerce', 'Arts / Humanities'],
    description:
      'Analyze markets, design public policy, and study how societies allocate resources.',
    aptitudeFit: ['Numerical Reasoning', 'Logical Reasoning', 'Verbal Ability'],
    preferenceFit: ['Analytical', 'Verbal', 'Social'],
    mbtiFit: { EI: '*', SN: 'N', TF: 'T', JP: '*' },
    keySkills: [
      'Quantitative analysis',
      'Research and writing',
      'Policy evaluation',
      'Data interpretation',
      'Critical reasoning',
    ],
    recommendedSubjects: ['Economics', 'Mathematics', 'Business Studies / Political Science'],
    pathways: [
      {
        role: 'Economist',
        description: 'Research economic trends and advise governments or firms.',
        qualifications: ['BA / B.Sc Economics + MA/M.Sc Economics'],
        entranceExams: ['DSE Entrance', 'JNU Entrance', 'ISI Entrance'],
        salaryRange: '5–18 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Policy Analyst / Think-Tank Researcher',
        description: 'Evaluate government programs and recommend policy reforms.',
        qualifications: ['BA Economics / Political Science + MPP / MPA'],
        entranceExams: ['University entrances', 'GRE (for abroad)'],
        salaryRange: '4–12 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Actuary',
        description: 'Assess financial risk using mathematical and statistical methods.',
        qualifications: ['B.Sc Actuarial Science', 'B.Stat / B.Math + IAI exams'],
        entranceExams: ['IAI ACET', 'ISI Entrance'],
        salaryRange: '8–30 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Development Sector Professional',
        description: 'Work with NGOs, World Bank, UN agencies on socioeconomic development.',
        qualifications: ['BA Social Science + MA Development Studies'],
        entranceExams: ['TISS NET', 'University entrances'],
        salaryRange: '4–15 LPA',
        growthOutlook: 'Moderate',
      },
    ],
  },

  {
    name: 'Banking, Insurance & FinTech',
    icon: '🏦',
    streams: ['Commerce'],
    description:
      'Operate and innovate in banking systems, insurance products, and financial technology platforms.',
    aptitudeFit: ['Numerical Reasoning', 'Logical Reasoning'],
    preferenceFit: ['Conscientiousness', 'Analytical', 'Technical'],
    mbtiFit: { EI: '*', SN: 'S', TF: 'T', JP: 'J' },
    keySkills: [
      'Financial literacy',
      'Customer relations',
      'Regulatory compliance',
      'Digital payments knowledge',
      'Risk assessment',
    ],
    recommendedSubjects: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics'],
    pathways: [
      {
        role: 'Bank Probationary Officer (PO)',
        description: 'Manage bank branches, handle lending, and customer service.',
        qualifications: ['Any graduation'],
        entranceExams: ['IBPS PO', 'SBI PO', 'RBI Grade B'],
        salaryRange: '5–10 LPA',
        growthOutlook: 'Stable',
      },
      {
        role: 'Insurance Underwriter / Actuarial Analyst',
        description: 'Assess risk for insurance policies and calculate premiums.',
        qualifications: ['B.Com / B.Sc + Actuarial qualifications'],
        entranceExams: ['IAI ACET', 'Company recruitment'],
        salaryRange: '4–12 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'FinTech Product Manager',
        description: 'Build and manage digital payment, lending, or investment platforms.',
        qualifications: ['B.Tech / BBA + MBA', 'B.Com + Product certification'],
        entranceExams: ['CAT', 'Company recruitment'],
        salaryRange: '8–25 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Credit Analyst',
        description: 'Evaluate creditworthiness of individuals and businesses.',
        qualifications: ['B.Com / BBA + MBA Finance'],
        entranceExams: ['IBPS SO', 'Company recruitment'],
        salaryRange: '4–10 LPA',
        growthOutlook: 'Moderate',
      },
    ],
  },

  // ═══════════════════════════════════════════
  //  ARTS / HUMANITIES STREAM CLUSTERS
  // ═══════════════════════════════════════════

  {
    name: 'Law & Legal Services',
    icon: '⚖️',
    streams: ['Arts / Humanities', 'Commerce'],
    description:
      'Advocate for justice, draft contracts, ensure compliance, and litigate in courts.',
    aptitudeFit: ['Verbal Ability', 'Logical Reasoning'],
    preferenceFit: ['Verbal', 'Analytical', 'Executive'],
    mbtiFit: { EI: '*', SN: '*', TF: 'T', JP: 'J' },
    keySkills: [
      'Legal reasoning',
      'Argumentation and debate',
      'Research and drafting',
      'Critical reading',
      'Negotiation',
    ],
    recommendedSubjects: ['Political Science', 'History', 'Economics', 'English'],
    pathways: [
      {
        role: 'Advocate / Litigation Lawyer',
        description: 'Represent clients in court for civil, criminal, or constitutional matters.',
        qualifications: ['BA LLB (5-year integrated)', 'LLB (3-year after graduation)'],
        entranceExams: ['CLAT', 'AILET', 'LSAT India', 'MH CET Law'],
        salaryRange: '3–15 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Corporate Lawyer',
        description: 'Handle M&A, IPO, contracts, and compliance for corporations.',
        qualifications: ['BA LLB + LLM (optional)'],
        entranceExams: ['CLAT', 'AILET'],
        salaryRange: '8–30 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Judicial Services (Judge)',
        description: 'Serve as a judge in district or higher courts.',
        qualifications: ['LLB + State Judicial Service Exam'],
        entranceExams: ['State Judiciary Exams', 'CLAT PG'],
        salaryRange: '8–15 LPA (Govt)',
        growthOutlook: 'Stable',
      },
      {
        role: 'Legal Advisor / Compliance Officer',
        description: 'Ensure organizational compliance with laws and regulations.',
        qualifications: ['BA LLB / CS + LLB'],
        entranceExams: ['CLAT', 'CS Foundation'],
        salaryRange: '5–15 LPA',
        growthOutlook: 'Moderate',
      },
    ],
  },

  {
    name: 'Media, Journalism & Communication',
    icon: '📡',
    streams: ['Arts / Humanities'],
    description:
      'Tell stories, inform the public, and shape narratives through print, digital, TV, and social media.',
    aptitudeFit: ['Verbal Ability', 'Logical Reasoning'],
    preferenceFit: ['Verbal', 'Creative', 'Social'],
    mbtiFit: { EI: 'E', SN: 'N', TF: '*', JP: 'P' },
    keySkills: [
      'Writing and editing',
      'Research and fact-checking',
      'Visual storytelling',
      'Public speaking',
      'Digital media literacy',
    ],
    recommendedSubjects: ['English', 'Political Science', 'History', 'Economics'],
    pathways: [
      {
        role: 'Journalist / Reporter',
        description: 'Investigate and report news across beats (politics, business, sports, etc.).',
        qualifications: ['BA Journalism', 'BA + PG Diploma Mass Communication'],
        entranceExams: ['IIMC Entrance', 'IPU CET', 'XIC Entrance (Mumbai)'],
        salaryRange: '3–10 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Content Writer / Copywriter',
        description: 'Create written content for brands, publications, and digital platforms.',
        qualifications: ['BA English / Journalism', 'Any degree + portfolio'],
        entranceExams: ['Not mandatory — portfolio-based'],
        salaryRange: '3–10 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Public Relations (PR) Manager',
        description: 'Manage media relations, reputation, and corporate communications.',
        qualifications: ['BA + MBA Communications', 'BA Mass Communication'],
        entranceExams: ['University entrances'],
        salaryRange: '4–15 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Digital Media Specialist / Social Media Manager',
        description: 'Manage brand presence across social media and digital channels.',
        qualifications: ['BA + Digital Marketing certifications'],
        entranceExams: ['Not mandatory — skills-based entry'],
        salaryRange: '3–12 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Film / Documentary Director',
        description: 'Direct films, documentaries, or web series.',
        qualifications: ['BA Film Studies', 'FTII', 'Satyajit Ray Film Institute'],
        entranceExams: ['FTII Entrance', 'SRFTI Entrance', 'Whistling Woods'],
        salaryRange: '2–20 LPA (highly variable)',
        growthOutlook: 'Moderate',
      },
    ],
  },

  {
    name: 'Education & Teaching',
    icon: '🎓',
    streams: ['Arts / Humanities', 'Science', 'Commerce'],
    description:
      'Shape the next generation through teaching, curriculum design, edtech, and educational research.',
    aptitudeFit: ['Verbal Ability', 'Logical Reasoning'],
    preferenceFit: ['Social', 'Verbal', 'Conscientiousness'],
    mbtiFit: { EI: '*', SN: '*', TF: 'F', JP: 'J' },
    keySkills: [
      'Communication and patience',
      'Subject mastery',
      'Classroom management',
      'Curriculum design',
      'Mentoring and empathy',
    ],
    recommendedSubjects: ['Any stream — subject specialization matters'],
    pathways: [
      {
        role: 'School Teacher (PGT / TGT)',
        description: 'Teach specific subjects at CBSE/ICSE/State board schools.',
        qualifications: ['BA / B.Sc / B.Com + B.Ed'],
        entranceExams: ['CTET', 'State TET', 'KVS / NVS recruitment'],
        salaryRange: '3–8 LPA',
        growthOutlook: 'Stable',
      },
      {
        role: 'University Professor / Lecturer',
        description: 'Teach at colleges and universities; conduct academic research.',
        qualifications: ['MA / M.Sc / M.Com + NET / SET + Ph.D'],
        entranceExams: ['UGC NET', 'State SET', 'University recruitment'],
        salaryRange: '6–18 LPA',
        growthOutlook: 'Stable',
      },
      {
        role: 'EdTech Product / Content Lead',
        description: 'Design courses and learning experiences for digital education platforms.',
        qualifications: ['Any degree + EdTech experience'],
        entranceExams: ['Not mandatory — skills-based entry'],
        salaryRange: '5–18 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Special Educator',
        description: 'Support children with learning disabilities and special needs.',
        qualifications: ['B.Ed Special Education', 'D.Ed Special Education'],
        entranceExams: ['RCI recognition', 'University entrances'],
        salaryRange: '2.5–6 LPA',
        growthOutlook: 'Moderate',
      },
    ],
  },

  {
    name: 'Psychology & Counselling',
    icon: '🧠',
    streams: ['Arts / Humanities'],
    description:
      'Understand human behaviour, provide therapy, and support mental health and well-being.',
    aptitudeFit: ['Verbal Ability', 'Logical Reasoning'],
    preferenceFit: ['Social', 'Analytical', 'Verbal'],
    mbtiFit: { EI: '*', SN: 'N', TF: 'F', JP: '*' },
    keySkills: [
      'Active listening',
      'Empathy',
      'Research and assessment',
      'Ethical judgment',
      'Communication',
    ],
    recommendedSubjects: ['Psychology', 'English', 'Sociology', 'Biology (optional)'],
    pathways: [
      {
        role: 'Clinical Psychologist',
        description: 'Diagnose and treat mental health disorders through therapy.',
        qualifications: ['BA Psychology + MA Clinical Psychology + M.Phil (RCI)'],
        entranceExams: ['CUET', 'TISS NET', 'University entrances'],
        salaryRange: '4–12 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'School / Career Counsellor',
        description: 'Guide students on academic choices, career planning, and personal issues.',
        qualifications: ['BA Psychology + MA Counselling Psychology / PG Diploma'],
        entranceExams: ['CUET', 'University entrances'],
        salaryRange: '3–8 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Organizational / Industrial Psychologist',
        description: 'Improve workplace productivity, employee well-being, and hiring.',
        qualifications: ['BA Psychology + MA I/O Psychology / MBA HR'],
        entranceExams: ['CUET', 'CAT', 'TISS NET'],
        salaryRange: '5–15 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Neuropsychologist / Cognitive Scientist',
        description: 'Study brain-behaviour relationships and cognitive processes.',
        qualifications: ['BA Psychology + M.Sc Cognitive Science + Ph.D'],
        entranceExams: ['IIT Entrance (Cognitive Science)', 'University entrances'],
        salaryRange: '5–15 LPA',
        growthOutlook: 'Moderate',
      },
    ],
  },

  {
    name: 'Design, Arts & Performing Arts',
    icon: '🎨',
    streams: ['Arts / Humanities'],
    description:
      'Express creativity through visual design, fine arts, music, dance, and theatre.',
    aptitudeFit: ['Spatial Intelligence', 'Verbal Ability'],
    preferenceFit: ['Creative'],
    mbtiFit: { EI: '*', SN: 'N', TF: 'F', JP: 'P' },
    keySkills: [
      'Visual thinking',
      'Creativity and originality',
      'Aesthetic sense',
      'Technical craft (drawing / instruments / body movement)',
      'Storytelling',
    ],
    recommendedSubjects: ['Fine Arts', 'English', 'History', 'Any stream with portfolio'],
    pathways: [
      {
        role: 'Graphic / Visual Designer',
        description: 'Create visual content for brands, products, and media.',
        qualifications: ['B.Des (NID, NIFT)', 'BFA + portfolio'],
        entranceExams: ['NID DAT', 'NIFT Entrance', 'UCEED', 'CEED'],
        salaryRange: '3–12 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'UX / UI Designer',
        description: 'Design intuitive digital experiences for apps and websites.',
        qualifications: ['B.Des Interaction Design', 'BCA + UX certification'],
        entranceExams: ['NID DAT', 'UCEED', 'Portfolio-based'],
        salaryRange: '5–18 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Fashion Designer',
        description: 'Design clothing, accessories, and textile collections.',
        qualifications: ['B.Des Fashion (NIFT)', 'B.Sc Fashion Technology'],
        entranceExams: ['NIFT Entrance', 'NID DAT', 'State design CETs'],
        salaryRange: '3–12 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Animator / VFX Artist',
        description: 'Create animation and visual effects for film, games, and ads.',
        qualifications: ['B.Sc Animation', 'B.Des Animation', 'Diploma courses'],
        entranceExams: ['Entrance tests at schools (Arena, MAAC, etc.)'],
        salaryRange: '3–12 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Musician / Performing Artist',
        description: 'Perform, compose, or teach music, dance, or theatre.',
        qualifications: ['BA Music / Dance / Theatre', 'Diploma + audition'],
        entranceExams: ['Audition-based', 'University entrances'],
        salaryRange: '2–20 LPA (highly variable)',
        growthOutlook: 'Moderate',
      },
    ],
  },

  {
    name: 'Public Administration & Social Work',
    icon: '🤝',
    streams: ['Arts / Humanities'],
    description:
      'Serve communities through governance, welfare programs, NGOs, and social justice initiatives.',
    aptitudeFit: ['Verbal Ability', 'Logical Reasoning'],
    preferenceFit: ['Social', 'Executive', 'Conscientiousness'],
    mbtiFit: { EI: '*', SN: '*', TF: 'F', JP: 'J' },
    keySkills: [
      'Communication and advocacy',
      'Community organizing',
      'Policy understanding',
      'Empathy',
      'Project management',
    ],
    recommendedSubjects: ['Political Science', 'History', 'Sociology', 'Economics'],
    pathways: [
      {
        role: 'Social Worker / NGO Professional',
        description: 'Lead community development, child welfare, or advocacy programs.',
        qualifications: ['BSW', 'BA Sociology + MSW (TISS, Delhi School)'],
        entranceExams: ['TISS NET', 'CUET', 'University entrances'],
        salaryRange: '3–10 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Civil Services (IAS / IPS)',
        description: 'Administer districts, shape policy, and lead public institutions.',
        qualifications: ['Any graduation + UPSC CSE'],
        entranceExams: ['UPSC Civil Services Exam'],
        salaryRange: '8–18 LPA (Govt scale + perks)',
        growthOutlook: 'Stable',
      },
      {
        role: 'Urban / Rural Development Officer',
        description: 'Implement development programs at grassroots level.',
        qualifications: ['BA / MA Rural Development', 'MSW'],
        entranceExams: ['State PSC', 'NABARD Grade A'],
        salaryRange: '4–10 LPA',
        growthOutlook: 'Stable',
      },
    ],
  },

  {
    name: 'Hospitality, Travel & Tourism',
    icon: '✈️',
    streams: ['Arts / Humanities', 'Commerce'],
    description:
      'Manage hotels, plan travel experiences, and serve guests in one of the world\'s largest industries.',
    aptitudeFit: ['Verbal Ability', 'Logical Reasoning'],
    preferenceFit: ['Social', 'Executive'],
    mbtiFit: { EI: 'E', SN: 'S', TF: '*', JP: '*' },
    keySkills: [
      'Customer service',
      'Communication (multilingual preferred)',
      'Event management',
      'Cultural awareness',
      'Operations management',
    ],
    recommendedSubjects: ['Any stream — communication skills matter most'],
    pathways: [
      {
        role: 'Hotel / Hospitality Manager',
        description: 'Manage hotel operations, guest services, and staff.',
        qualifications: ['BHM (Bachelor of Hotel Management)', 'BSc Hospitality'],
        entranceExams: ['NCHMCT JEE', 'State HM entrance'],
        salaryRange: '3–10 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Tour / Travel Manager',
        description: 'Plan and operate tours, manage travel agencies.',
        qualifications: ['BBA Travel & Tourism', 'BA Tourism Studies'],
        entranceExams: ['University entrances'],
        salaryRange: '2.5–8 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Event Manager',
        description: 'Plan and execute corporate events, weddings, and festivals.',
        qualifications: ['BBA / BA + Event Management diploma'],
        entranceExams: ['Not mandatory — portfolio/experience-based'],
        salaryRange: '3–12 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Chef / Culinary Artist',
        description: 'Prepare cuisine in restaurants, hotels, and catering businesses.',
        qualifications: ['BHM', 'Diploma in Culinary Arts'],
        entranceExams: ['NCHMCT JEE', 'Institute entrances'],
        salaryRange: '3–15 LPA',
        growthOutlook: 'Moderate',
      },
    ],
  },

  {
    name: 'Sports & Fitness',
    icon: '🏅',
    streams: ['Arts / Humanities', 'Science'],
    description:
      'Pursue careers in professional sports, coaching, sports science, and fitness management.',
    aptitudeFit: ['Logical Reasoning', 'Spatial Intelligence'],
    preferenceFit: ['Social', 'Technical'],
    mbtiFit: { EI: 'E', SN: 'S', TF: '*', JP: 'P' },
    keySkills: [
      'Physical fitness',
      'Teamwork and discipline',
      'Coaching and mentoring',
      'Sports analytics',
      'Nutrition knowledge',
    ],
    recommendedSubjects: ['Physical Education', 'Biology', 'Any stream'],
    pathways: [
      {
        role: 'Sports Coach / Trainer',
        description: 'Train athletes and teams for competitive sports.',
        qualifications: ['BPEd', 'B.Sc Sports Science', 'NIS Diploma'],
        entranceExams: ['NIS Entrance', 'University entrances', 'SAI recruitment'],
        salaryRange: '2.5–8 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Sports Physiotherapist',
        description: 'Rehabilitate athletes from injuries.',
        qualifications: ['BPT + Sports specialization', 'MPT Sports'],
        entranceExams: ['State CET', 'University entrances'],
        salaryRange: '3–10 LPA',
        growthOutlook: 'Moderate',
      },
      {
        role: 'Sports Manager / Administrator',
        description: 'Manage sports organizations, events, and athlete careers.',
        qualifications: ['BBA + MBA Sports Management'],
        entranceExams: ['CAT', 'University entrances'],
        salaryRange: '4–15 LPA',
        growthOutlook: 'High',
      },
      {
        role: 'Fitness & Wellness Professional',
        description: 'Run fitness studios, personal training, and wellness programs.',
        qualifications: ['Certified Personal Trainer (ACE, ISSA)', 'B.Sc Sports Science'],
        entranceExams: ['Certification exams (ACE, NSCA)'],
        salaryRange: '2–10 LPA',
        growthOutlook: 'High',
      },
    ],
  },
];

// ────────────────────────────────────────────
// HELPER FUNCTIONS
// ────────────────────────────────────────────

/** Get all clusters for a given stream */
export function getClustersByStream(stream: StreamName): CareerCluster[] {
  return CAREER_CLUSTERS.filter((c) => c.streams.includes(stream));
}

/** Get a flat list of all career roles across all clusters */
export function getAllCareerRoles(): { cluster: ClusterName; role: string; stream: StreamName[] }[] {
  const roles: { cluster: ClusterName; role: string; stream: StreamName[] }[] = [];
  for (const cluster of CAREER_CLUSTERS) {
    for (const pathway of cluster.pathways) {
      roles.push({
        cluster: cluster.name,
        role: pathway.role,
        stream: cluster.streams,
      });
    }
  }
  return roles;
}

/** Get total counts for summary */
export function getClusterStats() {
  const totalClusters = CAREER_CLUSTERS.length;
  const totalPathways = CAREER_CLUSTERS.reduce((sum, c) => sum + c.pathways.length, 0);
  const byStream: Record<StreamName, number> = {
    'Science': getClustersByStream('Science').length,
    'Commerce': getClustersByStream('Commerce').length,
    'Arts / Humanities': getClustersByStream('Arts / Humanities').length,
  };
  return { totalClusters, totalPathways, byStream };
}

/**
 * Score a cluster against a student's aptitude + preference results.
 * Returns 0-100 match score (60% aptitude, 40% preference — same weighting as scoringEngine).
 */
export function scoreClusterMatch(
  cluster: CareerCluster,
  aptitudeScores: { domain: string; score: number }[],
  preferenceScores: { domain: string; score: number; maxScore: number }[]
): number {
  const getApt = (domain: string) =>
    aptitudeScores.find((a) => a.domain === domain)?.score || 0;
  const getPref = (domain: string) =>
    preferenceScores.find((p) => p.domain === domain)?.score || 2.5;

  // Average aptitude fit
  const aptAvg =
    cluster.aptitudeFit.length > 0
      ? cluster.aptitudeFit.reduce((sum, d) => sum + getApt(d), 0) / cluster.aptitudeFit.length
      : 50;

  // Average preference fit (normalize from 1-5 to 0-100)
  const prefAvg =
    cluster.preferenceFit.length > 0
      ? cluster.preferenceFit.reduce((sum, d) => sum + getPref(d), 0) /
        cluster.preferenceFit.length
      : 2.5;

  return Math.round(aptAvg * 0.6 + (prefAvg / 5) * 100 * 0.4);
}
