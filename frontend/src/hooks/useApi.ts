import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CommandResponse, ModeResponse, WifiScanResponse, WifiStatus, LanStatus, LanConfigRequest } from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Real API call helper
const apiCall = async (endpoint: string, options?: RequestInit): Promise<CommandResponse> => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
};

// ========== Commands ==========

export function useCommands() {
  const startTest = useMutation({
    mutationFn: () => apiCall('/api/command/start', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to start test: ${error.message}`);
    },
  });

  const stopTest = useMutation({
    mutationFn: () => apiCall('/api/command/stop', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.warning(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to stop test: ${error.message}`);
    },
  });

  const goHome = useMutation({
    mutationFn: () => apiCall('/api/command/home', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.info(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to go home: ${error.message}`);
    },
  });

  return { startTest, stopTest, goHome };
}

// ========== Tare / Zero ==========

export function useTareControl() {
  const tareLoadCell = useMutation({
    mutationFn: () => apiCall('/api/tare', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to tare: ${error.message}`);
    },
  });

  const zeroPosition = useMutation({
    mutationFn: () => apiCall('/api/zero-position', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to zero position: ${error.message}`);
    },
  });

  return { tareLoadCell, zeroPosition };
}

// ========== Servo ==========

export function useServoControl() {
  const enableServo = useMutation({
    mutationFn: () => apiCall('/api/servo/enable', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to enable servo: ${error.message}`);
    },
  });

  const disableServo = useMutation({
    mutationFn: () => apiCall('/api/servo/disable', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.warning(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to disable servo: ${error.message}`);
    },
  });

  const resetAlarm = useMutation({
    mutationFn: () => apiCall('/api/servo/reset', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.info(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to reset alarm: ${error.message}`);
    },
  });

  return { enableServo, disableServo, resetAlarm };
}

// ========== Clamps ==========

export function useClampControl() {
  const lockUpper = useMutation({
    mutationFn: () => apiCall('/api/clamp/upper/lock', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to lock upper clamp: ${error.message}`);
    },
  });

  const lockLower = useMutation({
    mutationFn: () => apiCall('/api/clamp/lower/lock', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to lock lower clamp: ${error.message}`);
    },
  });

  const unlockAll = useMutation({
    mutationFn: () => apiCall('/api/clamp/unlock', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast.warning(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to unlock clamps: ${error.message}`);
    },
  });

  return { lockUpper, lockLower, unlockAll };
}

// ========== Mode Control ==========

export function useModeControl() {
  const queryClient = useQueryClient();

  const modeQuery = useQuery<ModeResponse>({
    queryKey: ['mode'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/mode`);
      if (!response.ok) throw new Error('Failed to fetch mode');
      return response.json();
    },
    refetchInterval: 5000,
  });

  const setMode = useMutation({
    mutationFn: async (remoteMode: boolean) => {
      const endpoint = remoteMode ? '/api/mode/remote' : '/api/mode/local';
      return apiCall(endpoint, { method: 'POST' });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['mode'] });
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to change mode: ${error.message}`);
    },
  });

  return {
    setMode,
    currentMode: modeQuery.data,
    isLoading: modeQuery.isLoading,
  };
}

// ========== Jog Control ==========

export function useJogApi() {
  const setJogSpeed = useMutation({
    mutationFn: (velocity: number) =>
      apiCall('/api/jog/speed', {
        method: 'POST',
        body: JSON.stringify({ velocity }),
      }),
    onSuccess: (data) => {
      if (data.success) {
        toast.info(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to set jog speed: ${error.message}`);
    },
  });

  return { setJogSpeed };
}

// ========== Network Configuration ==========

