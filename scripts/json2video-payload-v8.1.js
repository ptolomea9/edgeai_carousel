// Build json2video API payload for merging video clips with text overlays
// v7.0: Added kinetic typography animations for headlines
// v7.1: Added soundtrack with infinite loop to support any video length (3-10+ slides)
const data = $input.first().json;

if (!data.videoClips || data.videoClips.length === 0) {
  return [{
    json: {
      error: 'No video clips to merge',
      payload: null,
      generationId: data.generationId,
      recipientEmail: data.recipientEmail,
      videoClips: [],
      totalClips: 0,
      successCount: 0,
      allSuccess: false
    }
  }];
}

// Text sanitization function to fix common formatting issues
function sanitizeText(text) {
  if (!text) return '';
  return text
    .replace(/:\s*-\s*/g, ': ')
    .replace(/^\s*-\s*/g, '')
    .replace(/!{2,}/g, '!')
    .replace(/[!?.:,]+$/g, match => match[0])
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Format body text as HTML for proper bullet/paragraph rendering
function formatBodyTextAsHtml(text, style) {
  if (!text) return null;

  const lines = text.split('\n');
  const hasBullets = lines.some(line => line.trim().startsWith('-'));

  if (hasBullets) {
    let html = '';
    let inList = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-')) {
        if (!inList) {
          html += '<ul style="list-style-type: disc; padding-left: 20px; margin: 10px 0; text-align: left;">';
          inList = true;
        }
        html += `<li style="margin: 8px 0;">${trimmed.substring(1).trim()}</li>`;
      } else if (trimmed) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<p style="margin: 8px 0;">${trimmed}</p>`;
      }
    }
    if (inList) html += '</ul>';

    return html;
  } else {
    return text.split('\n').filter(l => l.trim()).map(l =>
      `<p style="margin: 8px 0;">${l.trim()}</p>`
    ).join('');
  }
}

// ============================================================
// TEXT ANIMATION MAPPING - Art style specific kinetic typography
// ============================================================
// Animation style IDs from json2video:
// 001 = Static, 002 = Fade In, 003 = Word-by-Word, 004 = Letter-by-Letter
// 005 = Jumping, 006 = Revealing, 007 = Domino, 008 = Split
// 009 = Free Entry, 010 = Free Exit, 011 = Block Display
// ============================================================
const textAnimationByStyle = {
  'synthwave': '005',      // jumping - energetic neon vibes
  'anime': '003',          // word-by-word - dramatic reveal
  '3d-pixar': '002',       // fade in - smooth, friendly
  'watercolor': '006',     // revealing - artistic, flowing
  'minimalist': '002',     // fade in - clean, professional
  'comic': '005',          // jumping - dynamic action
  'photorealistic': '002', // fade in - subtle, elegant
  'custom': '003'          // word-by-word - default
};

// Art style to text styling mapping
const artStyleTextMap = {
  'synthwave': {
    headlineFont: 'Orbitron',
    headlineColor: '#ff00ff',
    headlineSize: 72,
    headlineShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff',
    bodyFont: 'Orbitron',
    bodyColor: '#ff00ff',
    bodySize: 64,
    bodyShadow: '0 0 8px #ff00ff, 0 0 16px #ff00ff',
    bgColor: 'rgba(0,0,0,0.4)'
  },
  'anime': {
    headlineFont: 'Bangers',
    headlineColor: '#ff6b6b',
    headlineSize: 68,
    headlineShadow: '3px 3px 0 #000000, -1px -1px 0 #ffffff',
    bodyFont: 'Bangers',
    bodyColor: '#ff6b6b',
    bodySize: 60,
    bodyShadow: '2px 2px 0 #000000',
    bgColor: 'rgba(0,0,0,0.4)'
  },
  '3d-pixar': {
    headlineFont: 'Fredoka One',
    headlineColor: '#ffd93d',
    headlineSize: 64,
    headlineShadow: '3px 3px 6px rgba(0,0,0,0.4)',
    bodyFont: 'Fredoka One',
    bodyColor: '#ffd93d',
    bodySize: 56,
    bodyShadow: '2px 2px 4px rgba(0,0,0,0.4)',
    bgColor: 'rgba(0,0,0,0.4)'
  },
  'watercolor': {
    headlineFont: 'Pacifico',
    headlineColor: '#5c4033',
    headlineSize: 60,
    headlineShadow: '2px 2px 4px rgba(255,255,255,0.5)',
    bodyFont: 'Pacifico',
    bodyColor: '#5c4033',
    bodySize: 54,
    bodyShadow: '1px 1px 3px rgba(255,255,255,0.5)',
    bgColor: 'rgba(255,255,255,0.4)'
  },
  'minimalist': {
    headlineFont: 'Montserrat',
    headlineColor: '#1a1a1a',
    headlineSize: 56,
    headlineShadow: 'none',
    bodyFont: 'Montserrat',
    bodyColor: '#1a1a1a',
    bodySize: 48,
    bodyShadow: 'none',
    bgColor: 'rgba(255,255,255,0.5)'
  },
  'comic': {
    headlineFont: 'Bangers',
    headlineColor: '#ffff00',
    headlineSize: 72,
    headlineShadow: '4px 4px 0 #000000, -2px -2px 0 #000000',
    bodyFont: 'Bangers',
    bodyColor: '#ffff00',
    bodySize: 64,
    bodyShadow: '2px 2px 0 #000000',
    bgColor: 'rgba(0,0,0,0.4)'
  },
  'photorealistic': {
    headlineFont: 'Playfair Display',
    headlineColor: '#ffffff',
    headlineSize: 54,
    headlineShadow: '2px 2px 8px rgba(0,0,0,0.6)',
    bodyFont: 'Playfair Display',
    bodyColor: '#ffffff',
    bodySize: 48,
    bodyShadow: '1px 1px 4px rgba(0,0,0,0.5)',
    bgColor: 'rgba(0,0,0,0.4)'
  },
  'custom': {
    headlineFont: 'Roboto',
    headlineColor: '#ffffff',
    headlineSize: 60,
    headlineShadow: '2px 2px 6px rgba(0,0,0,0.5)',
    bodyFont: 'Roboto',
    bodyColor: '#ffffff',
    bodySize: 54,
    bodyShadow: '1px 1px 4px rgba(0,0,0,0.4)',
    bgColor: 'rgba(0,0,0,0.4)'
  }
};

const artStyle = data.artStyle || 'synthwave';
const style = artStyleTextMap[artStyle] || artStyleTextMap['synthwave'];
const animationStyle = textAnimationByStyle[artStyle] || '002';
const videoDuration = 5;

const scenes = [];

for (const clip of data.videoClips) {
  const elements = [];

  // Video background
  elements.push({
    type: 'video',
    src: clip.videoUrl,
    duration: videoDuration
  });

  // ============================================================
  // HEADLINE - Native text element with KINETIC ANIMATION
  // ============================================================
  const cleanHeadline = sanitizeText(clip.headline);
  if (cleanHeadline) {
    // Determine shadow level (0-3) based on style
    let shadowLevel = 2;  // Default medium shadow
    if (style.headlineShadow === 'none') {
      shadowLevel = 0;
    } else if (style.headlineShadow.includes('40px') || style.headlineShadow.includes('20px')) {
      shadowLevel = 3;  // Strong glow (synthwave)
    }

    elements.push({
      type: 'text',
      style: animationStyle,  // Kinetic animation style ID
      text: cleanHeadline,
      duration: videoDuration,
      x: 0,
      y: 120,
      width: 1080,
      height: 0,
      settings: {
        'color': style.headlineColor,
        'font-size': `${style.headlineSize}px`,
        'font-family': style.headlineFont,
        'font-weight': 'bold',
        'text-align': 'center',
        'vertical-align': 'top',
        'shadow': shadowLevel,
        'background-color': style.bgColor
      }
    });
  }

  // ============================================================
  // BODY - HTML element (NO animation, supports bullets/formatting)
  // ============================================================
  const bodyHtml = formatBodyTextAsHtml(clip.bodyText, style);
  if (bodyHtml) {
    let textShadowCss = '';
    if (style.bodyShadow && style.bodyShadow !== 'none') {
      textShadowCss = `text-shadow: ${style.bodyShadow};`;
    }

    elements.push({
      type: 'html',
      html: `<div style="width: 1080px; display: flex; justify-content: center;">
        <div style="
          font-family: ${style.bodyFont}, sans-serif;
          font-size: ${style.bodySize}px;
          color: ${style.bodyColor};
          font-weight: bold;
          background-color: ${style.bgColor};
          ${textShadowCss}
          text-align: center;
          padding: 10px 20px;
          border-radius: 8px;
          max-width: 85%;
        ">${bodyHtml}</div>
      </div>`,
      duration: videoDuration,
      position: 'custom',
      x: 0,
      y: 800
    });
  }

  // ============================================================
  // BRANDING - HTML element (NO animation, bottom-right watermark)
  // ============================================================
  if (data.branding && data.branding.text) {
    let textShadowCss = '';
    if (style.headlineShadow && style.headlineShadow !== 'none') {
      textShadowCss = `text-shadow: ${style.headlineShadow};`;
    }

    const brandingSize = Math.round(style.headlineSize * 0.7);

    elements.push({
      type: 'html',
      html: `<div style="width: 1080px; display: flex; justify-content: flex-end; padding-right: 30px;">
        <div style="
          font-family: ${style.headlineFont}, sans-serif;
          font-size: ${brandingSize}px;
          color: ${style.headlineColor};
          font-weight: bold;
          background-color: ${style.bgColor};
          ${textShadowCss}
          text-align: center;
          padding: 8px 16px;
          border-radius: 6px;
          opacity: 0.85;
        ">${data.branding.text}</div>
      </div>`,
      duration: videoDuration,
      position: 'custom',
      x: 0,
      y: 1800
    });
  }

  scenes.push({
    elements,
    transition: {
      style: 'fade',
      duration: 0.5
    }
  });
}

// ============================================================
// BUILD FINAL PAYLOAD WITH OPTIONAL SOUNDTRACK
// ============================================================
const payload = {
  resolution: 'instagram-story',
  scenes
};

// Add soundtrack if musicUrl is provided
// Uses loop: -1 (infinite) and duration: -2 (match movie length) to handle any video length
if (data.musicUrl) {
  payload.elements = [
    {
      type: 'audio',
      src: data.musicUrl,
      duration: -2,      // Match entire movie duration
      loop: -1,          // Loop indefinitely
      volume: 0.4,       // Background level (40%) so it doesn't overpower text
      'fade-out': 2      // 2 second fade out at end
    }
  ];
}

// CRITICAL: Pass through videoClips and other data for downstream nodes (email)
return [{
  json: {
    generationId: data.generationId,
    artStyle: data.artStyle,
    recipientEmail: data.recipientEmail,
    branding: data.branding,
    videoClips: data.videoClips,
    totalClips: data.totalClips,
    successCount: data.successCount,
    allSuccess: data.allSuccess,
    originalSlides: data.originalSlides,
    payload,
    payloadJson: JSON.stringify(payload)
  }
}];
