import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { SlowQueriesDashboard } from './components/SlowQueriesDashboard';
import { ErrorSummaryDashboard } from './components/ErrorSummaryDashboard';
import { LoadRunnerDashboard } from './components/LoadRunnerDashboard';
import { CloudFrontStatsDashboard } from './components/CloudFrontStatsDashboard';
import { CloudFrontObjectsDashboard } from './components/CloudFrontObjectsDashboard';
import { SplunkAPMDashboard } from './components/SplunkAPMDashboard';
import { PatternsDashboard } from './components/PatternsDashboard';
import { BurgerMenu } from './components/BurgerMenu';
import { InstructionsModal } from './components/InstructionsModal';
import { LoadBalancerEntry, PerformanceMetricsEntry, SlowQueryEntry, ErrorSummaryEntry, CloudFrontStatsEntry, CloudFrontObjectEntry, DataFormat, DataState, TabType, SplunkWorkflow, SplunkMetric, SplunkDataState } from './types';
import { BarChart, LayoutDashboard, Activity, Clock, AlertTriangle, LineChart, Cloud, Activity as SplunkIcon } from 'lucide-react';

function App() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [dataState, setDataState] = useState<DataState>({
    loadBalancerData: null,
    performanceData: null,
    slowQueriesData: null,
    errorSummaryData: null,
    loadRunnerData: null,
    cfStatsData: null,
    cfObjectsData: null,
    patternsData: null,
    fileNames: {}
  });
  const [splunkDataState, setSplunkDataState] = useState<SplunkDataState>({
    workflows: null,
    metrics: null
  });
  const [activeTab, setActiveTab] = useState<TabType>(null);

  const handleDataLoaded = (
    newData: LoadBalancerEntry[] | PerformanceMetricsEntry[] | SlowQueryEntry[] | ErrorSummaryEntry[] | CloudFrontStatsEntry[] | CloudFrontObjectEntry[] | SplunkWorkflow[] | Record<string, SplunkMetric[]>,
    format: DataFormat,
    fileName: string
  ) => {
    if (format === 'splunk-workflows') {
      setSplunkDataState(prev => ({
        ...prev,
        workflows: newData as SplunkWorkflow[]
      }));
    } else if (format === 'splunk-metrics') {
      setSplunkDataState(prev => ({
        ...prev,
        metrics: newData as Record<string, SplunkMetric[]>
      }));
    } else {
      setDataState(prev => ({
        ...prev,
        [format === 'loadbalancer' ? 'loadBalancerData' :
         format === 'performance' ? 'performanceData' :
         format === 'slowqueries' ? 'slowQueriesData' :
         format === 'loadrunner' ? 'loadRunnerData' :
         format === 'cfstats' ? 'cfStatsData' :
         format === 'cfobjects' ? 'cfObjectsData' :
         format === 'patterns' ? 'patternsData' : 'errorSummaryData']: newData,
        fileNames: {
          ...prev.fileNames,
          [format === 'loadbalancer' ? 'loadBalancer' :
           format === 'performance' ? 'performance' :
           format === 'slowqueries' ? 'slowQueries' :
           format === 'loadrunner' ? 'loadRunner' :
           format === 'cfstats' ? 'cfStats' :
           format === 'cfobjects' ? 'cfObjects' :
           format === 'patterns' ? 'patterns' : 'errorSummary']: fileName
        }
      }));
    }

    if (!activeTab) {
      setActiveTab(
        format === 'loadbalancer' ? 'summary' :
        format === 'performance' ? 'stats' :
        format === 'slowqueries' ? 'slow' :
        format === 'loadrunner' ? 'loadrunner' :
        format === 'cfstats' ? 'cfstats' :
        format === 'cfobjects' ? 'cfobjects' :
        format === 'patterns' ? 'patterns' :
        format === 'splunk-workflows' || format === 'splunk-metrics' ? 'splunk' : 'errors'
      );
    }
  };

  const handleClear = (format?: DataFormat) => {
    if (!format) {
      setDataState({
        loadBalancerData: null,
        performanceData: null,
        slowQueriesData: null,
        errorSummaryData: null,
        loadRunnerData: null,
        cfStatsData: null,
        cfObjectsData: null,
        patternsData: null,
        fileNames: {}
      });
      setSplunkDataState({
        workflows: null,
        metrics: null
      });
      setActiveTab(null);
    } else if (format === 'splunk-workflows' || format === 'splunk-metrics') {
      setSplunkDataState({
        workflows: null,
        metrics: null
      });
      if (activeTab === 'splunk') {
        if (dataState.loadBalancerData) setActiveTab('summary');
        else if (dataState.performanceData) setActiveTab('stats');
        else if (dataState.slowQueriesData) setActiveTab('slow');
        else if (dataState.loadRunnerData) setActiveTab('loadrunner');
        else if (dataState.cfStatsData) setActiveTab('cfstats');
        else if (dataState.cfObjectsData) setActiveTab('cfobjects');
        else if (dataState.patternsData) setActiveTab('patterns');
        else if (dataState.errorSummaryData) setActiveTab('errors');
        else setActiveTab(null);
      }
    } else {
      setDataState(prev => ({
        ...prev,
        [format === 'loadbalancer' ? 'loadBalancerData' :
         format === 'performance' ? 'performanceData' :
         format === 'slowqueries' ? 'slowQueriesData' :
         format === 'loadrunner' ? 'loadRunnerData' :
         format === 'cfstats' ? 'cfStatsData' :
         format === 'cfobjects' ? 'cfObjectsData' :
         format === 'patterns' ? 'patternsData' : 'errorSummaryData']: null,
        fileNames: {
          ...prev.fileNames,
          [format === 'loadbalancer' ? 'loadBalancer' :
           format === 'performance' ? 'performance' :
           format === 'slowqueries' ? 'slowQueries' :
           format === 'loadrunner' ? 'loadRunner' :
           format === 'cfstats' ? 'cfStats' :
           format === 'cfobjects' ? 'cfObjects' :
           format === 'patterns' ? 'patterns' : 'errorSummary']: undefined
        }
      }));

      if (
        (format === 'loadbalancer' && activeTab === 'summary') ||
        (format === 'performance' && activeTab === 'stats') ||
        (format === 'slowqueries' && activeTab === 'slow') ||
        (format === 'loadrunner' && activeTab === 'loadrunner') ||
        (format === 'cfstats' && activeTab === 'cfstats') ||
        (format === 'cfobjects' && activeTab === 'cfobjects') ||
        (format === 'patterns' && activeTab === 'patterns') ||
        (format === 'errorsummary' && activeTab === 'errors')
      ) {
        if (format !== 'loadbalancer' && dataState.loadBalancerData) setActiveTab('summary');
        else if (format !== 'performance' && dataState.performanceData) setActiveTab('stats');
        else if (format !== 'slowqueries' && dataState.slowQueriesData) setActiveTab('slow');
        else if (format !== 'loadrunner' && dataState.loadRunnerData) setActiveTab('loadrunner');
        else if (format !== 'cfstats' && dataState.cfStatsData) setActiveTab('cfstats');
        else if (format !== 'cfobjects' && dataState.cfObjectsData) setActiveTab('cfobjects');
        else if (format !== 'patterns' && dataState.patternsData) setActiveTab('patterns');
        else if (format !== 'errorsummary' && dataState.errorSummaryData) setActiveTab('errors');
        else if (splunkDataState.workflows && splunkDataState.metrics) setActiveTab('splunk');
        else setActiveTab(null);
      }
    }
  };

  const hasData = dataState.loadBalancerData || dataState.performanceData ||
                  dataState.slowQueriesData || dataState.errorSummaryData ||
                  dataState.loadRunnerData || dataState.cfStatsData ||
                  dataState.cfObjectsData || dataState.patternsData ||
                  splunkDataState.workflows;

  const hasMultipleDataTypes = [
    dataState.loadBalancerData,
    dataState.performanceData,
    dataState.slowQueriesData,
    dataState.errorSummaryData,
    dataState.loadRunnerData,
    dataState.cfStatsData,
    dataState.cfObjectsData,
    dataState.patternsData,
    splunkDataState.workflows
  ].filter(Boolean).length > 1;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart className="w-8 h-8 text-blue-500" />
              Performance Analysis Dashboard
            </h1>
            <BurgerMenu onShowInstructions={() => setShowInstructions(true)} />
          </div>
        </div>
      </header>

      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <FileUpload
          onDataLoaded={handleDataLoaded}
          dataState={dataState}
          onClear={handleClear}
        />

        {hasData && (
          <div className="mt-6">
            {hasMultipleDataTypes && (
              <div className="mb-6 flex gap-2 flex-wrap">
                {dataState.loadBalancerData && (
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'summary'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    LB Summary View
                  </button>
                )}
                {dataState.performanceData && (
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'stats'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    LB Stats
                  </button>
                )}
                {dataState.slowQueriesData && (
                  <button
                    onClick={() => setActiveTab('slow')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'slow'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    LB Slow Requests
                  </button>
                )}
                {dataState.errorSummaryData && (
                  <button
                    onClick={() => setActiveTab('errors')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'errors'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    LB Error Summary
                  </button>
                )}
                {dataState.loadRunnerData && (
                  <button
                    onClick={() => setActiveTab('loadrunner')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'loadrunner'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <LineChart className="w-4 h-4" />
                    LoadRunner Metrics
                  </button>
                )}
                {dataState.cfStatsData && (
                  <button
                    onClick={() => setActiveTab('cfstats')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'cfstats'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Cloud className="w-4 h-4" />
                    CF Stats
                  </button>
                )}
                {dataState.cfObjectsData && (
                  <button
                    onClick={() => setActiveTab('cfobjects')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'cfobjects'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Cloud className="w-4 h-4" />
                    CF Objects
                  </button>
                )}
                {dataState.patternsData && (
                  <button
                    onClick={() => setActiveTab('patterns')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'patterns'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    LB Patterns
                  </button>
                )}
                {splunkDataState.workflows && splunkDataState.metrics && (
                  <button
                    onClick={() => setActiveTab('splunk')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'splunk'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <SplunkIcon className="w-4 h-4" />
                    Splunk APM
                  </button>
                )}
              </div>
            )}

            {(activeTab === 'summary' || (!hasMultipleDataTypes && dataState.loadBalancerData)) && (
              <Dashboard data={dataState.loadBalancerData!} />
            )}
            
            {(activeTab === 'stats' || (!hasMultipleDataTypes && dataState.performanceData)) && (
              <PerformanceDashboard data={dataState.performanceData!} />
            )}

            {(activeTab === 'slow' || (!hasMultipleDataTypes && dataState.slowQueriesData)) && (
              <SlowQueriesDashboard data={dataState.slowQueriesData!} />
            )}

            {(activeTab === 'errors' || (!hasMultipleDataTypes && dataState.errorSummaryData)) && (
              <ErrorSummaryDashboard data={dataState.errorSummaryData!} />
            )}

            {(activeTab === 'loadrunner' || (!hasMultipleDataTypes && dataState.loadRunnerData)) && (
              <LoadRunnerDashboard data={dataState.loadRunnerData!} />
            )}

            {(activeTab === 'cfstats' || (!hasMultipleDataTypes && dataState.cfStatsData)) && (
              <CloudFrontStatsDashboard data={dataState.cfStatsData!} />
            )}

            {(activeTab === 'cfobjects' || (!hasMultipleDataTypes && dataState.cfObjectsData)) && (
              <CloudFrontObjectsDashboard data={dataState.cfObjectsData!} />
            )}

            {(activeTab === 'patterns' || (!hasMultipleDataTypes && dataState.patternsData)) && (
              <PatternsDashboard data={dataState.patternsData!} />
            )}

            {(activeTab === 'splunk' || (!hasMultipleDataTypes && splunkDataState.workflows)) && 
             splunkDataState.workflows && splunkDataState.metrics && (
              <SplunkAPMDashboard 
                workflows={splunkDataState.workflows} 
                metrics={splunkDataState.metrics} 
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;