export function useWifiControl() {
  const queryClient = useQueryClient();

  const wifiStatus = useQuery<WifiStatus>({
    queryKey: ['wifi-status'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/network/wifi/status`);
      if (!response.ok) throw new Error('Failed to fetch WiFi status');
      return response.json();
    },
    refetchInterval: 10000,
  });

  const scanNetworks = useQuery<WifiScanResponse>({
    queryKey: ['wifi-scan'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/network/wifi/scan`);
      if (!response.ok) throw new Error('Failed to scan networks');
      return response.json();
    },
    enabled: false,
  });

  const connectWifi = useMutation({
    mutationFn: async ({ ssid, password }: { ssid: string; password: string }) => {
      const response = await fetch(`${API_URL}/api/network/wifi/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to connect');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['wifi-status'] });
    },
    onError: (error) => {
      toast.error(`WiFi connection failed: ${error.message}`);
    },
  });

  const disconnectWifi = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/network/wifi/disconnect`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to disconnect');
      return response.json();
    },
    onSuccess: (data) => {
      toast.warning(data.message);
      queryClient.invalidateQueries({ queryKey: ['wifi-status'] });
    },
    onError: (error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    },
  });

  return {
    wifiStatus: wifiStatus.data,
    isLoadingStatus: wifiStatus.isLoading,
    networks: scanNetworks.data?.networks || [],
    isScanning: scanNetworks.isFetching,
    scanNetworks: () => scanNetworks.refetch(),
    connectWifi,
    disconnectWifi,
  };
}

export function useLanControl() {
  const queryClient = useQueryClient();

  const lanStatus = useQuery<LanStatus>({
    queryKey: ['lan-status'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/network/lan/status`);
      if (!response.ok) throw new Error('Failed to fetch LAN status');
      return response.json();
    },
    refetchInterval: 10000,
  });

  const configureLan = useMutation({
    mutationFn: async (config: LanConfigRequest) => {
      const response = await fetch(`${API_URL}/api/network/lan/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to configure LAN');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['lan-status'] });
    },
    onError: (error) => {
      toast.error(`LAN configuration failed: ${error.message}`);
    },
  });

  return {
    lanStatus: lanStatus.data,
    isLoading: lanStatus.isLoading,
    configureLan,
  };
}

// ========== Test Metadata ==========

export interface TestMetadata {
  sample_id: string;
  operator: string;
  notes: string;
  lot_number: string;
  nominal_diameter: number | null;
  pressure_class: string;
  stiffness_class: string;
  product_id: string;
  thickness: number | null;
  nominal_weight: number | null;
  project_name: string;
  customer_name: string;
  po_number: string;
}

export function useTestMetadata() {
  const queryClient = useQueryClient();

  const metadataQuery = useQuery<TestMetadata>({
    queryKey: ['test-metadata'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/test-metadata`);
      if (!response.ok) throw new Error('Failed to fetch test metadata');
      return response.json();
    },
  });

  const saveMetadata = useMutation({
    mutationFn: async (data: TestMetadata) => {
      const response = await fetch(`${API_URL}/api/test-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save test metadata');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-metadata'] });
    },
  });

  return {
    metadata: metadataQuery.data,
    isLoading: metadataQuery.isLoading,
    saveMetadata,
  };
}

// ========== Step Movement Control ==========

