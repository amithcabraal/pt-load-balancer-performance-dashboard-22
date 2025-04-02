import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Threshold {
  value: number;
  color: string;
}

interface ThresholdState {
  thresholds: Record<string, Threshold>;
  setThreshold: (key: string, value: number) => void;
  removeThreshold: (key: string) => void;
}

export const useThresholdStore = create<ThresholdState>()(
  persist(
    (set) => ({
      thresholds: {},
      setThreshold: (key, value) =>
        set((state) => ({
          thresholds: {
            ...state.thresholds,
            [key]: { value, color: '#ef4444' }  // Using red as default color
          },
        })),
      removeThreshold: (key) =>
        set((state) => {
          const { [key]: _, ...rest } = state.thresholds;
          return { thresholds: rest };
        }),
    }),
    {
      name: 'endpoint-thresholds',
    }
  )
);
