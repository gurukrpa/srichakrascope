/**
 * METHODOLOGY HANDBOOK — counsellor training / L&D reference.
 *
 * Standalone download page. Lives at /methodology-handbook.
 * Explains every measurement model used by the SCOPE assessment, with
 * citations and recommended further reading. No student data — this is
 * reference material for the counselling team to study before sessions.
 */

import React, { useCallback, useRef } from 'react';

const HANDBOOK_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>SCOPE Methodology &amp; References Handbook</title>
<style>
  @page { size: A4 portrait; margin: 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #222; font-size: 12px; line-height: 1.55; padding: 16mm; max-width: 210mm; margin: 0 auto; }
  h1 { color: #006D77; font-size: 1.7em; margin-bottom: 4px; }
  .sub { color: #555; font-size: 0.95em; margin-bottom: 6px; }
  h2 { color: #006D77; font-size: 1.15em; margin: 18px 0 6px; border-bottom: 2px solid #006D77; padding-bottom: 3px; }
  h3 { color: #333; font-size: 1.0em; margin: 12px 0 4px; }
  h4 { color: #444; font-size: 0.92em; margin: 8px 0 3px; text-transform: uppercase; letter-spacing: 0.5px; }
  p { margin: 4px 0; }
  ul, ol { margin: 4px 0 6px 22px; }
  li { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 11px; }
  th { background: #006D77; color: #fff; padding: 5px 8px; text-align: left; }
  td { padding: 5px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
  .callout { padding: 8px 12px; background: #fff8e1; border-left: 3px solid #E29578; margin: 6px 0; }
  .ref { padding: 6px 10px; background: #f0f4f8; border-left: 3px solid #006D77; margin: 4px 0; font-size: 11px; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 10px; color: #fff; font-weight: bold; font-size: 10px; }
  .pill-blue { background: #006D77; }
  .pill-amber { background: #E29578; }
  .formula { font-family: 'Consolas', 'Courier New', monospace; background: #f5f5f5; padding: 6px 10px; border-radius: 3px; font-size: 11px; margin: 4px 0; display: inline-block; }
  .toc { background: #f8f9fa; padding: 10px 16px; border-radius: 4px; margin: 8px 0 14px; }
  .toc ol { margin-left: 18px; }
  .footer { margin-top: 22px; padding-top: 8px; border-top: 1px solid #ccc; font-size: 10px; color: #777; font-style: italic; }
  .page-break { page-break-before: always; }
  @media print { body { padding: 0; max-width: none; } .no-print { display: none; } }
  .print-btn { position: fixed; top: 10px; right: 10px; padding: 8px 14px; background: #006D77; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; z-index: 100; }
</style></head><body>
  <button class="print-btn no-print" onclick="window.print()">&#x1f5a8;&#xfe0f; Save as PDF</button>

  <h1>SCOPE Methodology &amp; References Handbook</h1>
  <div class="sub">Counsellor Training &middot; Srichakra Academy &middot; Internal Use</div>
  <div class="callout">
    <strong>Purpose.</strong> This document explains every measurement model behind the SCOPE Career Assessment
    so counsellors can answer student/parent questions confidently and identify the limits of the report.
    Read this once end-to-end before your first session, then keep it as a reference.
  </div>

  <div class="toc">
    <strong>Contents</strong>
    <ol>
      <li>What SCOPE is &mdash; and isn&rsquo;t</li>
      <li>Aptitude: 2-Parameter Logistic IRT</li>
      <li>Performance bands: Wechsler-style z-cuts</li>
      <li>Interests: RIASEC (Holland Codes)</li>
      <li>Personality: MBTI Step-I&ndash;style 16-item</li>
      <li>Multiple Intelligences (Gardner)</li>
      <li>Holland &harr; MBTI correspondence (the &plusmn;5 bonus)</li>
      <li>Validity controls: consistency + attention checks</li>
      <li>Tie-zone rule &amp; LOW INFO flag</li>
      <li>Limitations &amp; what SCOPE does not measure</li>
      <li>Recommended further reading</li>
      <li>Glossary</li>
    </ol>
  </div>

  <h2>1. What SCOPE Is &mdash; and Isn&rsquo;t</h2>
  <p>SCOPE (<strong>S</strong>tudent <strong>C</strong>areer &amp; <strong>O</strong>pportunity <strong>P</strong>athway <strong>E</strong>valuation)
  is a multi-trait psychometric report designed for Indian students aged 13&ndash;18 making Class 10 stream
  and Class 12 course decisions. It triangulates four signals: <strong>ability</strong> (IRT aptitude),
  <strong>interest</strong> (RIASEC), <strong>personality</strong> (MBTI-style), and <strong>self-image</strong>
  (Gardner MI), plus two validity layers.</p>
  <p><strong>It is not</strong> a clinical diagnostic, an IQ test, a personality disorder screen, or a job-placement
  algorithm. It is a <em>conversation scaffold</em>. The numbers exist so the student and counsellor can argue
  productively about them.</p>

  <h2>2. Aptitude: 2-Parameter Logistic IRT</h2>
  <p>SCOPE scores four aptitude domains (Numerical, Logical, Verbal, Spatial) using a <strong>2-Parameter Logistic
  (2PL) Item Response Theory</strong> model. Unlike classical &ldquo;% correct&rdquo; scoring, IRT estimates the
  student&rsquo;s latent ability (&theta;) from the difficulty (b) and discrimination (a) of each item.</p>
  <h4>The 2PL model</h4>
  <div class="formula">P(correct | &theta;) = 1 / (1 + e<sup>&minus;a(&theta; &minus; b)</sup>)</div>
  <p>Where <em>a</em> = item discrimination (steepness of the curve, how sharply the item separates high vs low
  ability students) and <em>b</em> = item difficulty (the &theta; at which a student has a 50% chance of getting
  it right).</p>
  <h4>Why IRT instead of raw scores</h4>
  <ul>
    <li><strong>Sample-free difficulty.</strong> An item&rsquo;s b doesn&rsquo;t change when the cohort changes.</li>
    <li><strong>Person-free ability.</strong> Two students who answered different items can be compared on the
    same &theta; scale.</li>
    <li><strong>Information-weighted precision.</strong> A confidence interval is computed per student from the
    <em>Fisher Information</em> contributed by the items they actually answered.</li>
  </ul>
  <h4>Standard error &amp; the 95% CI</h4>
  <div class="formula">SE(&theta;) = 1 / &radic;I(&theta;) &nbsp;&nbsp;|&nbsp;&nbsp; CI<sub>95</sub> = &theta; &plusmn; 1.96 &times; SE(&theta;)</div>
  <p>Where I(&theta;) = &sum;<sub>i</sub> a<sub>i</sub><sup>2</sup> &middot; P<sub>i</sub>(&theta;) &middot; (1&minus;P<sub>i</sub>(&theta;)).
  This is the math behind every &ldquo;score = 72 (CI 64&ndash;80)&rdquo; you see on the report.</p>
  <div class="ref">
    <strong>References.</strong>
    Birnbaum, A. (1968). <em>Some latent trait models</em>. In Lord &amp; Novick, <em>Statistical Theories of Mental Test Scores</em>. Addison-Wesley.<br>
    Embretson, S. E., &amp; Reise, S. P. (2000). <em>Item Response Theory for Psychologists</em>. Lawrence Erlbaum.<br>
    de Ayala, R. J. (2009). <em>The Theory and Practice of Item Response Theory</em>. Guilford Press.
  </div>

  <h2>3. Performance Bands: Wechsler-Style z-Cuts</h2>
  <p>The qualitative labels (Below Average / Average / Above Average / Superior) are tied to the same
  percentile cuts used by the <strong>Wechsler Adult Intelligence Scale (WAIS-IV)</strong> and the
  <strong>Wechsler Intelligence Scale for Children (WISC-V)</strong>:</p>
  <table>
    <thead><tr><th>Percentile</th><th>z-score</th><th>SCOPE label</th><th>Wechsler classification</th></tr></thead>
    <tbody>
      <tr><td>&ge; 98th</td><td>&ge; +2.0</td><td>Superior</td><td>Very Superior</td></tr>
      <tr><td>84th&ndash;97th</td><td>+1.0 to +2.0</td><td>Above Average</td><td>High Average &mdash; Superior</td></tr>
      <tr><td>50th&ndash;83rd</td><td>0 to +1.0</td><td>Average</td><td>Average</td></tr>
      <tr><td>&lt; 50th</td><td>&lt; 0</td><td>Developing</td><td>Low Average &mdash; Borderline</td></tr>
    </tbody>
  </table>
  <div class="ref">
    <strong>References.</strong>
    Wechsler, D. (2008). <em>WAIS-IV Administration and Scoring Manual</em>. Pearson.<br>
    Wechsler, D. (2014). <em>WISC-V Technical and Interpretive Manual</em>. Pearson.<br>
    Sattler, J. M. (2018). <em>Assessment of Children: Cognitive Foundations</em> (6th ed.). Sattler Publishing.
  </div>

  <div class="page-break"></div>

  <h2>4. Interests: RIASEC (Holland Codes)</h2>
  <p>The 60-item interest inventory maps onto John Holland&rsquo;s six vocational-personality dimensions:
  <strong>R</strong>ealistic, <strong>I</strong>nvestigative, <strong>A</strong>rtistic, <strong>S</strong>ocial,
  <strong>E</strong>nterprising, <strong>C</strong>onventional. Each item is a 5-point Likert (1 = strong dislike
  &rarr; 5 = strong like). The dimensions are arranged in a <em>hexagonal model</em> &mdash; adjacent types
  correlate more highly than opposites.</p>
  <p>SCOPE reports the raw 1&ndash;5 mean per dimension and feeds the top three (the &ldquo;Holland code,&rdquo;
  e.g. <em>IAS</em>) into the stream, course-family, and cluster scorers.</p>
  <div class="ref">
    <strong>References.</strong>
    Holland, J. L. (1997). <em>Making Vocational Choices: A Theory of Vocational Personalities and Work Environments</em> (3rd ed.). Psychological Assessment Resources.<br>
    Nauta, M. M. (2010). The development, evolution, and status of Holland&rsquo;s theory of vocational personalities. <em>Journal of Counseling Psychology</em>, 57(1), 11&ndash;22.<br>
    O*NET Interest Profiler &mdash; <em>onetcenter.org/IP.html</em> (US Dept. of Labor implementation of RIASEC).
  </div>

  <h2>5. Personality: MBTI Step-I&ndash;Style 16-Item</h2>
  <p>Four 4-item forced-Likert mini-scales, one per dichotomy: <strong>E&ndash;I</strong> (Extraversion&ndash;Introversion),
  <strong>S&ndash;N</strong> (Sensing&ndash;Intuition), <strong>T&ndash;F</strong> (Thinking&ndash;Feeling),
  <strong>J&ndash;P</strong> (Judging&ndash;Perceiving). The output is a 4-letter type (e.g. <em>INTJ</em>) plus a
  50&ndash;100 strength score per axis (50 = balanced; 100 = strong leaning).</p>
  <div class="callout">
    <strong>Honest caveat.</strong> SCOPE&rsquo;s 16 items are <em>not</em> the full 93-item MBTI Form M
    instrument. We use the MBTI <em>framework</em> (the four dichotomies) but the short form has lower
    test-retest reliability than the full instrument. This is why the per-cluster MBTI bonus is hard-capped
    at &plusmn;5 points &mdash; personality <em>supports</em> the decision, it never <em>decides</em> it.
  </div>
  <div class="ref">
    <strong>References.</strong>
    Myers, I. B., McCaulley, M. H., Quenk, N. L., &amp; Hammer, A. L. (1998/2018). <em>MBTI Manual: A Guide to the Development and Use of the Myers-Briggs Type Indicator</em> (3rd / 4th eds.). CPP.<br>
    Pittenger, D. J. (2005). Cautionary comments regarding the Myers-Briggs Type Indicator. <em>Consulting Psychology Journal</em>, 57(3), 210&ndash;221. <em>(critical perspective &mdash; read this)</em>.
  </div>

  <h2>6. Multiple Intelligences (Gardner)</h2>
  <p>Eight self-report scales: Linguistic, Logical-Mathematical, Spatial, Bodily-Kinesthetic, Musical,
  Interpersonal, Intrapersonal, Naturalistic. SCOPE displays MI as a <strong>distribution only</strong>
  &mdash; it does <em>not</em> feed MI into stream, family, or cluster scoring.</p>
  <h4>Why MI doesn&rsquo;t drive recommendations</h4>
  <ul>
    <li>MI is a self-report of preference and self-image, not an ability measure.</li>
    <li>Gardner&rsquo;s eight intelligences are debated in psychometrics &mdash; factor-analytic studies
    typically don&rsquo;t recover eight independent factors (they collapse into a general g + a handful of
    specifics).</li>
    <li>We keep MI because it is an <em>excellent self-reflection prompt</em> for students, especially for
    surfacing strengths the IRT items can&rsquo;t measure (kinesthetic, musical, interpersonal).</li>
  </ul>
  <div class="ref">
    <strong>References.</strong>
    Gardner, H. (1983/2011). <em>Frames of Mind: The Theory of Multiple Intelligences</em>. Basic Books.<br>
    Gardner, H. (2006). <em>Multiple Intelligences: New Horizons in Theory and Practice</em>. Basic Books.<br>
    Waterhouse, L. (2006). Multiple intelligences, the Mozart effect, and emotional intelligence: A critical review. <em>Educational Psychologist</em>, 41(4), 207&ndash;225. <em>(critical perspective)</em>.
  </div>

  <h2>7. Holland &harr; MBTI Correspondence (the &plusmn;5 Bonus)</h2>
  <p>Each of the 18 career clusters carries a curated MBTI pattern (e.g., Data Science &asymp; INTJ/INTP/ISTJ).
  When the student&rsquo;s indicated type matches the cluster pattern, the cluster&rsquo;s score gets a small
  bonus (max +5); when it&rsquo;s opposite on multiple axes, a small drag (min &minus;5). The mapping is
  drawn from two published correspondence studies, not invented at runtime:</p>
  <div class="ref">
    <strong>References.</strong>
    Tieger, P. D., Barron-Tieger, B., &amp; Tieger, K. (2014). <em>Do What You Are: Discover the Perfect Career for You Through the Secrets of Personality Type</em> (5th ed.). Little, Brown.<br>
    Hammer, A. L., &amp; Macdaid, G. P. (1992). <em>MBTI Career Report Manual</em>. Consulting Psychologists Press.<br>
    Tracey, T. J. G., &amp; Hopkins, N. (2001). Correspondence of interests and abilities with occupational choice. <em>Journal of Counseling Psychology</em>, 48, 178&ndash;189.
  </div>

  <div class="page-break"></div>

  <h2>8. Validity Controls: Consistency + Attention Checks</h2>
  <h4>10 mirror-item consistency pairs</h4>
  <p>Pairs of items measure the same underlying construct in opposite directions
  (e.g. &ldquo;I enjoy solving puzzles&rdquo; vs &ldquo;Puzzles bore me&rdquo;). The consistency level is
  derived from how many pairs the student answered congruently:</p>
  <table>
    <thead><tr><th>Congruent pairs</th><th>Level</th><th>Counsellor action</th></tr></thead>
    <tbody>
      <tr><td>8&ndash;10</td><td><span class="pill pill-blue">High</span></td><td>Trust scores; standard discussion.</td></tr>
      <tr><td>5&ndash;7</td><td><span class="pill pill-amber">Medium</span></td><td>Lean qualitative; cross-check top picks against lived experience.</td></tr>
      <tr><td>0&ndash;4</td><td><span class="pill" style="background:#dc3545;">Low</span></td><td>Treat scores as indicative only; probe test conditions; consider retest.</td></tr>
    </tbody>
  </table>
  <h4>2 attention-check items</h4>
  <p>Items with an explicit instruction (e.g. &ldquo;For this item, select &lsquo;Agree.&rsquo;&rdquo;).
  Failing both attention checks <strong>forces</strong> consistency to Low and <em>suppresses</em> the
  MBTI bonus from cluster scoring &mdash; we don&rsquo;t want a click-through pattern to influence
  recommendations.</p>
  <div class="ref">
    <strong>References.</strong>
    Meade, A. W., &amp; Craig, S. B. (2012). Identifying careless responses in survey data. <em>Psychological Methods</em>, 17(3), 437&ndash;455.<br>
    Maniaci, M. R., &amp; Rogge, R. D. (2014). Caring about carelessness: Participant inattention and its effects on research. <em>Journal of Research in Personality</em>, 48, 61&ndash;83.
  </div>

  <h2>9. Tie-Zone Rule &amp; LOW INFO Flag</h2>
  <h4>Tie-zone (5-point rule)</h4>
  <p>Any stream, course family, or career cluster whose score is within 5 points of the leader is marked
  <strong>EQUALLY VIABLE</strong>. Rank order alone should not drive the choice when items overlap this
  tightly &mdash; small noise in any sub-scale could swap them. Use it as a permission for the student to
  explore both, not as a forced choice.</p>
  <h4>LOW INFO flag</h4>
  <p>When an aptitude domain&rsquo;s 95% CI band exceeds <strong>40 points</strong>, we tag it LOW INFO.
  The estimate is too noisy to act on; counsel the student to retake that section under better
  conditions before making decisions that rely on that domain.</p>

  <h2>10. Limitations &mdash; What SCOPE Does Not Measure</h2>
  <ul>
    <li><strong>Socio-economic context, family pressure, financial constraints.</strong> Critical to career choice; absent from the algorithm.</li>
    <li><strong>Conscientiousness, grit, growth mindset.</strong> Often better predictors of long-term outcome than aptitude alone (Duckworth, Dweck).</li>
    <li><strong>Cultural/linguistic bias.</strong> Verbal items are English; rural / vernacular-medium students may under-perform on language-heavy domains.</li>
    <li><strong>Mental health, anxiety, learning differences.</strong> Refer out; this is not a clinical tool.</li>
    <li><strong>Real-world exposure.</strong> A student who has never seen a research lab can&rsquo;t rate &ldquo;investigative&rdquo; honestly.</li>
    <li><strong>Job-market dynamics.</strong> The cluster list is structural, not predictive of 2030 demand.</li>
  </ul>

  <h2>11. Recommended Further Reading (Counsellor L&amp;D Path)</h2>
  <h4>Foundational (read first)</h4>
  <ol>
    <li>Holland, J. L. (1997). <em>Making Vocational Choices</em>. &mdash; the canonical RIASEC text.</li>
    <li>Lent, R. W., Brown, S. D., &amp; Hackett, G. (1994). Toward a unifying social cognitive theory of career and academic interest, choice, and performance. <em>Journal of Vocational Behavior</em>, 45, 79&ndash;122. <em>(SCCT &mdash; the modern integrative model.)</em></li>
    <li>Savickas, M. L. (2013). Career construction theory and practice. In <em>Career Development and Counseling</em> (2nd ed.). Wiley. <em>(narrative / life-design approach &mdash; complements the trait-factor SCOPE model.)</em></li>
  </ol>
  <h4>Psychometrics</h4>
  <ol>
    <li>Embretson &amp; Reise (2000) &mdash; <em>IRT for Psychologists</em>.</li>
    <li>Furr, R. M. (2021). <em>Psychometrics: An Introduction</em> (4th ed.). Sage.</li>
    <li>American Educational Research Association et al. (2014). <em>Standards for Educational and Psychological Testing</em>. AERA.</li>
  </ol>
  <h4>Counselling practice</h4>
  <ol>
    <li>Brown, D., &amp; Brooks, L. (Eds.). (2002). <em>Career Choice and Development</em> (4th ed.). Jossey-Bass.</li>
    <li>Niles, S. G., &amp; Harris-Bowlsbey, J. (2017). <em>Career Development Interventions</em> (5th ed.). Pearson.</li>
    <li>Sharf, R. S. (2016). <em>Applying Career Development Theory to Counseling</em> (6th ed.). Cengage.</li>
  </ol>
  <h4>Critical / cautionary (essential balance)</h4>
  <ol>
    <li>Pittenger, D. J. (2005) &mdash; MBTI critique (cited above).</li>
    <li>Waterhouse, L. (2006) &mdash; MI critique (cited above).</li>
    <li>Duckworth, A. L. (2016). <em>Grit: The Power of Passion and Perseverance</em>. Scribner. <em>(what aptitude tests miss.)</em></li>
    <li>Dweck, C. S. (2006). <em>Mindset: The New Psychology of Success</em>. Random House.</li>
  </ol>
  <h4>Indian context</h4>
  <ol>
    <li>Arulmani, G., &amp; Nag-Arulmani, S. (2004). <em>Career Counselling: A Handbook</em>. Tata McGraw-Hill. <em>(India-specific framework.)</em></li>
    <li>NCERT (2018). <em>Vocational Education and Career Guidance</em>. National Council of Educational Research and Training.</li>
    <li>UGC / AICTE career-pathway documents &mdash; latest editions.</li>
  </ol>

  <h2>12. Glossary</h2>
  <table>
    <tbody>
      <tr><td><strong>2PL IRT</strong></td><td>Two-Parameter Logistic Item Response Theory &mdash; ability-estimation model using item discrimination and difficulty.</td></tr>
      <tr><td><strong>&theta; (theta)</strong></td><td>Latent ability estimate; the &ldquo;true score&rdquo; IRT is trying to recover.</td></tr>
      <tr><td><strong>Fisher Information</strong></td><td>How much an item &ldquo;tells&rdquo; us about &theta; at a given ability level; drives the SE and CI.</td></tr>
      <tr><td><strong>95% CI</strong></td><td>Range within which the true score is expected to fall 95 times out of 100 if the test were repeated.</td></tr>
      <tr><td><strong>RIASEC</strong></td><td>Holland&rsquo;s six interest types: Realistic, Investigative, Artistic, Social, Enterprising, Conventional.</td></tr>
      <tr><td><strong>MBTI Step I</strong></td><td>The four-dichotomy form of the Myers-Briggs Type Indicator (vs Step II, which adds 20 facets).</td></tr>
      <tr><td><strong>Tie-zone</strong></td><td>SCOPE&rsquo;s 5-point window within which alternatives are treated as statistically indistinguishable.</td></tr>
      <tr><td><strong>LOW INFO</strong></td><td>Flag raised when a domain&rsquo;s 95% CI band exceeds 40 points; estimate too noisy to act on.</td></tr>
      <tr><td><strong>SCCT</strong></td><td>Social Cognitive Career Theory (Lent, Brown &amp; Hackett, 1994) &mdash; integrates self-efficacy, outcome expectations, and goals.</td></tr>
    </tbody>
  </table>

  <div class="footer">
    Srichakra Academy &middot; SCOPE Methodology &amp; References Handbook &middot; Version 1.0 (May 2026).
    For internal counsellor training. Cite original sources, not this handbook, in any external communication.
  </div>
</body></html>`;

const MethodologyHandbook: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleDownload = useCallback(() => {
    const blob = new Blob([HANDBOOK_HTML], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (!win) {
      alert('Pop-up blocked. Please allow pop-ups to download the handbook.');
      URL.revokeObjectURL(blobUrl);
      return;
    }
    win.addEventListener(
      'load',
      () => {
        win.focus();
        win.print();
        URL.revokeObjectURL(blobUrl);
      },
      { once: true }
    );
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '10px 18px',
          background: '#006D77',
          color: '#fff',
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.05em' }}>
          SCOPE Methodology &amp; References Handbook
        </h2>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleDownload}
          style={{
            padding: '8px 16px',
            background: '#fff',
            color: '#006D77',
            border: 'none',
            borderRadius: 4,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          &#x1f4e5; Download PDF
        </button>
      </div>

      <iframe
        ref={iframeRef}
        srcDoc={HANDBOOK_HTML}
        title="SCOPE Methodology Handbook Preview"
        style={{ border: 'none', flex: 1, width: '100%', display: 'block' }}
      />
    </div>
  );
};

export default MethodologyHandbook;
