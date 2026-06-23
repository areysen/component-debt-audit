export type Severity = 'high' | 'medium' | 'low';

export interface Finding {
  file: string;
  line: number;
  ruleId: string;
  message: string;
  value: string;
  severity: Severity;
  suggestion?: string;
}

export interface PillarResult {
  id: string;
  name: string;
  implemented: boolean;
  score: number | null;
  summary: Record<string, number | string | boolean | null>;
  findings: Finding[];
  notes?: string[];
}

export interface AuditReport {
  target: string;
  generatedAt: string;
  filesScanned: number;
  pillars: PillarResult[];
  overallScore: number | null;
  pillarsImplemented: number;
  pillarsTotal: number;
}

export interface ScannedFile {
  path: string;
  content: string;
}
