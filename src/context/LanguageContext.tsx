import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'kn' | 'hi';

interface Translations {
  [key: string]: {
    [K in Language]: string;
  };
}

const translations: Translations = {
  appName: { en: 'AI Health Risk Predictor', kn: 'AI ಆರೋಗ್ಯ ಅಪಾಯ ಮುನ್ಸೂಚಕ', hi: 'AI स्वास्थ्य जोखिम भविष्यವಕ್ತಾ' },
  startScreening: { en: 'Start Screening', kn: 'ತಪಾಸಣೆ ಪ್ರಾರಂಭಿಸಿ', hi: 'स्क्रीनिंग शुरू करें' },
  emergency: { en: 'EMERGENCY', kn: 'ತುರ್ತು', hi: 'आपातकालीन' },
  name: { en: 'Name', kn: 'ಹೆಸರು', hi: 'नाम' },
  age: { en: 'Age', kn: 'ವಯಸ್ಸು', hi: 'आयु' },
  sex: { en: 'Sex', kn: 'ಲಿಂಗ', hi: 'लिंग' },
  location: { en: 'Location', kn: 'ಸ್ಥಳ', hi: 'स्थान' },
  symptoms: { en: 'Symptoms', kn: 'ಲಕ್ಷಣಗಳು', hi: 'लक्षण' },
  history: { en: 'Medical History', kn: 'ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ', hi: 'चिकित्सा इतिहास' },
  riskLevel: { en: 'Risk Level', kn: 'ಅಪಾಯದ ಮಟ್ಟ', hi: 'जोखिम स्तर' },
  low: { en: 'Low', kn: 'ಕಡಿಮೆ', hi: 'कम' },
  medium: { en: 'Medium', kn: 'ಮಧ್ಯಮ', hi: 'मध्यम' },
  high: { en: 'High', kn: 'ಹೆಚ್ಚು', hi: 'उच्च' },
  next: { en: 'Next', kn: 'ಮುಂದೆ', hi: 'अगला' },
  back: { en: 'Back', kn: 'ಹಿಂದೆ', hi: 'पीछे' },
  submit: { en: 'Submit', kn: 'ಸಲ್ಲಿಸಿ', hi: 'जमा करें' },
  voiceInput: { en: 'Voice Input', kn: 'ಧ್ವನಿ ಇನ್‌ಪುಟ್', hi: 'वॉयस इनपुट' },
  imageInput: { en: 'Image Input', kn: 'ಚಿತ್ರ ಇನ್‌ಪುಟ್', hi: 'इमेज इनपुट' },
  hospitalSearch: { en: 'Find Hospital', kn: 'ಆಸ್ಪತ್ರೆ ಹುಡುಕಿ', hi: 'अस्पताल खोजें' },
  doctorDashboard: { en: 'Doctor Dashboard', kn: 'ವೈದ್ಯರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', hi: 'डॉक्टर डैशबोर्ड' },
  chwDashboard: { en: 'Health Worker', kn: 'ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತ', hi: 'स्वास्थ्य कार्यकर्ता' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
