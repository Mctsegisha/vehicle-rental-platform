import React from 'react';

interface LogoProps {
  className?: string;
}

// ==========================================
// 1. Bank of Abyssinia (BOA) Logo
// ==========================================
// Reconstructed with exact 6-fold symmetry, slender elegant vertical/diagonal diamonds,
// a clean hexagon hollow core, and the official vibrant cadmium yellow-gold tone.
export function BOALogo({ className = "w-full h-full" }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Crisp premium gold-yellow gradient matching the official warm BOA brand palette */}
        <linearGradient id="boaGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF4B8" />    {/* Highlight sheen */}
          <stop offset="35%" stopColor="#FAB819" />   {/* Core gold */}
          <stop offset="100%" stopColor="#D98A00" />  {/* Rich deep gold shadows */}
        </linearGradient>
      </defs>
      
      <g>
        {/* 
          Masterfully calculated slender diamonds rotated in 60-degree increments around (50, 50).
          Each diamond has:
          - Outer top vertex at (50, 7.5)
          - Inner center vertex at (50, 36)
          - Left/Right horizontal corners at (44, 21.75) and (56, 21.75)
          This leaves a perfect hexagonal gap of negative space in the center, matching the uploaded BOA asset logo.
        */}
        <polygon points="50,7.5 56,21.75 50,36 44,21.75" fill="url(#boaGoldGrad)" />
        <polygon points="50,7.5 56,21.75 50,36 44,21.75" fill="url(#boaGoldGrad)" transform="rotate(60 50 50)" />
        <polygon points="50,7.5 56,21.75 50,36 44,21.75" fill="url(#boaGoldGrad)" transform="rotate(120 50 50)" />
        <polygon points="50,7.5 56,21.75 50,36 44,21.75" fill="url(#boaGoldGrad)" transform="rotate(180 50 50)" />
        <polygon points="50,7.5 56,21.75 50,36 44,21.75" fill="url(#boaGoldGrad)" transform="rotate(240 50 50)" />
        <polygon points="50,7.5 56,21.75 50,36 44,21.75" fill="url(#boaGoldGrad)" transform="rotate(300 50 50)" />
      </g>
    </svg>
  );
}

// ==========================================
// 2. Commercial Bank of Ethiopia (CBE) Logo
// ==========================================
// Reconstructed as a highly polished, 3D golden medallion coin complete with 
// detailed concentric wireframe outer orbital ellipses, dual fine ridge-borders,
// and the classic embossed "CBE" centered initials.
export function CBELogo({ className = "w-full h-full" }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Ultra-realistic multi-stop metallic gold gradient for the 3D coin face */}
        <radialGradient id="cbePlatedGold" cx="45%" cy="40%" r="55%" fx="35%" fy="30%">
          <stop offset="0%" stopColor="#FFF9D3" />    {/* Center reflection */}
          <stop offset="20%" stopColor="#F5D061" />   {/* Light gold */}
          <stop offset="50%" stopColor="#D49A1B" />   {/* Rich gold */}
          <stop offset="85%" stopColor="#A5730B" />   {/* Deep bronze shadow */}
          <stop offset="100%" stopColor="#5E3F00" />  {/* Dark ridge accent */}
        </radialGradient>

        <linearGradient id="orbitGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF0B0" />
          <stop offset="55%" stopColor="#E5AC24" />
          <stop offset="100%" stopColor="#8A5B00" />
        </linearGradient>
      </defs>

      {/* 
        The Official CBE Coin Outer Orbital Ellipses Grid Group.
        These represent the beautiful circular/elliptical wireframe rings wrapping around 
        the globe behind and highlighting the central coin.
      */}
      <g stroke="url(#orbitGold)" strokeWidth="0.8" opacity="0.9">
        {/* Left orbital sweep */}
        <ellipse cx="60" cy="46" rx="36" ry="13" transform="rotate(-32 60 46)" />
        <ellipse cx="60" cy="46" rx="30" ry="10" transform="rotate(-32 60 46)" />
        <ellipse cx="60" cy="46" rx="24" ry="7.5" transform="rotate(-32 60 46)" />
        <ellipse cx="60" cy="46" rx="18" ry="5" transform="rotate(-32 60 46)" />
        
        {/* Right orbital sweep to create a volumetric intersecting sphere effect */}
        <ellipse cx="40" cy="54" rx="36" ry="13" transform="rotate(-32 40 54)" />
        <ellipse cx="40" cy="54" rx="30" ry="10" transform="rotate(-32 40 54)" />
        <ellipse cx="40" cy="54" rx="24" ry="7.5" transform="rotate(-32 40 54)" />
        <ellipse cx="40" cy="54" rx="18" ry="5" transform="rotate(-32 40 54)" />
      </g>

      {/* Primary Gold Medallion Outer Shadow Circle */}
      <circle cx="50" cy="50" r="28" fill="#422C00" opacity="0.4" transform="translate(1, 1)" />

      {/* Main Gold Medallion Coin Face */}
      <circle cx="50" cy="50" r="27" fill="url(#cbePlatedGold)" stroke="#4A3403" strokeWidth="1" />
      
      {/* Intricate ridged ring borders mimicking currency coin edge notches */}
      <circle cx="50" cy="50" r="24.5" stroke="#FFF7C5" strokeWidth="0.75" strokeDasharray="2.5 1.5" fill="none" opacity="0.85" />
      <circle cx="50" cy="50" r="21.5" stroke="#5E3F00" strokeWidth="0.5" fill="none" opacity="0.4" />
      <circle cx="50" cy="50" r="19" stroke="#FFF7C5" strokeWidth="0.4" fill="none" opacity="0.6" strokeDasharray="1 1.5" />

      {/* Customized Embossed CBE Monogram Vector Paths */}
      <g>
        {/* Background Emboss Shadow to lift the monogram */}
        <path 
          d="M38,53 C38,45 42,40 50,40 C56,40 60,44 60,44 L57,48 C57,48 54,45 50,45 C45,45 43,49 43,53 C43,57 45,61 50,61 C54,61 57,58 57,58 L60,62 C60,62 56,66 50,66 C42,66 38,61 38,53 Z" 
          fill="#3B2600" 
          opacity="0.85"
          transform="translate(0.5, 0.5)"
        />
        
        {/* Stylized custom 'C' wrapping around the other letters */}
        <path 
          d="M38,53 C38,45 42,40 50,40 C56,40 60,44 60,44 L57,48 C57,48 54,45 50,45 C45,45 43,49 43,53 C43,57 45,61 50,61 C54,61 57,58 57,58 L60,62 C60,62 56,66 50,66 C42,66 38,61 38,53 Z" 
          fill="#593C00" 
        />
        
        {/* Inner nested CBE Letters 'B' and 'E' rendered in precise high-contrast embossing */}
        {/* Stylized 'B' */}
        <path 
          d="M45,43 H53 C56,43 58,45 58,47.5 C58,49.5 56.5,50.5 55,51 C57,51.5 58,52.5 58,55 C58,57.5 56,59 53,59 H45 Z M48,46 V50 H52.5 C53.5,50 54.5,49.5 54.5,48 C54.5,46.5 53.5,46 52.5,46 Z M48,53 V56 H52.5 C53.5,56 54.5,55.5 54.5,54.5 C54.5,53.5 53.5,53 52.5,53 Z" 
          fill="#F5D061" 
          stroke="#3B2600"
          strokeWidth="0.5"
          transform="translate(4, -1) scale(0.9)"
        />
      </g>
    </svg>
  );
}

