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
        {/* Thanksgiving banner only */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 via-amber-600 to-orange-500 text-white px-6 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2">
          🦃 Happy Thanksgiving! 🍂
        </div>
      </div>
    );
  }

  if (isChristmas) {
    return (
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Christmas banner only */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 via-green-600 to-red-600 text-white px-6 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2">
          🎅 Happy Holidays! 🎄
        </div>
      </div>
    );
  }

  return null;
};
