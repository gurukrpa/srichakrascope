/**
 * SCRIPT: Generate Demo SCOPE Report
 *
 * Produces a static `mi-report.html` (legacy filename — actually the SCOPE
 * demo) using the live scoring engine + reportTemplate.
 *
 * Run: `node generate-demo-report.mjs`
 *
 * Strategy: bundle the TS sources with esbuild → temp .mjs → dynamic import.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Bundling TypeScript sources with esbuild...');

const tmpDir = path.join(__dirname, '.demo-build');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const entryFile = path.join(tmpDir, 'entry.ts');
fs.writeFileSync(
    entryFile,
    `
    export { buildReportFromAnswers } from '../client/src/scoring/scoringEngine';
    export { generateFullReport } from '../client/src/pages/reportTemplate';
    export { APTITUDE_QUESTIONS, PREFERENCE_QUESTIONS } from '../client/src/data/questionBank';
    `
);

const outFile = path.join(tmpDir, 'bundle.mjs');

await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    outfile: outFile,
    logLevel: 'warning',
});

const { buildReportFromAnswers, generateFullReport, APTITUDE_QUESTIONS, PREFERENCE_QUESTIONS } =
    await import(pathToFileURL(outFile).href);

console.log('Bundle loaded. Generating sample answers...');

// --- Sample student strong in analytical/technical ---
const sampleStudentName = 'Priya Sharma (Demo)';

const aptitudeAnswers = {};
APTITUDE_QUESTIONS.forEach(q => {
    let shouldBeCorrect;
    if (q.domain === 'Numerical Reasoning' || q.domain === 'Logical Reasoning') {
        shouldBeCorrect = Math.random() > 0.1; // 90%
    } else {
        shouldBeCorrect = Math.random() > 0.3; // 70%
    }
    aptitudeAnswers[q.id] = shouldBeCorrect ? q.correctIndex : (q.correctIndex + 1) % 4;
});

const preferenceAnswers = {};
PREFERENCE_QUESTIONS.forEach(q => {
    let score = 3;
    if (['Analytical', 'Technical', 'Conscientiousness'].includes(q.domain)) score = 5;
    else if (['Creative', 'Executive'].includes(q.domain)) score = 4;
    else if (['Social', 'Musical'].includes(q.domain)) score = 2;

    if (q.id === 362) score = 2;
    if (q.id === 364) score = 3;
    if (q.id === 366) score = 5;
    if (q.id === 368) score = 5;
    if (q.id === 374) score = 4;

    preferenceAnswers[q.id] = score;
});

const rawAnswers = {
    studentName: sampleStudentName,
    aptitude: aptitudeAnswers,
    preference: preferenceAnswers,
};

console.log('Scoring report...');
const reportData = buildReportFromAnswers(rawAnswers);

console.log('Rendering HTML...');
const reportHtml = generateFullReport(reportData);

// Inject a "demo" banner above the report content (after <body>).
const demoBanner = `
<div style="background:#0A4D68;color:white;padding:18px 24px;text-align:center;
    border-radius:8px;margin:16px auto;max-width:800px;font-family:'Segoe UI',sans-serif;">
  <h2 style="margin:0;font-size:1.5em;font-weight:700;">This is a Demo SCOPE Report</h2>
  <p style="margin:8px 0 14px;font-size:1em;">Sample data only. Take the live assessment for your personalised report.</p>
  <a href="/assessment" style="display:inline-block;background:#FF7B54;color:#fff;
      padding:10px 24px;border-radius:6px;font-weight:600;text-decoration:none;">
    Take the Live Assessment
  </a>
</div>
`;

const finalHtml = reportHtml.replace('<body>', `<body>${demoBanner}`);

// NOTE: never write to mi-report.html — that file is the separately built
// Multiple-Intelligences report and lives at the site root.
const outputPath = path.join(__dirname, 'scope-demo-report.html');
fs.writeFileSync(outputPath, finalHtml);

console.log(`\n✅ Demo SCOPE report written to:\n   ${outputPath}`);
console.log(`   Size: ${(finalHtml.length / 1024).toFixed(1)} KB`);
