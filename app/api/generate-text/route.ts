import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { topic, slideCount, artStyle } = await request.json()

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const prompt = `Generate content for a ${slideCount}-slide carousel about: "${topic}"

Style context: ${artStyle} visual style

For each slide, create:
1. A catchy, attention-grabbing headline (max 50 characters)
2. Brief body text with key points (2-3 short bullet points or 1-2 sentences)

The content should flow as a story/journey across slides:
- Slide 1: Hook/Introduction
- Middle slides: Key points/Value propositions
- Final slide: Call to action

Return ONLY valid JSON in this exact format:
{
  "slides": [
    { "headline": "Your Headline Here", "bodyText": "Your body text here" }
  ]
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a marketing copywriter specializing in carousel content for social media. You write concise, engaging copy that captures attention. Always respond with valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate text' },
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

    // Parse the JSON response
    try {
      // Clean up potential markdown code blocks
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      const parsed = JSON.parse(cleanedContent)
      return NextResponse.json(parsed)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content)
      return NextResponse.json(
        { error: 'Failed to parse generated content' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Generate text error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
