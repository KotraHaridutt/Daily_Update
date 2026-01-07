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