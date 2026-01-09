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
   - Generates character-consistent slide images using **Seedream 4.5-edit** (kie.ai)
   - True image-to-image generation: passes hero image as reference for character consistency
   - Output format: **9:16 vertical** (Instagram Reels optimized)
   - Uses `responseMode: "lastNode"` for synchronous response
   - Includes retry logic for failed slides

2. **Video Workflow** (ID: `0MpzxUS4blJI7vgm`)
   - Animates slides using kie.ai (Wan 2.6 model) at 720p
   - Merges clips using json2video API at **1080x1920** (9:16 vertical)
   - Callbacks to production URL: `https://edgeai-carousel.vercel.app/api/status/{id}`
   - Uses `responseMode: "onReceived"` (async)

### APIs Used
- **kie.ai**: Image generation (Seedream 4.5-edit with reference images) and image-to-video animation (Wan 2.6 model)
- **json2video**: Video concatenation with text overlays, transitions, and branding
- **Google Gemini 3 Pro**: Hero image AI editing (remove background, enhance, studio lighting, etc.)
- **OpenAI GPT-4o-mini**: Slide text auto-generation (headlines + body with min 2 bullets/sentences)
- **Supabase Storage**: Buckets for `carousel-images` and `carousel-videos`

### json2video Text Overlays
Each art style has custom text styling applied in the video:
- **Headline**: Bold, at top center, art-style-specific font/color/shadow
- **Body**: Normal weight, at vertical center, matching style
- **Branding**: At bottom center, 70% of headline size, same font/color as headline

Art styles: synthwave, anime, 3d-pixar, watercolor, minimalist, comic, photorealistic, custom

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
4. n8n generates slides with character consistency using Seedream 4.5-edit
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

## Development Notes

- Dev server uses Turbopack (Next.js 16 default)
- Static workflow returns slides synchronously
- Video workflow is async - app polls n8n API for status
- n8n Cloud cannot callback to localhost - polling is required
