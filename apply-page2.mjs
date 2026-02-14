import fs from 'fs';

const file = './client/src/pages/CareerAssessment.tsx';
let content = fs.readFileSync(file, 'utf8');

console.log('Step 2: Adding Page 2 with Aptitude Ability Snapshot...\n');

// Find where Page 1 ends - right before Brain Dominance section
const brainIdx = content.indexOf('<h3 style="color: #006D77;">Brain Dominance Insights</h3>');

if (brainIdx > 0) {
  // Find the recommendations div opening before Brain
  const searchBack = content.substring(Math.max(0, brainIdx - 300), brainIdx);
  const recommendationsStart = searchBack.lastIndexOf('<div class="recommendations">');
  const actualStart = brainIdx - (searchBack.length - recommendationsStart);
  
  // Find Page 1 closing div before this point
  const page1End = content.lastIndexOf('</div>\n\n\n            <div class="recommendations">', actualStart);
  
  if (page1End > 0) {
    const beforeInsert = content.substring(0, page1End + 6);
    const afterInsert = content.substring(page1End + 6);
    
    const newPage2 = `
          </div>

          <!-- Page 2: Aptitude Ability Snapshot -->
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
              <ul style="font-size: 1.05em; line-height: 1.8; margin: 10px 0 0 25px;">
                <li><strong>Numerical/Logical/Verbal/Spatial Reasoning</strong> measured objectively</li>
              </ul>
            </div>

            <h2 style="color: #006D77;">Your Aptitude Performance</h2>
            <p style="font-size: 1.05em; margin: 15px 0;">
              Review your scores from the 16 objective aptitude questions. These results inform the readiness bands on the following pages.
            </p>
          </div>

          <!-- Page 3: Brain Hemisphere & Learning Style Analysis -->
          <div class="page">
            <div class="header">
              <h1>Brain Hemisphere & Learning Style</h1>
            </div>
`;
    
    const finalContent = beforeInsert + newPage2 + afterInsert;
    fs.writeFileSync(file, finalContent, 'utf8');
    
    console.log('✓ Page 2 added successfully');
    console.log('✓ Page 3 marker added');
    console.log('\n✅ Step 2 complete!\n');
  } else {
    console.log('✗ Could not find Page 1 end marker');
  }
} else {
  console.log('✗ Could not find Brain Dominance section');
}
