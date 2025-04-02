import { SeriesConfig } from 'recharts';

export interface SplunkWorkflow {
  sf_id: string;
  sf_workflow: string;
  sf_error: string;
  sf_metric: string;
}

export interface SplunkMetric {
  timestamp: number;
  value: number;
}

export interface DataState {
  loadBalancerData: LoadBalancerEntry[] | null;
  performanceData: PerformanceMetricsEntry[] | null;
  slowQueriesData: SlowQueryEntry[] | null;
  errorSummaryData: ErrorSummaryEntry[] | null;
  loadRunnerData: LoadRunnerEntry[] | null;
  cfStatsData: CloudFrontStatsEntry[] | null;
  cfObjectsData: CloudFrontObjectEntry[] | null;
  patternsData: PatternEntry[] | null;
  fileNames: {
    loadBalancer?: string;
    performance?: string;
    slowQueries?: string;
    errorSummary?: string;
    loadRunner?: string;
    cfStats?: string;
    cfObjects?: string;
    splunkWorkflows?: string;
    splunkMetrics?: string;
    patterns?: string;
  };
}

export interface PatternEntry {
  "@visualization": string;
  "@ratio": string;
  "@relatedPattern": string;
  "@PatternId": string;
  "@regexString": string;
  "@sampleCount": string;
  "@tokens": string;
  "@logSamples": string;
  "@pattern": string;
  "@severityLabel": string;
}

export interface Token {
  dynamicTokenPosition: number;
  tokenType: string;
  tokenString: string;
  isNumeric: boolean;
  isErrorCode: boolean;
  enumerations: Record<string, number>;
  inferredTokenName?: string;
}

export interface SplunkDataState {
  workflows: SplunkWorkflow[] | null;
  metrics: Record<string, SplunkMetric[]> | null;
  workflowMap: Record<string, string> | null;
}

export interface SeriesConfigs {
  [key: string]: SeriesConfig;
}

export type DataFormat = 'loadbalancer' | 'performance' | 'slowqueries' | 'errorsummary' | 'loadrunner' | 'cfstats' | 'cfobjects' | 'splunk-workflows' | 'splunk-metrics' | 'patterns';