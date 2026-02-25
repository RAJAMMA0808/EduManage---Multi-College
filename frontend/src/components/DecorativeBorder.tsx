import React from 'react';

const DecorativeBorder: React.FC = () => {
  return (
    <svg
      className="w-full h-full"
      preserveAspectRatio="none"
      viewBox="0 0 210 297" // A4 aspect ratio
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <g id="corner-element">
          <path d="M0,20 L5,20 L5,5 L20,5 L20,0 L0,0 Z" fill="#CFD8DC" />
          <path d="M2,18 L6,18 L6,6 L18,6 L18,2 L2,2 Z" fill="#B0BEC5" />
        </g>
      </defs>

      {/* Main rectangle border */}
      <rect x="1" y="1" width="208" height="295" fill="none" stroke="#78909C" strokeWidth="0.5" />
      <rect x="3" y="3" width="204" height="289" fill="none" stroke="#90A4AE" strokeWidth="0.25" />

      {/* Corners */}
      <use href="#corner-element" x="0" y="0" />
      <use href="#corner-element" transform="translate(210, 0) scale(-1, 1)" />
      <use href="#corner-element" transform="translate(210, 297) scale(-1, -1)" />
      <use href="#corner-element" transform="translate(0, 297) scale(1, -1)" />
    </svg>
  );
};

export default DecorativeBorder;