# EdgeAI Carousel Creator

AI-powered carousel ad generator with character-consistent images and video output.

## Build & Run Commands

```bash
# Install dependencies
npm install

# Development server (default port 3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **React**: v19 with Server Components
- **Styling**: Tailwind CSS v4 with Radix UI primitives
- **Database**: Supabase (PostgreSQL + Storage)
- **Workflow Engine**: n8n Cloud (edgeaimedia.app.n8n.cloud)

### Project Structure
```
app/
  page.tsx                    # Main carousel creator page
  gallery/page.tsx            # Gallery of generated carousels
  api/
    generate-carousel/route.ts   # Triggers n8n static workflow
    generate-text/route.ts       # AI text generation for slides (min 2 bullets/sentences)
    generate-image/route.ts      # AI hero image editing (Gemini 3 Pro)
    status/[id]/route.ts         # Polls generation status
    gallery/route.ts             # Fetches saved generations

components/
  carousel-creator/           # Main creator UI components
    index.tsx                 # CarouselCreator main component
    types.ts                  # TypeScript types (CarouselConfig, SlideContent, etc.)
    hero-image-upload.tsx     # Hero image uploader with edit button
    hero-image-editor.tsx     # AI image editing dialog (Gemini 3 Pro)
    slide-text-editor.tsx     # Slide content editor
    art-style-picker.tsx      # Art style selection
    output-options.tsx        # Static/video/both selector
    music-library.tsx         # Background music picker
    carousel-preview.tsx      # Generation progress & results
  ui/                         # Radix UI components (button, dialog, tabs, etc.)

lib/
  n8n.ts                      # n8n webhook integration
  supabase.ts                 # Supabase client & helpers
  utils.ts                    # Utility functions (cn, etc.)
```

## External Services

### n8n Workflows
Two main workflows handle generation:

1. **Static Workflow** (ID: `UvvlI6vB4ystc3Vr`)
   - **Dual image generation**: Generates TWO images per slide (clean + text-baked)
   - Uses **GPT Image 1.5** (via kie.ai) for image-to-image generation
   - True character consistency: passes hero image as reference
   - **Per-slide character actions**: Users can specify poses/actions per slide for narrative storytelling
   - Output format: **9:16 vertical** (Instagram Reels optimized)
   - Uses `responseMode: "lastNode"` for synchronous response
   - Includes retry logic for failed slides
   - **25 nodes** total (simplified from 36)
   - **Email notification**: Sends text-baked images via Gmail

2. **Video Workflow** (ID: `0MpzxUS4blJI7vgm`)
   - **Current Version ID**: `7c1a57d5-5f56-4a8d-8e7e-54bc188443cb` (January 10, 2026)
   - Animates slides using kie.ai (Kling 2.6 model) at 720p with **5-second clips**
   - Art-style-specific animation prompts
   - Merges clips using json2video API at **1080x1920** (9:16 vertical)
   - Callbacks to production URL: `https://edgeai-carousel.vercel.app/api/status/{id}`
   - Uses `responseMode: "onReceived"` (async)
   - Email includes both merged video URL and all static slide images
   - **38 nodes** total with retry logic (up to 3 retries per slide)

### APIs Used
- **kie.ai**: Image generation (GPT Image 1.5) and image-to-video animation (Kling 2.6 model)
- **json2video**: Video concatenation with text overlays, transitions, and branding
- **Google Gemini 3 Pro**: Hero image AI editing (remove background, enhance, studio lighting, etc.)
- **OpenAI GPT-4o-mini**: Slide text auto-generation (headlines + body with min 2 bullets/sentences)
- **OpenAI GPT-4o**: Hero image analysis for character consistency descriptions
- **Supabase Storage**: Buckets for `carousel-images` and `carousel-videos`

### json2video Text Overlays
Each art style has custom text styling applied in the video:
- **Headline**: Bold, at top center, art-style-specific font/color/shadow
- **Body**: Normal weight, at vertical center, matching style
- **Branding**: At bottom-right corner (watermark), 70% of headline size, same font/color as headline

Art styles: synthwave, anime, 3d-pixar, watercolor, minimalist, comic, photorealistic, custom

### json2video Text Animation Styles
Available kinetic typography animations for text overlays:

| Style ID | Animation | Description |
|----------|-----------|-------------|
| `text/001` | Static | Plain static text |
| `text/002` | Fade In | Smooth fade entrance |
| `text/003` | Word-by-Word | Progressive word reveal |
| `text/004` | Letter-by-Letter | Typewriter effect |
| `text/005` | Jumping | Bouncing letters |
| `text/006` | Revealing | Letter reveal effect |
| `text/007` | Domino Effect | Cascading letter fall |
| `text/008` | Split Animation | Ceiling/floor split |
| `text/009` | Free Entry | Random letter entrance |
| `text/010` | Free Exit | Random letter exit |
| `text/011` | Block Display | Block text reveal |

