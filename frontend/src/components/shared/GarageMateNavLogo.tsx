import React from 'react';

/**
 * GarageMate horizontal navbar logo.
 * Clean orange square icon with "G" + bold wordmark.
 * Designed to be legible at all navbar sizes.
 */
const GarageMateNavLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-3 select-none ${className}`}>
    {/* Orange square badge icon */}
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        background: '#f97316',
        borderRadius: '10px',
        flexShrink: 0,
      }}
    >
      {/* Location pin SVG — white, simple, clearly readable */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          fill="white"
        />
        <circle cx="12" cy="9" r="2.5" fill="#f97316" />
      </svg>
    </span>

    {/* Wordmark */}
    <span
      style={{
        fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
        fontWeight: 800,
        fontSize: '1.375rem',
        letterSpacing: '-0.03em',
        lineHeight: 1,
        color: 'white',
      }}
    >
      Garage<span style={{ color: '#f97316' }}>Mate</span>
    </span>
  </span>
);

export default GarageMateNavLogo;
