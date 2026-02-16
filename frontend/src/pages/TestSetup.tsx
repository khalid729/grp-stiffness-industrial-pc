import { useState, useEffect } from 'react';
import { TouchButton } from '@/components/ui/TouchButton';
import { Slider } from '@/components/ui/slider';
import { Settings2, Save, RotateCcw, CircleDot, Gauge, Target, Loader2, FileText, Package, Briefcase } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useParametersControl, TestParameters, useTestMetadata, TestMetadata } from '@/hooks/useApi';
import { toast } from 'sonner';
import { NumericKeypad } from '@/components/ui/NumericKeypad';
import { VirtualKeyboard } from '@/components/ui/VirtualKeyboard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const defaultParameters: TestParameters = {
  pipe_diameter: 300,
  pipe_length: 300,
  deflection_percent: 3,
  test_speed: 50,
  max_stroke: 150,
  max_force: 50,
};

const defaultMeta: TestMetadata = {
  sample_id: '',
  operator: '',
  notes: '',
  lot_number: '',
  nominal_diameter: null,
  pressure_class: '',
  stiffness_class: '',
  product_id: '',
  thickness: null,
  nominal_weight: null,
  project_name: '',
  customer_name: '',
  po_number: '',
};

// GRP Fiberglass pipe standard options
const PRESSURE_CLASS_OPTIONS = ['PN1', 'PN6', 'PN10', 'PN16', 'PN20', 'PN25', 'PN32'];
const STIFFNESS_CLASS_OPTIONS = ['SN1250', 'SN2500', 'SN5000', 'SN10000'];