**Animation by Art Style** (recommended mappings):
```javascript
const textAnimationByStyle = {
  'synthwave': 'text/005', // jumping (energetic)
  'anime': 'text/003',     // word-by-word (dramatic)
  '3d-pixar': 'text/002',  // fade in (smooth)
  'watercolor': 'text/006', // revealing (artistic)
  'minimalist': 'text/002', // fade in (clean)
  'comic': 'text/005',     // jumping (dynamic)
  'photorealistic': 'text/002', // fade in (subtle)
  'custom': 'text/003'     // word-by-word (default)
};
```

### Future Enhancement: Advanced Kinetic Typography APIs
For more advanced animated captions (3D spatial, trendy social styles):

| API | Best For | Docs |
|-----|----------|------|
| **Submagic** | Trendy social media captions | https://docs.submagic.co/introduction |
| **Creatomate** | Custom animation templates | https://creatomate.com/docs/api/introduction |
| **Shotstack** | Enterprise video automation | https://shotstack.io/docs/api/ |

## Environment Variables

Create `.env.local` with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# n8n
N8N_WEBHOOK_URL=https://edgeaimedia.app.n8n.cloud/webhook
N8N_API_URL=https://edgeaimedia.app.n8n.cloud/api/v1
N8N_API_KEY=your-n8n-api-key
N8N_VIDEO_WORKFLOW_ID=0MpzxUS4blJI7vgm

# OpenAI (for text generation)
OPENAI_API_KEY=your-openai-key

