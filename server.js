require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ai-travel-guide-murf-ai" });
});

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`Server configuration missing: ${name}`);
    error.status = 503;
    throw error;
  }
  return value;
}

app.post("/api/plan", async (req, res) => {
  try {
    const destination = String(req.body?.destination || "").trim();
    const days = Number(req.body?.days);
    const budget = String(req.body?.budget || "moderate").trim();
    const interests = String(req.body?.interests || "").trim();

    if (!destination || destination.length > 160) {
      return res.status(400).json({ error: "Enter a destination (maximum 160 characters)." });
    }
    if (!Number.isInteger(days) || days < 1 || days > 14) {
      return res.status(400).json({ error: "Trip duration must be between 1 and 14 days." });
    }
    if (budget.length > 80 || interests.length > 500) {
      return res.status(400).json({ error: "Budget or interests are too long." });
    }

    const apiKey = requireEnv("GEMINI_API_KEY");
    const prompt = [
      "You are a practical travel-planning assistant.",
      "Create a useful itinerary, but do not invent live prices, opening hours, current visa rules, or availability.",
      "Clearly label estimates and ask the traveler to verify time-sensitive facts with official sources.",
      "Mention accessible transport and safety considerations where relevant.",
      "Return plain, well-structured Markdown with an overview, day-by-day plan, transport ideas, food/culture suggestions, budget categories, packing notes, and verification checklist.",
      `Destination: ${destination}`,
      `Duration: ${days} day(s)`,
      `Budget preference: ${budget}`,
      `Interests: ${interests || "General sightseeing and local culture"}`
    ].join("\n");

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
        }),
        signal: AbortSignal.timeout(45000)
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Gemini request failed:", response.status);
      return res.status(response.status === 429 ? 429 : 502).json({
        error: "The travel planner could not generate a plan. Check the Gemini key, quota, and model access."
      });
    }

    const plan = data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("\n")
      .trim();

    if (!plan) {
      return res.status(502).json({ error: "Gemini returned an empty plan. Please try again." });
    }
    return res.json({ plan });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return res.status(504).json({ error: "The travel planner timed out. Please try again." });
    }
    console.error("Plan route error:", error.message);
    return res.status(error.status || 500).json({ error: error.status === 503 ? error.message : "Unable to generate travel plan." });
  }
});

app.post("/api/speech", async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    const voiceId = String(req.body?.voiceId || "en-US-natalie").trim();

    if (!text) return res.status(400).json({ error: "Provide text to speak." });
    if (text.length > 3000) {
      return res.status(400).json({ error: "Text must be 3,000 characters or fewer." });
    }
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(voiceId)) {
      return res.status(400).json({ error: "Invalid voice ID." });
    }

    const apiKey = requireEnv("MURF_API_KEY");
    const response = await fetch("https://api.murf.ai/v1/speech/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        text,
        voiceId,
        format: "MP3",
        modelVersion: "GEN2"
      }),
      signal: AbortSignal.timeout(60000)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Murf request failed:", response.status);
      return res.status(response.status === 429 ? 429 : 502).json({
        error: "Speech generation failed. Check the Murf key, voice ID, quota, and current API schema."
      });
    }

    const audioUrl = data?.audioFile || data?.audio_file || data?.audioUrl || data?.audio_url;
    if (!audioUrl || typeof audioUrl !== "string") {
      return res.status(502).json({
        error: "Murf did not return a recognized audio URL. Check the current Murf API response schema."
      });
    }

    // The client can play this provider URL. Do not log credentials or prompt text.
    return res.json({ audioUrl });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return res.status(504).json({ error: "Speech generation timed out. Please try again." });
    }
    console.error("Speech route error:", error.message);
    return res.status(error.status || 500).json({ error: error.status === 503 ? error.message : "Unable to generate speech." });
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON request body." });
  }
  console.error("Unhandled server error:", err.message);
  return res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`AI Travel Guide running at http://localhost:${PORT}`);
});
