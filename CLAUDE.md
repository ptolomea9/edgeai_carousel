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
    generate-text/route.ts       # AI text generation for slides
    status/[id]/route.ts         # Polls generation status
    gallery/route.ts             # Fetches saved generations

components/
  carousel-creator/           # Main creator UI components
    index.tsx                 # CarouselCreator main component
    types.ts                  # TypeScript types (CarouselConfig, SlideContent, etc.)
    hero-image-upload.tsx     # Hero image uploader
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
   - Generates character-consistent slide images using Nano Banana Pro (kie.ai)
   - Uses `responseMode: "lastNode"` for synchronous response
   - Includes retry logic for failed slides
   - **English-only enforcement**: Prompts include strict language requirements at the top to prevent non-English text generation

2. **Video Workflow** (ID: `0MpzxUS4blJI7vgm`)
   - Animates slides using kie.ai (Wan 2.6 model)
   - Merges clips using json2video API
   - Uses `responseMode: "onReceived"` (async)

### APIs Used
- **kie.ai**: Image generation (Nano Banana Pro) and image-to-video animation (Wan 2.6 model)
- **json2video**: Video concatenation with transitions
- **OpenAI GPT-4o**: Hero image analysis for character consistency
- **Supabase Storage**: Buckets for `carousel-images` and `carousel-videos`

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
```

## Key Data Flow

1. User uploads hero image + configures carousel
2. `POST /api/generate-carousel` triggers n8n static workflow
3. n8n generates slides with character consistency
4. Frontend polls `GET /api/status/{id}` for progress
5. If video enabled, static workflow triggers video workflow
6. Status API polls n8n for video execution status
7. Results persisted to Supabase Storage + database

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
