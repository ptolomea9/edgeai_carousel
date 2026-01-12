const fs = require('fs');
const path = require('path');

// Read the static workflow data
const toolResultPath = 'C:/Users/shawh/.claude/projects/C--Users-shawh-OneDrive-Desktop-EdgeAI-Carousel/f3e1aef2-00e1-4421-859d-c835a6a46308/tool-results/mcp-n8n-mcp-n8n_get_workflow-1768170640902.txt';
const data = JSON.parse(fs.readFileSync(toolResultPath));
const workflow = JSON.parse(data[0].text).data;
const node = workflow.nodes.find(n => n.name === 'Generate Slide Prompts');
let code = node.parameters.jsCode;

console.log('=== ORIGINAL CODE ANALYSIS ===');
console.log('Has branding check:', code.includes('webhookData.branding'));
console.log('Has BRANDING in textPrompt:', code.includes('BRANDING') && code.includes('textPrompt'));
console.log('');

// The code currently builds textPrompt without branding
// We need to add branding instructions after the body text section

// Find where textPrompt is constructed - look for the pattern
const textPromptStart = code.indexOf('const textPrompt = `');
if (textPromptStart === -1) {
  console.error('Could not find textPrompt construction');
  process.exit(1);
}

// Find the end of the textPrompt template literal
let braceCount = 0;
let inTemplate = false;
let textPromptEnd = -1;
for (let i = textPromptStart; i < code.length; i++) {
  if (code[i] === '`' && code[i-1] !== '\\') {
    if (!inTemplate) {
      inTemplate = true;
    } else {
      textPromptEnd = i + 1;
      break;
    }
  }
}

if (textPromptEnd === -1) {
  console.error('Could not find end of textPrompt');
  process.exit(1);
}

// Extract the textPrompt section
const textPromptSection = code.substring(textPromptStart, textPromptEnd);
console.log('=== CURRENT textPrompt SECTION ===');
console.log(textPromptSection.substring(0, 500) + '...');
console.log('');

// We need to add branding logic BEFORE the textPrompt construction
// Add a branding prompt builder

const brandingBuilder = `
  // Build branding prompt for bottom-right watermark
  let brandingPrompt = '';
  if (webhookData.branding && webhookData.branding.text) {
    const brandText = webhookData.branding.text.replace(/"/g, "'");
    brandingPrompt = \`

BRANDING WATERMARK at BOTTOM-RIGHT CORNER: "\${brandText}"
Small subtle text (about 50% of headline size), same font family and color as headline.
Position: Bottom-right corner with slight padding from edges.
Style: Subtle, semi-transparent watermark, should not distract from main content.\`;
  }

`;

// Insert the branding builder before the textPrompt construction
const beforeTextPrompt = code.substring(0, textPromptStart);
const afterTextPromptStart = code.substring(textPromptStart);

// Modify textPrompt to include brandingPrompt - add it before the final style reinforcement
// Find where ${textStyle.background} is in the textPrompt and add brandingPrompt before it
let modifiedTextPrompt = afterTextPromptStart;

// The textPrompt ends with: ${textStyle.background}...\${styleReinforcement}\`;
// We want to add ${brandingPrompt} just before ${textStyle.background}
modifiedTextPrompt = modifiedTextPrompt.replace(
  '${textStyle.background}',
  '${brandingPrompt}\n\n${textStyle.background}'
);

const newCode = beforeTextPrompt + brandingBuilder + modifiedTextPrompt;

// Verify the changes
console.log('=== VERIFICATION ===');
console.log('Has brandingPrompt builder:', newCode.includes('let brandingPrompt'));
console.log('Has BRANDING WATERMARK:', newCode.includes('BRANDING WATERMARK'));
console.log('Has brandingPrompt in textPrompt:', newCode.includes('${brandingPrompt}'));
console.log('');

// Write the updated code
const outputPath = path.join(__dirname, 'updated-static-code.js');
fs.writeFileSync(outputPath, newCode);
console.log('Updated code written to:', outputPath);
console.log('Code length:', newCode.length, 'characters');
