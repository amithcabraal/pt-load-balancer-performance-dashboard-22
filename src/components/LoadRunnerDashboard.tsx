import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceArea
} from 'recharts';
import { LoadRunnerEntry } from '../types';
import { Settings, ZoomOut, Download, Upload, X } from 'lucide-react';
import { useSettingsStore } from '../store/settings';

interface LoadRunnerDashboardProps {
  data: LoadRunnerEntry[];
}

interface ChartDataPoint {
  timestamp: number;
  time: string;
  metricValue: number;
  metricMA: number;
  passed: number;
  failed: number;
  transactions: number;
  transactionsMA: number;
  errors: number;
  vusers: number;
}

interface SeriesConfig {
  visible: boolean;
  color: {
    light: string;
    dark: string;
  };
  label: string;
}

type SeriesConfigs = Record<string, SeriesConfig>;

const DEFAULT_SERIES_CONFIGS: SeriesConfigs = {
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

type SortField = keyof ChartDataPoint;
type SortDirection = 'asc' | 'desc';

type MetricType = 'percentile 95' | 'min trt' | 'max trt' | 'average trt';

const METRIC_LABELS: Record<MetricType, string> = {
  'percentile 95': 'P95 Response Time',
  'min trt': 'Minimum Response Time',
  'max trt': 'Maximum Response Time',
  'average trt': 'Average Response Time'
};

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  seriesConfigs: SeriesConfigs;
  onConfigChange: (newConfigs: SeriesConfigs) => void;
  isDarkMode: boolean;
  onExportConfig: () => void;
  onImportConfig: () => void;
}

