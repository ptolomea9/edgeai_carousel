# EdgeAI Carousel - Troubleshooting & Patterns Guide

This document captures lessons learned and common patterns for debugging issues in the EdgeAI Carousel project.

---

## Quick Diagnosis Checklist

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| "immediate generation failed" in frontend | Missing `SUPABASE_SERVICE_ROLE_KEY` | Add to Vercel env vars |
| Generation stuck at "processing" | n8n callback failing silently | Check n8n execution logs |
| Video never appears | Status API not updating | Check "Update App Status" node |
| Only 1 slide in video | Multi-item processing broken | Check Code nodes use `.all()` pattern |
| No music in video | `musicTrackId` not passed | Check "Trigger Video Workflow" node |
| Users see all generations | No user filtering | Check `getGenerations()` has userId |
| Client-side import error | Server module in client component | Separate server/client exports |

---

## n8n Workflow Patterns

### 1. Multi-Item Processing in Code Nodes

**Problem**: Code node only processes first item instead of all items.

**Wrong Pattern**:
```javascript
// Gets ONLY first item from referenced node
const data = $('SomeNode').item.json;
return { json: { ...data } };  // Returns 1 item
```

**Correct Pattern**:
```javascript
// Processes ALL items, maintains parallel execution
return $input.all().map((inputItem, index) => {
  const allData = $('SomeNode').all();
  const data = allData[index].json;  // Match by index
  return { json: { ...data } };
});
```

**Key Insight**: `$('NodeName').item.json` always returns first item. Use `$('NodeName').all()[index]` to get corresponding item.

---

### 2. Node Reference After Rename

**Problem**: Expressions break silently when a node is renamed.

**Symptom**: `$('OldNodeName').first().json` returns `undefined`, no error shown.

**Solution**: After renaming any n8n node, search workflow for all `$('OldNodeName')` references and update them.

**Prevention**: Keep node names stable, or use descriptive names that won't change.

---

### 3. HTTP Request Node Configuration

**Common Mistakes**:
| Issue | Wrong | Correct |
|-------|-------|---------|
| Method | GET (default) | POST for webhooks/callbacks |
| Body | Not sent | `sendBody: true` |
| Content Type | Not set | `specifyBody: "json"` |
| Data path | `$json.field` | `$json.results.field` (check actual structure) |

**Debugging**: Always check n8n execution logs to see actual values being sent.

---

### 4. Callback Node After Email

**Problem**: `$json` contains wrong data after Send Email node.

**Why**: `$json` contains output of previous node (Gmail response), not original workflow data.

**Solution**: Reference specific node by name:
```javascript
// Wrong - gets Gmail response
const data = $json;

// Correct - gets original data
const data = $('Format Final Result').first().json;
```

---

## Supabase Patterns

### 1. RLS and Service Role Key

**Understanding RLS Behavior**:
- RLS policies silently fail - operations return success but no data
- Anonymous client (`anon` key) subject to RLS
- Service role client bypasses RLS entirely

**When to Use Each**:
| Client | Use Case |
|--------|----------|
| Anon key | Frontend, user-facing operations |
| Service role key | Server callbacks, n8n webhooks, admin operations |

**Server-Side Pattern**:
```typescript
import { createClient } from '@supabase/supabase-js'

// Service role client for server operations
const serverClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

### 2. Application-Level User Filtering

**When database RLS isn't sufficient** (e.g., service role bypasses it):

```typescript
// Add userId parameter to queries
export async function getItems(userId?: string) {
  let query = client.from('items').select('*')
  if (userId) {
    query = query.eq('user_id', userId)
  }
  return query
}

// Verify ownership before mutations
export async function deleteItem(id: string, userId?: string) {
  const item = await getItemById(id)
  if (userId && item.user_id !== userId) {
    return { error: 'Not authorized' }
  }
  // Proceed with delete
}
```

---

## Next.js / React Patterns

### 1. Client vs Server Module Separation

**Problem**: `'use client'` component imports server-only module.

**Symptom**: Build error or "Cannot use X in client component"

**Solution**: Create separate files for client-safe exports:

```typescript
// lib/constants.ts - Client-safe (no server imports)
export const MY_CONSTANT = 'value'
export type MyType = { ... }

