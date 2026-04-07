import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useParametersControl } from '@/hooks/useApi';
import { TouchButton } from '@/components/ui/TouchButton';
import { NumericKeypad } from '@/components/ui/NumericKeypad';
import { VirtualKeyboard } from '@/components/ui/VirtualKeyboard';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Settings2, Save, Plus, ChevronRight, ChevronLeft, Check, Users, FolderOpen, Package, Trash2, Building2, FlaskConical
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const ANGLES = [0, 40, 80];
const PRESSURE_OPTIONS = ['PN1', 'PN6', 'PN10', 'PN16', 'PN20', 'PN25', 'PN32'];
const SN_OPTIONS = [1250, 2500, 5000, 10000, 12500];

const TestSetup = () => {
  const { t } = useLanguage();
  const { setParameters } = useParametersControl();

  // Navigation: clients → projects → samples → detail
  const [level, setLevel] = useState<'clients' | 'projects' | 'samples' | 'detail' | 'wizard'>(() => (localStorage.getItem('ts_level') as any) || 'clients');
  const [testType, setTestType] = useState<'stiffness1' | 'stiffness3' | 'crack' | 'fracture'>(() => (localStorage.getItem('testType') as any) || 'stiffness1');
  const [wizardStep, setWizardStep] = useState(1);
  const [editingSampleId, setEditingSampleId] = useState<number | null>(null);

  // Data
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedSample, setSelectedSample] = useState<any>(null);

  // Dialogs
  const [showNewDialog, setShowNewDialog] = useState<'client' | 'project' | null>(null);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('external');  // New clients are always external
  const [newPO, setNewPO] = useState('');

  // Wizard data
  const [sampleData, setSampleData] = useState({
    sample_id: '', operator: '', pipe_diameter: 400, pipe_length: 300,
    deflection_percent: 5.0, lot_number: '', product_id: '',
    nominal_diameter: 0, nominal_weight: 0, pressure_class: '',
    target_sn_class: 5000, num_positions: 3,
    crack_stage1_percent: 12.0, crack_stage2_percent: 17.0, fracture_max_percent: 50.0,
  });
  const [positions, setPositions] = useState([
    { position: 1, angle: 0, h_id: 0, v_id: 0, wall_thickness: 0, ring_length: 300 },
    { position: 2, angle: 40, h_id: 0, v_id: 0, wall_thickness: 0, ring_length: 300 },
    { position: 3, angle: 80, h_id: 0, v_id: 0, wall_thickness: 0, ring_length: 300 },
  ]);

  // Keypads
  const [numKeypad, setNumKeypad] = useState<{ field: string; label: string; value: number } | null>(null);
  const [showKb, setShowKb] = useState(false);
  const [textKb, setTextKb] = useState<{ field: string; value: string } | null>(null);
  const kbValueRef = useRef('');

  // Persist navigation state
  useEffect(() => { localStorage.setItem('ts_level', level); }, [level]);
  useEffect(() => { if (selectedClient) localStorage.setItem('ts_client', JSON.stringify(selectedClient)); }, [selectedClient]);
  useEffect(() => { if (selectedProject) localStorage.setItem('ts_project', JSON.stringify(selectedProject)); }, [selectedProject]);

  // === Load ===
  useEffect(() => {
    // Restore saved selections
    try {
      const savedClient = localStorage.getItem('ts_client');
      const savedProject = localStorage.getItem('ts_project');
      if (savedClient) { const c = JSON.parse(savedClient); setSelectedClient(c); loadProjects(c.id); }
      if (savedProject) { const p = JSON.parse(savedProject); setSelectedProject(p); loadSamples(p.id); }
    } catch(e) {}

    fetch('/api/samples/clients').then(r => r.json()).then(d => {
      const list = d.clients || [];
      // Ensure QC Internal always exists
      if (!list.find((c: any) => c.client_type === 'internal')) {
        fetch('/api/samples/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'QC Internal', client_type: 'internal' }) })
          .then(r => r.json()).then(qc => setClients([qc, ...list]));
      } else {
        // Put QC Internal first
        const sorted = [...list].sort((a: any, b: any) => a.client_type === 'internal' ? -1 : 1);
        setClients(sorted);
      }
    });
    // Restore test_mode to PLC from localStorage
    const savedType = localStorage.getItem('testType') || 'stiffness1';
    setTestType(savedType as any);
    const modeMap: Record<string, number> = { stiffness1: 0, stiffness3: 0, crack: 1, fracture: 3 };
    const npMap: Record<string, number> = { stiffness1: 1, stiffness3: 3, crack: 1, fracture: 1 };
    fetch('/api/parameters', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ test_mode: modeMap[savedType] || 0 }) });
    fetch('/api/test-metadata', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ num_positions: npMap[savedType] || 1, angles: npMap[savedType] === 3 ? [0,40,80] : [0] }) });
    fetch('/api/samples/active').then(r => r.json()).then(d => {
      if (d.sample_id) fetch(`/api/samples/${d.sample_id}`).then(r => r.json()).then(setSelectedSample).catch(() => {});
    });
  }, []);

  // === Actions ===
  const loadProjects = (cid: number) => fetch(`/api/samples/projects/${cid}`).then(r => r.json()).then(d => setProjects(d.projects || []));
  const loadSamples = (pid: number) => fetch(`/api/samples/list/${pid}`).then(r => r.json()).then(d => setSamples(d.samples || []));

  const selectSample = (s: any) => {
    setSelectedSample(s);
    fetch(`/api/samples/active/${s.id}`, { method: 'POST' });
    fetch('/api/parameters', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipe_diameter: s.pipe_diameter, pipe_length: s.pipe_length, deflection_percent: s.deflection_percent, target_sn_class: s.target_sn_class }),
    });

    // Auto-pick best stiffness mode based on available measurements:
    // 3-position is preferred when all 3 are valid; otherwise fall back to 1-position.
    // Don't override Crack/Fracture if the user explicitly chose them.
    const validCount = (s.positions || []).filter((p: any) => p && p.h_id && p.v_id && p.wall_thickness).length;
    const currentType = (localStorage.getItem('testType') || 'stiffness1') as typeof testType;
    const newType: typeof testType =
      (currentType === 'crack' || currentType === 'fracture')
        ? currentType
        : (validCount >= 3 ? 'stiffness3' : 'stiffness1');
    setTestType(newType);
    localStorage.setItem('testType', newType);
    const mode = newType === 'fracture' ? 3 : newType === 'crack' ? 1 : 0;
    fetch('/api/parameters', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_mode: mode }),
    });

    const np = newType === 'stiffness3' ? 3 : 1;
    fetch('/api/test-metadata', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sample_id: s.sample_id, operator: s.operator, lot_number: s.lot_number, product_id: s.product_id,
        nominal_diameter: s.nominal_diameter, nominal_weight: s.nominal_weight,
        pressure_class: s.pressure_class, stiffness_class: s.stiffness_class,
        project_name: selectedProject?.name, customer_name: selectedClient?.name, po_number: selectedProject?.po_number,
        num_positions: np, angles: np === 3 ? [0, 40, 80] : [0],
        positions: (s.positions || []).map((p: any) => ({ position: p.position, angle: p.angle, h_id: p.h_id, v_id: p.v_id, wall_thickness: p.wall_thickness, ring_length: p.ring_length })),
      }),
    });
  };

  const createItem = () => {
    if (!newName) return;
    if (showNewDialog === 'client') {
      fetch('/api/samples/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, client_type: newType }) })
        .then(r => r.json()).then(c => { setClients(prev => [c, ...prev]); setNewName(''); setShowNewDialog(null); });
    } else if (showNewDialog === 'project' && selectedClient) {
      fetch('/api/samples/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: selectedClient.id, name: newName, po_number: newPO }) })
        .then(r => r.json()).then(p => { setProjects(prev => [p, ...prev]); setNewName(''); setNewPO(''); setShowNewDialog(null); });
    }
  };

  const saveSample = () => {
    if (!selectedProject) return;
    // Always send all 3 positions. Backend MERGES — positions not in the list are preserved.
    // num_positions is no longer a per-sample setting; the user picks 1P/3P at test time.
    const posData = positions;
    const payload = { ...sampleData, num_positions: 3, positions: posData };
    const finishWith = (id: number) => {
      loadSamples(selectedProject.id);
      fetch(`/api/samples/${id}`).then(r => r.json()).then(s => {
        selectSample(s); setLevel('samples'); setWizardStep(1); setEditingSampleId(null);
      });
    };
    if (editingSampleId) {
      fetch('/api/samples/' + editingSampleId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json()).then(result => finishWith(result.id));
    } else {
      fetch('/api/samples/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, project_id: selectedProject.id }),
      }).then(r => r.json()).then(result => finishWith(result.id));
    }
  };

  const openEditWizard = () => {
    if (!selectedSample) return;
    setSampleData({
      sample_id: selectedSample.sample_id || '', operator: selectedSample.operator || '',
      pipe_diameter: selectedSample.pipe_diameter || 400, pipe_length: selectedSample.pipe_length || 300,
      deflection_percent: selectedSample.deflection_percent || 5.0, lot_number: selectedSample.lot_number || '',
      product_id: selectedSample.product_id || '', nominal_diameter: selectedSample.nominal_diameter || 0,
      nominal_weight: selectedSample.nominal_weight || 0, pressure_class: selectedSample.pressure_class || '',
      target_sn_class: selectedSample.target_sn_class || 5000, num_positions: selectedSample.num_positions || 3,
      crack_stage1_percent: selectedSample.crack_stage1_percent || 12.0, crack_stage2_percent: selectedSample.crack_stage2_percent || 17.0, fracture_max_percent: selectedSample.fracture_max_percent || 50.0,
    });
    const newPos = [
      { position: 1, angle: 0, h_id: 0, v_id: 0, wall_thickness: 0, ring_length: 300 },
      { position: 2, angle: 40, h_id: 0, v_id: 0, wall_thickness: 0, ring_length: 300 },
      { position: 3, angle: 80, h_id: 0, v_id: 0, wall_thickness: 0, ring_length: 300 },
    ];
    (selectedSample.positions || []).forEach((p: any) => { const i = p.position - 1; if (i >= 0 && i < 3) newPos[i] = { ...newPos[i], h_id: p.h_id || 0, v_id: p.v_id || 0, wall_thickness: p.wall_thickness || 0, ring_length: p.ring_length || 300 }; });
    setPositions(newPos);
    setEditingSampleId(selectedSample.id);
    setLevel('wizard'); setWizardStep(2);
  };

  const setTestMode = (type: typeof testType) => {
    setTestType(type);
    localStorage.setItem('testType', type);
    const mode = type === 'fracture' ? 3 : type === 'crack' ? 1 : 0;
    const np = type === 'stiffness3' ? 3 : 1;
    fetch('/api/parameters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ test_mode: mode }) });
    fetch('/api/test-metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ num_positions: np, angles: np === 3 ? [0, 40, 80] : [0] }) });
  };

  // === Wizard ===
  // Steps: 1=Client/Project, 2=Sample Info, 3=Sliders, 4=All Measurements (single page), 5=Review
  const totalSteps = 5;

  const renderWizard = () => {
    if (wizardStep === 1) return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Client & Project</h2>
        <p className="text-sm text-muted-foreground">Client: <span className="font-bold text-foreground">{selectedClient?.name}</span></p>
        <p className="text-sm text-muted-foreground">Project: <span className="font-bold text-foreground">{selectedProject?.name}</span></p>
      </div>
    );
    if (wizardStep === 2) return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Sample Info</h2>
        <div className="grid grid-cols-2 gap-2">
          {['sample_id', 'operator', 'lot_number', 'product_id'].map(f => (
            <button key={f} onClick={() => { kbValueRef.current = (sampleData as any)[f] || ''; setTextKb({ field: f, value: (sampleData as any)[f] || '' }); setShowKb(true); }}
              className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border min-h-[52px]">
              <span className="text-sm text-muted-foreground">{f.replace('_', ' ')}</span>
              <span className="font-mono font-bold text-base">{(sampleData as any)[f] || '-'}</span>
            </button>
          ))}
          {[{ f: 'nominal_diameter', l: 'Nom. Dia (mm)' }, { f: 'nominal_weight', l: 'Weight (kg/m)' }].map(({ f, l }) => (
            <button key={f} onClick={() => setNumKeypad({ field: f, label: l, value: (sampleData as any)[f] || 0 })}
              className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border min-h-[52px]">
              <span className="text-sm text-muted-foreground">{l}</span>
              <span className="font-mono font-bold text-base">{(sampleData as any)[f] || '-'}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs text-muted-foreground">Pressure</label>
            <Select value={sampleData.pressure_class || '_none_'} onValueChange={v => setSampleData(prev => ({ ...prev, pressure_class: v === '_none_' ? '' : v }))}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="_none_">—</SelectItem>{PRESSURE_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-xs text-muted-foreground">Target SN</label>
            <Select value={String(sampleData.target_sn_class)} onValueChange={v => setSampleData(prev => ({ ...prev, target_sn_class: parseInt(v) }))}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>{SN_OPTIONS.map(sn => <SelectItem key={sn} value={String(sn)}>SN {sn}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
    if (wizardStep === 3) return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Test Parameters</h2>
        {/* Crack & Fracture percentages */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Crack S1 %</span><span className="font-mono font-bold text-base">{sampleData.crack_stage1_percent}%</span></div>
            <Slider value={[sampleData.crack_stage1_percent]} onValueChange={v => setSampleData(prev => ({ ...prev, crack_stage1_percent: v[0] }))} min={5} max={30} step={0.5} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Crack S2 %</span><span className="font-mono font-bold text-base">{sampleData.crack_stage2_percent}%</span></div>
            <Slider value={[sampleData.crack_stage2_percent]} onValueChange={v => setSampleData(prev => ({ ...prev, crack_stage2_percent: v[0] }))} min={10} max={35} step={0.5} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Fracture Max %</span><span className="font-mono font-bold text-base">{sampleData.fracture_max_percent}%</span></div>
            <Slider value={[sampleData.fracture_max_percent]} onValueChange={v => setSampleData(prev => ({ ...prev, fracture_max_percent: v[0] }))} min={10} max={80} step={1} />
          </div>
        </div>
        {[
          { f: 'pipe_diameter', l: 'Pipe Diameter', min: 50, max: 2000, step: 50, u: 'mm' },
          { f: 'pipe_length', l: 'Pipe Length', min: 100, max: 500, step: 10, u: 'mm' },
          { f: 'deflection_percent', l: 'Deflection %', min: 1, max: 10, step: 0.5, u: '%' },
        ].map(s => (
          <div key={s.f} className="space-y-1">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{s.l}</span><span className="font-mono font-bold text-lg">{(sampleData as any)[s.f]} {s.u}</span></div>
            <Slider value={[(sampleData as any)[s.f]]} onValueChange={v => setSampleData(prev => ({ ...prev, [s.f]: v[0] }))} min={s.min} max={s.max} step={s.step} />
          </div>
        ))}
      </div>
    );
    if (wizardStep === 4) {
      // All measurements on one page, grouped by attribute (entity-based entry).
      // Workflow: position the sample horizontal → measure all H_ID at once → rotate vertical → measure V_ID, etc.
      // Always show 3 columns; user fills what they have. Test type (1P/3P) is chosen later from main page.
      const posCount = 3;
      const visibleIdx = Array.from({ length: posCount }, (_, i) => i);
      const ATTRS: { f: 'h_id' | 'v_id' | 'wall_thickness' | 'ring_length'; l: string; icon: string }[] = [
        { f: 'h_id', l: 'Horizontal ID', icon: '↔' },
        { f: 'v_id', l: 'Vertical ID', icon: '↕' },
        { f: 'wall_thickness', l: 'Wall Thickness', icon: '▦' },
        { f: 'ring_length', l: 'Ring Length', icon: '⊏⊐' },
      ];
      return (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">📐 Measurements (mm)</h2>
          {posCount === 3 && (
            <div className="grid gap-1 text-xs text-muted-foreground" style={{ gridTemplateColumns: '1fr repeat(3, 1fr)' }}>
              <span></span>
              {visibleIdx.map(i => <span key={i} className="text-center font-bold text-foreground">{ANGLES[i]}°</span>)}
            </div>
          )}
          {ATTRS.map(({ f, l, icon }) => (
            <div key={f} className="space-y-1">
              <div className="text-sm font-bold flex items-center gap-2"><span className="text-base">{icon}</span>{l}</div>
              <div className="grid gap-2" style={{ gridTemplateColumns: posCount === 3 ? '1fr 1fr 1fr' : '1fr' }}>
                {visibleIdx.map(i => {
                  const pos = positions[i];
                  return (
                    <button
                      key={i}
                      onClick={() => setNumKeypad({ field: `pos_${i}_${f}`, label: `${l} — ${ANGLES[i]}°`, value: (pos as any)[f] || 0 })}
                      className="flex items-center justify-center p-3 bg-secondary/30 rounded-lg border border-border min-h-[52px] font-mono font-bold text-lg"
                    >
                      {(pos as any)[f] || '-'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2"><Check className="w-5 h-5 text-success" /> Review</h2>
        <div className="grid grid-cols-2 gap-2 text-base">
          {[['Sample', sampleData.sample_id], ['Operator', sampleData.operator], ['Diameter', sampleData.pipe_diameter + 'mm'], ['Target SN', 'SN ' + sampleData.target_sn_class], ['Positions', sampleData.num_positions], ['Deflection', sampleData.deflection_percent + '%'], ['Crack', sampleData.crack_stage1_percent + '% / ' + sampleData.crack_stage2_percent + '%'], ['Fracture', sampleData.fracture_max_percent + '%']].map(([k, v]) => (
            <div key={k as string} className="p-2 bg-secondary/20 rounded text-base"><span className="text-muted-foreground">{k}:</span> <span className="font-bold">{v}</span></div>
          ))}
        </div>
        {positions.slice(0, sampleData.num_positions).map((p, i) => (
          <div key={i} className="text-base p-2 bg-secondary/10 rounded">
            <span className="font-bold">{ANGLES[i]}°:</span> H={p.h_id || '-'} V={p.v_id || '-'} T={p.wall_thickness || '-'} L={p.ring_length}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-2 animate-slide-up overflow-hidden pb-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('nav.testSetup')}</h1>
        </div>
      </div>

      {/* Test Type Buttons - always visible except wizard.
          Each button checks the active sample has the data it needs. */}
      {level !== 'wizard' && (() => {
        const validPos = (selectedSample?.positions || []).filter(
          (p: any) => p && p.h_id && p.v_id && p.wall_thickness
        ).length;
        const has1 = validPos >= 1;
        const has3 = validPos >= 3;
        const buttons = [
          { type: 'stiffness1' as const, label: '1 Position', color: 'bg-blue-600', enabled: has1 },
          { type: 'stiffness3' as const, label: '3 Positions', color: 'bg-emerald-600', enabled: has3 },
          { type: 'crack' as const, label: 'Crack', color: 'bg-orange-500', enabled: has1 },
          { type: 'fracture' as const, label: 'Fracture', color: 'bg-red-600', enabled: has1 },
        ];
        return (
          <div className="flex gap-2">
            {buttons.map(b => (
              <button key={b.type}
                onClick={() => b.enabled && setTestMode(b.type)}
                disabled={!b.enabled}
                title={b.enabled ? '' : 'Sample missing required measurements'}
                className={`flex-1 min-h-[38px] text-sm font-bold rounded-lg transition-all ${
                  !b.enabled ? 'bg-secondary/20 text-muted-foreground/40 cursor-not-allowed' :
                  testType === b.type ? b.color + ' text-white shadow-lg' :
                  'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >{b.label}</button>
            ))}
          </div>
        );
      })()}

      {/* Breadcrumb Path */}
      {level !== 'wizard' && (
        <div className="flex items-center gap-1 text-sm px-1 flex-wrap">
          <button onClick={() => { setLevel("clients"); setSelectedClient(null); setSelectedProject(null); localStorage.removeItem("ts_client"); localStorage.removeItem("ts_project"); }} className={`px-2 py-1 rounded ${level === 'clients' ? 'font-bold text-primary' : 'text-muted-foreground hover:text-foreground'}`}>QC Internal</button>
          {selectedClient && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <button onClick={() => { loadProjects(selectedClient.id); setLevel('projects'); }} className={`px-2 py-1 rounded ${level === 'projects' ? 'font-bold text-primary' : 'text-muted-foreground hover:text-foreground'}`}>{selectedClient.name}</button>
            </>
          )}
          {selectedProject && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <button onClick={() => { loadSamples(selectedProject.id); setLevel('samples'); }} className={`px-2 py-1 rounded ${level === 'samples' || level === 'detail' ? 'font-bold text-primary' : 'text-muted-foreground hover:text-foreground'}`}>{selectedProject.name}</button>
            </>
          )}
          {level === 'detail' && selectedSample && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="px-2 py-1 font-bold text-primary">{selectedSample.sample_id}</span>
            </>
          )}
        </div>
      )}

      {/* === TREE NAVIGATION === */}
      {level === 'clients' && (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {/* QC Internal - always first */}
          {clients.filter((c: any) => c.client_type === 'internal').map(c => (
            <div key={c.id} onClick={() => { setSelectedClient(c); loadProjects(c.id); setLevel('projects'); }}
              className="industrial-card p-4 cursor-pointer hover:ring-2 hover:ring-info/50 flex items-center justify-between min-h-[64px] border-info/30 bg-info/5">
              <div className="flex items-center gap-3">
                <FlaskConical className="w-7 h-7 text-info" />
                <span className="font-bold text-lg">QC Internal</span>
              </div>
              <ChevronRight className="w-6 h-6 text-muted-foreground" />
            </div>
          ))}

          {/* External Clients */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-semibold text-muted-foreground">Clients</span>
            <TouchButton variant="outline" size="sm" onClick={() => setShowNewDialog('client')} className="px-4 min-h-[44px]"><Plus className="w-5 h-5 mr-1" /> Add Client</TouchButton>
          </div>
          {clients.filter((c: any) => c.client_type !== 'internal').map(c => (
            <div key={c.id} onClick={() => { setSelectedClient(c); loadProjects(c.id); setLevel('projects'); }}
              className="industrial-card p-4 cursor-pointer hover:ring-1 hover:ring-warning/50 flex items-center justify-between min-h-[64px]">
              <div className="flex items-center gap-3">
                <Building2 className="w-7 h-7 text-warning" />
                <span className="font-bold text-lg">{c.name}</span>
              </div>
              <ChevronRight className="w-6 h-6 text-muted-foreground" />
            </div>
          ))}
          {clients.filter((c: any) => c.client_type !== 'internal').length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">No external clients yet</p>
          )}
        </div>
      )}

      {level === 'projects' && selectedClient && (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          <div className="flex items-center justify-between">
            <TouchButton variant="ghost" size="sm" onClick={() => { setLevel("clients"); setSelectedClient(null); setSelectedProject(null); localStorage.removeItem("ts_client"); localStorage.removeItem("ts_project"); }} className="px-3 min-h-[40px] text-base"><ChevronLeft className="w-5 h-5 mr-1" /> Back</TouchButton>
            <TouchButton variant="outline" size="sm" onClick={() => setShowNewDialog('project')} className="px-4 min-h-[44px]"><Plus className="w-5 h-5 mr-1" /> Add Project</TouchButton>
          </div>
          {projects.map(p => (
            <div key={p.id} onClick={() => { setSelectedProject(p); loadSamples(p.id); setLevel('samples'); }}
              className="industrial-card p-4 cursor-pointer hover:ring-1 hover:ring-primary/50 flex items-center justify-between min-h-[60px]">
              <div>
                <span className="font-bold text-base"><FolderOpen className="w-4 h-4 inline mr-1" />{p.name}</span>
                {p.po_number && <span className="text-xs text-muted-foreground ml-2">PO: {p.po_number}</span>}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          ))}
          {projects.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No projects yet</p>}
        </div>
      )}

      {level === 'samples' && selectedProject && (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          <div className="flex items-center justify-between">
            <TouchButton variant="ghost" size="sm" onClick={() => setLevel('projects')} className="px-3 min-h-[40px] text-base"><ChevronLeft className="w-5 h-5 mr-1" /> Back</TouchButton>
            <TouchButton variant="primary" size="sm" onClick={() => { setEditingSampleId(null); setLevel('wizard'); setWizardStep(2); }} className="px-4 min-h-[44px]"><Plus className="w-5 h-5 mr-1" /> New Sample</TouchButton>
          </div>
          {samples.map(s => (
            <div key={s.id} onClick={() => { selectSample(s); }}
              className={`industrial-card p-4 cursor-pointer transition-all min-h-[60px] ${selectedSample?.id === s.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:ring-1 hover:ring-primary/50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold">{s.sample_id}</span>
                  <span className="text-sm text-muted-foreground ml-2">DN{s.pipe_diameter} | SN{s.target_sn_class}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{(s.positions || []).filter((p: any) => p && p.h_id && p.v_id && p.wall_thickness).length}/3</Badge>
                  {selectedSample?.id === s.id && <Check className="w-5 h-5 text-success" />}
                  <TouchButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); selectSample(s); setLevel('detail'); }} className="px-3 min-h-[44px]">
                    <ChevronRight className="w-5 h-5" />
                  </TouchButton>
                </div>
              </div>
            </div>
          ))}
          {samples.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No samples yet</p>}
        </div>
      )}

      {level === 'detail' && selectedSample && (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          <TouchButton variant="ghost" size="sm" onClick={() => setLevel('samples')} className="px-3 min-h-[40px] text-base self-start"><ChevronLeft className="w-5 h-5 mr-1" /> Back</TouchButton>
          <div className="industrial-card p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{selectedSample.sample_id}</h2>
              <Badge>{(selectedSample.positions || []).filter((p: any) => p && p.h_id && p.v_id && p.wall_thickness).length}/3 | SN{selectedSample.target_sn_class}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[['Client', selectedSample.client_name], ['Project', selectedSample.project_name], ['Operator', selectedSample.operator], ['Lot', selectedSample.lot_number], ['Product', selectedSample.product_id], ['Pressure', selectedSample.pressure_class]].map(([k, v]) => (
                <div key={k as string} className="p-2 bg-secondary/20 rounded"><span className="text-muted-foreground">{k}:</span> <span className="font-bold">{(v as string) || '-'}</span></div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm text-center">
              <div className="p-2 bg-secondary/20 rounded"><p className="text-muted-foreground text-xs">Diameter</p><p className="font-mono font-bold text-lg">{selectedSample.pipe_diameter} mm</p></div>
              <div className="p-2 bg-secondary/20 rounded"><p className="text-muted-foreground text-xs">Length</p><p className="font-mono font-bold text-lg">{selectedSample.pipe_length} mm</p></div>
              <div className="p-2 bg-secondary/20 rounded"><p className="text-muted-foreground text-xs">Deflection</p><p className="font-mono font-bold text-lg">{selectedSample.deflection_percent}%</p></div>
            </div>
            {selectedSample.positions?.length > 0 && (
              <table className="w-full text-sm border border-border">
                <thead><tr className="bg-secondary/30">
                  <th className="border border-border px-3 py-2">Angle</th><th className="border border-border px-3 py-2">H_ID</th><th className="border border-border px-3 py-2">V_ID</th><th className="border border-border px-3 py-2">Thick</th><th className="border border-border px-3 py-2">Length</th>
                </tr></thead>
                <tbody>{selectedSample.positions.map((p: any) => (
                  <tr key={p.position}><td className="border border-border px-3 py-2 text-center font-bold">{p.angle}°</td><td className="border border-border px-3 py-2 text-center font-mono font-bold">{p.h_id || '-'}</td><td className="border border-border px-3 py-2 text-center font-mono font-bold">{p.v_id || '-'}</td><td className="border border-border px-3 py-2 text-center font-mono font-bold">{p.wall_thickness || '-'}</td><td className="border border-border px-3 py-2 text-center font-mono font-bold">{p.ring_length || '-'}</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
          <div className="flex gap-2">
            <TouchButton variant="primary" size="sm" onClick={openEditWizard} className="flex-1 min-h-[44px]">Edit</TouchButton>
            <TouchButton variant="destructive" size="sm" onClick={() => {
              fetch('/api/samples/' + selectedSample.id, { method: 'DELETE' }).then(() => { setSelectedSample(null); if (selectedProject) loadSamples(selectedProject.id); setLevel('samples'); });
            }} className="min-h-[44px] px-4"><Trash2 className="w-5 h-5" /></TouchButton>
          </div>
        </div>
      )}

      {level === 'wizard' && (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }, (_, i) => (<div key={i} className={`flex-1 h-2 rounded-full ${i + 1 <= wizardStep ? 'bg-primary' : 'bg-secondary/30'}`} />))}
            <span className="text-xs text-muted-foreground ml-2">{wizardStep}/{totalSteps}</span>
          </div>
          <div className="flex-1 industrial-card p-3 overflow-y-auto">{renderWizard()}</div>
          <div className="flex gap-2">
            <TouchButton variant="outline" size="sm" onClick={() => { if (wizardStep <= 2) { setLevel('samples'); setWizardStep(1); } else setWizardStep(p => p - 1); }} className="flex-1 min-h-[44px]">
              <ChevronLeft className="w-5 h-5 mr-1" /> {wizardStep <= 2 ? 'Cancel' : 'Back'}
            </TouchButton>
            {wizardStep < totalSteps ? (
              <TouchButton variant="primary" size="sm" onClick={() => setWizardStep(p => p + 1)} className="flex-1 min-h-[44px]">Next <ChevronRight className="w-5 h-5 ml-1" /></TouchButton>
            ) : (
              <TouchButton variant="success" size="sm" onClick={saveSample} className="flex-1 min-h-[44px]"><Save className="w-5 h-5 mr-1" /> Save</TouchButton>
            )}
          </div>
        </div>
      )}

      {/* Active Sample - always visible at bottom */}
      {selectedSample && level !== 'wizard' && level !== 'detail' && (
        <div className="industrial-card p-2 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-primary">✓ Active: {selectedSample.sample_id}</span>
            <span>DN{selectedSample.pipe_diameter} | SN{selectedSample.target_sn_class} | {(selectedSample.positions || []).filter((p: any) => p && p.h_id && p.v_id && p.wall_thickness).length}/3</span>
          </div>
        </div>
      )}

      {/* New Client/Project - Full screen with keyboard */}
      {showNewDialog !== null && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60">
          <div className="bg-card w-full max-w-lg p-5 rounded-xl border shadow-2xl space-y-3">
            <h2 className="text-xl font-bold">{showNewDialog === 'client' ? 'New Client' : `New Project — ${selectedClient?.name}`}</h2>
            
            <div className="rounded-lg border-2 border-primary px-4 py-3 text-xl font-mono min-h-[52px] bg-secondary/20">
              {newName || <span className="text-muted-foreground text-base">Enter name...</span>}
            </div>
            


            <VirtualKeyboard
              value={newName}
              onChange={v => setNewName(v)}
              onClose={() => {}}
            />
            
            <div className="flex gap-2">
              <TouchButton variant="outline" size="sm" onClick={() => { setShowNewDialog(null); setNewName(''); }} className="flex-1 min-h-[48px]">Cancel</TouchButton>
              <TouchButton variant="primary" size="sm" onClick={createItem} disabled={!newName} className="flex-1 min-h-[48px]">Create</TouchButton>
            </div>
          </div>
        </div>
      )}

      {/* Keypads */}
      <NumericKeypad isOpen={numKeypad !== null} onClose={() => setNumKeypad(null)}
        onConfirm={(v) => { if (numKeypad) { if (numKeypad.field.startsWith('pos_')) { const p = numKeypad.field.split('_'); setPositions(prev => prev.map((pos, i) => i === parseInt(p[1]) ? { ...pos, [p.slice(2).join('_')]: v } : pos)); } else setSampleData(prev => ({ ...prev, [numKeypad.field]: v })); } setNumKeypad(null); }}
        initialValue={numKeypad?.value || 0} label={numKeypad?.label || ''} unit="mm" />
      {showKb && textKb && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={(e) => {
          if (e.target === e.currentTarget) {
            const val = kbValueRef.current;
            const field = textKb?.field || '';
            if (field === '_newName') setNewName(val);
            else if (field === '_newPO') setNewPO(val);
            else if (field) setSampleData(prev => ({ ...prev, [field]: val }));
            setShowKb(false);
          }
        }}>
          <div className="bg-card w-full max-w-md p-4 rounded-xl border shadow-2xl">
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-base">{textKb.field.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())}</span>
              <TouchButton variant="primary" size="sm" onClick={() => {
                const val = kbValueRef.current;
                const field = textKb.field;
                if (field === '_newName') setNewName(val);
                else if (field === '_newPO') setNewPO(val);
                else setSampleData(prev => ({ ...prev, [field]: val }));
                setShowKb(false);
              }} className="px-4 min-h-[40px]">Done</TouchButton>
            </div>
            <div className="w-full rounded-md border border-primary px-4 py-3 mb-3 text-xl font-mono bg-secondary/20 min-h-[50px]">
              {textKb.value || <span className="text-muted-foreground">...</span>}
            </div>
            <VirtualKeyboard
              value={textKb.value}
              onChange={v => {
                kbValueRef.current = v;
                setTextKb(prev => prev ? { ...prev, value: v } : null);
              }}
              onClose={() => {
                const val = kbValueRef.current;
                const field = textKb.field;
                if (field === '_newName') setNewName(val);
                else if (field === '_newPO') setNewPO(val);
                else setSampleData(prev => ({ ...prev, [field]: val }));
                setShowKb(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSetup;
