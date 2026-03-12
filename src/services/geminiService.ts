import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }
  return new GoogleGenAI({ apiKey });
};

export async function getHealthInsights(metrics: any[]) {
  const ai = getAI();
  const prompt = `As a health assistant, analyze these metrics for Sarah Jenkins and provide 2 concise, encouraging insights.
  Metrics: ${JSON.stringify(metrics)}
  
  Return the response as a JSON array of objects with 'title' and 'description'.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["title", "description"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Error:", error);
    return [
      { title: "Hydration Reminder", description: "You're doing great! Keep drinking water to stay energized." },
      { title: "Active Week", description: "Your consistency is paying off. Keep up the good work!" }
    ];
  }
}
