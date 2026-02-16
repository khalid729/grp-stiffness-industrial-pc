import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState, useEffect } from "react";
import { useTestDetail } from '@/hooks/useApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { Printer, X } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface TestReportDialogProps {
  testId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestReportDialog({ testId, open, onOpenChange }: TestReportDialogProps) {
  const { t, language } = useLanguage();
  const { data: test, isLoading } = useTestDetail(open ? testId : null);

  // Report settings
  const [forceUnit, setForceUnit] = useState<'N' | 'kN'>(() => {
    return (localStorage.getItem('report_force_unit') as 'N' | 'kN') || 'N';
  });

  // Listen for storage changes
  useEffect(() => {
    const handleStorage = () => {
      setForceUnit((localStorage.getItem('report_force_unit') as 'N' | 'kN') || 'N');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Force value converter: PLC sends in Newtons, convert if user wants kN
  const displayForce = (valueInNewtons: number | null | undefined) => {
    if (valueInNewtons == null) return '-';
    if (forceUnit === 'kN') {
      return (valueInNewtons / 1000).toFixed(3);
    }
    return valueInNewtons.toFixed(1);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 print:max-w-none print:max-h-none print:overflow-visible">
        {/* A4 Paper Report */}
        <div id="test-report" className="bg-white text-black p-8 print:p-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground">{t('report.loading')}</p>
            </div>
          ) : test ? (
            <>
              {/* Header with Logo */}
              <div className="flex items-start justify-between pb-5 mb-6 border-b-2 border-gray-800">
                <div className="flex items-center gap-4">
                  <img
                    src="/logo.png"
                    alt="MNT Logo"
                    className="h-14 w-auto object-contain"
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                      {t('report.title')}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">ISO 9969</p>
                  </div>
                </div>
                <div
                  className={`px-5 py-2 rounded-md text-lg font-bold tracking-wide ${
                    test.passed
                      ? 'bg-green-100 text-green-800 border-2 border-green-400'
                      : 'bg-red-100 text-red-800 border-2 border-red-400'
                  }`}
                >
                  {test.passed ? t('report.pass') : t('report.fail')}
                </div>
              </div>

              {/* Two-Column Info Section */}
              <div className="grid grid-cols-2 gap-0 mb-6 border border-gray-200 rounded-lg overflow-hidden">
                {/* Left: Test Information */}
                <div className="p-4 border-r border-gray-200">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {t('report.testInfo')}
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('report.testId')}</span>
                      <span className="font-semibold text-gray-900">#{test.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('report.date')}</span>
                      <span className="font-medium text-gray-800">{formatDate(test.test_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('report.sampleId')}</span>
                      <span className="font-medium text-gray-800">{test.sample_id || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('report.operator')}</span>
                      <span className="font-medium text-gray-800">{test.operator || '-'}</span>
                    </div>
                  </div>
                </div>
                {/* Right: Test Parameters */}
                <div className="p-4">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {t('report.parameters')}
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('report.pipeDiameter')}</span>
                      <span className="font-medium text-gray-800">{test.pipe_diameter} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('report.pipeLength')}</span>
                      <span className="font-medium text-gray-800">{test.pipe_length} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('report.deflectionPercent')}</span>
                      <span className="font-medium text-gray-800">{test.deflection_percent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('report.testSpeed')}</span>
                      <span className="font-medium text-gray-800">{test.test_speed} mm/min</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart (Center of Report) */}
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {t('report.forceDeflectionChart')}
                </h2>
                {test.data_points && test.data_points.length > 0 ? (
                  <div className="h-[300px] bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={test.data_points.map((dp: any) => ({
                          deflection: dp.deflection,
                          force: dp.force * 1000,
                        }))}
                        margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="deflection"
                          stroke="#6b7280"
                          fontSize={11}
                          tickFormatter={(v: number) => v.toFixed(1)}
                          label={{
                            value: 'Deflection (mm)',
                            position: 'bottom',
                            fill: '#6b7280',
                            fontSize: 11,
                          }}
                        />
                        <YAxis
                          stroke="#6b7280"
                          fontSize={11}
                          tickFormatter={(v: number) => v.toFixed(0)}
                          label={{
                            value: 'Force (N)',
                            angle: -90,
                            position: 'insideLeft',
                            fill: '#6b7280',
                            fontSize: 11,
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: 12,
                          }}
                          formatter={(value: number) => [`${value.toFixed(1)} N`, 'Force']}
                          labelFormatter={(label) =>
                            `Deflection: ${Number(label).toFixed(2)} mm`
                          }
                        />
                        {test.deflection_percent && test.pipe_diameter && (
                          <ReferenceLine
                            x={(test.deflection_percent / 100) * test.pipe_diameter}
                            stroke="#f59e0b"
                            strokeDasharray="5 5"
                            label={{
                              value: 'Target',
                              fill: '#f59e0b',
                              fontSize: 11,
                            }}
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="force"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">{t('report.noData')}</p>
                )}
              </div>

              {/* Results Cards Grid */}
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {t('report.results')}
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{t('report.ringStiffness')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {displayForce(test.ring_stiffness)}
                    </p>
                    <p className="text-[10px] text-gray-400">{forceUnit}/m²</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{t('report.forceAtTarget')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {displayForce(test.force_at_target)}
                    </p>
                    <p className="text-[10px] text-gray-400">{forceUnit}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{t('report.snClass')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      SN {test.sn_class || '-'}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{t('report.maxForce')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {displayForce(test.max_force)}
                    </p>
                    <p className="text-[10px] text-gray-400">{forceUnit}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{t('report.duration')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatDuration(test.duration)}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{t('report.dataPoints')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {test.data_points?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-gray-800 pt-4 mt-8 text-center text-xs text-gray-400">
                {t('report.generatedBy')} | {formatDate(new Date().toISOString())}
              </div>
            </>
          ) : null}
        </div>

        {/* Action buttons (hidden in print) */}
        <div className="flex justify-between items-center gap-3 p-4 border-t bg-background print:hidden">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4 inline-block mr-1" />
            {t('report.close')}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Printer className="w-4 h-4 inline-block mr-1" />
            {t('report.print')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