# Google Gemini (for hero image AI editing)
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
```

## Key Data Flow

1. User uploads hero image + configures carousel (email is **required**)
2. User can optionally edit hero image with AI (Gemini 3 Pro) via `POST /api/generate-image`
3. `POST /api/generate-carousel` triggers n8n static workflow
4. n8n generates slides with character consistency using GPT Image 1.5 (includes per-slide character actions if provided)
5. Frontend polls `GET /api/status/{id}` for progress
6. If video enabled, static workflow triggers video workflow
7. Video workflow animates slides, adds styled text overlays + branding, merges with json2video
8. Status API polls n8n for video execution status
9. Results persisted to Supabase Storage + database
10. Email sent with merged video URL + all individual slide image URLs

## Database Schema (Supabase)

### Tables
- `generations`: Main generation records (id, generation_id, status, video_url, zip_url)
- `slides`: Individual slide data (generation_id, slide_number, image_url, headline, body_text)

### Storage Buckets
- `carousel-images`: Generated slide images
- `carousel-videos`: Merged video outputs

## Per-Slide Character Actions

Users can specify character actions/poses for each slide to create narrative storytelling across the carousel.

**Example**: Hero image is an owl. Carousel about "3 Tips for Home Buyers":
- Slide 1: "owl perched on a stone bridge, wings folded neatly, head tilted curiously"
- Slide 2: "owl mid-flight with wings fully extended, soaring through dramatic clouds"
- Slide 3: "owl landing on oak branch, talons outstretched, wings braking gracefully"

**SlideContent Type**:
```typescript
interface SlideContent {
  id: string
  slideNumber: number
  headline: string
  bodyText: string
  characterAction?: string  // Per-slide pose/action description
}
```

**Best Practices** (GPT Image 1.5):
- Use Scene → Subject → Action → Environment structure
- Be specific: "standing confidently with arms crossed" not "standing"
- Include camera framing: "medium shot", "eye-level perspective"
- Limit to 3-5 key elements per action description

## Development Notes

- Dev server uses Turbopack (Next.js 16 default)
- Static workflow returns slides synchronously
- Video workflow is async - app polls n8n API for status
- n8n Cloud cannot callback to localhost - polling is required
- Comic style explicitly excludes speech bubbles in prompts

## Recent Improvements (January 2026)

### Art Style Prompt Adherence (IMPLEMENTED)
Enhanced style prompts in "Generate Slide Prompts" node to prevent style drift:
- Added "STRICT STYLE:" prefix for emphasis
- Added negative prompts ("DO NOT use photorealistic rendering", "DO NOT use 3D shading", etc.)
- Added detailed style descriptors for each art style
- Added style reinforcement at end of each prompt: "CRITICAL: This is slide X of Y. Maintain EXACTLY the same style..."

### json2video Text Visibility (IMPLEMENTED)
Enhanced text overlays in "Build json2video Payload" node for better visibility:
- Art-style-specific Google Fonts (Orbitron, Bangers, Poppins, etc.)
- Strong text shadows for contrast against any background
- More opaque backgrounds (dark instead of semi-transparent white)
- Art-style-appropriate colors (neon for synthwave, yellow for comic, etc.)
- Larger font sizes (64px headline, 48px body)

### Video Animation Settings (CURRENT)
Video clip generation configuration:

**Clip Duration**: 5 seconds per slide
- Total video length varies by slide count (see table below)
- kie.ai cost: ~$1.68/carousel

| Slides | Video Duration |
|--------|----------------|
| 3 | ~15s |
| 6 | ~30s |
| 10 | ~50s |

### Background Music / Soundtrack (IMPLEMENTED - January 12, 2026)
Music tracks are 30 seconds but video can be up to 50 seconds (10 slides × 5s).

**Solution**: json2video audio element with infinite loop:
```javascript
payload.elements = [{
  type: 'audio',
  src: musicUrl,
  duration: -2,    // Match movie length
  loop: -1,        // Infinite loop
  volume: 0.4,     // 40% volume (background level)
  'fade-out': 2    // 2s fade at end
}];
```

**Key Points**:
- Audio added at movie level (not scene level) so it plays across all scenes
- `duration: -2` extends audio to match total video length
- `loop: -1` loops the 30s track as many times as needed
- `volume: 0.4` keeps music from overpowering text/voiceover

**Local Script**: `scripts/updated-json2video-code.js` contains the v7.1 code with soundtrack support.

**Wait Times**:
| Node | Duration |
|------|----------|
| Wait 5 min | 300s |
| Wait 120s More | 120s |
| Wait 30s (json2video) | 30s |
| Wait 30s More | 30s |

### Music URL Passthrough Fix (IMPLEMENTED - January 12, 2026)
Fixed `musicUrl` being dropped in intermediate video workflow nodes, causing silent videos.

**Problem**: ElevenLabs music tracks were not playing in json2video output despite frontend correctly selecting music and API resolving `musicTrackId` to `musicUrl`.

**Root Cause**: The `musicUrl` field was extracted in "Extract Video Config" and passed through "Split Slides for Animation", but **7 intermediate nodes** in the animation pipeline were not passing it through:

1. `Extract Task ID` - ❌ Missing musicUrl
2. `Check Video Status` - ❌ Missing musicUrl
3. `Check If Retry Needed` - ❌ Missing musicUrl
4. `Format Complete Items` - ❌ Missing musicUrl
5. `Extract Final URL` - ❌ Missing musicUrl
6. `Extract Retry 2 URL` - ❌ Missing musicUrl
7. `Extract Retry 3 URL` - ❌ Missing musicUrl

By the time data reached "Collect Video Clips", `musicUrl` was `undefined`.

**Fix**: Added `musicUrl` passthrough to all 7 nodes:
```javascript
// Example from Extract Task ID node:
return {
  json: {
    taskId,
    slideNumber: slideData.slideNumber,
    // ... other fields ...
    branding: slideData.branding,
    musicUrl: slideData.musicUrl  // CRITICAL: Preserve for soundtrack
  }
};
```

**Data Flow After Fix**:
```
Webhook → Extract Video Config → Split Slides for Animation
    ↓ (musicUrl in each item)
Extract Task ID → Check Video Status → Check If Retry Needed
    ↓ (musicUrl preserved)
Format Complete Items / Retry nodes → Collect Video Clips
    ↓ (musicUrl aggregated)
