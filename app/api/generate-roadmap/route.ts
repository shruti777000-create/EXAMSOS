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

      // Use generateText with a prompt that encourages valid JSON
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      console.log("API Key check:", apiKey ? `Present (length: ${apiKey.length})` : "MISSING");

      if (!apiKey) {
        console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set");
        throw new Error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set");
      }

      const { text } = await generateText({
        model: google('gemini-2.5-flash', { apiKey }),
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

      // Check if it's a rate limit or service unavailable error
      const isRetryable = error.message?.includes('429') || error.message?.includes('503') || error.message?.includes('Too Many Requests');

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
