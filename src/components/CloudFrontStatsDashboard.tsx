import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { CloudFrontStatsEntry } from '../types';

interface CloudFrontStatsDashboardProps {
  data: CloudFrontStatsEntry[];
}

export function CloudFrontStatsDashboard({ data }: CloudFrontStatsDashboardProps) {
  const sortedData = [...data].sort((a, b) => 
    new Date(a.TimeBucket).getTime() - new Date(b.TimeBucket).getTime()
  );

  const chartData = sortedData.map(entry => ({
    time: new Date(entry.TimeBucket).toLocaleString(),
    RequestCount: entry.RequestCount,
    HitCount: entry.HitCount,
    MissCount: entry.MissCount,
    ErrorCount: entry.ErrorCount,
    CacheHitRatio: entry.RequestCount > 0 ? 
      ((entry.HitCount / entry.RequestCount) * 100).toFixed(2) : '0.00'
  }));

  return (
    <div className="w-full space-y-8 p-6">
      {/* Cache Statistics Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">CloudFront Cache Statistics</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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
                yAxisId="count"
                label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                stroke="#9CA3AF"
              />
              <YAxis 
                yAxisId="ratio"
                orientation="right"
                label={{ value: 'Cache Hit Ratio (%)', angle: 90, position: 'insideRight', fill: '#9CA3AF' }}
                domain={[0, 100]}
                stroke="#9CA3AF"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  color: '#111827'
                }}
              />
              <Legend />
              <Bar 
                yAxisId="count"
                dataKey="RequestCount" 
                fill="#8884d8" 
                name="Request Count"
              />
              <Bar 
                yAxisId="count"
                dataKey="HitCount" 
                fill="#82ca9d" 
                name="Hit Count"
              />
              <Bar 
                yAxisId="count"
                dataKey="MissCount" 
                fill="#ffc658" 
                name="Miss Count"
              />
              <Bar 
                yAxisId="count"
                dataKey="ErrorCount" 
                fill="#ff7300" 
                name="Error Count"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cache Statistics Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Detailed Statistics</h2>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requests</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hits</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Misses</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Errors</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cache Hit Ratio</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {chartData.map((entry, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entry.time}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entry.RequestCount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entry.HitCount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entry.MissCount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entry.ErrorCount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entry.CacheHitRatio}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}