export const PREDEFINED_RESPONSES: Record<string, string> = {
  "hi": "Hello! I am your AI Health Assistant. How can I help you today?",
  "hello": "Hello! I am your AI Health Assistant. How can I help you today?",
  "fever": "If you have a fever, please take paracetamol (if not allergic), drink plenty of fluids, and get plenty of rest. Use cold compresses if the temperature is high. Please consult a doctor if it persists.",
  "cold": "Keep warm, drink warm fluids like ginger tea, and avoid cold drinks. Rest is essential for recovery.",
  "cough": "Try warm salt water gargles and steam inhalation. If the cough persists for more than 3 days, please consult a doctor.",
  "headache": "Rest in a quiet, dark room. Stay hydrated. If the headache is severe or accompanied by a stiff neck, seek immediate medical help.",
  "stomach": "Avoid solid foods for a few hours. Sip on clear fluids or ORS to stay hydrated. If pain is severe, visit a clinic.",
  "rash": "Avoid scratching the area. Keep it clean and dry. If the rash spreads rapidly or causes breathing issues, call emergency services.",
  "dengue": "Dengue requires immediate medical attention. Watch for high fever, severe headache, and joint pain. Visit a hospital for a blood test.",
  "malaria": "Malaria is serious. If you have high fever with chills and sweating, please visit the nearest health center for testing.",
  "emergency": "For immediate help, call 108 or visit the nearest emergency department right away.",
  "water": "Staying hydrated is crucial. Drink clean, boiled, or filtered water throughout the day.",
  "hygiene": "Wash your hands frequently with soap, especially before meals, to prevent the spread of infections."
};

export const findPredefinedResponse = (message: string): string | null => {
  const lowerMessage = message.toLowerCase();
  for (const [keyword, response] of Object.entries(PREDEFINED_RESPONSES)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }
  return null;
};
