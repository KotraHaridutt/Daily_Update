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