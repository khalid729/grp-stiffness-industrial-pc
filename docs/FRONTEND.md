# Frontend Guide

Complete documentation for the React frontend application.

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool |
| React Router | 6.x | Routing |
| React Query | 5.x | Server state management |
| Socket.IO Client | 4.x | WebSocket communication |
| shadcn/ui | Latest | UI components |
| Tailwind CSS | 3.x | Styling |
| Recharts | 2.x | Charts |
| Sonner | Latest | Toast notifications |

---

## Project Structure

```
frontend/src/
├── components/
│   ├── ui/                  # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── TouchButton.tsx  # Touch-optimized button
│   │   ├── EStopButton.tsx  # Emergency stop button
│   │   └── ...
│   ├── layout/
│   │   └── PortraitLayout.tsx  # Main kiosk layout (1080x1920)
│   └── dashboard/
│       ├── StatusCard.tsx       # Force/Weight/Position/Deflection cards
│       ├── ForceDeflectionChart.tsx  # Real-time chart
│       ├── SafetyIndicators.tsx # Safety status indicators
│       ├── ModeToggle.tsx       # Local/Remote mode switch
│       └── TestStatusBadge.tsx  # Test status display
│
├── contexts/
│   ├── LanguageContext.tsx  # i18n (English/Arabic)
│   └── ThemeContext.tsx     # Light/Dark theme
│
├── hooks/
│   ├── useLiveData.ts       # Real-time WebSocket data
│   ├── useApi.ts            # React Query hooks
│   └── useStepControl.ts    # Step motor control
│
├── pages/
│   ├── Dashboard.tsx        # Main dashboard
│   ├── TestSetup.tsx        # Test configuration
│   ├── Alarms.tsx           # Alarm management
│   ├── History.tsx          # Test history (PDF/Excel download)
│   ├── ReportsExport.tsx   # USB export page
│   └── Settings.tsx         # System settings (Network, Theme, Language)
│
├── lib/
│   └── utils.ts             # Utility functions
│
├── index.css                # Tailwind + Light/Dark themes
├── App.tsx                  # Main app component
└── main.tsx                 # Entry point
```

---

## API Clients

### REST API Client

Located in `src/api/client.ts`:

```typescript
import { api } from '@/api/client';

// Get test parameters
const params = await api.getParameters();

// Set parameters
await api.setParameters({
  pipe_diameter: 200,
  pipe_length: 300,
  deflection_percent: 3.0
});

// Commands
await api.startTest();
await api.stopTest();
await api.goHome();

// Servo control
await api.enableServo();
await api.disableServo();
await api.resetAlarm();

// Clamp control
await api.lockUpper();
await api.lockLower();
await api.unlockAll();

// Reports
const tests = await api.getTests(page, pageSize);
const pdfUrl = api.getPdfReportUrl(testId);
const excelUrl = api.getExcelExportUrl(startDate, endDate);
```

### WebSocket Client

Located in `src/api/socket.ts`:

```typescript
import { socketClient } from '@/api/socket';

// Connect
socketClient.connect();

// Subscribe to events
const unsubscribe = socketClient.on<LiveData>('live_data', (data) => {
  console.log(data.actual_force);
});

// Jog control (low latency)
socketClient.jogForward(true);   // Start
socketClient.jogForward(false);  // Stop
socketClient.setJogSpeed(50);

// Disconnect
socketClient.disconnect();
```

---

## React Hooks

### useLiveData

Real-time data from PLC via WebSocket:

```typescript
import { useLiveData } from '@/hooks/useLiveData';

function Dashboard() {
  const { liveData, isConnected } = useLiveData();

  return (
    <div>
      <p>Force: {liveData.actual_force} kN</p>
      <p>Deflection: {liveData.actual_deflection} mm</p>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### useTestStatus

Convenient test status helper:

```typescript
import { useTestStatus } from '@/hooks/useLiveData';

function TestIndicator() {
  const { status, statusText, isTesting, isIdle, isComplete } = useTestStatus();

  return <span className={isTesting ? 'text-green-500' : ''}>{statusText}</span>;
}
```

### useJogControl

Jog control via WebSocket:

```typescript
import { useJogControl } from '@/hooks/useLiveData';

function JogButtons() {
  const { jogForward, jogBackward, setJogSpeed } = useJogControl();

  return (
    <>
      <button
        onMouseDown={() => jogForward(true)}
        onMouseUp={() => jogForward(false)}
      >
        Jog Down
      </button>
      <button
        onMouseDown={() => jogBackward(true)}
        onMouseUp={() => jogBackward(false)}
      >
        Jog Up
      </button>
    </>
  );
}
```

### useParameters

Get/set test parameters:

```typescript
import { useParameters, useSetParameters } from '@/hooks/useApi';