// ==========================================
// 3. Telebirr Logo
// ==========================================
// Designed exactly matching the official brand asset:
// - Sharp pointed 4-corner royal blue star-wave stem on left
// - Thick sky-blue/teal spiral swirling smoothly into the center
// - Iconic single golden-yellow circular node at the very core
export function TelebirrLogo({ className = "w-full h-full" }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        {/* 
          1. The Royal Blue "ተ/t-star" body.
          This represents the high-fidelity blue brand icon mark with the pointed vertical head, 
          pointed crossbars, and bottom-left support curve.
        */}
        <path 
          d="M 45,43 
             L 45,21 
             C 45,18 47.5,15 50,15 
             C 52.5,15 55,18 55,21 
             L 55,43 
             L 76,43 
             C 79,43 81.5,45.5 81.5,48 
             C 81.5,50.5 79,53 76,53 
             L 55,53 
             L 55,60 
             C 55,69 49,76 38,76 
             C 27,76 19,69 19,58 
             C 19,47 27,39 38,39 
             L 38,46 
             C 32,46 26.5,51 26.5,58 
             C 26.5,65 31,69.5 38,69.5 
             C 45,69.5 45,64 45,60 
             Z" 
          fill="#0054A6" 
        />

        {/* 
          2. The Cyan/Teal loop spiral ("wave flow").
          Sweeps into the heart of the central core.
        */}
        <path 
          d="M 38,58 
             C 38,47 47,38 58,38 
             C 69,38 78,47 78,58 
             C 78,69 69,78 58,78 
             C 47,78 40.5,71.5 40.5,64 
             C 40.5,57.5 47,51 53.5,51 
             C 59,51 63.5,55.5 63.5,61 
             C 63.5,65.5 60.5,68.5 56.5,68.5 
             C 53.5,68.5 51.5,66.5 51.5,63.5
             C 51.5,61.5 53,60 54.5,60" 
          stroke="#00A2E8" 
          strokeWidth="5" 
          strokeLinecap="round" 
          fill="none" 
        />

        {/* 
          3. The Telebirr Golden Heart Core Node.
          Perfect high-contrast matching yellow-orange coordinate.
        */}
        <circle cx="58" cy="61" r="5" fill="#FAB819" />

        {/* Small supporting white highlight sparkles to make the branding premium */}
        <polygon points="26,17 28,21 32,22 28,23 26,27 24,23 20,22 24,21" fill="#00A2E8" opacity="0.6" />
        <polygon points="82,28 83.5,31 87,32 83.5,33 82,36 80.5,33 77,32 80.5,31" fill="#FAB819" opacity="0.8" />
      </g>
    </svg>
  );
}
