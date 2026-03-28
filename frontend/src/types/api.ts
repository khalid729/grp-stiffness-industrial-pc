// PLC CPU State
export type PLCCpuState = 'run' | 'stop' | 'unknown';

// PLC Status
export interface PLCStatus {
  connected: boolean;
  cpu_state: PLCCpuState;
  ip: string;
}

// Force readings
export interface ForceData {
  raw: number;
  actual: number;
  filtered: number;
  kN: number;
  N: number;
}

// Position readings
export interface PositionData {
  raw: number;
  actual: number;
  servo: number;
  target: number;
}

// Deflection readings
export interface DeflectionData {
  actual: number;
  percent: number;
  target: number;
}

// Test status
export interface TestData {
  status: number;
  stage: number;
  progress: number;
  recording: boolean;
  preload_reached: boolean;
  passed: boolean;
}

// Results
export interface ResultsData {
  ring_stiffness: number;
  force_at_target: number;
  sn_class: number;
  contact_position: number;
  data_points: number;
}

// Servo status
export interface ServoData {
  ready: boolean;
  error: boolean;
  enabled: boolean;
  at_home: boolean;
  mc_power: boolean;
  mc_busy: boolean;
  mc_error: boolean;
  speed: number;
  jog_velocity: number;
}

// Safety status
export interface SafetyData {
  e_stop: boolean;
  upper_limit: boolean;
  lower_limit: boolean;
  home: boolean;
  ok: boolean;
  motion_allowed: boolean;
}

// Clamps
export interface ClampsData {
  upper: boolean;
  lower: boolean;
}

// Mode
export interface ModeData {
  remote: boolean;
  can_change: boolean;
}

// Alarm
export interface AlarmData {
  active: boolean;
  code: number;
}

// Lamps
export interface LampsData {
  ready: boolean;
  running: boolean;
  error: boolean;
}

// Crack test data
export interface CrackData {
  force_stage1: number;
  force_stage2: number;
  deflection_stage1: number;
  deflection_stage2: number;
  found_stage1: boolean;
  found_stage2: boolean;
  passed: boolean;
}

// Fracture test data
export interface FractureData {
  peak_force: number;
  peak_deflection: number;
  detected: boolean;
}

// HMI extended (operator interaction)
export interface HmiExtData {
  waiting_user: boolean;
  param_error: boolean;
  param_error_code: number;
}

// Live data from PLC - New structure
export interface LiveData {
  // Structured data
  force: ForceData;
  position: PositionData;
  deflection: DeflectionData;
  test: TestData;
  results: ResultsData;
  servo: ServoData;
  safety: SafetyData;
  clamps: ClampsData;
  mode: ModeData;
  alarm: AlarmData;
  lamps: LampsData;
  crack: CrackData;
  fracture: FractureData;
  hmi_ext: HmiExtData;
  plc: PLCStatus;
  connected: boolean;
  
  // Legacy flat fields for compatibility
  actual_force: number;
  actual_deflection: number;
  target_deflection: number;
  actual_position: number;
  test_status: number;
  test_progress: number;
  servo_ready: boolean;
  servo_error: boolean;
  servo_enabled: boolean;
  at_home: boolean;
  lock_upper: boolean;
  lock_lower: boolean;
  remote_mode: boolean;
  e_stop_active: boolean;
  
  // Old fields - keep for compatibility
  ring_stiffness?: number;
  force_at_target?: number;
  sn_class?: number;
  test_passed?: boolean;
  upper_limit?: boolean;
  lower_limit?: boolean;
  e_stop?: boolean;
  start_button?: boolean;
  load_cell_raw?: number;
}

// Test Stage Names
export const TEST_STAGE_NAMES: Record<number, string> = {
  0: 'Idle - Ready',
  1: 'Initialize',
  2: 'Zero Position',
  3: 'Stiffness Move',
  4: 'Stiffness Record',
  5: 'Waiting - Continue to Crack?',
  6: 'Bridge Move (Stiffness→Crack)',
  10: 'Returning Home',
  11: 'Test Complete',
  20: 'Crack Move - Stage 1',
  21: 'Crack Wait - Stage 1 Inspection',
  22: 'Crack Move - Stage 2',
  23: 'Crack Wait - Stage 2 Inspection',
  30: 'Fracture Move',
  31: 'Fracture Record',
  99: 'ERROR - Check Alarm'
};

// Alarm Messages
export const ALARM_MESSAGES: Record<number, { text: string; severity: 'info' | 'warning' | 'error' | 'critical' }> = {
  0: { text: 'No Alarm', severity: 'info' },
  1: { text: 'E-STOP PRESSED!', severity: 'critical' },
  2: { text: 'Servo Fault', severity: 'error' },
  3: { text: 'Upper Limit Reached', severity: 'warning' },
  4: { text: 'Lower Limit Reached', severity: 'warning' },
  5: { text: 'Max Force Exceeded', severity: 'error' },
  6: { text: 'Parameter Error', severity: 'error' },
  7: { text: 'Test Stopped', severity: 'info' },
};

// Test parameters
export interface TestParameters {
  pipe_diameter: number;
  pipe_length: number;
  deflection_percent: number;
  deflection_target: number;
  test_speed: number;
  max_stroke: number;
  max_force: number;
  preload_force: number;
  approach_speed: number;
  contact_speed: number;
  return_speed: number;
  target_sn_class: number;
  test_mode: number;
  crack_stage1_percent: number;
  crack_stage2_percent: number;
  fracture_max_percent: number;
  fracture_drop_threshold: number;
  crack_target_1_abs: number;
  crack_target_2_abs: number;
  fracture_target_abs: number;
  connected: boolean;
}

// Test Mode constants
export const TEST_MODES = {
  STIFFNESS: 0,
  CRACK: 1,
  STIFFNESS_CRACK: 2,
  FRACTURE: 3,
} as const;

export const TEST_MODE_NAMES: Record<number, string> = {
  0: 'Stiffness Only',
  1: 'Crack Only',
  2: 'Stiffness + Crack',
  3: 'Fracture',
};

// Test record
export interface TestRecord {
  id: number;
  sample_id: string | null;
  operator: string | null;
  test_date: string;
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
  group_id: number | null;
  position: number | null;
  angle: number | null;
  data_points?: TestDataPoint[];
}

// Test data point
export interface TestDataPoint {
  id: number;
  test_id: number;
  timestamp: number;
  force: number;
  deflection: number;
  position: number | null;
}

// Alarm record
export interface Alarm {
  id: number;
  alarm_code: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  acknowledged: boolean;
  ack_timestamp: string | null;
  ack_by: string | null;
}

// API responses
export interface TestsResponse {
  tests: TestRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AlarmsResponse {
  alarms: Alarm[];
  page: number;
  page_size: number;
}

export interface CommandResponse {
  success: boolean;
  message: string;
}

export interface ConnectionStatus {
  connected: boolean;
  ip: string;
  message: string;
}

// Mode response
export interface ModeResponse {
  remote_mode: boolean;
  mode: 'local' | 'remote';
}

// Network types
export interface WifiNetwork {
  ssid: string;
  signal: number;
  security: string;
}

export interface WifiStatus {
  connected: boolean;
  ssid: string | null;
  ip_address: string | null;
}

export interface LanStatus {
  mode: 'static' | 'dhcp';
  ip_address: string | null;
  subnet_mask: string;
  gateway: string | null;
  connected: boolean;
}

export interface WifiScanResponse {
  networks: WifiNetwork[];
}

export interface LanConfigRequest {
  mode: 'static' | 'dhcp';
  ip_address?: string;
  subnet_mask?: string;
  gateway?: string;
}
