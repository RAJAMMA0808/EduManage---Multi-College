import React from 'react';

export const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m9 5.197a6 6 0 006-5.197M3 21a6 6 0 016-5.197" />
  </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const ChartBarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export const AcademicCapIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path d="M12 14l9-5-9-5-9 5 9 5z" />
    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
  </svg>
);

export const BuildingOfficeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.375M9 12h6.375m-6.375 5.25h6.375M5.25 9h13.5" />
    </svg>
);

export const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

export const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);

export const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

export const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />
    </svg>
);

export const CurrencyDollarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 11.21 12.75 11 12 11c-.75 0-1.536.21-2.121.659L9 12.318m0 0A3.001 3.001 0 006 15c0 1.657 1.343 3 3 3s3-1.343 3-3c0-.312-.045-.615-.128-.902m-9.128-1.5A2.992 2.992 0 004.5 9c0 1.657 1.343 3 3 3s3-1.343 3-3c0-.312-.045-.615-.128-.902m-9.128-1.5c.342.052.682.107 1.022.166m-1.022-.165a2.983 2.983 0 013.478-.397m7.5 0a2.983 2.983 0 013.478.397m-3.478-.397c-.34-.059-.68-.114-1.022-.165" />
    </svg>
);

export const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
);

export const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

export const UserCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

export const CreditCardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
);

export const BellIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);

export const TableCellsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h-1.5m1.5 0h1.5m-1.5 0v-1.5m17.25 0v-1.5m0 0h1.5m-1.5 0h-1.5m-17.25 0a1.125 1.125 0 01-1.125-1.125v-6.75c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125m-17.25 0h-1.5m1.5 0h1.5m-1.5 0v-6.75m17.25 0v-6.75m0 0h1.5m-1.5 0h-1.5m-14.25-3h11.25m-11.25 0a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125h11.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-11.25 0h-1.5m1.5 0h1.5m-1.5 0v-1.5m11.25 0v-1.5m0 0h1.5m-1.5 0h-1.5" />
    </svg>
);

// FIX: Corrected comment syntax from JSX-style to standard TypeScript comments for top-level code.
export const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

export const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);

export const KNRRLogoIcon: React.FC<{ className?: string; background?: 'transparent' | 'colored' }> = ({ className, background = 'colored' }) => (
    <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
         <style>
            {`.knrr-text { font-family: 'Arial', sans-serif; font-weight: bold; }`}
        </style>
        <circle cx="100" cy="100" r="98" fill={background === 'colored' ? 'white' : 'transparent'}/>
        <circle cx="100" cy="100" r="95" fill={background === 'colored' ? 'white' : 'transparent'} stroke="#d12727" strokeWidth="10"/>
        
        <circle cx="100" cy="100" r="88" fill="none" stroke="#0033a0" strokeWidth="2"/>
        <circle cx="100" cy="100" r="75" fill="none" stroke="#0033a0" strokeWidth="2"/>
        
        <path d="M90 70 L100 50 L110 70 L100 65 Z" fill="#0033a0" />
        <path d="M85 85 L100 65 L115 85 L100 80 Z" fill="#0033a0" />
        <path d="M80 100 L100 80 L120 100 L100 95 Z" fill="#0033a0" />

        <text x="100" y="140" className="knrr-text" fontSize="24" textAnchor="middle" fill="#0033a0">KNRR</text>
        <text x="100" y="168" className="knrr-text" fontSize="16" textAnchor="middle" fill="#0033a0">
             <tspan dx="-25" fontSize="20" dy="2">&#9733;</tspan> HYD <tspan dx="5" fontSize="20" dy="-2">&#9733;</tspan>
        </text>
        <path id="knrrPath" d="M 19,100 a 81,81 0 1,1 162,0" fill="none"/>
        <text className="knrr-text" fontSize="8.2" fill="#d12727">
            <textPath href="#knrrPath" startOffset="50%" textAnchor="middle" dy="1.5">
                KASIREDDY NARAYANREDDY COLLEGE OF ENGG & RESEARCH
            </textPath>
        </text>
    </svg>
);

