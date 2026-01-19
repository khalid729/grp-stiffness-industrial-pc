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
