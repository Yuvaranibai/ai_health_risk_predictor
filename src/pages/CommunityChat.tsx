import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, User, ArrowLeft, RefreshCw, 
  MessageSquare, MapPin, Users, Info,
  ShieldCheck, Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card3D, Header, Title3D, Button3D, Input3D, ChatInput, cn } from '../components/UI';
import { useLanguage } from '../context/LanguageContext';
import { findPredefinedResponse } from '../constants/predefinedResponses';
import { chatWithCommunityBot } from '../services/gemini';

interface CommunityMessage {
  id: number;
  user_id: string;
  user_name: string;
  village: string;
  content: string;
  created_at: string;
}

export default function CommunityChat() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState(() => localStorage.getItem('user_name') || '');
  const [village, setVillage] = useState(() => localStorage.getItem('user_village') || '');
  const [userId] = useState(() => localStorage.getItem('user_id') || Math.random().toString(36).substring(7));
  const [isSetup, setIsSetup] = useState(() => !!(localStorage.getItem('user_name') && localStorage.getItem('user_village')));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSetup) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [isSetup]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/community/messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch community messages", error);
    }
  };

  const handleCommunityBotResponse = async (messageContent: string) => {
    const predefined = findPredefinedResponse(messageContent);
    let botMessage = '';
    
    if (predefined) {
      const isGreeting = messageContent.toLowerCase().trim() === 'hi' || messageContent.toLowerCase().trim() === 'hello';
      botMessage = isGreeting ? predefined : `[Community Bot] ${predefined}`;
    } else {
      // Use Gemini for a more interactive community response
      botMessage = await chatWithCommunityBot(messageContent, 'English');
    }

    if (botMessage) {
      // Simulate bot response delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      try {
        await fetch('/api/community/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: 'bot', 
            userName: 'Community Bot', 
            village: 'Global', 
            content: botMessage 
          })
        });
        fetchMessages();
      } catch (error) {
        console.error("Failed to send bot message", error);
      }
    }
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim() && village.trim()) {
      localStorage.setItem('user_name', userName);
      localStorage.setItem('user_village', village);
      setIsSetup(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const content = input;
    setInput('');

    // Optimistically update local state
    const tempId = Date.now();
    setMessages(prev => [...prev, { 
      id: tempId, 
      user_id: userId, 
      user_name: userName, 
      village: village, 
      content: content, 
      created_at: new Date().toISOString() 
    }]);

    try {
      await fetch('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName, village, content })
      });
      fetchMessages();
      
      // Trigger bot response check
      handleCommunityBotResponse(content);
    } catch (error) {
      console.error("Failed to send message", error);
      const errorMessage = "Message failed to send. Please try again.";
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        user_id: 'system', 
        user_name: 'System', 
        village: 'Local', 
        content: errorMessage, 
        created_at: new Date().toISOString() 
      }]);
    }
  };

  if (!isSetup) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6">
        <Card3D className="w-full max-w-md p-10 flex flex-col gap-8 border-white/5">
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl mx-auto mb-6 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <Users size={40} />
            </div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Join Community</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Connect with neighboring villages</p>
          </div>

          <form onSubmit={handleSetup} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Your Name</label>
              <Input3D 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Your Village</label>
              <Input3D 
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Enter your village"
                required
              />
            </div>
            <Button3D type="submit" className="mt-4">Enter Chat</Button3D>
          </form>
        </Card3D>
      </div>
    );
  }

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
            <Title3D text="VILLAGE COMMUNITY" />
            <span className="text-indigo-500 font-bold uppercase tracking-widest text-[8px]">Multi-Village Network</span>
          </div>
          <button 
            onClick={() => setIsSetup(false)}
            className="p-3 glass-morphism rounded-xl text-slate-400 hover:text-indigo-500 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 overflow-hidden">
          {/* Sidebar - Info */}
          <Card3D className="hidden lg:flex flex-col p-6 border-white/5 bg-brand-surface/20 gap-6">
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Info size={14} className="text-indigo-500" /> Guidelines
              </h4>
              <ul className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose list-disc ml-4">
                <li>Share symptoms early</li>
                <li>Give precautions</li>
                <li>Help neighbors</li>
                <li>No misinformation</li>
              </ul>
            </div>
            
            <div className="mt-auto p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-500">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified Info</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed">
                Local health workers monitor this chat to provide verified help.
              </p>
            </div>
          </Card3D>

          {/* Main Chat Area */}
          <Card3D interactive={false} className="lg:col-span-3 flex flex-col overflow-hidden border-white/5 bg-brand-surface/30">
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scroll-smooth"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.user_id === userId ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex flex-col gap-1 max-w-[80%]",
                    msg.user_id === userId ? "self-end items-end" : "self-start items-start"
                  )}
                >
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{msg.user_name}</span>
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                      <MapPin size={8} /> {msg.village}
                    </span>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm font-medium",
                    msg.user_id === userId 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "glass-morphism text-slate-200 rounded-tl-none border-white/10"
                  )}>
                    {msg.content}
                    <div className="text-[8px] font-black uppercase tracking-widest mt-2 opacity-40 text-right">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-3 border-t border-white/5 bg-brand-bg/50">
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                placeholder="Share symptoms or precautions..."
                language={language}
              />
            </div>
          </Card3D>
        </div>
      </main>
    </div>
  );
}
