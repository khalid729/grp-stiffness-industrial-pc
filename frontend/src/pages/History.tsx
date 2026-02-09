import { useLanguage } from '@/contexts/LanguageContext';
import { useTestHistory } from '@/hooks/useApi';
import { TouchButton } from '@/components/ui/TouchButton';
import { History as HistoryIcon, FileText, Trash2, Download, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const History = () => {
  const { t, language } = useLanguage();
  const { tests, total, isLoading, refetch, deleteTest, downloadPdf } = useTestHistory();

  return (
    <div className="flex flex-col h-full gap-3 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HistoryIcon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('nav.history')}</h1>
          {total > 0 && (
            <span className="px-2 py-0.5 rounded-full text-sm font-bold bg-secondary">
              {total}
            </span>
          )}
        </div>
        <TouchButton variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
          {t('history.refresh')}
        </TouchButton>
      </div>

      {/* Tests List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : tests.length === 0 ? (
          <div className="industrial-card p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              {t('history.noTests')}
            </p>
          </div>
        ) : (
          tests.map(test => (
            <div key={test.id} className="industrial-card p-3">
              <div className="flex items-start gap-3">
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                  test.passed ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                )}>
                  {test.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-base font-bold">#{test.id}</span>
                    {test.sample_id && (
                      <span className="text-base text-muted-foreground">{test.sample_id}</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('history.diameter')} </span>
                      <span className="font-mono">{test.pipe_diameter}mm</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SN: </span>
                      <span className="font-mono font-bold">{test.sn_class || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('history.force')} </span>
                      <span className="font-mono">{test.force_at_target?.toFixed(1) || '-'}kN</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(test.test_date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
                
                <div className="flex flex-col gap-1">
                  <TouchButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => downloadPdf(test.id)}
                    className="px-2"
                  >
                    <Download className="w-4 h-4" />
                  </TouchButton>
                  <TouchButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteTest.mutate(test.id)}
                    disabled={deleteTest.isPending}
                    className="px-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </TouchButton>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;
