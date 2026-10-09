import React from 'react';

interface GarageMateFullLogoProps {
  className?: string;
  height?: number;
}

/**
 * Full GarageMate Logo with Text
 * Complete logo with icon and text as shown in brand image
 */
const GarageMateFullLogo: React.FC<GarageMateFullLogoProps> = ({ 
  className = '', 
  height = 60 
}) => {
  return (
    <svg
      height={height}
      viewBox="0 0 500 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Logo Icon */}
      <g transform="translate(0, 0)">
        {/* Main wrench body - dark navy */}
        <path
          d="M100 160 C85 160 75 150 75 135 L75 100 C75 95 78 92 82 90 L70 78 C65 73 65 65 70 60 L75 55 C80 50 88 50 93 55 L105 67 L117 55 C122 50 130 50 135 55 L140 60 C145 65 145 73 140 78 L128 90 C132 92 135 95 135 100 L135 135 C135 150 125 160 110 160 L100 160 Z"
          fill="#1e3a5f"
        />
        
        {/* Car front view on wrench */}
        <g transform="translate(100, 70)">
          {/* Car body */}
          <path
            d="M-25 0 L-20 -15 C-18 -20 -12 -23 -5 -23 L5 -23 C12 -23 18 -20 20 -15 L25 0 L25 15 C25 18 22 20 20 20 L-20 20 C-22 20 -25 18 -25 15 Z"
            fill="#fff"
          />
          {/* Windshield */}
          <path
            d="M-18 -8 L-15 -18 C-14 -20 -10 -21 -5 -21 L5 -21 C10 -21 14 -20 15 -18 L18 -8 Z"
            fill="#1e3a5f"
            opacity="0.3"
          />
          {/* Headlights */}
          <circle cx="-15" cy="8" r="3" fill="#1e3a5f" />
          <circle cx="15" cy="8" r="3" fill="#1e3a5f" />
          {/* Grille */}
          <rect x="-8" y="12" width="16" height="2" fill="#1e3a5f" opacity="0.4" />
        </g>
        
        {/* Location pin outline around wrench */}
        <path
          d="M100 30 C70 30 50 50 50 80 C50 95 55 108 65 120 L100 170 L135 120 C145 108 150 95 150 80 C150 50 130 30 100 30 Z M100 45 C120 45 135 60 135 80 C135 92 130 103 122 112 L100 145 L78 112 C70 103 65 92 65 80 C65 60 80 45 100 45 Z"
          fill="#1e3a5f"
        />
        
        {/* Speed lines - orange */}
        <g opacity="0.9">
          <rect x="155" y="60" width="35" height="6" rx="3" fill="#f97316" />
          <rect x="160" y="75" width="30" height="6" rx="3" fill="#f97316" />
          <rect x="155" y="90" width="35" height="6" rx="3" fill="#f97316" />
        </g>
        
        {/* Shadow effect */}
        <ellipse cx="100" cy="175" rx="40" ry="5" fill="#1e3a5f" opacity="0.15" />
      </g>

      {/* Text: "Garage" in dark navy */}
      <text
        x="210"
        y="130"
        fontFamily="Space Grotesk, sans-serif"
        fontSize="70"
        fontWeight="800"
        fill="#1e3a5f"
        letterSpacing="-2"
      >
        Garage
      </text>

      {/* Text: "Mate" in orange */}
      <text
        x="395"
        y="130"
        fontFamily="Space Grotesk, sans-serif"
        fontSize="70"
        fontWeight="800"
        fill="#f97316"
        letterSpacing="-2"
      >
        Mate
      </text>
    </svg>
  );
};

export default GarageMateFullLogo;
