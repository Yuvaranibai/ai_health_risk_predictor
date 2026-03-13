import React from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Heart } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card3D: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void, interactive?: boolean }> = ({ children, className, onClick, interactive = true }) => (
  <motion.div
    whileHover={interactive ? { scale: 1.01, rotateY: 2, rotateX: 2 } : {}}
    whileTap={interactive ? { scale: 0.99 } : {}}
    onClick={onClick}
    className={cn(
      "glass-morphism rounded-[2rem] p-6 shadow-2xl transition-all duration-500",
      className
    )}
  >
    {children}
  </motion.div>
);

export const ChatInput = ({ value, onChange, placeholder, onSend, disabled, language = 'en-US' }: { value: string, onChange: (val: string) => void, placeholder?: string, onSend: () => void, disabled?: boolean, language?: string }) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = React.useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // Map our app languages to BCP 47 tags
    const langMap: Record<string, string> = {
      'English': 'en-US',
      'Hindi': 'hi-IN',
      'Kannada': 'kn-IN',
      'Marathi': 'mr-IN',
      'Telugu': 'te-IN',
      'Tamil': 'ta-IN'
    };
    
    recognition.lang = langMap[language] || 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onChange(value + (value ? ' ' : '') + transcript);
    };

    recognition.start();
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className={cn(
        "relative flex items-end gap-1 w-full glass-morphism p-1.5 rounded-2xl border border-white/10 shadow-2xl transition-all duration-300",
        isListening ? "ring-2 ring-emerald-500 bg-emerald-500/10" : "bg-slate-900/80"
      )}>
        <button
          type="button"
          onClick={startVoiceInput}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all mb-0.5 ml-0.5 flex-shrink-0",
            isListening ? "bg-emerald-500 text-slate-950 animate-pulse" : "bg-slate-800 text-slate-400 hover:text-emerald-500"
          )}
        >
          <Mic size={16} />
        </button>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent border-none text-white px-3 py-2 focus:ring-0 outline-none resize-none min-h-[40px] max-h-24 font-medium text-xs placeholder:text-slate-500"
        />
        <motion.button
          whileHover={!disabled && value.trim() ? { scale: 1.1 } : {}}
          whileTap={!disabled && value.trim() ? { scale: 0.9 } : {}}
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all mb-0.5 mr-0.5 flex-shrink-0",
            value.trim() && !disabled 
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
              : "bg-slate-800 text-slate-600 cursor-not-allowed"
          )}
        >
          <Send size={16} />
        </motion.button>
      </div>
      {isListening && (
        <div className="text-[7px] font-black text-emerald-500 uppercase tracking-widest text-center mt-1 animate-pulse">
          Speak now...
        </div>
      )}
    </div>
  );
};

import { Send, Mic } from 'lucide-react';

export const Button3D = ({ children, className, onClick, variant = 'primary', disabled, type = 'button' }: { children: React.ReactNode, className?: string, onClick?: () => void, variant?: 'primary' | 'danger' | 'warning' | 'success', disabled?: boolean, type?: 'button' | 'submit' | 'reset' }) => {
  const variants = {
    primary: "bg-emerald-500 text-slate-950 shadow-emerald-500/20 hover:bg-emerald-400",
    danger: "bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-400",
    warning: "bg-amber-500 text-slate-950 shadow-amber-500/20 hover:bg-amber-400",
    success: "bg-emerald-500 text-slate-950 shadow-emerald-500/20 hover:bg-emerald-400",
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { y: -4, scale: 1.05, rotateX: 5 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={cn(
        "px-8 py-4 rounded-2xl font-black text-lg shadow-xl transition-all duration-300 uppercase tracking-widest",
        variants[variant],
        disabled && "opacity-50 cursor-not-allowed grayscale",
        className
      )}
    >
      {children}
    </motion.button>
  );
};

export const Input3D = ({ label, className, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className={cn("flex flex-col gap-2 w-full", className)}>
    {label && <label className="text-xs font-black text-slate-400 ml-2 uppercase tracking-tighter">{label}</label>}
    <input
      {...props}
      className="w-full px-6 py-4 rounded-2xl bg-slate-900/50 border border-white/10 text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-300 shadow-inner"
    />
  </div>
);

export const Header = () => (
  <div className="flex items-center justify-between p-6 bg-brand-bg/50 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <Heart className="text-slate-950 w-6 h-6" />
      </div>
      <h1 className="font-black text-xl tracking-tighter text-white uppercase italic">HealthPredict</h1>
    </div>
  </div>
);

export const Title3D = ({ text }: { text: string }) => (
  <motion.div
    initial={{ rotateX: 45, opacity: 0 }}
    animate={{ rotateX: 0, opacity: 1 }}
    transition={{ duration: 1, ease: "easeOut" }}
    className="perspective-1000"
  >
    <h1 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none text-glow">
      {text.split(' ').map((word, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: i * 0.2, duration: 0.8 }}
            className="block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h1>
  </motion.div>
);
