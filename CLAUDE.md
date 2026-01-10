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
   - Generates character-consistent slide images using **GPT Image 1.5** (via kie.ai)
   - True image-to-image generation: passes hero image as reference for character consistency
   - **Per-slide character actions**: Users can specify poses/actions per slide for narrative storytelling
   - Output format: **9:16 vertical** (Instagram Reels optimized)
   - Uses `responseMode: "lastNode"` for synchronous response
   - Includes retry logic for failed slides
   - **Post-processing text overlays**: Uses json2video to add reliable text overlays (GPT Image can't render text)
   - **Email notification**: Sends results via Gmail for all output modes

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
- **Branding**: At bottom center, 70% of headline size, same font/color as headline

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
- Total video length: ~30-35s for 6 slides
- kie.ai cost: ~$1.68/carousel

**Wait Times**:
| Node | Duration |
|------|----------|
| Wait 5 min | 300s |
| Wait 120s More | 120s |
| Wait 30s (json2video) | 30s |
| Wait 30s More | 30s |

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

### Static Image Text Overlays (IMPLEMENTED - January 10, 2026)
Added json2video post-processing to static workflow for reliable text overlays:

**Problem**: GPT Image 1.5 cannot reliably render text from prompts (garbled letters, missing text)

**Solution**: Added 8 new nodes to static workflow after "Collect All Results":
1. "Build Text Overlay Payloads" - Prepares json2video payloads with art-style-specific text styling
2. "Split for Text Overlay" - Splits slides for parallel processing
3. "Create Text Overlay Job" - Calls json2video API
4. "Extract Text Job ID" - Extracts project ID from response
5. "Wait 30s (Text)" - Waits for processing
6. "Poll Text Status" - Polls for completion
7. "Extract Processed Image" - Extracts final image URL
8. "Collect Processed Images" - Aggregates all processed images

Static workflow now generates clean images without text, then adds text overlays using json2video (same styling as video workflow). This ensures consistent, reliable text rendering across static and video outputs.

## Video Workflow Architecture (Current)

**Workflow ID**: `0MpzxUS4blJI7vgm`
**Version ID**: `7c1a57d5-5f56-4a8d-8e7e-54bc188443cb`
**Last Updated**: January 10, 2026
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
