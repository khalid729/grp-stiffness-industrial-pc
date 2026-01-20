import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, ArrowUp, ArrowDown, Home, CheckCircle, Cog } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SafetyIndicatorsProps {
  eStop: boolean;
  upperLimit: boolean;
  lowerLimit: boolean;
  home: boolean;
  safetyOk: boolean;
  motionAllowed: boolean;
}

interface MachineIndicatorsProps {
  servoReady: boolean;
  servoEnabled: boolean;
  servoError: boolean;
  atHome: boolean;
  upperLock: boolean;
  lowerLock: boolean;
}

export function SafetyIndicators({
  eStop,
  upperLimit,
  lowerLimit,
  home,
  safetyOk,
  motionAllowed,
}: SafetyIndicatorsProps) {
  const { t } = useLanguage();
  
  const indicators = [
    { 
      label: "E-STOP", 
      active: eStop, 
      isError: eStop,
      icon: AlertTriangle 
    },
    { 
      label: "Upper", 
      active: upperLimit, 
      isError: upperLimit,
      icon: ArrowUp 
    },
    { 
      label: "Lower", 
      active: lowerLimit, 
      isError: lowerLimit,
      icon: ArrowDown 
    },
    { 
      label: "Home", 
      active: home, 
      isError: false,
      icon: Home 
    },
    { 
      label: "Safety", 
      active: safetyOk, 
      isError: !safetyOk,
      icon: Shield 
    },
    { 
      label: "Motion", 
      active: motionAllowed, 
      isError: !motionAllowed,
      icon: CheckCircle 
    },
  ];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Shield className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('indicators.safety')}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {indicators.map((ind) => {
          const Icon = ind.icon;
          return (
            <div
              key={ind.label}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded text-base font-medium",
                ind.isError
                  ? "bg-destructive/20 text-destructive"
                  : ind.active
                    ? "bg-success/20 text-success"
                    : "bg-secondary/50 text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{ind.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MachineIndicatorsGroup({
  servoReady,
  servoEnabled,
  servoError,
  atHome,
  upperLock,
  lowerLock,
}: MachineIndicatorsProps) {
  const { t } = useLanguage();
  
  const indicators = [
    { label: t('dashboard.servoReady'), active: servoReady, isError: false },
    { label: t('dashboard.servoEnabled'), active: servoEnabled, isError: false },
    { label: t('dashboard.servoError'), active: servoError, isError: servoError },
    { label: t('dashboard.atHome'), active: atHome, isError: false },
    { label: t('dashboard.upperLock'), active: upperLock, isError: false },
    { label: t('dashboard.lowerLock'), active: lowerLock, isError: false },
  ];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Cog className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('indicators.machine')}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {indicators.map((ind) => (
          <div
            key={ind.label}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-base font-medium",
              ind.isError
                ? "bg-destructive/20 text-destructive"
                : ind.active
                  ? "bg-success/20 text-success"
                  : "bg-secondary/50 text-muted-foreground"
            )}
          >
            <span className={cn(
              "w-2.5 h-2.5 rounded-full",
              ind.isError ? "bg-destructive" : ind.active ? "bg-success" : "bg-muted-foreground"
            )} />
            <span>{ind.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
