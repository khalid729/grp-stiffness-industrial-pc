import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiCall = async (endpoint: string, options?: RequestInit) => {
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

export function useStepControl() {
  const [stepDistance, setStepDistanceState] = useState(1);

  const setStepDistanceMutation = useMutation({
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
    onError: (error: Error) => {
      toast.error(`Failed to set step distance: ${error.message}`);
    },
  });

  const stepForwardMutation = useMutation({
    mutationFn: () => apiCall('/api/step/forward', { method: 'POST' }),
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(data.message);
      }
    },
    onError: (error: Error) => {
      toast.error(`Step forward failed: ${error.message}`);
    },
  });

  const stepBackwardMutation = useMutation({
    mutationFn: () => apiCall('/api/step/backward', { method: 'POST' }),
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(data.message);
      }
    },
    onError: (error: Error) => {
      toast.error(`Step backward failed: ${error.message}`);
    },
  });

  const setStepDistance = (distance: number) => {
    setStepDistanceState(distance);
    setStepDistanceMutation.mutate(distance);
  };

  const stepUp = () => {
    stepBackwardMutation.mutate();
  };

  const stepDown = () => {
    stepForwardMutation.mutate();
  };

  return { stepUp, stepDown, stepDistance, setStepDistance };
}