Build json2video Payload → Creates audio element with musicUrl
```

**Key Lesson**: When adding new fields to n8n workflow data, ensure ALL intermediate code nodes pass them through. The "CRITICAL: Preserve" comment pattern helps identify important fields.

### Email Results Fix (IMPLEMENTED)
Fixed "Format Final Result" node to include static image URLs in email:
- Extracts slides with imageUrl from Collect Video Clips node
- Sets `hasImages: true` when images exist
- Email now contains both merged video URL and all individual slide images

### Caption Positioning & Formatting Fix (IMPLEMENTED - January 10, 2026)
Fixed video text overlays in "Build json2video Payload" node:
- **Centering**: Changed body text from `position: 'custom', y: 960` to `position: 'center', y: 100`
- **Bullet formatting**: Added `formatBodyText()` helper to convert markdown bullets (`- point`) to HTML (`<ul><li>`)
- Text no longer gets cut off at bottom of video frame
- Bullets display as proper disc points instead of raw hyphens

### Animation Hallucination Prevention (IMPLEMENTED - January 10, 2026)
Enhanced animation prompts to prevent Kling 2.6 from generating extra wings/limbs:

**"Split Slides for Animation" node** - Enhanced consistency reinforcement:
```javascript
const consistencyReinforcement = 'CRITICAL ANATOMICAL LOCK: Character MUST maintain EXACT body structure throughout - same number of limbs, wings, tails, eyes, heads from first to last frame. If bird: exactly TWO wings, never more. If animal: exact limb count preserved. ZERO new body parts appearing. ZERO splitting/duplicating/morphing. Stable consistent motion with identical anatomy throughout.';
```

**"Animate with Kling 2.6" node** - Enhanced negative prompt:
```
extra limbs, extra arms, extra legs, extra wings, duplicate wings, triple wings, extra tails, extra heads, extra eyes, extra beaks, multiple heads, cloning, splitting, duplicating body parts, multiplying features, growing new parts, deformed hands, deformed limbs, morphing body parts, disappearing objects, warped geometry, distorted anatomy, flickering, temporal inconsistency, blurry, low quality, watermark, text, extra fingers, extra hands
```

### Build json2video Payload Fix (IMPLEMENTED - January 10, 2026)
Restored working "Build json2video Payload" node in video workflow after it was broken:

**Problem**: json2video was failing with "Error rendering video" - video clips from kie.ai weren't stitching together.

**Root Cause**: Node was "simplified" and lost critical fields:
- Missing `duration: videoDuration` on all video elements
- Changed `type: 'html'` to `type: 'text'` WITHOUT proper animation settings (broken)
- Changed `resolution: 'instagram-story'` to custom dimensions

**Note**: `type: 'text'` IS supported but requires `style` and `settings` parameters for animation. Plain `type: 'text'` without these fails.

**Fix**: Restored working code from workflow version 93. Key elements:
```javascript
// Each scene now has proper structure:
{
  duration: videoDuration,  // CRITICAL - was missing
  elements: [
    {
      type: 'video',
      src: clip.videoUrl,
      duration: videoDuration  // CRITICAL - was missing
    },
    {
      type: 'html',  // Changed back from 'text'
      html: `<div style="...">${headline}</div>`,
      duration: videoDuration  // CRITICAL - was missing
    }
  ]
}
```

**Rollback Reference**: If issues recur, workflow version 93 contains the working code.

### Video Workflow Status Callback Fix (IMPLEMENTED - January 11, 2026)
Fixed video workflow's "Update App Status" node that was returning 404 errors:

**Problem**: Video workflow completed successfully but video URL never appeared in gallery/preview.

**Root Cause**: The "Update App Status" HTTP Request node was misconfigured:
- Using GET method (default) instead of POST
- Not sending any request body with the status data

**Fix**: Updated node configuration:
```javascript
{
  method: "POST",
  sendBody: true,
  specifyBody: "json",
  // CRITICAL: Read from Format Final Result directly, NOT $json
  // $json receives Gmail response after Send Email Results, not carousel data
  url: "=https://edgeai-carousel.vercel.app/api/status/{{ $('Format Final Result').first().json.generationId }}",
  jsonBody: "={{ '{\"status\": \"' + $('Format Final Result').first().json.status + '\"...}' }}"
}
```

**Key Insight**: When Update App Status runs after Send Email Results, `$json` contains the Gmail API response (just email ID), not the original carousel data. Must use `$('Format Final Result').first().json` to access the correct data.

### Text Styling Consistency (IMPLEMENTED - January 11, 2026)
Updated static workflow's "Generate Slide Prompts" to match json2video text styling:

| Art Style | Font | Color | Effects |
|-----------|------|-------|---------|
| synthwave | Orbitron | #FF00FF (Magenta) | Neon glow |
| anime | Bangers | #FF6B6B (Coral Red) | Black outline |
| 3d-pixar | Fredoka One | #FFD93D (Golden Yellow) | Soft shadow |
| watercolor | Pacifico | #5C4033 (Warm Brown) | White glow |
| minimalist | Montserrat | #1A1A1A (Near Black) | None |
| comic | Bangers | #FFFF00 (Bright Yellow) | Black stroke |
| photorealistic | Playfair Display | #FFFFFF (White) | Dark shadow |
| custom | Roboto | #FFFFFF (White) | Subtle shadow |

Each style includes:
- Semi-transparent rounded rectangle backgrounds (40-50% opacity)
- Headline at top, body text in center-lower area
- Text prompts now explicitly describe font style, color, and positioning

### Dual Image Generation (IMPLEMENTED - January 11, 2026)
Static workflow now generates TWO images per slide for different purposes:

**Problem**:
- json2video does NOT support PNG export (video-only API)
- Static images need text overlays for email/gallery
- Video animation (Kling 2.6) needs CLEAN images (text added via json2video after)

**Solution**: Generate two image sets per slide using GPT Image 1.5:
1. **Clean image** (`imageUrl`) → for Kling 2.6 animation → text added via json2video in video
2. **Text-baked image** (`processedImageUrl`) → for static email/gallery output (text rendered by GPT Image 1.5)

**Static Workflow Changes** (25 nodes, down from 36):
- "Generate Slide Prompts" - Creates both `cleanPrompt` and `textPrompt` per slide
- "Split Into Slides" - Outputs 2 items per slide (one clean, one with text)
- "Collect All Results" - Matches clean/text pairs by slideNumber, outputs both URLs
- Removed 11 json2video text overlay nodes (no longer needed)

**Data Flow**:
```javascript
// Each slide outputs:
{
  imageUrl: cleanImageUrl,           // Clean image for video animation
  processedImageUrl: textImageUrl,   // Text-baked image for static output
  headline: "...",
  bodyText: "..."
}
```

**Trade-offs**:
- Doubles image generation API calls (2x cost for GPT Image 1.5)
- GPT Image text quality may occasionally be garbled (user accepted)
- Longer generation time (more images to generate)
- Simpler workflow architecture (no json2video for static images)

### Kinetic Typography for Headlines (RESTORED - January 11, 2026)
Video headlines now use kinetic typography animations for dynamic visual appeal:

**Change**: Headlines use `type: 'text'` with animation, body text remains `type: 'html'` for bullet formatting

**Animation Mapping by Art Style**:
| Art Style | Animation ID | Effect |
|-----------|-------------|--------|
| synthwave | `005` | Jumping (energetic neon) |
| anime | `003` | Word-by-word (dramatic) |
| 3d-pixar | `002` | Fade in (smooth) |
| watercolor | `006` | Revealing (artistic) |
| minimalist | `002` | Fade in (clean) |
| comic | `005` | Jumping (dynamic) |
| photorealistic | `002` | Fade in (subtle) |
| custom | `003` | Word-by-word (default) |

**Implementation** (Build json2video Payload node v7.0):
```javascript
// Headline with kinetic animation
elements.push({
  type: 'text',
  style: animationStyle,  // e.g., '005' for jumping
  text: cleanHeadline,
  duration: videoDuration,
  x: 0, y: 120, width: 1080, height: 0,
  settings: {
    'color': style.headlineColor,
    'font-size': `${style.headlineSize}px`,
    'font-family': style.headlineFont,
    'font-weight': 'bold',
    'text-align': 'center',
    'vertical-align': 'top',
    'shadow': shadowLevel,  // 0-3
    'background-color': style.bgColor
  }
});
```

**Hybrid Approach** (CURRENT):
- **Headlines**: `type: 'text'` with animation (kinetic typography)
- **Body text**: `type: 'html'` (supports bullets/formatting, static)
- **Branding**: `type: 'html'` (positioned bottom-right, static watermark)

**Local Script**: `scripts/updated-json2video-code.js` contains the v7.0 code with animations.

### Static Workflow Node Reference Fix (FIXED - January 11, 2026)
Fixed stale node reference in Static Workflow "Update App Status" node.

**Problem**: Generation was showing "generation failed" in the app preview.

**Root Cause**: The "Update App Status" node referenced a non-existent node name:
```javascript
// Broken (node was renamed):
$('Collect Processed Images').first().json

