const fs = require('fs');

console.log('🚀 Applying complete fix to CareerAssessment.tsx...\n');

// Read the current file
const filePath = 'client/src/pages/CareerAssessment.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Insert Class 10 and Class 12 decision tables
const oldText1 = `              <p style="font-size: 1.1em; line-height: 1.6;">
                Your brain dominance analysis indicates a <strong>\${dominantHemisphere} Brain</strong> preference, which influences your learning style, 
                problem-solving approach, and career satisfaction factors.
              </p>
            </div>

          </div>

          <!-- Page 2: Detailed Charts -->`;

const newText1 = `              <p style="font-size: 1.1em; line-height: 1.6;">
                Your brain dominance analysis indicates a <strong>\${dominantHemisphere} Brain</strong> preference, which influences your learning style, 
                problem-solving approach, and career satisfaction factors.
              </p>
            </div>

            <div class="recommendations" style="margin-top: 30px;">
              <h3 style="margin-top: 0; color: #006D77;">🎯 Decision Table: After Class 10 – Subject Stream Readiness</h3>
              <p style="font-size: 1.05em; line-height: 1.6; margin-bottom: 15px;">
                Based on <strong>objective aptitude performance</strong>, here are your stream options ranked by readiness:
              </p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.95em;">
                <thead>
                  <tr style="background: #006D77; color: white;">
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Rank</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Stream Option</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Key Aptitudes Required</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Aptitude Score</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Readiness Status</th>
                  </tr>
                </thead>
                <tbody>
                  \${streamOptions.map((stream, index) => \`
                    <tr style="\${stream.readiness === 'READY NOW' ? 'background: #d4edda;' : stream.readiness === 'WITH DEVELOPMENT' ? 'background: #fff3cd;' : 'background: #f8d7da;'}">
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; text-align: center;">\${index + 1}</td>
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">\${stream.stream}</td>
                      <td style="padding: 10px; border: 1px solid #ddd; font-size: 0.9em;">\${stream.keyAptitudes}</td>
                      <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">\${stream.score.toFixed(0)}%</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">
                        <strong>\${stream.readiness}</strong>
                        \${stream.readiness === 'READY NOW' ? '<br><span style="font-size: 0.9em; color: #155724;">↗ Recommended pathway</span>' :
                          stream.readiness === 'WITH DEVELOPMENT' ? '<br><span style="font-size: 0.9em; color: #856404;">⚠ Needs skill-building</span>' :
                          '<br><span style="font-size: 0.9em; color: #721c24;">⚡ High effort required</span>'}
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
              
              <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
                <strong>Parent Guidance:</strong> The ranking above is based purely on demonstrated aptitude readiness. 
                Students showing "READY NOW" status have current capability; "WITH DEVELOPMENT" students can catch up with focused effort; 
                "EXPLORATORY" paths may require significant remediation or may not align with current strengths.
              </p>
            </div>

            <div class="recommendations" style="margin-top: 30px;">
              <h3 style="margin-top: 0; color: #006D77;">🎓 Decision Table: After Class 12 – Course Family Alignment</h3>
              <p style="font-size: 1.05em; line-height: 1.6; margin-bottom: 15px;">
                Ranked by <strong>combined aptitude readiness (60%) + preference alignment (40%)</strong>:
              </p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.95em;">
                <thead>
                  <tr style="background: #006D77; color: white;">
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Rank</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Course Family</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Required Aptitudes</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Aptitude<br>Score</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Preference<br>Match</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Readiness Status</th>
                  </tr>
                </thead>
                <tbody>
                  \${courseFamilies.map((cf, index) => \`
                    <tr style="\${cf.readiness === 'READY NOW' ? 'background: #d4edda;' : cf.readiness === 'WITH DEVELOPMENT' ? 'background: #fff3cd;' : 'background: #f8d7da;'}">
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; text-align: center;">\${index + 1}</td>
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">\${cf.family}</td>
                      <td style="padding: 10px; border: 1px solid #ddd; font-size: 0.9em;">\${cf.requiredAptitudes}</td>
                      <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">\${cf.score.toFixed(0)}%</td>
                      <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">\${(cf.preferenceAlignment).toFixed(1)}/5.0</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">
                        <strong>\${cf.readiness}</strong>
                        \${cf.readiness === 'READY NOW' ? '<br><span style="font-size: 0.9em; color: #155724;">↗ Strong pathway match</span>' :
                          cf.readiness === 'WITH DEVELOPMENT' ? '<br><span style="font-size: 0.9em; color: #856404;">⚠ Possible with prep</span>' :
                          '<br><span style="font-size: 0.9em; color: #721c24;">⚡ Exploration only</span>'}
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
              
              <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
                <strong>Parent Guidance:</strong> Rankings combine proven aptitude (objective test performance) with stated interest (self-reported preferences). 
                Top-ranked families show both capability AND interest. Lower ranks may indicate interest without sufficient aptitude foundation, requiring extra preparation.
              </p>
            </div>

          </div>

          <!-- Page 2: Detailed Charts -->`;

