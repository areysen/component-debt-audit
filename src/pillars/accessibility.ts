import type { PillarResult, ScannedFile } from '../types.js';

export function auditAccessibility(_files: ScannedFile[]): PillarResult {
  return {
    id: 'accessibility',
    name: 'Accessibility Compliance',
    implemented: false,
    score: null,
    summary: {},
    findings: [],
    notes: [
      'Not yet implemented. Planned: WCAG 2.1 AA static checks — missing ARIA attributes, keyboard handler presence, alt text on images, and resolvable color-contrast issues.',
    ],
  };
}
