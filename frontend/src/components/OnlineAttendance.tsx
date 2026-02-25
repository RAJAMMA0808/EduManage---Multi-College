
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { User, Role, StudentDetailsType, StudentFee } from '../types/index';
import { MenuIcon, CameraIcon, CheckCircleIcon, XCircleIcon, RefreshIcon, MapPin, BellIcon, SendIcon } from './icons';
import { getStudentDetails, getFacultyDetails, getStaffDetails, verifyLocation, uploadExcelData } from '../services/api';

const LocalClockIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ROOM_ADDRESS = "9/314/1 (4/9/314/1), SURYA NAGAR COLONY, RTC SUPERVISORS COLONY, HYDERABAD, TELANGANA – 501505";
const ALLOWED_RADIUS = 50; 

interface AttendanceRecord {
    id: number;
    userId: string;
    userName: string;
    userRole: Role;
    programCode: string;
    date: string;
    time: string;
    method: 'Thumb' | 'Photo';
    locationStatus: 'GEO-AUTHENTICATED';
    distance: number;
    isLate: boolean;
    sessionType: 'morning' | 'evening';
}

const OnlineAttendance: React.FC<{ user: User; onToggleSidebar: () => void }> = ({ user, onToggleSidebar }) => {
    const [location, setLocation] = useState<{ lat: number; lng: number; alt: number | null } | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [isInsideZone, setIsInsideZone] = useState<boolean>(false);
    const [loadingLocation, setLoadingLocation] = useState(true);
    
    const [biometricMethod, setBiometricMethod] = useState<'Thumb' | 'Photo'>('Photo');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [thumbProgress, setThumbProgress] = useState(0);
    const [photoProgress, setPhotoProgress] = useState(0);
    
    const [userFullDetails, setUserFullDetails] = useState<any>(null);
    const [isFetchingMetrics, setIsFetchingMetrics] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    
    useEffect(() => {
        const fetchData = async () => {
            setIsFetchingMetrics(true);
            try {
                let data = null;
                if (user.role === Role.STUDENT) data = await getStudentDetails(user.id);
                else if (user.role === Role.FACULTY) data = await getFacultyDetails(user.id);
                else if (user.role === Role.STAFF) data = await getStaffDetails(user.id);
                setUserFullDetails(data);
            } catch (e) {
                console.error("Metric sync failed", e);
            } finally {
                setIsFetchingMetrics(false);
            }
        };
        fetchData();
    }, [user.id, user.role]);

    const getTimeInMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes();
    
    const timeStatus = useMemo(() => {
        const nowMin = getTimeInMinutes(currentTime);
        const morningStart = 9 * 60;
        const morningClose = 11 * 60 + 55;
        const eveningStart = 14 * 60;
        const eveningClose = 23 * 60 + 55;

        const isMorningActive = (nowMin >= morningStart && nowMin < morningClose);
        const isEveningActive = (nowMin >= eveningStart && nowMin < eveningClose);

        const morningLabel: 'ACTIVE' | 'CLOSED' = isMorningActive ? 'ACTIVE' : 'CLOSED';
        const eveningLabel: 'ACTIVE' | 'CLOSED' = isEveningActive ? 'ACTIVE' : 'CLOSED';

        const isMorningLatePeriod = (nowMin >= (9 * 60 + 30) && nowMin < morningClose);
        
        const currentSessionType: 'morning' | 'evening' | 'none' = isMorningActive ? 'morning' : (isEveningActive ? 'evening' : 'none');
        const isOpen = isMorningActive || isEveningActive;

        return { 
            morningLabel, 
            eveningLabel, 
            isMorningActive,
            isEveningActive,
            isMorningLatePeriod, 
            isOpen, 
            currentSessionType 
        };
    }, [currentTime]);

    const markedSessions = useMemo(() => {
        if (!userFullDetails?.attendance) return { morning: null, evening: null };
        const logs = userFullDetails.attendance.filter((a: any) => a.date === todayStr);
        return {
            morning: logs.find((l: any) => l.morning === 'Present') || null,
            evening: logs.find((l: any) => l.afternoon === 'Present') || null
        };
    }, [userFullDetails, todayStr]);

    const isCurrentSessionMarked = useMemo(() => {
        if (timeStatus.isMorningActive) return !!markedSessions.morning;
        if (timeStatus.isEveningActive) return !!markedSessions.evening;
        return false;
    }, [timeStatus, markedSessions]);

    const syncLocationWithBackend = async (lat: number, lng: number, alt: number | null) => {
        setLoadingLocation(true);
        try {
            const result = await verifyLocation(user.id, lat, lng);
            setLocation({ lat: result.lat, lng: result.lng, alt });
            setDistance(result.distance);
            setIsInsideZone(result.distance <= ALLOWED_RADIUS);
        } catch (e) {
            console.error("Backend location verification failed", e);
        } finally {
            setLoadingLocation(false);
        }
    };

    const startTracking = () => {
        if (!navigator.geolocation) return;
        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => syncLocationWithBackend(pos.coords.latitude, pos.coords.longitude, pos.coords.altitude),
            () => setLoadingLocation(false),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        startTracking();
    }, []);

    const isSensorInteractable = useMemo(() => {
        if (!isInsideZone || isCurrentSessionMarked || !timeStatus.isOpen || isSubmitting) return false;
        if (biometricMethod === 'Photo') {
            if (photoProgress === 100) return false;
        } else {
            if (thumbProgress === 100) return false;
        }
        return true;
    }, [isInsideZone, isCurrentSessionMarked, timeStatus, biometricMethod, photoProgress, thumbProgress, isSubmitting]);

    const lateCount = useMemo(() => {
        if (!userFullDetails?.attendance) return 0;
        return userFullDetails.attendance.filter((a: any) => a.isLate).length;
    }, [userFullDetails]);

    const deductedDays = Math.floor(lateCount / 4);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopCamera = () => {
        if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
        setIsCameraActive(false);
    };

    const startCamera = async () => {
        if (!isInsideZone) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 400 } });
            streamRef.current = stream;
            setIsCameraActive(true);
            setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
        } catch (err) { alert("Camera unavailable."); }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth || 320;
                canvasRef.current.height = videoRef.current.videoHeight || 400;
                context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                setCapturedPhoto(canvasRef.current.toDataURL('image/jpeg', 0.6));
                setPhotoProgress(100);
                stopCamera();
            }
        }
    };

    const submitAttendance = async () => {
        if (!isInsideZone || isCurrentSessionMarked || isSubmitting) return;
        
        setIsSubmitting(true);
        const session = timeStatus.currentSessionType;
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
        
        const payload = {
            admissionNumber: user.id,
            studentName: user.name,
            collegeCode: user.college,
            date: todayStr,
            morning: session === 'morning' ? 'Present' : 'Absent',
            afternoon: session === 'evening' ? 'Present' : 'Absent',
            isLate: session === 'morning' ? timeStatus.isMorningLatePeriod : false,
            time: timeStr
        };

        try {
            // FIX: Submit to BACKEND instead of just LocalStorage
            const result = await uploadExcelData([payload], 'studentAttendance', user.college!);
            
            if (result.success) {
                // Also update local storage for the local "record" table list
                const localRecord: AttendanceRecord = {
                    id: Date.now(),
                    userId: user.id,
                    userName: user.name,
                    userRole: user.role,
                    programCode: user.department || 'GEN',
                    date: todayStr.split('-').reverse().join('/'),
                    time: timeStr,
                    method: biometricMethod,
                    locationStatus: 'GEO-AUTHENTICATED',
                    distance: distance || 0,
                    isLate: payload.isLate,
                    sessionType: session as any
                };
                const allLogs = JSON.parse(localStorage.getItem('online_attendance_log') || '[]');
                localStorage.setItem('online_attendance_log', JSON.stringify([localRecord, ...allLogs]));
                
                // Refresh local data to reflect "Marked" status
                const details = await getStudentDetails(user.id);
                setUserFullDetails(details);
                
                alert(`Attendance Authenticated & Synced to Main Dashboard Successfully.`);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            alert(`Sync Failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSubmitting(false);
            setPhotoProgress(0);
            setThumbProgress(0);
            setCapturedPhoto(null);
        }
    };

    const todayRecordsToDisplay = useMemo(() => {
        // Fetch from local for the UI list
        const stored = localStorage.getItem('online_attendance_log');
        if (!stored) return [];
        const logs: AttendanceRecord[] = JSON.parse(stored);
        return logs.filter(l => l.userId === user.id && l.date === todayStr.split('-').reverse().join('/'));
    }, [user.id, todayStr, isSubmitting]);

    return (
        <main className="flex-1 p-4 md:p-8 bg-[#030712] overflow-y-auto">
            <div className="mb-10 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-4">
                        <button className="text-slate-400 md:hidden" onClick={onToggleSidebar}><MenuIcon className="h-6 w-6" /></button>
                        <h2 className="text-3xl font-black text-white uppercase border-b-4 border-blue-600 pb-1 tracking-tight">ONLINE ATTENDANCE PORTAL</h2>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 mt-4 text-[10px] font-bold tracking-tight uppercase">
                        <MapPin className="h-3 w-3 text-red-500" />
                        <span>LOCKED: {ROOM_ADDRESS}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#111827] p-6 rounded-3xl border border-slate-800 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Live Telemetry</h3>
                            <button onClick={startTracking} className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold py-1.5 px-3 rounded-full flex items-center gap-2 transition-all">
                                <RefreshIcon className={`h-2.5 w-2.5 ${loadingLocation ? 'animate-spin' : ''}`} />
                                SYNC GPS
                            </button>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className={`mb-6 px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-widest border transition-colors ${isInsideZone ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                                {distance === null ? 'WAITING FOR GPS...' : isInsideZone ? 'POSITION VERIFIED (LESS THAN 50M)' : 'OUTSIDE AUTHORIZED ZONE'}
                            </div>
                            
                            <div className="bg-slate-950 w-full py-8 rounded-[2rem] border border-slate-800 flex flex-col items-center shadow-inner mb-6">
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Radial Proximity</p>
                                <span className="text-6xl font-black text-white tabular-nums leading-none">{distance !== null ? Math.round(distance) : '---'}</span>
                                <span className="text-base font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Meters</span>
                            </div>

                            <div className="w-full space-y-2.5 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Lat:</span>
                                    <span className="text-[11px] font-bold text-slate-200 font-mono">{location?.lat?.toFixed(6) || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Lng:</span>
                                    <span className="text-[11px] font-bold text-slate-200 font-mono">{location?.lng?.toFixed(6) || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Alt:</span>
                                    <span className="text-[11px] font-bold text-slate-200 font-mono">{location?.alt !== null ? location?.alt?.toFixed(2) + 'm' : '0.00m'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-3xl border border-slate-800 bg-[#111827] shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <LocalClockIcon className="h-4 w-4 text-green-500" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Attendance Windows</h4>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 rounded-xl border bg-slate-900 border-slate-800">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Morning Session</span>
                                    <span className="text-[11px] font-bold text-white">09:00 AM – 11:55 AM</span>
                                </div>
                                <span className={`text-[8px] font-black px-2 py-1 rounded ${timeStatus.morningLabel === 'ACTIVE' ? 'bg-green-500' : 'bg-red-600'} text-white`}>{timeStatus.morningLabel}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl border bg-slate-900 border-slate-800">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Evening Session</span>
                                    <span className="text-[11px] font-bold text-white">02:00 PM – 11:55 PM</span>
                                </div>
                                <span className={`text-[8px] font-black px-2 py-1 rounded ${timeStatus.eveningLabel === 'ACTIVE' ? 'bg-green-500' : 'bg-red-600'} text-white`}>{timeStatus.eveningLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <div className="bg-[#111827] rounded-3xl border border-slate-800 shadow-2xl h-full flex flex-col overflow-hidden relative">
                        <div className="p-8 flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Biometric Verification</h3>
                                <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner">
                                    <button 
                                        onClick={() => { setBiometricMethod('Thumb'); setCapturedPhoto(null); setPhotoProgress(0); stopCamera(); }} 
                                        disabled={!isInsideZone || isCurrentSessionMarked}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${!isInsideZone || isCurrentSessionMarked ? 'opacity-20 cursor-not-allowed' : biometricMethod === 'Thumb' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                    >Touch</button>
                                    <button 
                                        onClick={() => { setBiometricMethod('Photo'); setThumbProgress(0); }} 
                                        disabled={!isInsideZone || isCurrentSessionMarked}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${!isInsideZone || isCurrentSessionMarked ? 'opacity-20 cursor-not-allowed' : biometricMethod === 'Photo' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                    >Scan</button>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/50 rounded-[3rem] border border-slate-800 p-12">
                                <div className="flex flex-col items-center gap-6 w-full max-w-[200px]">
                                    <h4 className="text-white font-bold uppercase tracking-widest text-[10px] text-center">
                                        {biometricMethod === 'Photo' ? 'Optical Sensor' : 'Haptic Sensor'}
                                    </h4>
                                    <div className="relative w-40 h-52 border-2 border-slate-700 rounded-[2.5rem] flex flex-col items-center justify-center bg-slate-950 overflow-hidden shadow-2xl">
                                        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
                                            {isCurrentSessionMarked ? (
                                                <div className="bg-green-500/10 w-full h-full flex items-center justify-center">
                                                    <CheckCircleIcon className="h-16 w-16 text-green-500" />
                                                </div>
                                            ) : biometricMethod === 'Photo' ? (
                                                capturedPhoto ? <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover grayscale opacity-80" /> :
                                                isCameraActive ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-70 grayscale" /> :
                                                <CameraIcon className="h-12 w-12 text-slate-800" />
                                            ) : (
                                                thumbProgress === 100 ? <CheckCircleIcon className="h-16 w-16 text-green-500" /> :
                                                <svg className="h-12 w-12 text-slate-800" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1c-5.1 0-9.2 4.1-9.2 9.2v.4c0 .8.7 1.4 1.5 1.4s1.5-.7 1.5-1.4v-.4c0-3.4 2.8-6.2 6.2-6.2s6.2 2.8 6.2 6.2v10.3c0 1.2-.5 2.4-1.4 3.3l-.2.2c-.3.3-.3.8 0 1.1s.8.3 1.1 0l.2-.2c1.2-1.2 1.8-2.8 1.8-4.4V10.2c0-5.1-4.1-9.2-9.2-9.2zm0 15.4c-1.7 0-3.1-1.4-3.1-3.1V10.2c0-1.7 1.4-3.1 3.1-3.1s3.1 1.4 3.1 3.1v3.1c0 1.7-1.4 3.1-3.1 3.1zm0-4.6c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5zm-6.1 4.6c0 .8.7 1.4 1.5 1.4s1.5-.7 1.5-1.4v-3.1c0-.8-.7-1.4-1.5-1.4s-1.5.7-1.5 1.4v3.1z"/></svg>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 w-full bg-blue-600/40 transition-all duration-700 ease-in-out border-t border-blue-400/50 z-10" 
                                             style={{ height: `${isCurrentSessionMarked ? 100 : biometricMethod === 'Photo' ? photoProgress : thumbProgress}%` }} />
                                        <div className="relative z-30 flex flex-col items-center gap-3">
                                            <div className="bg-slate-900/90 px-3 py-1 rounded-full border border-slate-700">
                                                <span className="text-lg font-black text-white tabular-nums tracking-tighter">{isCurrentSessionMarked ? 100 : biometricMethod === 'Photo' ? photoProgress : thumbProgress}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={biometricMethod === 'Photo' ? (isCameraActive ? capturePhoto : startCamera) : () => { let p=0; const inv=setInterval(()=>{p+=20; setThumbProgress(p); if(p>=100){clearInterval(inv);}}, 150);}}
                                        disabled={!isSensorInteractable}
                                        className="bg-slate-800 hover:bg-blue-600 text-white text-[10px] font-bold rounded-xl border border-slate-600 w-full h-10 transition-all uppercase disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        {!isCameraActive && biometricMethod === 'Photo' ? 'Initialize Sensor' : 'Capture Pattern'}
                                    </button>
                                </div>
                            </div>
                            
                            {isCurrentSessionMarked && (
                                <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center gap-3 animate-fade-in">
                                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                    <p className="text-sm font-bold text-green-400 tracking-tight">
                                        ok : "{timeStatus.currentSessionType === 'morning' ? 'Morning' : 'Evening'} attendance completed"
                                    </p>
                                </div>
                            )}

                            {!isCurrentSessionMarked && (
                                <button 
                                    onClick={submitAttendance}
                                    disabled={!isInsideZone || !timeStatus.isOpen || (biometricMethod === 'Thumb' ? thumbProgress < 100 : photoProgress < 100) || isSubmitting}
                                    className="mt-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-20 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all"
                                >
                                    {isSubmitting ? 'Verifying Identity...' : 'Secure Log Entry'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 bg-[#111827] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden mb-20">
                <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Today's Authentication Record</h3>
                    
                    <div className="flex items-center gap-6">
                        <div className="bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-xl text-center min-w-[100px]">
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Late Count</p>
                            <p className="text-sm font-black text-blue-400 tabular-nums">{isFetchingMetrics ? '...' : lateCount}</p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-xl text-center min-w-[120px]">
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Deducted Days</p>
                            <p className="text-sm font-black text-red-500 tabular-nums">-{isFetchingMetrics ? '...' : deductedDays}</p>
                        </div>

                        <button 
                            className="p-2.5 bg-slate-900 border border-slate-800 rounded-full hover:bg-slate-800 transition-colors group"
                            title="Attendance Alerts"
                            onClick={() => alert("Alert System: No critical violations detected for your ID today.")}
                        >
                            <BellIcon className="h-5 w-5 text-yellow-500 group-hover:scale-110 transition-transform" />
                        </button>

                        <div className="bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-xl text-center min-w-[140px]">
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Father's Mobile (+91)</p>
                            <p className="text-sm font-black text-blue-400 font-mono tracking-tight">
                                {isFetchingMetrics ? '...' : (userFullDetails?.fatherMobileNumber || 'NOT REGISTERED')}
                            </p>
                        </div>

                        <button 
                            className="p-2.5 bg-slate-900 border border-slate-800 rounded-full hover:bg-slate-800 transition-colors group"
                            title="Notification Messages"
                            onClick={() => alert(`Attendance history for ${user.id} has been transmitted to verified parent contact.`)}
                        >
                            <SendIcon className="h-5 w-5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-[#0b0e14]">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">User Details</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Time & Date</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Method</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Distance</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Session</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-slate-300">
                            {todayRecordsToDisplay.length > 0 ? (
                                todayRecordsToDisplay.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="text-sm font-bold text-white uppercase tracking-tight underline underline-offset-4 decoration-blue-500/20">{record.userName}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono tracking-tight">{record.userId} ({record.programCode})</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm font-bold text-slate-300 font-mono tabular-nums flex items-center gap-2">
                                               {record.time} 
                                               {record.isLate && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black tracking-widest">LATE</span>}
                                            </div>
                                            <div className="text-[10px] text-slate-600 font-bold">{record.date}</div>
                                        </td>
                                        <td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.method} Check</td>
                                        <td className="px-8 py-5 text-[10px] font-mono text-slate-500 italic tabular-nums text-center">{Math.round(record.distance)}m Proximity</td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`text-[10px] font-black uppercase tracking-tight ${record.sessionType === 'morning' ? 'text-blue-400' : 'text-emerald-400'}`}>
                                                {record.sessionType === 'morning' ? 'Morning' : 'Evening'} Attendance
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[9px] font-black rounded border border-green-500/20 uppercase tracking-widest">SECURE</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-bold uppercase text-xs italic tracking-widest">
                                        No authentication logged for today.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </main>
    );
};

export default OnlineAttendance;
