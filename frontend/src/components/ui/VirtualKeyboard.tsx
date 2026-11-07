import { useState, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";
import { Delete, Check, Space } from "lucide-react";

interface VirtualKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

export function VirtualKeyboard({ value, onChange, onClose }: VirtualKeyboardProps) {
  // Shift works like a phone keyboard: one tap = next letter uppercase;
  // double-tap (within 600 ms) OR long-press (500 ms) = Caps Lock until tapped again.
  // Uses pointerdown (not click) so touch panels register both taps immediately.
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);
  const [isSymbols, setIsSymbols] = useState(false);
  const lastShiftTap = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdFired = useRef(false);
  const upper = isShift || isCaps;

  const clearHold = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  };

  const handleShiftDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    holdFired.current = false;
    const now = Date.now();
    if (isCaps) {
      setIsCaps(false);
      setIsShift(false);
      lastShiftTap.current = 0;
      return;
    }
    if (now - lastShiftTap.current < 600) {
      setIsCaps(true);
      setIsShift(false);
      lastShiftTap.current = 0;
      return;
    }
    lastShiftTap.current = now;
    setIsShift(!isShift);
    clearHold();
    holdTimer.current = setTimeout(() => {
      holdFired.current = true;
      setIsCaps(true);
      setIsShift(false);
      lastShiftTap.current = 0;
    }, 500);
  };

  const handleShiftUp = () => clearHold();

  const letters = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"]
  ];

  const symbols = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["@", "#", "$", "%", "&", "*", "-", "+", "(", ")"],
    ["!", "_", "=", ":", ";", "/", "?", ",", "."]
  ];

  const handleKey = (key: string) => {
    const char = upper ? key.toUpperCase() : key;
    onChange(value + char);
    if (isShift && !isCaps) setIsShift(false);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleSpace = () => {
    onChange(value + " ");
  };

  const currentKeys = isSymbols ? symbols : letters;

  return (
    <div className="bg-secondary/30 rounded-lg p-2 space-y-1.5 border">
      {currentKeys.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1">
          {rowIndex === 2 && !isSymbols && (
            <button
              onPointerDown={handleShiftDown}
              onPointerUp={handleShiftUp}
              onPointerCancel={handleShiftUp}
              onPointerLeave={handleShiftUp}
              onContextMenu={(e) => e.preventDefault()}
              title="Tap: capital letter · Double-tap or hold: Caps Lock"
              style={{ touchAction: 'manipulation', userSelect: 'none', WebkitUserSelect: 'none' }}
              className={cn(
                "w-12 h-11 rounded-lg font-bold text-lg transition-colors",
                isCaps
                  ? "bg-primary text-primary-foreground ring-2 ring-primary-foreground/60 underline underline-offset-4"
                  : isShift
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              )}
            >
              {isCaps ? "⇪" : "⇧"}
            </button>
          )}
          {row.map((key) => (
            <button
              key={key}
              onClick={() => handleKey(key)}
              className="w-9 h-11 bg-secondary hover:bg-secondary/80 rounded-lg font-mono text-lg transition-colors"
            >
              {upper && !isSymbols ? key.toUpperCase() : key}
            </button>
          ))}
          {rowIndex === 2 && (
            <button
              onClick={handleBackspace}
              className="w-12 h-11 bg-destructive/20 hover:bg-destructive/30 rounded-lg transition-colors flex items-center justify-center"
            >
              <Delete className="w-5 h-5" />
            </button>
          )}
        </div>
      ))}
      <div className="flex justify-center gap-1">
        <button
          onClick={() => setIsSymbols(!isSymbols)}
          className={cn(
            "w-14 h-11 rounded-lg font-bold text-sm transition-colors",
            isSymbols ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
          )}
        >
          {isSymbols ? "ABC" : "123"}
        </button>
        <button
          onClick={handleSpace}
          className="flex-1 h-11 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
        >
          space
        </button>
        <button
          onClick={onClose}
          className="w-14 h-11 bg-success hover:bg-success/80 rounded-lg transition-colors flex items-center justify-center"
        >
          <Check className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
