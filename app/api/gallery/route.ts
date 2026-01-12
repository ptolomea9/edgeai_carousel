import { NextRequest, NextResponse } from 'next/server'
import { getGenerations, getGenerationById } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    // Filter by authenticated user's ID for data isolation
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // If specific ID requested, return single generation
    // TODO: Add user ownership check to getGenerationById if needed
    if (id) {
      const generation = await getGenerationById(id)
      if (!generation) {
        return NextResponse.json(
          { error: 'Generation not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(generation)
    }

    // Otherwise return paginated list (filtered by user)
    const filter = (searchParams.get('filter') || 'all') as 'all' | 'static' | 'video'
    const { data, count } = await getGenerations(limit, offset, filter, user.id)

    return NextResponse.json({
      generations: data,
      total: count,
      limit,
      offset,
      hasMore: offset + data.length < count,
    })
  } catch (error) {
    console.error('Gallery API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
