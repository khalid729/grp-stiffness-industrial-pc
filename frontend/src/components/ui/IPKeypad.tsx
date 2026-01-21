import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Delete, Check } from "lucide-react";

interface IPKeypadProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  initialValue: string;
  label: string;
}

export function IPKeypad({ isOpen, onClose, onConfirm, initialValue, label }: IPKeypadProps) {
  const [value, setValue] = useState(initialValue);

  const handleKey = (key: string) => {
    setValue(prev => prev + key);
  };

  const handleBackspace = () => {
    setValue(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setValue("");
  };

  const handleConfirm = () => {
    onConfirm(value);
    onClose();
  };

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "DEL"]
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border">
            <span className="text-2xl font-mono font-bold">{value || "0.0.0.0"}</span>
            <button onClick={handleClear} className="text-sm text-muted-foreground hover:text-foreground">
              Clear
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {keys.flat().map((key) => (
              <button
                key={key}
                onClick={() => key === "DEL" ? handleBackspace() : handleKey(key)}
                className={cn(
                  "h-14 rounded-lg font-bold text-xl transition-colors",
                  key === "DEL" 
                    ? "bg-destructive/20 hover:bg-destructive/30 flex items-center justify-center"
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {key === "DEL" ? <Delete className="w-6 h-6" /> : key}
              </button>
            ))}
          </div>
          <button
            onClick={handleConfirm}
            className="w-full h-14 bg-success hover:bg-success/80 rounded-lg font-bold text-lg flex items-center justify-center gap-2"
          >
            <Check className="w-6 h-6" />
            OK
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
