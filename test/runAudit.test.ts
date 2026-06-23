import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runAudit } from '../src/audit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(__dirname, 'fixtures', 'sample-project');

describe('runAudit (integration)', () => {
  it('scans the fixture project end-to-end with only the tokens pillar implemented', async () => {
    const report = await runAudit(fixtureDir);

    expect(report.pillars).toHaveLength(4);
    expect(report.filesScanned).toBeGreaterThan(0);

    const tokens = report.pillars.find((p) => p.id === 'tokens');
    expect(tokens?.implemented).toBe(true);
    expect(typeof tokens?.score).toBe('number');
    expect(tokens?.summary.hasTokenDefinitionFile).toBe(true);

    for (const pillar of report.pillars.filter((p) => p.id !== 'tokens')) {
      expect(pillar.implemented).toBe(false);
      expect(pillar.score).toBeNull();
    }

    expect(typeof report.overallScore).toBe('number');
  });

  it('respects additional --ignore patterns', async () => {
    const withVendor = await runAudit(fixtureDir);
    const withoutVendor = await runAudit(fixtureDir, { ignore: ['**/vendor/**'] });

    const vendorFindingsBefore = withVendor.pillars
      .find((p) => p.id === 'tokens')
      ?.findings.filter((f) => f.file.includes('vendor'));
    const vendorFindingsAfter = withoutVendor.pillars
      .find((p) => p.id === 'tokens')
      ?.findings.filter((f) => f.file.includes('vendor'));

    expect(vendorFindingsBefore?.length).toBeGreaterThan(0);
    expect(vendorFindingsAfter?.length).toBe(0);
  });
});
