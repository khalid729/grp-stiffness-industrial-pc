import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TouchButton } from '@/components/ui/TouchButton';
import { Slider } from '@/components/ui/slider';
import { 
  Settings2, 
  Save, 
  RotateCcw, 
  CircleDot, 
  Ruler, 
  Gauge, 
  Zap,
  ArrowDownUp,
  Target
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface TestParameters {
  pipe_diameter: number;
  pipe_length: number;
  deflection_percent: number;
  test_speed: number;
  max_stroke: number;
  max_force: number;
}

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
  const [parameters, setParameters] = useState<TestParameters>(defaultParameters);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: keyof TestParameters, value: number) => {
    setParameters(prev => ({ ...prev, [field]: value }));
  };

  const handleSliderChange = (field: keyof TestParameters, values: number[]) => {
    setParameters(prev => ({ ...prev, [field]: values[0] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success(t('testSetup.saved'));
    setIsSaving(false);
  };

  const handleReset = () => {
    setParameters(defaultParameters);
    toast.info(t('testSetup.reset'));
  };

  // Calculate target deflection
  const targetDeflection = (parameters.pipe_diameter * parameters.deflection_percent) / 100;

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-slide-up">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Settings2 className="w-6 h-6 text-primary" />
          <h1 className="text-xl lg:text-2xl font-bold">{t('nav.testSetup')}</h1>
        </div>
        <div className="flex gap-3">
          <TouchButton
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {t('testSetup.resetBtn')}
          </TouchButton>
          <TouchButton
            variant="success"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="w-5 h-5" />
            {t('testSetup.saveBtn')}
          </TouchButton>
        </div>
      </div>

      {/* Calculated Values */}
      <div className="industrial-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('testSetup.targetDeflection')}</span>
          <span className="text-2xl font-mono font-bold text-primary">
            {targetDeflection.toFixed(2)} mm
          </span>
        </div>
      </div>

      {/* Parameters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipe Parameters */}
        <Card className="industrial-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CircleDot className="w-5 h-5 text-info" />
              {t('testSetup.pipeParams')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pipe Diameter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">{t('testSetup.pipeDiameter')}</Label>
                <span className="font-mono text-lg font-bold">{parameters.pipe_diameter} mm</span>
              </div>
              <Slider
                value={[parameters.pipe_diameter]}
                onValueChange={(v) => handleSliderChange('pipe_diameter', v)}
                min={50}
                max={1000}
                step={10}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50 mm</span>
                <span>1000 mm</span>
              </div>
            </div>

            {/* Pipe Length */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">{t('testSetup.pipeLength')}</Label>
                <span className="font-mono text-lg font-bold">{parameters.pipe_length} mm</span>
              </div>
              <Slider
                value={[parameters.pipe_length]}
                onValueChange={(v) => handleSliderChange('pipe_length', v)}
                min={100}
                max={500}
                step={10}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>100 mm</span>
                <span>500 mm</span>
              </div>
            </div>

            {/* Deflection Percent */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">{t('testSetup.deflectionPercent')}</Label>
                <span className="font-mono text-lg font-bold">{parameters.deflection_percent}%</span>
              </div>
              <Slider
                value={[parameters.deflection_percent]}
                onValueChange={(v) => handleSliderChange('deflection_percent', v)}
                min={1}
                max={10}
                step={0.5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1%</span>
                <span>10%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Parameters */}
        <Card className="industrial-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gauge className="w-5 h-5 text-warning" />
              {t('testSetup.testParams')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Test Speed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">{t('testSetup.testSpeed')}</Label>
                <span className="font-mono text-lg font-bold">{parameters.test_speed} mm/min</span>
              </div>
              <Slider
                value={[parameters.test_speed]}
                onValueChange={(v) => handleSliderChange('test_speed', v)}
                min={1}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 mm/min</span>
                <span>100 mm/min</span>
              </div>
            </div>

            {/* Max Stroke */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">{t('testSetup.maxStroke')}</Label>
                <span className="font-mono text-lg font-bold">{parameters.max_stroke} mm</span>
              </div>
              <Slider
                value={[parameters.max_stroke]}
                onValueChange={(v) => handleSliderChange('max_stroke', v)}
                min={50}
                max={300}
                step={10}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50 mm</span>
                <span>300 mm</span>
              </div>
            </div>

            {/* Max Force */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">{t('testSetup.maxForce')}</Label>
                <span className="font-mono text-lg font-bold">{parameters.max_force} kN</span>
              </div>
              <Slider
                value={[parameters.max_force]}
                onValueChange={(v) => handleSliderChange('max_force', v)}
                min={10}
                max={100}
                step={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10 kN</span>
                <span>100 kN</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ISO Standard Info */}
      <div className="industrial-card p-4">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p>
            {t('testSetup.isoNote')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestSetup;
