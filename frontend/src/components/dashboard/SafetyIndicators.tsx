import { cn } from '@/lib/utils';
import { AlertTriangle, Home, ArrowUpToLine, ArrowDownToLine, ShieldCheck, ShieldX } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SafetyIndicatorsProps {
  eStop: boolean;
  upperLimit: boolean;
  lowerLimit: boolean;
  home: boolean;
  safetyOk: boolean;
  motionAllowed: boolean;
}

interface IndicatorProps {
  label: string;
  active: boolean;
  isError?: boolean;
  icon: React.ReactNode;
}

function Indicator({ label, active, isError, icon }: IndicatorProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
      active && isError && 'bg-destructive/10 border-destructive text-destructive',
      active && !isError && 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400',
      !active && 'bg-muted/50 border-border text-muted-foreground'
    )}>
      <div className={cn(
        'w-3 h-3 rounded-full',
        active && isError && 'bg-destructive animate-pulse',
        active && !isError && 'bg-green-500',
        !active && 'bg-muted-foreground/30'
      )} />
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function SafetyIndicators({
  eStop,
  upperLimit,
  lowerLimit,
  home,
  safetyOk,
  motionAllowed
}: SafetyIndicatorsProps) {
  const { t } = useLanguage();

  return (
    <div className="industrial-card p-4">
      <h3 className="text-sm lg:text-base font-semibold mb-3 text-muted-foreground flex items-center gap-2">
        {safetyOk ? (
          <ShieldCheck className="w-5 h-5 text-green-500" />
        ) : (
          <ShieldX className="w-5 h-5 text-destructive" />
        )}
        {t('dashboard.safetyStatus') || 'Safety Status'}
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <Indicator 
          label={t('safety.eStop') || 'E-Stop'}
          active={eStop}
          isError={true}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <Indicator 
          label={t('safety.upperLimit') || 'Upper Limit'}
          active={upperLimit}
          isError={true}
          icon={<ArrowUpToLine className="w-4 h-4" />}
        />
        <Indicator 
          label={t('safety.lowerLimit') || 'Lower Limit'}
          active={lowerLimit}
          isError={true}
          icon={<ArrowDownToLine className="w-4 h-4" />}
        />
        <Indicator 
          label={t('safety.home') || 'Home'}
          active={home}
          isError={false}
          icon={<Home className="w-4 h-4" />}
        />
        <Indicator 
          label={t('safety.safetyOk') || 'Safety OK'}
          active={safetyOk}
          isError={false}
          icon={<ShieldCheck className="w-4 h-4" />}
        />
        <Indicator 
          label={t('safety.motionOk') || 'Motion OK'}
          active={motionAllowed}
          isError={false}
          icon={<ShieldCheck className="w-4 h-4" />}
        />
      </div>
    </div>
  );
}
