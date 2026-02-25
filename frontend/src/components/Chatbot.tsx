import React, { useState, useEffect, useRef } from 'react';
import { ChatbotIcon, SendIcon, XMarkIcon, EyeIcon, EyeSlashIcon } from './icons';
import { User, Role, TranscriptView } from '../types';
import { LATEST_ATTENDANCE_DATE } from '../constants';

interface Message {
    id: number;
    sender: 'bot' | 'user';
    text: string;
    options?: { label: string; payload: { view: TranscriptView, semester: string, academicYear: string } }[];
}

interface ChatbotProps {
    users: User[];
    onPdfRequest: (userId: string, payload: { view: TranscriptView, semester: string, academicYear: string }) => void;
    loggedInUser?: User | null;
}

const Chatbot: React.FC<ChatbotProps> = ({ users, onPdfRequest, loggedInUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [step, setStep] = useState('GREETING');
    const [userName, setUserName] = useState('');
    const [userId, setUserId] = useState('');
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isTyping]);

    const addMessage = (sender: 'bot' | 'user', text: string, options?: Message['options']) => {
        setMessages(prev => [...prev, { id: Date.now() + Math.random(), sender, text, options }]);
    };
    
    const startConversation = () => {
        setMessages([]);
        setUserName('');
        setUserId('');
        setUserRole(null);
        setIsTyping(true);
        setTimeout(() => {
            addMessage('bot', "Hi, my name is Ben. What is your name?");
            setStep('AWAIT_NAME');
            setIsTyping(false);
        }, 500);
    };

    useEffect(() => {
        if (isOpen) {
            if (loggedInUser) {
                setUserId(loggedInUser.id);
                setUserName(loggedInUser.name.split(' ')[0]);
                setUserRole(loggedInUser.role);
                setMessages([]);
                setIsTyping(true);
                setTimeout(() => {
                    addMessage('bot', `Hi ${loggedInUser.name.split(' ')[0]}! Welcome back.`);
                    if(loggedInUser.role === Role.STUDENT) {
                        presentMainOptions(loggedInUser.name.split(' ')[0]);
                    } else {
                        presentFacultyStaffOptions(loggedInUser.name.split(' ')[0]);
                    }
                    setIsTyping(false);
                }, 500);
            } else {
                startConversation();
            }
        }
    }, [isOpen, loggedInUser]);

    const presentMainOptions = (name: string) => {
        const options: Message['options'] = [
            { label: 'Marks', payload: { view: 'marks', semester: '', academicYear: '' } },
            { label: 'Attendance', payload: { view: 'attendance', semester: '', academicYear: '' } },
            { label: 'Fee History', payload: { view: 'fees', semester: '', academicYear: '' } },
            { label: 'Placement', payload: { view: 'placement', semester: '', academicYear: '' } }
        ];
        addMessage('bot', `How can I help you, ${name}? Please select a category:`, options);
        setStep('AWAIT_MAIN_CHOICE');
    };

    const presentFacultyStaffOptions = (name: string) => {
        const options: Message['options'] = [
            { label: 'Attendance', payload: { view: 'attendance', semester: '', academicYear: '' } },
        ];
        addMessage('bot', `How can I help you, ${name}? Please select a category:`, options);
        setStep('AWAIT_FACULTYSTAFF_MAIN_CHOICE');
    };


    const presentSubOptions = (view: TranscriptView, label: string) => {
        const student = users.find(u => u.id.toLowerCase() === userId.toLowerCase());
        if (!student) return;

        const admissionYearMatch = student.id.match(/[A-Z]+(\d{4})/);
        if (!admissionYearMatch) {
            addMessage('bot', "I couldn't determine your academic year from your ID.");
            return;
        }
        const startYear = parseInt(admissionYearMatch[1], 10);
        
        const options: Message['options'] = [];
        const fullDuration = `${startYear}-${startYear + 4}`;

        if (view === 'placement') {
             options.push({ label: `Placement Details`, payload: { view, semester: 'All Semesters', academicYear: 'All Years' } });
        } else if (view === 'fees') {
            options.push({ label: `All Semesters Fee History (${fullDuration})`, payload: { view, semester: 'All Semesters', academicYear: 'All Years' } });
            for (let i = 0; i < 4; i++) {
                const yearNum = i + 1;
                const academicYear = `${startYear + i}-${startYear + i + 1}`;
                options.push({ label: `${yearNum} year Fee History (${academicYear})`, payload: { view, semester: 'All Semesters', academicYear } });
            }
        } else {
            options.push({ label: `All Semesters ${label} (${fullDuration})`, payload: { view, semester: 'All Semesters', academicYear: 'All Years' } });
            for (let i = 0; i < 4; i++) {
                const academicYear = `${startYear + i}-${startYear + i + 1}`;
                const sem1 = i * 2 + 1;
                const sem2 = i * 2 + 2;
                options.push({ label: `${sem1} Semester ${label} (${academicYear})`, payload: { view, semester: String(sem1), academicYear } });
                options.push({ label: `${sem2} Semester ${label} (${academicYear})`, payload: { view, semester: String(sem2), academicYear } });
            }
        }
        addMessage('bot', `Please select which ${label} report you would like to download:`, options);
        setStep('AWAIT_SUB_CHOICE');
    };

    const presentFacultyStaffSubOptions = () => {
        const user = users.find(u => u.id.toLowerCase() === userId.toLowerCase());
        if (!user) return;

        let joiningDateStr: string | null = null;
        if(user.role === Role.FACULTY) {
            const match = user.id.match(/^[A-Z]{1}[A-Z]{2,4}(\d{8})-\d{3}$/);
            joiningDateStr = match ? match[1] : null;
        } else if (user.role === Role.STAFF) {
            const match = user.id.match(/^[A-Z]{1}STF(\d{8})-\d{3}$/);
            joiningDateStr = match ? match[1] : null;
        }

        if(!joiningDateStr) {
            addMessage('bot', "Sorry, I couldn't determine your joining date from your ID.");
            presentFacultyStaffOptions(userName);
            return;
        }

        const year = parseInt(joiningDateStr.substring(4, 8), 10);
        
        const options: Message['options'] = [
            { label: 'Total Attendance (Since Joining)', payload: { view: 'attendance', semester: 'All Semesters', academicYear: 'All Years' } }
        ];

        const currentYear = new Date(LATEST_ATTENDANCE_DATE).getFullYear();
        for (let i = year; i <= currentYear; i++) {
            const academicYear = `${i}-${i+1}`;
            options.push({ label: `Attendance for ${academicYear}`, payload: { view: 'attendance', semester: 'All Semesters', academicYear } });
        }
        
        addMessage('bot', `Please select which attendance report you would like to download:`, options);
        setStep('AWAIT_SUB_CHOICE');
    };


    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        const userMessage = inputValue.trim();
        if (!userMessage) return;

        if (step === 'AWAIT_PASSWORD') {
            addMessage('user', '********');
        } else {
            addMessage('user', userMessage);
        }
        
        setInputValue('');
        setIsTyping(true);

        setTimeout(() => {
            processUserResponse(userMessage);
            setIsTyping(false);
        }, 1000);
    };

    const processUserResponse = (message: string) => {
        switch(step) {
            case 'AWAIT_NAME':
                const namePart = message.split(' ')[0];
                setUserName(namePart);
                addMessage('bot', `Ok ${namePart}. Please enter your User ID.`);
                setStep('AWAIT_USERID');
                break;
            
            case 'AWAIT_USERID':
                setUserId(message.toUpperCase());
                addMessage('bot', "Please enter your Password.");
                setStep('AWAIT_PASSWORD');
                break;

            case 'AWAIT_PASSWORD':
                const user = users.find(u => u.id.toLowerCase() === userId.toLowerCase());
                if (user && user.password === message) {
                    setUserRole(user.role);
                    setUserName(user.name.split(' ')[0]);
                    addMessage('bot', "Access Granted");
                    if (user.role === Role.STUDENT) {
                        setTimeout(() => presentMainOptions(user.name.split(' ')[0]), 500);
                    } else if (user.role === Role.FACULTY || user.role === Role.STAFF) {
                        setTimeout(() => presentFacultyStaffOptions(user.name.split(' ')[0]), 500);
                    }
                } else {
                    addMessage('bot', "Sorry. UserID or Password incorrect.");
                    setTimeout(() => startConversation(), 1000);
                }
                break;
            default:
                addMessage('bot', "I'm not sure how to respond to that. Please select one of the options.");
        }
    };
    
    const handleOptionClick = (option: { label: string; payload: { view: TranscriptView, semester: string, academicYear: string } }) => {
        if (step === 'AWAIT_MAIN_CHOICE') {
            addMessage('user', option.label);
            setIsTyping(true);
            setTimeout(() => {
                presentSubOptions(option.payload.view, option.label);
                setIsTyping(false);
            }, 1000);
        } else if (step === 'AWAIT_FACULTYSTAFF_MAIN_CHOICE') {
            addMessage('user', option.label);
            setIsTyping(true);
            setTimeout(() => {
                presentFacultyStaffSubOptions();
                setIsTyping(false);
            }, 1000);
        } else if (step === 'AWAIT_SUB_CHOICE') {
            addMessage('user', option.label);
            setIsTyping(true);
            setTimeout(() => {
                addMessage('bot', `Generating your ${option.label.toLowerCase()} PDF... Please check your downloads.`);
                onPdfRequest(userId, option.payload);
                setIsTyping(false);
                 setTimeout(() => {
                    setIsTyping(true);
                    setTimeout(() => {
                        if (userRole === Role.STUDENT) {
                            presentMainOptions(userName);
                        } else {
                            presentFacultyStaffOptions(userName);
                        }
                        setIsTyping(false);
                    }, 500);
                 }, 2000);
            }, 1000);
        }
    }

    const getInputType = () => {
        if (step === 'AWAIT_PASSWORD') {
            return showPassword ? 'text' : 'password';
        }
        return 'text';
    }

    const getPlaceholder = () => {
        if (step.includes('CHOICE')) return "Please select an option above";
        if (step === 'AWAIT_PASSWORD') return "Enter your password...";
        return "Type your message...";
    }

    return (
        <>
            <div className={`fixed bottom-5 right-5 z-40 transition-transform duration-300 ${isOpen ? 'scale-0' : 'scale-100'}`}>
                <button onClick={() => setIsOpen(true)} className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900">
                    <ChatbotIcon className="h-8 w-8" />
                </button>
            </div>
            {isOpen && (
                <div className="fixed bottom-5 right-5 w-[380px] h-[600px] bg-slate-800 rounded-2xl shadow-2xl flex flex-col z-50 fade-in border border-slate-700">
                    <header className="flex items-center justify-between p-4 bg-slate-900 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <ChatbotIcon className="h-6 w-6 text-blue-400"/>
                            <h3 className="font-bold text-white">Chat with Ben</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><XMarkIcon className="h-6 w-6"/></button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    {msg.options && (
                                        <div className="mt-2 space-y-1">
                                            {msg.options.map(opt => (
                                                <button key={opt.label} onClick={() => handleOptionClick(opt)} className="w-full text-left text-sm bg-blue-500/50 hover:bg-blue-500 text-white font-medium rounded-lg px-3 py-1.5 transition-colors">
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                             <div className="flex justify-start">
                                <div className="bg-slate-700 text-slate-200 rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-1.5">
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700 flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type={getInputType()}
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                placeholder={getPlaceholder()}
                                className="w-full bg-slate-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                disabled={step.includes('CHOICE') || isTyping}
                            />
                            {step === 'AWAIT_PASSWORD' && (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            )}
                        </div>
                        <button type="submit" className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:bg-slate-600" disabled={step.includes('CHOICE') || isTyping}>
                            <SendIcon className="h-5 w-5"/>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default Chatbot;