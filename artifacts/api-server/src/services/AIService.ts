import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../lib/logger";



export class AIService {
  /**
   * Financial Intelligence Layer
   * Provides personalized insights using LLM
   */
  static async getFinancialAdvice(userContext: any): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log(`🤖 AI INITIATING: Key present? ${!!apiKey} (${apiKey?.substring(0, 6)}...)`);
    
    if (!apiKey) {
      return "AI Assistant is currently in offline mode. Please configure GEMINI_API_KEY for personalized insights.";
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `
        You are Nexora AI, a elite financial advisor. 
        Analyze this user's financial profile and provide 3 short, actionable, and data-driven pieces of advice.
        
        User Context:
        ${JSON.stringify(userContext, null, 2)}
        
        Format the response as a bulleted list. Be professional, direct, and encouraging.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      logger.error(err, "AI Generation Error");
      return "Nexora is currently analyzing your deeper data patterns. Please check back in a few moments for elite financial strategies.";
    }
  }
}
