/**
 * REPORT TEMPLATE - Career Assessment PDF Structure
 * 
 * This file defines the 8-page report structure based on scope 271.pdf
 * Each function renders one complete page.
 * 
 * DO NOT modify page order or section structure without updating reference.
 */

export interface ReportData {
  // Student info
  studentName?: string;
  assessmentDate?: string;
  
  // Scores and results
  aptitudeScores?: any[];
  preferenceScores?: any[];
  dominantHemisphere?: string;
  learningStyles?: any;
  
  // Recommendations
  streamRecommendations?: any[];
  courseFamilyRecommendations?: any[];
  careerClusters?: any[];
  
  // Stats
  totalAnswered?: number;
  completionRate?: number;
}

/**
 * PAGE 1: Cover & Executive Summary
 * 
 * Content:
 * - Cover header with branding
 * - Student details card
 * - Executive summary (high-level synthesis)
 * - How to read this report (Aptitude vs Preferences explanation)
 * - Gentle disclaimer
 * 
 * EXCLUDES: Decision tables, stream tables, course tables, career lists
 */
export function renderPage1ExecutiveSummary(data: ReportData): string {
  const studentName = data.studentName || 'Student';
  const assessmentDate = data.assessmentDate || new Date().toLocaleDateString('en-IN');
  
  return `
    <div class="page">
      <!-- SECTION A: Report Header -->
      <div class="header">
        <div class="logo">SY</div>
        <h1>Career Assessment Report</h1>
        <p style="font-size: 1.2em; color: #666;">Srichakra Academy - The School To identify Your Child's Divine Gift!!</p>
        <p style="color: #83C5BE; font-size: 1.1em;">Comprehensive Psychometric Analysis</p>
      </div>

      <div class="student-details">
        <p><strong>Student Name:</strong> ${studentName}</p>
        <p><strong>Assessment Date:</strong> ${assessmentDate}</p>
      </div>

      <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-left: 4px solid #006D77;">
        <!-- SECTION B: What This Report Is -->
        <h2 style="color: #006D77; margin-top: 0;">What This Report Is</h2>
        <p style="line-height: 1.8; font-size: 1.05em;">
          This career assessment is designed to support academic decision-making at critical junctures—specifically 
          at Class 10 (subject stream selection) and Class 12 (course family alignment). It combines objective 
          aptitude testing with self-reported preference data to provide a balanced perspective on a student's 
          cognitive strengths and personal interests. This report offers <strong>guidance</strong>, not final 
          decisions. It is one input among many, including school performance, teacher observations, family context, 
          and the student's own evolving aspirations.
        </p>
      </div>

      <!-- SECTION C: What We Measured -->
      <div style="margin: 30px 0;">
        <h2 style="color: #006D77;">What We Measured</h2>
        <ul style="line-height: 2; font-size: 1.05em;">
          <li>
            <strong>Aptitude (Ability):</strong> 16 objective questions measuring cognitive capabilities across 
            four domains—Numerical Reasoning, Logical Reasoning, Verbal Ability, and Spatial Intelligence. 
            These are performance-based tests with correct and incorrect answers.
          </li>
          <li>
            <strong>Preferences (Interest):</strong> 60 self-reported questions exploring what the student enjoys, 
            values, and feels motivated by. These cover interest patterns (RIASEC model), multiple intelligences, 
            learning styles, and work preferences. There are no "right" answers—only honest reflections.
          </li>
        </ul>
        <p style="font-style: italic; color: #555; margin-top: 15px;">
          <strong>Key Distinction:</strong> Ability reflects what you <em>can do well</em> based on cognitive 
          testing. Interest reflects what you <em>like to do</em> based on self-awareness. The best educational 
          and career pathways align both.
        </p>
      </div>

      <!-- SECTION D: How to Read This Report -->
      <div style="margin: 30px 0; padding: 20px; background: #fff3cd; border-left: 4px solid #E29578;">
        <h2 style="color: #E29578; margin-top: 0;">How to Read This Report</h2>
        <ol style="line-height: 2; font-size: 1.05em;">
          <li>
            <strong>Start with Aptitude (Page 2):</strong> Review the Aptitude Ability Snapshot to understand 
            objectively measured cognitive strengths. This provides evidence-based insight into academic readiness.
          </li>
          <li>
            <strong>Then Review Preferences (Pages 3–4):</strong> Explore the Preference Domain Analysis and 
            Brain Hemisphere & Learning Style sections to understand interests, motivations, and how the student 
            naturally learns.
          </li>
          <li>
            <strong>Use Decision Tables at Key Checkpoints (Pages 5–6):</strong> The Class 10 Subject Stream and 
            Class 12 Course Family sections combine aptitude and preferences to suggest aligned pathways. Read 
            the "Why This Fits You" explanations carefully—they show the reasoning behind recommendations.
          </li>
          <li>
            <strong>Treat Career Clusters as Exploration Only (Page 7):</strong> Career Direction Clusters are 
            provided to broaden awareness, not to choose a final career. Students should explore these families 
            over time, recognizing that careers evolve and interests mature.
          </li>
          <li>
            <strong>Act on Next Steps (Page 8):</strong> Review actionable guidance for students and parents to 
            move forward thoughtfully.
          </li>
        </ol>
      </div>

      <!-- SECTION E: Guidance Disclaimer -->
      <div style="margin: 30px 0; padding: 15px; background: #e9ecef; border-radius: 5px;">
        <h3 style="color: #006D77; margin-top: 0;">Important Guidance</h3>
        <p style="line-height: 1.8; font-size: 1.05em;">
          This report <strong>does not make decisions for the student</strong>. It is a tool to inform conversations 
          between students, parents, teachers, and counselors. Final educational and career choices should consider 
          academic performance, school infrastructure, family circumstances, financial realities, personal values, 
          and guidance from trusted mentors. This assessment is a starting point—not an endpoint.
        </p>
        <p style="line-height: 1.8; font-size: 1.05em; margin-bottom: 0;">
          Students are encouraged to explore, ask questions, and remain open to discovery. Interests and abilities 
          can grow with experience, and paths may change as new opportunities emerge.
        </p>
      </div>
    </div>
  `;
}

/**
 * PAGE 2: Aptitude Ability Snapshot
 * 
 * Content:
 * - Title and intro explaining aptitude as objective academic ability
 * - 5-column aptitude table with readiness bands
 * - Interpretation of what scores mean academically
 * - Guardrail note about aptitude being capacity, not destiny
 * 
 * Data source: 16 objective aptitude questions
 */
