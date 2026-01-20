import { useState, useEffect } from 'react';
import { TouchButton } from '@/components/ui/TouchButton';
import { Slider } from '@/components/ui/slider';
import { Settings2, Save, RotateCcw, CircleDot, Gauge, Target, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useParametersControl, TestParameters } from '@/hooks/useApi';
import { toast } from 'sonner';

const defaultParameters: TestParameters = {
  pipe_diameter: 300,
  pipe_length: 300,
  deflection_percent: 3,
  test_speed: 50,
  max_stroke: 150,
  max_force: 50,
};

const TestSetup = () => {
  const { t } = useLanguage();
  const { parameters: savedParams, isLoading, setParameters } = useParametersControl();
  const [parameters, setLocalParameters] = useState<TestParameters>(defaultParameters);

  // Load saved parameters
  useEffect(() => {
    if (savedParams) {
      setLocalParameters(prev => ({
        ...prev,
        ...savedParams,
      }));
    }
  }, [savedParams]);

  const handleSliderChange = (field: keyof TestParameters, values: number[]) => {
    setLocalParameters(prev => ({ ...prev, [field]: values[0] }));
  };

  const handleSave = () => {
    setParameters.mutate(parameters);
  };

  const handleReset = () => {
    setLocalParameters(defaultParameters);
    toast.info(t('testSetup.reset'));
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
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
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
      </div>

      {/* ISO Note */}
      <div className="industrial-card p-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Target className="w-6 h-6 text-primary flex-shrink-0" />
        {t('testSetup.isoNote')}
      </div>
    </div>
  );
};

export default TestSetup;
