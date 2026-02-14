# PowerShell script Part 2 - Update Aptitude Ability Snapshot section

$filePath = "client\src\pages\CareerAssessment.tsx"
$content = Get-Content $filePath -Raw

Write-Host "Applying Aptitude Ability Snapshot modifications..." -ForegroundColor Green

# Pattern for the Aptitude Ability Snapshot section
$oldSnapshot = @'
            <div class="recommendations" style="margin-top: 30px;">
              <h3 style="margin-top: 0; color: #006D77;">Aptitude Ability Snapshot</h3>
              <p style="font-size: 1.05em; line-height: 1.6;">
                This section reflects objective ability-based questions that assess how you approach numbers, logic, language, and visual patterns. These questions have right or wrong answers and indicate current readiness areas, not fixed potential.
              </p>
              <ul style="font-size: 1.05em; line-height: 1.6; margin: 10px 0 15px 20px;">
                <li>Numerical Reasoning</li>
                <li>Logical Reasoning</li>
                <li>Verbal Reasoning</li>
                <li>Spatial Reasoning</li>
              </ul>
              <p style="font-size: 1.05em; line-height: 1.6;">
                Aptitude results are used to support pathway readiness and do not determine careers.
              </p>
            </div>
'@

$newSnapshot = @'
            <div class="recommendations" style="margin-top: 30px;">
              <h3 style="margin-top: 0; color: #006D77;">Aptitude Ability Snapshot</h3>
              <p style="font-size: 1.05em; line-height: 1.6;">
                This section reflects objective ability-based questions that assess how you approach numbers, logic, language, and visual patterns. 
                These questions have right or wrong answers and indicate <strong>current readiness areas</strong>, not fixed potential.
              </p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.95em;">
                <thead>
                  <tr style="background: #006D77; color: white;">
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Aptitude Domain</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Score</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Performance</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Current Readiness</th>
                  </tr>
                </thead>
                <tbody>
                  ${aptitudeResults.map(apt => `
                    <tr style="${apt.percentage >= 75 ? 'background: #d4edda;' : apt.percentage >= 50 ? 'background: #fff3cd;' : 'background: #f8d7da;'}">
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${apt.domain}</td>
                      <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${apt.correct}/${apt.total}</td>
                      <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${apt.percentage.toFixed(0)}%</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">
                        ${apt.percentage >= 75 ? '<strong>READY NOW</strong> – Strong foundation demonstrated' :
                          apt.percentage >= 50 ? '<strong>WITH DEVELOPMENT</strong> – Requires focused skill-building' :
                          '<strong>EXPLORATORY ONLY</strong> – Needs significant strengthening'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div style="margin-top: 20px; padding: 15px; background: #e8f4f8; border-left: 4px solid #006D77; border-radius: 8px;">
                <h4 style="margin-top: 0; color: #006D77;">What This Means:</h4>
                <ul style="margin: 10px 0 5px 20px; line-height: 1.8;">
                  <li><strong>READY NOW:</strong> You are most prepared in ${aptitudeResults.filter(a => a.percentage >= 75).map(a => a.domain).join(', ') || 'developing areas'}</li>
                  <li><strong>WITH DEVELOPMENT:</strong> ${aptitudeResults.filter(a => a.percentage >= 50 && a.percentage < 75).map(a => a.domain).join(', ') || 'None identified'} can be strengthened with focused practice</li>
                  <li><strong>EXPLORATORY:</strong> ${aptitudeResults.filter(a => a.percentage < 50).map(a => a.domain).join(', ') || 'None'} may require significant effort or may not align with natural strengths</li>
                </ul>
              </div>

              <p style="font-size: 0.95em; line-height: 1.6; margin-top: 15px; color: #666;">
                <em>Note: Aptitude results support pathway readiness and do not determine careers. These are current snapshots that can improve with practice and development.</em>
              </p>
            </div>
'@

if ($content.Contains($oldSnapshot.Trim())) {
    $content = $content.Replace($oldSnapshot.Trim(), $newSnapshot.Trim())
    Write-Host "✓ Updated Aptitude Ability Snapshot section" -ForegroundColor Green
    Set-Content -Path $filePath -Value $content -NoNewline
} else {
    Write-Host "✗ Could not find Aptitude Ability Snapshot section" -ForegroundColor Red
}

Write-Host "Part 2 complete!" -ForegroundColor Cyan
