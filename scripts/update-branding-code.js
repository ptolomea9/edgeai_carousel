const fs = require('fs');
const path = require('path');

// Read the workflow data
const toolResultPath = 'C:/Users/shawh/.claude/projects/C--Users-shawh-OneDrive-Desktop-EdgeAI-Carousel/f3e1aef2-00e1-4421-859d-c835a6a46308/tool-results/mcp-n8n-mcp-n8n_get_workflow-1768170640067.txt';
const data = JSON.parse(fs.readFileSync(toolResultPath));
const workflow = JSON.parse(data[0].text).data;
const node = workflow.nodes.find(n => n.name === 'Build json2video Payload');
const code = node.parameters.jsCode;

// Find and replace the branding section
// Look for the pattern: // BRANDING ... y: 1750 ... });
const brandingRegex = /(\/\/ BRANDING[^]*?justify-content: )center(;[^]*?y: )1750([^]*?\}\);)/;

const match = code.match(brandingRegex);
if (!match) {
  console.error('Could not find branding section with expected pattern');
  console.log('Looking for center and y: 1750...');
  console.log('Has justify-content: center:', code.includes('justify-content: center'));
  console.log('Has y: 1750:', code.includes('y: 1750'));
  process.exit(1);
}

// Apply the fixes:
// 1. Change justify-content: center to flex-end with padding
// 2. Change y: 1750 to y: 1800
// 3. Add opacity: 0.85

let newCode = code;

// Fix 1: Replace justify-content: center with flex-end and add padding
newCode = newCode.replace(
  'justify-content: center;">',
  'justify-content: flex-end; padding-right: 30px;">'
);

// Fix 2: Change y: 1750 to y: 1800 (only in branding section - it's the last one)
// Find the branding section and modify only that y value
const brandingSectionStart = newCode.indexOf('// BRANDING');
const brandingSectionEnd = newCode.indexOf('scenes.push', brandingSectionStart);
const beforeBranding = newCode.substring(0, brandingSectionStart);
const brandingSection = newCode.substring(brandingSectionStart, brandingSectionEnd);
const afterBranding = newCode.substring(brandingSectionEnd);

// Replace y: 1750 with y: 1800 in branding section
const updatedBranding = brandingSection.replace('y: 1750', 'y: 1800');

// Fix 3: Add opacity: 0.85 to the branding inner div (before the closing ")
const updatedBrandingWithOpacity = updatedBranding.replace(
  'border-radius: 6px;\n        "',
  'border-radius: 6px;\n          opacity: 0.85;\n        "'
);

// Fix 4: Update the comment
const finalBranding = updatedBrandingWithOpacity.replace(
  '// BRANDING - styled like headline for the art style, at bottom center',
  '// BRANDING - bottom-right corner watermark'
);

newCode = beforeBranding + finalBranding + afterBranding;

// Verify the changes
console.log('=== VERIFICATION ===');
console.log('Has flex-end:', newCode.includes('flex-end'));
console.log('Has padding-right:', newCode.includes('padding-right: 30px'));
console.log('Has y: 1800:', newCode.includes('y: 1800'));
console.log('Has opacity: 0.85:', newCode.includes('opacity: 0.85'));
console.log('Has updated comment:', newCode.includes('bottom-right corner watermark'));
console.log('');

// Output the updated code to a file
const outputPath = path.join(__dirname, 'updated-json2video-code.js');
fs.writeFileSync(outputPath, newCode);
console.log('Updated code written to:', outputPath);
console.log('Code length:', newCode.length, 'characters');