// Fixed:
$('Collect All Results').first().json
```

**Key Lesson**: When renaming n8n nodes, search for all `$('NodeName')` references in other nodes to avoid broken expression references. n8n doesn't warn about invalid references until runtime.

**Rollback**: If animation issues occur, version 116 contains the stable `type: 'html'` approach for all text elements.

### Video Text Readability Enhancement (IMPLEMENTED - January 11, 2026)
Enhanced video body text for better mobile readability based on trending TikTok/Reels practices.

**Changes to "Build json2video Payload" node (v8.0)**:
1. **+5px body font size** across all art styles
2. **Text stroke outline** via `-webkit-text-stroke` for "pop" effect
3. **Background opacity 40% → 65%** for better contrast

**Updated Body Text Sizes**:
| Art Style | Old Size | New Size | Stroke |
|-----------|----------|----------|--------|
| synthwave | 64px | 69px | 1px black |
| anime | 60px | 65px | 2px black |
| 3d-pixar | 56px | 61px | 1px black |
| watercolor | 54px | 59px | 1px brown |
| minimalist | 48px | 53px | 1px white |
| comic | 56px | 61px | 3px black |
| photorealistic | 48px | 53px | 1px black |
| custom | 48px | 53px | 1px black |

**Sources**: [Kapwing](https://www.kapwing.com/resources/social-media-captions-styles-a-complete-guide/), [CapCut](https://www.capcut.com/resource/caption-style/)

### TypeScript Type Fix for processedImageUrl (IMPLEMENTED - January 11, 2026)
Fixed preview showing clean images instead of text-baked images.

**Root Cause**: TypeScript type definitions were missing `processedImageUrl` field.

**Files Fixed**:
- `lib/supabase.ts` line 56: Added `processedImageUrl?: string` to StatusDetails.slides
- `lib/n8n.ts` line 235: Added `processedImageUrl?: string` to GenerationStatusResponse.slides

### Video Text Positioning Fix (IMPLEMENTED - January 12, 2026)
Fixed broken text positioning after v8.0 enhancement update caused headline/body overlap.

**Problem**: After v8.0 update, video text was "completely off/overlapping":
- Headlines overlapped body text
- Scene transitions were missing

**Root Cause** (v8.0 broke positioning):
```javascript
// BROKEN (v8.0) - wrong positioning approach
elements.push({
  type: 'html',
  html: `<div style="...">${headline}</div>`,
  position: 'custom',
  x: 540,   // Wrong - center-based
  y: 120,
  duration: videoDuration
});

