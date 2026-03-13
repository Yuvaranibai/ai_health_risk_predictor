import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Helper function to execute Gemini API calls with exponential backoff retry logic.
 * Specifically handles 429 (Resource Exhausted) errors.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Check if it's a 429 error (Rate limit / Quota exceeded)
      const isRateLimit = 
        error?.message?.includes('429') || 
        error?.message?.toLowerCase().includes('quota') ||
        error?.status === 429 || 
        error?.code === 429;
      
      if (isRateLimit && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Gemini API rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function analyzeSymptoms(text: string, language: string) {
  return withRetry(async () => {
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract medical symptoms and severity from the following text: "${text}". 
      The text might be in ${language} or another language. 
      Return as JSON with "symptoms" (array of strings in English) and "severity" (Low, Medium, High).`,
      config: { responseMimeType: "application/json" }
    });
    const response = await model;
    return JSON.parse(response.text || "{}");
  });
}

export async function analyzeImage(base64Image: string, mimeType: string) {
  return withRetry(async () => {
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: "Analyze this medical image. Focus on detecting skin diseases (like rashes, lesions, infections) or bone fractures/breaks. Identify the potential condition, severity, and if it's an emergency. Return JSON with 'condition', 'severity' (Low, Medium, High), 'isEmergency' (boolean), 'description', and 'confidence' (0-100)." }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    const response = await model;
    return JSON.parse(response.text || "{}");
  });
}

export async function translateText(text: string, targetLanguage: string) {
  return withRetry(async () => {
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following medical text to ${targetLanguage}: "${text}". Return only the translated text.`,
    });
    const response = await model;
    return response.text || text;
  });
}

export async function predictHealthRisk(patientData: any, symptoms: string[], history: any, imageResult: any, language: string = 'English') {
  return withRetry(async () => {
    const prompt = `
      Patient: ${JSON.stringify(patientData)}
      Symptoms: ${symptoms.join(", ")}
      History: ${JSON.stringify(history)}
      Image Analysis: ${JSON.stringify(imageResult)}
      
      Based on the above, predict the health risk level (Low, Medium, High).
      Calculate a risk score from 0 to 100.
      Provide a clear explanation and recommendations.
      Identify if it's an emergency (Chest pain, severe bleeding, unconscious, etc.).
      
      IMPORTANT: Provide the "explanation" and "recommendations" in ${language}.
      
      Return JSON: {
        "riskLevel": "Low" | "Medium" | "High",
        "riskScore": number,
        "explanation": string,
        "recommendations": string[],
        "isEmergency": boolean,
        "specialtyNeeded": "Cardiac" | "Skin" | "Pregnancy" | "Bone" | "Respiratory" | "General",
        "imageAnalysis": { "condition": string, "severity": string, "description": string } | null
      }
    `;

    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const response = await model;
    return JSON.parse(response.text || "{}");
  });
}

export async function searchHospitals(location: any, specialty: string) {
  return withRetry(async () => {
    const prompt = `Find the nearest healthcare centers (PHC, Clinic, or Hospital) for a patient at:
      Village/Town: ${location.village}
      District: ${location.district}
      State: ${location.state}
      Postal Code: ${location.postal_code}
      
      The patient needs a specialist in: ${specialty}.
      
      Return a list of real healthcare facilities with their:
      - name
      - type (PHC, Clinic, or Hospital)
      - address
      - phone
      - hours
      - lat (approximate latitude)
      - lng (approximate longitude)
      - distance (approximate distance from the provided location in km)
      
      Return JSON as an array of objects:
      [{ "name": string, "type": string, "address": string, "phone": string, "hours": string, "lat": number, "lng": number, "distance": number }]
    `;

    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    const response = await model;
    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse hospital search results", e);
      return [];
    }
  });
}

export async function chatWithDoctor(messages: { role: string, content: string }[], language: string) {
  return withRetry(async () => {
    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const systemInstruction = `You are a helpful medical assistant (Doctor) for rural healthcare. 
    A user is asking about symptoms or health concerns. 
    1. Provide precautions and immediate steps.
    2. Recommend the type of health center they should visit (PHC, CHC, or District Hospital).
    3. Keep the tone professional, empathetic, and clear.
    4. Respond in ${language}.
    5. Always include a disclaimer that this is AI-assisted advice and they should see a real doctor for emergencies.`;

    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: history,
      config: {
        systemInstruction
      }
    });
    const response = await model;
    return response.text || "I'm sorry, I couldn't process that request.";
  });
}

export async function chatWithCommunityBot(message: string, language: string) {
  return withRetry(async () => {
    const systemInstruction = `You are a helpful Community Health Assistant for a rural village network. 
    A user has posted a message in the community chat. 
    1. If they ask a health question, provide brief, helpful advice or precautions.
    2. If they share symptoms, suggest they talk to the AI Doctor or visit a PHC.
    3. Keep the tone friendly, community-oriented, and supportive.
    4. Respond in ${language}.
    5. Keep it short (max 2 sentences).`;

    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction
      }
    });
    const response = await model;
    return response.text || "I'm here to help the community!";
  });
}
