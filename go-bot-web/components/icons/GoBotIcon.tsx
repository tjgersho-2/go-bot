interface GoBotIconProps {
    size?: number;
    className?: string;
    variant?: 'default' | 'happy' | 'code' | 'play' | 'lightning';
  }
  
  export function GoBotIcon({ size = 24, className = '', variant = 'default' }: GoBotIconProps) {
    
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
          <path d="M12 8V4H8"></path>
          <rect width="16" height="12" x="4" y="8" rx="2"></rect>
          <path d="M2 14h2"></path>
          <path d="M20 14h2"></path>
          <path d="M15 13v2"></path>
          <path d="M9 13v2"></path>
      </svg>
    );
  }