function TestSetup() {
  const { data: params, isLoading } = useParameters();
  const setParams = useSetParameters();

  const handleSave = () => {
    setParams.mutate({
      pipe_diameter: 200,
      deflection_percent: 3.0
    });
  };
}
```

### useCommands

Test control commands:

```typescript
import { useCommands } from '@/hooks/useApi';

function Controls() {
  const { startTest, stopTest, goHome } = useCommands();

  return (
    <>
      <button onClick={() => startTest.mutate()}>Start</button>
      <button onClick={() => stopTest.mutate()}>Stop</button>
      <button onClick={() => goHome.mutate()}>Home</button>
    </>
  );
}
```

### useServoControl

Servo motor control:

```typescript
import { useServoControl } from '@/hooks/useApi';

function ServoPanel() {
  const { enableServo, disableServo, resetAlarm } = useServoControl();

  return (
    <>
      <button onClick={() => enableServo.mutate()}>Enable</button>
      <button onClick={() => disableServo.mutate()}>Disable</button>
      <button onClick={() => resetAlarm.mutate()}>Reset Alarm</button>
    </>
  );
}
```

### useClampControl

Clamp control:

```typescript
import { useClampControl } from '@/hooks/useApi';

function ClampPanel() {
  const { lockUpper, lockLower, unlockAll } = useClampControl();

  return (
    <>
      <button onClick={() => lockUpper.mutate()}>Lock Upper</button>
      <button onClick={() => lockLower.mutate()}>Lock Lower</button>
      <button onClick={() => unlockAll.mutate()}>Unlock All</button>
    </>
  );
}
```

### useTests

Test history with pagination:

```typescript
import { useTests, useDeleteTest } from '@/hooks/useApi';

function Reports() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTests(page, 20);
  const deleteTest = useDeleteTest();

  return (
    <table>
      {data?.tests.map((test) => (
        <tr key={test.id}>
          <td>{test.sample_id}</td>
          <td>{test.ring_stiffness}</td>
          <td>
            <button onClick={() => deleteTest.mutate(test.id)}>Delete</button>
          </td>
        </tr>
      ))}
    </table>
  );
}
```

### useAlarms

Alarm management:

```typescript
import { useAlarms, useAcknowledgeAlarm } from '@/hooks/useApi';

function Alarms() {
  const { data } = useAlarms(true); // active only
  const ack = useAcknowledgeAlarm();

  return (
    <ul>
      {data?.alarms.map((alarm) => (
        <li key={alarm.id}>
          {alarm.message}
          <button onClick={() => ack.mutate({ id: alarm.id })}>Ack</button>
        </li>
      ))}
    </ul>
  );
}
```

### useUsbDevices

USB device detection with auto-polling:

```typescript
import { useUsbDevices } from @/hooks/useApi;

