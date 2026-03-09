export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const { name, age, hobby, style } = body;

    if (!name || !age) {
      return res.status(400).json({ error: "Name and age are required" });
    }

    const prompt = `Write a ${style || "funny"} birthday message for someone named ${name} who is turning ${age}. ${
      hobby ? `They enjoy ${hobby}.` : ""
    } Keep it fun, warm, and under 60 words.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI request failed"
      });
    }

    return res.status(200).json({
      message: data.choices?.[0]?.message?.content || "No message generated"
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "AI generation failed" });
  }
}
