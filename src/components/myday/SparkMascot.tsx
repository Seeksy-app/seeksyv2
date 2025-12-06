import { cn } from "@/lib/utils";

interface SparkMascotProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export function SparkMascot({ className, size = "md", animate = true }: SparkMascotProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        "relative flex items-center justify-center",
        animate && "group",
        className
      )}
    >
      {/* Glow effect on hover */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/50 to-orange-500/50 blur-md opacity-0 transition-opacity duration-300",
          animate && "group-hover:opacity-100"
        )}
      />
      
      {/* Main mascot SVG */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={cn(
          "relative z-10 w-full h-full transition-transform duration-300",
          animate && "group-hover:scale-110 group-hover:rotate-3"
        )}
      >
        {/* Body - Friendly rounded star shape */}
        <path
          d="M24 4L28.5 16.5L42 18L31.5 27L34 40L24 33L14 40L16.5 27L6 18L19.5 16.5L24 4Z"
          fill="url(#sparkGradient)"
          stroke="#F59E0B"
          strokeWidth="1.5"
          className={cn(
            animate && "group-hover:stroke-amber-400"
          )}
        />
        
        {/* Face - Eyes */}
        <circle cx="19" cy="22" r="2.5" fill="#1E293B" />
        <circle cx="29" cy="22" r="2.5" fill="#1E293B" />
        
        {/* Eye shine */}
        <circle cx="18" cy="21" r="1" fill="white" />
        <circle cx="28" cy="21" r="1" fill="white" />
        
        {/* Smile */}
        <path
          d="M20 28C20 28 22 31 24 31C26 31 28 28 28 28"
          stroke="#1E293B"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Rosy cheeks */}
        <circle cx="16" cy="26" r="2" fill="#FCA5A5" opacity="0.6" />
        <circle cx="32" cy="26" r="2" fill="#FCA5A5" opacity="0.6" />
        
        {/* Sparkle accents */}
        <path d="M8 8L9 11L12 12L9 13L8 16L7 13L4 12L7 11L8 8Z" fill="#FBBF24" />
        <path d="M40 6L41 8L43 9L41 10L40 12L39 10L37 9L39 8L40 6Z" fill="#FBBF24" />
        <path d="M44 28L45 30L47 31L45 32L44 34L43 32L41 31L43 30L44 28Z" fill="#FBBF24" opacity="0.7" />
        
        <defs>
          <linearGradient id="sparkGradient" x1="24" y1="4" x2="24" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE047" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
