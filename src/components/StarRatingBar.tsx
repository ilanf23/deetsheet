import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface StarRatingBarProps {
  value: number | null;
  onChange: (value: number) => void;
}

const StarRatingBar = ({ value, onChange }: StarRatingBarProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const displayValue = hoverValue ?? value;
  const activeCircle = displayValue ? Math.round(displayValue) : null;

  const getValueFromClientX = useCallback((clientX: number): number => {
    if (!trackRef.current) return 1;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = 1 + ratio * 9;
    return Math.max(1, Math.min(10, Math.round(raw)));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      onChange(getValueFromClientX(e.clientX));
    },
    [getValueFromClientX, onChange]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const val = getValueFromClientX(e.clientX);
      if (isDragging) {
        onChange(val);
      } else {
        setHoverValue(val);
      }
    },
    [getValueFromClientX, isDragging, onChange]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (!isDragging) setHoverValue(null);
  }, [isDragging]);

  // Release drag if pointer goes global
  useEffect(() => {
    if (!isDragging) return;
    const up = () => setIsDragging(false);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, [isDragging]);

  const nudge = useCallback(
    (delta: number) => {
      const current = value ?? 5;
      const next = Math.max(1, Math.min(10, Math.round(current + delta)));
      onChange(next);
    },
    [value, onChange]
  );

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {/* Left arrow */}
      <button
        onClick={() => nudge(-1)}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Track with circles */}
      <div
        ref={trackRef}
        className="relative flex items-center flex-1 py-1 select-none touch-none cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        <div className="flex justify-between w-full pointer-events-none">
          {Array.from({ length: 10 }, (_, i) => {
            const num = i + 1;
            const isActive = activeCircle === num;
            return (
              <Star
                key={num}
                className={`transition-all duration-150 ${
                  isActive
                    ? "w-9 h-9 text-orange-500 drop-shadow-lg z-10"
                    : "w-7 h-7 text-orange-400"
                }`}
                fill="currentColor"
                strokeWidth={isActive ? 1.5 : 1}
              />
            );
          })}
        </div>
      </div>

      {/* Right arrow */}
      <button
        onClick={() => nudge(1)}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Current value */}
      {displayValue !== null && (
        <span className="text-sm font-bold text-orange-500 w-8 text-right tabular-nums shrink-0">
          {displayValue}
        </span>
      )}
    </div>
  );
};

export default StarRatingBar;
