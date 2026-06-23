import type { Finding, PillarResult, ScannedFile, Severity } from '../types.js';

const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
const FUNCTIONAL_COLOR_RE = /\b(?:rgb|rgba|hsl|hsla)\(\s*\d/g;
const CUSTOM_PROPERTY_USAGE_RE = /var\(\s*--[\w-]+/g;
const CUSTOM_PROPERTY_DEFINITION_LINE_RE = /^\s*--[\w-]+\s*:/;
const PX_VALUE_RE = /(-?\d+(?:\.\d+)?)px/g;

const SPACING_PROPERTIES = [
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'margin',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'padding',
  'gap', 'row-gap', 'column-gap',
  'top', 'right', 'bottom', 'left',
  'max-width', 'max-height', 'min-width', 'min-height', 'width', 'height',
  'font-size', 'line-height', 'letter-spacing', 'border-radius',
];

const LOW_SEVERITY_PROPERTIES = new Set(['border-radius', 'letter-spacing']);

const SPACING_PROPERTY_RE = new RegExp(
  `(?<prop>${SPACING_PROPERTIES.join('|')})\\s*:\\s*(?<value>[^;]+);?`,
  'gi'
);

const STYLE_FILE_RE = /\.(css|scss|sass|less)$/i;
const STYLE_BEARING_FILE_RE = /\.(css|scss|sass|less|ts|tsx|js|jsx|vue|svelte)$/i;
const TAGGED_TEMPLATE_RE = /\b(?:styled(?:\.[\w$]+|\([^)]*\))|css|createGlobalStyle|keyframes)\s*`([^`]*)`/g;

interface Snippet {
  text: string;
  startLine: number;
}

export interface TokenAuditOptions {
  pxThreshold?: number;
  tokenDefinitionFiles?: string[];
}

export function auditTokens(files: ScannedFile[], options: TokenAuditOptions = {}): PillarResult {
  const pxThreshold = options.pxThreshold ?? 1;
  const tokenDefinitionFiles = options.tokenDefinitionFiles ?? [];
  const findings: Finding[] = [];

  let tokenUsageCount = 0;
  let tokenDefinitionCount = 0;
  let styleFilesScanned = 0;

  for (const file of files) {
    if (!STYLE_BEARING_FILE_RE.test(file.path)) continue;
    styleFilesScanned += 1;

    for (const snippet of extractStyleSnippets(file)) {
      const lines = snippet.text.split('\n');
      lines.forEach((lineText, idx) => {
        const lineNumber = snippet.startLine + idx;

        tokenUsageCount += countMatches(lineText, CUSTOM_PROPERTY_USAGE_RE);

        if (CUSTOM_PROPERTY_DEFINITION_LINE_RE.test(lineText)) {
          tokenDefinitionCount += 1;
          return;
        }

        for (const match of lineText.matchAll(HEX_COLOR_RE)) {
          findings.push(colorFinding(file.path, lineNumber, match[0]));
        }
        for (const match of lineText.matchAll(FUNCTIONAL_COLOR_RE)) {
          findings.push(colorFinding(file.path, lineNumber, match[0]));
        }

        for (const match of lineText.matchAll(SPACING_PROPERTY_RE)) {
          const prop = match.groups?.prop?.toLowerCase() ?? '';
          const value = match.groups?.value ?? '';
          if (value.includes('var(')) continue;

          for (const pxMatch of value.matchAll(PX_VALUE_RE)) {
            const magnitude = Math.abs(parseFloat(pxMatch[1]));
            if (magnitude <= pxThreshold) continue;
            findings.push(spacingFinding(file.path, lineNumber, prop, `${pxMatch[1]}px`));
          }
        }
      });
    }
  }

  if (styleFilesScanned === 0) {
    return {
      id: 'tokens',
      name: 'Token Architecture',
      implemented: true,
      score: null,
      summary: { styleFilesScanned: 0 },
      findings: [],
      notes: ['No stylesheet, styled-components/emotion, or recognizable style content found to audit.'],
    };
  }

  const colorFindings = findings.filter((f) => f.ruleId === 'hardcoded-color');
  const spacingFindings = findings.filter((f) => f.ruleId === 'hardcoded-spacing');
  const weightedHardcoded = colorFindings.length * 1.5 + spacingFindings.length;
  const denominator = tokenUsageCount + weightedHardcoded;
  const adoptionRatio = denominator === 0 ? 1 : tokenUsageCount / denominator;
  const bonus = tokenDefinitionFiles.length > 0 ? 5 : 0;
  const score = Math.max(0, Math.min(100, Math.round(adoptionRatio * 100 + bonus)));

  return {
    id: 'tokens',
    name: 'Token Architecture',
    implemented: true,
    score,
    summary: {
      styleFilesScanned,
      tokenUsageCount,
      tokenDefinitionCount,
      hardcodedColorCount: colorFindings.length,
      hardcodedSpacingCount: spacingFindings.length,
      hasTokenDefinitionFile: tokenDefinitionFiles.length > 0,
      tokenDefinitionFile: tokenDefinitionFiles[0] ?? null,
    },
    findings: findings.sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity)),
  };
}

function extractStyleSnippets(file: ScannedFile): Snippet[] {
  if (STYLE_FILE_RE.test(file.path)) {
    return [{ text: file.content, startLine: 1 }];
  }
  const snippets: Snippet[] = [];
  for (const match of file.content.matchAll(TAGGED_TEMPLATE_RE)) {
    const offset = match.index ?? 0;
    snippets.push({
      text: match[1] ?? '',
      startLine: file.content.slice(0, offset).split('\n').length,
    });
  }
  return snippets;
}

function colorFinding(file: string, line: number, value: string): Finding {
  return {
    file,
    line,
    ruleId: 'hardcoded-color',
    severity: 'high',
    value,
    message: `Hardcoded color "${value}" — consider referencing a design token instead.`,
    suggestion: 'Replace with var(--color-*) or your token equivalent.',
  };
}

function spacingFinding(file: string, line: number, prop: string, value: string): Finding {
  const severity: Severity = LOW_SEVERITY_PROPERTIES.has(prop) ? 'low' : 'medium';
  return {
    file,
    line,
    ruleId: 'hardcoded-spacing',
    severity,
    value,
    message: `Hardcoded value "${value}" for "${prop}" — consider a spacing/sizing token.`,
    suggestion: 'Replace with var(--space-*) or your token equivalent.',
  };
}

function countMatches(text: string, re: RegExp): number {
  return [...text.matchAll(re)].length;
}

function severityWeight(s: Severity): number {
  return s === 'high' ? 3 : s === 'medium' ? 2 : 1;
}