// Body - WRONG
elements.push({
  type: 'html',
  position: 'center',  // Wrong
  y: 100,              // Only 100px offset = overlaps headline!
});
```

**Fix (v8.1)** - Restored working positioning from v116:
```javascript
// CORRECT - headline at top with full-width wrapper
elements.push({
  type: 'html',
  html: `<div style="width: 1080px; display: flex; justify-content: center; padding-top: 120px;">
    <div style="...">${headline}</div>
  </div>`,
  duration: videoDuration,
  position: 'top-left'  // Uses wrapper div for centering
});

// Body - CORRECT - positioned at y: 800 (lower half of 1920px frame)
elements.push({
  type: 'html',
  html: `<div style="width: 1080px; display: flex; justify-content: center;">
    <div style="...">${bodyHtml}</div>
  </div>`,
  duration: videoDuration,
  position: 'custom',
  x: 0,
  y: 800  // In lower-center area
});

// Scenes must include transitions
scenes.push({
  elements,
  transition: { style: 'fade', duration: 0.5 }  // Was missing in v8.0
});
```

**Key Positioning Rules for json2video**:
- Use `position: 'top-left'` with `width: 1080px` wrapper div + flexbox for centered headlines
- Use `position: 'custom', x: 0, y: 800` with `width: 1080px` wrapper for body text
- Video frame is 1080x1920 (9:16), so y: 800 places body in lower-center
- Always include `transition` property on scenes for smooth fades

**Enhancements Preserved** (from v8.0):
- +5px body font sizes for mobile readability
- `-webkit-text-stroke` for text "pop" effect
- 65% background opacity (up from 40%)

**Rollback Reference**: If positioning issues recur, workflow version 116 contains working positioning code.

### Hero Image Adherence & Character Consistency (IMPLEMENTED - January 11, 2026)
Enhanced "Generate Slide Prompts" node with layered prompt structure for better GPT Image 1.5 fidelity:

**Problem**: Generated images were drifting from the hero/reference image, and characters looked different across slides.

**Solution**: Added multiple prompt layers that reinforce consistency:

1. **Hero Adherence Prompt** (at prompt start):
```javascript
const heroAdherencePrompt = `REFERENCE IMAGE ADHERENCE (CRITICAL):
The generated image MUST closely match the character/subject from the provided reference image.
- PRESERVE: Exact facial features, body proportions, species characteristics
- PRESERVE: Clothing, outfit, colors, patterns, accessories
- PRESERVE: Distinctive markings, textures, unique visual features
- PRIORITY: Reference image fidelity over artistic interpretation
`;
```

2. **Character Consistency Prompt** (per slide):
```javascript
const characterConsistencyPrompt = `CHARACTER CONSISTENCY ACROSS SLIDES (CRITICAL):
This is slide ${index + 1} of ${slides.length}. The character MUST be IDENTICAL across ALL slides:
- SAME face/head structure and features
- SAME body type and proportions
- SAME clothing/outfit/colors
- SAME distinctive markings or patterns
`;
```

3. **Character Negative Prompt** (prevents drift):
```javascript
const characterNegativePrompt = `
DO NOT change the character's appearance. DO NOT alter facial features or body shape.
DO NOT modify clothing or colors. DO NOT introduce different characters.
`;
```

4. **Enhanced Style Reinforcement**:
```javascript
const styleReinforcement = `
CRITICAL CONSISTENCY REQUIREMENTS:
- This is slide ${index + 1} of ${slides.length}
- Maintain EXACTLY the same ${artStyle} visual style
- Keep the SAME character from the reference image
- Character must look identical to previous/next slides
- Do not drift toward photorealism or other styles
- Prioritize visual consistency over variation
`;
```

**Final Prompt Structure**:
```
heroAdherencePrompt → characterConsistencyPrompt → stylePrompt → Scene description → characterNegativePrompt → styleReinforcement
```

**Local Script**: `scripts/updated-static-code.js` contains the v2.0 prompt code.

### Minimum Font Sizes for Text-Baked Images (IMPLEMENTED - January 11, 2026)
Added explicit minimum font size requirements to text-baked image prompts to match video overlay sizes:

| Art Style | Headline Min | Body Min |
|-----------|--------------|----------|
| synthwave | 72px | 69px |
| anime | 68px | 65px |
| 3d-pixar | 64px | 61px |
| watercolor | 60px | 59px |
| minimalist | 56px | 53px |
| comic | 72px | 69px |
| photorealistic | 54px | 53px |
| custom | 60px | 59px |

**Implementation** (Generate Slide Prompts node):
```javascript
const textStylePrompts = {
  'synthwave': {
    headline: 'Use ORBITRON-style futuristic blocky font for headline, glowing BRIGHT MAGENTA (#FF00FF) color, MINIMUM 72px font size, with strong neon glow effect',
    body: 'Use ORBITRON-style futuristic font for body text, BRIGHT MAGENTA (#FF00FF) color, MINIMUM 69px font size, with subtle neon glow',
    headlineMinSize: 72,
    bodyMinSize: 69,
    background: 'Text on semi-transparent black rounded rectangle background (65% opacity)'
  },
  // ... same structure for all 8 styles
};

