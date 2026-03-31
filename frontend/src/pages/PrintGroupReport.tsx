import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

export default function PrintGroupReport() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [group, setGroup] = useState<any>(null);
  const [forceUnit] = useState<'N' | 'kN'>(() => {
    return (localStorage.getItem('report_force_unit') as 'N' | 'kN') || 'N';
  });

  useEffect(() => {
    if (id) {
      fetch(`/api/groups/${id}`).then(r => r.json()).then(setGroup);
    }
  }, [id]);

  const displayForce = (val: number | null | undefined) => {
    if (val == null) return '-';
    if (forceUnit === 'kN') return (val / 1000).toFixed(3);
    return val.toFixed(1);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (!group) return <div className="p-8 text-center">Loading...</div>;

  const tests = group.tests || [];

  return (
    <div className="bg-white text-black min-h-screen">
      {/* PAGE 1: SUMMARY */}
      <div className="p-8 max-w-[210mm] mx-auto">
        <div className="flex items-start justify-between pb-4 mb-4 border-b-2 border-gray-800">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-14 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('report.title')}</h1>
              <p className="text-sm text-gray-500">ASTM D2412 — {t('report.summary')}</p>
            </div>
          </div>
          <div className={`px-5 py-2 rounded-md text-lg font-bold ${group.passed ? 'bg-green-100 text-green-800 border-2 border-green-400' : 'bg-red-100 text-red-800 border-2 border-red-400'}`}>
            {group.passed ? t('report.pass') : t('report.fail')}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0 mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-3 border-r border-gray-200">
            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.testInfo')}</h2>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">{t('report.sampleId')}</span><span className="font-medium">{group.sample_id || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('report.date')}</span><span className="font-medium">{formatDate(group.test_date)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('report.operator')}</span><span className="font-medium">{group.operator || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('testSetup.numPositions')}</span><span className="font-medium">{group.num_positions}</span></div>
            </div>
          </div>
          <div className="p-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.parameters')}</h2>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">{t('report.pipeDiameter')}</span><span className="font-medium">{group.pipe_diameter} mm</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('report.pipeLength')}</span><span className="font-medium">{group.pipe_length} mm</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('report.deflectionPercent')}</span><span className="font-medium">{group.deflection_percent}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('report.testSpeed')}</span><span className="font-medium">{group.test_speed} mm/min</span></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0 mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-3 border-r border-gray-200">
            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.productInfo')}</h2>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">{t('report.lotNumber')}</span><span className="font-medium">{group.lot_number || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('report.productId')}</span><span className="font-medium">{group.product_id || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('report.nominalDiameter')}</span><span className="font-medium">{group.nominal_diameter ? `${group.nominal_diameter} mm` : '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('report.stiffnessClass')}</span><span className="font-medium">{group.stiffness_class || '-'}</span></div>
            </div>
          </div>
          <div className="p-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.projectInfo')}</h2>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">{t('report.projectName')}</span><span className="font-medium">{group.project_name || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('report.customerName')}</span><span className="font-medium">{group.customer_name || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('report.poNumber')}</span><span className="font-medium">{group.po_number || '-'}</span></div>
            </div>
          </div>
        </div>

        <table className="w-full border border-gray-200 text-sm mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 px-3 py-2 text-left">{t('testSetup.position')}</th>
              <th className="border border-gray-200 px-3 py-2 text-center">{t('testSetup.angle')}</th>
              <th className="border border-gray-200 px-3 py-2 text-center">{t('report.forceAtTarget')} ({forceUnit})</th>
              <th className="border border-gray-200 px-3 py-2 text-center">{t('report.ringStiffness')} ({forceUnit}/m²)</th>
              <th className="border border-gray-200 px-3 py-2 text-center">Target SN</th>
              <th className="border border-gray-200 px-3 py-2 text-center">Result</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test: any) => (
              <tr key={test.id}>
                <td className="border border-gray-200 px-3 py-2">{t('testSetup.position')} {test.position}</td>
                <td className="border border-gray-200 px-3 py-2 text-center">{test.angle}°</td>
                <td className="border border-gray-200 px-3 py-2 text-center font-mono">{displayForce(test.force_at_target)}</td>
                <td className="border border-gray-200 px-3 py-2 text-center font-mono">{displayForce(test.ring_stiffness)}</td>
                <td className="border border-gray-200 px-3 py-2 text-center">SN {group.target_sn_class || '-'}</td>
                <td className={`border border-gray-200 px-3 py-2 text-center font-bold ${test.passed ? 'text-green-700' : 'text-red-700'}`}>
                  {test.passed ? 'PASS' : 'FAIL'}
                </td>
              </tr>
            ))}
            {group.crack_tested && (
              <>
                <tr className="bg-orange-50">
                  <td className="border border-gray-200 px-3 py-2">Crack Stage 1</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">{group.crack_stage1_percent || 12}%</td>
                  <td className="border border-gray-200 px-3 py-2 text-center font-mono">{displayForce(group.crack_force_stage1)}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center font-mono">{group.crack_deflection_stage1?.toFixed(1) || '-'} mm</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">-</td>
                  <td className={`border border-gray-200 px-3 py-2 text-center font-bold ${!group.crack_found_stage1 ? 'text-green-700' : 'text-red-700'}`}>
                    {group.crack_found_stage1 ? 'CRACK' : 'OK'}
                  </td>
                </tr>
                <tr className="bg-orange-50">
                  <td className="border border-gray-200 px-3 py-2">Crack Stage 2</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">{group.crack_stage2_percent || 17}%</td>
                  <td className="border border-gray-200 px-3 py-2 text-center font-mono">{displayForce(group.crack_force_stage2)}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center font-mono">{group.crack_deflection_stage2?.toFixed(1) || '-'} mm</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">-</td>
                  <td className={`border border-gray-200 px-3 py-2 text-center font-bold ${!group.crack_found_stage2 ? 'text-green-700' : 'text-red-700'}`}>
                    {group.crack_found_stage2 ? 'CRACK' : 'OK'}
                  </td>
                </tr>
              </>
            )}
            <tr className="bg-gray-50 font-bold">
              <td className="border border-gray-200 px-3 py-2" colSpan={3}>{t('testSetup.avgStiffness')}</td>
              <td className="border border-gray-200 px-3 py-2 text-center font-mono text-lg">{displayForce(group.avg_ring_stiffness)}</td>
              <td className="border border-gray-200 px-3 py-2 text-center font-bold">SN {group.target_sn_class || '-'}</td>
              <td className={`border border-gray-200 px-3 py-2 text-center text-lg ${group.passed ? 'text-green-700' : 'text-red-700'}`}>
                {group.passed ? 'PASS' : 'FAIL'}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="border-t-2 border-gray-800 pt-3 text-center text-xs text-gray-400">
          {t('report.generatedBy')} | {formatDate(new Date().toISOString())}
        </div>
      </div>

      {/* PAGES 2+: Individual Position Reports with Charts */}
      {tests.map((test: any) => (
        <div key={test.id} className="p-8 max-w-[210mm] mx-auto break-before-page">
          <div className="flex items-start justify-between pb-4 mb-4 border-b-2 border-gray-800">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Logo" className="h-14 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('report.title')}</h1>
                <p className="text-sm text-gray-500">{t('testSetup.position')} {test.position} — {t('testSetup.angle')} {test.angle}°</p>
              </div>
            </div>
            <div className={`px-5 py-2 rounded-md text-lg font-bold ${test.passed ? 'bg-green-100 text-green-800 border-2 border-green-400' : 'bg-red-100 text-red-800 border-2 border-red-400'}`}>
              {test.passed ? t('report.pass') : t('report.fail')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-0 mb-4 border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-3 border-r border-gray-200">
              <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.testInfo')}</h2>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">{t('report.testId')}</span><span className="font-semibold">#{test.id}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('report.date')}</span><span className="font-medium">{formatDate(test.test_date)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('report.sampleId')}</span><span className="font-medium">{group.sample_id || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('testSetup.position')}</span><span className="font-medium">{test.position}/{group.num_positions} ({test.angle}°)</span></div>
              </div>
            </div>
            <div className="p-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.results')}</h2>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">{t('report.ringStiffness')}</span><span className="font-bold text-base">{displayForce(test.ring_stiffness)} {forceUnit}/m²</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('report.forceAtTarget')}</span><span className="font-medium">{displayForce(test.force_at_target)} {forceUnit}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('report.snClass')}</span><span className="font-medium">SN {test.sn_class || '-'}</span></div>
              </div>
            </div>
          </div>

          {test.data_points && test.data_points.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('report.forceDeflectionChart')} — {test.angle}°</h2>
              <div className="h-[300px] bg-gray-50 rounded-lg p-3 border border-gray-200">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={test.data_points.map((dp: any) => ({ deflection: dp.deflection, force: dp.force * 1000 }))} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="deflection" stroke="#6b7280" fontSize={11} tickFormatter={(v: number) => v.toFixed(1)} label={{ value: 'Deflection (mm)', position: 'bottom', fill: '#6b7280', fontSize: 11 }} />
                    <YAxis domain={[0, "auto"]} stroke="#6b7280" fontSize={11} tickFormatter={(v: number) => v.toFixed(0)} label={{ value: 'Force (N)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }} />
                    <Line type="monotone" dataKey="force" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="border-t border-gray-300 pt-2 text-center text-xs text-gray-400">
            {t('testSetup.position')} {test.position}/{group.num_positions} | {t('report.generatedBy')}
          </div>
        </div>
      ))}
    </div>
  );
}
