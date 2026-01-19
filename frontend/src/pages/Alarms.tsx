import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchButton } from '@/components/ui/TouchButton';
import { 
  AlertTriangle, 
  Bell, 
  BellOff, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Clock,
  User,
  RefreshCw,
  Filter
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Alarm {
  id: number;
  alarm_code: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  acknowledged: boolean;
  ack_by: string | null;
}

const Alarms = () => {
  const { t } = useLanguage();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('all');

  const handleAcknowledge = (id: number) => {
    setAlarms(prev => 
      prev.map(alarm => 
        alarm.id === id 
          ? { ...alarm, acknowledged: true, ack_by: 'Operator' }
          : alarm
      )
    );
    toast.success(t('alarms.acknowledged'));
  };

  const handleAcknowledgeAll = () => {
    setAlarms(prev => 
      prev.map(alarm => ({ ...alarm, acknowledged: true, ack_by: 'Operator' }))
    );
    toast.success(t('alarms.allAcknowledged'));
  };

  const handleRefresh = () => {
    toast.info(t('alarms.refreshed'));
  };

  const filteredAlarms = alarms.filter(alarm => {
    if (filter === 'active') return !alarm.acknowledged;
    if (filter === 'acknowledged') return alarm.acknowledged;
    return true;
  });

  const activeCount = alarms.filter(a => !a.acknowledged).length;
  const criticalCount = alarms.filter(a => a.severity === 'critical' && !a.acknowledged).length;

  const getSeverityIcon = (severity: Alarm['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'info':
        return <AlertCircle className="w-5 h-5 text-info" />;
    }
  };

  const getSeverityStyle = (severity: Alarm['severity'], acknowledged: boolean) => {
    if (acknowledged) return 'border-border bg-muted/30 opacity-70';
    switch (severity) {
      case 'critical':
        return 'border-destructive/50 bg-destructive/10';
      case 'warning':
        return 'border-warning/50 bg-warning/10';
      case 'info':
        return 'border-info/50 bg-info/10';
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-slide-up">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-warning" />
          <h1 className="text-xl lg:text-2xl font-bold">{t('nav.alarms')}</h1>
          {activeCount > 0 && (
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-bold',
              criticalCount > 0 
                ? 'bg-destructive text-destructive-foreground animate-pulse' 
                : 'bg-warning text-warning-foreground'
            )}>
              {activeCount} {t('alarms.active')}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <TouchButton
            variant="outline"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            {t('alarms.refresh')}
          </TouchButton>
          <TouchButton
            variant="warning"
            onClick={handleAcknowledgeAll}
            disabled={activeCount === 0}
            className="gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            {t('alarms.ackAll')}
          </TouchButton>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-secondary rounded-xl">
        {(['all', 'active', 'acknowledged'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all touch-none',
              filter === f 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t(`alarms.filter.${f}`)}
            {f === 'active' && activeCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-warning/20 text-warning rounded-full text-xs">
                {activeCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alarms List */}
      <div className="space-y-3">
        {filteredAlarms.length === 0 ? (
          <div className="industrial-card p-8 text-center">
            <BellOff className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{t('alarms.noAlarms')}</p>
          </div>
        ) : (
          filteredAlarms.map(alarm => (
            <Card 
              key={alarm.id} 
              className={cn(
                'industrial-card border-2 transition-all',
                getSeverityStyle(alarm.severity, alarm.acknowledged)
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Severity Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(alarm.severity)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm bg-secondary px-2 py-0.5 rounded">
                        {alarm.alarm_code}
                      </span>
                      {alarm.acknowledged && (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <CheckCircle2 className="w-3 h-3" />
                          {t('alarms.acked')}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-foreground mb-2">
                      {alarm.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alarm.timestamp}
                      </span>
                      {alarm.ack_by && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {alarm.ack_by}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  {!alarm.acknowledged && (
                    <TouchButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcknowledge(alarm.id)}
                      className="flex-shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </TouchButton>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Alarms;
