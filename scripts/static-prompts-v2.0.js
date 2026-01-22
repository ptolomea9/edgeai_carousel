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
// v5.0: Added bgOpacity and enhanced effect descriptions for consistency
const textStylePrompts = {
  'synthwave': {
    font: 'ORBITRON futuristic blocky',
    color: '#FF00FF magenta',
    effects: 'neon glow, 2px outer glow',
    bgColor: 'black',
    bgOpacity: '70%'
  },
  'anime': {
    font: 'BANGERS bold comic',
    color: '#FF6B6B coral red',
    effects: '2px black outline',
    bgColor: 'black',
    bgOpacity: '60%'
  },
  '3d-pixar': {
    font: 'FREDOKA ONE rounded bubble',
    color: '#FFD93D golden yellow',
    effects: '3px soft drop shadow',
    bgColor: 'black',
    bgOpacity: '50%'
  },
  'watercolor': {
    font: 'PACIFICO elegant script',
    color: '#5C4033 warm brown',
    effects: '2px white halo',
    bgColor: 'cream white',
    bgOpacity: '70%'
  },
  'minimalist': {
    font: 'MONTSERRAT clean sans-serif',
    color: '#1A1A1A near black',
    effects: 'none',
    bgColor: 'white',
    bgOpacity: '80%'
  },
  'comic': {
    font: 'BANGERS bold comic',
    color: '#FFFF00 bright yellow',
    effects: '3px thick black outline',
    bgColor: 'black',
    bgOpacity: '70%'
  },
  'photorealistic': {
    font: 'PLAYFAIR DISPLAY elegant serif',
    color: '#FFFFFF white',
    effects: '4px dark drop shadow',
    bgColor: 'black',
    bgOpacity: '60%'
  },
  'custom': {
    font: 'ROBOTO clean sans-serif',
    color: '#FFFFFF white',
    effects: '2px subtle shadow',
    bgColor: 'black',
    bgOpacity: '60%'
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

// Hero image adherence prompt - ensures character matches reference
const heroAdherencePrompt = `REFERENCE IMAGE ADHERENCE (CRITICAL):
The generated image MUST closely match the character/subject from the provided reference image.
- PRESERVE: Exact facial features, body proportions, species characteristics
- PRESERVE: Clothing, outfit, colors, patterns, accessories
- PRESERVE: Distinctive markings, textures, unique visual features
- PRIORITY: Reference image fidelity over artistic interpretation

`;

// Character negative prompt - prevents drift
const characterNegativePrompt = `
DO NOT change the character's appearance. DO NOT alter facial features or body shape.
DO NOT modify clothing or colors. DO NOT introduce different characters.
`;

// Build prompts for each slide
const slides = webhookData.slides || [];
const outputType = webhookData.outputType || 'static';

const slidePrompts = slides.map((slide, index) => {
  // Character consistency prompt - slide-specific
  const characterConsistencyPrompt = `CHARACTER CONSISTENCY ACROSS SLIDES (CRITICAL):
This is slide ${index + 1} of ${slides.length}. The character MUST be IDENTICAL across ALL slides:
- SAME face/head structure and features
- SAME body type and proportions
- SAME clothing/outfit/colors
- SAME distinctive markings or patterns

`;
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

  // Enhanced style reinforcement - includes character consistency
  const styleReinforcement = `

CRITICAL CONSISTENCY REQUIREMENTS:
- This is slide ${index + 1} of ${slides.length}
- Maintain EXACTLY the same ${webhookData.artStyle} visual style
- Keep the SAME character from the reference image
- Character must look identical to previous/next slides
- Do not drift toward photorealism or other styles
- Prioritize visual consistency over variation`;

  // CLEAN PROMPT - no text (for Kling 2.6 video animation)
  // v2.0: Added hero adherence and character consistency prompts
  const cleanPrompt = `${heroAdherencePrompt}${characterConsistencyPrompt}${stylePrompt}

Scene: ${characterDescription} ${characterAction}.
${characterNegativePrompt}${styleReinforcement}`;

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

// v5.0: Enhanced text prompts with exact positioning for consistency
// Anatomical lock prevents extra appendages (wings, limbs, tails)
const anatomicalLock = 'ANATOMICAL LOCK: Character MUST have EXACT same body parts as reference - NO extra wings, limbs, tails, or heads. NO duplicating or morphing body parts. No mouth movements - characters must not look like they are speaking in any way';

// Build branding instruction with exact positioning
let brandingInstruction = '';
if (webhookData.branding && webhookData.branding.text) {
  const brandText = webhookData.branding.text.replace(/"/g, "'");
  brandingInstruction = `

BRANDING WATERMARK:
- Text: "${brandText}"
- Position: BOTTOM-RIGHT corner, 5% padding from edges
- Size: 40% of headline size
- Style: Same font family, same color, ${textStyle.bgOpacity} opacity`;
}

// v5.0: Strict positioning and sizing specifications for consistent text styling
const textPrompt = `${stylePrompt}

Scene: ${characterDescription} ${characterAction}.

${anatomicalLock}

=== TEXT OVERLAY SPECIFICATIONS (MUST FOLLOW EXACTLY) ===

HEADLINE:
- Text: "${safeHeadline}"
- Position: TOP of image, 8% from top edge, HORIZONTALLY CENTERED
- Font: ${textStyle.font}, UPPERCASE
- Size: LARGE (approximately 6% of image height)
- Color: ${textStyle.color}
- Effect: ${textStyle.effects}
- Background: Rounded rectangle, ${textStyle.bgColor} at ${textStyle.bgOpacity} opacity
- Padding: 15px horizontal, 10px vertical around text

BODY TEXT:
- Text: "${safeBodyText}"
- Position: UPPER-CENTER, 25% from top edge, HORIZONTALLY CENTERED
- Font: ${textStyle.font}
- Size: MEDIUM (approximately 3.5% of image height)
- Color: ${textStyle.color}
- Effect: ${textStyle.effects}
- Background: Same style as headline - rounded rectangle, ${textStyle.bgColor} at ${textStyle.bgOpacity} opacity
- Padding: 12px horizontal, 8px vertical around text
- Max width: 85% of image width, text wraps if needed${brandingInstruction}

CONSISTENCY RULES (CRITICAL):
- ALL slides MUST use IDENTICAL text styling
- Font family: ALWAYS ${textStyle.font}
- Font color: ALWAYS ${textStyle.color}
- Background style: ALWAYS rounded rectangles with ${textStyle.bgOpacity} ${textStyle.bgColor}
- Text MUST be clearly readable - ensure sufficient contrast
- NO decorative borders, frames, or embellishments around text
- NO varying font sizes between slides
- Text backgrounds should be simple, clean, and uniform
${styleReinforcement}`;

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