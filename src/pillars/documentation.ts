import type { PillarResult, ScannedFile } from '../types.js';

export function auditDocumentation(_files: ScannedFile[]): PillarResult {
  return {
    id: 'documentation',
    name: 'Documentation Coverage',
    implemented: false,
    score: null,
    summary: {},
    findings: [],
    notes: [
      'Not yet implemented. Planned: Storybook story coverage, prop-table/JSDoc coverage, and usage example detection.',
    ],
  };
}