export function renderPage2AptitudeSnapshot(data: ReportData): string {
  // Extract aptitude scores from data (assuming they exist in data.aptitudeScores)
  // Format: [{ domain: 'Numerical', score: 75, level: 'Strong', readiness: 'READY NOW', skills: '...' }, ...]
  const aptitudeScores = data.aptitudeScores || [
    { domain: 'Numerical', score: 0, level: 'Developing', readiness: 'WITH DEVELOPMENT', skills: 'Mathematical reasoning, quantitative analysis' },
    { domain: 'Logical', score: 0, level: 'Developing', readiness: 'WITH DEVELOPMENT', skills: 'Problem-solving, pattern recognition, analytical thinking' },
    { domain: 'Verbal', score: 0, level: 'Developing', readiness: 'WITH DEVELOPMENT', skills: 'Language comprehension, written expression, communication' },
    { domain: 'Spatial', score: 0, level: 'Developing', readiness: 'WITH DEVELOPMENT', skills: 'Visual reasoning, design thinking, technical drawing' }
  ];

  // Find strongest and developing areas
  const sortedScores = [...aptitudeScores].sort((a, b) => b.score - a.score);
  const strongestDomain = sortedScores[0];
  const developingDomains = sortedScores.filter(s => s.readiness === 'WITH DEVELOPMENT' || s.readiness === 'EXPLORATORY');

  return `
    <div class="page">
      <!-- SECTION A: Title + Intro -->
      <div class="header">
        <h1>Aptitude Ability Snapshot</h1>
        <p style="font-size: 1.1em; color: #666;">Objective Cognitive Assessment</p>
      </div>

      <div style="margin: 20px 0;">
        <p style="line-height: 1.8; font-size: 1.05em;">
          Aptitude represents objectively measured academic abilities—the cognitive capacities that enable learning, 
          problem-solving, and skill development. Unlike preferences (which reflect interests), aptitude scores are 
          based on performance in standardized tests with correct and incorrect answers. These results provide 
          evidence-based insight into a student's current readiness for different types of academic work.
        </p>
      </div>

      <!-- SECTION B: Core Aptitude Table -->
      <h2 style="color: #006D77; margin-top: 30px;">Cognitive Strengths Profile</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.95em;">
        <thead>
          <tr style="background: #006D77; color: white;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Aptitude Domain</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Score (%)</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Performance Level</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Readiness Band</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Academic Skills Enabled</th>
          </tr>
        </thead>
        <tbody>
          ${aptitudeScores.map((apt: any) => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; border: 1px solid #ddd;"><strong>${apt.domain}</strong></td>
              <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${apt.score}%</td>
              <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${apt.level}</td>
              <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
                <span style="padding: 4px 8px; border-radius: 3px; font-size: 0.85em; font-weight: bold; 
                  background: ${apt.readiness === 'READY NOW' ? '#d4edda' : apt.readiness === 'WITH DEVELOPMENT' ? '#fff3cd' : '#f8d7da'};
                  color: ${apt.readiness === 'READY NOW' ? '#155724' : apt.readiness === 'WITH DEVELOPMENT' ? '#856404' : '#721c24'};">
                  ${apt.readiness}
                </span>
              </td>
              <td style="padding: 12px; border: 1px solid #ddd; font-size: 0.9em;">${apt.skills}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin: 15px 0; padding: 10px; background: #e7f3f5; border-left: 4px solid #006D77; font-size: 0.9em;">
        <p style="margin: 0;"><strong>Readiness Band Key:</strong></p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          <li><strong>READY NOW:</strong> Strong performance indicates current readiness for advanced academic work in this domain</li>
          <li><strong>WITH DEVELOPMENT:</strong> Moderate performance suggests capacity exists but requires focused development</li>
          <li><strong>EXPLORATORY:</strong> Emerging skills indicate early-stage development; approach with support and scaffolding</li>
        </ul>
      </div>

      <!-- SECTION C: Interpretation Block -->
      <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-left: 4px solid #E29578;">
        <h3 style="color: #E29578; margin-top: 0;">What This Means Academically</h3>
        
        ${strongestDomain && strongestDomain.score > 0 ? `
        <p style="line-height: 1.8; font-size: 1.05em;">
          <strong>Strongest Aptitude Area:</strong> Your <strong>${strongestDomain.domain}</strong> aptitude 
          (${strongestDomain.score}%) indicates ${strongestDomain.readiness === 'READY NOW' ? 'strong current readiness' : 'developing capacity'} 
          in ${strongestDomain.skills.toLowerCase()}. This suggests you can handle academic work that requires 
          ${strongestDomain.domain.toLowerCase()} reasoning with ${strongestDomain.readiness === 'READY NOW' ? 'confidence' : 'appropriate support'}.
        </p>
        ` : ''}

        ${developingDomains.length > 0 ? `
        <p style="line-height: 1.8; font-size: 1.05em;">
          <strong>Developing Aptitude Areas:</strong> ${developingDomains.map(d => d.domain).join(', ')} 
          ${developingDomains.length === 1 ? 'shows' : 'show'} emerging or moderate performance. These areas are 
          not weaknesses—they represent opportunities for targeted development. With practice, instruction, and 
          appropriate challenge, these capacities can strengthen significantly.
        </p>
        ` : ''}

        <p style="line-height: 1.8; font-size: 1.05em;">
          <strong>Implications for Academic Load:</strong> Students with strong aptitude in an area can typically 
          handle greater complexity and volume of work in related subjects. Students with developing aptitude benefit 
          from structured support, additional time, and scaffolded instruction. Academic choices should balance 
          areas of strength (for confidence and depth) with areas of development (for growth and challenge).
        </p>
      </div>

      <!-- SECTION D: Guardrail Note -->
      <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 5px;">
        <h4 style="color: #856404; margin-top: 0;">Important Note on Aptitude</h4>
        <p style="line-height: 1.8; font-size: 1.0em; margin-bottom: 0;">
          Aptitude scores reflect <strong>current capacity</strong>, not fixed potential. Cognitive abilities develop 
          throughout adolescence and can be strengthened through practice, quality instruction, and sustained effort. 
          These scores provide a snapshot of where you are now—not a ceiling on where you can go. Development is always 
          possible, and academic performance is influenced by many factors beyond aptitude, including motivation, 
          study habits, teaching quality, and personal circumstances.
        </p>
      </div>
    </div>
  `;
}

// NOTE: Duplicate renderPage2AptitudeSnapshot stub removed.
// The fully implemented version with 5-column table, readiness bands,
// interpretation block, and guardrail note is defined above.

/**
 * PAGE 3: Preference Domain Analysis
 * 
 * Content:
 * - Interest charts (visual representation of RIASEC/MI scores)
 * - Preference explanation (what student enjoys)
 * - Top preference domains list
 * 
 * Data source: 60 self-report preference questions
 * EXCLUDES: Career decisions, course recommendations
 */
