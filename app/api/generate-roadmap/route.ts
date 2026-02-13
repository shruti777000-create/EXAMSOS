import { generateText, Output } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

const moduleSchema = z.object({
  moduleName: z.string(),
  estimatedWeightage: z.number(),
  aiDifficultyScore: z.number().min(1).max(5),
  topics: z.array(
    z.object({
      topicName: z.string(),
      requiredStudyTimeHrs: z.number(),
    })
  ),
})

const roadmapOutputSchema = z.object({
  modules: z.array(moduleSchema),
})

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  const { syllabusText, examDate, dailyHours, name } = await req.json()

  const daysUntilExam = Math.max(
    1,
    Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )

  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      console.log(`Generating roadmap for: ${name} (Attempt ${attempt + 1}/${maxRetries})`);

      // Support both common env variable names for Gemini API key
      const apiKeyRaw = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
      const apiKey = apiKeyRaw?.trim();
      console.log("API Key check:", apiKey ? `Present (length: ${apiKey.length})` : "MISSING");

      if (!apiKey || !apiKey.length) {
        const msg =
          "Gemini API key is not set. Add GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY to .env.local. " +
          "Get a key at https://aistudio.google.com/app/apikey";
        console.error("❌", msg);
        throw new Error(msg);
      }

      const { text } = await generateText({
        model: google('gemini-flash-latest', { apiKey }),
        messages: [
          {
            role: "user",
            content: `You are an expert academic study planner. Analyze the following syllabus and create a structured study plan.

SYLLABUS:
${syllabusText}

CONSTRAINTS:
- Exam name: ${name}
- Exam date: ${examDate} (${daysUntilExam} days from now)
- Daily available study hours: ${dailyHours}
- Total available study hours: ${daysUntilExam * dailyHours}

INSTRUCTIONS:
1. Break the syllabus into logical modules.
2. Structure the output strictly as JSON matching this schema:
{
  "modules": [
    {
      "moduleName": "string",
      "estimatedWeightage": number,
      "aiDifficultyScore": number (1-5),
      "topics": [
        {
          "topicName": "string",
          "requiredStudyTimeHrs": number
        }
      ]
    }
  ]
}
3. Ensure valid JSON. Do not include markdown formatting (like \`\`\`json).

Return ONLY the JSON.`,
          },
        ],
      })

      console.log("Raw Gemini response:", text);

      // Clean up potential markdown formatting
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

      let output;
      try {
        output = JSON.parse(cleanedText);
      } catch (e) {
        console.error("JSON parse error:", e);
        throw new Error("Failed to parse AI response as JSON. Raw response: " + text);
      }

      // Validate against schema
      const parsedOutput = roadmapOutputSchema.safeParse(output);
      if (!parsedOutput.success) {
        throw new Error("Invalid schema: " + JSON.stringify(parsedOutput.error.errors));
      }

      console.log("Generation successful");
      return Response.json({ roadmap: parsedOutput.data })

    } catch (error: any) {
      console.error(`Error generating roadmap (Attempt ${attempt + 1}):`, error);

      const errMsg = error.message ?? String(error);
      const isInvalidKey =
        errMsg.includes("API key not valid") ||
        errMsg.includes("invalid API key") ||
        errMsg.includes("400") ||
        errMsg.includes("403") ||
        errMsg.includes("INVALID_ARGUMENT");

      if (isInvalidKey) {
        const msg =
          "Gemini API key is invalid or expired. Create a new key at https://aistudio.google.com/app/apikey and set GOOGLE_GENERATIVE_AI_API_KEY in .env.local.";
        return Response.json({ error: "Invalid API key", details: msg }, { status: 401 });
      }

      // Check if it's a rate limit or service unavailable error
      const isRetryable = errMsg.includes("429") || errMsg.includes("503") || errMsg.includes("Too Many Requests");

      if (isRetryable && attempt < maxRetries - 1) {
        const waitTime = 2000 * Math.pow(2, attempt); // 2s, 4s
        console.log(`Rate limit hit. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        attempt++;
        continue;
      }

      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      return Response.json({ error: "Failed to generate roadmap", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
  }
  return Response.json({ error: "Failed to generate roadmap after retries" }, { status: 500 });
}