function UsbPanel() {
  const { devices, isLoading, refetch, ejectUsb } = useUsbDevices();

  return (
    <div>
      {devices.map(dev => (
        <div key={dev.path}>
          <span>{dev.label} - {dev.free_gb} GB free</span>
          <button onClick={() => ejectUsb.mutate(dev.path)}>Eject</button>
        </div>
      ))}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### useUsbExport

Export reports to USB drive:

```typescript
import { useUsbExport } from @/hooks/useApi;

function ExportButton() {
  const usbExport = useUsbExport();

  const handleExport = () => {
    usbExport.mutate({
      test_ids: [1, 2, 3],
      format: pdf,
      usb_path: /media/usb/sdb1,
      force_unit: N,
    });
  };

  return <button onClick={handleExport} disabled={usbExport.isPending}>Export</button>;
}
```

### useConnection

PLC connection status:

```typescript
import { useConnection } from '@/hooks/useApi';

function Settings() {
  const { status, reconnect } = useConnection();

  return (
    <div>
      <p>Status: {status.data?.connected ? 'Connected' : 'Disconnected'}</p>
      <p>IP: {status.data?.ip}</p>
      <button onClick={() => reconnect.mutate()}>Reconnect</button>
    </div>
  );
}
```

---

## TypeScript Interfaces

### LiveData

```typescript
// PLC CPU State
type PLCCpuState = 'run' | 'stop' | 'unknown';

// PLC Status
interface PLCStatus {
  connected: boolean;
  cpu_state: PLCCpuState;
  ip: string;
}

interface LiveData {
  actual_force: number;        // Current force (kN)
  actual_deflection: number;   // Current deflection (mm)
  target_deflection: number;   // Target deflection (mm)
  ring_stiffness: number;      // Calculated stiffness (kN/m2)
  force_at_target: number;     // Force at target deflection
  sn_class: number;            // SN classification
  test_status: number;         // -1 to 5
  test_passed: boolean;
  servo_ready: boolean;
  servo_error: boolean;
  at_home: boolean;
  lock_upper: boolean;
  lock_lower: boolean;
  actual_position: number;
  remote_mode: boolean;        // Remote/Local mode
  e_stop_active: boolean;      // E-Stop latched state
  connected: boolean;
  plc: PLCStatus;              // PLC connection & CPU state
}
```

### TestParameters

```typescript
interface TestParameters {
  pipe_diameter: number;      // mm
  pipe_length: number;        // mm
  deflection_percent: number; // %
  test_speed: number;         // mm/min
  max_stroke: number;         // mm
  max_force: number;          // kN
  connected: boolean;
}
```

### TestRecord

```typescript
interface TestRecord {
  id: number;
  sample_id: string | null;
  operator: string | null;
  test_date: string;          // ISO 8601
  pipe_diameter: number;
  pipe_length: number;
  deflection_percent: number;
  force_at_target: number | null;
  max_force: number | null;
  ring_stiffness: number | null;
  sn_class: number | null;
  passed: boolean;
  test_speed: number | null;
  duration: number | null;
  notes: string | null;
  data_points?: TestDataPoint[];
}
```

### UsbDevice

```typescript
interface UsbDevice {
  label: string;
  path: string;
  free_gb: number | null;
  device?: string;
  size?: string;
}
```

### Alarm

```typescript
interface Alarm {
  id: number;
  alarm_code: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  acknowledged: boolean;
  ack_timestamp: string | null;
  ack_by: string | null;
}
```

---

## Pages

### Dashboard

Main dashboard with real-time data display:

- Force/deflection gauges
- Live force-deflection chart
- Status indicators
- Quick action buttons

### TestSetup

Test configuration page:

- Pipe diameter input
- Pipe length input
- Deflection percentage
- Test speed
- Safety limits
- Save to PLC button

### ManualControl

Manual control panel:

- Jog up/down buttons (hold to move) - **Requires REMOTE mode**
- Jog speed slider
- Servo enable/disable - **Works in any mode**
- Clamp lock/unlock - **Works in any mode**
- Alarm reset - **Works in any mode**
- Emergency stop - **Always available**
- E-Stop active indicator with warning
- PLC STOP mode warning

**Mode Behavior:**
| Control | LOCAL Mode | REMOTE Mode |
|---------|------------|-------------|
| Jog Up/Down | Disabled (grayed) | Enabled |
| Enable/Disable | Enabled | Enabled |
| Reset Alarm | Enabled | Enabled |
| Lock/Unlock | Enabled | Enabled |
| E-Stop | Always Available | Always Available |

### Reports (History)

Test history and export:

- Paginated test list
- Filter by sample ID, operator, pass/fail
- Per-test download with PDF/Excel format picker dropdown
- Delete test records

### Reports Export (USB)

USB export page (accessible from Settings):

- USB device auto-detection with status indicator
- USB free space display
- Multi-select test list with Select All toggle
- Format toggle (PDF/Excel)
- Export to USB button (USB-only, no browser download)
- USB eject button for safe removal

### Alarms

Alarm management:

- Active alarms list
- Alarm history
- Acknowledge individual/all
- Severity indicators

### Settings

System configuration:

- PLC connection status
- Reconnect button
- System information

---

## Environment Variables

Create `.env` file in `frontend/`:

```env
# API endpoint
VITE_API_URL=http://localhost:8000

# Optional: WebSocket path
VITE_WS_PATH=/socket.io
```

---

## Building for Production

```bash
# Build
npm run build

# Preview production build
npm run preview

# Output directory: dist/
```

---

## UI Components (shadcn/ui)

The project uses shadcn/ui components. Add new components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add table
```

---

## State Management

The application uses a hybrid approach:

1. **React Query** - Server state (API data)
   - Automatic caching
   - Background refetching
   - Optimistic updates

2. **WebSocket State** - Real-time PLC data
   - Custom `useLiveData` hook
   - Direct state updates

3. **Local State** - UI state
   - `useState` for form inputs
   - Component-level state

---

## Error Handling

Toast notifications via Sonner:

```typescript
import { toast } from 'sonner';

// Success
toast.success('Test started');

// Error
toast.error('Failed to connect');

// Warning
toast.warning('Test stopped');

// Info
toast.info('Homing in progress...');
```

---

## Routing

React Router v6 configuration in `App.tsx`:

```typescript
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/test-setup" element={<TestSetup />} />
  <Route path="/manual" element={<ManualControl />} />
  <Route path="/reports" element={<Reports />} />
  <Route path="/alarms" element={<Alarms />} />
  <Route path="/settings" element={<Settings />} />
  <Route path="/reports-export" element={<ReportsExport />} />
</Routes>
```

---

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## Portrait/Kiosk Mode

The frontend is designed for a **1080x1920 portrait display** in kiosk mode.

### Layout Structure

```
┌─────────────────────────────────┐
│  Header                         │
│  - Page Title                   │
│  - PLC Status                   │
│  - Test Status                  │
├─────────────────────────────────┤
│  Safety & Machine Indicators    │
│  Mode Toggle    │  E-Stop       │
├─────────────────────────────────┤
│  Status Cards (4 columns)       │
│  Force | Weight | Pos | Defl    │
├─────────────────────────────────┤
│                                 │
│  Page Content                   │
│  (Dashboard, Settings, etc.)    │
│                                 │
├─────────────────────────────────┤
│  Bottom Navigation Bar          │
│  Dashboard|Setup|Alarms|History|Settings
└─────────────────────────────────┘
```

### Touch Optimization

- Minimum touch target: 48x48px
- Large fonts for readability
- Touch-friendly button sizes
- Bottom navigation bar with large icons

---

## Theme Support

The app supports **Light** and **Dark** themes.

### Theme Toggle

Located in Settings page. Theme preference is saved in localStorage.

### CSS Variables

Themes are defined in `index.css` using CSS custom properties:

```css
:root {
  /* Dark theme (default) */
  --background: 220 20% 8%;
  --foreground: 210 40% 98%;
  --card: 220 18% 12%;
  /* ... */
}

.light {
  /* Light theme */
  --background: 210 20% 98%;
  --foreground: 220 20% 10%;
  --card: 0 0% 100%;
  /* ... */
}
```

---

## Internationalization (i18n)

Supports **English** and **Arabic** languages.

### Language Toggle

Located in Settings page. Language preference is saved in localStorage.

### Adding Translations

Edit `src/contexts/LanguageContext.tsx`:

```typescript
const translations = {
  "key.name": { en: "English text", ar: "النص العربي" },
  // ...
};
```

### Usage

```typescript
const { t, language, setLanguage } = useLanguage();

// Use translation
<span>{t(nav.dashboard)}</span>

// Change language
setLanguage(ar);
```

---

## New UI Components (v1.1)

### VirtualKeyboard

Full virtual keyboard for text input (WiFi passwords, etc.):

```typescript
import { VirtualKeyboard } from "@/components/ui/VirtualKeyboard";

<VirtualKeyboard
  value={password}
  onChange={setPassword}
  onClose={() => setShowKeyboard(false)}
/>
```

Features:
- QWERTY layout with shift support
- Numbers and symbols mode (123 button)
- Backspace and space keys
- Confirm button to close

### IPKeypad

Numeric keypad with decimal point for IP address input:

```typescript
import { IPKeypad } from "@/components/ui/IPKeypad";

<IPKeypad
  isOpen={showKeypad}
  onClose={() => setShowKeypad(false)}
  onConfirm={(value) => setIpAddress(value)}
  initialValue="192.168.0.1"
  label="Enter IP Address"
/>
```

Features:
- Numbers 0-9 and decimal point
- Clear and backspace buttons
- Modal dialog display

---

## Layout Updates (v1.1)

### Header Layout

The header now includes:
- **MNT Logo** centered in the header
- **E-Stop Button** repositioned to top-right corner, spanning 3 rows

```
┌──────────────────────────────────────────────────────┐
│  Dashboard Title    [MNT LOGO]           [E-STOP]   │
│  PLC Status: RUN                         [BUTTON]   │
│  Test Status: Idle                       [  RED ]   │
├──────────────────────────────────────────────────────┤
```

### StatusCard Updates

Status cards (Force, Weight, Position, Deflection) now have:
- Increased height: `min-h-[128px]`
- Action buttons (Tare, Zero) moved to title row
- Larger value text: `text-4xl`

### Dashboard Buttons

All control buttons standardized to:
- Height: `min-h-[80px]` (matching jog buttons)
- Input fields (Speed, Distance) same height as buttons

### Settings Page

- All buttons: `min-h-[52px]`
- Titles use translations: `t("settings.language")`, `t("settings.theme")`
- IP inputs open IPKeypad on click
- WiFi password shows VirtualKeyboard

---

## Translation Keys Added (v1.1)

```typescript
// Settings translations
"settings.language": { en: "Language", ar: "اللغة" },
"settings.theme": { en: "Theme", ar: "السمة" },
"settings.wifi": { en: "WiFi", ar: "الواي فاي" },
"settings.lan": { en: "LAN Network", ar: "شبكة LAN" },
"settings.plcNetwork": { en: "PLC Network", ar: "شبكة PLC" },
```
