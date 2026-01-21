import { useState } from "react";
import { cn } from "@/lib/utils";
import { Delete, Check, Space } from "lucide-react";

interface VirtualKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

export function VirtualKeyboard({ value, onChange, onClose }: VirtualKeyboardProps) {
  const [isShift, setIsShift] = useState(false);
  const [isSymbols, setIsSymbols] = useState(false);

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
    const char = isShift ? key.toUpperCase() : key;
    onChange(value + char);
    if (isShift) setIsShift(false);
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
              onClick={() => setIsShift(!isShift)}
              className={cn(
                "w-12 h-11 rounded-lg font-bold text-lg transition-colors",
                isShift ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
              )}
            >
              ⇧
            </button>
          )}
          {row.map((key) => (
            <button
              key={key}
              onClick={() => handleKey(key)}
              className="w-9 h-11 bg-secondary hover:bg-secondary/80 rounded-lg font-mono text-lg transition-colors"
            >
              {isShift && !isSymbols ? key.toUpperCase() : key}
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
