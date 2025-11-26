import { useEffect, useState } from "react";

export const HolidayDecoration = () => {
  const [snowflakes, setSnowflakes] = useState<number[]>([]);
  const isThanksgiving = new Date().getMonth() === 10; // November
  const isChristmas = new Date().getMonth() === 11; // December

  useEffect(() => {
    if (isChristmas) {
      // Generate random snowflakes
      setSnowflakes(Array.from({ length: 15 }, (_, i) => i));
    }
  }, [isChristmas]);

  if (isThanksgiving) {
    return (
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Thanksgiving decorations */}
        <div className="absolute top-10 left-10 text-4xl animate-bounce" style={{ animationDuration: '4s' }}>🦃</div>
        <div className="absolute top-20 right-20 text-3xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '5s' }}>🍂</div>
        <div className="absolute bottom-32 left-1/4 text-4xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '4.5s' }}>🍁</div>
        <div className="absolute top-1/3 right-10 text-3xl animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '5.5s' }}>🌽</div>
        <div className="absolute bottom-20 right-1/3 text-4xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4s' }}>🥧</div>
        <div className="absolute top-1/2 left-10 text-3xl animate-bounce" style={{ animationDelay: '3s', animationDuration: '5s' }}>🍂</div>
        
        {/* Thanksgiving banner */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 via-amber-600 to-orange-500 text-white px-6 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2">
          🦃 Happy Thanksgiving! 🍂
        </div>
      </div>
    );
  }

  if (isChristmas) {
    return (
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Snowflakes */}
        {snowflakes.map((i) => (
          <div
            key={i}
            className="absolute text-2xl animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-20px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          >
            ❄️
          </div>
        ))}
        
        {/* Christmas decorations */}
        <div className="absolute top-10 right-10 text-5xl animate-pulse">🎄</div>
        <div className="absolute bottom-20 left-10 text-4xl animate-bounce" style={{ animationDuration: '3s' }}>⛄</div>
        <div className="absolute top-1/3 left-20 text-4xl animate-pulse" style={{ animationDelay: '1s' }}>🎅</div>
        <div className="absolute bottom-32 right-20 text-4xl animate-pulse" style={{ animationDelay: '2s' }}>🎁</div>
        
        {/* Christmas banner */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 via-green-600 to-red-600 text-white px-6 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 animate-pulse">
          🎅 Happy Holidays! 🎄
        </div>
      </div>
    );
  }

  return null;
};
