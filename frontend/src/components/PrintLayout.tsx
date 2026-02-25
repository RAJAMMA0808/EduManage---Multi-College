
import React from 'react';
import { Student, College, Faculty, Staff } from '../types';
import { COLLEGE_NAMES } from '../constants';
import { KNRRLogoIcon, BRILLogoIcon, BRIGLogoIcon, NAACLogoIcon } from './icons';

interface PrintLayoutProps {
  person: Student | Faculty | Staff;
  children: React.ReactNode;
  currentPage: number;
  totalPages: number;
  reportTitle: string;
  isLastPage?: boolean;
}

const CollegeLogo: React.FC<{ college: College; className?: string, background?: 'transparent' | 'colored' }> = ({ college, className, background }) => {
  switch (college) {
    case College.KNRR: return <KNRRLogoIcon className={className || "h-16 w-auto"} background={background} />;
    case College.BRIL: return <BRILLogoIcon className={className || "h-16 w-auto"} background={background} />;
    case College.BRIG: return <BRIGLogoIcon className={className || "h-16 w-auto"} background={background} />;
    default: return <div className={className || "h-16 w-16 bg-gray-200"} />;
  }
};

const PrintLayout: React.FC<PrintLayoutProps> = ({ person, children, currentPage, totalPages, isLastPage, reportTitle }) => {
  const collegeCode = 'collegeCode' in person ? person.collegeCode : College.ALL;

  return (
    <div className={`relative ${currentPage > 1 ? 'break-before-page' : ''}`}>
      {/* Watermark logo background (all pages) */}
      <div className="absolute inset-0 flex items-center justify-center z-0 opacity-[0.05]">
        <CollegeLogo college={collegeCode} className="h-96 w-96" background="transparent" />
      </div>

      <div className="relative z-10 flex flex-col" style={{ width: '100%', minHeight: '277mm' }}>
        <div className="pt-4 px-8 flex flex-col h-full">
          {/* Header - only first page */}
          {currentPage === 1 && (
            <header className="flex justify-between items-center border-b-2 border-black pb-2 mb-2 flex-shrink-0">
              <div className="w-24 flex-shrink-0">
                <CollegeLogo college={collegeCode} className="h-16 w-auto" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold uppercase">{COLLEGE_NAMES[collegeCode]}</h1>
                <h2 className="text-lg font-semibold">{reportTitle}</h2>
              </div>
              <div className="w-24 flex-shrink-0 flex justify-end">
                <NAACLogoIcon className="h-20 w-auto" />
              </div>
            </header>
          )}

          {/* Content */}
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          
          <footer className="pt-2 text-[10px] mt-auto flex justify-between items-center border-t-2 border-black flex-shrink-0">
              <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
              <span className="font-semibold">Page {currentPage} of {totalPages}</span>
              {isLastPage && <div className="font-bold">Signature of Principal</div>}
          </footer>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;