function SettingsDialog({ 
  isOpen, 
  onClose, 
  seriesConfigs, 
  onConfigChange,
  isDarkMode,
  onExportConfig,
  onImportConfig
}: SettingsDialogProps) {
  const [localConfigs, setLocalConfigs] = useState(seriesConfigs);

  useEffect(() => {
    setLocalConfigs(seriesConfigs);
  }, [seriesConfigs]);

  const handleVisibilityChange = (seriesKey: string) => {
    const newConfigs = {
      ...localConfigs,
      [seriesKey]: {
        ...localConfigs[seriesKey],
        visible: !localConfigs[seriesKey].visible
      }
    };
    setLocalConfigs(newConfigs);
    onConfigChange(newConfigs);
  };

  const handleColorChange = (seriesKey: string, mode: 'light' | 'dark', color: string) => {
    const newConfigs = {
      ...localConfigs,
      [seriesKey]: {
        ...localConfigs[seriesKey],
        color: {
          ...localConfigs[seriesKey].color,
          [mode]: color
        }
      }
    };
    setLocalConfigs(newConfigs);
    onConfigChange(newConfigs);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chart Settings</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onExportConfig}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Export Configuration"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onImportConfig}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Import Configuration"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {Object.entries(localConfigs).map(([key, config]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.visible}
                    onChange={() => handleVisibilityChange(key)}
                    className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <span className="text-gray-900 dark:text-white">{config.label}</span>
                </label>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Light Mode</label>
                  <input
                    type="color"
                    value={config.color.light}
                    onChange={(e) => handleColorChange(key, 'light', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Dark Mode</label>
                  <input
                    type="color"
                    value={config.color.dark}
                    onChange={(e) => handleColorChange(key, 'dark', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const calculateMovingAverage = (data: number[], windowSize: number) => {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(average);
  }
  return result;
};

const formatNumber = (value: number | undefined | null, decimals: number = 2): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0.00';
  }
  return value.toFixed(decimals);
};

function LoadRunnerDashboard({ data }: LoadRunnerDashboardProps) {
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string>('CG02_Api_PlayGame_0110');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('percentile 95');
  const settingsStore = useSettingsStore();
  
  const [seriesConfigs, setSeriesConfigs] = useState<SeriesConfigs>(() => {
    const savedConfigs = settingsStore.chartConfigs.loadRunner;
    if (savedConfigs) {
      return savedConfigs;
    }
    return {
      ...DEFAULT_SERIES_CONFIGS,
      metric: { 
        ...DEFAULT_SERIES_CONFIGS.metric,
        label: METRIC_LABELS['percentile 95']
      },
      metricMA: { 
        ...DEFAULT_SERIES_CONFIGS.metricMA,
        label: `${METRIC_LABELS['percentile 95']} (Moving Avg)`
      }
    };
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [zoomLeft, setZoomLeft] = useState<string | null>(null);
  const [zoomRight, setZoomRight] = useState<string | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomedDomain, setZoomedDomain] = useState<[number, number] | null>(null);

  const isDarkMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  }, []);

  // Only update the store when seriesConfigs changes from user interaction
  const updateStore = useRef((configs: SeriesConfigs) => {
    settingsStore.setChartConfig('loadRunner', configs);
  });

  // Update series configs when metric changes
  useEffect(() => {
    setSeriesConfigs(prev => ({
      ...prev,
      metric: {
        ...prev.metric,
        label: METRIC_LABELS[selectedMetric]
      },
      metricMA: {
        ...prev.metricMA,
        label: `${METRIC_LABELS[selectedMetric]} (Moving Avg)`
      }
    }));
  }, [selectedMetric]);

  const transactions = useMemo(() => {
    const transSet = new Set<string>();
    data.forEach(entry => {
      if (entry.transaction) {
        transSet.add(entry.transaction);
      }
    });
    return Array.from(transSet).sort();
  }, [data]);

  const handleExportConfig = () => {
    const configData = JSON.stringify(seriesConfigs, null, 2);
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'loadrunner-chart-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (typeof config === 'object' && config !== null) {
          const isValid = Object.entries(config).every(([key, value]: [string, any]) => {
            return (
              value &&
              typeof value === 'object' &&
              'visible' in value &&
              'color' in value &&
              'label' in value &&
              typeof value.color === 'object' &&
              'light' in value.color &&
              'dark' in value.color
            );
          });

          if (isValid) {
            setSeriesConfigs(config);
            updateStore.current(config);
          } else {
            alert('Invalid configuration format');
          }
        } else {
          alert('Invalid configuration format');
        }
      } catch (error) {
        alert('Error importing configuration');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const chartData = useMemo(() => {
    const timestamps = [...new Set(data.map(entry => entry.time_stamp))].sort((a, b) => a - b);

    const dataPoints: ChartDataPoint[] = timestamps.map(timestamp => {
      const timeEntries = data.filter(entry => entry.time_stamp === timestamp);
      
      const metricEntry = timeEntries.find(
        entry => entry.metric === selectedMetric && 
        entry.transaction === selectedTransaction
      );

      const passedEntry = timeEntries.find(
        entry => entry.metric === 'passed transactions' && 
        entry.transaction === selectedTransaction
      );

      const failedEntry = timeEntries.find(
        entry => entry.metric === 'failed transactions' && 
        entry.transaction === selectedTransaction
      );

      const errorEntry = timeEntries.find(entry => 
        entry.metric === 'error count' && !entry.transaction
      );

      const vusersEntry = timeEntries.find(
        entry => entry.metric === 'vusers count' && 
        !entry.transaction
      );

      const passed = Number(passedEntry?.val) || 0;
      const failed = Number(failedEntry?.val) || 0;
      const metricValue = Number(metricEntry?.val) || 0;
      const vusers = Number(vusersEntry?.val) || 0;
      const errors = Number(errorEntry?.val) || 0;
      const transactions = (passed + failed) / 10;

      return {
        timestamp,
        time: new Date(timeEntries[0].clock_time).toLocaleString(),
        metricValue,
        metricMA: 0,
        passed,
        failed,
        transactions,
        transactionsMA: 0,
        errors,
        vusers
      };
    });

    const metricValues = dataPoints.map(d => d.metricValue);
    const metricMA = calculateMovingAverage(metricValues, 5);
    const transactionValues = dataPoints.map(d => d.transactions);
    const transactionMA = calculateMovingAverage(transactionValues, 5);

    return dataPoints.map((point, index) => ({
      ...point,
      metricMA: metricMA[index],
      transactionsMA: transactionMA[index]
    }));
  }, [data, selectedTransaction, selectedMetric]);

  const sortedChartData = useMemo(() => {
    return [...chartData].sort((a, b) => {
      if (sortField === 'time') {
        return (sortDirection === 'asc' ? 1 : -1) * (a.timestamp - b.timestamp);
      }
      const aValue = a[sortField];
      const bValue = b[sortField];
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      return (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) * multiplier;
    });
  }, [chartData, sortField, sortDirection]);

  const timeOrderedChartData = useMemo(() => {
    return [...chartData].sort((a, b) => a.timestamp - b.timestamp);
  }, [chartData]);

  const handleMouseDown = (e: any) => {
    if (!e) return;
    setIsZooming(true);
    setZoomLeft(e.activeLabel);
  };

  const handleMouseMove = (e: any) => {
    if (!isZooming || !e) return;
    setZoomRight(e.activeLabel);
  };

  const handleMouseUp = () => {
    if (!isZooming || !zoomLeft || !zoomRight) {
      setIsZooming(false);
      return;
    }

    const timeData = timeOrderedChartData.map(d => d.time);
    const leftIndex = timeData.indexOf(zoomLeft);
    const rightIndex = timeData.indexOf(zoomRight);

    if (leftIndex !== -1 && rightIndex !== -1) {
      const [start, end] = [leftIndex, rightIndex].sort((a, b) => a - b);
      setZoomedDomain([start, end]);
    }

    setIsZooming(false);
    setZoomLeft(null);
    setZoomRight(null);
  };

  const handleResetZoom = () => {
    setZoomedDomain(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortableHeader = ({ field, label }: { field: SortField, label: string }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <Settings className="w-4 h-4" />
      </div>
    </th>
  );

  const getSeriesColor = (seriesKey: string) => {
    const config = seriesConfigs[seriesKey];
    if (!config) return '#000000';
    return isDarkMode ? config.color.dark : config.color.light;
  };

  return (
    <div className="w-full space-y-8 p-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">LoadRunner Metrics</h2>
          <div className="flex items-center gap-4">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Transaction
                </label>
                <select
                  value={selectedTransaction}
                  onChange={(e) => setSelectedTransaction(e.target.value)}
                  className="w-64 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {transactions.map(trans => (
                    <option key={trans} value={trans}>{trans}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Metric
                </label>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
                  className="w-48 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Object.entries(METRIC_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            {zoomedDomain && (
              <button
                onClick={handleResetZoom}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
              >
                <ZoomOut className="w-4 h-4" />
                <span>Reset Zoom</span>
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        <div className="h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={timeOrderedChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                label={{ value: 'Time', position: 'bottom', fill: '#9CA3AF' }}
                stroke="#9CA3AF"
              />
              <YAxis 
                yAxisId="metric"
                label={{ value: `${METRIC_LABELS[selectedMetric]} (s)`, angle: -90, position: 'insideLeft', style: { fill: getSeriesColor('metric') } }}
                domain={['auto', 'auto']}
                tickFormatter={(value) => formatNumber(value)}
                stroke={getSeriesColor('metric')}
              />
              <YAxis 
                yAxisId="transactions"
                orientation="right"
                label={{ value: 'Transactions', angle: 90, position: 'insideRight', style: { fill: getSeriesColor('transactions') } }}
                domain={['auto', 'auto']}
                stroke={getSeriesColor('transactions')}
              />
              <YAxis 
                yAxisId="errors"
                orientation="right"
                label={{ value: 'Errors', angle: 90, position: 'insideRight', style: { fill: getSeriesColor('errors') } }}
                domain={['auto', 'auto']}
                offset={60}
                stroke={getSeriesColor('errors')}
              />
              <YAxis 
                yAxisId="vusers"
                orientation="right"
                label={{ value: 'VUsers', angle: 90, position: 'insideRight', style: { fill: getSeriesColor('vusers') } }}
                domain={['auto', 'auto']}
                offset={120}
                stroke={getSeriesColor('vusers')}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  color: '#111827'
                }}
                formatter={(value: number, name: string) => {
                  switch(name) {
                    case seriesConfigs.metric?.label:
                    case seriesConfigs.metricMA?.label:
                      return [`${formatNumber(value)}s`, name];
                    default:
                      return [formatNumber(value, 0), name];
                  }
                }}
              />
              <Legend />
              
              {isZooming && zoomLeft && zoomRight && (
                <ReferenceArea
                  x1={zoomLeft}
                  x2={zoomRight}
                  strokeOpacity={0.3}
                  fill="blue"
                  fillOpacity={0.1}
                />
              )}

              {seriesConfigs.metric?.visible && (
                <Line
                  yAxisId="metric"
                  type="monotone"
                  dataKey="metricValue"
                  stroke={getSeriesColor('metric')}
                  name={seriesConfigs.metric?.label}
                  dot={false}
                />
              )}
              {seriesConfigs.metricMA?.visible && (
                <Line
                  yAxisId="metric"
                  type="monotone"
                  dataKey="metricMA"
                  stroke={getSeriesColor('metricMA')}
                  strokeDasharray="5 5"
                  name={seriesConfigs.metricMA?.label}
                  dot={false}
                />
              )}
              {seriesConfigs.transactions?.visible && (
                <Line
                  yAxisId="transactions"
                  type="monotone"
                  dataKey="transactions"
                  stroke={getSeriesColor('transactions')}
                  name="Transactions"
                  dot={false}
                />
              )}
              {seriesConfigs.transactionsMA?.visible && (
                <Line
                  yAxisId="transactions"
                  type="monotone"
                  dataKey="transactionsMA"
                  stroke={getSeriesColor('transactionsMA')}
                  strokeDasharray="5 5"
                  name="Transactions (Moving Avg)"
                  dot={false}
                />
              )}
              {seriesConfigs.errors?.visible && (
                <Line
                  yAxisId="errors"
                  type="monotone"
                  dataKey="errors"
                  stroke={getSeriesColor('errors')}
                  name="Errors"
                  dot={false}
                />
              )}
              {seriesConfigs.vusers?.visible && (
                <Line
                  yAxisId="vusers"
                  type="monotone"
                  dataKey="vusers"
                  stroke={getSeriesColor('vusers')}
                  name="VUsers"
                  dot={false}
                />
              )}

              <Brush 
                dataKey="time"
                height={30}
                stroke="#8884d8"
                startIndex={zoomedDomain ? zoomedDomain[0] : undefined}
                endIndex={zoomedDomain ? zoomedDomain[1] : undefined}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        seriesConfigs={seriesConfigs}
        onConfigChange={setSeriesConfigs}
        isDarkMode={isDarkMode}
        onExportConfig={handleExportConfig}
        onImportConfig={handleImportConfig}
      />

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json"
        onChange={handleFileChange}
      />

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Detailed Metrics</h2>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <SortableHeader field="time" label="Time" />
              <SortableHeader field="metricValue" label={METRIC_LABELS[selectedMetric]} />
              <SortableHeader field="metricMA" label={`${METRIC_LABELS[selectedMetric]} MA`} />
              <SortableHeader field="passed" label="Passed" />
              <SortableHeader field="failed" label="Failed" />
              <SortableHeader field="transactions" label="Transactions" />
              <SortableHeader field="transactionsMA" label="Trans MA" />
              <SortableHeader field="errors" label="Errors" />
              <SortableHeader field="vusers" label="VUsers" />
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedChartData.map((point, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {point.time}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatNumber(point.metricValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatNumber(point.metricMA)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatNumber(point.passed, 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatNumber(point.failed, 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatNumber(point.transactions, 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatNumber(point.transactionsMA, 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatNumber(point.errors, 0)}
                </td>
                <td className="px-6 py-4 whitespace-now rap text-sm text-gray-900 dark:text-white">
                  {formatNumber(point.vusers, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { LoadRunnerDashboard };