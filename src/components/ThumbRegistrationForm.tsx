
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Role, College } from '../types/index';
import { DEPARTMENTS, COLLEGE_NAMES } from '../constants/index';
import { MenuIcon, CheckCircleIcon, CameraIcon, XCircleIcon } from './icons';

interface ThumbRegistrationFormProps {
    user: User;
    onToggleSidebar: () => void;
    onSubmitSuccess: () => void;
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const commonInputClass = "bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none transition-colors";
const commonSelectClass = "bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none transition-colors";

interface BiometricCircleProps {
    label: string; 
    progress: number; 
    onCapture: () => void;
    icon: React.ReactNode;
    videoRef?: React.RefObject<HTMLVideoElement>;
    canvasRef?: React.RefObject<HTMLCanvasElement>;
    cameraError?: string | null;
    isCameraActive?: boolean;
    lastPhoto?: string | null;
}

const BiometricCircle: React.FC<BiometricCircleProps> = ({ label, progress, onCapture, icon, videoRef, canvasRef, cameraError, isCameraActive, lastPhoto }) => {
    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-[200px]">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs text-center">{label}</h4>
            <div className="relative w-40 h-52 border-2 border-slate-700 rounded-[2.5rem] flex flex-col items-center justify-center bg-slate-950 overflow-hidden shadow-2xl shadow-blue-900/10">
                {/* Shutter Flash Effect */}
                <div id={`flash-${label.replace(/\s+/g, '')}`} className="absolute inset-0 bg-white opacity-0 z-50 pointer-events-none transition-opacity duration-100"></div>

                {/* Scanner Grid Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20 z-20">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="w-full h-px bg-blue-400" />
                    ))}
                </div>

                {/* Live Camera Feed or State Display */}
                <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
                    {cameraError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-900">
                            <XCircleIcon className="h-8 w-8 text-red-500 mb-2" />
                            <span className="text-[10px] text-slate-400 leading-tight">{cameraError}</span>
                        </div>
                    ) : (isCameraActive && progress < 100) ? (
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover opacity-80 grayscale" 
                        />
                    ) : progress === 100 ? (
                        <div className="bg-green-500/20 w-full h-full flex items-center justify-center">
                            <CheckCircleIcon className="h-16 w-16 text-green-500" />
                        </div>
                    ) : lastPhoto ? (
                        <img src={lastPhoto} alt="Captured" className="w-full h-full object-cover opacity-60" />
                    ) : (
                         <div className="flex flex-col items-center gap-2 text-slate-700">
                            {icon}
                            <span className="text-[9px] font-bold uppercase tracking-tighter">Standby</span>
                         </div>
                    )}
                </div>
                
                {/* Progress fill */}
                <div 
                    className="absolute bottom-0 w-full bg-blue-600/40 transition-all duration-700 ease-in-out border-t border-blue-400/50 z-10" 
                    style={{ height: `${progress}%` }} 
                />

                {/* Progress Number */}
                <div className="relative z-30 flex flex-col items-center gap-3">
                    <div className="flex flex-col items-center bg-slate-900/90 px-3 py-1 rounded-full border border-slate-700">
                        <span className="text-lg font-black text-white tabular-nums tracking-tighter">{progress}%</span>
                    </div>
                </div>

                {/* Scanning Laser Line */}
                {progress > 0 && progress < 100 && isCameraActive && (
                    <div className="absolute w-full h-1 bg-blue-400 shadow-[0_0_15px_#60a5fa] z-40 animate-scan" style={{ top: '0%' }}></div>
                )}
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" width="320" height="400" />
            
            <button 
                onClick={onCapture}
                disabled={progress === 100 || (isCameraActive && !!cameraError)}
                className="group relative px-6 py-2.5 bg-slate-800 hover:bg-blue-600 text-white text-[10px] font-bold rounded-xl border border-slate-600 hover:border-blue-400 shadow-xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed overflow-hidden w-full"
            >
                <span className="relative z-10">
                    {!isCameraActive && progress === 0 ? 'Open Camera' : 'Every Click'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
        </div>
    );
};