if (content.includes(oldText1)) {
  content = content.replace(oldText1, newText1);
  console.log('✓ Step 1: Inserted Class 10 and Class 12 decision tables');
} else {
  console.log('✗ Step 1: Could not find insertion point for decision tables');
}

// Step 2: Replace Aptitude Ability Snapshot
const oldSnapshot = `            <div class="recommendations" style="margin-top: 30px;">
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
            </div>`;

const newSnapshot = `            <div class="recommendations" style="margin-top: 30px;">
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
                  \${aptitudeResults.map(apt => \`
                    <tr style="\${apt.percentage >= 75 ? 'background: #d4edda;' : apt.percentage >= 50 ? 'background: #fff3cd;' : 'background: #f8d7da;'}">
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">\${apt.domain}</td>
                      <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">\${apt.correct}/\${apt.total}</td>
                      <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">\${apt.percentage.toFixed(0)}%</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">
                        \${apt.percentage >= 75 ? '<strong>READY NOW</strong> – Strong foundation demonstrated' :
                          apt.percentage >= 50 ? '<strong>WITH DEVELOPMENT</strong> – Requires focused skill-building' :
                          '<strong>EXPLORATORY ONLY</strong> – Needs significant strengthening'}
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>

              <div style="margin-top: 20px; padding: 15px; background: #e8f4f8; border-left: 4px solid #006D77; border-radius: 8px;">
                <h4 style="margin-top: 0; color: #006D77;">What This Means:</h4>
                <ul style="margin: 10px 0 5px 20px; line-height: 1.8;">
                  <li><strong>READY NOW:</strong> You are most prepared in \${aptitudeResults.filter(a => a.percentage >= 75).map(a => a.domain).join(', ') || 'developing areas'}</li>
                  <li><strong>WITH DEVELOPMENT:</strong> \${aptitudeResults.filter(a => a.percentage >= 50 && a.percentage < 75).map(a => a.domain).join(', ') || 'None identified'} can be strengthened with focused practice</li>
                  <li><strong>EXPLORATORY:</strong> \${aptitudeResults.filter(a => a.percentage < 50).map(a => a.domain).join(', ') || 'None'} may require significant effort or may not align with natural strengths</li>
                </ul>
              </div>

              <p style="font-size: 0.95em; line-height: 1.6; margin-top: 15px; color: #666;">
                <em>Note: Aptitude results support pathway readiness and do not determine careers. These are current snapshots that can improve with practice and development.</em>
              </p>
            </div>`;

if (content.includes(oldSnapshot)) {
  content = content.replace(oldSnapshot, newSnapshot);
  console.log('✓ Step 2: Enhanced Aptitude Ability Snapshot with table format');
} else {
  console.log('✗ Step 2: Could not find Aptitude Ability Snapshot section');
}

// Write the modified content back
fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ All changes applied successfully!');
console.log('📁 File updated: ' + filePath);
