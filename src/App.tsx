import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Activity, MapPin, User, Thermometer, 
  AlertCircle, Phone, Home, Clipboard, Shield,
  Camera, Mic, Image as ImageIcon, CheckCircle,
  Stethoscope, Users, BarChart3, ChevronRight,
  ArrowLeft, Languages, Navigation, Download
} from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Card3D, Button3D, Input3D, Header, Title3D, cn } from './components/UI';
import { analyzeSymptoms, analyzeImage, predictHealthRisk, translateText, searchHospitals } from './services/gemini';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

import CHWDashboard from './pages/CHWDashboard';
import DoctorChat from './pages/DoctorChat';
import CommunityChat from './pages/CommunityChat';
import DoctorDashboard from './pages/DoctorDashboard';

// --- Pages ---

const LandingPage = () => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [view, setView] = useState<'hero' | 'language' | 'dashboard'>(() => {
    return localStorage.getItem('preferred_lang') ? 'dashboard' : 'hero';
  });

  const selectLanguage = (lang: 'en' | 'kn' | 'hi') => {
    setLanguage(lang);
    localStorage.setItem('preferred_lang', lang);
    setView('dashboard');
  };

  if (view === 'hero') {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 overflow-hidden relative">
        {/* Background 3D Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -left-1/4 w-full h-full border-[40px] border-emerald-500/10 rounded-full"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/4 -right-1/4 w-full h-full border-[20px] border-indigo-500/10 rounded-full"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-12">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40"
          >
            <Heart className="text-slate-950 w-16 h-16" />
          </motion.div>

          <Title3D text="AI HEALTH RISK PREDICTOR" />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-slate-400 font-black uppercase tracking-widest text-center max-w-sm"
          >
            Revolutionizing Rural Healthcare with Artificial Intelligence
          </motion.p>

          <Button3D onClick={() => setView('language')}>
            Get Started
          </Button3D>
        </div>
      </div>
    );
  }

  if (view === 'language') {
    return (
      <div className="min-h-screen bg-brand-bg p-6 flex flex-col items-center justify-center gap-12 relative">
        <button 
          onClick={() => setView('hero')}
          className="absolute top-8 left-8 p-4 glass-morphism rounded-2xl text-white hover:text-emerald-500 transition-colors flex items-center gap-2 font-black uppercase text-xs"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl mx-auto mb-6 flex items-center justify-center border border-emerald-500/20">
            <Languages className="text-emerald-500 w-10 h-10" />
          </div>
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Select Language</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Choose your preferred tongue</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 w-full max-w-sm">
          <Button3D onClick={() => selectLanguage('en')}>English</Button3D>
          <Button3D onClick={() => selectLanguage('kn')} variant="primary">ಕನ್ನಡ (Kannada)</Button3D>
          <Button3D onClick={() => selectLanguage('hi')} variant="primary">ಹಿन्दी (Hindi)</Button3D>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col gap-8">
        {/* Back to Language Selection */}
        <button 
          onClick={() => setView('language')}
          className="self-start p-3 glass-morphism rounded-xl text-slate-400 hover:text-emerald-500 transition-colors flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"
        >
          <Languages size={14} /> Change Language
        </button>

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden glass-morphism rounded-[3rem] p-10 text-white card-3d-shadow border-emerald-500/10"
        >
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-4 uppercase italic tracking-tighter leading-none">{t('appName')}</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs max-w-xs">Your AI companion for early health detection and safety.</p>
            <Button3D 
              onClick={() => navigate('/screening')}
              className="mt-8"
            >
              {t('startScreening')}
            </Button3D>
          </div>
          <Heart className="absolute -right-12 -bottom-12 w-80 h-80 text-emerald-500/5 rotate-12" />
        </motion.div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card3D 
            onClick={() => navigate('/doctor-chat')}
            className="flex flex-col gap-6 p-10 group cursor-pointer border-emerald-500/5 bg-emerald-500/5"
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform border border-emerald-500/20">
              <Stethoscope size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Talk to Doctor</h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Get instant precautions and health center advice.</p>
            </div>
            <ChevronRight className="ml-auto text-slate-700" />
          </Card3D>

          <Card3D 
            onClick={() => navigate('/community-chat')}
            className="flex flex-col gap-6 p-10 group cursor-pointer border-indigo-500/10 bg-indigo-500/5"
          >
            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform border border-indigo-500/20">
              <Users size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-indigo-500 uppercase italic tracking-tighter">Community Chat</h3>
              <p className="text-indigo-400/50 font-bold uppercase tracking-widest text-[10px] mt-1">Connect with other villages and share health tips.</p>
            </div>
            <ChevronRight className="ml-auto text-indigo-900" />
          </Card3D>

          <Card3D 
            onClick={() => navigate('/hospitals')}
            className="flex flex-col gap-6 p-10 group cursor-pointer border-emerald-500/5"
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform border border-emerald-500/20">
              <MapPin size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{t('hospitalSearch')}</h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Find specialized care near your village or town.</p>
            </div>
            <ChevronRight className="ml-auto text-slate-700" />
          </Card3D>

          <Card3D 
            onClick={() => window.open('tel:108')}
            className="flex flex-col gap-6 p-10 group cursor-pointer border-rose-500/10 bg-rose-500/5"
          >
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform border border-rose-500/20">
              <Phone size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-rose-500 uppercase italic tracking-tighter">{t('emergency')}</h3>
              <p className="text-rose-400/50 font-bold uppercase tracking-widest text-[10px] mt-1">Immediate help. Call 108 or notify local doctors.</p>
            </div>
            <ChevronRight className="ml-auto text-rose-900" />
          </Card3D>
        </div>

        {/* Health Tips / Info */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter ml-2">Health Insights</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Thermometer />, label: 'Fever Check', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
              { icon: <Shield />, label: 'Vaccination', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
              { icon: <Users />, label: 'Community', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
              { icon: <BarChart3 />, label: 'Analytics', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10, rotateY: 10 }}
                className="glass-morphism p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-4 text-center card-3d-shadow"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border", item.color)}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Worker Access Section */}
        <div className="mt-8 flex flex-col gap-4">
          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] text-center">Worker Access</h4>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/chw')}
              className="px-6 py-3 glass-morphism rounded-xl border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-emerald-500 hover:border-emerald-500/20 transition-all flex items-center gap-2"
            >
              <BarChart3 size={14} /> CHW Dashboard
            </button>
            <button 
              onClick={() => navigate('/doctor')}
              className="px-6 py-3 glass-morphism rounded-xl border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-emerald-500 hover:border-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Stethoscope size={14} /> Doctor Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

const ScreeningFlow = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'kn-IN' | 'hi-IN'>(
    language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-US'
  );
  
  const [patient, setPatient] = useState({
    name: '', age: '', sex: '', contact: '',
    village: '', town: '', district: '', state: '', postal_code: '',
    lat: null, lng: null
  });

  const [screening, setScreening] = useState({
    symptoms: [] as string[],
    medicalHistory: '',
    allergies: '',
    socialHistory: '',
    image: null as string | null,
    imageMime: '',
    textInput: '',
    riskResult: null as any
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPatient(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
      });
    }
  }, []);

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) return; // Prevent multiple instances

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      console.log("Voice recognition started...");
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("Voice recognition ended.");
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please enable it in your browser settings.");
      } else if (event.error === 'no-speech') {
        alert("No speech detected. Please try again.");
      }
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log("Transcript received:", transcript);
      
      if (!transcript) return;

      setLoading(true);
      try {
        // Translate to the app's current language
        const targetLangName = language === 'kn' ? 'Kannada' : language === 'hi' ? 'Hindi' : 'English';
        
        console.log(`Processing voice input in ${voiceLang}...`);
        let finalResult = transcript;
        
        // Always translate to the target language if it's different from the spoken language
        // or if we want to ensure it's in the app's current language
        const spokenLangName = voiceLang === 'kn-IN' ? 'Kannada' : voiceLang === 'hi-IN' ? 'Hindi' : 'English';
        
        if (spokenLangName !== targetLangName) {
          console.log(`Translating from ${spokenLangName} to ${targetLangName}...`);
          finalResult = await translateText(transcript, targetLangName);
        }
        
        setScreening(prev => ({ 
          ...prev, 
          textInput: (prev.textInput + ' ' + finalResult).trim() 
        }));
      } catch (error) {
        console.error("Translation failed", error);
        setScreening(prev => ({ 
          ...prev, 
          textInput: (prev.textInput + ' ' + transcript).trim() 
        }));
      } finally {
        setLoading(false);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition", e);
      setIsListening(false);
    }
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const [recommendedHospital, setRecommendedHospital] = useState<any>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const symptomsList = [...screening.symptoms, ...(screening.riskResult?.symptoms || [])];
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Health Screening Report - ${patient.name}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-left: 4px solid #10b981; padding-left: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .label { font-weight: 700; color: #475569; font-size: 12px; }
            .value { font-size: 14px; margin-bottom: 5px; }
            .risk-badge { display: inline-block; padding: 5px 15px; rounded: 20px; font-weight: 900; color: white; text-transform: uppercase; font-size: 12px; border-radius: 20px; }
            .risk-High { background-color: #ef4444; }
            .risk-Medium { background-color: #f59e0b; }
            .risk-Low { background-color: #10b981; }
            .recommendation { background: #f8fafc; padding: 10px; border-radius: 8px; margin-bottom: 5px; font-size: 13px; }
            .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">AI Health Screening Report</div>
            <div style="font-size: 12px; color: #64748b;">Generated on ${new Date().toLocaleString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Patient Information</div>
            <div class="grid">
              <div>
                <div class="label">Name</div>
                <div class="value">${patient.name}</div>
                <div class="label">Age / Sex</div>
                <div class="value">${patient.age}Y / ${patient.sex}</div>
              </div>
              <div>
                <div class="label">Location</div>
                <div class="value">${patient.village}, ${patient.district}, ${patient.state}</div>
                <div class="label">Contact</div>
                <div class="value">${patient.contact || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Health Assessment</div>
            <div class="grid">
              <div>
                <div class="label">Risk Level</div>
                <div class="risk-badge risk-${screening.riskResult.riskLevel}">${screening.riskResult.riskLevel}</div>
              </div>
              <div>
                <div class="label">Risk Score</div>
                <div class="value">${screening.riskResult.riskScore}/100</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Symptoms & Findings</div>
            <div class="value"><strong>Symptoms:</strong> ${symptomsList.join(', ') || 'None reported'}</div>
            <div class="value"><strong>Medical History:</strong> ${screening.medicalHistory || 'None reported'}</div>
            ${screening.riskResult.imageAnalysis ? `<div class="value"><strong>Image Analysis:</strong> ${screening.riskResult.imageAnalysis.condition} (${screening.riskResult.imageAnalysis.severity} severity)</div>` : ''}
          </div>

          <div class="section">
            <div class="section-title">AI Explanation</div>
            <div class="value">${screening.riskResult.explanation}</div>
          </div>

          <div class="section">
            <div class="section-title">Recommendations & Precautions</div>
            ${screening.riskResult.recommendations.map((r: string) => `<div class="recommendation">• ${r}</div>`).join('')}
          </div>

          ${recommendedHospital ? `
          <div class="section">
            <div class="section-title">Recommended Health Center</div>
            <div class="value"><strong>${recommendedHospital.name}</strong> (${recommendedHospital.type})</div>
            <div class="value">${recommendedHospital.address}</div>
            <div class="value">Contact: ${recommendedHospital.phone}</div>
          </div>
          ` : ''}

          <div class="footer">
            This is an AI-generated health screening report. It is intended for preliminary assessment only and does not replace professional medical diagnosis. In case of emergency, please visit a hospital immediately.
          </div>

          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const processAI = async () => {
    setLoading(true);
    try {
      let imageResult = null;
      if (screening.image) {
        imageResult = await analyzeImage(screening.image.split(',')[1], screening.imageMime);
      }

      const nlpResult = await analyzeSymptoms(screening.textInput, language === 'kn' ? 'kn' : language === 'hi' ? 'hi' : 'en');
      const combinedSymptoms = [...screening.symptoms, ...(nlpResult.symptoms || [])];

      const targetLangName = language === 'kn' ? 'Kannada' : language === 'hi' ? 'Hindi' : 'English';
      const risk = await predictHealthRisk(patient, combinedSymptoms, {
        history: screening.medicalHistory,
        allergies: screening.allergies,
        social: screening.socialHistory
      }, imageResult, targetLangName);

      setScreening(prev => ({ ...prev, riskResult: risk }));
      
      // Fetch nearest hospital based on logic
      const params = new URLSearchParams();
      if (patient.lat && patient.lng) {
        params.append('lat', String(patient.lat));
        params.append('lng', String(patient.lng));
      }
      if (patient.postal_code) params.append('postal_code', patient.postal_code);
      if (patient.village) params.append('village', patient.village);
      if (patient.district) params.append('district', patient.district);
      if (patient.state) params.append('state', patient.state);
      if (risk.riskLevel === 'High') params.append('specialty', risk.specialtyNeeded);
      params.append('risk_level', risk.riskLevel);

      const hospitalRes = await fetch(`/api/hospitals?${params.toString()}`);
      const hospitals = await hospitalRes.json();
      
      if (hospitals && hospitals.length > 0) {
        setRecommendedHospital(hospitals[0]);
      } else {
        // Fallback to AI Search if local DB is empty
        console.log("No local hospitals found, trying AI search...");
        const aiHospitals = await searchHospitals(patient, risk.specialtyNeeded);
        if (aiHospitals && aiHospitals.length > 0) {
          setRecommendedHospital(aiHospitals[0]);
        }
      }

      // Save to DB
      await fetch('/api/screenings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient, screening: { ...screening, riskLevel: risk.riskLevel, riskScore: risk.riskScore, explanation: risk.explanation, imageAnalysis: JSON.stringify(imageResult), isEmergency: risk.isEmergency } })
      });

      setStep(5);
    } catch (error: any) {
      console.error(error);
      const isRateLimit = 
        error?.message?.includes('429') || 
        error?.message?.toLowerCase().includes('quota') ||
        error?.status === 429 || 
        error?.code === 429;
      if (isRateLimit) {
        alert("The AI service is currently at its limit. Please wait a minute and try again. If this persists, the daily quota might be exhausted.");
      } else {
        alert("AI Analysis failed. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Header />
      
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2"><User className="text-emerald-500" /> {t('name')} & {t('location')}</h2>
              <Input3D label={t('name')} value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} placeholder="Enter name" />
              <div className="grid grid-cols-2 gap-4">
                <Input3D label={t('age')} type="number" value={patient.age} onChange={e => setPatient({...patient, age: e.target.value})} />
                <Input3D label={t('sex')} value={patient.sex} onChange={e => setPatient({...patient, sex: e.target.value})} placeholder="M/F/O" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input3D label="Village" value={patient.village} onChange={e => setPatient({...patient, village: e.target.value})} placeholder="Enter village" />
                <Input3D label="District" value={patient.district} onChange={e => setPatient({...patient, district: e.target.value})} placeholder="Enter district" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input3D label="State" value={patient.state} onChange={e => setPatient({...patient, state: e.target.value})} placeholder="Enter state" />
                <Input3D label="Postal Code" value={patient.postal_code} onChange={e => setPatient({...patient, postal_code: e.target.value})} placeholder="Enter postal code" />
              </div>
              <Input3D label="Country" value={patient.country || ''} onChange={e => setPatient({...patient, country: e.target.value})} placeholder="Enter country" />
              <Button3D onClick={handleNext} className="mt-4">{t('next')}</Button3D>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2"><Clipboard className="text-emerald-500" /> {t('history')}</h2>
              <textarea 
                className="w-full h-32 p-4 rounded-2xl bg-slate-900/50 border border-white/10 text-white shadow-inner outline-none focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-600"
                placeholder="Previous illnesses, chronic diseases..."
                value={screening.medicalHistory}
                onChange={e => setScreening({...screening, medicalHistory: e.target.value})}
              />
              <Input3D label="Allergies" value={screening.allergies} onChange={e => setScreening({...screening, allergies: e.target.value})} placeholder="Medicine, food..." />
              <Input3D label="Social History" value={screening.socialHistory} onChange={e => setScreening({...screening, socialHistory: e.target.value})} placeholder="Tobacco, alcohol, occupation..." />
              <div className="flex gap-4">
                <Button3D onClick={handleBack} className="flex-1 bg-slate-800 text-slate-400 shadow-none">Back</Button3D>
                <Button3D onClick={handleNext} className="flex-1">{t('next')}</Button3D>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2"><Activity className="text-emerald-500" /> {t('symptoms')}</h2>
              
              <div className="flex flex-col gap-4">
                <div className="flex justify-center gap-2">
                  {[
                    { id: 'en-US', label: 'English' },
                    { id: 'kn-IN', label: 'ಕನ್ನಡ' },
                    { id: 'hi-IN', label: 'हिन्दी' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setVoiceLang(l.id as any)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        voiceLang === l.id 
                          ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
                          : "bg-slate-800 text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card3D 
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 cursor-pointer transition-all",
                      (isListening || loading) && "border-emerald-500 bg-emerald-500/10 animate-pulse"
                    )} 
                    onClick={handleVoiceInput}
                  >
                    <Mic className={cn("w-8 h-8", (isListening || loading) ? "text-emerald-400" : "text-emerald-500")} />
                    <span className="font-bold text-white uppercase tracking-widest text-xs">
                      {isListening ? "Listening..." : loading ? "Translating..." : t('voiceInput')}
                    </span>
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">
                      Mode: {voiceLang.split('-')[0]}
                    </span>
                  </Card3D>
                  <Card3D className="flex flex-col items-center gap-2 p-4 cursor-pointer" onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onload = () => setScreening({...screening, image: reader.result as string, imageMime: file.type});
                      reader.readAsDataURL(file);
                    };
                    input.click();
                  }}>
                    <Camera className="text-emerald-500 w-8 h-8" />
                    <span className="font-bold text-white uppercase tracking-widest text-xs">{t('imageInput')}</span>
                  </Card3D>
                </div>
              </div>

              {screening.image && (
                <div className="relative rounded-2xl overflow-hidden border-4 border-slate-800 shadow-lg">
                  <img src={screening.image} alt="Symptom" className="w-full h-48 object-cover" />
                  <button onClick={() => setScreening({...screening, image: null})} className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full"><AlertCircle size={16}/></button>
                </div>
              )}

              <textarea 
                className="w-full h-32 p-4 rounded-2xl bg-slate-900/50 border border-white/10 text-white shadow-inner outline-none focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-600"
                placeholder="Describe how you feel..."
                value={screening.textInput}
                onChange={e => setScreening({...screening, textInput: e.target.value})}
              />

              <div className="flex gap-4">
                <Button3D onClick={handleBack} className="flex-1 bg-slate-800 text-slate-400 shadow-none">Back</Button3D>
                <Button3D onClick={processAI} className="flex-1" disabled={loading}>
                  {loading ? 'Analyzing...' : t('submit')}
                </Button3D>
              </div>
            </motion.div>
          )}

          {step === 5 && screening.riskResult && (
            <motion.div key="step5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6">
              <div className={cn(
                "p-8 rounded-[2rem] text-white shadow-2xl flex flex-col items-center text-center gap-4",
                screening.riskResult.riskLevel === 'High' ? 'bg-red-500 shadow-red-200' : 
                screening.riskResult.riskLevel === 'Medium' ? 'bg-amber-500 shadow-amber-200' : 'bg-emerald-500 shadow-emerald-200'
              )}>
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  {screening.riskResult.riskLevel === 'High' ? <AlertCircle size={40} /> : <CheckCircle size={40} />}
                </div>
                <div>
                  <h3 className="text-4xl font-black">{screening.riskResult.riskLevel} Risk</h3>
                  <p className="opacity-90 font-bold">Score: {screening.riskResult.riskScore}/100</p>
                </div>
              </div>

              {screening.riskResult.isEmergency && (
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="bg-red-100 border-2 border-red-500 p-4 rounded-2xl flex items-center gap-4"
                >
                  <Phone className="text-red-600 animate-bounce" />
                  <div>
                    <h4 className="font-bold text-red-600">EMERGENCY DETECTED</h4>
                    <p className="text-sm text-red-500">Call 108 immediately or visit the nearest hospital.</p>
                  </div>
                  <button onClick={() => window.open('tel:108')} className="ml-auto bg-red-600 text-white px-4 py-2 rounded-xl font-bold">CALL</button>
                </motion.div>
              )}

              <Card3D>
                <h4 className="font-black text-white uppercase italic tracking-tighter mb-2">Explanation</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{screening.riskResult.explanation}</p>
              </Card3D>

              {screening.riskResult.imageAnalysis && (
                <Card3D className="border-emerald-500/20 bg-emerald-500/5">
                  <h4 className="font-black text-emerald-500 uppercase italic tracking-tighter mb-2 flex items-center gap-2">
                    <ImageIcon size={18} /> Image Findings
                  </h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-sm">{screening.riskResult.imageAnalysis.condition}</span>
                      <span className={cn(
                        "text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest",
                        screening.riskResult.imageAnalysis.severity === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'
                      )}>
                        {screening.riskResult.imageAnalysis.severity} Severity
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed italic">
                      {screening.riskResult.imageAnalysis.description}
                    </p>
                  </div>
                </Card3D>
              )}

              {recommendedHospital && (
                <Card3D className="border-indigo-500/20 bg-indigo-500/5">
                  <h4 className="font-black text-indigo-400 uppercase italic tracking-tighter mb-2 flex items-center gap-2">
                    <MapPin size={18} /> Nearest Healthcare Center
                  </h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-white font-bold text-sm block">{recommendedHospital.name}</span>
                        <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-md uppercase tracking-widest inline-block mt-1">
                          {recommendedHospital.type}
                        </span>
                      </div>
                      {recommendedHospital.distance !== undefined && (
                        <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md uppercase tracking-widest">
                          {recommendedHospital.distance.toFixed(1)} km away
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1 mt-2">
                      <p className="text-slate-400 text-xs leading-relaxed">
                        <span className="font-bold text-slate-300">Address:</span> {recommendedHospital.address}
                      </p>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        <span className="font-bold text-slate-300">Contact:</span> {recommendedHospital.phone}
                      </p>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        <span className="font-bold text-slate-300">Hours:</span> {recommendedHospital.hours}
                      </p>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => {
                          const query = encodeURIComponent(`${recommendedHospital.name}, ${recommendedHospital.address || recommendedHospital.village || ''}`);
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`);
                        }} 
                        className="flex-1 bg-emerald-500 text-slate-950 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <Navigation size={18} /> Navigate
                      </button>
                      <button 
                        onClick={() => navigate('/hospitals', { state: { specialty: screening.riskResult.specialtyNeeded, ...patient } })}
                        className="flex-1 glass-morphism text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:text-indigo-300 transition-colors flex items-center justify-center gap-1 rounded-xl"
                      >
                        View More <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </Card3D>
              )}

              <div className="flex flex-col gap-3">
                <h4 className="font-black text-white uppercase italic tracking-tighter ml-2">Recommendations</h4>
                {screening.riskResult.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 glass-morphism p-4 rounded-2xl border border-white/5 shadow-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-slate-300 font-medium">{rec}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button3D onClick={() => navigate('/hospitals', { state: { specialty: screening.riskResult.specialtyNeeded, district: patient.district, risk_level: screening.riskResult.riskLevel, ...patient } })} variant="primary" className="text-sm">Find Hospital</Button3D>
                <Button3D onClick={handlePrint} className="bg-emerald-600 text-white shadow-none text-sm flex items-center justify-center gap-2">
                  <Download size={16} /> Export Data
                </Button3D>
              </div>
              <Button3D onClick={() => navigate('/')} className="bg-slate-800 text-slate-400 shadow-none text-sm w-full">Home</Button3D>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const HospitalSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { district, specialty, village, state, postal_code, lat, lng, risk_level } = (location.state as any) || {};
  
  const performSearch = async (useAI = false) => {
    setLoading(true);
    try {
      if (useAI) {
        const aiResults = await searchHospitals({ village, district, state, postal_code }, specialty || 'General');
        setHospitals(aiResults);
      } else {
        const params = new URLSearchParams();
        if (district) params.append('district', district);
        if (specialty) params.append('specialty', specialty);
        if (village) params.append('village', village);
        if (state) params.append('state', state);
        if (postal_code) params.append('postal_code', postal_code);
        if (lat) params.append('lat', String(lat));
        if (lng) params.append('lng', String(lng));
        if (risk_level) params.append('risk_level', risk_level);
        
        const res = await fetch(`/api/hospitals?${params.toString()}`);
        const data = await res.json();
        setHospitals(data);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch();
  }, [district, specialty, village, state, postal_code, lat, lng]);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Header />
      <div className="p-6 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 glass-morphism rounded-xl text-white"><ArrowLeft size={20}/></button>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              {district ? `Hospitals in ${district}` : 'Nearest Hospitals'}
            </h2>
          </div>
          <button 
            onClick={() => performSearch(true)}
            disabled={loading}
            className="p-3 glass-morphism rounded-xl text-emerald-500 hover:bg-emerald-500/10 transition-colors flex items-center gap-2 font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
          >
            <Shield size={14} /> {loading ? 'Searching...' : 'AI Real-time Search'}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-emerald-500 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-black uppercase tracking-widest text-xs">AI is searching for real-time data...</p>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
            <AlertCircle size={48} className="opacity-20" />
            <p className="font-black uppercase tracking-widest text-xs">No hospitals found in this area</p>
            <div className="flex gap-4">
              <Button3D onClick={() => performSearch(true)} className="mt-4 text-[10px]">Try AI Search</Button3D>
              <Button3D onClick={() => {
                const params = new URLSearchParams();
                if (specialty) params.append('specialty', specialty);
                fetch(`/api/hospitals?${params.toString()}`).then(res => res.json()).then(setHospitals);
              }} className="mt-4 text-[10px] bg-slate-800">Show All Districts</Button3D>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {hospitals.map((h, idx) => (
              <Card3D key={idx} className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-lg text-white uppercase italic tracking-tighter">{h.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded-md uppercase tracking-widest">{h.type || h.specialty}</span>
                      {h.district && <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-md uppercase tracking-widest">{h.district}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs font-black uppercase tracking-widest">
                    <MapPin size={14} /> {h.distance ? `${h.distance.toFixed(1)} km` : 'Near you'}
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium">{h.address}</p>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => {
                      const query = encodeURIComponent(`${h.name}, ${h.address || h.village || ''}`);
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`);
                    }} 
                    className="flex-1 bg-emerald-500 text-slate-950 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Navigation size={18} /> Navigate
                  </button>
                  {h.phone && (
                    <button onClick={() => window.open(`tel:${h.phone}`)} className="w-12 h-12 glass-morphism text-emerald-500 rounded-xl flex items-center justify-center">
                      <Phone size={20} />
                    </button>
                  )}
                </div>
              </Card3D>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/screening" element={<ScreeningFlow />} />
          <Route path="/hospitals" element={<HospitalSearch />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/chw" element={<CHWDashboard />} />
          <Route path="/doctor-chat" element={<DoctorChat />} />
          <Route path="/community-chat" element={<CommunityChat />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}
