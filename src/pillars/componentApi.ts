import type { PillarResult, ScannedFile } from '../types.js';

export function auditComponentApi(_files: ScannedFile[]): PillarResult {
  return {
    id: 'componentApi',
    name: 'Component API Consistency',
    implemented: false,
    score: null,
    summary: {},
    findings: [],
    notes: [
      'Not yet implemented. Planned: prop naming conventions, variant pattern consistency, and composition analysis.',
    ],
  };
}
