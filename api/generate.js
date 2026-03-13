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

    const safeOccasion = occasion || "birthday";

    const userLines = [
      `Occasion: ${safeOccasion}`,
      `Name: ${name}`,
      style ? `Style: ${style}` : "Style: funny",
      age ? `Age: ${age}` : null,
      hobby ? `Hobby: ${hobby}` : null,
    ].filter(Boolean);

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      max_output_tokens: 220,
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text:
                "You write short, warm, natural celebration messages. " +
                "Return exactly 5 unique message options as JSON in this format: " +
                '{"messages":["msg1","msg2","msg3","msg4","msg5"]}. ' +
                "Do not invent an age if one is not provided. " +
                "Keep each message under 60 words."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: userLines.join("\n")
            }
          ]
        }
      ]
    });

    const outputText = response.output_text || "";

    let parsed;
    try {
      parsed = JSON.parse(outputText);
    } catch (e) {
      console.error("Model output was not valid JSON:", outputText);
      return res.status(500).json({ error: "Model returned invalid JSON" });
    }

    if (!parsed.messages || !Array.isArray(parsed.messages)) {
      return res.status(500).json({ error: "Invalid response format from model" });
    }

    return res.status(200).json({ messages: parsed.messages });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: error?.message || "AI generation failed"
    });
  }
}
