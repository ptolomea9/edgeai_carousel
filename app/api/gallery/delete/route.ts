import { NextRequest, NextResponse } from 'next/server'
import { deleteGenerations } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid ids array' },
        { status: 400 }
      )
    }

    // Validate all IDs are strings
    if (!ids.every((id: unknown) => typeof id === 'string')) {
      return NextResponse.json(
        { error: 'All ids must be strings' },
        { status: 400 }
      )
    }

    // Delete the generations (only if owned by user)
    const result = await deleteGenerations(ids, user.id)

    return NextResponse.json({
      deleted: result.deleted,
      errors: result.errors,
      success: result.errors.length === 0,
    })
  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
