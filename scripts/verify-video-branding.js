const https = require('https');
require('dotenv').config({ path: '.env.local' });

const options = {
  hostname: 'edgeaimedia.app.n8n.cloud',
  path: '/api/v1/workflows/0MpzxUS4blJI7vgm',
  method: 'GET',
  headers: {
    'X-N8N-API-KEY': process.env.N8N_API_KEY || ''
  }
};

const expectedPatterns = [
  'justify-content: flex-end',
  'padding-right: 30px',
  'y: 1800',
  'opacity: 0.85',
  'bottom-right corner watermark'
];

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const workflow = JSON.parse(data);
      const node = workflow.nodes.find(n => n.name === 'Build json2video Payload');
      const code = node?.parameters?.jsCode || '';

      console.log('=== TEST 1: Video Workflow Branding Verification ===');
      console.log('');

      let allPassed = true;
      for (const pattern of expectedPatterns) {
        const found = code.includes(pattern);
        console.log((found ? '✅' : '❌') + ' Contains "' + pattern + '":', found);
        if (!found) allPassed = false;
      }

      // Also check that body section still has center (not flex-end)
      const brandingStart = code.indexOf('// BRANDING');
      if (brandingStart > 0) {
        const bodySection = code.substring(0, brandingStart);
        const bodyHasCenter = bodySection.includes('justify-content: center');
        console.log((bodyHasCenter ? '✅' : '❌') + ' Body section still uses center:', bodyHasCenter);
        if (!bodyHasCenter) allPassed = false;
      }

      console.log('');
      console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    } catch (e) {
      console.error('Parse error:', e.message);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});
req.on('error', (e) => console.error('Error:', e.message));
req.end();
