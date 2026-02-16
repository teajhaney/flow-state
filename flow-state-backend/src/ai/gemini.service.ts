import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private defaultApiKey: string | undefined;
  private static readonly DEFAULT_MODEL = 'gemini-2.0-flash';

  constructor(private configService: ConfigService) {
    // Try to use env variable as a fallback API key
    this.defaultApiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (this.defaultApiKey) {
      this.logger.log('Gemini initialized with environment API key.');
    } else {
      this.logger.warn(
        'No GEMINI_API_KEY in env. Users must provide their key in app settings.',
      );
    }
  }

  // Get a model instance — uses user-provided key + model, falls back to env key + default model
  private getModel(userApiKey?: string, modelName?: string) {
    const apiKey = userApiKey || this.defaultApiKey;
    if (!apiKey) return null;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = modelName || GeminiService.DEFAULT_MODEL;
    this.logger.log(`Using model: ${model}`);
    return genAI.getGenerativeModel({ model });
  }

  async analyzeFrame(
    base64Image: string,
    userApiKey?: string,
    modelName?: string,
  ): Promise<{ distracted: boolean; confidence: number; reason: string }> {
    const model = this.getModel(userApiKey, modelName);

    if (!model) {
      return {
        distracted: false,
        confidence: 0,
        reason: 'No API key configured. Add your Gemini API key in Settings.',
      };
    }

    try {
      // Remove data:image/jpeg;base64, prefix if present
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

      const prompt = `
        Analyze this webcam frame of a person working.
        Your task is to detect if they are distracted or focused.
        Signs of distraction: looking away from screen for prolonged time, using a phone, talking to someone else, leaving the desk.
        Signs of focus: looking at screen, typing, reading.
        
        Return a JSON object ONLY (no markdown, no code blocks):
        {
          "distracted": boolean,
          "confidence": number (0-100),
          "reason": "short description of behavior"
        }
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg',
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Clean up markdown formatting if present
      const cleanText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleanText);
    } catch (error: any) {
      this.logger.error('Error analyzing frame with Gemini:', error?.message || error);
      
      // Detect rate limiting (429)
      if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
        return { distracted: false, confidence: 0, reason: 'Rate limited — please wait' };
      }

      // Detect invalid API key
      if (error?.status === 400 || error?.status === 403) {
        return { distracted: false, confidence: 0, reason: 'Invalid API key — check Settings' };
      }

      return { distracted: false, confidence: 0, reason: 'Analysis failed — check your API key' };
    }
  }
}
