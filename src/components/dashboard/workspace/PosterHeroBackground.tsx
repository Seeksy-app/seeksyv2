import { motion } from "framer-motion";

// Poster placeholders with gradient backgrounds
const posterData = [
  { id: 1, gradient: "from-red-500 to-orange-500", title: "Studio" },
  { id: 2, gradient: "from-blue-500 to-cyan-500", title: "Podcasts" },
  { id: 3, gradient: "from-purple-500 to-pink-500", title: "Events" },
  { id: 4, gradient: "from-emerald-500 to-teal-500", title: "Clips" },
  { id: 5, gradient: "from-amber-500 to-yellow-500", title: "Meetings" },
  { id: 6, gradient: "from-indigo-500 to-violet-500", title: "Analytics" },
  { id: 7, gradient: "from-rose-500 to-red-500", title: "Identity" },
  { id: 8, gradient: "from-sky-500 to-blue-500", title: "Awards" },
];

export function PosterHeroBackground() {
  return (
    <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden rounded-2xl mb-6">
      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background z-10" />
      
      {/* Poster grid container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 transform -rotate-6 scale-110"
          style={{ 
            perspective: "1000px",
            transformStyle: "preserve-3d" 
          }}
        >
          {/* First row */}
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 -translate-y-4">
            {posterData.slice(0, 2).map((poster, idx) => (
              <PosterCard key={poster.id} poster={poster} delay={idx * 0.1} />
            ))}
          </div>
          
          {/* Second row */}
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 translate-y-2">
            {posterData.slice(2, 4).map((poster, idx) => (
              <PosterCard key={poster.id} poster={poster} delay={(idx + 2) * 0.1} />
            ))}
          </div>
          
          {/* Third row */}
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 -translate-y-6">
            {posterData.slice(4, 6).map((poster, idx) => (
              <PosterCard key={poster.id} poster={poster} delay={(idx + 4) * 0.1} />
            ))}
          </div>
          
          {/* Fourth row */}
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 translate-y-0">
            {posterData.slice(6, 8).map((poster, idx) => (
              <PosterCard key={poster.id} poster={poster} delay={(idx + 6) * 0.1} />
            ))}
          </div>
        </div>
      </div>
      
      {/* Center content overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
            Your Creator <span className="text-primary">Workspace</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Record. Create. Share. Monetize.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function PosterCard({ poster, delay }: { poster: typeof posterData[0]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={`
        w-16 sm:w-20 md:w-24 h-24 sm:h-28 md:h-32 
        rounded-lg overflow-hidden shadow-lg
        bg-gradient-to-br ${poster.gradient}
        flex items-end justify-center pb-2
        transform hover:scale-105 transition-transform duration-300
      `}
    >
      <span className="text-[8px] sm:text-[10px] font-semibold text-white/90 drop-shadow-sm">
        {poster.title}
      </span>
    </motion.div>
  );
}
