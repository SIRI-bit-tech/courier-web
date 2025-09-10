

interface SwiftCourierLogoProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

export const SwiftCourierLogo: React.FC<SwiftCourierLogoProps> = ({ 
  className = "", 
  size = "medium" 
}) => {
  const sizeMap = {
    small: { width: 200, height: 70, fontSize: { main: 16, sub: 14, tag: 8 } },
    medium: { width: 300, height: 100, fontSize: { main: 24, sub: 20, tag: 10 } },
    large: { width: 400, height: 130, fontSize: { main: 32, sub: 26, tag: 12 } }
  };

  const { width, height, fontSize } = sizeMap[size];

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="swiftcourier-title"
    >
      <title id="swiftcourier-title">SwiftCourier - Professional Delivery Services</title>
      
      <defs>
        {/* Bird Gradient */}
        <linearGradient id="birdGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity={1} />
          <stop offset="100%" stopColor="#FFA500" stopOpacity={1} />
        </linearGradient>
        
        {/* Shadow Filter */}
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.2)"/>
        </filter>
        
        {/* Glow Effect */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Swift Bird Design */}
      <g transform={`translate(${width * 0.07}, ${height * 0.2})`}>
        {/* Bird Body (streamlined for speed) */}
        <ellipse 
          cx="30" 
          cy="30" 
          rx="18" 
          ry="12" 
          fill="url(#birdGradient)" 
          filter="url(#shadow)"
        />
        
        {/* Bird Head */}
        <ellipse 
          cx="18" 
          cy="25" 
          rx="10" 
          ry="8" 
          fill="url(#birdGradient)" 
          filter="url(#shadow)"
        />
        
        {/* Sharp Beak (aerodynamic) */}
        <polygon 
          points="8,25 2,23 4,27" 
          fill="#FF6B35"
        />
        
        {/* Eye (alert and focused) */}
        <circle cx="15" cy="22" r="2.5" fill="white"/>
        <circle cx="16" cy="21.5" r="1.5" fill="#333"/>
        <circle cx="16.5" cy="21" r="0.5" fill="white"/>
        
        {/* Dynamic Wings */}
        <g>
          {/* Upper Wing (swept back for speed) */}
          <path 
            d="M25,18 Q45,8 65,15 Q55,25 35,28 Q28,22 25,18 Z" 
            fill="url(#birdGradient)" 
            opacity="0.9"
          />
          
          {/* Lower Wing (power stroke) */}
          <path 
            d="M28,32 Q48,42 68,35 Q58,28 38,30 Q30,31 28,32 Z" 
            fill="url(#birdGradient)" 
            opacity="0.7"
          />
          
          {/* Wing Feather Details */}
          <g stroke="#FFB84D" strokeWidth="1" opacity="0.6" fill="none">
            <path d="M30,20 Q40,16 50,18"/>
            <path d="M32,22 Q42,18 52,20"/>
            <path d="M34,24 Q44,20 54,22"/>
            <path d="M30,34 Q40,38 50,36"/>
            <path d="M32,32 Q42,36 52,34"/>
          </g>
        </g>
        
        {/* Tail (swept back aerodynamics) */}
        <path 
          d="M46,30 Q60,22 72,28 Q65,38 48,35 Q46,32 46,30 Z" 
          fill="url(#birdGradient)" 
          opacity="0.8"
        />
        
        {/* Speed Lines (motion effect) */}
        <g stroke="#FFD700" strokeWidth="2" opacity="0.4">
          <line x1="70" y1="20" x2="85" y2="18"/>
          <line x1="72" y1="25" x2="90" y2="25"/>
          <line x1="70" y1="30" x2="85" y2="32"/>
          <line x1="68" y1="35" x2="83" y2="37"/>
        </g>
        
        {/* Additional speed streaks */}
        <g stroke="#FFA500" strokeWidth="1" opacity="0.3">
          <line x1="75" y1="22" x2="88" y2="20"/>
          <line x1="77" y1="28" x2="92" y2="28"/>
          <line x1="75" y1="33" x2="88" y2="35"/>
        </g>
      </g>
      
      {/* Company Name */}
      <g transform={`translate(${width * 0.43}, ${height * 0.35})`}>
        {/* "SWIFT" Text */}
        <text 
          x="0" 
          y="0" 
          fontFamily="system-ui, -apple-system, Arial, sans-serif" 
          fontSize={fontSize.main} 
          fontWeight="bold" 
          fill="#2D3748"
        >
          SWIFT
        </text>
        
        {/* "COURIER" Text */}
        <text 
          x="0" 
          y={fontSize.sub + 5} 
          fontFamily="system-ui, -apple-system, Arial, sans-serif" 
          fontSize={fontSize.sub} 
          fontWeight="600" 
          fill="#4A5568"
        >
          COURIER
        </text>
        
        {/* Tagline */}
        <text 
          x="0" 
          y={fontSize.sub + fontSize.tag + 12} 
          fontFamily="system-ui, -apple-system, Arial, sans-serif" 
          fontSize={fontSize.tag} 
          fill="#718096"
        >
          DELIVERY SERVICES
        </text>
      </g>
      
      {/* Decorative Elements */}
      <g transform={`translate(${width * 0.83}, ${height * 0.5})`}>
        <circle cx="0" cy="0" r="3" fill="#FFD700" opacity="0.6"/>
        <circle cx="10" cy="-5" r="2" fill="#FFA500" opacity="0.4"/>
        <circle cx="15" cy="5" r="1.5" fill="#FFD700" opacity="0.3"/>
      </g>
    </svg>
  );
};

export default SwiftCourierLogo;