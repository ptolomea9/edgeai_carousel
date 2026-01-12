// Dual Image Generation: Clean (for video) + Text-Baked (for static)
// Clean images go to Kling 2.6 animation, text-baked go to email/gallery
const stylePrompts = {
  'synthwave': 'STRICT STYLE: Synthwave/Retrowave aesthetic only. Neon pink, cyan, and purple color palette. Sunset gradient backgrounds with orange/pink hues. Retro 80s Miami Vice style. Palm tree silhouettes. Glowing grid lines on horizon. Neon glow effects on all elements. Chrome and metallic accents. DO NOT use photorealistic rendering. DO NOT use natural lighting. Keep the retro-futuristic neon aesthetic consistent.',

  'anime': 'STRICT STYLE: Japanese anime/manga illustration only. Bold clean black outlines on all elements. Cel-shaded flat coloring with minimal gradients. Large expressive eyes. Vibrant saturated colors. Anime-style hair with defined strands. Simple backgrounds with speed lines or color gradients. DO NOT use photorealistic rendering. DO NOT use 3D shading. Keep the 2D anime aesthetic consistent.',

  '3d-pixar': 'STRICT STYLE: 3D Pixar/Disney animation style only. Smooth subsurface scattering on skin. Warm soft lighting with rim lights. Slightly exaggerated proportions. Large expressive eyes. Friendly approachable character design. Soft ambient occlusion shadows. High-quality CGI rendering. Appealing rounded shapes. DO NOT use flat 2D style. Keep the 3D animated film aesthetic consistent.',

  'watercolor': 'STRICT STYLE: Traditional watercolor painting only. Visible brush strokes and paper texture. Soft bleeding edges where colors meet. Muted pastel color palette. Organic flowing shapes. Wet-on-wet watercolor effects. White paper showing through as highlights. Artistic painterly quality. DO NOT use sharp digital edges. DO NOT use photorealistic rendering. Keep the hand-painted watercolor aesthetic consistent.',

  'minimalist': 'STRICT STYLE: Flat minimalist corporate illustration only. Simple geometric shapes. Limited color palette (2-4 muted professional colors). NO gradients or shadows. NO photorealistic elements. NO detailed textures. Clean vector-style edges. Modern flat design aesthetic like tech company illustrations. Simple solid color backgrounds. Stylized simplified character features. DO NOT use 3D rendering. DO NOT use realistic lighting. Keep the flat minimalist aesthetic consistent across all slides.',

  'comic': 'STRICT STYLE: American comic book illustration only. Bold black ink outlines on everything. Ben-Day dots/halftone shading patterns. Dynamic dramatic angles. Action lines for movement. Bright primary colors. High contrast shadows. Pop art aesthetic. NO speech bubbles or text boxes in the image. DO NOT use photorealistic rendering. DO NOT use soft shading. Keep the comic book aesthetic consistent.',

  'photorealistic': 'STRICT STYLE: Photorealistic digital art rendering. Highly detailed textures and materials. Natural lighting with realistic shadows. Accurate human proportions. Detailed skin textures and pores. Realistic fabric and material rendering. Professional photography quality. Shallow depth of field where appropriate. Keep the photorealistic quality consistent across all slides.',

  'custom': '' // Will use customStylePrompt from webhook data
};

// Text style mapping for text-baked images - MATCHES json2video overlay styling
const textStylePrompts = {
  'synthwave': {
    headline: 'Use ORBITRON-style futuristic blocky font for headline, glowing BRIGHT MAGENTA (#FF00FF) color, with strong neon glow effect (pink/magenta glow around text)',
    body: 'Use ORBITRON-style futuristic font for body text, BRIGHT MAGENTA (#FF00FF) color with subtle neon glow',
    background: 'Text on semi-transparent black rounded rectangle background (40% opacity)'
  },
  'anime': {
    headline: 'Use BANGERS-style bold comic display font for headline, CORAL RED (#FF6B6B) color, with black stroke/outline around letters',
    body: 'Use BANGERS-style bold font for body text, CORAL RED (#FF6B6B) color with black outline',
    background: 'Text on semi-transparent black rounded rectangle background (40% opacity)'
  },
  '3d-pixar': {
    headline: 'Use FREDOKA ONE-style friendly rounded bubble font for headline, GOLDEN YELLOW (#FFD93D) color, with soft drop shadow',
    body: 'Use FREDOKA ONE-style rounded friendly font for body text, GOLDEN YELLOW (#FFD93D) color with soft shadow',
    background: 'Text on semi-transparent black rounded rectangle background (40% opacity)'
  },
  'watercolor': {
    headline: 'Use PACIFICO-style elegant cursive script font for headline, WARM BROWN (#5C4033) color, with subtle white glow/halo',
    body: 'Use PACIFICO-style elegant script font for body text, WARM BROWN (#5C4033) color',
    background: 'Text on semi-transparent white rounded rectangle background (40% opacity)'
  },
  'minimalist': {
    headline: 'Use MONTSERRAT-style clean modern sans-serif font for headline, NEAR BLACK (#1A1A1A) color, no effects',
    body: 'Use MONTSERRAT-style clean sans-serif font for body text, NEAR BLACK (#1A1A1A) color, no effects',
    background: 'Text on semi-transparent white rounded rectangle background (50% opacity)'
  },
  'comic': {
    headline: 'Use BANGERS-style bold comic display font for headline, BRIGHT YELLOW (#FFFF00) color, with thick black stroke/outline',
    body: 'Use BANGERS-style bold comic font for body text, BRIGHT YELLOW (#FFFF00) color with black outline',
    background: 'Text on semi-transparent black rounded rectangle background (40% opacity)'
  },
  'photorealistic': {
    headline: 'Use PLAYFAIR DISPLAY-style elegant serif font for headline, WHITE (#FFFFFF) color, with soft dark drop shadow',
    body: 'Use PLAYFAIR DISPLAY-style elegant serif font for body text, WHITE (#FFFFFF) color with subtle shadow',
    background: 'Text on semi-transparent black rounded rectangle background (40% opacity)'
  },
  'custom': {
    headline: 'Use ROBOTO-style clean modern sans-serif font for headline, WHITE (#FFFFFF) color, with subtle drop shadow',
    body: 'Use ROBOTO-style clean sans-serif font for body text, WHITE (#FFFFFF) color',
    background: 'Text on semi-transparent black rounded rectangle background (40% opacity)'
  }
};

