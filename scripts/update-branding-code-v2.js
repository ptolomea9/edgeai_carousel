const fs = require('fs');
const path = require('path');

// Read the workflow data
const toolResultPath = 'C:/Users/shawh/.claude/projects/C--Users-shawh-OneDrive-Desktop-EdgeAI-Carousel/f3e1aef2-00e1-4421-859d-c835a6a46308/tool-results/mcp-n8n-mcp-n8n_get_workflow-1768170640067.txt';
const data = JSON.parse(fs.readFileSync(toolResultPath));
const workflow = JSON.parse(data[0].text).data;
const node = workflow.nodes.find(n => n.name === 'Build json2video Payload');
let code = node.parameters.jsCode;

// Strategy: Find the BRANDING section specifically and modify only that
// The branding section starts with "// BRANDING" and ends before "scenes.push"

const brandingStart = code.indexOf('// BRANDING');
const brandingEnd = code.indexOf('scenes.push', brandingStart);

if (brandingStart === -1) {
  console.error('Could not find // BRANDING comment');
  process.exit(1);
}

const beforeBranding = code.substring(0, brandingStart);
let brandingSection = code.substring(brandingStart, brandingEnd);
const afterBranding = code.substring(brandingEnd);

console.log('=== ORIGINAL BRANDING SECTION ===');
console.log(brandingSection);
console.log('');

// Apply fixes to branding section only:
// 1. Update comment
brandingSection = brandingSection.replace(
  '// BRANDING - styled like headline for the art style, at bottom center',
  '// BRANDING - bottom-right corner watermark'
);

// 2. Change justify-content: center to flex-end with padding (in branding only)
brandingSection = brandingSection.replace(
  'justify-content: center;">',
  'justify-content: flex-end; padding-right: 30px;">'
);

// 3. Add opacity: 0.85 before the closing quote of the inner div style
// Find: border-radius: 6px;\n        ">
brandingSection = brandingSection.replace(
  'border-radius: 6px;\n        ">',
  'border-radius: 6px;\n          opacity: 0.85;\n        ">'
);

// 4. Change y: 1750 to y: 1800
brandingSection = brandingSection.replace('y: 1750', 'y: 1800');

console.log('=== UPDATED BRANDING SECTION ===');
console.log(brandingSection);
console.log('');

// Verify the changes in branding section
console.log('=== VERIFICATION (branding section only) ===');
console.log('Has flex-end:', brandingSection.includes('flex-end'));
console.log('Has padding-right:', brandingSection.includes('padding-right: 30px'));
console.log('Has y: 1800:', brandingSection.includes('y: 1800'));
console.log('Has opacity: 0.85:', brandingSection.includes('opacity: 0.85'));
console.log('Has updated comment:', brandingSection.includes('bottom-right corner watermark'));
console.log('');

// Combine back
const newCode = beforeBranding + brandingSection + afterBranding;

// Double check body section wasn't affected
const bodySection = newCode.substring(
  newCode.indexOf('// BODY'),
  newCode.indexOf('// BRANDING')
);
console.log('=== BODY SECTION CHECK ===');
console.log('Body has justify-content: center:', bodySection.includes('justify-content: center'));
console.log('Body does NOT have flex-end:', !bodySection.includes('flex-end'));

// Output the updated code to a file
const outputPath = path.join(__dirname, 'updated-json2video-code.js');
fs.writeFileSync(outputPath, newCode);
console.log('');
console.log('Updated code written to:', outputPath);
console.log('Code length:', newCode.length, 'characters');