export function renderPage3PreferenceAnalysis(data: ReportData): string {
  const preferenceScores = data.preferenceScores || [];

  // RIASEC domains with descriptions
  const riasecDescriptions: Record<string, { label: string; description: string; activities: string }> = {
    Realistic: {
      label: 'Realistic (Doers)',
      description: 'Enjoy hands-on work, building, fixing, and working with tools or machines.',
      activities: 'Lab experiments, sports, crafts, mechanical tasks, outdoor activities'
    },
    Investigative: {
      label: 'Investigative (Thinkers)',
      description: 'Enjoy researching, analyzing data, solving complex problems, and asking questions.',
      activities: 'Science projects, puzzles, reading non-fiction, programming, experiments'
    },
    Artistic: {
      label: 'Artistic (Creators)',
      description: 'Enjoy creative expression through art, music, writing, drama, or design.',
      activities: 'Drawing, painting, creative writing, music, photography, design'
    },
    Social: {
      label: 'Social (Helpers)',
      description: 'Enjoy helping, teaching, counseling, and working collaboratively with people.',
      activities: 'Volunteering, tutoring, group projects, mentoring, community service'
    },
    Enterprising: {
      label: 'Enterprising (Persuaders)',
      description: 'Enjoy leading, persuading, selling ideas, and taking initiative.',
      activities: 'Debates, student council, event organizing, business projects, leadership roles'
    },
    Conventional: {
      label: 'Conventional (Organizers)',
      description: 'Enjoy structured tasks, organizing data, following procedures, and attention to detail.',
      activities: 'Data entry, record-keeping, planning schedules, filing, spreadsheet work'
    }
  };

  // Sort preferences by score descending
  const sortedPrefs = [...preferenceScores].sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
  const topPrefs = sortedPrefs.slice(0, 3);
  const otherPrefs = sortedPrefs.slice(3);

  return `
    <div class="page">
      <!-- SECTION A: Title + Intro -->
      <div class="header">
        <h1>Preference Domain Analysis</h1>
        <p style="font-size: 1.1em; color: #666;">Based on 60 Self-Reported Interest Questions</p>
      </div>

      <div style="margin: 20px 0;">
        <p style="line-height: 1.8; font-size: 1.05em;">
          Preferences reflect what you <strong>enjoy, feel motivated by, and are naturally drawn to</strong>. 
          Unlike aptitude (which measures objective ability), preference scores come from your own honest 
          reflections—there are no right or wrong answers. Understanding your interest profile helps identify 
          academic and career environments where you are most likely to feel engaged, satisfied, and productive.
        </p>
      </div>

      <!-- SECTION B: Interest Profile Table -->
      <h2 style="color: #006D77; margin-top: 30px;">Interest Profile (RIASEC Model)</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.95em;">
        <thead>
          <tr style="background: #006D77; color: white;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Interest Domain</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; width: 100px;">Score</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">What This Means</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Activities You May Enjoy</th>
          </tr>
        </thead>
        <tbody>
          ${sortedPrefs.map((pref: any, index: number) => {
            const info = riasecDescriptions[pref.domain] || { label: pref.domain, description: '', activities: '' };
            const score = pref.score || 0;
            const barWidth = Math.min(score * 20, 100);
            const isTop = index < 3;
            return `
            <tr style="${isTop ? 'background: #f0f9f4;' : ''} border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; border: 1px solid #ddd;">
                <strong>${info.label}</strong>
                ${isTop ? '<span style="color: #28a745; font-size: 0.8em; margin-left: 8px;">★ TOP</span>' : ''}
              </td>
              <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
                <div style="background: #e9ecef; border-radius: 4px; height: 20px; width: 100%;">
                  <div style="background: ${isTop ? '#006D77' : '#83C5BE'}; height: 100%; width: ${barWidth}%; border-radius: 4px; min-width: 20px;"></div>
                </div>
                <span style="font-size: 0.85em; font-weight: bold;">${score.toFixed ? score.toFixed(1) : score}/5.0</span>
              </td>
              <td style="padding: 12px; border: 1px solid #ddd; font-size: 0.9em;">${info.description}</td>
              <td style="padding: 12px; border: 1px solid #ddd; font-size: 0.9em;">${info.activities}</td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- SECTION C: What You Enjoy -->
      <div style="margin: 30px 0; padding: 20px; background: #f0f4f8; border-left: 4px solid #006D77;">
        <h3 style="color: #006D77; margin-top: 0;">What Your Top Interests Tell Us</h3>
        
        ${topPrefs.length > 0 ? `
        <p style="line-height: 1.8; font-size: 1.05em;">
          Your strongest interest areas are <strong>${topPrefs.map((p: any) => p.domain).join(', ')}</strong>. 
          This combination suggests you are most energized by activities that involve 
          ${topPrefs.length >= 2 ? `a blend of ${(riasecDescriptions[topPrefs[0]?.domain]?.description || '').toLowerCase().replace(/\.$/, '')} and ${(riasecDescriptions[topPrefs[1]?.domain]?.description || '').toLowerCase().replace(/\.$/, '')}` : (riasecDescriptions[topPrefs[0]?.domain]?.description || '').toLowerCase()}.
        </p>
        
        <p style="line-height: 1.8; font-size: 1.05em; margin-top: 15px;">
          <strong>Motivation Pattern:</strong> Students with your interest profile tend to thrive in environments 
          that offer ${topPrefs[0]?.domain === 'Realistic' || topPrefs[0]?.domain === 'Investigative' ? 'hands-on challenges and problem-solving opportunities' : 
          topPrefs[0]?.domain === 'Artistic' || topPrefs[0]?.domain === 'Social' ? 'creative expression and meaningful human interaction' : 
          'leadership opportunities and structured goal-setting'}. You are likely to stay engaged longer and perform 
          better when the work connects to your natural interests.
        </p>
        ` : `
        <p style="line-height: 1.8; font-size: 1.05em;">
          Your preference scores will be displayed here once the assessment is completed. These reflect 
          your self-reported interests and motivations across six major domains.
        </p>
        `}
      </div>

      <!-- SECTION D: Aptitude vs Preference Note -->
      <div style="margin: 30px 0; padding: 20px; background: #fff3cd; border-left: 4px solid #E29578;">
        <h3 style="color: #E29578; margin-top: 0;">Understanding Preferences vs Aptitude</h3>
        <p style="line-height: 1.8; font-size: 1.05em;">
          <strong>Preferences show what you enjoy</strong>, not necessarily what you're objectively skilled at. 
          A student may love creative activities (high Artistic preference) but score moderately on spatial 
          intelligence (aptitude). Both insights are valuable:
        </p>
        <ul style="line-height: 1.8; font-size: 1.05em;">
          <li><strong>High Preference + High Aptitude:</strong> Strong natural fit—pursue with confidence.</li>
          <li><strong>High Preference + Low Aptitude:</strong> Passion exists but skills need development. Consider whether you're willing to invest effort in building capacity.</li>
          <li><strong>Low Preference + High Aptitude:</strong> You have ability but may lack motivation. Explore whether exposure could increase interest.</li>
          <li><strong>Low Preference + Low Aptitude:</strong> Not a current priority, but may change over time.</li>
        </ul>
        <p style="line-height: 1.8; font-size: 1.05em; margin-bottom: 0;">
          The best educational and career pathways align <strong>both</strong>—what you can do well AND what 
          you enjoy doing. Pages 5-6 combine these dimensions to produce stream and course recommendations.
        </p>
      </div>
    </div>
  `;
}

/**
 * PAGE 4: Brain Hemisphere & Learning Style
 * 
 * Content:
 * - Brain dominance result (Left/Right/Balanced)
 * - Learning style profile (visual/auditory/kinesthetic)
 * - Five senses learning grid
 * - Study strategy implications
 * 
 * Purpose: Metacognitive insight - how student learns
 */
export function renderPage4BrainAndLearning(data: ReportData): string {
  const dominantHemisphere = data.dominantHemisphere || 'Balanced';
  const learningStyles = data.learningStyles || { primary: 'Visual', secondary: 'Kinesthetic' };
  
  // Determine hemisphere description
  let hemisphereDescription = '';
  let hemisphereTraits = '';
  
  if (dominantHemisphere === 'Left') {
    hemisphereDescription = 'Left-Hemisphere Dominant';
    hemisphereTraits = `
      <p style="line-height: 1.8; font-size: 1.05em;">
        Your thinking style tends to be <strong>logical, sequential, and analytical</strong>. You are likely 
        comfortable with structured, step-by-step approaches to problem-solving. You may prefer working with 
        language, numbers, and systematic reasoning. Left-leaning thinkers often excel in environments that 
        value precision, clear rules, and organized information.
      </p>
    `;
  } else if (dominantHemisphere === 'Right') {
    hemisphereDescription = 'Right-Hemisphere Dominant';
    hemisphereTraits = `
      <p style="line-height: 1.8; font-size: 1.05em;">
        Your thinking style tends to be <strong>creative, holistic, and intuitive</strong>. You are likely 
        comfortable with big-picture thinking and making connections between seemingly unrelated ideas. You may 
        prefer visual, spatial, and imaginative approaches to learning. Right-leaning thinkers often excel in 
        environments that value innovation, synthesis, and open-ended exploration.
      </p>
    `;
  } else {
    hemisphereDescription = 'Balanced Profile';
    hemisphereTraits = `
      <p style="line-height: 1.8; font-size: 1.05em;">
        Your thinking style shows <strong>balance between logical and creative approaches</strong>. You can 
        comfortably shift between analytical problem-solving and imaginative thinking depending on the task. 
        This flexibility allows you to adapt to both structured and open-ended learning environments. Balanced 
        thinkers often excel in roles that require both systematic planning and creative innovation.
      </p>
    `;
  }
  
  // Learning style content
  const primaryStyle = learningStyles.primary || 'Visual';
  const secondaryStyle = learningStyles.secondary || 'Kinesthetic';
  
  let learningStyleDescription = '';
  if (primaryStyle === 'Visual') {
    learningStyleDescription = `
      <p style="line-height: 1.8; font-size: 1.05em;">
        You tend to absorb information best through <strong>images, diagrams, charts, and visual representations</strong>. 
        You may find it helpful to use color-coding, mind maps, and graphic organizers when studying. Watching 
        demonstrations and seeing written instructions may be more effective for you than just listening.
      </p>
    `;
  } else if (primaryStyle === 'Auditory') {
    learningStyleDescription = `
      <p style="line-height: 1.8; font-size: 1.05em;">
        You tend to absorb information best through <strong>listening, discussion, and verbal explanation</strong>. 
        You may benefit from reading aloud, participating in class discussions, and using audio recordings. 
        Hearing concepts explained—whether by a teacher, peer, or podcast—may help you internalize material 
        more effectively than silent reading alone.
      </p>
    `;
  } else {
    learningStyleDescription = `
      <p style="line-height: 1.8; font-size: 1.05em;">
        You tend to absorb information best through <strong>hands-on activities, physical movement, and direct experience</strong>. 
        You may find it helpful to build models, conduct experiments, and engage in active learning tasks. 
        Sitting still for long periods may be challenging—you learn best when you can move, manipulate objects, 
        and apply concepts practically.
      </p>
    `;
  }
  
  return `
    <div class="page">
      <!-- SECTION A: Title + Intro -->
      <div class="header">
        <h1>Brain Hemisphere & Learning Style Insights</h1>
        <p style="font-size: 1.1em; color: #666;">Understanding Your Thinking and Information-Processing Style</p>
      </div>
      
      <div style="margin: 20px 0;">
        <p style="line-height: 1.8; font-size: 1.05em;">
          This page explores <strong>how you think and process information</strong>—not what you know or how 
          intelligent you are. Everyone learns differently, and understanding your natural tendencies can help 
          you study more effectively, communicate better with teachers, and create learning environments that 
          work for you. These insights are descriptive, not prescriptive—they describe patterns, not limitations.
        </p>
      </div>

      <!-- SECTION B: Brain Hemisphere Analysis -->
      <h2 style="color: #006D77; margin-top: 30px;">Brain Hemisphere Analysis</h2>
      
      <div style="margin: 20px 0; padding: 20px; background: #f0f4f8; border-radius: 8px; border-left: 4px solid #006D77;">
        <h3 style="color: #006D77; margin-top: 0;">Your Profile: ${hemisphereDescription}</h3>
        ${hemisphereTraits}
      </div>

      <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 5px;">
        <p style="margin: 0; font-size: 0.95em; color: #856404;">
          <strong>Important:</strong> Hemisphere dominance is not a measure of intelligence or ability. It simply 
          reflects how you tend to approach problems and organize information. Both thinking styles are equally 
          valuable, and most people use both hemispheres in complementary ways throughout the day.
        </p>
      </div>

      <!-- SECTION C: Learning Style Insights -->
      <h2 style="color: #006D77; margin-top: 30px;">Learning Style Insights</h2>
      
      <div style="margin: 20px 0;">
        <h3 style="color: #E29578;">Dominant Learning Style: ${primaryStyle}</h3>
        ${learningStyleDescription}
        
        <p style="line-height: 1.8; font-size: 1.05em; margin-top: 20px;">
          <strong>Supporting Style:</strong> ${secondaryStyle}. While ${primaryStyle.toLowerCase()} learning is your 
          primary preference, you also benefit from ${secondaryStyle.toLowerCase()} approaches. Most effective 
          learning happens when multiple senses are engaged together.
        </p>
      </div>

      <!-- SECTION D: Application Block -->
      <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-left: 4px solid #E29578;">
        <h3 style="color: #E29578; margin-top: 0;">How to Use These Insights in School</h3>
        
        <h4 style="color: #006D77; margin-top: 20px;">For Studying and Revision:</h4>
        <ul style="line-height: 1.8; font-size: 1.05em;">
          ${primaryStyle === 'Visual' ? `
          <li>Use highlighters, color-coded notes, and visual summaries (mind maps, flowcharts)</li>
          <li>Watch educational videos and animations to understand complex concepts</li>
          <li>Create flashcards with images and diagrams</li>
          ` : primaryStyle === 'Auditory' ? `
          <li>Read your notes aloud or record yourself explaining concepts</li>
          <li>Join study groups where you can discuss and debate ideas</li>
          <li>Use podcasts, audiobooks, and verbal mnemonics to remember key information</li>
          ` : `
          <li>Take frequent breaks to move around; study in short, active bursts</li>
          <li>Use physical models, manipulatives, and hands-on experiments when possible</li>
          <li>Walk while reviewing notes or use gestures to remember concepts</li>
          `}
        </ul>

        <h4 style="color: #006D77; margin-top: 20px;">During Classroom Learning:</h4>
        <ul style="line-height: 1.8; font-size: 1.05em;">
          ${primaryStyle === 'Visual' ? `
          <li>Sit where you can clearly see the board and teacher's demonstrations</li>
          <li>Take detailed visual notes during lectures (diagrams, arrows, sketches)</li>
          <li>Ask teachers for written instructions and visual examples</li>
          ` : primaryStyle === 'Auditory' ? `
          <li>Participate actively in class discussions and ask questions out loud</li>
          <li>Pay close attention to verbal explanations and repeat them in your own words</li>
          <li>Request permission to record lectures for later review (if allowed)</li>
          ` : `
          <li>Volunteer for lab work, role-plays, and hands-on demonstrations</li>
          <li>Take notes while standing or doodling to keep your hands engaged</li>
          <li>Ask for practical examples and real-world applications of abstract concepts</li>
          `}
        </ul>

        <h4 style="color: #006D77; margin-top: 20px;">For Parents and Teachers:</h4>
        <ul style="line-height: 1.8; font-size: 1.05em;">
          <li>
            <strong>Respect individual learning preferences:</strong> Don't assume all students learn the same way. 
            Provide multi-sensory instruction when possible.
          </li>
          <li>
            <strong>Create supportive study environments:</strong> ${primaryStyle} learners benefit from spaces 
            optimized for their primary learning mode (e.g., quiet, well-lit areas for visual learners; discussion-based 
            study groups for auditory learners; movement-friendly spaces for kinesthetic learners).
          </li>
          <li>
            <strong>Encourage experimentation:</strong> Learning styles can evolve. Encourage students to try 
            different study techniques and reflect on what works best for them.
          </li>
        </ul>
      </div>
    </div>
  `;
}

/**
 * PAGE 5: Class 10 Subject Stream Readiness
 * 
 * Content:
 * - "Why This Recommendation Fits You" narrative (BEFORE table)
 * - Stream decision table (Science/Commerce/Arts)
 * - Confidence level indicator
 * 
 * Data source: Combines aptitude scores + preference alignment
 * CRITICAL: Explanation comes BEFORE table
 */
export function renderPage5Class10Decision(data: ReportData): string {
  const streamRecommendations = data.streamRecommendations || [];
  const aptitudeScores = data.aptitudeScores || [];
  
  // Extract aptitude scores for reference
  const getAptitudeScore = (domain: string) => {
    const apt = aptitudeScores.find((a: any) => a.domain === domain);
    return apt ? apt.score : 0;
  };
  
  const numericalScore = getAptitudeScore('Numerical Reasoning');
  const logicalScore = getAptitudeScore('Logical Reasoning');
  const verbalScore = getAptitudeScore('Verbal Ability');
  const spatialScore = getAptitudeScore('Spatial Intelligence');
  
  // Generate stream rows (assuming recommendations provide readiness bands)
  const getStreamData = (streamName: string) => {
    const stream = streamRecommendations.find((s: any) => s.stream === streamName);
    return stream || { stream: streamName, readiness: 'WITH DEVELOPMENT', match: 'Moderate', guidance: 'Consider with support' };
  };
  
  const scienceData = getStreamData('Science');
  const commerceData = getStreamData('Commerce');
  const artsData = getStreamData('Arts / Humanities');
  
  return `
    <div class="page">
      <!-- SECTION A: Title + Intro -->
      <div class="header">
        <h1>Class 10 Subject Stream Readiness</h1>
        <p style="font-size: 1.1em; color: #666;">Academic Guidance for Stream Selection</p>
      </div>
      
      <div style="margin: 20px 0;">
        <p style="line-height: 1.8; font-size: 1.05em;">
          This page evaluates your <strong>readiness for each subject stream</strong> based on the aptitude 
          assessment completed earlier. The three primary streams—<strong>Science, Commerce, and Arts/Humanities</strong>—each 
          require different cognitive strengths and impose different academic demands. This analysis helps you 
          understand which streams align well with your current abilities and which may require additional support 
          or development.
        </p>
        <p style="line-height: 1.8; font-size: 1.05em; margin-top: 15px;">
          <strong>Important:</strong> Readiness does NOT mean "permission" or "prohibition." It means understanding 
          the cognitive fit between your strengths and the academic load you'll face. Students can succeed in any 
          stream with the right support, motivation, and effort.
        </p>
      </div>

      <!-- SECTION B: Why This Fits You -->
      <div style="margin: 30px 0; padding: 20px; background: #f0f4f8; border-left: 4px solid #006D77;">
        <h2 style="color: #006D77; margin-top: 0;">Why Aptitude Matters for Stream Selection</h2>
        
        <div style="margin: 15px 0;">
          <h3 style="color: #E29578; font-size: 1.1em;">Science Stream</h3>
          <p style="line-height: 1.8; font-size: 1.05em;">
            The Science stream (Physics, Chemistry, Biology/Mathematics) requires strong <strong>Numerical Reasoning</strong> 
            and <strong>Logical Reasoning</strong> abilities. Students will solve quantitative problems, understand 
            abstract concepts, and work with formulas and proofs daily. <strong>Spatial Intelligence</strong> is 
            particularly valuable for Physics and Chemistry (visualizing molecular structures, force diagrams, etc.). 
            Science subjects are cognitively demanding, with heavy homework loads and complex problem sets. Students 
            with strong aptitude in these areas can handle the pace and depth more comfortably.
          </p>
        </div>

        <div style="margin: 15px 0;">
          <h3 style="color: #E29578; font-size: 1.1em;">Commerce Stream</h3>
          <p style="line-height: 1.8; font-size: 1.05em;">
            The Commerce stream (Accountancy, Business Studies, Economics) requires a combination of <strong>Numerical 
            Reasoning</strong> (for accounting calculations, financial analysis, and statistics), <strong>Verbal Ability</strong> 
            (for understanding case studies, business concepts, and essay-based answers), and <strong>Logical Reasoning</strong> 
            (for economic principles and business problem-solving). Commerce subjects involve both quantitative work 
            and conceptual understanding. Students who can balance numbers with language tend to thrive here.
          </p>
        </div>

        <div style="margin: 15px 0;">
          <h3 style="color: #E29578; font-size: 1.1em;">Arts / Humanities Stream</h3>
          <p style="line-height: 1.8; font-size: 1.05em;">
            The Arts/Humanities stream (History, Political Science, Sociology, Psychology, Literature, etc.) primarily 
            requires strong <strong>Verbal Ability</strong> (reading comprehension, essay writing, articulation of ideas) 
            and <strong>Logical Reasoning</strong> (analyzing arguments, understanding cause-and-effect in history and 
            society, critical thinking). Creative and holistic thinking styles also benefit students in this stream, 
            as subjects often involve interpretation, perspective-taking, and synthesis of diverse ideas. Humanities 
            subjects reward depth of thought, clarity of expression, and intellectual curiosity.
          </p>
        </div>

        <p style="line-height: 1.8; font-size: 1.05em; margin-top: 20px; font-style: italic; color: #555;">
          <strong>Why This Matters:</strong> Choosing a stream aligned with your aptitude strengths allows you to 
          work more efficiently, understand concepts more deeply, and manage academic pressure with greater confidence. 
          When aptitude and stream are mismatched, students often struggle not because they lack intelligence, but 
          because the cognitive demands exceed their current capacity—leading to stress, lower grades, and diminished 
          motivation. Readiness analysis helps prevent this.
        </p>
      </div>

      <!-- SECTION C: Decision Table -->
      <h2 style="color: #006D77; margin-top: 30px;">Stream Readiness Analysis</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.95em;">
        <thead>
          <tr style="background: #006D77; color: white;">
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; width: 15%;">Stream</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; width: 25%;">Key Aptitude Requirements</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; width: 20%;">Student's Aptitude Match</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: center; width: 18%;">Readiness Band</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; width: 22%;">Guidance Note</th>
          </tr>
        </thead>
        <tbody>
          <!-- Science Stream Row -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; color: #006D77;">Science</td>
            <td style="border: 1px solid #ddd; padding: 12px;">
              Numerical Reasoning<br/>
              Logical Reasoning<br/>
              Spatial Intelligence
            </td>
            <td style="border: 1px solid #ddd; padding: 12px;">
              ${scienceData.match || 'Strong / Moderate / Developing'}
            </td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; 
                       color: ${scienceData.readiness === 'READY NOW' ? '#28a745' : scienceData.readiness === 'WITH DEVELOPMENT' ? '#ffc107' : '#6c757d'};">
              ${scienceData.readiness || 'WITH DEVELOPMENT'}
            </td>
            <td style="border: 1px solid #ddd; padding: 12px; font-size: 0.9em;">
              ${scienceData.guidance || 'Review numerical and logical performance. Consider Math vs Biology based on spatial strength.'}
            </td>
          </tr>

          <!-- Commerce Stream Row -->
          <tr style="background: #f9f9f9;">
            <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; color: #006D77;">Commerce</td>
            <td style="border: 1px solid #ddd; padding: 12px;">
              Numerical Reasoning<br/>
              Verbal Ability<br/>
              Logical Reasoning
            </td>
            <td style="border: 1px solid #ddd; padding: 12px;">
              ${commerceData.match || 'Strong / Moderate / Developing'}
            </td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; 
                       color: ${commerceData.readiness === 'READY NOW' ? '#28a745' : commerceData.readiness === 'WITH DEVELOPMENT' ? '#ffc107' : '#6c757d'};">
              ${commerceData.readiness || 'READY NOW'}
            </td>
            <td style="border: 1px solid #ddd; padding: 12px; font-size: 0.9em;">
              ${commerceData.guidance || 'Balanced numerical and verbal skills support business and economics understanding.'}
            </td>
          </tr>

          <!-- Arts/Humanities Stream Row -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; color: #006D77;">Arts / Humanities</td>
            <td style="border: 1px solid #ddd; padding: 12px;">
              Verbal Ability<br/>
              Logical Reasoning<br/>
              Creative Thinking
            </td>
            <td style="border: 1px solid #ddd; padding: 12px;">
              ${artsData.match || 'Strong / Moderate / Developing'}
            </td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; 
                       color: ${artsData.readiness === 'READY NOW' ? '#28a745' : artsData.readiness === 'WITH DEVELOPMENT' ? '#ffc107' : '#6c757d'};">
              ${artsData.readiness || 'READY NOW'}
            </td>
            <td style="border: 1px solid #ddd; padding: 12px; font-size: 0.9em;">
              ${artsData.guidance || 'Strong verbal and reasoning abilities support humanities depth and essay-based assessments.'}
            </td>
          </tr>
        </tbody>
      </table>

      <div style="margin: 20px 0; padding: 15px; background: #e7f3ff; border-radius: 5px; border-left: 4px solid #007bff;">
        <p style="margin: 0; font-size: 0.95em; line-height: 1.7; color: #004085;">
          <strong>Legend:</strong><br/>
          <span style="color: #28a745; font-weight: bold;">● READY NOW</span> – Strong aptitude match; student can handle stream demands comfortably.<br/>
          <span style="color: #ffc107; font-weight: bold;">● WITH DEVELOPMENT</span> – Moderate aptitude match; student can succeed with targeted support, additional practice, or subject selection adjustments.<br/>
          <span style="color: #6c757d; font-weight: bold;">● EXPLORATORY</span> – Developing aptitude match; stream may require significant effort and support; consider carefully.
        </p>
      </div>

      <!-- SECTION D: Guidance Note -->
      <div style="margin: 30px 0; padding: 20px; background: #fff3cd; border-left: 4px solid #E29578;">
        <h3 style="color: #856404; margin-top: 0;">Important Guidance on Readiness</h3>
        
        <p style="line-height: 1.8; font-size: 1.05em;">
          <strong>"WITH DEVELOPMENT" is not a rejection.</strong> It simply means that you may benefit from additional 
          support—such as choosing specific subject combinations (e.g., Science with Biology instead of Math), enrolling 
          in bridge courses, working with tutors, or allowing extra time for homework and revision. Many students succeed 
          in streams marked "WITH DEVELOPMENT" when they have the right systems in place.
        </p>

        <p style="line-height: 1.8; font-size: 1.05em; margin-top: 15px;">
          <strong>Multiple streams may be viable.</strong> If two streams show strong readiness, let your interests, 
          preferences (covered earlier), long-term goals, and school performance guide the final choice. There is rarely 
          a single "correct" answer—only different pathways with different trade-offs.
        </p>

        <p style="line-height: 1.8; font-size: 1.05em; margin-top: 15px;">
          <strong>Final decisions should include school performance.</strong> This assessment measures cognitive aptitude, 
          but academic success also depends on study habits, motivation, teaching quality, and prior knowledge. Always 
          review your Class 9 and 10 marks, teacher recommendations, and internal assessments before finalizing your 
          stream choice. Aptitude is one important input—not the only input.
        </p>
      </div>
    </div>
  `;
}

/**
 * PAGE 6: Class 12 Course Family Alignment
 * 
 * Content:
 * - "Why This Recommendation Fits You" narrative (BEFORE table)
 * - Course family decision table (Engineering/Medical/Business/etc.)
 * - Pathway clarity note (Stream → Course Family progression)
 * 
 * Data source: Builds on stream + adds preference depth
 * CRITICAL: Explanation comes BEFORE table
 */
export function renderPage6Class12Decision(data: ReportData): string {
  const courseFamilyRecommendations = data.courseFamilyRecommendations || [];
  const aptitudeScores = data.aptitudeScores || [];
  const preferenceScores = data.preferenceScores || [];

  // Default course families if none provided
  const defaultFamilies = [
    { family: 'Engineering / Technology', alignment: 'WITH DEVELOPMENT', score: 0, strengths: 'Numerical, Logical, Spatial', guidance: 'Requires strong quantitative and logical base' },
    { family: 'Medicine / Life Sciences', alignment: 'WITH DEVELOPMENT', score: 0, strengths: 'Numerical, Logical, Verbal', guidance: 'Demands analytical precision and verbal communication' },
    { family: 'Business / Commerce', alignment: 'WITH DEVELOPMENT', score: 0, strengths: 'Numerical, Verbal, Logical', guidance: 'Balances quantitative analysis with communication' },
    { family: 'Law / Social Sciences', alignment: 'WITH DEVELOPMENT', score: 0, strengths: 'Verbal, Logical', guidance: 'Requires strong argumentation and critical reading' },
    { family: 'Arts / Design / Media', alignment: 'WITH DEVELOPMENT', score: 0, strengths: 'Spatial, Verbal, Creative', guidance: 'Values visual thinking and creative expression' },
    { family: 'Pure Sciences / Research', alignment: 'WITH DEVELOPMENT', score: 0, strengths: 'Logical, Numerical', guidance: 'Demands deep analytical and investigative thinking' }
  ];

  const families = courseFamilyRecommendations.length > 0 ? courseFamilyRecommendations : defaultFamilies;
  const sortedFamilies = [...families].sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

  return `
    <div class="page">
      <!-- SECTION A: Title + Intro -->
      <div class="header">
        <h1>Class 12 Course Family Alignment</h1>
        <p style="font-size: 1.1em; color: #666;">Post-Secondary Pathway Guidance</p>
      </div>
      
      <div style="margin: 20px 0;">
        <p style="line-height: 1.8; font-size: 1.05em;">
          This page extends your <strong>Class 10 stream readiness</strong> (Page 5) into specific 
          <strong>course family recommendations</strong> for after Class 12. While stream selection determines 
          your broad academic direction, course family alignment helps identify the specific higher-education 
          pathways that best match your cognitive strengths and personal interests.
        </p>
        <p style="line-height: 1.8; font-size: 1.05em; margin-top: 15px;">
          These recommendations combine <strong>60% aptitude scores</strong> (objective ability) with 
          <strong>40% preference alignment</strong> (self-reported interests) to produce a balanced assessment 
          of fit for each course family.
        </p>
      </div>

      <!-- SECTION B: Why This Fits You -->
      <div style="margin: 30px 0; padding: 20px; background: #f0f4f8; border-left: 4px solid #006D77;">
        <h2 style="color: #006D77; margin-top: 0;">Why Course Family Alignment Matters</h2>
        
        <p style="line-height: 1.8; font-size: 1.05em;">
          After Class 12, students enter specialized degree programs that have distinct cognitive demands. 
          <strong>Engineering</strong> requires sustained numerical and spatial reasoning. <strong>Medicine</strong> 
          demands a blend of logical precision and verbal communication. <strong>Business</strong> balances 
          quantitative analysis with persuasion and management. <strong>Law and Social Sciences</strong> rely 
          heavily on verbal reasoning and critical argumentation. <strong>Arts and Design</strong> value spatial 
          creativity and originality. <strong>Pure Sciences</strong> require deep investigative thinking.
        </p>

        <p style="line-height: 1.8; font-size: 1.05em; margin-top: 15px;">
          By matching your aptitude profile and interest pattern to these course families, we can identify which 
          pathways will feel <strong>naturally engaging</strong> (aligned with preferences) and 
          <strong>cognitively manageable</strong> (aligned with aptitude). This reduces the risk of choosing a 
          degree program that leads to frustration, disengagement, or poor academic performance.
        </p>

        <p style="line-height: 1.8; font-size: 1.05em; margin-top: 15px; font-style: italic; color: #555;">
          <strong>The Progression:</strong> Stream (Class 10) → Course Family (Class 12) → Specific Degree → Career. 
          Each step narrows focus while keeping options open. This page helps with the second step.
        </p>
      </div>

      <!-- SECTION C: Course Family Decision Table -->
      <h2 style="color: #006D77; margin-top: 30px;">Course Family Alignment Analysis</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.95em;">
        <thead>
          <tr style="background: #006D77; color: white;">
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; width: 22%;">Course Family</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; width: 22%;">Key Strengths Required</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: center; width: 14%;">Combined Score</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: center; width: 16%;">Alignment Level</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; width: 26%;">Guidance Note</th>
          </tr>
        </thead>
        <tbody>
          ${sortedFamilies.map((cf: any, index: number) => `
          <tr style="${index % 2 === 1 ? 'background: #f9f9f9;' : ''}">
            <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; color: #006D77;">${cf.family}</td>
            <td style="border: 1px solid #ddd; padding: 12px; font-size: 0.9em;">${cf.strengths || '—'}</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; font-size: 1.1em;">
              ${cf.score ? cf.score.toFixed(0) + '%' : '—'}
            </td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;
                       color: ${cf.alignment === 'READY NOW' || cf.alignment === 'STRONG' ? '#28a745' : cf.alignment === 'WITH DEVELOPMENT' || cf.alignment === 'MODERATE' ? '#ffc107' : '#6c757d'};">
              ${cf.alignment || 'WITH DEVELOPMENT'}
            </td>
            <td style="border: 1px solid #ddd; padding: 12px; font-size: 0.9em;">
              ${cf.guidance || 'Review aptitude and preference alignment for this pathway.'}
            </td>
          </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin: 20px 0; padding: 15px; background: #e7f3ff; border-radius: 5px; border-left: 4px solid #007bff;">
        <p style="margin: 0; font-size: 0.95em; line-height: 1.7; color: #004085;">
          <strong>Scoring Method:</strong> Combined Score = (60% Aptitude Match) + (40% Preference Alignment). 
          This weighting reflects that objective ability is a stronger predictor of academic success, while personal 
          interest is essential for sustained motivation and satisfaction.
        </p>
      </div>

      <!-- SECTION D: Pathway Clarity -->
      <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-left: 4px solid #E29578;">
        <h3 style="color: #E29578; margin-top: 0;">Understanding Your Pathway Progression</h3>
        
        <div style="margin: 15px 0; padding: 15px; background: white; border: 2px solid #006D77; border-radius: 8px; text-align: center;">
          <p style="font-size: 1.1em; margin: 0; color: #006D77; font-weight: bold;">
            Class 10 Stream → Class 12 Course Family → Degree Program → Career
          </p>
          <p style="font-size: 0.9em; color: #666; margin: 10px 0 0 0;">
            Each step narrows your focus while keeping adjacent options accessible
          </p>
        </div>

        <p style="line-height: 1.8; font-size: 1.05em; margin-top: 20px;">
          <strong>Multiple course families may be viable.</strong> If your top two or three families show similar 
          scores, you have flexibility. Use your preference profile (Page 3), learning style (Page 4), and real-world 
          exposure to fine-tune your choice. Many students explore across families in their early college years 
          before specializing.
        </p>

        <p style="line-height: 1.8; font-size: 1.05em; margin-top: 15px;">
          <strong>Interests evolve.</strong> The course family that excites you today may shift as you gain 
          new experiences, meet mentors, and discover new fields. This analysis provides a strong starting point, 
          but remain open to adjacent pathways that share similar cognitive demands and interest patterns.
        </p>
      </div>
    </div>
  `;
}

/**
 * PAGE 7: Career Direction Clusters
 * 
 * Content:
 * - STRONG disclaimer (exploration, not final selection)
 * - Career cluster cards (3-5 career families)
 * - Career awareness grid
 * - NO rankings or "best career" language
 * 
 * Purpose: Exploratory mindset, broaden horizons
 */
export function renderPage7CareerClusters(data: ReportData): string {
  const careerClusters = data.careerClusters || [];
  const preferenceScores = data.preferenceScores || [];
  const aptitudeScores = data.aptitudeScores || [];

  // Default career cluster data if none provided
  const defaultClusters = [
    {
      name: 'STEM & Technology',
      icon: '🔬',
      roles: ['Software Developer', 'Data Scientist', 'Civil Engineer', 'Research Scientist', 'Biotechnologist'],
      whyFits: 'Aligns with strong logical reasoning and investigative interests',
      skills: 'Analytical thinking, problem-solving, technical proficiency'
    },
    {
      name: 'Healthcare & Life Sciences',
      icon: '🏥',
      roles: ['Doctor', 'Pharmacist', 'Physiotherapist', 'Clinical Researcher', 'Public Health Specialist'],
      whyFits: 'Combines scientific aptitude with social and helping motivations',
      skills: 'Attention to detail, empathy, scientific reasoning'
    },
    {
      name: 'Business, Finance & Management',
      icon: '📊',
      roles: ['Financial Analyst', 'Marketing Manager', 'Entrepreneur', 'Chartered Accountant', 'HR Manager'],
      whyFits: 'Leverages numerical ability with enterprising and organizational interests',
      skills: 'Quantitative analysis, communication, leadership'
    },
    {
      name: 'Creative Arts & Media',
      icon: '🎨',
      roles: ['Graphic Designer', 'Content Creator', 'Architect', 'Film Director', 'UX Designer'],
      whyFits: 'Builds on spatial intelligence and artistic/creative preferences',
      skills: 'Visual thinking, originality, storytelling, design sense'
    },
    {
      name: 'Social Sciences & Education',
      icon: '📚',
      roles: ['Teacher', 'Psychologist', 'Social Worker', 'Policy Analyst', 'Journalist'],
      whyFits: 'Matches strong verbal ability with social and investigative interests',
      skills: 'Communication, critical thinking, empathy, writing'
    }
  ];

  const clusters = careerClusters.length > 0 ? careerClusters : defaultClusters;

  return `
    <div class="page">
      <!-- SECTION A: Title + Intro -->
      <div class="header">
        <h1>Career Direction Clusters</h1>
        <p style="font-size: 1.1em; color: #666;">Exploration & Awareness</p>
      </div>

      <!-- SECTION B: Strong Disclaimer -->
      <div style="margin: 20px 0; padding: 20px; background: #fff3cd; border: 2px solid #E29578; border-radius: 8px;">
        <h3 style="color: #E29578; margin-top: 0;">Important: This Is Exploration, Not Final Career Selection</h3>
        <p style="line-height: 1.8; font-size: 1.05em;">
          The career clusters below are provided to <strong>broaden your awareness</strong> of professional 
          possibilities—not to select a final career. At 14-16 years of age, career decisions are premature. 
          Your interests, abilities, and the job market will all evolve significantly over the coming years.
        </p>
        <p style="line-height: 1.8; font-size: 1.05em; margin-bottom: 0;">
          Use this section to <strong>explore, ask questions, and discover</strong>. Talk to professionals in 
          these fields, seek internships or shadow experiences, and remain open to careers you haven't yet 
          encountered. The best career choices emerge from exploration, not early narrowing.
        </p>
      </div>

      <!-- SECTION C: Career Cluster Cards -->
      <h2 style="color: #006D77; margin-top: 30px;">Career Families That Align With Your Profile</h2>
      
      <div style="margin: 20px 0;">
        ${clusters.map((cluster: any, index: number) => `
        <div style="margin: 15px 0; padding: 20px; background: ${index % 2 === 0 ? '#f0f4f8' : '#f8f9fa'}; 
                    border-radius: 8px; border-left: 4px solid ${index === 0 ? '#006D77' : index === 1 ? '#E29578' : index === 2 ? '#83C5BE' : index === 3 ? '#FFDDD2' : '#006D77'};">
          <h3 style="color: #006D77; margin-top: 0; font-size: 1.15em;">
            ${cluster.icon || '●'} ${cluster.name}
          </h3>
          <p style="line-height: 1.6; font-size: 0.95em; margin: 8px 0;">
            <strong>Why this may fit:</strong> ${cluster.whyFits}
          </p>
          <p style="line-height: 1.6; font-size: 0.95em; margin: 8px 0;">
            <strong>Key skills involved:</strong> ${cluster.skills}
          </p>
          <p style="line-height: 1.6; font-size: 0.95em; margin: 8px 0 0 0; color: #555;">
            <strong>Example roles:</strong> ${(cluster.roles || []).join(' • ')}
          </p>
        </div>
        `).join('')}
      </div>

      <!-- SECTION D: Career Awareness -->
      <div style="margin: 30px 0; padding: 20px; background: #e7f3f5; border-left: 4px solid #006D77;">
        <h3 style="color: #006D77; margin-top: 0;">Broader Career Awareness</h3>
        <p style="line-height: 1.8; font-size: 1.05em;">
          The career landscape is vast and constantly evolving. Many of the most fulfilling careers combine 
          elements from multiple clusters above. For example:
        </p>
        <ul style="line-height: 1.8; font-size: 1.05em;">
          <li><strong>Health + Technology:</strong> Health informatics, medical device design, telemedicine</li>
          <li><strong>Business + Creative:</strong> Brand management, product design, digital marketing</li>
          <li><strong>Science + Social:</strong> Science communication, environmental policy, public health</li>
          <li><strong>Technology + Arts:</strong> Game development, animation, interactive media design</li>
        </ul>
        <p style="line-height: 1.8; font-size: 1.05em; margin-bottom: 0;">
          New career fields emerge regularly as technology, society, and markets change. Stay curious, 
          build transferable skills, and keep your options open.
        </p>
      </div>

      <!-- SECTION E: No Rankings Note -->
      <div style="margin: 20px 0; padding: 15px; background: #e9ecef; border-radius: 5px;">
        <p style="margin: 0; line-height: 1.8; font-size: 1.0em; font-style: italic; color: #555;">
          <strong>These clusters are not ranked.</strong> No single "best career" exists. Your ideal path 
          will be shaped by your experiences, education, values, relationships, and choices over time. Career 
          satisfaction comes from alignment between what you can do, what you enjoy, and what the world needs—not 
          from following a prescribed list. Treat this as a starting menu for exploration, not a final order.
        </p>
      </div>
    </div>
  `;
}

/**
 * PAGE 8: Action Steps & Guidance
 * 
 * Content:
 * - Next steps for student
 * - Next steps for parents
 * - Consultation offer
 * - Encouragement & closing
 * 
 * Purpose: Actionable, supportive, clear next steps
 */
export function renderPage8ActionSteps(data: ReportData): string {
  const studentName = data.studentName || 'Student';
  const aptitudeScores = data.aptitudeScores || [];
  const preferenceScores = data.preferenceScores || [];

  // Find top aptitude and preference areas for personalized advice
  const topAptitude = [...aptitudeScores].sort((a: any, b: any) => (b.score || 0) - (a.score || 0)).slice(0, 2);
  const topPreference = [...preferenceScores].sort((a: any, b: any) => (b.score || 0) - (a.score || 0)).slice(0, 2);

  return `
    <div class="page">
      <!-- SECTION A: Title + Intro -->
      <div class="header">
        <h1>Action Steps & Guidance</h1>
        <p style="font-size: 1.1em; color: #666;">Moving Forward with Purpose</p>
      </div>

      <div style="margin: 20px 0;">
        <p style="line-height: 1.8; font-size: 1.05em;">
          This final page translates your assessment results into <strong>concrete, actionable steps</strong> 
          for students, parents, and families. The goal is not to rush decisions but to begin thoughtful 
          exploration, build on strengths, and prepare for upcoming academic milestones.
        </p>
      </div>

      <!-- SECTION B: Student Actions -->
      <div style="margin: 30px 0; padding: 20px; background: #f0f4f8; border-left: 4px solid #006D77;">
        <h2 style="color: #006D77; margin-top: 0;">Next Steps for ${studentName}</h2>
        
        <ol style="line-height: 1.8; font-size: 1.05em;">
          <li style="margin-bottom: 12px;">
            <strong>Review Your Strengths:</strong> Re-read Pages 2-3 of this report. Identify the 2-3 areas 
            where you scored highest in both aptitude and preferences. These are your natural starting points 
            for academic and career exploration.
          </li>
          <li style="margin-bottom: 12px;">
            <strong>Have a Conversation:</strong> Sit down with a parent, teacher, or school counselor and discuss 
            your results. Share what surprised you and what confirmed your expectations. Ask for their perspective 
            on how your results match what they observe in your daily academic work.
          </li>
          <li style="margin-bottom: 12px;">
            <strong>Explore Actively:</strong> Pick one career cluster from Page 7 that interests you. Research 
            it online, watch videos of professionals in that field, or ask to shadow someone who works in that 
            area. Real-world exposure is the best test of genuine interest.
          </li>
          <li style="margin-bottom: 12px;">
            <strong>Build Developing Areas:</strong> If any aptitude area is marked "WITH DEVELOPMENT," create a 
            focused 30-day improvement plan. This might include extra practice problems, online courses, or 
            targeted tutoring. Growth is always possible with consistent effort.
          </li>
          <li style="margin-bottom: 12px;">
            <strong>Reflect and Journal:</strong> Write down your thoughts about the following questions:
            <ul style="margin-top: 8px;">
              <li>What activities make me lose track of time?</li>
              <li>What school subjects do I genuinely look forward to?</li>
              <li>What kind of problems do I enjoy solving?</li>
              <li>What would I do if I knew I couldn't fail?</li>
            </ul>
          </li>
        </ol>
      </div>

      <!-- SECTION C: Parent Actions -->
      <div style="margin: 30px 0; padding: 20px; background: #fff3cd; border-left: 4px solid #E29578;">
        <h2 style="color: #E29578; margin-top: 0;">Guidance for Parents</h2>
        
        <h4 style="color: #006D77; margin-top: 20px;">How to Support Your Child:</h4>
        <ul style="line-height: 1.8; font-size: 1.05em;">
          <li>
            <strong>Listen first, advise second.</strong> Ask your child what they found interesting in this report. 
            Let them express their own reactions before sharing your perspective.
          </li>
          <li>
            <strong>Focus on strengths, not gaps.</strong> Celebrate areas of strong readiness. Frame developing 
            areas as growth opportunities, not deficiencies.
          </li>
          <li>
            <strong>Facilitate exposure, not pressure.</strong> Help your child access workshops, summer programs, 
            mentorships, or career talks in their areas of interest. Avoid forcing specific career paths.
          </li>
          <li>
            <strong>Stay open to surprises.</strong> Your child's interests may differ from your expectations. 
            Research shows that students perform best when they pursue pathways aligned with their own strengths 
            and motivations—not their parents' aspirations.
          </li>
        </ul>

        <h4 style="color: #006D77; margin-top: 20px;">Conversation Starters:</h4>
        <ul style="line-height: 1.8; font-size: 1.05em;">
          <li>"What did you find most surprising about your results?"</li>
          <li>"Which career clusters would you like to explore further?"</li>
          <li>"How can we work together to build on your developing areas?"</li>
          <li>"Is there anything in this report you disagree with or want to discuss?"</li>
        </ul>

        <h4 style="color: #006D77; margin-top: 20px;">What to Avoid:</h4>
        <ul style="line-height: 1.8; font-size: 1.05em;">
          <li>Comparing results with siblings or peers</li>
          <li>Using results to pressure specific stream or career choices</li>
          <li>Dismissing interests that don't align with traditional expectations</li>
          <li>Treating this report as a final verdict rather than a conversation starter</li>
        </ul>
      </div>

      <!-- SECTION D: Consultation & Support -->
      <div style="margin: 30px 0; padding: 20px; background: #e7f3f5; border-radius: 8px; border: 1px solid #006D77;">
        <h2 style="color: #006D77; margin-top: 0;">Consultation & Support</h2>
        
        <p style="line-height: 1.8; font-size: 1.05em;">
          <strong>Srichakra Academy</strong> offers follow-up consultation services to help families 
          interpret this report, discuss specific questions, and create personalized development plans.
        </p>
        
        <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 5px;">
          <p style="margin: 5px 0; font-size: 1.05em;"><strong>Available Services:</strong></p>
          <ul style="line-height: 1.8; font-size: 1.0em;">
            <li>One-on-one career counseling sessions</li>
            <li>Stream selection guidance for Class 10 students</li>
            <li>Course family exploration workshops for Class 12 students</li>
            <li>Parent-student joint consultation sessions</li>
            <li>Aptitude development planning and follow-up assessments</li>
          </ul>
        </div>

        <p style="line-height: 1.8; font-size: 1.05em; margin-bottom: 0;">
          To schedule a consultation, visit <a href="https://srichakraacademy.org/contact" style="color: #006D77; font-weight: bold;">srichakraacademy.org/contact</a> or visit Srichakra Academy directly.
        </p>
      </div>

      <!-- SECTION E: Closing -->
      <div style="margin: 30px 0; padding: 25px; background: #f8f9fa; border-radius: 8px; text-align: center;">
        <h2 style="color: #006D77; margin-top: 0;">Your Journey Ahead</h2>
        
        <p style="line-height: 1.8; font-size: 1.1em; max-width: 600px; margin: 0 auto;">
          Every student has a unique combination of abilities, interests, and potential. This assessment has 
          illuminated some of your strengths and opened doors to exploration. Remember:
        </p>
        
        <div style="margin: 20px auto; max-width: 500px; text-align: left;">
          <p style="line-height: 1.8; font-size: 1.05em; color: #006D77;">"Your abilities can grow with effort and practice."</p>
          <p style="line-height: 1.8; font-size: 1.05em; color: #E29578;">"Your interests will deepen with exposure and experience."</p>
          <p style="line-height: 1.8; font-size: 1.05em; color: #006D77;">"Your path is your own—and it doesn't have to be decided today."</p>
        </div>

        <p style="line-height: 1.8; font-size: 1.05em; color: #666; margin-top: 20px;">
          The best decisions are made with information, reflection, and time. You now have the information. 
          Take time for reflection. And always remember that your journey is just beginning.
        </p>
      </div>

      <!-- SECTION F: Footer -->
      <div style="margin-top: 30px; padding: 20px; background: #006D77; color: white; border-radius: 8px; text-align: center;">
        <h3 style="margin-top: 0; color: white;">Thank You for Taking the Assessment</h3>
        <p style="margin: 10px 0; font-size: 1.0em;">
          This report is generated by <strong>Srichakra Academy's</strong> comprehensive career assessment system.
        </p>
        <p style="margin: 5px 0; font-size: 0.95em; color: #83C5BE;">
          Srichakra Academy — The School To Identify Your Child's Divine Gift!!
        </p>
        <p style="margin: 10px 0 0 0; font-size: 0.85em; color: #ccc;">
          For questions or consultation, visit <a href="https://srichakraacademy.org/contact" style="color: #83C5BE;">srichakraacademy.org/contact</a>
        </p>
      </div>
    </div>
  `;
}

/**
 * MASTER REPORT GENERATOR
 * Combines all pages in correct order
 */
export function generateFullReport(data: ReportData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Career Assessment Report - ${data.studentName || 'Student'}</title>
        <style>
          /* ===== GLOBAL RESET & BASE ===== */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
            background: #fff;
            font-size: 14px;
          }

          /* ===== PAGE LAYOUT FOR PDF ===== */
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 25mm 20mm;
            margin: 0 auto;
            background: white;
            position: relative;
          }

          @media print {
            .page {
              page-break-after: always;
              padding: 20mm 18mm;
              margin: 0;
            }
            .page:last-child {
              page-break-after: auto;
            }
          }

          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          /* ===== TYPOGRAPHY ===== */
          h1 {
            font-size: 1.8em;
            color: #006D77;
            margin-bottom: 10px;
          }

          h2 {
            font-size: 1.3em;
            color: #006D77;
            margin-bottom: 10px;
            margin-top: 20px;
          }

          h3 {
            font-size: 1.1em;
            color: #333;
            margin-bottom: 8px;
            margin-top: 15px;
          }

          h4 {
            font-size: 1.0em;
            color: #333;
            margin-bottom: 6px;
            margin-top: 12px;
          }

          p {
            margin-bottom: 10px;
          }

          /* ===== HEADER BRANDING ===== */
          .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #006D77;
          }

          .header .logo {
            display: inline-block;
            width: 60px;
            height: 60px;
            background: #006D77;
            color: white;
            font-size: 1.5em;
            font-weight: bold;
            line-height: 60px;
            text-align: center;
            border-radius: 50%;
            margin-bottom: 10px;
          }

          /* ===== STUDENT DETAILS ===== */
          .student-details {
            background: #f0f4f8;
            padding: 15px 20px;
            border-radius: 8px;
            margin: 15px 0;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .student-details p {
            margin: 5px 15px 5px 0;
          }

          /* ===== TABLE STYLES ===== */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 0.95em;
          }

          table thead tr {
            background: #006D77;
            color: white;
          }

          table th {
            padding: 10px 12px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: 600;
          }

          table td {
            padding: 10px 12px;
            border: 1px solid #ddd;
            vertical-align: top;
          }

          table tbody tr:nth-child(even) {
            background: #f9f9f9;
          }

          /* ===== UTILITY CLASSES ===== */
          .note {
            padding: 12px 15px;
            background: #e9ecef;
            border-radius: 5px;
            margin: 15px 0;
            font-size: 0.95em;
          }

          ul, ol {
            padding-left: 25px;
            margin: 10px 0;
          }

          li {
            margin-bottom: 5px;
          }

          strong {
            color: #222;
          }

          em {
            color: #555;
          }

          /* ===== PRINT OPTIMIZATIONS ===== */
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            table { page-break-inside: avoid; }
            .header { page-break-after: avoid; }
            h2, h3 { page-break-after: avoid; }
            div[style*="background"] {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        ${renderPage1ExecutiveSummary(data)}
        ${renderPage2AptitudeSnapshot(data)}
        ${renderPage3PreferenceAnalysis(data)}
        ${renderPage4BrainAndLearning(data)}
        ${renderPage5Class10Decision(data)}
        ${renderPage6Class12Decision(data)}
        ${renderPage7CareerClusters(data)}
        ${renderPage8ActionSteps(data)}
      </body>
    </html>
  `;
}
