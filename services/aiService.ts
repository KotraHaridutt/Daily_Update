import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY || "";

if (!API_KEY) {
  console.error("🚨 API KEY MISSING! Please create a .env file with VITE_GOOGLE_API_KEY");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const generateSmartTags = async (text: string) => {
  try {
    if (!text || text.length < 10) return [];
    if (!API_KEY) return [];

    const prompt = `
      Analyze this journal entry and generate 3 relevant hashtags.
      Return ONLY the hashtags separated by spaces (e.g. #React #Learning #Tired).
      Do not write any introductory text.
      
      Entry: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();
    
    // Split by space and filter out empty strings
    return output.split(' ').map(t => t.trim()).filter(t => t.startsWith('#'));
  } catch (error) {
    console.error("AI Error:", error);
    return [];
  }
};

export interface VibeCheckResult {
  mood: 'flow' | 'stuck' | 'chill' | 'neutral';
  effort: number;
  observation: string;
}

export const analyzeVibe = async (text: string): Promise<VibeCheckResult | null> => {
  try {
    if (!text || text.length < 10) return null;
    if (!API_KEY) return null;

    const prompt = `
      Analyze the sentiment and intensity of this journal entry.
      1. Determine the Mood: 'flow' (high energy/speed), 'stuck' (frustrated/difficult), 'chill' (relaxed/learning), or 'neutral'.
      2. Estimate Effort (1-5): 1 is easy/lazy, 5 is intense grinding/burnout.
      3. Write a short 1-sentence observation addressing the user directly about why you chose this.

      Return ONLY valid JSON:
      {
        "mood": "flow",
        "effort": 4,
        "observation": "You seem frustrated by the CSS bugs."
      }

      Entry: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();
    
    // Clean up code blocks if the AI adds them (```json ... ```)
    const cleanJson = output.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson) as VibeCheckResult;
  } catch (error) {
    console.error("AI Vibe Check Error:", error);
    return null;
  }
};


export const generateQuest = async (workLog: string, mood: string): Promise<string> => {
  try {
    if (!workLog || workLog.length < 10) return "";
    if (!API_KEY) return "";

    const prompt = `
      Act as a Senior Engineering Manager or RPG Quest Giver.
      Based on the user's work log today and their mood (${mood}), assign a SINGLE, high-impact mission for tomorrow.
      
      Rules:
      1. If mood is 'stuck', suggest a specific debugging angle or a fresh start.
      2. If mood is 'flow', suggest the next logical feature extension.
      3. Keep it under 15 words. Imperative tense (e.g., "Refactor the X component").
      4. No fluff. No "Tomorrow you should...". Just the mission.

      Work Log: "${workLog}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Quest Generation Error:", error);
    return "";
  }
};

// ... inside aiService.ts ...

export interface ChallengeResult {
  question: string;
  answer: string;
}

export const generateChallenge = async (topic: string): Promise<ChallengeResult | null> => {
  try {
    if (!topic || topic.length < 3) return null;
    if (!API_KEY) return null;

    const prompt = `
      You are a Senior Engineer conducting a technical interview.
      The user claims to have learned: "${topic}".
      
      1. Generate ONE specific, tricky question to test their understanding of this concept. 
         (Do not ask generic questions like "What is it?". Ask about edge cases, trade-offs, or internal mechanics).
      2. Provide the correct answer concisely.

      Return ONLY valid JSON:
      {
        "question": "If dependency array is empty, when does cleanup run?",
        "answer": "It runs only when the component unmounts."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanJson = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson) as ChallengeResult;
  } catch (error) {
    console.error("Challenge Gen Error:", error);
    return null;
  }
};