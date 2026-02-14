# PowerShell script to update CareerAssessment.tsx
# This script adds aptitude-driven decision tables

$filePath = "client\src\pages\CareerAssessment.tsx"
$content = Get-Content $filePath -Raw

Write-Host "Starting modifications..." -ForegroundColor Green

# Find and replace the aptitude calculation section
$pattern1 = "const dominantHemisphere = leftBrainScore > rightBrainScore \? 'Left' : rightBrainScore > leftBrainScore \? 'Right' : 'Balanced';\s+// Career recommendations based on top domains\s+const topDomains = finalScores\.slice\(0, 3\);"

$replacement1 = @"
const dominantHemisphere = leftBrainScore > rightBrainScore ? 'Left' : rightBrainScore > leftBrainScore ? 'Right' : 'Balanced';

    // Calculate aptitude scores by category for decision tables
    const aptitudeScores: Record<string, { correct: number; total: number }> = {
      'Numerical Aptitude': { correct: 0, total: 0 },
      'Logical Reasoning': { correct: 0, total: 0 },
      'Verbal Reasoning': { correct: 0, total: 0 },
      'Spatial Reasoning': { correct: 0, total: 0 }
    };

    aptitudeQuestions.forEach(q => {
      const answer = answers[q.id];
      if (answer !== undefined) {
        aptitudeScores[q.domain].total++;
        if (answer === q.correctAnswer) {
          aptitudeScores[q.domain].correct++;
        }
      }
    });

    // Calculate percentages and determine readiness levels
    const aptitudeResults = Object.keys(aptitudeScores).map(domain => {
      const { correct, total } = aptitudeScores[domain];
      const percentage = total > 0 ? (correct / total) * 100 : 0;
      return { domain, correct, total, percentage };
    }).sort((a, b) => b.percentage - a.percentage);

    // Determine stream readiness based on aptitude patterns
    const numericalPct = aptitudeResults.find(a => a.domain === 'Numerical Aptitude')?.percentage || 0;
    const logicalPct = aptitudeResults.find(a => a.domain === 'Logical Reasoning')?.percentage || 0;
    const verbalPct = aptitudeResults.find(a => a.domain === 'Verbal Reasoning')?.percentage || 0;
    const spatialPct = aptitudeResults.find(a => a.domain === 'Spatial Reasoning')?.percentage || 0;

    const scienceScore = (numericalPct + logicalPct + spatialPct) / 3;
    const commerceScore = (numericalPct + verbalPct + logicalPct) / 3;
    const artsScore = (verbalPct + logicalPct) / 2;

    // Create stream recommendations with readiness levels
    const streamOptions = [
      { 
        stream: 'Science Stream', 
        score: scienceScore,
        keyAptitudes: 'Numerical + Logical + Spatial',
        readiness: scienceScore >= 70 ? 'READY NOW' : scienceScore >= 50 ? 'WITH DEVELOPMENT' : 'EXPLORATORY'
      },
      { 
        stream: 'Commerce Stream', 
        score: commerceScore,
        keyAptitudes: 'Numerical + Verbal + Logical',
        readiness: commerceScore >= 70 ? 'READY NOW' : commerceScore >= 50 ? 'WITH DEVELOPMENT' : 'EXPLORATORY'
      },
      { 
        stream: 'Arts/Humanities Stream', 
        score: artsScore,
        keyAptitudes: 'Verbal + Logical',
        readiness: artsScore >= 70 ? 'READY NOW' : artsScore >= 50 ? 'WITH DEVELOPMENT' : 'EXPLORATORY'
      }
    ].sort((a, b) => b.score - a.score);

    // Create course family recommendations (Class 12 pathways)
    const courseFamilies = [
      {
        family: 'Engineering/Technology',
        requiredAptitudes: 'Numerical + Logical + Spatial',
        score: (numericalPct + logicalPct + spatialPct) / 3,
        preferenceAlignment: finalScores.find(s => s.domain === 'Technical')?.score || 2.5
      },
      {
        family: 'Medicine/Life Sciences',
        requiredAptitudes: 'Numerical + Logical + Verbal',
        score: (numericalPct + logicalPct + verbalPct) / 3,
        preferenceAlignment: finalScores.find(s => s.domain === 'Analytical')?.score || 2.5
      },
      {
        family: 'Business/Commerce',
        requiredAptitudes: 'Numerical + Verbal + Logical',
        score: commerceScore,
        preferenceAlignment: finalScores.find(s => s.domain === 'Analytical')?.score || 2.5
      },
      {
        family: 'Law/Social Sciences',
        requiredAptitudes: 'Verbal + Logical',
        score: (verbalPct + logicalPct) / 2,
        preferenceAlignment: finalScores.find(s => s.domain === 'Verbal')?.score || 2.5
      },
      {
        family: 'Arts/Design/Media',
        requiredAptitudes: 'Spatial + Verbal',
        score: (spatialPct + verbalPct) / 2,
        preferenceAlignment: finalScores.find(s => s.domain === 'Creative')?.score || 2.5
      },
      {
        family: 'Pure Sciences/Research',
        requiredAptitudes: 'Numerical + Logical',
        score: (numericalPct + logicalPct) / 2,
        preferenceAlignment: finalScores.find(s => s.domain === 'Analytical')?.score || 2.5
      }
    ].map(cf => ({
      ...cf,
      combinedScore: (cf.score * 0.6) + (cf.preferenceAlignment * 20 * 0.4), // 60% aptitude, 40% preference
      readiness: cf.score >= 70 ? 'READY NOW' : cf.score >= 50 ? 'WITH DEVELOPMENT' : 'EXPLORATORY'
    })).sort((a, b) => b.combinedScore - a.combinedScore);

    // Career recommendations based on top domains
    const topDomains = finalScores.slice(0, 3);
"@

if ($content -match $pattern1) {
    $content = $content -replace $pattern1, $replacement1
    Write-Host "Applied modification 1" -ForegroundColor Green
    Set-Content -Path $filePath -Value $content -NoNewline
} else {
    Write-Host "Could not find pattern 1" -ForegroundColor Red
}

Write-Host "Done!" -ForegroundColor Cyan
