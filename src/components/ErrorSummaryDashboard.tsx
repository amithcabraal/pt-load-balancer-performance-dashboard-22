import React, { useState } from 'react';
import { Search, ChevronRight, ExternalLink } from 'lucide-react';
import { ErrorSummaryEntry } from '../types';

interface ErrorSummaryDashboardProps {
  data: ErrorSummaryEntry[];
}

const tryParseJSON = (text: string): { isJSON: boolean; parsed?: any } => {
  try {
    if ((text.startsWith('{') || text.startsWith('[')) && text.trim()) {
      const parsed = JSON.parse(text);
      return { isJSON: true, parsed };
    }
    if (text.startsWith('"') && text.endsWith('"')) {
      const unescaped = JSON.parse(text);
      if (typeof unescaped === 'string' && 
         (unescaped.startsWith('{') || unescaped.startsWith('['))) {
        const parsed = JSON.parse(unescaped);
        return { isJSON: true, parsed };
      }
    }
    return { isJSON: false };
  } catch (e) {
    return { isJSON: false };
  }
};

const extractUrlsAndParams = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s"]+)/g;
  const urls = text.match(urlRegex) || [];
  
  return urls.map(url => {
    try {
      const urlObj = new URL(url);
      const params = Array.from(urlObj.searchParams.entries());
      return {
        fullUrl: url,
        baseUrl: `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`,
        params
      };
    } catch (e) {
      // If URL parsing fails, try to split manually
      const [baseUrl, queryString] = url.split('?');
      if (!queryString) return { fullUrl: url, baseUrl: url, params: [] };
      
      const params = queryString.split('&').map(param => {
        const [key, value] = param.split('=');
        return [key, decodeURIComponent(value || '')];
      });
      
      return { fullUrl: url, baseUrl, params };
    }
  });
};

const formatMessageWithLinks = (message: string) => {
  const urlRegex = /(https?:\/\/[^\s"]+)/g;
  let lastIndex = 0;
  const parts = [];
  let match;

  while ((match = urlRegex.exec(message)) !== null) {
    // Add the text before the URL
    if (match.index > lastIndex) {
      parts.push(message.substring(lastIndex, match.index));
    }

    // Add the URL as a link
    parts.push(
      <a
        key={match.index}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
      >
        {match[0]}
        <ExternalLink className="w-3 h-3 inline ml-1" />
      </a>
    );

    lastIndex = urlRegex.lastIndex;
  }

  // Add any remaining text after the last URL
  if (lastIndex < message.length) {
    parts.push(message.substring(lastIndex));
  }

  return parts;
};

export function ErrorSummaryDashboard({ data }: ErrorSummaryDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [prettyPrintedRows, setPrettyPrintedRows] = useState<Set<number>>(new Set());
  const itemsPerPage = 20;

  const filteredData = data.filter(entry =>
    entry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.count.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const pageData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleRow = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(index)) {
      newExpandedRows.delete(index);
      const newPrettyPrintedRows = new Set(prettyPrintedRows);
      newPrettyPrintedRows.delete(index);
      setPrettyPrintedRows(newPrettyPrintedRows);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  const togglePrettyPrint = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newPrettyPrintedRows = new Set(prettyPrintedRows);
    if (prettyPrintedRows.has(index)) {
      newPrettyPrintedRows.delete(index);
    } else {
      newPrettyPrintedRows.add(index);
      if (!expandedRows.has(index)) {
        const newExpandedRows = new Set(expandedRows);
        newExpandedRows.add(index);
        setExpandedRows(newExpandedRows);
      }
    }
    setPrettyPrintedRows(newPrettyPrintedRows);
  };

  return (
    <div className="w-full space-y-8 p-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Error Summary Analysis</h2>
          <div className="relative w-96">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search errors..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Error Message
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {pageData.map((entry, index) => {
                const isExpanded = expandedRows.has(index);
                const isPrettyPrinted = prettyPrintedRows.has(index);
                const { isJSON, parsed } = tryParseJSON(entry.message);
                const urls = extractUrlsAndParams(entry.message);
                
                return (
                  <React.Fragment key={index}>
                    <tr 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => toggleRow(index)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ChevronRight 
                          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {entry.count}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className={isExpanded ? '' : 'line-clamp-2'}>
                          {isJSON && isPrettyPrinted ? (
                            <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-900 dark:text-white overflow-x-auto">
                              {JSON.stringify(parsed, null, 2)}
                            </pre>
                          ) : (
                            formatMessageWithLinks(entry.message)
                          )}
                        </div>
                        {isJSON && isExpanded && (
                          <button
                            onClick={(e) => togglePrettyPrint(e, index)}
                            className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm mt-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/50 rounded"
                          >
                            {isPrettyPrinted ? 'Show Raw' : 'Pretty Print JSON'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && urls.length > 0 && (
                      <tr className="bg-gray-50 dark:bg-gray-900">
                        <td colSpan={3} className="px-6 py-4">
                          <div className="space-y-6">
                            {urls.map((urlData, urlIndex) => (
                              <div key={urlIndex} className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL {urlIndex + 1}:</h4>
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={urlData.fullUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm break-all"
                                    >
                                      {urlData.baseUrl}
                                    </a>
                                    <ExternalLink className="w-4 h-4 text-gray-400" />
                                  </div>
                                </div>
                                {urlData.params.length > 0 && (
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
                                          {urlData.params.map(([key, value], paramIndex) => (
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
                            ))}
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