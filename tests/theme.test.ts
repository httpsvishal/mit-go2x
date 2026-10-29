import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { go2xTheme } from '../theme/go2x.theme';

describe('Theme Conformance Tests', () => {
  it('enforces single source of truth: exports theme tokens with Go2X logo colors (#ff6f00 and black)', () => {
    expect(go2xTheme.light.bg).toBe('#ffffff');
    expect(go2xTheme.dark.bg).toBe('#000000');
    expect(go2xTheme.light.accent).toBe('#ff6f00');
    expect(go2xTheme.dark.accent).toBe('#ff6f00');
    expect(go2xTheme.chartCategorical.length).toBe(8);
    expect(go2xTheme.chartCategorical[0]).toBe('#ff6f00');

    // Verify tokens.css exists and defines variables
    const tokensCss = fs.readFileSync(path.join(process.cwd(), 'theme/tokens.css'), 'utf-8');
    expect(tokensCss).toContain('--go2x-bg');
    expect(tokensCss).toContain('--go2x-surface');
    expect(tokensCss).toContain('--go2x-accent: #ff6f00');
    expect(tokensCss).toContain('.dark');
  });

  it('verifies status colors adhere to contract', () => {
    expect(go2xTheme.status.light.ok).toBe('#16a34a');
    expect(go2xTheme.status.light.warn).toBe('#ff6f00');
    expect(go2xTheme.status.light.bad).toBe('#dc2626');
    expect(go2xTheme.status.light.neutral).toBe('#64748b');
  });

  it('asserts no arbitrary hardcoded hex colors exist outside /theme (except standard fixed status colors and white/black)', () => {
    const allowedHex = new Set([
      '#ff6f00',
      '#16a34a',
      '#f59e0b',
      '#dc2626',
      '#64748b',
      '#ffffff',
      '#fff',
      '#000000',
      '#000',
    ]);

    const dirsToCheck = ['app', 'components', 'plugins', 'core'];
    const hexRegex = /#[0-9a-fA-F]{3,6}\b/g;

    function checkDir(dirPath: string) {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const matches = content.match(hexRegex) || [];
          for (const match of matches) {
            const lower = match.toLowerCase();
            expect(
              allowedHex.has(lower),
              `Found unexpected hardcoded hex color ${match} in ${fullPath}. Brand colors must reside in /theme.`
            ).toBe(true);
          }
        }
      }
    }

    for (const d of dirsToCheck) {
      const full = path.join(process.cwd(), d);
      if (fs.existsSync(full)) {
        checkDir(full);
      }
    }
  });
});
