const fs = require('fs');

console.log('🚀 Starting comprehensive report enhancement...\n');

const filePath = 'client/src/pages/CareerAssessment.tsx';
let content = fs.readFileSync(filePath, 'utf8');
let changeCount = 0;

// STEP 1: Create enhanced aptitude table content to insert on new Page 2
const enhancedAptitudeSection = `
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.95em;">
              <thead>
                <tr style="background: #006D77; color: white;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Aptitude Domain</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Score</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Performance</th>
                  <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Current Readiness</th>
                  <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">What This Enables</th>
                </tr>
              </thead>
              <tbody>
                \${aptitudeResults.map(apt => \`
                  <tr style="\${apt.percentage >= 75 ? 'background: #d4edda;' : apt.percentage >= 50 ? 'background: #fff3cd;' : 'background: #f8d7da;'}">
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">\${apt.domain}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">\${apt.correct}/\${apt.total}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">\${apt.percentage.toFixed(0)}%</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">
                      \${apt.percentage >= 75 ? '<strong style="color: #155724;">READY NOW</strong>' :
                        apt.percentage >= 50 ? '<strong style="color: #856404;">WITH DEVELOPMENT</strong>' :
                        '<strong style="color: #721c24;">EXPLORATORY ONLY</strong>'}
                    </td>
                    <td style="padding: 10px; border: 1px solid #ddd; font-size: 0.9em;">
                      \${apt.domain === 'Numerical Reasoning' ? 'Mathematics, Science, Engineering, Finance, Data Analysis' :
                        apt.domain === 'Logical Reasoning' ? 'Problem-solving, Programming, Strategy, Research, Analytics' :
                        apt.domain === 'Verbal Reasoning' ? 'Communication, Writing, Teaching, Law, Humanities' :
                        'Design, Architecture, Engineering, Art, Visualization'}
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>

            <div style="margin-top: 25px; padding: 20px; background: #fff9e6; border-left: 5px solid #f0ad4e; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #856404;">📋 Interpreting Your Aptitude Results</h3>
              <div style="font-size: 1.05em; line-height: 1.8;">
                <p style="margin-bottom: 15px;"><strong>READY NOW (\${aptitudeResults.filter(a => a.percentage >= 75).length} domains):</strong></p>
                <ul style="margin: 5px 0 15px 25px;">
                  \${aptitudeResults.filter(a => a.percentage >= 75).map(a => \`
                    <li><strong>\${a.domain}</strong> – You demonstrate strong capability in this area. Academic pathways requiring this aptitude are well-matched to your current strengths.</li>
                  \`).join('')}
                  \${aptitudeResults.filter(a => a.percentage >= 75).length === 0 ? '<li><em>No domains currently at this level. Focus on development areas below.</em></li>' : ''}
                </ul>

                <p style="margin-bottom: 15px;"><strong>WITH DEVELOPMENT (\${aptitudeResults.filter(a => a.percentage >= 50 && a.percentage < 75).length} domains):</strong></p>
                <ul style="margin: 5px 0 15px 25px;">
                  \${aptitudeResults.filter(a => a.percentage >= 50 && a.percentage < 75).map(a => \`
                    <li><strong>\${a.domain}</strong> – You show foundational ability. With focused practice and skill-building, pathways requiring this aptitude become viable options.</li>
                  \`).join('')}
                  \${aptitudeResults.filter(a => a.percentage >= 50 && a.percentage < 75).length === 0 ? '<li><em>No domains in this range.</em></li>' : ''}
                </ul>

                <p style="margin-bottom: 15px;"><strong>EXPLORATORY ONLY (\${aptitudeResults.filter(a => a.percentage < 50).length} domains):</strong></p>
                <ul style="margin: 5px 0 0 25px;">
                  \${aptitudeResults.filter(a => a.percentage < 50).map(a => \`
                    <li><strong>\${a.domain}</strong> – Current performance suggests this may not align with natural strengths. Pathways heavily dependent on this aptitude may require significant effort or may not be the best fit.</li>
                  \`).join('')}
                  \${aptitudeResults.filter(a => a.percentage < 50).length === 0 ? '<li><em>No domains in this range – strong overall performance!</em></li>' : ''}
                </ul>
              </div>
            </div>

            <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-left: 5px solid #2196F3; border-radius: 8px;">
              <h4 style="margin-top: 0; color: #1976D2;">💡 For Parents: How to Use This Information</h4>
              <p style="font-size: 1.05em; line-height: 1.7; margin: 0;">
                Aptitude scores reveal where your child currently excels and where additional support may be needed. 
                The upcoming <strong>Decision Tables (Class 10 & 12)</strong> will show how these aptitude strengths map to specific academic streams and course families. 
                Remember: aptitudes can be developed—these are snapshots of current ability, not fixed ceilings.
              </p>
            </div>
          </div>

          <!-- Page 3: Preference Domain Analysis -->`;

console.log('Step 1: Enhancing aptitude section...');
// Find and replace the old "Page 2: Detailed Charts" section
const oldPage2Start = '          <!-- Page 2: Detailed Charts -->';
const oldPage2HeaderEnd = '            <h2>Domain Scores Breakdown</h2>';

if (content.includes(oldPage2Start) && content.includes(oldPage2HeaderEnd)) {
  const newPage2Header = `          <!-- Page 2: Aptitude Ability Snapshot -->
          <div class="page">
            <div class="header">
              <h1>Aptitude Ability Snapshot</h1>
              <p style="font-size: 1.1em; color: #666; margin-top: 10px;">Objective Assessment of Current Academic Readiness</p>
            </div>

            <div style="background: #e8f4f8; padding: 20px; border-left: 5px solid #006D77; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="margin-top: 0; color: #006D77;">📊 Understanding Aptitude Scores</h3>
              <p style="font-size: 1.05em; line-height: 1.7; margin-bottom: 12px;">
                This section reflects <strong>objective ability-based questions</strong> with right or wrong answers. 
                Unlike preferences (what you enjoy), aptitudes measure what you can currently do well. 
                These are <em>current snapshots</em> that can improve with practice and development.
              </p>
              <p style="font-size: 1.05em; line-height: 1.7; margin: 0;">
                <strong>Four Key Domains Assessed:</strong>
              </p>
              <ul style="font-size: 1.05em; line-height: 1.8; margin: 10px 0 0 25px;">
                <li><strong>Numerical Reasoning:</strong> Ability to work with numbers, calculations, mathematical patterns</li>
                <li><strong>Logical Reasoning:</strong> Problem-solving, pattern recognition, analytical thinking</li>
                <li><strong>Verbal Reasoning:</strong> Language comprehension, vocabulary, communication clarity</li>
                <li><strong>Spatial Reasoning:</strong> Visual-spatial awareness, design thinking, 3D visualization</li>
              </ul>
            </div>

            <h2 style="color: #006D77; margin-top: 25px;">Your Aptitude Performance</h2>`;
  
  content = content.replace(
    oldPage2Start + '\n          <div class="page">\n            <div class="header">\n              <h1>Detailed Analysis & Charts</h1>\n            </div>\n\n            <h2>Domain Scores Breakdown</h2>',
    newPage2Header + enhancedAptitudeSection
  );
  console.log('✓ Page 2 transformed to Aptitude Ability Snapshot');
  changeCount++;
} else {
  console.log('✗ Could not find Page 2 markers');
}

// Save the file
fs.writeFileSync(filePath, content, 'utf8');
console.log(`\n✅ Phase 1 Complete! Applied ${changeCount} changes.`);
console.log('Next: Run additional enhancement scripts for decision tables and career clusters.\n');
