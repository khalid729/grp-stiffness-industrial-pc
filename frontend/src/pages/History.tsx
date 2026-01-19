import { useLanguage } from '@/contexts/LanguageContext';

const History = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <div className="page-header">
        <h1 className="text-xl lg:text-2xl font-bold">{t('nav.history')}</h1>
      </div>
      
      <div className="industrial-card p-8 text-center">
        <p className="text-muted-foreground">
          Test history will be displayed here.
        </p>
      </div>
    </div>
  );
};

export default History;
