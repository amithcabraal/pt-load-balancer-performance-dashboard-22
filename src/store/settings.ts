import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SeriesConfigs } from '../types';

// Default LoadRunner chart configuration
const DEFAULT_LOADRUNNER_CONFIG: SeriesConfigs = {
  metric: { 
    visible: true, 
    color: { 
      light: '#8884d8',
      dark: '#b8b5f6'
    }, 
    label: 'Response Time' 
  },
  metricMA: { 
    visible: true, 
    color: { 
      light: '#8884d8',
      dark: '#b8b5f6'
    }, 
    label: 'Response Time (Moving Avg)' 
  },
  transactions: { 
    visible: true, 
    color: { 
      light: '#82ca9d',
      dark: '#a3e4b7'
    }, 
    label: 'Transactions' 
  },
  transactionsMA: { 
    visible: true, 
    color: { 
      light: '#82ca9d',
      dark: '#a3e4b7'
    }, 
    label: 'Transactions (Moving Avg)' 
  },
  errors: { 
    visible: true, 
    color: { 
      light: '#ff7300',
      dark: '#ff9b4d'
    }, 
    label: 'Errors' 
  },
  vusers: { 
    visible: true, 
    color: { 
      light: '#0088FE',
      dark: '#4dabfe'
    }, 
    label: 'VUsers' 
  }
};

interface SettingsState {
  chartConfigs: {
    loadRunner?: SeriesConfigs;
  };
  setChartConfig: (chartType: keyof SettingsState['chartConfigs'], config: SeriesConfigs) => void;
  importSettings: (settings: Partial<SettingsState>) => void;
  getChartConfig: (chartType: keyof SettingsState['chartConfigs']) => SeriesConfigs;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      chartConfigs: {
        loadRunner: DEFAULT_LOADRUNNER_CONFIG
      },
      setChartConfig: (chartType, config) =>
        set((state) => ({
          chartConfigs: {
            ...state.chartConfigs,
            [chartType]: config,
          },
        })),
      importSettings: (settings) => set((state) => ({ ...state, ...settings })),
      getChartConfig: (chartType) => {
        const state = get();
        if (chartType === 'loadRunner') {
          return state.chartConfigs.loadRunner || DEFAULT_LOADRUNNER_CONFIG;
        }
        throw new Error(`Unknown chart type: ${chartType}`);
      }
    }),
    {
      name: 'pt-dashboard-settings',
    }
  )
);