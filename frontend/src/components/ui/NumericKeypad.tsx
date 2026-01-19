import { useState, useEffect, useCallback } from 'react';
import { X, Delete, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumericKeypadProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  initialValue?: string;
  title?: string;
  min?: number;
  max?: number;
  unit?: string;
}

export const NumericKeypad = ({
  isOpen,
  onClose,
  onConfirm,
  initialValue = '',
  title = 'Enter Value',
  min,
  max,
  unit = '',
}: NumericKeypadProps) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');

  // Reset value when opened
  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setError('');
    }
  }, [isOpen, initialValue]);

  const handleKeyPress = useCallback((key: string) => {
    setError('');

    if (key === 'backspace') {
      setValue(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setValue('');
    } else if (key === '.') {
      // Only allow one decimal point
      if (!value.includes('.')) {
        setValue(prev => prev + '.');
      }
    } else if (key === '-') {
      // Toggle negative sign
      if (value.startsWith('-')) {
        setValue(prev => prev.slice(1));
      } else {
        setValue(prev => '-' + prev);
      }
    } else {
      setValue(prev => prev + key);
    }
  }, [value]);

  const handleConfirm = useCallback(() => {
    const numValue = parseFloat(value);

    if (value === '' || value === '-' || value === '.') {
      setError('Please enter a valid number');
      return;
    }

    if (isNaN(numValue)) {
      setError('Invalid number');
      return;
    }

    if (min !== undefined && numValue < min) {
      setError(`Minimum: ${min}`);
      return;
    }

    if (max !== undefined && numValue > max) {
      setError(`Maximum: ${max}`);
      return;
    }

    onConfirm(value);
    onClose();
  }, [value, min, max, onConfirm, onClose]);

  if (!isOpen) return null;

  const keypadButtons = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['.', '0', 'backspace'],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Keypad Modal */}
      <div className="relative bg-card border-2 border-border rounded-2xl shadow-2xl p-4 w-[340px] max-w-[95vw] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display */}
        <div className="mb-4">
          <div className={cn(
            "bg-secondary/50 border-2 rounded-xl p-4 text-center",
            error ? "border-destructive" : "border-border"
          )}>
            <span className="text-3xl font-mono font-bold text-foreground">
              {value || '0'}
            </span>
            {unit && (
              <span className="text-lg text-muted-foreground ml-2">{unit}</span>
            )}
          </div>

          {/* Min/Max hint */}
          {(min !== undefined || max !== undefined) && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {min !== undefined && `Min: ${min}`}
              {min !== undefined && max !== undefined && ' | '}
              {max !== undefined && `Max: ${max}`}
              {unit && ` ${unit}`}
            </p>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive text-center mt-2 font-medium">
              {error}
            </p>
          )}
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {keypadButtons.map((row, rowIndex) => (
            row.map((key, keyIndex) => (
              <button
                key={`${rowIndex}-${keyIndex}`}
                onClick={() => handleKeyPress(key)}
                className={cn(
                  "h-16 rounded-xl font-bold text-xl transition-all duration-100",
                  "active:scale-95 touch-none select-none",
                  key === 'backspace'
                    ? "bg-warning/20 text-warning hover:bg-warning/30 flex items-center justify-center"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                )}
              >
                {key === 'backspace' ? <Delete className="w-6 h-6" /> : key}
              </button>
            ))
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleKeyPress('clear')}
            className={cn(
              "h-14 rounded-xl font-bold text-base transition-all duration-100",
              "active:scale-95 touch-none select-none",
              "bg-destructive/20 text-destructive hover:bg-destructive/30"
            )}
          >
            CLEAR
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              "h-14 rounded-xl font-bold text-base transition-all duration-100",
              "active:scale-95 touch-none select-none flex items-center justify-center gap-2",
              "bg-success text-success-foreground hover:bg-success/90"
            )}
          >
            <Check className="w-5 h-5" />
            SET
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for using numeric keypad with any input
export const useNumericKeypad = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    initialValue: string;
    title: string;
    min?: number;
    max?: number;
    unit?: string;
    onConfirm: (value: string) => void;
  }>({
    initialValue: '',
    title: 'Enter Value',
    onConfirm: () => {},
  });

  const openKeypad = useCallback((options: {
    initialValue?: string;
    title?: string;
    min?: number;
    max?: number;
    unit?: string;
    onConfirm: (value: string) => void;
  }) => {
    setConfig({
      initialValue: options.initialValue || '',
      title: options.title || 'Enter Value',
      min: options.min,
      max: options.max,
      unit: options.unit,
      onConfirm: options.onConfirm,
    });
    setIsOpen(true);
  }, []);

  const closeKeypad = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    openKeypad,
    closeKeypad,
    keypadProps: {
      isOpen,
      onClose: closeKeypad,
      onConfirm: config.onConfirm,
      initialValue: config.initialValue,
      title: config.title,
      min: config.min,
      max: config.max,
      unit: config.unit,
    },
  };
};
