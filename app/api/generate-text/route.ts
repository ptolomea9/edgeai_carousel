import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { topic, slideCount, artStyle, heroImage } = await request.json()

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

    // Use vision model if hero image provided, otherwise text-only
    const useVision = !!heroImage
    const model = useVision ? 'gpt-4o' : 'gpt-4o-mini'

    // Build the prompt based on whether we have a hero image
    // Enhanced for Kling 2.6 which supports 5-7 elements and prefers detailed, structured prompts
    const characterActionInstructions = useVision
      ? `
3. A character action describing how the character from the hero image should be posed in this slide's image. Use this exact structure:
   - Follow Scene → Subject → Action → Environment format
   - Be specific: "standing confidently with arms crossed" not just "standing"
   - Include camera framing: "medium shot", "close-up", "wide shot", "low angle", etc.
   - Consider the ${artStyle} visual style for appropriate mood/atmosphere
   - Keep to 2-3 sentences maximum
   - Each slide should show variety/progression - make poses relate to the slide's message
   - Suggest dynamic or interesting angles when appropriate
   - Example: "Medium shot, low angle. Owl perched majestically on ancient stone bridge, wings folded neatly against body, head tilted curiously toward viewer. Soft golden hour lighting with misty forest background."`
      : ''

    const responseFormat = useVision
      ? `{
  "slides": [
    { "headline": "Your Headline", "bodyText": "Your body text", "characterAction": "Character pose/action description" }
  ]
}`
      : `{
  "slides": [
    { "headline": "Your Headline Here", "bodyText": "Your body text here" }
  ]
}`

    const prompt = `Generate content for a ${slideCount}-slide carousel about: "${topic}"

Style context: ${artStyle} visual style

For each slide, create:
1. A catchy, attention-grabbing headline (max 50 characters)
2. Body text with 2-3 key points (minimum 2 required - can be bullet points or sentences)${characterActionInstructions}

The content should flow as a story/journey across slides:
- Slide 1: Hook/Introduction
- Middle slides: Key points/Value propositions
- Final slide: Call to action

Return ONLY valid JSON in this exact format:
${responseFormat}`

    // Build messages array - include image if provided
    const userContent: (string | { type: string; text?: string; image_url?: { url: string } })[] = useVision
      ? [
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
        ]
      : prompt

    const systemPrompt = useVision
      ? 'You are a marketing copywriter and visual director specializing in carousel content for social media. Analyze the provided hero image to understand the character/subject, then generate content that includes specific pose/action suggestions for that character across slides. Always respond with valid JSON only, no markdown formatting.'
      : 'You are a marketing copywriter specializing in carousel content for social media. You write concise, engaging copy that captures attention. Always respond with valid JSON only, no markdown formatting.'

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
        temperature: 0.7,
        max_tokens: useVision ? 1500 : 1000,
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
