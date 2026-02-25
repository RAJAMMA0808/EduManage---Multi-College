
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { MenuIcon, UploadIcon, CheckCircleIcon, XCircleIcon } from './icons';

interface OcrComponentProps {
    onToggleSidebar: () => void;
}

interface ExtractedMark {
    SubCode: string;
    SubjectName: string;
    InternalMarks: number;
    ExternalMarks: number;
    TotalMarks: number;
    PassFail: string;
}

interface ExtractedData {
    StudentName: string;
    AdmissionNo: string;
    Program: string;
    CourseDuration: string;
    AggregateMarks: string;
    marks: ExtractedMark[];
}

const OcrComponent: React.FC<OcrComponentProps> = ({ onToggleSidebar }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [base64Image, setBase64Image] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 4 * 1024 * 1024) {
                setError("File size exceeds 4MB. Please upload a smaller image.");
                return;
            }
            setImageFile(file);
            setExtractedData(null);
            setError(null);

            const reader = new FileReader();
            reader.onloadend = () => {
                setBase64Image((reader.result as string).split(',')[1]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExtractData = async () => {
        if (!base64Image || !imageFile) {
            setError("Please select an image file first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setExtractedData(null);

        try {
            // New instance per guideline for fresh API key state
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const imagePart = {
                inlineData: {
                    mimeType: imageFile.type,
                    data: base64Image,
                },
            };

            const textPart = {
                text: "Extract all tabular and header data from this marks memo. Student Name, Admission Number, Program, Course Duration, and the table containing Subject Code, Subject Name, Internal, External, Total Marks and Pass/Fail status.",
            };

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            StudentName: { type: Type.STRING },
                            AdmissionNo: { type: Type.STRING },
                            Program: { type: Type.STRING },
                            CourseDuration: { type: Type.STRING },
                            AggregateMarks: { type: Type.STRING },
                            marks: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        SubCode: { type: Type.STRING },
                                        SubjectName: { type: Type.STRING },
                                        InternalMarks: { type: Type.NUMBER },
                                        ExternalMarks: { type: Type.NUMBER },
                                        TotalMarks: { type: Type.NUMBER },
                                        PassFail: { type: Type.STRING },
                                    },
                                    required: ["SubCode", "SubjectName", "InternalMarks", "ExternalMarks", "TotalMarks", "PassFail"],
                                },
                            },
                        },
                    },
                },
            });

            // Guideline: Access .text property directly
            const jsonString = response.text;
            if (jsonString) {
                const data = JSON.parse(jsonString.trim());
                setExtractedData(data);
            } else {
                throw new Error("AI returned empty result.");
            }

        } catch (err) {
            console.error("OCR Failure:", err);
            setError("AI failed to extract text. Ensure image is clear and tabular.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex-1 p-4 md:p-8 bg-transparent overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
                <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}>
                    <MenuIcon className="h-6 w-6" />
                </button>
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Intelligence OCR Portal</h2>
                    <p className="text-slate-400 mt-1 text-sm font-medium">Extract data from physical marks memos using Gemini Vision.</p>
                </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Document Capture</label>
                        <div className="relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all border-slate-700 bg-slate-950 hover:border-blue-500 hover:bg-slate-900 shadow-inner">
                            <div className="flex flex-col items-center justify-center text-slate-500">
                                <UploadIcon className="h-12 w-12 mb-4" />
                                <h3 className="text-lg font-bold text-slate-300">{imageFile ? imageFile.name : 'Select Marks Memo Image'}</h3>
                                <p className="text-xs mt-2 uppercase tracking-tighter">JPEG, PNG or WebP</p>
                            </div>
                            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
                        </div>
                    </div>
                    <div className="flex flex-col justify-between h-full min-h-[220px]">
                        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 h-48 flex items-center justify-center overflow-hidden">
                            {imageFile && base64Image ? (
                                <img src={`data:${imageFile.type};base64,${base64Image}`} alt="Preview" className="max-w-full max-h-full object-contain rounded opacity-70" />
                            ) : (
                                <p className="text-xs text-slate-700 font-bold uppercase italic">Hardware Preview Standby</p>
                            )}
                        </div>
                        <button 
                            onClick={handleExtractData} 
                            disabled={!imageFile || isLoading} 
                            className="mt-6 w-full text-white bg-blue-600 hover:bg-blue-500 font-black py-4 rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-blue-900/20 disabled:opacity-20 transition-all active:scale-95"
                        >
                            {isLoading ? 'Processing Pipeline...' : 'Initialize Data Extraction'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-3 animate-pulse">
                        <XCircleIcon className="h-5 w-5" />
                        {error}
                    </div>
                )}
            </div>

            {extractedData && (
                 <div className="mt-8 bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 animate-fade-in">
                    <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Extraction Results</h3>
                        <CheckCircleIcon className="h-8 w-8 text-green-500" />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Student</p>
                            <p className="text-sm font-bold text-slate-100 mt-1">{extractedData.StudentName}</p>
                        </div>
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">ID</p>
                            <p className="text-sm font-mono font-bold text-blue-400 mt-1">{extractedData.AdmissionNo}</p>
                        </div>
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Program</p>
                            <p className="text-sm font-bold text-slate-100 mt-1">{extractedData.Program}</p>
                        </div>
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Agg. Marks</p>
                            <p className="text-sm font-bold text-green-400 mt-1">{extractedData.AggregateMarks}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-lg">
                        <table className="min-w-full divide-y divide-slate-800">
                            <thead className="bg-slate-950">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Sub Code</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Int</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Ext</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Res</th>
                                </tr>
                            </thead>
                            <tbody className="bg-slate-900 divide-y divide-slate-800/50">
                                {extractedData.marks.map((mark, index) => (
                                    <tr key={index} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-3 whitespace-nowrap text-xs font-mono text-slate-400">{mark.SubCode}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-xs font-bold text-slate-300">{mark.SubjectName}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-xs text-center text-slate-400">{mark.InternalMarks}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-xs text-center text-slate-400">{mark.ExternalMarks}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-xs text-center font-black text-slate-100">{mark.TotalMarks}</td>
                                        <td className={`px-6 py-3 whitespace-nowrap text-xs font-black text-center ${mark.PassFail === 'F' ? 'text-red-500' : 'text-green-500'}`}>{mark.PassFail}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>
            )}
        </main>
    );
};

export default OcrComponent;