// lib/server-utils.ts - Server-only
import { serverOnlyModule } from 'some-server-package'
export { MY_CONSTANT, MyType } from './constants'  // Re-export for convenience
export function serverFunction() { ... }
```

**Import Pattern**:
```typescript
// In 'use client' component
import { MY_CONSTANT } from '@/lib/constants'  // Safe

// In server component or API route
import { serverFunction, MY_CONSTANT } from '@/lib/server-utils'  // All available
```

---

### 2. Environment Variables

**Client-Side Access**:
- Must be prefixed with `NEXT_PUBLIC_`
- Example: `NEXT_PUBLIC_SUPABASE_URL`

**Server-Side Only**:
- No prefix required
- Example: `SUPABASE_SERVICE_ROLE_KEY`

**Vercel Deployment**:
- Add all env vars in Vercel dashboard
- Redeploy after adding new vars
- Check "Production" vs "Preview" vs "Development" scopes

---

## json2video Patterns

### 1. Text Element Positioning

**Video Frame**: 1080x1920 (9:16 vertical)

**Positioning Rules**:
| Element | Position | Coords |
|---------|----------|--------|
| Headline | Top center | `position: 'top-left'` + wrapper div with flexbox |
| Body text | Lower center | `position: 'custom', x: 0, y: 800` |
| Branding | Bottom right | `position: 'bottom-right'` |

**Centering with Wrapper**:
```javascript
{
  type: 'html',
  html: `<div style="width: 1080px; display: flex; justify-content: center;">
    <div style="...">${content}</div>
  </div>`,
  position: 'top-left'  // Wrapper at top-left, content centered inside
}
```

---

### 2. Audio/Soundtrack Configuration

**For looping background music**:
```javascript
{
  type: 'audio',
  src: musicUrl,
  duration: -2,    // Match movie length (REQUIRED)
  loop: -1,        // Infinite loop
  volume: 0.4,     // 40% volume
  'fade-out': 2    // 2s fade at end
}
```

**Add at movie level**, not scene level, for cross-scene playback.

---

### 3. Text Animation Types

| Style ID | Animation | Best For |
|----------|-----------|----------|
| `text/002` | Fade In | Subtle, professional |
| `text/003` | Word-by-Word | Dramatic reveals |
| `text/005` | Jumping | Energetic, playful |
| `text/006` | Revealing | Artistic, elegant |

**Note**: `type: 'text'` with animation requires `style` and `settings` properties.

---

## Common Error Messages

### "JSON parameter needs to be valid JSON"
**Cause**: n8n HTTP Request node accessing undefined data path
**Fix**: Check data structure with console.log, verify path like `$json.results.slides` vs `$json.slides`

### "Unable to acquire lock at .next/dev/lock"
**Cause**: Another Next.js dev server running
**Fix**: Kill the other process or use different port

### "Authentication required" (401)
**Cause**: API route requires authenticated user
**Fix**: Ensure user is logged in, check `supabase.auth.getUser()`

### "Not authorized to delete this generation"
**Cause**: User trying to delete another user's generation
**Fix**: This is correct behavior - ownership verification working

---

## Debugging Workflow

1. **Check n8n Execution Logs**: See actual data at each node
2. **Add console.log in Code Nodes**: `console.log(JSON.stringify($json, null, 2))`
3. **Check Network Tab**: See actual API requests/responses
4. **Check Vercel Function Logs**: See server-side errors
5. **Check Supabase Logs**: See database query results

---

## File Organization

```
scripts/
  json2video-payload-v8.1.js   # Current video workflow code
  static-prompts-v2.0.js       # Current static workflow prompts
  generate-style-music.ts      # Music generation script
  code-for-mcp.json            # MCP documentation data
  archived/                     # Old versions (reference only)

lib/
  supabase.ts                  # Database functions (server)
  supabase/
    client.ts                  # Client-side Supabase
    server.ts                  # Server-side Supabase
  n8n.ts                       # n8n webhook integration (server)
  music-tracks.ts              # Music constants (client-safe)
  utils.ts                     # General utilities
```

---

## Version History

- **v8.1** (Jan 12, 2026): Fixed text positioning, added soundtrack looping
- **v8.0** (Jan 11, 2026): Enhanced text readability (broken positioning)
- **v7.0** (Jan 11, 2026): Restored kinetic typography for headlines
- **v2.0** (Jan 11, 2026): Enhanced character consistency prompts
