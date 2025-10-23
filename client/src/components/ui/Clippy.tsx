import React from 'react';

interface ClippyProps {
  onClick: () => void;
  isAnimated?: boolean;
}

export const Clippy: React.FC<ClippyProps> = ({ onClick, isAnimated = false }) => {
  return (
    <button
      onClick={onClick}
      aria-label="Tutorial Assistant"
      className={`fixed bottom-4 right-4 z-50 bg-transparent border-none cursor-pointer p-0
                transition-transform hover:scale-110 active:scale-95
                ${isAnimated ? 'animate-bounce' : ''}`}
    >
      <img
        src="/images/clippy.png"
        alt="Clippy Tutorial Assistant"
        draggable="false"
        className="w-20 h-auto drop-shadow-lg"
      />
    </button>
  );
};
