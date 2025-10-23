import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'fs';
import path from 'path';

export interface CompareOptions {
  threshold?: number;
  includeAA?: boolean;
  alpha?: number;
  diffColor?: [number, number, number]; // RGB tuple format
  diffMask?: boolean;
}

export async function compareScreenshots(
  actualScreenshotPath: string,
  baselineScreenshotPath: string,
  diffOutputPath: string,
  options: CompareOptions = {}
): Promise<number> {
  // Create directories if they don't exist
  const diffDir = path.dirname(diffOutputPath);
  if (!fs.existsSync(diffDir)) {
    fs.mkdirSync(diffDir, { recursive: true });
  }

  // Check if baseline exists, if not, copy actual to baseline
  if (!fs.existsSync(baselineScreenshotPath)) {
    const baselineDir = path.dirname(baselineScreenshotPath);
    if (!fs.existsSync(baselineDir)) {
      fs.mkdirSync(baselineDir, { recursive: true });
    }
    fs.copyFileSync(actualScreenshotPath, baselineScreenshotPath);
    return 0; // No differences since we just created the baseline
  }

  // Read images
  const actual = PNG.sync.read(fs.readFileSync(actualScreenshotPath));
  const baseline = PNG.sync.read(fs.readFileSync(baselineScreenshotPath));
  const { width, height } = actual;

  // Check dimensions
  if (baseline.width !== width || baseline.height !== height) {
    throw new Error(`Image dimensions do not match: 
      Actual: ${width}x${height}, 
      Baseline: ${baseline.width}x${baseline.height}`);
  }

  // Create diff image
  const diff = new PNG({ width, height });

  // Compare images
  const numDiffPixels = pixelmatch(actual.data, baseline.data, diff.data, width, height, {
    threshold: options.threshold || 0.1,
    includeAA: options.includeAA || false,
    alpha: options.alpha || 0.1,
    diffColor: options.diffColor || [255, 0, 0], // RGB tuple format
    diffMask: options.diffMask || false,
  });

  // Write diff image
  fs.writeFileSync(diffOutputPath, PNG.sync.write(diff));
  return numDiffPixels;
}