export const BRILLogoIcon: React.FC<{ className?: string; background?: 'transparent' | 'colored' }> = ({ className, background = 'colored' }) => (
    <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="95" fill={background === 'colored' ? 'white' : 'transparent'} stroke="#d12727" strokeWidth="10"/>
        <circle cx="100" cy="100" r="75" fill="none" stroke="#0033a0" strokeWidth="2"/>
        <path d="M100 40 L130 90 L100 80 L70 90 Z" fill="#0033a0"/>
        <path d="M100 60 L140 110 L100 100 L60 110 Z" fill="#0033a0"/>
        <text x="100" y="140" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" textAnchor="middle" fill="#0033a0">BRIL</text>
        <text x="100" y="170" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle" fill="#0033a0">* HYD *</text>
        <path id="circlePathBril" d="M 30,100 a 70,70 0 1,1 140,0" fill="none"/>
        <text fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#d12727">
            <textPath href="#circlePathBril" startOffset="50%" textAnchor="middle">
                BRILLIANT GROUP OF TECHNICAL INSTITUTIONS
            </textPath>
        </text>
    </svg>
);

export const BRIGLogoIcon: React.FC<{ className?: string; background?: 'transparent' | 'colored' }> = ({ className, background = 'colored' }) => (
    <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="95" fill={background === 'colored' ? 'white' : 'transparent'} stroke="#d12727" strokeWidth="10"/>
        <circle cx="100" cy="100" r="75" fill="none" stroke="#0033a0" strokeWidth="2"/>
        <path d="M100 40 L130 90 L100 80 L70 90 Z" fill="#0033a0"/>
        <path d="M100 60 L140 110 L100 100 L60 110 Z" fill="#0033a0"/>
        <text x="100" y="140" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" textAnchor="middle" fill="#0033a0">BRIG</text>
        <text x="100" y="170" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle" fill="#0033a0">* HYD *</text>
        <path id="circlePathBrig" d="M 30,100 a 70,70 0 1,1 140,0" fill="none"/>
        <text fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#d12727">
            <textPath href="#circlePathBrig" startOffset="50%" textAnchor="middle">
                BRILLIANT GROUP OF TECHNICAL INSTITUTIONS
            </textPath>
        </text>
    </svg>
);

export const NAACLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
<svg
  className={className}
  viewBox="0 0 512 512"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <radialGradient id="goldGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#FFD700" />
      <stop offset="100%" stopColor="#B8860B" />
    </radialGradient>
    <radialGradient id="redGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#b71c1c" />
      <stop offset="100%" stopColor="#600000" />
    </radialGradient>
    <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#8B0000" />
      <stop offset="100%" stopColor="#600000" />
    </linearGradient>
  </defs>
  <g transform="translate(256,256)">
    {Array.from({ length: 40 }).map((_, i) => (
      <polygon
        key={i}
        points="0,-230 12,-190 -12,-190"
        fill="url(#goldGradient)"
        transform={`rotate(${i * 9})`}
      />
    ))}
  </g>
  <circle cx="256" cy="256" r="180" fill="url(#redGradient)" stroke="#800000" strokeWidth="4" />
  <circle cx="256" cy="256" r="80" fill="#fff" />
  <text
    x="256"
    y="272"
    textAnchor="middle"
    fontFamily="Arial, sans-serif"
    fontWeight="bold"
    fontSize="100"
    fill="#8B0000"
  >
    A+
  </text>
  <path id="topTextPath" d="M120,200 A150,150 0 0,1 392,200" fill="none" />
  <text
    fontFamily="Arial, sans-serif"
    fontSize="24"
    fontWeight="bold"
    fill="white"
    letterSpacing="1.5"
  >
    <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
      ACCREDITED WITH GRADE
    </textPath>
  </text>
  <path
    d="M120,340 Q256,420 392,340 L380,370 Q256,440 132,370 Z"
    fill="url(#ribbonGradient)"
    stroke="#4B0000"
    strokeWidth="3"
  />
  <text
    x="256"
    y="380"
    textAnchor="middle"
    fontFamily="Arial Black, sans-serif"
    fontWeight="bold"
    fontSize="50"
    fill="#FFD700"
    stroke="#000"
    strokeWidth="2"
  >
    NAAC
  </text>
</svg>
);

export const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
);

export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

export const ChevronUpDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
    </svg>
);

export const DocumentIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);