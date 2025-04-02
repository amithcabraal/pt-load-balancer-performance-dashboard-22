import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, ExternalLink } from 'lucide-react';
import { SlowQueryEntry } from '../types';

interface SlowQueriesDashboardProps {
  data: SlowQueryEntry[];
}

const parseUrlParams = (url: string) => {
  try {
    const urlObj = new URL(url);
    const params = Array.from(urlObj.searchParams.entries());
    return {
      baseUrl: `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`,
      params: params
    };
  } catch (e) {
    // If URL parsing fails, try to split manually
    const [baseUrl, queryString] = url.split('?');
    if (!queryString) return { baseUrl: url, params: [] };
    
    const params = queryString.split('&').map(param => {
      const [key, value] = param.split('=');
      return [key, decodeURIComponent(value || '')];
    });
    
    return { baseUrl, params };
  }
};

export function SlowQueriesDashboard({ data }: SlowQueriesDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const itemsPerPage = 20;

  const filteredData = useMemo(() => {
    return data.filter(entry => 
      entry.request_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.pid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.elb_status_code.includes(searchTerm)
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const pageData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const toggleRow = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  return (
    <div className="w-full space-y-8 p-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Slow Queries Analysis</h2>
          <div className="relative w-96">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search requests..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="w-8 px-6 py-3"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Processing Time (s)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Request URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Player ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {pageData.map((entry, index) => {
                const isExpanded = expandedRows.has(index);
                const { baseUrl, params } = parseUrlParams(entry.request_url);
                
                return (
                  <React.Fragment key={index}>
                    <tr 
                      className={`${
                        entry.processing_time > 10 
                          ? 'bg-red-50 dark:bg-red-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      } cursor-pointer`}
                      onClick={() => toggleRow(index)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ChevronRight 
                          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(entry.time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {entry.processing_time.toFixed(3)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex items-center space-x-2">
                          <a 
                            href={entry.request_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate max-w-xl"
                          >
                            {entry.request_url}
                          </a>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {entry.pid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          entry.elb_status_code.startsWith('2') ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                          entry.elb_status_code.startsWith('3') ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                          entry.elb_status_code.startsWith('4') ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                          'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}>
                          {entry.elb_status_code}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50 dark:bg-gray-900">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Base URL:</h4>
                              <p className="text-sm text-gray-900 dark:text-gray-100 break-all">{baseUrl}</p>
                            </div>
                            {params.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Query Parameters:</h4>
                                <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                      <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                          Parameter
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                          Value
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                      {params.map(([key, value], paramIndex) => (
                                        <tr key={paramIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                          <td className="px-6 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {key}
                                          </td>
                                          <td className="px-6 py-2 text-sm text-gray-500 dark:text-gray-400 break-all">
                                            {value}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}