const TestSetup = () => {
  const { t } = useLanguage();
  const { parameters: savedParams, isLoading, setParameters } = useParametersControl();
  const [parameters, setLocalParameters] = useState<TestParameters>(defaultParameters);

  const { metadata, saveMetadata } = useTestMetadata();
  const [meta, setMeta] = useState<TestMetadata>(defaultMeta);

  // Virtual input states
  const [activeKeypad, setActiveKeypad] = useState<{ field: keyof TestMetadata; label: string; unit: string } | null>(null);
  const [activeKeyboard, setActiveKeyboard] = useState<keyof TestMetadata | null>(null);

  // Load saved parameters
  useEffect(() => {
    if (savedParams) {
      setLocalParameters(prev => ({
        ...prev,
        ...savedParams,
      }));
    }
  }, [savedParams]);

  useEffect(() => {
    if (metadata) {
      setMeta({
        sample_id: metadata.sample_id || '',
        operator: metadata.operator || '',
        notes: metadata.notes || '',
        lot_number: metadata.lot_number || '',
        nominal_diameter: metadata.nominal_diameter ?? null,
        pressure_class: metadata.pressure_class || '',
        stiffness_class: metadata.stiffness_class || '',
        product_id: metadata.product_id || '',
        thickness: metadata.thickness ?? null,
        nominal_weight: metadata.nominal_weight ?? null,
        project_name: metadata.project_name || '',
        customer_name: metadata.customer_name || '',
        po_number: metadata.po_number || '',
      });
    }
  }, [metadata]);

  const handleSliderChange = (field: keyof TestParameters, values: number[]) => {
    setLocalParameters(prev => ({ ...prev, [field]: values[0] }));
  };

  const handleSave = () => {
    setParameters.mutate(parameters);
    saveMetadata.mutate(meta);
  };

  const handleReset = () => {
    setLocalParameters(defaultParameters);
    toast.info(t('testSetup.reset'));
  };

  // Text field change handler (physical keyboard)
  const handleTextChange = (field: keyof TestMetadata, value: string) => {
    setMeta(prev => ({ ...prev, [field]: value }));
  };

  // Numeric field change handler (physical keyboard)
  const handleNumericChange = (field: keyof TestMetadata, value: string) => {
    const num = value === '' ? null : parseFloat(value);
    setMeta(prev => ({ ...prev, [field]: isNaN(num as number) ? null : num }));
  };

  const openKeypad = (field: keyof TestMetadata, label: string, unit: string) => {
    setActiveKeyboard(null);
    setActiveKeypad({ field, label, unit });
  };

  const handleKeypadConfirm = (value: number) => {
    if (activeKeypad) {
      setMeta(prev => ({ ...prev, [activeKeypad.field]: value || null }));
    }
  };

  const openKeyboard = (field: keyof TestMetadata) => {
    setActiveKeypad(null);
    setActiveKeyboard(prev => prev === field ? prev : field);
  };

  const targetDeflection = ((parameters.pipe_diameter || 300) * (parameters.deflection_percent || 3)) / 100;

  return (
    <div className="flex flex-col h-full gap-3 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('nav.testSetup')}</h1>
        </div>
        <div className="flex gap-2">
          <TouchButton variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-6 h-6" />
          </TouchButton>
          <TouchButton variant="success" size="sm" onClick={handleSave} disabled={setParameters.isPending}>
            {setParameters.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            {t('testSetup.saveBtn')}
          </TouchButton>
        </div>
      </div>

      {/* Target Deflection Display */}
      <div className="industrial-card p-3 flex items-center justify-between">
        <span className="text-base text-muted-foreground">{t('testSetup.targetDeflection')}</span>
        <span className="status-value text-3xl font-bold text-primary">{targetDeflection.toFixed(2)} mm</span>
      </div>

      {/* Parameters Grid */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {/* Pipe Parameters */}
        <div className="industrial-card p-3 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <CircleDot className="w-6 h-6 text-info" />
            {t('testSetup.pipeParams')}
          </div>

          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">{t('testSetup.pipeDiameter')}</span>
                <span className="font-mono font-bold">{parameters.pipe_diameter} mm</span>
              </div>
              <Slider
                value={[parameters.pipe_diameter || 300]}
                onValueChange={(v) => handleSliderChange('pipe_diameter', v)}
                min={50}
                max={1000}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">{t('testSetup.pipeLength')}</span>
                <span className="font-mono font-bold">{parameters.pipe_length} mm</span>
              </div>
              <Slider
                value={[parameters.pipe_length || 300]}
                onValueChange={(v) => handleSliderChange('pipe_length', v)}
                min={100}
                max={500}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">{t('testSetup.deflectionPercent')}</span>
                <span className="font-mono font-bold">{parameters.deflection_percent}%</span>
              </div>
              <Slider
                value={[parameters.deflection_percent || 3]}
                onValueChange={(v) => handleSliderChange('deflection_percent', v)}
                min={1}
                max={10}
                step={0.5}
              />
            </div>
          </div>
        </div>

        {/* Test Parameters */}
        <div className="industrial-card p-3 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Gauge className="w-6 h-6 text-warning" />
            {t('testSetup.testParams')}
          </div>

          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">{t('testSetup.testSpeed')}</span>
                <span className="font-mono font-bold">{parameters.test_speed} mm/min</span>
              </div>
              <Slider
                value={[parameters.test_speed || 50]}
                onValueChange={(v) => handleSliderChange('test_speed', v)}
                min={1}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">{t('testSetup.maxStroke')}</span>
                <span className="font-mono font-bold">{parameters.max_stroke} mm</span>
              </div>
              <Slider
                value={[parameters.max_stroke || 150]}
                onValueChange={(v) => handleSliderChange('max_stroke', v)}
                min={50}
                max={300}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">{t('testSetup.maxForce')}</span>
                <span className="font-mono font-bold">{parameters.max_force} kN</span>
              </div>
              <Slider
                value={[parameters.max_force || 50]}
                onValueChange={(v) => handleSliderChange('max_force', v)}
                min={10}
                max={100}
                step={5}
              />
            </div>
          </div>
        </div>

        {/* Product Information */}
        <div className="industrial-card p-3 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Package className="w-6 h-6 text-info" />
            {t('testSetup.productInfo')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Lot Number - text */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('testSetup.lotNumber')}</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={meta.lot_number}
                onChange={(e) => handleTextChange('lot_number', e.target.value)}
                onFocus={() => openKeyboard('lot_number')}
                placeholder={t('testSetup.lotNumber')}
              />
              {activeKeyboard === 'lot_number' && (
                <VirtualKeyboard
                  value={meta.lot_number}
                  onChange={(v) => setMeta(prev => ({ ...prev, lot_number: v }))}
                  onClose={() => setActiveKeyboard(null)}
                />
              )}
            </div>
            {/* Product ID - text */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('testSetup.productId')}</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={meta.product_id}
                onChange={(e) => handleTextChange('product_id', e.target.value)}
                onFocus={() => openKeyboard('product_id')}
                placeholder={t('testSetup.productId')}
              />
              {activeKeyboard === 'product_id' && (
                <VirtualKeyboard
                  value={meta.product_id}
                  onChange={(v) => setMeta(prev => ({ ...prev, product_id: v }))}
                  onClose={() => setActiveKeyboard(null)}
                />
              )}
            </div>
            {/* Nominal Diameter - number */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('testSetup.nominalDiameter')}</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  step="any"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={meta.nominal_diameter ?? ''}
                  onChange={(e) => handleNumericChange('nominal_diameter', e.target.value)}
                  placeholder="mm"
                />
                <button
                  type="button"
                  className="px-2 rounded-md border border-input bg-secondary hover:bg-secondary/80 text-xs font-bold shrink-0"
                  onClick={() => openKeypad('nominal_diameter', t('testSetup.nominalDiameter'), 'mm')}
                >
                  123
                </button>
              </div>
            </div>
            {/* Thickness - number */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('testSetup.thickness')}</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  step="any"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={meta.thickness ?? ''}
                  onChange={(e) => handleNumericChange('thickness', e.target.value)}
                  placeholder="mm"
                />
                <button
                  type="button"
                  className="px-2 rounded-md border border-input bg-secondary hover:bg-secondary/80 text-xs font-bold shrink-0"
                  onClick={() => openKeypad('thickness', t('testSetup.thickness'), 'mm')}
                >
                  123
                </button>
              </div>
            </div>
            {/* Nominal Weight - number */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('testSetup.nominalWeight')}</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  step="any"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={meta.nominal_weight ?? ''}
                  onChange={(e) => handleNumericChange('nominal_weight', e.target.value)}
                  placeholder="kg/m"
                />
                <button
                  type="button"
                  className="px-2 rounded-md border border-input bg-secondary hover:bg-secondary/80 text-xs font-bold shrink-0"
                  onClick={() => openKeypad('nominal_weight', t('testSetup.nominalWeight'), 'kg/m')}
                >
                  123
                </button>
              </div>
            </div>
            {/* Pressure Class - dropdown select */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('testSetup.pressureClass')}</label>
              <Select
                value={meta.pressure_class || undefined}
                onValueChange={(v) => setMeta(prev => ({ ...prev, pressure_class: v === '_none_' ? '' : v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('testSetup.pressureClass')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">-</SelectItem>
                  {PRESSURE_CLASS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Stiffness Class - dropdown select */}
            <div className="col-span-2 space-y-1">
              <label className="text-sm text-muted-foreground">{t('testSetup.stiffnessClass')}</label>
              <Select
                value={meta.stiffness_class || undefined}
                onValueChange={(v) => setMeta(prev => ({ ...prev, stiffness_class: v === '_none_' ? '' : v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('testSetup.stiffnessClass')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">-</SelectItem>
                  {STIFFNESS_CLASS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Project Information */}
        <div className="industrial-card p-3 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Briefcase className="w-6 h-6 text-warning" />
            {t('testSetup.projectInfo')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Project Name - text */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('testSetup.projectName')}</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={meta.project_name}
                onChange={(e) => handleTextChange('project_name', e.target.value)}
                onFocus={() => openKeyboard('project_name')}
                placeholder={t('testSetup.projectName')}
              />
              {activeKeyboard === 'project_name' && (
                <VirtualKeyboard
                  value={meta.project_name}
                  onChange={(v) => setMeta(prev => ({ ...prev, project_name: v }))}
                  onClose={() => setActiveKeyboard(null)}
                />
              )}
            </div>
            {/* Customer Name - text */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('testSetup.customerName')}</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={meta.customer_name}
                onChange={(e) => handleTextChange('customer_name', e.target.value)}
                onFocus={() => openKeyboard('customer_name')}
                placeholder={t('testSetup.customerName')}
              />
              {activeKeyboard === 'customer_name' && (
                <VirtualKeyboard
                  value={meta.customer_name}
                  onChange={(v) => setMeta(prev => ({ ...prev, customer_name: v }))}
                  onClose={() => setActiveKeyboard(null)}
                />
              )}
            </div>
            {/* PO Number - text */}
            <div className="col-span-2 space-y-1">
              <label className="text-sm text-muted-foreground">{t('testSetup.poNumber')}</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={meta.po_number}
                onChange={(e) => handleTextChange('po_number', e.target.value)}
                onFocus={() => openKeyboard('po_number')}
                placeholder={t('testSetup.poNumber')}
              />
              {activeKeyboard === 'po_number' && (
                <VirtualKeyboard
                  value={meta.po_number}
                  onChange={(v) => setMeta(prev => ({ ...prev, po_number: v }))}
                  onClose={() => setActiveKeyboard(null)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Test Information */}
        <div className="industrial-card p-3 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="w-6 h-6 text-primary" />
            {t('testSetup.testInfo')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Sample ID - text */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('testSetup.sampleId')}</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={meta.sample_id}
                onChange={(e) => handleTextChange('sample_id', e.target.value)}
                onFocus={() => openKeyboard('sample_id')}
                placeholder={t('testSetup.sampleId')}
              />
              {activeKeyboard === 'sample_id' && (
                <VirtualKeyboard
                  value={meta.sample_id}
                  onChange={(v) => setMeta(prev => ({ ...prev, sample_id: v }))}
                  onClose={() => setActiveKeyboard(null)}
                />
              )}
            </div>
            {/* Operator - text */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('testSetup.operator')}</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={meta.operator}
                onChange={(e) => handleTextChange('operator', e.target.value)}
                onFocus={() => openKeyboard('operator')}
                placeholder={t('testSetup.operator')}
              />
              {activeKeyboard === 'operator' && (
                <VirtualKeyboard
                  value={meta.operator}
                  onChange={(v) => setMeta(prev => ({ ...prev, operator: v }))}
                  onClose={() => setActiveKeyboard(null)}
                />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">{t('testSetup.notes')}</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={meta.notes}
              onChange={(e) => handleTextChange('notes', e.target.value)}
              onFocus={() => openKeyboard('notes')}
              placeholder={t('testSetup.notes')}
            />
            {activeKeyboard === 'notes' && (
              <VirtualKeyboard
                value={meta.notes}
                onChange={(v) => setMeta(prev => ({ ...prev, notes: v }))}
                onClose={() => setActiveKeyboard(null)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ISO Note */}
      <div className="industrial-card p-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Target className="w-6 h-6 text-primary flex-shrink-0" />
        {t('testSetup.isoNote')}
      </div>

      {/* Numeric Keypad Modal */}
      <NumericKeypad
        isOpen={activeKeypad !== null}
        onClose={() => setActiveKeypad(null)}
        onConfirm={handleKeypadConfirm}
        initialValue={(activeKeypad ? (meta[activeKeypad.field] as number) : 0) || 0}
        label={activeKeypad?.label || ''}
        unit={activeKeypad?.unit || ''}
      />
    </div>
  );
};

export default TestSetup;