// In text prompt:
const textPrompt = `...
FONT SIZE REQUIREMENTS:
- Headline: MINIMUM ${textStyle.headlineMinSize}px - must be clearly readable on mobile
- Body text: MINIMUM ${textStyle.bodyMinSize}px - must be clearly readable on mobile
- Text must be LARGE enough to read on 9:16 vertical format
- Do NOT use small or decorative-only text sizes
...`;
```

**Background Opacity**: Changed from 40% to 65% across all styles for better text visibility.

## Video Workflow Architecture (Current)

**Workflow ID**: `0MpzxUS4blJI7vgm`
**Last Updated**: January 11, 2026 (v7.0 - kinetic typography restored)
**Node Count**: 38

### Node Flow
```
Video Generation Webhook
    ↓
Extract Video Config
    ↓
Split Slides for Animation (splits into parallel items)
    ↓
Animate with Kling 2.6 (kie.ai) [parallel per slide]
    ↓
Extract Task ID
    ↓
Wait 5 min
    ↓
Get Video Task Result
    ↓
Check Video Status
    ↓
Check If Retry Needed
    ↓
IF Retry Needed ─────────────────────────────┐
    ↓ (no)                                   ↓ (yes)
Format Complete Items               Wait 120s More
    ↓                                        ↓
    │                               Get Result (Retry)
    │                                        ↓
    │                               Extract Final URL
    │                                        ↓
    │                               IF Needs More Retry ──→ [Retry 2 & 3 chain]
    │                                        ↓ (no)
    ↓←───────────────────────────────────────┘
Collect Video Clips
    ↓
Build json2video Payload
    ↓
Create json2video Job
    ↓
Extract Project ID
    ↓
Wait 30s (json2video)
    ↓
Poll json2video Status
    ↓
Check json2video Status
    ↓
IF Needs More Polling ───────────────────────┐
    ↓ (no)                                   ↓ (yes)
Pass Through Done                   Wait 30s More
    ↓                                        ↓
    │                               Poll json2video Again
    │                                        ↓
    │                               Extract Final Video
    ↓←───────────────────────────────────────┘
Format Final Result
    ↓
IF Email Provided ───────────────────────────┐
    ↓ (yes)                                  ↓ (no)
Send Email Results                           │
    ↓                                        │
    ↓←───────────────────────────────────────┘
