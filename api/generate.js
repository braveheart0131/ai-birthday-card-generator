import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const { name, age, hobby, style, occasion } = body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Default to birthday for backward compatibility with your current UI
    const safeOccasion = occasion || "birthday";

    // Keep the variable section compact.
    // Omit blank fields to reduce tokens.
    const userLines = [
      `Occasion: ${safeOccasion}`,
      `Name: ${name}`,
      style ? `Style: ${style}` : "Style: funny",
      age ? `Age: ${age}` : null,
      hobby ? `Hobby: ${hobby}` : null,
    ].filter(Boolean);

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      prompt_cache_retention: "24h",
      max_output_tokens: 220,
      temperature: 0.9,
      text: {
        format: {
          type: "json_schema",
          name: "celebration_message_options",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              messages: {
                type: "array",
                minItems: 5,
                maxItems: 5,
                items: {
                  type: "string",
                  maxLength: 180,
                },
              },
            },
            required: ["messages"],
          },
        },
      },
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text:
                "You write short, warm, natural celebration messages. " +
                "Return exactly 5 unique message options. " +
                "Each message must be concise, friendly, and suitable for a card, text, or social post. " +
                "Do not number the messages. " +
                "Do not include explanations. " +
                "Do not invent an age if one is not provided. " +
                "Do not repeat the same wording across options. " +
                "Keep each message under 60 words.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: userLines.join("\n"),
            },
          ],
        },
      ],
    });

    let parsed;

    try {
      parsed = JSON.parse(response.output_text);
    } catch (parseError) {
      console.error("JSON parse failed:", parseError);
      console.error("Raw model output:", response.output_text);
      return res.status(500).json({ error: "Invalid model response" });
    }

    if (
      !parsed ||
      !Array.isArray(parsed.messages) ||
      parsed.messages.length !== 5
    ) {
      console.error("Unexpected response format:", parsed);
      return res.status(500).json({ error: "Unexpected response format" });
    }

    return res.status(200).json({
      messages: parsed.messages,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "AI generation failed" });
  }
}
