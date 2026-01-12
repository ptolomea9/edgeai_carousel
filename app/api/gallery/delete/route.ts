import { NextRequest, NextResponse } from 'next/server'
import { deleteGenerations } from '@/lib/supabase'

export async function POST(request: NextRequest) {
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

    // Delete the generations
    const result = await deleteGenerations(ids)

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
