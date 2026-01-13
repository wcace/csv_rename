
export interface MCodeMapping {
  [key: string]: string;
}

export interface ProcessingResult {
  fileName: string;
  data: any[];
  headers: string[];
  timestamp: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING_MAPPING = 'LOADING_MAPPING',
  READY_FOR_UPLOAD = 'READY_FOR_UPLOAD',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
