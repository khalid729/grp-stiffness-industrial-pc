import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface TestProgressProps {
  stage: number;
  progress: number;
  isRunning: boolean;
}

const STAGE_NAMES: Record<number, { en: string; ar: string }> = {
  0: { en: 'Idle - Ready', ar: 'جاهز' },
  1: { en: 'Initializing...', ar: 'جاري التهيئة...' },
  2: { en: 'Moving to Home...', ar: 'الانتقال للموضع الرئيسي...' },
  3: { en: 'Approaching Sample...', ar: 'الاقتراب من العينة...' },
  4: { en: 'Establishing Contact...', ar: 'إنشاء الاتصال...' },
  5: { en: 'Testing in Progress...', ar: 'الاختبار قيد التنفيذ...' },
  6: { en: 'Recording Results...', ar: 'تسجيل النتائج...' },
  7: { en: 'Returning Home...', ar: 'العودة للموضع الرئيسي...' },
  8: { en: 'Test Complete', ar: 'اكتمل الاختبار' },
  99: { en: 'ERROR - Check Alarm', ar: 'خطأ - تحقق من الإنذار' },
};

export function TestProgress({ stage, progress, isRunning }: TestProgressProps) {
  const { language } = useLanguage();
  
  const stageName = STAGE_NAMES[stage] 
    ? (language === 'ar' ? STAGE_NAMES[stage].ar : STAGE_NAMES[stage].en)
    : 'Unknown';

  const isError = stage === 99;
  const isComplete = stage === 8;

  return (
    <div className={cn(
      'industrial-card p-4 transition-all',
      isRunning && 'ring-2 ring-primary/50',
      isError && 'ring-2 ring-destructive/50 bg-destructive/5',
      isComplete && 'ring-2 ring-green-500/50 bg-green-500/5'
    )}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm lg:text-base font-semibold text-muted-foreground">
          {language === 'ar' ? 'تقدم الاختبار' : 'Test Progress'}
        </h3>
        <span className={cn(
          'text-sm font-medium px-2 py-1 rounded',
          isError && 'bg-destructive/10 text-destructive',
          isComplete && 'bg-green-500/10 text-green-600 dark:text-green-400',
          isRunning && !isError && !isComplete && 'bg-primary/10 text-primary',
          !isRunning && !isError && !isComplete && 'bg-muted text-muted-foreground'
        )}>
          Stage {stage}: {stageName}
        </span>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={progress} 
          className={cn(
            'h-4',
            isError && '[&>div]:bg-destructive',
            isComplete && '[&>div]:bg-green-500'
          )}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{progress}%</span>
          <span>{stageName}</span>
        </div>
      </div>
    </div>
  );
}
