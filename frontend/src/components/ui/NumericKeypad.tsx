import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Delete, Check, X } from 'lucide-react';

interface NumericKeypadProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  initialValue: number;
  label: string;
  unit: string;
}

export const NumericKeypad = ({
  isOpen,
  onClose,
  onConfirm,
  initialValue,
  label,
  unit,
}: NumericKeypadProps) => {
  const [inputValue, setInputValue] = useState(initialValue.toString());
  const [isFirstInput, setIsFirstInput] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue.toString());
      setIsFirstInput(true);
      // Select all text when opened
      setTimeout(() => {
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleKeyPress = (key: string) => {
    if (isFirstInput) {
      // First input replaces the entire value
      if (key === '.') {
        setInputValue('0.');
      } else {
        setInputValue(key);
      }
      setIsFirstInput(false);
    } else {
      // Subsequent inputs append
      if (key === '.' && inputValue.includes('.')) return;
      setInputValue(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    setIsFirstInput(false);
    setInputValue(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setInputValue('0');
    setIsFirstInput(true);
  };

  const handleConfirm = () => {
    const numValue = parseFloat(inputValue) || 0;
    onConfirm(numValue);
    onClose();
  };

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'C'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4 w-[300px] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display - single line with value and unit inside */}
        <div className="flex items-center bg-secondary/50 rounded-lg p-3 mb-3 border border-border">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            readOnly
            className={cn(
              "flex-1 text-2xl font-mono font-bold text-primary bg-transparent border-none outline-none text-center",
              isFirstInput && "bg-primary/10 rounded"
            )}
          />
          <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">{unit}</span>
        </div>

        {/* Keypad Grid - 4 columns */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <button onClick={() => handleKeyPress('7')} className="h-14 rounded-lg font-bold text-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95">7</button>
          <button onClick={() => handleKeyPress('8')} className="h-14 rounded-lg font-bold text-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95">8</button>
          <button onClick={() => handleKeyPress('9')} className="h-14 rounded-lg font-bold text-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95">9</button>
          <button onClick={handleBackspace} className="h-14 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95 flex items-center justify-center">
            <Delete className="w-5 h-5" />
          </button>
          
          {/* Row 2 */}
          <button onClick={() => handleKeyPress('4')} className="h-14 rounded-lg font-bold text-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95">4</button>
          <button onClick={() => handleKeyPress('5')} className="h-14 rounded-lg font-bold text-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95">5</button>
          <button onClick={() => handleKeyPress('6')} className="h-14 rounded-lg font-bold text-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95">6</button>
          <button onClick={handleClear} className="h-14 rounded-lg font-bold text-lg bg-warning/20 text-warning hover:bg-warning/30 border border-warning/30 transition-all active:scale-95">C</button>
          
          {/* Row 3 */}
          <button onClick={() => handleKeyPress('1')} className="h-14 rounded-lg font-bold text-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95">1</button>
          <button onClick={() => handleKeyPress('2')} className="h-14 rounded-lg font-bold text-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95">2</button>
          <button onClick={() => handleKeyPress('3')} className="h-14 rounded-lg font-bold text-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95">3</button>
          <button 
            onClick={handleConfirm} 
            className="h-[124px] rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all active:scale-95 flex flex-col items-center justify-center gap-1 row-span-2"
          >
            <Check className="w-6 h-6" />
            <span className="text-sm">Set</span>
          </button>
          
          {/* Row 4 */}
          <button onClick={() => handleKeyPress('.')} className="h-14 rounded-lg font-bold text-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95">.</button>
          <button onClick={() => handleKeyPress('0')} className="h-14 rounded-lg font-bold text-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95 col-span-2">0</button>
        </div>
      </div>
    </div>
  );
};
