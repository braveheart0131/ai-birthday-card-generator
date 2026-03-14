export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const name = (body.name || "").trim();
    const age = (body.age || "").toString().trim();
    const hobby = (body.hobby || "").trim();
    const style = (body.style || "funny").trim();
    const occasion = (body.occasion || "birthday").trim();
    const count = Math.min(Math.max(parseInt(body.count || 5, 10), 1), 5);

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const prompt = `Write ${count} different ${style} ${occasion} messages for someone named ${name}.
${age ? `They are turning ${age}.` : ""}
${hobby ? `They enjoy ${hobby}.` : ""}
Each message should be under 40 words.
Do not make up an age if one is not provided.
Return them as a numbered list only.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.9
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error("OpenAI API error:", JSON.stringify(data, null, 2));
      return res.status(openaiResponse.status).json({
        error: data?.error?.message || "OpenAI request failed"
      });
    }

    const text = data?.choices?.[0]?.message?.content || "";

    const messages = text
      .split(/\n+/)
      .map((line) => line.replace(/^[0-9]+[.)-]?\s*/, "").trim())
      .filter(Boolean)
      .slice(0, count);

    if (!messages.length) {
      console.error("No messages parsed from model output:", text);
      return res.status(500).json({ error: "No messages generated" });
    }

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: error?.message || "AI generation failed"
    });
  }
}
