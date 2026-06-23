#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAudit } from './audit.js';
import { formatConsoleReport } from './formatters/console.js';
import { formatJsonReport } from './formatters/json.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')) as { version: string };

interface CliOptions {
  json?: boolean;
  out?: string;
  maxIssues: string;
  minScore?: string;
  ignore: string[];
  pxThreshold: string;
}

const program = new Command();

program
  .name('component-debt')
  .description(
    'Audit a design system across token architecture, component API consistency, accessibility, and documentation coverage.'
  )
  .version(pkg.version)
  .argument('[target]', 'path to the component library / design system to audit', '.')
  .option('-j, --json', 'output the report as JSON')
  .option('-o, --out <file>', 'write the report to a file instead of stdout')
  .option('--max-issues <n>', 'max issues to display per pillar', '10')
  .option('--min-score <n>', 'exit with a non-zero status if the overall score is below this threshold')
  .option('--ignore <glob>', 'additional ignore glob pattern (repeatable)', collectIgnore, [] as string[])
  .option('--px-threshold <n>', 'ignore hardcoded px values at or below this magnitude', '1')
  .action(async (target: string, opts: CliOptions) => {
    const report = await runAudit(target, {
      ignore: opts.ignore,
      pxThreshold: Number(opts.pxThreshold),
    });

    const output = opts.json
      ? formatJsonReport(report)
      : formatConsoleReport(report, { maxIssues: Number(opts.maxIssues) });

    if (opts.out) {
      await writeFile(opts.out, output, 'utf8');
      console.log(chalk.dim(`Report written to ${opts.out}`));
    } else {
      console.log(output);
    }

    if (opts.minScore !== undefined) {
      const threshold = Number(opts.minScore);
      if (report.overallScore === null || report.overallScore < threshold) {
        console.error(
          chalk.red(`\nOverall score ${report.overallScore ?? 'N/A'} is below the minimum threshold of ${threshold}.`)
        );
        process.exitCode = 1;
      }
    }
  });

function collectIgnore(value: string, previous: string[]): string[] {
  return [...previous, value];
}

void program.parseAsync(process.argv);