Update App Status
```

### Key Nodes
| Node | Type | Purpose |
|------|------|---------|
| Split Slides for Animation | Code | Splits slides array, adds art-style animation prompts |
| Animate with Kling 2.6 | HTTP Request | Calls kie.ai API for image-to-video |
| Collect Video Clips | Code | Aggregates all animated clips back together |
| Build json2video Payload | Code | Creates json2video API payload with text overlays |
| Format Final Result | Code | Formats output with videoClips array for email |

### Critical Data Flow
- "Collect Video Clips" outputs `videoClips` array (not `slides`)
- "Build json2video Payload" must read from `firstItem.videoClips`
- Video clips contain: `slideNumber`, `videoUrl`, `imageUrl`, `headline`, `bodyText`

### Supabase RLS Service Role Client Fix (IMPLEMENTED - January 12, 2026)
Fixed frontend not receiving status updates, gallery/preview tiles not updating after generation.

**Problem**: n8n callbacks to `/api/status/{id}` were silently failing - Supabase operations returned success but no data was actually written/read.

**Root Cause**: Supabase Row Level Security (RLS) policies on `generations` table require `user_id = auth.uid()` for ALL operations:
```sql
-- All RLS policies on generations table:
SELECT: user_id = auth.uid()
INSERT: user_id = auth.uid()
UPDATE: user_id = auth.uid()
DELETE: user_id = auth.uid()
```

n8n callbacks use the **anonymous Supabase client** with no authentication context. Since `auth.uid()` returns `null` for unauthenticated requests, ALL operations were blocked by RLS.

**Fix**: Updated `lib/supabase.ts` to use `getServerClient()` (service role key) instead of `getClient()` (anon key) for all server-side operations called by n8n callbacks:

| Function | Purpose |
|----------|---------|
| `setStatusDetails()` | Store generation status from n8n |
| `getStatusDetails()` | Retrieve status for polling |
| `updateGeneration()` | Update status/video_url/zip_url |
| `setVideoExecution()` | Track video workflow progress |
| `getVideoExecution()` | Check video workflow status |
| `addSlides()` | Insert slide records from n8n |
| `setSlidesConfig()` | Store original slide text |
| `getSlidesConfig()` | Retrieve slide text for gallery |
| `uploadImageFromUrl()` | Upload images to Storage |
| `uploadVideoFromUrl()` | Upload videos to Storage |

**Implementation Pattern**:
```typescript
// Before (broken - RLS blocks anonymous client):
export async function setStatusDetails(...) {
  const client = getClient()  // ❌ Uses anon key
  await client.from('generations').update(...)
}

// After (working - service role bypasses RLS):
export async function setStatusDetails(...) {
  if (!isServerConfigured) {
    console.warn('Supabase server client not configured')
    return false
  }
  const client = getServerClient()  // ✅ Uses service role key
  await client.from('generations').update(...)
}
```

**Environment Variable Required**:
```bash
# Add to .env.local
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Key Insight**: RLS silently fails - operations appear to succeed but return empty results. The service role key bypasses RLS entirely, which is appropriate for server-side operations where the app itself is the trusted actor.

### Video Workflow Multi-Item Processing Fix (IMPLEMENTED - January 12, 2026)
Fixed video workflow only processing 1 slide instead of all slides.

**Problem**: When generating a 3-slide carousel with video, only 1 slide was animated and included in the final video.

**Root Cause**: Multiple Code nodes in the video workflow used single-item patterns that only processed the first item:

```javascript
// BROKEN - only gets first item from referenced node
const prevData = $('SomeNode').item.json;
return { json: {...} };  // Returns only 1 item

// FIXED - processes ALL items
return $input.all().map((inputItem, index) => {
  const allPrevData = $('SomeNode').all();
  const prevData = allPrevData[index].json;
  return { json: {...} };
});
```

**Nodes Fixed** (7 total):
| Node | Issue |
|------|-------|
| Extract Task ID | Used `$('Split Slides...').item.json` |
| Check Video Status | Used `$('Extract Task ID').item.json` |
| Check If Retry Needed | Returned single item |
| Format Complete Items | Returned single item |
| Extract Final URL | Used `$('IF Retry Needed').item.json` |
| Extract Retry 2 URL | Used `$('IF Needs More Retry').item.json` |
| Extract Retry 3 URL | Used `$('IF Needs Retry 3').item.json` |

**Key Insight**: In n8n Code nodes, `$('NodeName').item.json` always returns the **first item** from that node, not the corresponding item for each input. When processing multiple items in parallel, you must use `$('NodeName').all()[index]` to get the matching item by index.
