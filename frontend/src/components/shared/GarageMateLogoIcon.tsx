import React from 'react';

interface GarageMateLogoIconProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

/**
 * GarageMate Logo - Vertical Layout
 * Orange location pin with blue car inside
 * Text positioned BELOW the icon
 */
const GarageMateLogoIcon: React.FC<GarageMateLogoIconProps> = ({ 
  className = '', 
  size = 60,
  showText = true
}) => {
  return (
    <svg
      width={size * 1.8}
      height={showText ? size * 2 : size}
      viewBox={showText ? "0 0 180 200" : "0 0 180 100"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Location Pin - ORANGE #f97316 */}
      <path
        d="M90 5 C60 5 35 30 35 60 C35 80 45 97 60 110 L90 145 L120 110 C135 97 145 80 145 60 C145 30 120 5 90 5 Z"
        fill="#f97316"
        stroke="#f97316"
        strokeWidth="2"
      />
      
      {/* White circle background for car */}
      <circle cx="90" cy="55" r="32" fill="white" />
      
      {/* Small Car Icon - DARK BLUE #1e3a5f */}
      <g transform="translate(90, 55)">
        {/* Car body */}
        <path
          d="M-16 2 L-13 -8 C-12 -11 -8 -13 -4 -13 L4 -13 C8 -13 12 -11 13 -8 L16 2 L16 10 C16 12 14 13 13 13 L-13 13 C-14 13 -16 12 -16 10 Z"
          fill="#1e3a5f"
        />
        {/* Windshield */}
        <path
          d="M-11 -2 L-9 -9 C-8.5 -10.5 -5 -11.5 -3 -11.5 L3 -11.5 C5 -11.5 8.5 -10.5 9 -9 L11 -2 Z"
          fill="#334e68"
        />
        {/* Headlights */}
        <circle cx="-10" cy="7" r="2" fill="white" />
        <circle cx="10" cy="7" r="2" fill="white" />
        {/* Wheels */}
        <circle cx="-8" cy="13" r="3" fill="#1e3a5f" />
        <circle cx="8" cy="13" r="3" fill="#1e3a5f" />
      </g>
      
      {/* Subtle shadow */}
      <ellipse cx="90" cy="147" rx="25" ry="3" fill="#000" opacity="0.15" />
      
      {/* Text BELOW logo */}
      {showText && (
        <text
          x="90"
          y="175"
          fontFamily="Space Grotesk, Inter, sans-serif"
          fontSize="32"
          fontWeight="800"
          fill="#f97316"
          textAnchor="middle"
          letterSpacing="-0.5"
        >
          GarageMate
        </text>
      )}
    </svg>
  );
};

export default GarageMateLogoIcon;
