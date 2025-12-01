import sparkGarland from "@/assets/spark-garland.png";

export const FloatingSparkButton = () => {
  return (
    <div
      id="seeksy-chat-trigger"
      onClick={() => window.dispatchEvent(new Event('openSparkChat'))}
      className="fixed bottom-6 right-6 cursor-pointer transition-transform duration-200 hover:scale-105"
      style={{ zIndex: 99999 }}
      aria-label="Ask Spark"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          window.dispatchEvent(new Event('openSparkChat'));
        }
      }}
    >
      <img 
        src={sparkGarland} 
        alt="Spark assistant" 
        className="block"
        style={{ 
          width: '64px',
          height: 'auto',
          display: 'block'
        }}
      />
    </div>
  );
};
