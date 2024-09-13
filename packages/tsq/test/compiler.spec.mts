import compile, { previewCompilation } from '../src/compiler.mjs';
import { TsConfigJson } from 'type-fest';
import { describe, test, expect, afterAll } from 'vitest';
import { mkdirSync, mkdtempSync, rmdirSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { globSync } from 'fast-glob';

describe('compiler', () => {

  let cleanup: Set<string> = new Set();

  test('compile uses provided tsconfigPath', () => {
    const tmpPath = mkdtempSync('tsq-vitest-');
    cleanup.add(tmpPath);
    const options: TsConfigJson = {
      compilerOptions: {
        outDir: join(tmpPath, 'dist'),
        target: 'ESNext',
        module:'NodeNext',
        moduleResolution: 'NodeNext',
        declaration: true,
        declarationDir: join(tmpPath, 'types')
      },
      include: ['src/**/*.mts']
    };
    const prepared = prepareDir(tmpPath, options);

    const result = compile({
      tsconfigPath: prepared.tsconfigPath
    })
    expect(resolve(result.rootDir)).to.equal(resolve(tmpPath));
    expect(resolve(result.tsconfigPath)).to.equal(resolve(prepared.tsconfigPath));
    expect(result.emittedFiles.size).to.equal(1);
    const types = globSync(join(tmpPath, 'types/**/*.d.mts'));
    expect(types.length).to.equal(1);
    expect(types[0]).to.satisfy((f: string) => f.endsWith('index.d.mts'));

    const dist = globSync(join(tmpPath, 'dist/**/*.mjs'));
    expect(dist.length).to.equal(1);
    expect(dist[0]).to.satisfy((f: string) => f.endsWith('index.mjs'));
  });

  test('compile throws when no tsconfig found.', () => {

    expect(() => previewCompilation({
      tsconfigPath: 'not-existing.tsconfig.json'
    })).to.throw("Could not find a valid 'tsconfig.json'.");
  });

  test('compile falls back to default tsconfig resolution when no tsconfig specified.', () => {

    const r = previewCompilation({});
    expect(resolve(join(process.cwd(), r.tsconfigPath))).to.equal(resolve(import.meta.dirname, '../tsconfig.json'));
  });

  test('compile falls back to default tsconfig resolution when no tsconfig specified.', () => {

    const tmpPath = mkdtempSync('tsq-vitest-');
    cleanup.add(tmpPath);
    const options: TsConfigJson = {
      compilerOptions: {
        outDir: join(tmpPath, 'dist'),
        target: 'ESNext',
        module:'NodeNext',
        moduleResolution: 'NodeNext',
        declaration: true,
        declarationDir: join(tmpPath, 'types')
      },
    };
    const prepared = prepareDir(tmpPath, options);

    const result = previewCompilation({
      tsconfigPath: prepared.tsconfigPath
    });
    expect(result.includedFiles.length).to.equal(1);
  });

  afterAll(() => {
    Array.from(cleanup).forEach((dir) => {
      rmdirSync(dir, { recursive: true });
    });
  });
});

type PreparedDir = {
  tsconfigPath: string,
  srcDir: string,
}
const prepareDir = (dir: string, tsConfig: TsConfigJson): PreparedDir => {
  const tsconfigPath = join(dir, 'tsconfig.json');
  const srcDir = join(dir, 'src');
  writeFileSync(tsconfigPath, JSON.stringify(tsConfig));
  mkdirSync(srcDir);
  const indexPath = join(srcDir, 'index.mts');
  writeFileSync(indexPath, `console.log('hello world');`);

  return  {
    tsconfigPath: tsconfigPath,
    srcDir: srcDir
  }
}