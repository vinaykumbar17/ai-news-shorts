require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

let geminiRateLimited = false;

// -----------------------------------------
// Word counter
// -----------------------------------------

const countWords = (text) => {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
};

// -----------------------------------------
// Safely limit text to a maximum number
// of words
// -----------------------------------------

const limitWords = (text, maxWords) => {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length <= maxWords) {
    return text.trim();
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
};

// -----------------------------------------
// Generate AI story summary
// -----------------------------------------

const generateStorySummary = async ({
  title,
  snippets,
}) => {
  // -----------------------------------------
  // Stop calling Gemini after rate limit
  // -----------------------------------------

  if (geminiRateLimited) {
    throw new Error("GEMINI_RATE_LIMITED");
  }

  // -----------------------------------------
  // Prepare source information
  // -----------------------------------------

  const sourceText = snippets
    .filter(Boolean)
    .map(
      (snippet, index) =>
        `Source ${index + 1}: ${snippet}`
    )
    .join("\n");

  // -----------------------------------------
  // Gemini prompt
  // -----------------------------------------

  const prompt = `
You are an experienced factual news editor creating a short news story.

Your job is to synthesize the information from the provided sources.
Use ONLY information explicitly supported by those sources.

Headline:
${title}

News sources:
${sourceText}

IMPORTANT RULES:
- Do not invent facts, names, dates, numbers, quotes, locations, events, or outcomes.
- Do not assume information that is not present in the sources.
- If the sources contain limited information, write a shorter factual summary rather than guessing.
- Combine information from multiple sources when they describe the same event.
- Do not simply repeat the headline.
- Avoid vague statements such as "this is significant", "this has attracted attention", or "recent reports indicate" unless the sources actually support them.
- Focus on the concrete event or development described by the sources.

Create:

1. SUMMARY
- Maximum 60 words.
- Clearly state what happened or what the sources are reporting.
- Include the most important concrete details available.
- Prefer specific facts over general commentary.

2. WHY_IT_MATTERS
- Maximum 40 words.
- Explain the practical or immediate significance using ONLY information supported by the sources.
- If the sources do not provide enough information to explain significance, say that the development is notable because it represents the reported change or event, without adding outside assumptions.

Return exactly:

SUMMARY:
<summary>

WHY_IT_MATTERS:
<why it matters>
`;

  // -----------------------------------------
  // Call Gemini
  // -----------------------------------------

  let response;

  try {
    

    response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

  } catch (error) {
    const message =
      error?.message || "";

    // -----------------------------------------
    // Detect Gemini rate limit
    // -----------------------------------------

    if (
      message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.includes(
        "generate_content_free_tier_requests"
      )
    ) {
      geminiRateLimited = true;

      console.error(
        "🛑 Gemini rate limit reached. Using source-based summaries for the remaining stories."
      );
    }

    throw error;
  }

  // -----------------------------------------
  // Read Gemini output
  // -----------------------------------------

  const output = response.text.trim();

  const summaryMatch = output.match(
    /SUMMARY:\s*([\s\S]*?)(?=\n\s*WHY_IT_MATTERS:|$)/i
  );

  const whyMatch = output.match(
    /WHY_IT_MATTERS:\s*([\s\S]*)/i
  );

  let summary = summaryMatch
    ? summaryMatch[1].trim()
    : "";

  let whyItMatters = whyMatch
    ? whyMatch[1].trim()
    : "";

  // -----------------------------------------
  // Validate Gemini format
  // -----------------------------------------

  if (!summary || !whyItMatters) {
    throw new Error(
      "Gemini returned an invalid story format"
    );
  }

  // -----------------------------------------
  // Enforce 60-word summary limit
  // -----------------------------------------

  if (countWords(summary) > 60) {
    console.warn(
      `⚠️ Gemini summary had ${countWords(
        summary
      )} words. Trimming to 60 words.`
    );

    summary = limitWords(summary, 60);
  }

  // -----------------------------------------
  // Enforce 40-word WHY_IT_MATTERS limit
  // -----------------------------------------

  if (countWords(whyItMatters) > 40) {
    console.warn(
      `⚠️ Gemini WHY_IT_MATTERS had ${countWords(
        whyItMatters
      )} words. Trimming to 40 words.`
    );

    whyItMatters = limitWords(
      whyItMatters,
      40
    );
  }

  // -----------------------------------------
  // Final result
  // -----------------------------------------

  return {
    summary,
    whyItMatters,
  };
};

module.exports = {
  generateStorySummary,
};