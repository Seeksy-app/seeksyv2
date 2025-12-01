import sparkGarland from "@/assets/spark-garland.png";

export const FloatingSparkButton = () => {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event('openSparkChat'))}
      className="fixed bottom-6 right-6 z-50 transition-all duration-300 hover:scale-110 animate-in fade-in slide-in-from-bottom-4 bg-transparent border-none p-0 cursor-pointer"
      aria-label="Ask Spark"
      style={{ 
        background: 'transparent',
        border: 'none',
        padding: 0,
      }}
    >
      <img 
        src={sparkGarland} 
        alt="Spark with Garland" 
        className="w-20 h-20 object-contain"
        style={{ background: 'transparent' }}
      />
    </button>
  );
};
