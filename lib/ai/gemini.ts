import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = "gemini-2.5-flash-lite";

export interface Level3Feedback {
  accuracyScore: number;
  captured: string[];
  missed: string[];
  vocabulary: { word: string; note: string }[];
  suggestion: string;
}

export interface Level4SentenceFeedback {
  original: string;
  userVersion: string;
  score: number;
  errors: string[];
}

export interface Level4Feedback {
  accuracyScore: number;
  sentences: Level4SentenceFeedback[];
  commonErrors: string[];
  suggestion: string;
}

export async function getPart2Explanation(
  question: string,
  options: { label: string; text: string }[],
  correctOption: string
): Promise<string> {
  const optionsText = options.map((o) => `(${o.label}) ${o.text}`).join("\n");
  const prompt = `You are a TOEIC Part 2 English coach.

Question: ${question}
${optionsText}
Correct answer: ${correctOption}

Explain in Vietnamese (2-3 sentences):
1. Why (${correctOption}) is correct
2. Why each wrong option is incorrect

Return ONLY valid JSON: {"explanation": "<Vietnamese text>"}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const text = response.text ?? "";
  // Extract first JSON object found in response
  const match = text.match(/\{[\s\S]*?"explanation"\s*:\s*"[\s\S]*?"\s*\}/);
  const parsed = match ? JSON.parse(match[0]) : {};
  return parsed.explanation ?? "";
}

export async function getLevel3Feedback(
  transcript: string,
  userSummary: string
): Promise<Level3Feedback> {
  const prompt = `You are a TOEIC listening coach evaluating a student's listening comprehension.

ACTUAL TRANSCRIPT:
${transcript}

STUDENT'S SUMMARY:
${userSummary}

Evaluate how well the student captured the key information from the transcript. Return ONLY valid JSON with this exact structure:
{
  "accuracyScore": <0-100 integer>,
  "captured": [<list of key points the student correctly captured, max 4 short strings>],
  "missed": [<list of important information the student missed, max 4 short strings>],
  "vocabulary": [<list of objects {word, note} for notable vocab in transcript, max 3>],
  "suggestion": "<2-3 sentence overall feedback in Vietnamese>"
}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return JSON.parse(response.text ?? "{}") as Level3Feedback;
}

export async function getLevel4Feedback(
  sentences: { content: string; speaker: string | null }[],
  userTranscript: string
): Promise<Level4Feedback> {
  const fullTranscript = sentences.map((s) => (s.speaker ? `[${s.speaker}] ` : "") + s.content).join("\n");
  const userLines = userTranscript.trim().split("\n").filter(Boolean);

  const prompt = `You are a TOEIC listening coach evaluating a student's verbatim transcription.

ACTUAL TRANSCRIPT (line by line):
${fullTranscript}

STUDENT'S TRANSCRIPTION:
${userTranscript}

Evaluate the accuracy of each original sentence against the student's attempt. Return ONLY valid JSON:
{
  "accuracyScore": <0-100 integer, overall word accuracy>,
  "sentences": [
    {
      "original": "<original sentence>",
      "userVersion": "<closest matching student line or empty string>",
      "score": <0-100>,
      "errors": [<short error descriptions, max 2 per sentence>]
    }
  ],
  "commonErrors": [<up to 3 recurring error patterns>],
  "suggestion": "<2-3 sentence overall feedback in Vietnamese>"
}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return JSON.parse(response.text ?? "{}") as Level4Feedback;
}