export function useStepControl() {
  const setStepDistance = useMutation({
    mutationFn: (distance: number) =>
      apiCall('/api/step/distance', {
        method: 'POST',
        body: JSON.stringify({ distance }),
      }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Failed to set step distance: ${error.message}`);
    },
  });

  const stepForward = useMutation({
    mutationFn: () => apiCall('/api/step/forward', { method: 'POST' }),
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Step forward failed: ${error.message}`);
    },
  });

  const stepBackward = useMutation({
    mutationFn: () => apiCall('/api/step/backward', { method: 'POST' }),
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Step backward failed: ${error.message}`);
    },
  });

  return { setStepDistance, stepForward, stepBackward };
}

// ========== LAN2 (General Network) Control ==========

export function useLan2Control() {
  const queryClient = useQueryClient();

  const lan2Status = useQuery<LanStatus>({
    queryKey: ['lan2-status'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/network/lan2/status`);
      if (!response.ok) throw new Error('Failed to fetch LAN2 status');
      return response.json();
    },
    refetchInterval: 10000,
  });

  const configureLan2 = useMutation({
    mutationFn: async (config: LanConfigRequest) => {
      const response = await fetch(`${API_URL}/api/network/lan2/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to configure LAN2');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['lan2-status'] });
    },
    onError: (error) => {
      toast.error(`LAN2 configuration failed: ${error.message}`);
    },
  });

  return {
    lan2Status: lan2Status.data,
    isLoading: lan2Status.isLoading,
    configureLan2,
  };
}

// ========== Power Control ==========

export function usePowerControl() {
  const shutdown = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/network/power/shutdown`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to shutdown');
      return response.json();
    },
    onSuccess: (data) => {
      toast.warning(data.message);
    },
    onError: (error) => {
      toast.error(`Shutdown failed: ${error.message}`);
    },
  });

  const restart = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/network/power/restart`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to restart');
      return response.json();
    },
    onSuccess: (data) => {
      toast.warning(data.message);
    },
    onError: (error) => {
      toast.error(`Restart failed: ${error.message}`);
    },
  });

  return { shutdown, restart };
}

// ========== Cursor Control ==========

interface CursorStatus {
  hidden: boolean;
}

export function useCursorControl() {
  const queryClient = useQueryClient();

  const cursorStatus = useQuery<CursorStatus>({
    queryKey: ['cursor-status'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/network/cursor/status`);
      if (!response.ok) throw new Error('Failed to fetch cursor status');
      return response.json();
    },
    refetchInterval: 5000,
  });

  const toggleCursor = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/network/cursor/toggle`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to toggle cursor');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['cursor-status'] });
    },
    onError: (error) => {
      toast.error(`Cursor toggle failed: ${error.message}`);
    },
  });

  return {
    cursorHidden: cursorStatus.data?.hidden ?? true,
    isLoading: cursorStatus.isLoading,
    toggleCursor,
  };
}

// ========== Parameters Control ==========

export interface TestParameters {
  pipe_diameter?: number;
  pipe_length?: number;
  deflection_percent?: number;
  test_speed?: number;
  max_stroke?: number;
  max_force?: number;
  connected?: boolean;
}

export function useParametersControl() {
  const queryClient = useQueryClient();

  const parameters = useQuery<TestParameters>({
    queryKey: ['parameters'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/parameters`);
      if (!response.ok) throw new Error('Failed to fetch parameters');
      return response.json();
    },
    refetchInterval: 5000,
  });

  const setParameters = useMutation({
    mutationFn: async (params: TestParameters) => {
      const response = await fetch(`${API_URL}/api/parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to set parameters');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Parameters saved');
      queryClient.invalidateQueries({ queryKey: ['parameters'] });
    },
    onError: (error) => {
      toast.error(`Failed to save parameters: ${error.message}`);
    },
  });

  return {
    parameters: parameters.data,
    isLoading: parameters.isLoading,
    setParameters,
  };
}

// ========== Alarms ==========

export interface Alarm {
  id: number;
  alarm_code: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  acknowledged: boolean;
  ack_timestamp?: string;
  ack_by?: string;
}

export function useAlarmsControl() {
  const queryClient = useQueryClient();

  const alarms = useQuery<{ alarms: Alarm[]; page: number; page_size: number }>({
    queryKey: ['alarms'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/alarms`);
      if (!response.ok) throw new Error('Failed to fetch alarms');
      return response.json();
    },
    refetchInterval: 5000,
  });

  const acknowledgeAlarm = useMutation({
    mutationFn: async (alarmId: number) => {
      const response = await fetch(`${API_URL}/api/alarms/${alarmId}/acknowledge`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to acknowledge alarm');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Alarm acknowledged');
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
    onError: (error) => {
      toast.error(`Failed to acknowledge: ${error.message}`);
    },
  });

  const acknowledgeAll = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/alarms/acknowledge-all`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to acknowledge alarms');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || 'All alarms acknowledged');
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
    onError: (error) => {
      toast.error(`Failed to acknowledge all: ${error.message}`);
    },
  });

  return {
    alarms: alarms.data?.alarms || [],
    isLoading: alarms.isLoading,
    refetch: alarms.refetch,
    acknowledgeAlarm,
    acknowledgeAll,
  };
}

// ========== Test History ==========

export interface TestRecord {
  id: number;
  sample_id?: string;
  operator?: string;
  test_date: string;
  pipe_diameter: number;
  pipe_length: number;
  deflection_percent: number;
  force_at_target?: number;
  max_force?: number;
  ring_stiffness?: number;
  sn_class?: number;
  passed: boolean;
  test_speed?: number;
  duration?: number;
  notes?: string;
  lot_number?: string;
  nominal_diameter?: number;
  pressure_class?: string;
  stiffness_class?: string;
  product_id?: string;
  thickness?: number;
  nominal_weight?: number;
  project_name?: string;
  customer_name?: string;
  po_number?: string;
}

export function useTestHistory() {
  const queryClient = useQueryClient();

  const tests = useQuery<{ tests: TestRecord[]; total: number; page: number; page_size: number; total_pages: number }>({
    queryKey: ['tests'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/tests`);
      if (!response.ok) throw new Error('Failed to fetch tests');
      return response.json();
    },
  });

  const deleteTest = useMutation({
    mutationFn: async (testId: number) => {
      const response = await fetch(`${API_URL}/api/tests/${testId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete test');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Test deleted');
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const downloadPdf = async (testId: number) => {
    try {
      const forceUnit = localStorage.getItem("report_force_unit") || "N";
      const response = await fetch(`${API_URL}/api/report/pdf/${testId}?force_unit=${forceUnit}`);
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test_report_${testId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const downloadExcel = async (testId: number) => {
    try {
      const forceUnit = localStorage.getItem("report_force_unit") || "N";
      const response = await fetch(`${API_URL}/api/report/excel/${testId}?force_unit=${forceUnit}`);
      if (!response.ok) throw new Error('Failed to download Excel');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test_report_${testId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel downloaded');
    } catch (error) {
      toast.error('Failed to download Excel');
    }
  };

  return {
    tests: tests.data?.tests || [],
    total: tests.data?.total || 0,
    isLoading: tests.isLoading,
    refetch: tests.refetch,
    deleteTest,
    downloadPdf,
    downloadExcel,
  };
}

// ========== Test Detail ==========

export function useTestDetail(testId: number | null) {
  return useQuery({
    queryKey: ['test-detail', testId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/tests/${testId}`);
      if (!response.ok) throw new Error('Failed to fetch test');
      return response.json();
    },
    enabled: !!testId,
  });
}

// ========== USB Devices ==========

export interface UsbDevice {
  label: string;
  path: string;
  free_gb: number | null;
}

export function useUsbDevices() {
  const devices = useQuery<{ devices: UsbDevice[] }>({
    queryKey: ['usb-devices'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/usb/devices`);
      if (!response.ok) throw new Error('Failed to detect USB devices');
      return response.json();
    },
    refetchInterval: 3000,
  });

  return {
    devices: devices.data?.devices || [],
    isLoading: devices.isLoading,
    refetch: devices.refetch,
  };
}

// ========== USB Export ==========

export interface UsbExportResult {
  success: boolean;
  exported: string[];
  errors: string[];
  export_path: string;
}

export function useUsbExport() {
  return useMutation<UsbExportResult, Error, { test_ids: number[]; format: string; usb_path: string }>({
    mutationFn: async (params) => {
      const response = await fetch(`${API_URL}/api/usb/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Export failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Exported ${data.exported.length} report(s) to USB`);
      }
      if (data.errors.length > 0) {
        toast.error(`${data.errors.length} error(s) during export`);
      }
    },
    onError: (error) => {
      toast.error(`USB export failed: ${error.message}`);
    },
  });
}
