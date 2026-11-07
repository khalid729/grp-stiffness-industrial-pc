import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { VirtualKeyboard } from '@/components/ui/VirtualKeyboard';
import { TouchButton } from '@/components/ui/TouchButton';
import { Save, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Report fields QC may change after the test. Never results/measurements. */
export const REPORT_INFO_FIELDS: { key: string; label: string }[] = [
  { key: 'customer_name', label: 'report.customerName' },
  { key: 'project_name', label: 'report.projectName' },
  { key: 'po_number', label: 'report.poNumber' },
  { key: 'sample_id', label: 'report.sampleId' },
  { key: 'operator', label: 'report.operator' },
  { key: 'lot_number', label: 'report.lotNumber' },
  { key: 'product_id', label: 'report.productId' },
  { key: 'pressure_class', label: 'report.pressureClass' },
  { key: 'stiffness_class', label: 'report.stiffnessClass' },
];

export type ReportInfo = Record<string, string | null | undefined>;

interface ReportInfoEditorProps {
  /** PATCH target: /api/groups/{id} or /api/tests/{id} */
  kind: 'group' | 'test';
  id: number;
  initial: ReportInfo;
  onSaved: (updated: ReportInfo) => void;
  onCancel: () => void;
}

export function ReportInfoEditor({ kind, id, initial, onSaved, onCancel }: ReportInfoEditorProps) {
  const { t } = useLanguage();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v = Object.fromEntries(REPORT_INFO_FIELDS.map(f => [f.key, (initial[f.key] ?? '') as string]));
    // Stiffness class is known from the test target even if it was never typed in.
    const target = (initial as any).target_sn_class;
    if (!v.stiffness_class && target) v.stiffness_class = `SN ${target}`;
    return v;
  });
  const [active, setActive] = useState<string>(REPORT_INFO_FIELDS[0].key);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setValue = (v: string) => setValues(prev => ({ ...prev, [active]: v }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const changed: Record<string, string> = {};
      for (const f of REPORT_INFO_FIELDS) {
        if ((values[f.key] ?? '') !== ((initial[f.key] ?? '') as string)) changed[f.key] = values[f.key];
      }
      const url = kind === 'group' ? `/api/groups/${id}` : `/api/tests/${id}`;
      const r = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changed),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      onSaved((kind === 'group' ? data.group : data.test) || values);
    } catch (e: any) {
      setError(e?.message || 'Save failed');
      setSaving(false);
    }
  };

  const activeLabel = REPORT_INFO_FIELDS.find(f => f.key === active)?.label || '';

  return (
    <div className="p-5 space-y-4 print:hidden">
      <div>
        <h2 className="text-lg font-bold">{t('report.editInfo')}</h2>
        <p className="text-sm text-muted-foreground">{t('report.editInfoHint')}</p>
      </div>

      {/* Field grid — tap a field to edit it */}
      <div className="grid grid-cols-3 gap-2">
        {REPORT_INFO_FIELDS.map(f => (
          <button
            key={f.key}
            onClick={() => setActive(f.key)}
            className={cn(
              'text-left rounded-lg border px-3 py-2 min-h-[56px] transition-colors',
              active === f.key ? 'border-primary bg-primary/10 ring-2 ring-primary/40' : 'border-border bg-secondary/20 hover:bg-secondary/40'
            )}
          >
            <p className="text-xs text-muted-foreground">{t(f.label)}</p>
            <p className="font-mono font-semibold truncate">{values[f.key] || <span className="text-muted-foreground font-normal">—</span>}</p>
          </button>
        ))}
      </div>

      {/* Active field input (physical keyboard) + on-screen keyboard */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">{t(activeLabel)}</label>
        <input
          value={values[active] ?? ''}
          onChange={e => setValue(e.target.value)}
          autoFocus
          className="w-full rounded-md border-2 border-primary bg-secondary/20 px-4 py-3 text-xl font-mono outline-none"
        />
        <VirtualKeyboard value={values[active] ?? ''} onChange={setValue} onClose={() => {}} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        <TouchButton variant="outline" size="sm" onClick={onCancel} disabled={saving} className="min-h-[48px] px-5">
          <X className="w-4 h-4 mr-1" />{t('report.cancel')}
        </TouchButton>
        <TouchButton variant="primary" size="sm" onClick={save} disabled={saving} className="min-h-[48px] px-5">
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          {t('report.save')}
        </TouchButton>
      </div>
    </div>
  );
}
