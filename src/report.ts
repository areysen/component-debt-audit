import type { AuditReport, PillarResult } from './types.js';

export function buildReport(target: string, filesScanned: number, pillars: PillarResult[]): AuditReport {
  const implementedScores = pillars
    .filter((p) => p.implemented && typeof p.score === 'number')
    .map((p) => p.score as number);

  const overallScore = implementedScores.length
    ? Math.round(implementedScores.reduce((sum, s) => sum + s, 0) / implementedScores.length)
    : null;

  return {
    target,
    generatedAt: new Date().toISOString(),
    filesScanned,
    pillars,
    overallScore,
    pillarsImplemented: pillars.filter((p) => p.implemented).length,
    pillarsTotal: pillars.length,
  };
}
