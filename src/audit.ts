import path from 'node:path';
import { auditAccessibility } from './pillars/accessibility.js';
import { auditComponentApi } from './pillars/componentApi.js';
import { auditDocumentation } from './pillars/documentation.js';
import { auditTokens } from './pillars/tokenAudit.js';
import { buildReport } from './report.js';
import type { AuditReport } from './types.js';
import { findFiles, scanFiles } from './utils/scanFiles.js';

const TOKEN_DEFINITION_PATTERNS = [
  '**/tokens.{json,js,ts,yaml,yml}',
  '**/design-tokens.{json,js,ts,yaml,yml}',
  '**/theme.{json,js,ts}',
  '**/tailwind.config.{js,ts,cjs,mjs}',
  '**/tokens/**/*.{json,js,ts}',
];

export interface RunAuditOptions {
  ignore?: string[];
  pxThreshold?: number;
}

export async function runAudit(targetDir: string, options: RunAuditOptions = {}): Promise<AuditReport> {
  const resolvedTarget = path.resolve(targetDir);
  const files = await scanFiles(resolvedTarget, { ignore: options.ignore });
  const tokenDefinitionFiles = await findFiles(resolvedTarget, TOKEN_DEFINITION_PATTERNS, options.ignore);

  const pillars = [
    auditTokens(files, { pxThreshold: options.pxThreshold, tokenDefinitionFiles }),
    auditComponentApi(files),
    auditAccessibility(files),
    auditDocumentation(files),
  ];

  const displayTarget = path.relative(process.cwd(), resolvedTarget) || '.';
  return buildReport(displayTarget, files.length, pillars);
}
