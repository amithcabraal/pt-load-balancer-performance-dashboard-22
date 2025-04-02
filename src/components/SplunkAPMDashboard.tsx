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
  Brush
} from 'recharts';
import { SplunkWorkflow, SplunkMetric } from '../types';
import { Activity, AlertCircle, Search } from 'lucide-react';

interface SplunkAPMDashboardProps {
  workflows: SplunkWorkflow[];
  metrics: Record<string, SplunkMetric[]>;
}

const METRIC_COLORS = [
  '#8884d8', // Purple
  '#82ca9d', // Green
  '#ffc658', // Yellow
  '#ff7300', // Orange
  '#0088FE', // Blue
  '#00C49F', // Teal
  '#FFBB28', // Gold
  '#FF8042', // Coral
];

interface WorkflowInfo {
  name: string;
  hasError: boolean;
  metrics: Set<string>;
  ids: Set<string>;
}

export function SplunkAPMDashboard({ workflows, metrics }: SplunkAPMDashboardProps) {
  const [excludeHealthChecks, setExcludeHealthChecks] = useState(true);
  const [workflowFilter, setWorkflowFilter] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  
  // Create a mapping of workflow names to their info
  const workflowMap = useMemo(() => {
    const map = new Map<string, WorkflowInfo>();
    
    workflows.forEach(workflow => {
      const existingEntry = map.get(workflow.sf_workflow) || {
        name: workflow.sf_workflow,
        hasError: false,
        metrics: new Set<string>(),
        ids: new Set<string>()
      };

      existingEntry.hasError = existingEntry.hasError || workflow.sf_error === 'true';
      existingEntry.metrics.add(workflow.sf_metric);
      existingEntry.ids.add(workflow.sf_id);
      
      map.set(workflow.sf_workflow, existingEntry);
    });

    return map;
  }, [workflows]);

  // Get unique workflow names
  const workflowNames = useMemo(() => {
    return Array.from(workflowMap.keys())
      .filter(name => !excludeHealthChecks || !name.includes('/actuator/health'))
      .sort();
  }, [workflowMap, excludeHealthChecks]);

  const filteredWorkflowNames = useMemo(() => {
    return workflowNames.filter(name => 
      name.toLowerCase().includes(workflowFilter.toLowerCase())
    );
  }, [workflowNames, workflowFilter]);

  // Set initial workflow if not set and workflows exist
  React.useEffect(() => {
    if ((!selectedWorkflow || (excludeHealthChecks && selectedWorkflow.includes('/actuator/health'))) && workflowNames.length > 0) {
      setSelectedWorkflow(workflowNames[0]);
    }
  }, [selectedWorkflow, workflowNames, excludeHealthChecks]);

  const chartData = useMemo(() => {
    if (!selectedWorkflow) return [];

    const workflowInfo = workflowMap.get(selectedWorkflow);
    if (!workflowInfo) return [];

    // Get all unique timestamps
    const timestamps = new Set<number>();
    const metricValues: Record<string, Record<number, number>> = {};

    // Initialize metric value storage
    workflowInfo.metrics.forEach(metric => {
      metricValues[metric] = {};
    });

    // Collect all metric values by timestamp
    workflowInfo.ids.forEach(id => {
      const metricData = metrics[id] || [];
      const workflow = workflows.find(w => w.sf_id === id);
      if (!workflow) return;

      metricData.forEach(data => {
        timestamps.add(data.timestamp);
        metricValues[workflow.sf_metric][data.timestamp] = data.value / 1000000; // Convert to ms
      });
    });

    // Create combined data points
    return Array.from(timestamps)
      .sort((a, b) => a - b)
      .map(timestamp => {
        const point: any = {
          time: new Date(timestamp).toLocaleString(),
          timestamp,
        };
        workflowInfo.metrics.forEach(metric => {
          point[metric] = metricValues[metric][timestamp] || null;
        });
        return point;
      });
  }, [selectedWorkflow, workflowMap, metrics, workflows]);

  const getStatistics = useMemo(() => {
    if (chartData.length === 0) return {};

    const workflowInfo = workflowMap.get(selectedWorkflow);
    if (!workflowInfo) return {};

    const stats: Record<string, { min: number, max: number, avg: number, p90: number, p95: number }> = {};

    workflowInfo.metrics.forEach(metric => {
      const values = chartData
        .map(d => d[metric])
        .filter((v): v is number => v !== null)
        .sort((a, b) => a - b);

      if (values.length === 0) {
        stats[metric] = { min: 0, max: 0, avg: 0, p90: 0, p95: 0 };
        return;
      }

      stats[metric] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p90: values[Math.floor(values.length * 0.9)],
        p95: values[Math.floor(values.length * 0.95)]
      };
    });

    return stats;
  }, [chartData, workflowMap, selectedWorkflow]);

  const debugInfo = useMemo(() => {
    const workflowDetails = Array.from(workflowMap.entries())
      .filter(([name]) => !excludeHealthChecks || !name.includes('/actuator/health'))
      .map(([name, info]) => ({
        name,
        hasError: info.hasError,
        metrics: Array.from(info.metrics),
        ids: Array.from(info.ids),
        dataPoints: Array.from(info.ids).reduce((sum, id) => sum + (metrics[id]?.length || 0), 0),
        isHealthCheck: name.includes('/actuator/health')
      }));
    
    const selectedInfo = workflowMap.get(selectedWorkflow);
    
    return {
      availableWorkflows: workflowNames.length,
      totalWorkflows: workflowMap.size,
      healthCheckCount: Array.from(workflowMap.keys()).filter(name => name.includes('/actuator/health')).length,
      selectedWorkflow,
      selectedWorkflowMetrics: selectedInfo ? Array.from(selectedInfo.metrics) : [],
      workflowDetails,
      totalDataPoints: Object.values(metrics).reduce((sum, arr) => sum + arr.length, 0),
      selectedWorkflowPoints: selectedInfo 
        ? Array.from(selectedInfo.ids).reduce((sum, id) => sum + (metrics[id]?.length || 0), 0)
        : 0,
      timeRange: chartData.length > 0 ? {
        start: new Date(chartData[0].timestamp).toISOString(),
        end: new Date(chartData[chartData.length - 1].timestamp).toISOString(),
        points: chartData.length
      } : null
    };
  }, [workflowNames, workflowMap, selectedWorkflow, metrics, excludeHealthChecks, chartData]);

  if (workflowNames.length === 0) {
    return (
      <div className="w-full space-y-8 p-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-3 text-amber-500">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-xl font-semibold">No Metrics Data Available</h2>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {excludeHealthChecks && debugInfo.healthCheckCount > 0 
              ? `Only health check endpoints are available. Try unchecking "Exclude Health Checks" to view them.`
              : `No metrics data has been loaded. Please ensure you have uploaded the correct Splunk APM data files.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 p-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
        {/* Header and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Splunk APM Analysis</h2>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={excludeHealthChecks}
                onChange={(e) => setExcludeHealthChecks(e.target.checked)}
                className="rounded text-blue-500 focus:ring-blue-500"
              />
              Exclude Health Checks
            </label>
            <div className="w-96 relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Workflow ({filteredWorkflowNames.length} of {debugInfo.totalWorkflows} available)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={workflowFilter}
                  onChange={(e) => setWorkflowFilter(e.target.value)}
                  placeholder="Search workflows..."
                  className="w-full p-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <Search className="w-4 h-4 absolute right-2 top-3 text-gray-400" />
              </div>
              {workflowFilter && filteredWorkflowNames.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredWorkflowNames.map(name => {
                    const info = workflowMap.get(name);
                    if (!info) return null;
                    const metricCount = info.metrics.size;
                    const errorSuffix = info.hasError ? ' [ERROR]' : '';
                    const workflowIds = Array.from(info.ids).join(',');
                    
                    return (
                      <button
                        key={name}
                        onClick={() => {
                          setSelectedWorkflow(name);
                          setWorkflowFilter('');
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 ${
                          info.hasError ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'
                        }`}
                        data-workflow-ids={workflowIds}
                      >
                        {name}{errorSuffix} ({metricCount} metric{metricCount !== 1 ? 's' : ''})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Time Series Chart */}
        {chartData.length > 0 ? (
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  stroke="#9CA3AF"
                />
                <YAxis 
                  label={{ 
                    value: 'Response Time (ms)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#9CA3AF'
                  }}
                  stroke="#9CA3AF"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #ccc',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value?.toFixed(2) || 'N/A'} ms`, 'Response Time']}
                />
                <Legend />
                {Array.from(workflowMap.get(selectedWorkflow)?.metrics || []).map((metric, index) => (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    name={metric}
                    stroke={METRIC_COLORS[index % METRIC_COLORS.length]}
                    dot={false}
                    strokeWidth={2}
                    connectNulls
                  />
                ))}
                <Brush 
                  dataKey="time"
                  height={30}
                  stroke="#8884d8"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[500px] flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>No metrics data available for the selected workflow</p>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="space-y-4">
          {Object.entries(getStatistics).map(([metric, stats]) => (
            <div key={metric} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{metric}</h3>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 uppercase">{key}</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {value.toFixed(2)} ms
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Debug Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Debug Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-600 dark:text-gray-400">Metrics Overview</h4>
              <p>Total Workflows: {debugInfo.totalWorkflows}</p>
              <p>Health Check Workflows: {debugInfo.healthCheckCount}</p>
              <p>Visible Workflows: {debugInfo.availableWorkflows}</p>
              <p>Total Data Points: {debugInfo.totalDataPoints}</p>
              <p>Selected Workflow: {debugInfo.selectedWorkflow}</p>
              <p>Selected Workflow Points: {debugInfo.selectedWorkflowPoints}</p>
              <p>Available Metrics: {debugInfo.selectedWorkflowMetrics.join(', ')}</p>
            </div>
            {debugInfo.timeRange && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-600 dark:text-gray-400">Time Range</h4>
                <p>Start: {debugInfo.timeRange.start}</p>
                <p>End: {debugInfo.timeRange.end}</p>
                <p>Total Points: {debugInfo.timeRange.points}</p>
              </div>
            )}
            <div className="col-span-2 space-y-2">
              <h4 className="font-medium text-gray-600 dark:text-gray-400">Workflow Details</h4>
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-40">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left p-1">Workflow</th>
                      <th className="text-right p-1">Data Points</th>
                      <th className="text-right p-1">Metrics</th>
                      <th className="text-right p-1">IDs</th>
                      <th className="text-right p-1">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugInfo.workflowDetails.map((w, i) => (
                      <tr key={i} className={`${w.isHealthCheck ? 'text-gray-400 dark:text-gray-500' : ''} ${w.hasError ? 'text-red-500 dark:text-red-400' : ''}`}>
                        <td className="p-1">{w.name}{w.hasError ? ' [ERROR]' : ''}</td>
                        <td className="text-right p-1">{w.dataPoints}</td>
                        <td className="text-right p-1">{w.metrics.length}</td>
                        <td className="text-right p-1">{w.ids.length}</td>
                        <td className="text-right p-1">{w.isHealthCheck ? 'Health Check' : 'Workflow'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <h4 className="font-medium text-gray-600 dark:text-gray-400">Raw Data Sample</h4>
              <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify({
                  availableWorkflows: workflowNames.slice(0, 5).map(name => {
                    const info = workflowMap.get(name);
                    return {
                      name,
                      hasError: info?.hasError,
                      metrics: Array.from(info?.metrics || []),
                      ids: Array.from(info?.ids || []),
                      isHealthCheck: name.includes('/actuator/health')
                    };
                  }),
                  selectedMetrics: metrics[selectedWorkflow]?.slice(0, 2) || []
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}