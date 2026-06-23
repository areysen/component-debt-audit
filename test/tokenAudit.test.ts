import { describe, expect, it } from 'vitest';
import { auditTokens } from '../src/pillars/tokenAudit.js';
import type { ScannedFile } from '../src/types.js';

function file(filePath: string, content: string): ScannedFile {
  return { path: filePath, content };
}

describe('auditTokens', () => {
  it('flags hardcoded hex colors outside custom property definitions', () => {
    const result = auditTokens([file('button.css', '.button {\n  color: #fff;\n}\n')]);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].ruleId).toBe('hardcoded-color');
    expect(result.findings[0].value).toBe('#fff');
  });

  it('does not flag literal values inside custom property definitions', () => {
    const result = auditTokens([
      file('tokens.css', ':root {\n  --color-primary: #3366ff;\n  --space-md: 16px;\n}\n'),
    ]);
    expect(result.findings).toHaveLength(0);
    expect(result.summary.tokenDefinitionCount).toBe(2);
  });

  it('flags hardcoded px spacing above the threshold and ignores values at/below it', () => {
    const result = auditTokens([file('card.css', '.card {\n  padding: 16px;\n  border: 1px solid #000;\n}\n')], {
      pxThreshold: 1,
    });
    const spacing = result.findings.filter((f) => f.ruleId === 'hardcoded-spacing');
    expect(spacing).toHaveLength(1);
    expect(spacing[0].value).toBe('16px');
  });

  it('reports the full functional color expression, not a truncated prefix', () => {
    const result = auditTokens([file('a.css', '.a {\n  color: rgb(255, 0, 0);\n}\n')]);
    const color = result.findings.find((f) => f.ruleId === 'hardcoded-color');
    expect(color?.value).toBe('rgb(255, 0, 0)');
    expect(color?.message).toContain('rgb(255, 0, 0)');
  });

  it('does not flag functional colors routed through a token', () => {
    const result = auditTokens([file('a.css', '.a {\n  color: rgb(var(--accent-rgb));\n}\n')]);
    expect(result.findings.filter((f) => f.ruleId === 'hardcoded-color')).toHaveLength(0);
  });

  it('does not mislabel scroll-margin as the margin property', () => {
    const result = auditTokens([file('a.css', '.a {\n  scroll-margin: 24px;\n}\n')]);
    const mislabeled = result.findings.find(
      (f) => f.ruleId === 'hardcoded-spacing' && f.message.includes('"margin"')
    );
    expect(mislabeled).toBeUndefined();
  });

  it('still flags a genuine margin property', () => {
    const result = auditTokens([file('a.css', '.a {\n  margin: 24px;\n}\n')]);
    const spacing = result.findings.find((f) => f.ruleId === 'hardcoded-spacing');
    expect(spacing?.message).toContain('"margin"');
  });

  it('does not flag px values that reference var()', () => {
    const result = auditTokens([file('card.css', '.card {\n  padding: var(--space-md);\n}\n')]);
    expect(result.findings).toHaveLength(0);
  });

  it('extracts styled-components template literals from tsx files', () => {
    const content = [
      "import styled from 'styled-components';",
      'export const Badge = styled.span`',
      '  background: #ff0000;',
      '  padding: 8px;',
      '`;',
    ].join('\n');

    const result = auditTokens([file('Badge.tsx', content)]);
    expect(result.findings.some((f) => f.ruleId === 'hardcoded-color' && f.value === '#ff0000')).toBe(true);
    expect(result.findings.some((f) => f.ruleId === 'hardcoded-spacing')).toBe(true);
  });

  it('scores token-heavy code higher than hardcoded-heavy code', () => {
    const hardcoded = auditTokens([file('a.css', '.a { color: #111; padding: 20px; margin: 30px; }')]);
    const tokenized = auditTokens([file('b.css', '.b { color: var(--c-1); padding: var(--s-1); margin: var(--s-2); }')]);
    expect(tokenized.score).toBeGreaterThan(hardcoded.score ?? 0);
  });

  it('applies a bonus when a token definition file is detected', () => {
    const files = [file('a.css', '.a { color: #111; }')];
    const withoutFile = auditTokens(files);
    const withFile = auditTokens(files, { tokenDefinitionFiles: ['tokens.json'] });
    expect(withFile.score ?? 0).toBeGreaterThan(withoutFile.score ?? 0);
  });

  it('returns a null score with a note when no style-bearing files are present', () => {
    const result = auditTokens([file('README.md', '# hello')]);
    expect(result.score).toBeNull();
    expect(result.notes?.length).toBeGreaterThan(0);
  });
});
