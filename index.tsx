
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Scroll as ScrollIcon,
  Flame,
  Wand2,
  Clock3
} from 'lucide-react';

// Interfaces
interface Task {
  id: string;
  original: string;
  enhanced: string;
  isEnhancing: boolean;
  isBurning: boolean;
  timestamp: number;
}

// Background Component
const StarField = () => (
  <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
    {[...Array(50)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-white opacity-40 animate-pulse"
        style={{
          width: Math.random() * 3 + 'px',
          height: Math.random() * 3 + 'px',
          top: Math.random() * 100 + '%',
          left: Math.random() * 100 + '%',
          animationDuration: (Math.random() * 3 + 2) + 's',
          animationDelay: Math.random() * 5 + 's'
        }}
      />
    ))}
  </div>
);

const App = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Gemini
  const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const modelName = 'gemini-3-pro-preview';

  useEffect(() => {
    // Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        addTask(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const enhanceTask = async (taskId: string, text: string) => {
    try {
      const prompt = `You are a fantasy quest giver. Rename the following simple task into a magical quest name. Return only the new name, nothing else. Task: "${text}"`;
      const result = await genAI.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      const enhancedName = result.text || text;
      
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, enhanced: enhancedName, isEnhancing: false } : t
      ));
    } catch (error) {
      console.error('Magic failed:', error);
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, enhanced: text, isEnhancing: false } : t
      ));
    }
  };

  const addTask = (text: string) => {
    if (!text.trim()) return;
    
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      original: text,
      enhanced: 'Consulting the Oracle...',
      isEnhancing: true,
      isBurning: false,
      timestamp: Date.now()
    };

    setTasks(prev => [...prev, newTask]);
    setInput('');
    enhanceTask(newTask.id, text);
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, isBurning: true } : t
    ));

    // Wait for burning animation
    setTimeout(() => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setHistory(prev => [task, ...prev].slice(0, 10)); // Keep last 10
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    }, 800);
  };

  const removeTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <StarField />
      
      {/* Header */}
      <div className="text-center mb-12 mt-8 text-white">
        <h1 className="cinzel text-5xl font-bold mb-2 flex items-center justify-center gap-3">
          <Wand2 className="text-purple-400" size={40} />
          Magical Quests
        </h1>
        <p className="text-slate-400 italic">Transform your mundane chores into epic adventures</p>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-2xl parchment p-8 md:p-12 mb-12 shadow-2xl min-h-[400px]">
        {/* Input Area */}
        <div className="flex gap-2 mb-8 items-center bg-black/5 p-2 rounded-lg border border-brown-200">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask(input)}
            placeholder="Whisper your intent..."
            className="flex-grow bg-transparent border-none outline-none p-3 text-lg text-brown-900 placeholder-brown-400 font-bold"
          />
          <button 
            onClick={toggleListen}
            className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-brown-100 text-brown-700 hover:bg-brown-200'}`}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          <button 
            onClick={() => addTask(input)}
            className="p-3 bg-brown-800 text-white rounded-full hover:bg-brown-700 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-6">
          {tasks.length === 0 && (
            <div className="text-center py-12 text-brown-400 flex flex-col items-center gap-4">
              <ScrollIcon size={60} strokeWidth={1} />
              <p className="text-xl">The scroll is empty. Decree a task.</p>
            </div>
          )}
          {tasks.map(task => (
            <div 
              key={task.id}
              className={`flex items-start gap-4 p-4 rounded-lg bg-white/40 border border-white/50 transition-all ${task.isBurning ? 'burning' : 'hover:bg-white/60'}`}
            >
              <button 
                onClick={() => completeTask(task.id)}
                className="mt-1 text-brown-600 hover:text-green-600 transition-colors"
              >
                <CheckCircle2 size={24} />
              </button>
              
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h3 className={`text-xl font-bold leading-tight ${task.isEnhancing ? 'text-brown-400 animate-pulse' : 'text-brown-900'}`}>
                    {task.enhanced}
                  </h3>
                  {task.isEnhancing && <Sparkles size={16} className="text-purple-500 animate-spin" />}
                </div>
                <p className="text-xs text-brown-600 uppercase tracking-widest mt-1">
                  Intent: {task.original}
                </p>
              </div>

              <button 
                onClick={() => removeTask(task.id)}
                className="mt-1 text-brown-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* History Area */}
      {history.length > 0 && (
        <div className="w-full max-w-2xl px-6 opacity-60 hover:opacity-100 transition-opacity mb-20">
          <div className="flex items-center gap-2 text-slate-400 mb-4 border-b border-slate-700 pb-2 uppercase tracking-[0.2em] text-xs">
            <Clock3 size={14} />
            Ancient Records
          </div>
          <div className="space-y-3">
            {history.map(item => (
              <div key={item.id} className="flex justify-between items-center text-slate-300 italic group">
                <span className="flex items-center gap-2">
                  <Flame size={14} className="text-orange-500 opacity-50 group-hover:opacity-100" />
                  {item.enhanced}
                </span>
                <span className="text-[10px] text-slate-500">Achieved</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Decoration */}
      <div className="fixed bottom-4 text-[10px] text-slate-600 uppercase tracking-[0.5em] pointer-events-none">
        Enchanted with Gemini 1.5 Pro
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