const ThumbRegistrationForm: React.FC<ThumbRegistrationFormProps> = ({ user, onToggleSidebar, onSubmitSuccess, setUsers }) => {
    // Designation logic
    const registrationRole = user.role;
    const collegeCode = user.college || 'KNRR';
    
    const [admissionNumber, setAdmissionNumber] = useState(user.id);
    const [userName, setUserName] = useState(user.name);
    const [gender, setGender] = useState('M');
    const [branch, setBranch] = useState(user.department || 'CSE');
    const [semester, setSemester] = useState('1');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
    
    // Progress States
    const [photoProgress, setPhotoProgress] = useState(0);
    const [thumbProgress, setThumbProgress] = useState(0);
    const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
    
    // Hardware States
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const isStudent = registrationRole === Role.STUDENT;
    const isFacultyOrHOD = registrationRole === Role.FACULTY || registrationRole === Role.HOD;
    const isStaffOrPrincipal = registrationRole === Role.STAFF || registrationRole === Role.PRINCIPAL || registrationRole === Role.CHAIRMAN;

    const academicYearOptions = useMemo(() => {
        const match = admissionNumber.match(/[a-zA-Z]+(\d{4})/);
        if (!match) {
            const currentYear = new Date().getFullYear();
            return [`${currentYear}-${currentYear + 1}`];
        }
        const startYear = parseInt(match[1], 10);
        // Students get 4 years list, others get current year only as per spec
        if (isStudent) {
            return Array.from({ length: 4 }, (_, i) => `${startYear + i}-${startYear + i + 1}`);
        } else {
            const currentYear = new Date().getFullYear();
            return [`${currentYear}-${currentYear + 1}`];
        }
    }, [admissionNumber, isStudent]);

    useEffect(() => {
        if (academicYearOptions.length > 0 && !selectedAcademicYear) {
            setSelectedAcademicYear(academicYearOptions[0]);
        }
    }, [academicYearOptions, selectedAcademicYear]);

    // Attachment logic with delay to ensure video element is mounted
    useEffect(() => {
        if (isCameraActive && streamRef.current) {
            const timer = setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isCameraActive, photoProgress]);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    const startCamera = async () => {
        if (isCameraActive || photoProgress === 100) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 400 } } 
            });
            streamRef.current = stream;
            setIsCameraActive(true);
            setCameraError(null);
        } catch (err) {
            console.error("Camera access failed:", err);
            setCameraError("Camera access denied.");
        }
    };

    useEffect(() => {
        if (photoProgress === 100) {
            stopCamera();
        }
    }, [photoProgress]);

    useEffect(() => {
        return () => stopCamera();
    }, []);

    const triggerFlash = (label: string) => {
        const flash = document.getElementById(`flash-${label.replace(/\s+/g, '')}`);
        if (flash) {
            flash.style.opacity = '1';
            setTimeout(() => { flash.style.opacity = '0'; }, 80);
        }
    };

    const handlePhotoCapture = async () => {
        if (!isCameraActive && photoProgress < 100) {
            await startCamera();
            return;
        }

        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            if (context) {
                canvas.width = video.videoWidth || 320;
                canvas.height = video.videoHeight || 400;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg', 0.6);
                setCapturedPhotos(prev => [imageData, ...prev].slice(0, 10));
                triggerFlash('Photo Registration');
                setPhotoProgress(prev => Math.min(prev + 10, 100));
            }
        }
    };

    const handleThumbCapture = () => {
        triggerFlash('Thumb Registration');
        setThumbProgress(prev => Math.min(prev + 10, 100));
    };

    const isReadyToSubmit = photoProgress === 100 && thumbProgress === 100;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isReadyToSubmit) return;

        setUsers(prev => prev.map(u => 
            u.id.toUpperCase() === admissionNumber.toUpperCase()
            ? { 
                ...u, 
                attendanceStatus: 'pending',
                department: branch,
                college: collegeCode as College,
                status: 'approved' 
              } 
            : u
        ));

        alert("Registration Submitted Successfully.");
        onSubmitSuccess();
    };

    const getIDLabel = () => isStudent ? 'Admission Number' : 'Registration Number';
    const getNameLabel = () => {
        if (isStudent) return 'Student Name';
        if (isStaffOrPrincipal) return 'Staff Name';
        return 'Name';
    };

    return (
        <main className="flex-1 p-4 md:p-8 bg-transparent overflow-y-auto">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4 shrink-0">
                    <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}>
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600/20 p-2 rounded-lg">
                            <CameraIcon className="h-7 w-7 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white underline decoration-slate-600 underline-offset-8 decoration-2">Thumb Registration Form</h2>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">College Code</label>
                    <div className="text-blue-400 font-mono font-bold tracking-wider">{collegeCode}</div>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Registration By</label>
                    <div className="text-sm font-bold text-white capitalize">{registrationRole.toLowerCase()}</div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto space-y-12 pb-20">
                <div className="bg-[#1e293b]/40 backdrop-blur-sm p-8 rounded-2xl border border-slate-800/50 shadow-2xl">
                    <form className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{getIDLabel()}</label>
                            <input 
                                type="text" 
                                value={admissionNumber} 
                                readOnly
                                className={`${commonInputClass} bg-slate-700/50 cursor-not-allowed`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{getNameLabel()}</label>
                            <input 
                                type="text" 
                                value={userName} 
                                readOnly
                                className={`${commonInputClass} bg-slate-700/50 cursor-not-allowed`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Gender</label>
                            <select value={gender} onChange={(e) => setGender(e.target.value)} className={commonSelectClass}>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                            </select>
                        </div>
                        
                        {(isStudent || isFacultyOrHOD) && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Branch</label>
                                <div className={`${commonInputClass} bg-slate-700/50 cursor-not-allowed`}>{branch}</div>
                            </div>
                        )}

                        {isStaffOrPrincipal && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">College Name</label>
                                <div className={`${commonInputClass} bg-slate-700/50 cursor-not-allowed`}>{COLLEGE_NAMES[collegeCode as College]}</div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Academic Year</label>
                            <select 
                                value={selectedAcademicYear} 
                                onChange={(e) => setSelectedAcademicYear(e.target.value)} 
                                className={commonSelectClass}
                                required
                            >
                                {academicYearOptions.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                            </select>
                        </div>

                        {isStudent && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Semester</label>
                                <select value={semester} onChange={(e) => setSemester(e.target.value)} className={commonSelectClass}>
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <option key={i+1} value={i+1}>{i+1}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </form>
                </div>

                <div className="flex flex-col items-center gap-8 p-12 bg-[#0f172a]/80 backdrop-blur-md rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-600 font-black text-xl hidden md:block opacity-20 tracking-tighter">(and)</div>
                    
                    <div className="flex flex-col md:flex-row gap-12 items-start justify-center w-full">
                        <BiometricCircle 
                            label="Photo Registration" 
                            progress={photoProgress} 
                            onCapture={handlePhotoCapture} 
                            icon={<CameraIcon className="h-10 w-10" />}
                            videoRef={videoRef}
                            canvasRef={canvasRef}
                            cameraError={cameraError}
                            isCameraActive={isCameraActive}
                            lastPhoto={capturedPhotos[0]}
                        />

                        <BiometricCircle 
                            label="Thumb Registration" 
                            progress={thumbProgress} 
                            onCapture={handleThumbCapture} 
                            icon={<svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1c-5.1 0-9.2 4.1-9.2 9.2v.4c0 .8.7 1.4 1.5 1.4s1.5-.7 1.5-1.4v-.4c0-3.4 2.8-6.2 6.2-6.2s6.2 2.8 6.2 6.2v10.3c0 1.2-.5 2.4-1.4 3.3l-.2.2c-.3.3-.3.8 0 1.1s.8.3 1.1 0l.2-.2c1.2-1.2 1.8-2.8 1.8-4.4V10.2c0-5.1-4.1-9.2-9.2-9.2zm0 15.4c-1.7 0-3.1-1.4-3.1-3.1V10.2c0-1.7 1.4-3.1 3.1-3.1s3.1 1.4 3.1 3.1v3.1c0 1.7-1.4 3.1-3.1 3.1zm0-4.6c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5zm-6.1 4.6c0 .8.7 1.4 1.5 1.4s1.5-.7 1.5-1.4v-3.1c0-.8-.7-1.4-1.5-1.4s-1.5.7-1.5 1.4v3.1z"/></svg>}
                        />
                    </div>

                    {capturedPhotos.length > 0 && (
                        <div className="w-full pt-8 border-t border-slate-800">
                            <p className="text-center text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Registration Gallery</p>
                            <div className="flex justify-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                {capturedPhotos.map((p, idx) => (
                                    <div key={idx} className="w-12 h-16 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 shadow-lg ring-1 ring-blue-500/30">
                                        <img src={p} alt={`Capture ${idx}`} className="w-full h-full object-cover grayscale" />
                                    </div>
                                ))}
                                {Array.from({ length: 10 - capturedPhotos.length }).map((_, idx) => (
                                    <div key={`empty-${idx}`} className="w-12 h-16 rounded-lg bg-slate-900/50 border border-slate-800/50 border-dashed flex-shrink-0 flex items-center justify-center text-slate-700 font-bold text-[8px]">{capturedPhotos.length + idx + 1}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-4 pt-8">
                    {!isReadyToSubmit && (
                        <p className="text-slate-500 text-sm font-medium animate-pulse text-center">Capture all 10 photos and complete thumb scan to finalize registration.</p>
                    )}
                    <button 
                        onClick={handleSubmit}
                        disabled={!isReadyToSubmit}
                        className="group relative px-20 py-5 bg-green-600 hover:bg-green-500 text-white font-black rounded-3xl shadow-[0_20px_50px_rgba(22,163,74,0.3)] transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed disabled:grayscale overflow-hidden uppercase tracking-widest text-lg"
                    >
                        <span className="relative z-10">Submit Registration</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0%, 100% { top: 0%; }
                    50% { top: 100%; }
                }
                .animate-scan {
                    animation: scan 2s linear infinite;
                }
            `}</style>
        </main>
    );
};

export default ThumbRegistrationForm;
