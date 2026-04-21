/**
 * SCRIPT: Generate Demo Report
 *
 * This script creates a new, updated static HTML demo report (`mi-report.html`)
 * based on a sample student's answers and our latest scoring engine.
 *
 * To run: `node generate-demo-report.mjs`
 */

import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

// We need to trick Node into thinking we're in a browser environment for the imports
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;


// Now we can import our project files
import { buildReportFromAnswers } from './client/src/scoring/scoringEngine.js';
import { ReportTemplate } from './client/src/pages/reportTemplate.jsx';
import { APTITUDE_QUESTIONS, PREFERENCE_QUESTIONS } from './client/src/data/questionBank.js';

console.log('Starting demo report generation...');

// --- 1. Define Sample Student and Answers ---
const sampleStudentName = 'Priya Sharma (Demo)';

// Let's create a sample answer set for a student strong in analytical and technical fields.
const aptitudeAnswers = {};
APTITUDE_QUESTIONS.forEach(q => {
    // Let's say Priya gets most of the logical and numerical questions right,
    // especially the harder ones, and a few of the verbal/spatial ones wrong.
    const isHard = q.difficulty > 0.6;
    const isEasy = q.difficulty < 0.3;
    let shouldBeCorrect = false;

    if (q.domain === 'Numerical Reasoning' || q.domain === 'Logical Reasoning') {
        shouldBeCorrect = Math.random() > 0.1; // 90% chance of being correct
    } else {
        shouldBeCorrect = Math.random() > 0.3; // 70% chance
    }

    aptitudeAnswers[q.id] = shouldBeCorrect ? q.correctIndex : (q.correctIndex + 1) % 4;
});


const preferenceAnswers = {};
PREFERENCE_QUESTIONS.forEach(q => {
    let score = 3; // Default to Neutral
    // Strong agreement with Analytical, Technical, and Conscientiousness
    if (['Analytical', 'Technical', 'Conscientiousness'].includes(q.domain)) {
        score = 5;
    }
    // Moderate agreement with Creative and Executive
    else if (['Creative', 'Executive'].includes(q.domain)) {
        score = 4;
    }
    // Disagreement with Social and Musical
    else if (['Social', 'Musical'].includes(q.domain)) {
        score = 2;
    }

    // Handle consistency checks logically
    if (q.id === 362) score = 2; // Prefers working alone
    if (q.id === 364) score = 3; // Neutral on schedule
    if (q.id === 366) score = 5; // Prefers practical tasks
    if (q.id === 368) score = 5; // Prefers to analyze data
    if (q.id === 374) score = 4; // Quiet with strangers

    preferenceAnswers[q.id] = score;
});


const rawAnswers = {
    studentName: sampleStudentName,
    aptitude: aptitudeAnswers,
    preference: preferenceAnswers,
};

// --- 2. Build the Report Data using the Scoring Engine ---
const reportData = buildReportFromAnswers(rawAnswers);
console.log('Successfully generated report data for demo student.');


// --- 3. Render the React Component to an HTML String ---
const reportHtml = ReactDOMServer.renderToStaticMarkup(
    React.createElement(ReportTemplate, { data: reportData })
);
console.log('Successfully rendered React component to HTML string.');


// --- 4. Create the Full HTML Page ---
// We'll add a basic header, some styles, and the "Try Live" button.
const finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Srichakra Career Assessment - Demo Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .srichakra-blue { color: #0A4D68; }
        .srichakra-orange { color: #FF7B54; }
        .report-container { max-width: 1200px; margin: auto; }
        .try-live-banner {
            background-color: #0A4D68;
            color: white;
            padding: 1.5rem;
            text-align: center;
            border-radius: 0.5rem;
            margin: 2rem auto;
            max-width: 800px;
        }
        .try-live-banner h2 {
            font-size: 1.75rem;
            font-weight: 700;
        }
        .try-live-banner p {
            margin-top: 0.5rem;
            font-size: 1.1rem;
        }
        .try-live-banner a {
            display: inline-block;
            background-color: #FF7B54;
            color: white;
            padding: 0.75rem 2rem;
            border-radius: 0.5rem;
            font-weight: 600;
            margin-top: 1.5rem;
            text-decoration: none;
            transition: background-color 0.3s;
        }
        .try-live-banner a:hover {
            background-color: #ff6a40;
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="report-container p-4 md:p-8">
        <div class="try-live-banner">
            <h2>This is a Demo Report</h2>
            <p>The following report is a sample generated from a demo student's answers. To get your own personalized report, take our live assessment.</p>
            <a href="/assessment">Take the Live Assessment Now</a>
        </div>
        ${reportHtml}
    </div>
</body>
</html>
`;

// --- 5. Save the file ---
const outputPath = path.join(process.cwd(), 'mi-report.html');
fs.writeFileSync(outputPath, finalHtml);

console.log(`\n✅ Success! New demo report has been saved to:\n${outputPath}`);