// Get input data
const webhookData = $('Extract Config').first().json;
const visionResponse = $input.first().json;

// Extract character description from vision analysis
let characterDescription = '';
try {
  const content = visionResponse.choices?.[0]?.message?.content || '';
  characterDescription = content;
} catch (e) {
  characterDescription = 'character from the reference image';
}

// Get style prompt
let stylePrompt = stylePrompts[webhookData.artStyle] || stylePrompts['custom'];
if (webhookData.artStyle === 'custom' && webhookData.customStylePrompt) {
  stylePrompt = webhookData.customStylePrompt;
}

const textStyle = textStylePrompts[webhookData.artStyle] || textStylePrompts['custom'];

// Build prompts for each slide
const slides = webhookData.slides || [];
const outputType = webhookData.outputType || 'static';

const slidePrompts = slides.map((slide, index) => {
  // Build character action description
  let characterAction = slide.characterAction || '';
  if (!characterAction) {
    // Default actions based on slide position
    if (index === 0) {
      characterAction = 'in a welcoming pose, facing the viewer';
    } else if (index === slides.length - 1) {
      characterAction = 'in a confident, concluding pose';
    } else {
      characterAction = 'in an engaging, dynamic pose';
    }
  }

  // Style reinforcement
  const styleReinforcement = `\n\nCRITICAL: This is slide ${index + 1} of ${slides.length}. Maintain EXACTLY the same ${webhookData.artStyle} visual style as all other slides. Do not drift toward photorealism or other styles.`;

  // CLEAN PROMPT - no text (for Kling 2.6 video animation)
  const cleanPrompt = `${stylePrompt}\n\nScene: ${characterDescription} ${characterAction}.${styleReinforcement}`;

  // TEXT PROMPT - with text baked in (for static email/gallery)
  // Escape quotes in headline/body for prompt safety
  const safeHeadline = (slide.headline || '').replace(/"/g, "'");
  const safeBodyText = (slide.bodyText || '').replace(/"/g, "'").replace(/\n/g, ' ');
  
  
  // Build branding prompt for bottom-right watermark
  let brandingPrompt = '';
  if (webhookData.branding && webhookData.branding.text) {
    const brandText = webhookData.branding.text.replace(/"/g, "'");
    brandingPrompt = `

BRANDING WATERMARK at BOTTOM-RIGHT CORNER: "${brandText}"
Small subtle text (about 50% of headline size), same font family and color as headline.
Position: Bottom-right corner with slight padding from edges.
Style: Subtle, semi-transparent watermark, should not distract from main content.`;
  }

const textPrompt = `${stylePrompt}\n\nScene: ${characterDescription} ${characterAction}.\n\nTEXT OVERLAY REQUIREMENTS (CRITICAL - MUST BE VISIBLE AND READABLE):\n\nHEADLINE at TOP of image: "${safeHeadline}"\n${textStyle.headline}\nPosition: Centered horizontally, near top of image with padding\n\nBODY TEXT at CENTER of image: "${safeBodyText}"\n${textStyle.body}\nPosition: Centered horizontally, in middle-lower area of image\n\n${brandingPrompt}

${textStyle.background}\n\nText must be LARGE, BOLD, and CLEARLY READABLE. Text should NOT obscure the main character.${styleReinforcement}`;

  return {
    slideNumber: slide.slideNumber || index + 1,
    headline: slide.headline || '',
    bodyText: slide.bodyText || '',
    characterAction: characterAction,
    cleanPrompt: cleanPrompt,   // For video animation (no text)
    textPrompt: textPrompt,     // For static output (text baked in)
    artStyle: webhookData.artStyle
  };
});

return {
  json: {
    ...webhookData,
    characterDescription,
    stylePrompt,
    slidePrompts,
    outputType
  }
};