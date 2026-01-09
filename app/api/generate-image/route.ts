import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

export const dynamic = "force-dynamic"

const MAX_PROMPT_LENGTH = 5000
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

interface GenerateImageResponse {
  url: string
  prompt: string
  description?: string
}

interface ErrorResponse {
  error: string
  message?: string
  details?: string
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!apiKey) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Configuration error",
          details: "No Google API key configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to environment variables.",
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const mode = formData.get("mode") as string
    const prompt = formData.get("prompt") as string

    if (!mode) {
      return NextResponse.json<ErrorResponse>({ error: "Mode is required" }, { status: 400 })
    }

    if (!prompt?.trim()) {
      return NextResponse.json<ErrorResponse>({ error: "Prompt is required" }, { status: 400 })
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json<ErrorResponse>(
        { error: `Prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.` },
        { status: 400 },
      )
    }

    const genAI = new GoogleGenAI({ apiKey })

    if (mode === "text-to-image") {
      const imageGenerationPrompt = `Generate a high-quality image based on this description: ${prompt}. The image should be visually appealing and match the description as closely as possible.`

      const response = await genAI.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: imageGenerationPrompt,
        config: {
          responseModalities: ["Text", "Image"],
          aspectRatio: "1:1",
        },
      })

      // Extract image from response
      const parts = response.candidates?.[0]?.content?.parts || []
      let imageUrl = ""
      let description = ""

      for (const part of parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        }
        if (part.text) {
          description = part.text
        }
      }

      if (!imageUrl) {
        return NextResponse.json<ErrorResponse>(
          { error: "No image generated", details: "The model did not return any images" },
          { status: 500 },
        )
      }

      return NextResponse.json<GenerateImageResponse>({
        url: imageUrl,
        prompt: prompt,
        description: description,
      })
    } else if (mode === "image-editing") {
      const image1 = formData.get("image1") as File
      const image1Url = formData.get("image1Url") as string

      const hasImage1 = image1 || image1Url

      if (!hasImage1) {
        return NextResponse.json<ErrorResponse>(
          { error: "At least one image is required for editing mode" },
          { status: 400 },
        )
      }

      if (image1) {
        if (image1.size > MAX_FILE_SIZE) {
          return NextResponse.json<ErrorResponse>(
            { error: `Image too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.` },
            { status: 400 },
          )
        }
        if (!ALLOWED_IMAGE_TYPES.includes(image1.type)) {
          return NextResponse.json<ErrorResponse>(
            { error: "Image has invalid format. Allowed: JPEG, PNG, WebP, GIF" },
            { status: 400 },
          )
        }
      }

      // Convert image to base64
      let imageBase64 = ""
      let imageMimeType = "image/jpeg"

      if (image1) {
        const arrayBuffer = await image1.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        imageBase64 = buffer.toString("base64")
        imageMimeType = image1.type
      } else if (image1Url) {
        // Handle data URL
        if (image1Url.startsWith("data:")) {
          const matches = image1Url.match(/^data:([^;]+);base64,(.+)$/)
          if (matches) {
            imageMimeType = matches[1]
            imageBase64 = matches[2]
          }
        } else {
          // Fetch external URL
          const response = await fetch(image1Url)
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          imageBase64 = buffer.toString("base64")
          imageMimeType = response.headers.get("content-type") || "image/jpeg"
        }
      }

      const editingPrompt = `${prompt}. Edit or transform this image based on the instructions.`

      const response = await genAI.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: imageMimeType,
                  data: imageBase64,
                },
              },
              {
                text: editingPrompt,
              },
            ],
          },
        ],
        config: {
          responseModalities: ["Text", "Image"],
          aspectRatio: "1:1",
        },
      })

      // Extract image from response
      const parts = response.candidates?.[0]?.content?.parts || []
      let imageUrl = ""
      let description = ""

      for (const part of parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        }
        if (part.text) {
          description = part.text
        }
      }

      if (!imageUrl) {
        return NextResponse.json<ErrorResponse>(
          { error: "No image generated", details: "The model did not return any images" },
          { status: 500 },
        )
      }

      return NextResponse.json<GenerateImageResponse>({
        url: imageUrl,
        prompt: editingPrompt,
        description: description,
      })
    } else {
      return NextResponse.json<ErrorResponse>(
        { error: "Invalid mode", details: "Mode must be 'text-to-image' or 'image-editing'" },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error in generate-image route:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to generate image",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
