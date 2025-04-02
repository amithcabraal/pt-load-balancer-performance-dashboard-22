import React, { useCallback, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { LoadBalancerEntry, PerformanceMetricsEntry, SlowQueryEntry, ErrorSummaryEntry, CloudFrontStatsEntry, CloudFrontObjectEntry, DataFormat, DataState, SplunkWorkflow, SplunkMetric } from '../types';
import { LoadedFiles } from './LoadedFiles';

interface FileUploadProps {
  onDataLoaded: (data: LoadBalancerEntry[] | PerformanceMetricsEntry[] | SlowQueryEntry[] | ErrorSummaryEntry[] | CloudFrontStatsEntry[] | CloudFrontObjectEntry[] | SplunkWorkflow[] | Record<string, SplunkMetric[]>, format: DataFormat, fileName: string) => void;
  dataState: DataState;
  onClear: (format?: DataFormat) => void;
}

const extractPlayerId = (url: string): string => {
  const match = url.match(/\/(\d+)(?:\/[^\/]+)?$/);
  return match ? match[1] : '';
};

export function FileUpload({ onDataLoaded, dataState, onClear }: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const processCSVContent = useCallback((content: string, fileName: string) => {
    const processPatterns = () => {
      try {
        const patternsData = JSON.parse(content);
        if (Array.isArray(patternsData) && patternsData.length > 0 && '@pattern' in patternsData[0]) {
          onDataLoaded(patternsData, 'patterns', fileName);
          setIsProcessing(false);
          return true;
        }
      } catch (e) {
        console.log('Not patterns data, continuing with other formats...');
      }
      return false;
    };

    // First try to process as patterns data
    if (processPatterns()) {
      return;
    }

    // First check if it's a CloudFront report
    if (content.includes('"Report","CacheStatistics"')) {
      setProcessingStatus(`Processing ${fileName} as CloudFront Cache Statistics...`);
      // Split content into lines
      const lines = content.split('\n');
      
      // Extract metadata
      const startDate = lines[3].split(',')[1].replace(/"/g, '');
      const endDate = lines[4].split(',')[1].replace(/"/g, '');
      
      // Get the actual CSV data starting from line 10
      const csvData = lines.slice(9).join('\n');

      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transform: (value) => {
          // Convert numeric strings to numbers where appropriate
          if (/^\d+$/.test(value)) return parseInt(value, 10);
          if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
          return value.trim();
        },
        complete: (results) => {
          const data = results.data
            .filter((row: any) => row.TimeBucket && row.TimeBucket !== 'TimeBucket')
            .map((row: any) => ({
              ...row,
              StartDateUTC: startDate,
              EndDateUTC: endDate
            }));
          onDataLoaded(data, 'cfstats', fileName);
          setIsProcessing(false);
        }
      });
      return;
    }

    if (content.includes('"Report","PopularObjects"')) {
      setProcessingStatus(`Processing ${fileName} as CloudFront Popular Objects...`);
      // Split content into lines
      const lines = content.split('\n');
      
      // Extract metadata
      const startDate = lines[3].split(',')[1].replace(/"/g, '');
      const endDate = lines[4].split(',')[1].replace(/"/g, '');
      
      // Get the actual CSV data starting from line 8
      const csvData = lines.slice(7).join('\n');

      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transform: (value) => {
          if (/^\d+$/.test(value)) return parseInt(value, 10);
          if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
          return value.trim();
        },
        complete: (results) => {
          const data = results.data
            .filter((row: any) => row.Object && row.Object !== 'Object')
            .map((row: any) => ({
              ...row,
              StartDateUTC: startDate,
              EndDateUTC: endDate
            }));
          onDataLoaded(data, 'cfobjects', fileName);
          setIsProcessing(false);
        }
      });
      return;
    }

    // First try to parse as error summary (space-separated format)
    const lines = content.trim().split('\n');
    const firstLine = lines[0].trim();
    const isErrorSummary = /^\s*\d+\s+".*"$/.test(firstLine) || /^\s*\d+\s+{.*}$/.test(firstLine);

    if (isErrorSummary) {
      setProcessingStatus(`Processing ${fileName} as Error Summary...`);
      const data = lines.map(line => {
        // Match either "count" followed by text in quotes, or "count" followed by JSON-like content
        const match = line.match(/^\s*(\d+)\s+(?:"([^"]+)"|({.*})|(.+))$/);
        if (match) {
          const [, count, quotedMessage, jsonMessage, plainMessage] = match;
          let message = quotedMessage || jsonMessage || plainMessage;
          // If it's a JSON message, keep it as is, otherwise trim
          if (!jsonMessage) {
            message = message.trim();
          }
          return {
            count: parseInt(count, 10),
            message: message
          };
        }
        return null;
      }).filter((item): item is ErrorSummaryEntry => item !== null);
      
      onDataLoaded(data, 'errorsummary', fileName);
      setIsProcessing(false);
      return;
    }

    // Otherwise process as CSV
    setProcessingStatus(`Processing ${fileName} as CSV data...`);
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => value.trim(),
      complete: (results) => {
        const firstRow = results.data[0] as any;
        
        if ('clock_time' in firstRow && 'metric' in firstRow) {
          // LoadRunner data
          onDataLoaded(results.data, 'loadrunner', fileName);
        }
        else if ('time' in firstRow && 'processing_time' in firstRow && 'request_url' in firstRow) {
          const data = results.data
            .filter((row: any) => 
              row.time && 
              !isNaN(row.processing_time) && 
              row.request_url && 
              row.elb_status_code
            )
            .map((row: any) => ({
              time: row.time,
              processing_time: Number(row.processing_time),
              request_url: row.request_url,
              pid: extractPlayerId(row.request_url),
              elb_status_code: row.elb_status_code
            }));
          onDataLoaded(data, 'slowqueries', fileName);
        }
        else if ('base_url' in firstRow && 'min_rt' in firstRow) {
          const data = results.data
            .filter((row: any) => 
              row.base_url && 
              !isNaN(row.min_rt) && 
              !isNaN(row.max_rt) && 
              !isNaN(row.avg_rt)
            )
            .map((row: any) => ({
              base_url: row.base_url,
              request_verb: row.request_verb,
              min_rt: Number(row.min_rt),
              max_rt: Number(row.max_rt),
              avg_rt: Number(row.avg_rt),
              P25: Number(row.P25),
              P50: Number(row.P50),
              P60: Number(row.P60),
              P75: Number(row.P75),
              P90: Number(row.P90),
              P95: Number(row.P95),
              total: Number(row.total),
              requests: Number(row.requests)
            }));
          onDataLoaded(data, 'performance', fileName);
        }
        else {
          const data = results.data
            .filter((row: any) => 
              row.normalized_url && 
              row.elb_status_code && 
              row.request_verb && 
              row.processing_time_bucket && 
              !isNaN(row.count) && 
              !isNaN(row.total_requests) && 
              !isNaN(row.percentage)
            )
            .map((row: any) => ({
              normalized_url: row.normalized_url,
              elb_status_code: row.elb_status_code,
              request_verb: row.request_verb,
              processing_time_bucket: row.processing_time_bucket,
              count: Number(row.count),
              total_requests: Number(row.total_requests),
              percentage: Number(row.percentage)
            }));
          onDataLoaded(data, 'loadbalancer', fileName);
        }
        setIsProcessing(false);
      }
    });
  }, [onDataLoaded]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setIsProcessing(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.name.endsWith('.zip')) {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        
        const allFiles = Object.entries(zipContent.files).filter(([name]) => 
          name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.json')
        );
        
        for (const [fileName, zipEntry] of allFiles) {
          if (!zipEntry.dir) {
            const content = await zipEntry.async('string');
            processCSVContent(content, fileName);
          }
        }
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) {
            processCSVContent(content, file.name);
          }
        };
        reader.readAsText(file);
      }
    }

    event.target.value = '';
  };

  const hasData = dataState.loadBalancerData || dataState.performanceData || 
                  dataState.slowQueriesData || dataState.errorSummaryData ||
                  dataState.loadRunnerData || dataState.cfStatsData ||
                  dataState.cfObjectsData || dataState.patternsData;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {hasData ? (
        <div className="flex gap-4">
          <div className="w-1/2">
            <LoadedFiles dataState={dataState}  onClear={onClear} />
          </div>
          <div className="w-1/2">
            <button
              onClick={() => document.getElementById('fileInput')?.click()}
              className="w-full h-full flex flex-col items-center justify-center gap-2 px-4 py-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Upload className="w-8 h-8 text-blue-500" />
              <span className="text-lg font-medium text-gray-700 dark:text-gray-200">Upload Additional Files</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Supports CSV files, TXT files, JSON files, or ZIP containing these files
              </span>
              <input
                id="fileInput"
                type="file"
                className="hidden"
                accept=".csv,.txt,.json,.zip"
                multiple
                onChange={handleFileUpload}
              />
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center px-4 py-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Upload className="w-12 h-12 text-blue-500" />
          <span className="text-lg font-medium text-gray-700 dark:text-gray-200">Upload Files</span>
          <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Supports CSV files, TXT files, JSON files, or ZIP containing these files
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Load Balancer, Performance Metrics, Slow Requests, LoadRunner Metrics, Splunk APM, and Error Summary formats
          </span>
          <input
            type="file"
            className="hidden"
            accept=".csv,.txt,.json,.zip"
            multiple
            onChange={handleFileUpload}
          />
        </label>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="text-lg font-medium text-gray-900 dark:text-white">Processing files...</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{processingStatus}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}