import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { heroImage, slideNumber, headline, bodyText, artStyle, totalSlides } =
      await request.json()

    if (!heroImage) {
      return NextResponse.json(
        { error: 'Hero image is required to generate character actions' },
        { status: 400 }
      )
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Build context from slide content
    const slideContext = []
    if (headline?.trim()) {
      slideContext.push(`Headline: "${headline}"`)
    }
    if (bodyText?.trim()) {
      slideContext.push(`Body text: "${bodyText}"`)
    }

    const slideContextStr =
      slideContext.length > 0
        ? slideContext.join('\n')
        : 'No content provided yet'

    const prompt = `You are a visual director creating character poses for a ${totalSlides}-slide carousel advertisement.

Look at the hero image to understand the character/subject.

This is for slide ${slideNumber} of ${totalSlides} with the following content:
${slideContextStr}

Generate a single character action description for how this character should be posed in this slide's image.

Requirements:
- Use Scene → Subject → Action → Environment structure
- Be specific: "standing confidently with arms crossed" not just "standing"
- Include camera framing suggestions: "medium shot", "close-up", "wide shot", etc.
- Consider the ${artStyle || 'default'} visual style
- Keep to 2-3 sentences maximum
- Make the pose relate to the slide's message/theme
- Suggest dynamic or interesting angles when appropriate

Return ONLY the character action text, no JSON, no quotes, no extra formatting.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a visual director specializing in character posing and camera direction for advertising. Analyze the provided image to understand the character, then suggest a specific, detailed pose that matches the slide content. Be concise and direct.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: heroImage,
                },
              },
            ],
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate character action' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      )
    }

    // Clean up the response - remove any quotes or extra whitespace
    const characterAction = content
      .replace(/^["']|["']$/g, '')
      .trim()

    return NextResponse.json({ characterAction })
  } catch (error) {
    console.error('Generate action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
