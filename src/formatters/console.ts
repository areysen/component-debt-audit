import chalk from 'chalk';
import type { AuditReport, Finding, PillarResult } from '../types.js';

export interface ConsoleFormatOptions {
  maxIssues?: number;
}

export function formatConsoleReport(report: AuditReport, options: ConsoleFormatOptions = {}): string {
  const maxIssues = options.maxIssues ?? 10;
  const lines: string[] = [];

  lines.push(chalk.bold('\nComponent Debt Audit Report'));
  lines.push(chalk.dim(`Target: ${report.target}`));
  lines.push(chalk.dim(`Files scanned: ${report.filesScanned}`));
  lines.push('');
  lines.push(chalk.bold('PILLAR SCORES'));

  for (const pillar of report.pillars) {
    lines.push(formatPillarScoreLine(pillar));
  }

  lines.push('');
  lines.push(
    report.overallScore !== null
      ? chalk.bold(
          `OVERALL HEALTH: ${scoreColor(report.overallScore)(`${report.overallScore}/100`)} ` +
            chalk.dim(`(based on ${report.pillarsImplemented}/${report.pillarsTotal} pillars)`)
        )
      : chalk.bold('OVERALL HEALTH: N/A (no pillars implemented yet)')
  );

  for (const pillar of report.pillars) {
    if (!pillar.implemented) continue;
    lines.push('');
    lines.push(chalk.bold.underline(`${pillar.name.toUpperCase()} DETAILS`));

    if (pillar.score === null) {
      lines.push(chalk.dim((pillar.notes ?? []).join(' ')));
      continue;
    }

    for (const [key, value] of Object.entries(pillar.summary)) {
      lines.push(`  ${formatSummaryKey(key)}: ${value}`);
    }

    if (pillar.findings.length > 0) {
      lines.push('');
      lines.push(chalk.dim(`Top issues (showing ${Math.min(maxIssues, pillar.findings.length)} of ${pillar.findings.length}):`));
      for (const finding of pillar.findings.slice(0, maxIssues)) {
        lines.push(formatFindingLine(finding));
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

function formatPillarScoreLine(pillar: PillarResult): string {
  const label = pillar.name.padEnd(28);
  if (!pillar.implemented) {
    return `  ${label} ${chalk.dim('n/a     Coming soon')}`;
  }
  if (pillar.score === null) {
    return `  ${label} ${chalk.dim('n/a     No data')}`;
  }
  return `  ${label} ${scoreColor(pillar.score)(`${String(pillar.score).padStart(3)}/100`)}  ${renderBar(pillar.score)}`;
}

function renderBar(score: number, width = 10): string {
  const filled = Math.round((score / 100) * width);
  return scoreColor(score)('▓'.repeat(filled)) + chalk.dim('░'.repeat(width - filled));
}

function scoreColor(score: number) {
  if (score >= 80) return chalk.green;
  if (score >= 50) return chalk.yellow;
  return chalk.red;
}

function formatFindingLine(finding: Finding): string {
  const location = `${finding.file}:${finding.line}`;
  return `  ${chalk.dim(location.padEnd(40))} ${severityBadge(finding.severity)} ${finding.message}`;
}

function severityBadge(severity: Finding['severity']): string {
  if (severity === 'high') return chalk.red('[high]  ');
  if (severity === 'medium') return chalk.yellow('[medium]');
  return chalk.dim('[low]   ');
}

function formatSummaryKey(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}
