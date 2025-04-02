import React, { useState } from 'react';
import { File, FileX, ChevronDown, ChevronRight } from 'lucide-react';
import { DataState, DataFormat } from '../types';

interface LoadedFilesProps {
  dataState: DataState;
  onClear: (format?: DataFormat) => void;
}

export function LoadedFiles({ dataState, onClear }: LoadedFilesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const loadedFiles = [
    dataState.fileNames.loadBalancer,
    dataState.fileNames.performance,
    dataState.fileNames.slowQueries,
    dataState.fileNames.errorSummary,
    dataState.fileNames.loadRunner,
    dataState.fileNames.cfStats,
    dataState.fileNames.cfObjects,
    dataState.fileNames.splunkWorkflows,
    dataState.fileNames.splunkMetrics
  ].filter(Boolean);

  const fileCount = loadedFiles.length;

  if (fileCount === 0) return null;

  const multipleFiles = fileCount > 1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 h-full flex flex-col">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          )}
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Loaded Files <span className="text-gray-500 dark:text-gray-400">({fileCount})</span>
          </h3>
        </div>
        {multipleFiles && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1"
          >
            <FileX className="w-4 h-4" />
            Remove All
          </button>
        )}
      </div>
      <div className={`flex-1 flex flex-col ${isExpanded ? 'justify-start mt-4' : 'justify-center'}`}>
        {isExpanded ? (
          <div className="space-y-2">
            {dataState.fileNames.loadBalancer && (
              <FileEntry
                label="Load Balancer Data"
                fileName={dataState.fileNames.loadBalancer}
                onRemove={() => onClear('loadbalancer')}
              />
            )}
            {dataState.fileNames.performance && (
              <FileEntry
                label="Performance Data"
                fileName={dataState.fileNames.performance}
                onRemove={() => onClear('performance')}
              />
            )}
            {dataState.fileNames.slowQueries && (
              <FileEntry
                label="Slow Requests Data"
                fileName={dataState.fileNames.slowQueries}
                onRemove={() => onClear('slowqueries')}
              />
            )}
            {dataState.fileNames.errorSummary && (
              <FileEntry
                label="Error Summary Data"
                fileName={dataState.fileNames.errorSummary}
                onRemove={() => onClear('errorsummary')}
              />
            )}
            {dataState.fileNames.loadRunner && (
              <FileEntry
                label="LoadRunner Data"
                fileName={dataState.fileNames.loadRunner}
                onRemove={() => onClear('loadrunner')}
              />
            )}
            {dataState.fileNames.cfStats && (
              <FileEntry
                label="CloudFront Statistics"
                fileName={dataState.fileNames.cfStats}
                onRemove={() => onClear('cfstats')}
              />
            )}
            {dataState.fileNames.cfObjects && (
              <FileEntry
                label="CloudFront Objects"
                fileName={dataState.fileNames.cfObjects}
                onRemove={() => onClear('cfobjects')}
              />
            )}
            {dataState.fileNames.splunkWorkflows && (
              <FileEntry
                label="Splunk APM Workflows"
                fileName={dataState.fileNames.splunkWorkflows}
                onRemove={() => onClear('splunk-workflows')}
              />
            )}
            {dataState.fileNames.splunkMetrics && (
              <FileEntry
                label="Splunk APM Metrics"
                fileName={dataState.fileNames.splunkMetrics}
                onRemove={() => onClear('splunk-metrics')}
              />
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            Click to view {fileCount} loaded file{fileCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

interface FileEntryProps {
  label: string;
  fileName: string;
  onRemove: () => void;
}

function FileEntry({ label, fileName, onRemove }: FileEntryProps) {
  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-center gap-3">
        <File className="w-5 h-5 text-blue-500" />
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{label}:</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">{fileName}</div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1"
      >
        <FileX className="w-4 h-4" />
        Remove
      </button>
    </div>
  );
}