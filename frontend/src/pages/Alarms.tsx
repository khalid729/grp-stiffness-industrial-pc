import { TouchButton } from '@/components/ui/TouchButton';
import {
  Bell, BellOff, CheckCircle2, XCircle, AlertTriangle, AlertCircle, RefreshCw, Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAlarmsControl } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const Alarms = () => {
  const { t, language } = useLanguage();
  const { alarms, isLoading, refetch, acknowledgeAlarm, acknowledgeAll } = useAlarmsControl();
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('all');

  const filteredAlarms = alarms.filter(alarm => {
    if (filter === 'active') return !alarm.acknowledged;
    if (filter === 'acknowledged') return alarm.acknowledged;
    return true;
  });

  const activeCount = alarms.filter(a => !a.acknowledged).length;
  const criticalCount = alarms.filter(a => a.severity === 'critical' && !a.acknowledged).length;

  const getSeverityIcon = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'info': return <AlertCircle className="w-5 h-5 text-info" />;
    }
  };

  return (
    <div className="flex flex-col h-full gap-3 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-warning" />
          <h1 className="text-2xl font-bold">{t('nav.alarms')}</h1>
          {activeCount > 0 && (
            <span className={cn(
              'px-2 py-0.5 rounded-full text-sm font-bold',
              criticalCount > 0 ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-warning text-warning-foreground'
            )}>
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <TouchButton variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          </TouchButton>
          <TouchButton 
            variant="warning" 
            size="sm" 
            onClick={() => acknowledgeAll.mutate()} 
            disabled={activeCount === 0 || acknowledgeAll.isPending}
          >
            {acknowledgeAll.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {language === 'ar' ? 'تأكيد الكل' : 'Ack All'}
          </TouchButton>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg">
        {(['all', 'active', 'acknowledged'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'flex-1 py-2 px-3 rounded text-base font-semibold transition-all',
              filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            )}
          >
            {language === 'ar' 
              ? (f === 'all' ? 'الكل' : f === 'active' ? 'نشط' : 'مؤكد')
              : (f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Acknowledged')
            }
          </button>
        ))}
      </div>

      {/* Alarms List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAlarms.length === 0 ? (
          <div className="industrial-card p-8 text-center">
            <BellOff className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-base text-muted-foreground">{language === 'ar' ? 'لا توجد إنذارات' : 'No alarms'}</p>
          </div>
        ) : (
          filteredAlarms.map(alarm => (
            <div
              key={alarm.id}
              className={cn(
                'industrial-card p-3 border-2',
                alarm.acknowledged
                  ? 'border-border opacity-70'
                  : alarm.severity === 'critical'
                    ? 'border-destructive/50 bg-destructive/10'
                    : alarm.severity === 'warning'
                      ? 'border-warning/50 bg-warning/10'
                      : 'border-info/50 bg-info/10'
              )}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(alarm.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-base font-bold bg-secondary px-1.5 py-0.5 rounded">
                      {alarm.alarm_code}
                    </span>
                    {alarm.acknowledged && (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    )}
                  </div>
                  <p className="text-base font-medium">{alarm.message}</p>
                  <p className="text-sm text-muted-foreground mt-1">{alarm.timestamp}</p>
                </div>
                {!alarm.acknowledged && (
                  <TouchButton 
                    variant="outline" 
                    size="sm" 
                    onClick={() => acknowledgeAlarm.mutate(alarm.id)}
                    disabled={acknowledgeAlarm.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </TouchButton>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alarms;
