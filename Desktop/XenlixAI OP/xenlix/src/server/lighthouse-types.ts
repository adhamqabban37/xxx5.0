/**
 * Minimal Lighthouse type definitions to avoid importing actual lighthouse types during build
 * This prevents Turbopack from analyzing lighthouse internals
 */

export interface LighthouseOptions {
  port?: number;
  output?: string[];
  logLevel?: 'silent' | 'error' | 'info' | 'verbose';
  onlyCategories?: string[];
  throttling?: {
    rttMs?: number;
    throughputKbps?: number;
    cpuSlowdownMultiplier?: number;
  };
}

export interface LighthouseConfig {
  extends?: string;
  settings?: {
    rttMs?: number;
    throughputKbps?: number;
    cpuSlowdownMultiplier?: number;
    maxWaitForFcp?: number;
    maxWaitForLoad?: number;
    disableStorageReset?: boolean;
    skipAudits?: string[];
  };
}

export interface LighthouseResult {
  lhr: {
    categories: {
      [key: string]: {
        score: number;
        title: string;
      };
    };
    audits: {
      [key: string]: {
        score?: number;
        displayValue?: string;
        numericValue?: number;
      };
    };
  };
  report: string | string[];
}

export interface ChromeLauncherOptions {
  chromePath?: string;
  chromeFlags?: string[];
  logLevel?: string;
  port?: number;
}

export interface ChromeInstance {
  port: number;
  pid: number;
  kill(): Promise<void>;
}
