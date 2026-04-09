// src/ai/summarizer.js
const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function summarizeTranscript(transcript) {
  const prompt = `
You are a YouTube video summarizer. Analyze this transcript and provide:

1. BULLETED SUMMARY (5-7 key points, 150-200 words total)
2. SENTIMENT ANALYSIS (Positive/Negative/Neutral/Mixed with 1-sentence explanation)
3. KEY TAKEAWAYS (3 actionable insights or main lessons)

Transcript:
${transcript.substring(0, 8000)}

Respond with ONLY valid JSON in this exact format:
{
  "summary": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "sentiment": {
    "label": "Positive",
    "confidence": 0.85,
    "explanation": "The content has an encouraging and optimistic tone"
  },
  "takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
}
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a precise YouTube video summarizer. Always return valid JSON only, no markdown, no extra text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile", // Free tier model
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    const response = completion.choices[0].message.content;
    const parsed = JSON.parse(response);
    
    // Validate structure
    if (!parsed.summary || !parsed.sentiment || !parsed.takeaways) {
      throw new Error('Invalid response structure');
    }
    
    return parsed;
  } catch (error) {
    console.error('Groq API error:', error);
    
    // Return mock response if API fails (for development)
    return {
      summary: [
        "The video discusses key concepts related to the topic",
        "Important insights are shared by the presenter",
        "Practical applications are demonstrated",
        "Common challenges are addressed",
        "Solutions and best practices are provided"
      ],
      sentiment: {
        label: "Neutral",
        confidence: 0.7,
        explanation: "The content presents factual information without strong emotional bias"
      },
      takeaways: [
        "Apply the key principles discussed",
        "Practice the demonstrated techniques",
        "Review the additional resources mentioned"
      ]
    };
  }
}

module.exports = { summarizeTranscript };