# EdgeAI Carousel Creator

AI-powered carousel ad generator with character-consistent images and video output.

## Quick Start

```bash
npm install    # Install dependencies
npm run dev    # Dev server (port 3000)
npm run build  # Production build
npm start      # Start production
npm run lint   # Lint code
```

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS v4 + Radix UI
- **Database**: Supabase (PostgreSQL + Storage)
- **Workflows**: n8n Cloud (edgeaimedia.app.n8n.cloud)

## Project Structure

```
app/
  page.tsx                      # Main carousel creator
  gallery/page.tsx              # Gallery of generations
  api/
    generate-carousel/route.ts  # Triggers n8n static workflow
    generate-text/route.ts      # AI text generation (GPT-4o-mini)
    generate-image/route.ts     # Hero image editing (Gemini 3 Pro)
    status/[id]/route.ts        # Polls generation status
    gallery/route.ts            # Fetches saved generations

components/
  carousel-creator/             # Main UI components
  ui/                           # Radix UI primitives

lib/
  n8n.ts                        # n8n webhook integration
  supabase.ts                   # Supabase client & helpers
  music-tracks.ts               # Client-safe music track data
  utils.ts                      # Utility functions
```

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for RLS bypass

# n8n
N8N_WEBHOOK_URL=https://edgeaimedia.app.n8n.cloud/webhook
N8N_API_URL=https://edgeaimedia.app.n8n.cloud/api/v1
N8N_API_KEY=your-n8n-api-key
N8N_VIDEO_WORKFLOW_ID=0MpzxUS4blJI7vgm

# AI APIs
OPENAI_API_KEY=your-openai-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
```

## Architecture Overview

### Data Flow
1. User uploads hero image + configures carousel (email required)
2. Optional: Edit hero image with AI (Gemini 3 Pro)
3. `POST /api/generate-carousel` triggers n8n static workflow
4. n8n generates slides with character consistency (GPT Image 1.5 via kie.ai)
5. Frontend polls `GET /api/status/{id}` for progress
6. If video enabled, static workflow triggers video workflow
7. Video workflow animates slides (Kling 2.6), merges with json2video
8. Results saved to Supabase Storage + database
9. Email sent with video URL + slide images

### n8n Workflows

| Workflow | ID | Purpose |
|----------|-----|---------|
| Static | `UvvlI6vB4ystc3Vr` | Generates dual images per slide (clean + text-baked) |
| Video | `0MpzxUS4blJI7vgm` | Animates slides, merges with json2video |

**Static Workflow** (25 nodes):
- Generates TWO images per slide: clean (for video) + text-baked (for email/gallery)
- Uses GPT Image 1.5 via kie.ai for image-to-image
- Synchronous response (`responseMode: "lastNode"`)

**Video Workflow** (38 nodes):
- Animates using Kling 2.6 model (5-second clips)
- Merges clips with json2video at 1080x1920 (9:16)
- Async with polling (`responseMode: "onReceived"`)
- Callbacks to `https://edgeai-carousel.vercel.app/api/status/{id}`

### External APIs
- **kie.ai**: Image generation (GPT Image 1.5) + video animation (Kling 2.6)
- **json2video**: Video concatenation with text overlays
- **Google Gemini 3 Pro**: Hero image AI editing
- **OpenAI GPT-4o-mini**: Slide text auto-generation

### Database Schema

**Tables**:
- `generations`: id, generation_id, user_id, status, video_url, zip_url
- `slides`: generation_id, slide_number, image_url, headline, body_text

**Storage Buckets**:
- `carousel-images`: Generated slide images
- `carousel-videos`: Merged video outputs
- `carousel-music`: Background music tracks (ElevenLabs)

## Art Styles

`synthwave` | `anime` | `3d-pixar` | `watercolor` | `minimalist` | `comic` | `photorealistic` | `custom`

Each style has:
- Custom text styling (fonts, colors, shadows)
- Kinetic typography animation for video headlines
- 2 background music tracks

## Key Patterns

### Supabase RLS Bypass
Server-side operations use `getServerClient()` (service role key) to bypass RLS policies. Required for n8n callbacks which have no auth context.

### User Data Isolation
Gallery and delete operations filter by `user_id` at application level. Status polling uses generation ID as a secret token.

### Client/Server Module Separation
Client components (`'use client'`) cannot import server modules. Music tracks are in `lib/music-tracks.ts` (client-safe), not `lib/n8n.ts`.

### n8n Multi-Item Processing
In n8n Code nodes, use `$('NodeName').all()[index]` for parallel processing, not `$('NodeName').item.json` (returns only first item).

### n8n Field Passthrough
When adding new fields to workflow data, ensure ALL intermediate code nodes pass them through (e.g., `musicUrl` must traverse 7+ nodes).

## Development Notes

- Dev server uses Turbopack (Next.js 16 default)
- Static workflow is synchronous, video is async (polling required)
- n8n Cloud cannot callback to localhost
- Comic style excludes speech bubbles in prompts

## Local Scripts Reference

| Script | Purpose |
|--------|---------|
| `scripts/json2video-payload-v8.1.js` | Current video payload builder |
| `scripts/static-prompts-v2.0.js` | Static image prompt templates |

## Troubleshooting

**"immediate generation failed"**: Check `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel.

**Video shows 1 slide**: n8n Code nodes using single-item patterns. Use `.all()[index]`.

**Silent videos**: `musicUrl` dropped in intermediate nodes. Ensure passthrough.

**Gallery shows all users**: Verify `userId` passed to `getGenerations()`.

**Status not updating**: n8n callback needs POST method + `$('Format Final Result').first().json` reference.
