import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useState, useEffect } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { Printer, X } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface GroupReportDialogProps {
  groupId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GroupReportDialog({ groupId, open, onOpenChange }: GroupReportDialogProps) {
  const { t, language } = useLanguage();
  const [group, setGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forceUnit] = useState<'N' | 'kN'>(() => {
    return (localStorage.getItem('report_force_unit') as 'N' | 'kN') || 'N';
  });

  useEffect(() => {
    if (open && groupId) {
      setIsLoading(true);
      // Load with retry to ensure data_points are available
      const loadGroup = () => {
        fetch(`/api/groups/${groupId}`)
          .then(r => r.json())
          .then(data => {
            setGroup(data);
            setIsLoading(false);

          })
          .catch(() => setIsLoading(false));
      };
      // Initial delay to let backend finish saving
      setTimeout(loadGroup, 3000);
    }
  }, [open, groupId]);

  const displayForce = (val: number | null | undefined) => {
    if (val == null) return '-';
    if (forceUnit === 'kN') return (val / 1000).toFixed(3);
    return val.toFixed(0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const handlePrint = () => { window.print(); };

  if (!group) return null;
  const tests = group.tests || [];
  const isSinglePosition = tests.length <= 1;
  const test1 = tests[0];

  // Calculate averages for display
  const avgForce = tests.length > 0 ? tests.reduce((s: number, t: any) => s + (t.force_at_target || 0), 0) / tests.length : 0;
  const avgStis = group.avg_stis || (tests.length > 0 ? tests.reduce((s: number, t: any) => s + (t.stis || 0), 0) / tests.length : 0);
  const avgEir3 = group.avg_ei_over_r3 || (tests.length > 0 ? tests.reduce((s: number, t: any) => s + (t.ei_over_r3 || 0), 0) / tests.length : 0);
  const avgEmod = group.avg_e_modulus || (tests.length > 0 ? tests.reduce((s: number, t: any) => s + (t.e_modulus || 0), 0) / tests.length : 0);

  // Common header component
  const ReportHeader = ({ subtitle }: { subtitle: string }) => (
    <div className="flex items-start justify-between pb-4 mb-4 border-b-2 border-gray-800">
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="Logo" className="h-14 w-auto object-contain" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('report.title')}</h1>
          <p className="text-sm text-gray-500">ASTM D2412-02 — {subtitle}</p>
        </div>
      </div>
      <div className={`px-5 py-2 rounded-md text-lg font-bold ${
        group.passed ? 'bg-green-100 text-green-800 border-2 border-green-400' : 'bg-red-100 text-red-800 border-2 border-red-400'
      }`}>
        {group.passed ? t('report.pass') : t('report.fail')}
      </div>
    </div>
  );

  // Common info section
  const InfoSection = () => (
    <div className="grid grid-cols-2 gap-0 mb-3 border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-3 border-r border-gray-200">
        <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.testInfo')}</h2>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-gray-500">{t('report.sampleId')}</span><span className="font-medium">{group.sample_id || '-'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">{t('report.date')}</span><span className="font-medium">{formatDate(group.test_date)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">{t('report.operator')}</span><span className="font-medium">{group.operator || '-'}</span></div>
        </div>
      </div>
      <div className="p-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.parameters')}</h2>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-gray-500">{t('report.pipeDiameter')}</span><span className="font-medium">{group.pipe_diameter} mm</span></div>
          <div className="flex justify-between"><span className="text-gray-500">{t('report.pipeLength')}</span><span className="font-medium">{group.pipe_length} mm</span></div>
          <div className="flex justify-between"><span className="text-gray-500">{t('report.deflectionPercent')}</span><span className="font-medium">{group.deflection_percent}%</span></div>
          <div className="flex justify-between"><span className="text-gray-500">{t('report.testSpeed')}</span><span className="font-medium">{group.test_speed} mm/min</span></div>
        </div>
      </div>
    </div>
  );

  // Product/Project info
  const ProductSection = () => (
    <div className="grid grid-cols-2 gap-0 mb-3 border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-3 border-r border-gray-200">
        <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.productInfo')}</h2>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-gray-500">{t('report.lotNumber')}</span><span className="font-medium">{group.lot_number || '-'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">{t('report.productId')}</span><span className="font-medium">{group.product_id || '-'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">{t('report.stiffnessClass')}</span><span className="font-medium">{group.stiffness_class || '-'}</span></div>
        </div>
      </div>
      <div className="p-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.projectInfo')}</h2>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-gray-500">{t('report.projectName')}</span><span className="font-medium">{group.project_name || '-'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">{t('report.customerName')}</span><span className="font-medium">{group.customer_name || '-'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">{t('report.poNumber')}</span><span className="font-medium">{group.po_number || '-'}</span></div>
        </div>
      </div>
    </div>
  );

  // Chart component
  const TestChart = ({ test }: { test: any }) => (
    test.data_points && test.data_points.length > 0 ? (
      <div className="h-[280px] print:h-[220px] bg-gray-50 rounded-lg p-3 border border-gray-200">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={test.data_points.map((dp: any) => ({ deflection: dp.deflection, force: dp.force * 1000 }))} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="deflection" stroke="#6b7280" fontSize={11} tickFormatter={(v: number) => v.toFixed(1)} label={{ value: 'Deflection (mm)', position: 'bottom', fill: '#6b7280', fontSize: 11 }} />
            <YAxis domain={[0, "auto"]} stroke="#6b7280" fontSize={11} tickFormatter={(v: number) => v.toFixed(0)} label={{ value: 'Force (N)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: 12 }} formatter={(value: number) => [`${value.toFixed(0)} N`, 'Force']} labelFormatter={(label) => `Deflection: ${Number(label).toFixed(2)} mm`} />
            <Line type="monotone" dataKey="force" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    ) : <p className="text-gray-400 text-center py-8">{t('report.noData')}</p>
  );

  // Footer
  const ReportFooter = ({ extra }: { extra?: string }) => (
    <div className="border-t-2 border-gray-800 pt-3 mt-4 text-center text-xs text-gray-400">
      {extra && <span>{extra} | </span>}
      {t('report.generatedBy')} | {formatDate(new Date().toISOString())}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 print:max-w-none print:max-h-none print:overflow-visible print:shadow-none print:border-none">
        <div id="test-report" className="bg-white text-black print:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">{t('report.loading')}</p></div>
          ) : isSinglePosition && test1 ? (
            /* ========== SINGLE POSITION REPORT (1 page) ========== */
            <div className="p-8 print:p-0">
              <ReportHeader subtitle={`${test1.angle || 0}°`} />
              <InfoSection />
              <ProductSection />

              {/* Sample Measurements */}
              {test1.v_id && (
                <div className="mb-3">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('testSetup.sampleMeasurements')}</h2>
                  <div className="grid grid-cols-6 gap-2 text-center text-xs">
                    <div className="bg-gray-50 border border-gray-200 rounded p-2">
                      <p className="text-gray-500">{t('testSetup.horizontalId')}</p>
                      <p className="font-mono font-bold">{test1.h_id?.toFixed(2) || '-'} mm</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2">
                      <p className="text-gray-500">{t('testSetup.verticalId')}</p>
                      <p className="font-mono font-bold">{test1.v_id?.toFixed(2) || '-'} mm</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2">
                      <p className="text-gray-500">{t('testSetup.wallThickness')}</p>
                      <p className="font-mono font-bold">{test1.wall_thickness?.toFixed(2) || '-'} mm</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2">
                      <p className="text-gray-500">{t('testSetup.ringLength')}</p>
                      <p className="font-mono font-bold">{test1.ring_length || '-'} mm</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2">
                      <p className="text-gray-500">Init Defl (mm)</p>
                      <p className="font-mono font-bold">{test1.h_id && test1.v_id ? (test1.h_id - test1.v_id).toFixed(2) : '-'} mm</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2">
                      <p className="text-gray-500">{t('testSetup.initialDeflection')}</p>
                      <p className="font-mono font-bold">{test1.initial_deflection?.toFixed(3) || '-'}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              <div className="mb-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.results')}</h2>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{t('results.stis')}</p>
                    <p className="text-xl font-bold font-mono">{test1.stis?.toFixed(0) || displayForce(test1.ring_stiffness)}</p>
                    <p className="text-[10px] text-gray-400">N/m²</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{t('report.forceAtTarget')}</p>
                    <p className="text-xl font-bold font-mono">{displayForce(test1.force_at_target)}</p>
                    <p className="text-[10px] text-gray-400">{forceUnit}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Target SN</p>
                    <p className="text-xl font-bold font-mono">SN {group.target_sn_class || '-'}</p>
                  </div>
                </div>
                {(test1.ei_over_r3 || test1.e_modulus) && (
                  <div className="grid grid-cols-3 gap-2 text-center mt-2">
                    <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs">
                      <p className="text-gray-500">{t('results.eiOverR3')}</p>
                      <p className="font-mono font-bold">{test1.ei_over_r3?.toFixed(4) || '-'} N/mm²</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs">
                      <p className="text-gray-500">{t('results.eModulus')}</p>
                      <p className="font-mono font-bold">{test1.e_modulus?.toFixed(0) || '-'} N/mm²</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs">
                      <p className="text-gray-500">C-Factor</p>
                      <p className="font-mono font-bold">{test1.c_factor?.toFixed(4) || '-'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart */}
              <div className="mb-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.forceDeflectionChart')}</h2>
                <TestChart test={test1} />
              </div>

              <ReportFooter />
            </div>
          ) : (
            /* ========== MULTI-POSITION REPORT (4 pages) ========== */
            <>
              {/* PAGE 1: Summary */}
              <div className="p-8 print:p-0">
                <ReportHeader subtitle={t('report.summary')} />
                <InfoSection />
                <ProductSection />

                {/* Table 1: Stiffness Results */}
                <div className="mb-3">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.results')} — ASTM D2412</h2>
                  <table className="w-full border border-gray-200 text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 px-2 py-1.5 text-center">{t('testSetup.angle')}</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-center">Force ({forceUnit})</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-center">STIS (N/m²)</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-center">EI/R³</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-center">E-mod</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-center">Target SN</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.map((test: any) => (
                        <tr key={test.id}>
                          <td className="border border-gray-200 px-2 py-1.5 text-center">{test.angle}°</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{displayForce(test.force_at_target)}</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center font-mono font-bold">{test.stis?.toFixed(0) || '-'}</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{test.ei_over_r3?.toFixed(4) || '-'}</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{test.e_modulus?.toFixed(0) || '-'}</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center">SN {group.target_sn_class || '-'}</td>
                          <td className={`border border-gray-200 px-2 py-1.5 text-center font-bold ${test.passed ? 'text-green-700' : 'text-red-700'}`}>
                            {test.passed ? 'PASS' : 'FAIL'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td className="border border-gray-200 px-2 py-1.5 text-center">Avg</td>
                        <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{displayForce(avgForce)}</td>
                        <td className="border border-gray-200 px-2 py-1.5 text-center font-mono text-base">{avgStis?.toFixed(0) || '-'}</td>
                        <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{avgEir3?.toFixed(4) || '-'}</td>
                        <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{avgEmod?.toFixed(0) || '-'}</td>
                        <td className="border border-gray-200 px-2 py-1.5 text-center font-bold">SN {group.target_sn_class || '-'}</td>
                        <td className={`border border-gray-200 px-2 py-1.5 text-center text-base ${group.passed ? 'text-green-700' : 'text-red-700'}`}>
                          {group.passed ? 'PASS' : 'FAIL'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Table 2: Sample Measurements */}
                {tests.some((t: any) => t.v_id) && (
                  <div className="mb-3">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('testSetup.sampleMeasurements')}</h2>
                    <table className="w-full border border-gray-200 text-xs">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-200 px-2 py-1.5 text-center">{t('testSetup.angle')}</th>
                          <th className="border border-gray-200 px-2 py-1.5 text-center">H_ID (mm)</th>
                          <th className="border border-gray-200 px-2 py-1.5 text-center">V_ID (mm)</th>
                          <th className="border border-gray-200 px-2 py-1.5 text-center">Thickness (mm)</th>
                          <th className="border border-gray-200 px-2 py-1.5 text-center">Length (mm)</th>
                          <th className="border border-gray-200 px-2 py-1.5 text-center">Init Defl (mm)</th>
                          <th className="border border-gray-200 px-2 py-1.5 text-center">Init Defl %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tests.map((test: any) => (
                          <tr key={test.id}>
                            <td className="border border-gray-200 px-2 py-1.5 text-center">{test.angle}°</td>
                            <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{test.h_id?.toFixed(2) || '-'}</td>
                            <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{test.v_id?.toFixed(2) || '-'}</td>
                            <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{test.wall_thickness?.toFixed(2) || '-'}</td>
                            <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{test.ring_length || '-'}</td>
                            <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{test.h_id && test.v_id ? (test.h_id - test.v_id).toFixed(2) : '-'}</td>
                            <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{test.initial_deflection?.toFixed(3) || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Table 3: Crack Test (if tested) */}
                {group.crack_tested && (
                  <div className="mb-3">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">Crack Test</h2>
                    <table className="w-full border border-gray-200 text-xs">
                      <thead>
                        <tr className="bg-orange-50">
                          <th className="border border-gray-200 px-2 py-1.5 text-center">Stage</th>
                          <th className="border border-gray-200 px-2 py-1.5 text-center">Defl %</th>
                          <th className="border border-gray-200 px-2 py-1.5 text-center">Defl (mm)</th>
                          <th className="border border-gray-200 px-2 py-1.5 text-center">Force ({forceUnit})</th>
                          <th className="border border-gray-200 px-2 py-1.5 text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-200 px-2 py-1.5 text-center">Stage 1</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{group.crack_stage1_percent || 12}%</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{group.crack_deflection_stage1?.toFixed(2) || '-'}</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{displayForce(group.crack_force_stage1)}</td>
                          <td className={`border border-gray-200 px-2 py-1.5 text-center font-bold ${!group.crack_found_stage1 ? 'text-green-700' : 'text-red-700'}`}>
                            {group.crack_found_stage1 ? 'CRACK' : 'OK'}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-200 px-2 py-1.5 text-center">Stage 2</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{group.crack_stage2_percent || 17}%</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{group.crack_deflection_stage2?.toFixed(2) || '-'}</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{displayForce(group.crack_force_stage2)}</td>
                          <td className={`border border-gray-200 px-2 py-1.5 text-center font-bold ${!group.crack_found_stage2 ? 'text-green-700' : 'text-red-700'}`}>
                            {group.crack_found_stage2 ? 'CRACK' : 'OK'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <ReportFooter />
              </div>

              {/* PAGES 2-4: Individual Position Reports with Charts */}
              {tests.map((test: any) => (
                <div key={test.id} className="p-8 print:p-0 print:break-before-page border-t-4 border-gray-200 print:border-0">
                  <ReportHeader subtitle={`${test.angle}°`} />

                  <div className="grid grid-cols-2 gap-0 mb-3 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-3 border-r border-gray-200">
                      <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.testInfo')}</h2>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500">{t('report.testId')}</span><span className="font-semibold">#{test.id}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">{t('report.date')}</span><span className="font-medium">{formatDate(test.test_date)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">{t('report.sampleId')}</span><span className="font-medium">{group.sample_id || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">{t('testSetup.angle')}</span><span className="font-medium">{test.angle}°</span></div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.results')}</h2>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500">{t('results.stis')}</span><span className="font-bold text-base">{test.stis?.toFixed(0) || '-'} N/m²</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">{t('report.forceAtTarget')}</span><span className="font-medium">{displayForce(test.force_at_target)} {forceUnit}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">{t('results.eiOverR3')}</span><span className="font-medium">{test.ei_over_r3?.toFixed(4) || '-'} N/mm²</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">{t('results.eModulus')}</span><span className="font-medium">{test.e_modulus?.toFixed(0) || '-'} N/mm²</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Sample measurements for this position */}
                  {test.v_id && (
                    <div className="grid grid-cols-5 gap-2 text-center text-xs mb-3">
                      <div className="bg-gray-50 border border-gray-200 rounded p-1.5"><p className="text-gray-500">H_ID</p><p className="font-mono font-bold">{test.h_id?.toFixed(2)} mm</p></div>
                      <div className="bg-gray-50 border border-gray-200 rounded p-1.5"><p className="text-gray-500">V_ID</p><p className="font-mono font-bold">{test.v_id?.toFixed(2)} mm</p></div>
                      <div className="bg-gray-50 border border-gray-200 rounded p-1.5"><p className="text-gray-500">Thickness</p><p className="font-mono font-bold">{test.wall_thickness?.toFixed(2)} mm</p></div>
                      <div className="bg-gray-50 border border-gray-200 rounded p-1.5"><p className="text-gray-500">C-Factor</p><p className="font-mono font-bold">{test.c_factor?.toFixed(4)}</p></div>
                      <div className="bg-gray-50 border border-gray-200 rounded p-1.5"><p className="text-gray-500">Init Defl</p><p className="font-mono font-bold">{test.initial_deflection?.toFixed(3)}%</p></div>
                    </div>
                  )}

                  {/* Chart */}
                  <div className="mb-3">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.forceDeflectionChart')} — {test.angle}°</h2>
                    <TestChart test={test} />
                  </div>

                  <ReportFooter extra={`${test.angle}°`} />
                </div>
              ))}
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center gap-3 p-4 border-t bg-background print:hidden">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary">
            <X className="w-4 h-4 inline-block mr-1" />{t('report.close')}
          </button>
          <button onClick={handlePrint} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Printer className="w-4 h-4 inline-block mr-1" />{t('report.print')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
