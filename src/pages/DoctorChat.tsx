import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, User, Stethoscope, ArrowLeft, 
  RefreshCw, MessageSquare, Bot, AlertCircle,
  MapPin, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card3D, Header, Title3D, Button3D, Input3D, ChatInput, cn } from '../components/UI';
import { useLanguage } from '../context/LanguageContext';
import { chatWithDoctor } from '../services/gemini';
import { findPredefinedResponse } from '../constants/predefinedResponses';

interface Message {
  id: string;
  role: 'user' | 'doctor';
  content: string;
  created_at: string;
}

export default function DoctorChat() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId] = useState(() => localStorage.getItem('user_id') || Math.random().toString(36).substring(7));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('user_id', userId);
    fetchMessages();
  }, []);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Small timeout to ensure DOM has updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, loading]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/doctor/messages/${userId}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    // Optimistically update local state
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: userMessage, created_at: new Date().toISOString() }]);

    try {
      // 1. Save user message to DB
      await fetch('/api/doctor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: 'user', content: userMessage })
      });
      
      // 2. Check for predefined response first
      const predefined = findPredefinedResponse(userMessage);
      let aiResponse = '';

      if (predefined) {
        // If it's a greeting, don't add the prefix
        const isGreeting = userMessage.toLowerCase().trim() === 'hi' || userMessage.toLowerCase().trim() === 'hello';
        aiResponse = isGreeting ? predefined : `[Automated Advice] ${predefined}`;
      } else {
        // 3. Get AI response if no predefined match
        // Filter out temporary messages or ensure role is correct
        const chatHistory = messages
          .filter(m => m.id !== tempId) // Remove the optimistic one to avoid duplicates if we're adding it manually
          .concat([{ id: tempId, role: 'user', content: userMessage, created_at: '' }])
          .map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content
          }));
        
        console.log("Sending to AI:", chatHistory);
        aiResponse = await chatWithDoctor(chatHistory, language);
      }

      if (!aiResponse) {
        aiResponse = "I'm sorry, I'm having trouble connecting to my medical database. Please try again or visit your nearest health center.";
      }

      // 4. Save response to DB
      await fetch('/api/doctor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: 'doctor', content: aiResponse })
      });

      // Update local state with AI response
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'doctor', content: aiResponse, created_at: new Date().toISOString() }]);
    } catch (error) {
      console.error("Chat error", error);
      const errorMessage = "Connection error. Please check your internet and try again.";
      setMessages(prev => [...prev, { id: 'error-' + Date.now(), role: 'doctor', content: errorMessage, created_at: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-brand-bg flex flex-col overflow-hidden">
      <Header />
      
      <main className="flex-1 min-h-0 p-4 max-w-4xl mx-auto w-full flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between flex-shrink-0">
          <button 
            onClick={() => navigate('/')}
            className="p-3 glass-morphism rounded-xl text-slate-400 hover:text-emerald-500 transition-colors flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex flex-col items-center">
            <Title3D text="AI DOCTOR CHAT" />
            <span className="text-emerald-500 font-bold uppercase tracking-widest text-[8px] animate-pulse">Online Assistant</span>
          </div>
          <div className="w-10" />
        </div>

        <Card3D interactive={false} className="flex-1 flex flex-col overflow-hidden border-white/5 bg-brand-surface/30">
          {/* Chat Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scroll-smooth"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-6 opacity-50">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Stethoscope size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Ask a Question</h3>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 max-w-xs">
                    Ask about symptoms, precautions, or nearby health centers.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  msg.role === 'user' ? "self-end flex-row-reverse" : "self-start"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
                  msg.role === 'user' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                )}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm font-medium leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-indigo-500 text-white rounded-tr-none shadow-lg shadow-indigo-500/20" 
                    : "glass-morphism text-slate-200 rounded-tl-none border-white/10"
                )}>
                  {msg.content}
                  <div className={cn(
                    "text-[8px] font-black uppercase tracking-widest mt-2 opacity-50",
                    msg.role === 'user' ? "text-indigo-200" : "text-slate-500"
                  )}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4 self-start"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-pulse border border-emerald-500/20">
                  <Bot size={20} />
                </div>
                <div className="glass-morphism p-4 rounded-2xl rounded-tl-none border-white/10 flex gap-1">
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-emerald-500 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-emerald-500 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-emerald-500 rounded-full" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/5 bg-brand-bg/50">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              placeholder="Type your question here..."
              disabled={loading}
              language={language}
            />
          </div>
        </Card3D>

        {/* Quick Tips */}
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {[
            "What are common fever precautions?",
            "Recommend health centers near me",
            "Symptoms of Dengue",
            "How to prevent Malaria?"
          ].map((tip, i) => (
            <button
              key={i}
              onClick={() => setInput(tip)}
              className="whitespace-nowrap px-4 py-2 glass-morphism rounded-full border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-500 hover:border-emerald-500/30 transition-all"
            >
              {tip}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
