import { useEffect, useState } from "react";

export const HolidayDecoration = () => {
  const isThanksgiving = new Date().getMonth() === 10; // November
  const isChristmas = new Date().getMonth() === 11; // December

  if (isThanksgiving) {
    return (
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Thanksgiving corner decorations */}
        <div className="absolute top-20 left-10 text-5xl opacity-80 animate-bounce" style={{ animationDuration: '4s' }}>🍂</div>
        <div className="absolute top-40 right-20 text-4xl opacity-70 animate-bounce" style={{ animationDelay: '1s', animationDuration: '5s' }}>🍁</div>
        <div className="absolute bottom-40 left-20 text-5xl opacity-75 animate-bounce" style={{ animationDelay: '2s', animationDuration: '4.5s' }}>🦃</div>
        <div className="absolute bottom-20 right-32 text-4xl opacity-80 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '5.5s' }}>🍂</div>
      </div>
    );
  }

  if (isChristmas) {
    return (
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Christmas corner decorations */}
        <div className="absolute top-10 left-10 text-5xl animate-pulse">🎄</div>
        <div className="absolute top-10 right-10 text-4xl animate-pulse" style={{ animationDelay: '1s' }}>⛄</div>
        <div className="absolute bottom-10 left-10 text-5xl animate-pulse" style={{ animationDelay: '2s' }}>🎅</div>
        <div className="absolute bottom-10 right-10 text-4xl animate-pulse" style={{ animationDelay: '0.5s' }}>🎁</div>
      </div>
    );
  }

  return null;
};
