import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { PatternEntry, Token } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface PatternsDashboardProps {
  data: PatternEntry[];
}

interface TokenModalProps {
  token: Token;
  onClose: () => void;
}

function TokenModal({ token, onClose }: TokenModalProps) {
  const sortedEnumerations = useMemo(() => {
    if (!token.enumerations || typeof token.enumerations !== 'object') {
      return [];
    }

    return Object.entries(token.enumerations)
      .filter(([value, count]) => value !== undefined && count !== undefined)
      .sort(([, a], [, b]) => b - a)
      .map(([value, count]) => ({ value, count }));
  }, [token]);

  const total = useMemo(() => 
    sortedEnumerations.reduce((sum, { count }) => sum + count, 0)
  , [sortedEnumerations]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-[90vw] w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Token Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Token Information</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{token.dynamicTokenPosition}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{token.tokenType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">String</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{token.tokenString}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Is Numeric</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{token.isNumeric ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Is Error Code</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{token.isErrorCode ? 'Yes' : 'No'}</dd>
              </div>
              {token.inferredTokenName && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Inferred Name</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{token.inferredTokenName}</dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Value Distribution
              {sortedEnumerations.length === 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  (No values available)
                </span>
              )}
            </h3>
            {sortedEnumerations.length > 0 && (
              <div>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedEnumerations.map(({ value, count }, index) => {
                      const percentage = total > 0 ? ((count / total) * 100).toFixed(2) : '0.00';
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white break-all">{value}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{count.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface VisualizationModalProps {
  data: any;
  onClose: () => void;
}

function VisualizationModal({ data, onClose }: VisualizationModalProps) {
  const chartData = useMemo(() => {
    const timeWindows = Object.entries(data.timeWindowCountMapping)
      .map(([timestamp, count]) => ({
        time: new Date(parseInt(timestamp)).toLocaleString(),
        count: count as number
      }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return timeWindows;
  }, [data]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Time Distribution
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <div className="h-[600px]">
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
                stroke="#9CA3AF"
                label={{
                  value: 'Count',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#9CA3AF'
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function PatternsDashboard({ data }: PatternsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedVisualization, setSelectedVisualization] = useState<any | null>(null);

  const processedData = useMemo(() => {
    return data.map(entry => ({
      ...entry,
      tokens: JSON.parse(entry['@tokens']) as Token[],
      visualization: JSON.parse(entry['@visualization'])
    }));
  }, [data]);

  const filteredData = useMemo(() => {
    return processedData.filter(entry => {
      const pattern = entry['@pattern'].toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      // Search in pattern
      if (pattern.includes(searchLower)) return true;

      // Search in token values
      return entry.tokens.some(token => {
        // For static tokens, check the token string
        if (token.tokenType === 'STATIC' && token.tokenString.toLowerCase().includes(searchLower)) {
          return true;
        }
        // For dynamic tokens with enumerations, check the enumeration values
        if (token.tokenType === 'DYNAMIC' && token.enumerations) {
          return Object.keys(token.enumerations).some(value =>
            value.toLowerCase().includes(searchLower)
          );
        }
        return false;
      });
    });
  }, [processedData, searchTerm]);

  const renderPattern = (pattern: string, tokens: Token[]) => {
    const parts = pattern.split('<*>');
    let dynamicTokenIndex = 0;

    return parts.map((part, index) => {
      if (index === parts.length - 1) {
        return <span key={index}>{part}</span>;
      }

      // Find the next dynamic token
      const dynamicTokens = tokens.filter(t => t.tokenType === 'DYNAMIC');
      const token = dynamicTokens[dynamicTokenIndex++];

      // If token has exactly one enumeration value, show that value instead of <*>
      const singleValue = token && 
                         token.enumerations && 
                         Object.keys(token.enumerations).length === 1 ? 
                         Object.keys(token.enumerations)[0] : 
                         null;

      return (
        <React.Fragment key={index}>
          {part}
          {token ? (
            <button
              onClick={() => setSelectedToken(token)}
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              {singleValue || '<*>'}
            </button>
          ) : (
            '<*>'
          )}
        </React.Fragment>
      );
    });
  };

  const renderSmallVisualization = (entry: any) => {
    try {
      const timeWindows = Object.entries(entry.visualization.timeWindowCountMapping)
        .map(([timestamp, count]) => ({
          time: new Date(parseInt(timestamp)).toLocaleString(),
          count: count as number
        }))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      return (
        <div 
          className="h-12 w-40 cursor-pointer" 
          onClick={() => setSelectedVisualization(entry.visualization)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeWindows}>
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    } catch (e) {
      return <div className="text-red-500">Invalid visualization data</div>;
    }
  };

  return (
    <div className="w-full space-y-8 p-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Log Patterns Analysis</h2>
          <div className="relative w-96">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patterns and values..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pattern</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Distribution</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {parseInt(entry['@sampleCount']).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {renderPattern(entry['@pattern'], entry.tokens)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      entry['@severityLabel'] === 'ERROR' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {entry['@severityLabel']}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {renderSmallVisualization(entry)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedToken && (
        <TokenModal
          token={selectedToken}
          onClose={() => setSelectedToken(null)}
        />
      )}

      {selectedVisualization && (
        <VisualizationModal
          data={selectedVisualization}
          onClose={() => setSelectedVisualization(null)}
        />
      )}
    </div>
  );
}
