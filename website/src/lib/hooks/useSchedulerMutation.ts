import { useMutation } from '@tanstack/react-query';
import { startScheduler, stopScheduler } from '@/lib/api/scheduler';

export function useSchedulerStartMutation() {
  return useMutation({
    mutationFn: startScheduler,
  });
}

export function useSchedulerStopMutation() {
  return useMutation({
    mutationFn: stopScheduler,
  });
}
