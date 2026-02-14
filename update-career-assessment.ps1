# PowerShell script to update CareerAssessment.tsx with aptitude-driven decision tables

$filePath = "client\src\pages\CareerAssessment.tsx"
$content = Get-Content $filePath -Raw

Write-Host "Starting CareerAssessment.tsx modifications..." -ForegroundColor Green

# ============================================================================
# MODIFICATION 1: Add aptitude scoring calculation after dominantHemisphere
# ============================================================================

$oldText1 = @'
    const dominantHemisphere = leftBrainScore > rightBrainScore ? 'Left' : rightBrainScore > leftBrainScore ? 'Right' : 'Balanced';
    // Career recommendations based on top domains
    const topDomains = finalScores.slice(0, 3);
'@

$newText1 = @'
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
'@

if ($content -match [regex]::Escape($oldText1)) {
    $content = $content -replace [regex]::Escape($oldText1), $newText1
    Write-Host "✓ Added aptitude scoring calculations" -ForegroundColor Green
} else {
    Write-Host "✗ Could not find text to replace for modification 1" -ForegroundColor Red
}

# Save the modified content
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Modifications complete!" -ForegroundColor Green
Write-Host "Backup saved as: client\src\pages\CareerAssessment.tsx.backup" -ForegroundColor Yellow
